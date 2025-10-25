const Docker = require('dockerode');
const nginxTaskStore = require('./nginx-task-store');
const nginxConfigGenerator = require('./nginx-config-generator');
const certbotManager = require('./certbot-manager');
const logger = require('../utils/logger');
const fs = require('fs').promises;
const path = require('path');

const configDir = path.join(__dirname, '../../data/nginx/conf.d');
const NGINX_CONTAINER_NAME = 'nginx';

class NginxManager {
  constructor() {
    this.docker = new Docker();
    this.isProcessing = false;
    this.lastReloadTime = null;
  }

  async _findNginxContainer() {
    const containers = await this.docker.listContainers({ filters: { name: [NGINX_CONTAINER_NAME] } });
    if (containers.length === 0) throw new Error(`Nginx container '${NGINX_CONTAINER_NAME}' not found.`);
    return this.docker.getContainer(containers[0].Id);
  }

  async _execInNginx(command) {
    try {
      const container = await this._findNginxContainer();
      const exec = await container.exec({
        Cmd: command,
        AttachStdout: true,
        AttachStderr: true,
      });

      const stream = await exec.start({ hijack: true, stdin: true });

      return new Promise((resolve, reject) => {
        let output = '';
        let errorOutput = '';

        stream.on('data', chunk => {
            const data = chunk.toString('utf8');
            if (data.includes('[emerg]') || data.includes('invalid')) {
                errorOutput += data;
            } else {
                output += data;
            }
        });

        stream.on('end', () => {
           exec.inspect((err, data) => {
            if (err) return reject(err);
            if (data.ExitCode !== 0) {
              const errorMessage = errorOutput || output || `Command exited with code ${data.ExitCode}`;
              logger.error(`Nginx command '${command.join(' ')}' failed: ${errorMessage}`);
              return reject(new Error(errorMessage));
            }
            resolve(output);
          });
        });
      });
    } catch (error) {
      logger.error(`Failed to execute command in Nginx container: ${error.message}`);
      throw error;
    }
  }

  async reloadNginxContainer() {
    logger.info('Reloading Nginx container...');
    await this._execInNginx(['nginx', '-s', 'reload']);
    this.lastReloadTime = new Date().toISOString();
    logger.info('Nginx container reloaded successfully.');
  }

  async applyNginxConfig(taskId) {
    await nginxTaskStore.updateTask(taskId, { status: 'processing' });
    const task = await nginxTaskStore.getTask(taskId);

    try {
      if (task.ssl && task.ssl.enabled) {
        logger.info(`[SSL] Applying temporary config for ${task.domain}`);
        await nginxConfigGenerator.generateTemporaryConfigFile(task);
        await this.reloadNginxContainer();

        await new Promise(resolve => setTimeout(resolve, 5000)); // Increased delay

        logger.info(`[SSL] Requesting certificate for ${task.domain}`);
        await certbotManager.requestCertificate(task.domain, task.ssl.email);

        logger.info(`[SSL] Applying final HTTPS config for ${task.domain}`);
        const configPath = await nginxConfigGenerator.generateFinalConfigFile(task);
        await this._execInNginx(['nginx', '-t']);
        await this.reloadNginxContainer();

        await nginxTaskStore.updateTask(taskId, { status: 'completed', configPath });
        logger.info(`Successfully applied Nginx config for task ${taskId}`);

      } else {
        const configPath = await nginxConfigGenerator.generateFinalConfigFile(task);
        await this._execInNginx(['nginx', '-t']);
        await this.reloadNginxContainer();
        await nginxTaskStore.updateTask(taskId, { status: 'completed', configPath });
        logger.info(`Successfully applied Nginx config for task ${taskId}`);
      }
    } catch (error) {
      logger.error(`Failed to apply Nginx config for task ${taskId}: ${error.message}`);
      await nginxTaskStore.updateTask(taskId, { status: 'failed', error: error.message });
      const sanitizedDomain = nginxConfigGenerator._sanitize(task.domain);
      const configPath = path.join(configDir, `${sanitizedDomain}.conf`);
      await fs.unlink(configPath).catch(err => logger.warn(`Failed to rollback config file ${configPath}: ${err.message}`));
      throw error;
    }
  }

  async deleteNginxConfig(taskId) {
    const task = await nginxTaskStore.getTask(taskId);
    if (!task) throw new Error('Task not found');

    const sanitizedDomain = nginxConfigGenerator._sanitize(task.domain);
    const configPath = path.join(configDir, `${sanitizedDomain}.conf`);

    try {
      await fs.unlink(configPath);
      logger.info(`Deleted Nginx config file: ${configPath}`);
      await this.reloadNginxContainer();
      await nginxTaskStore.deleteTask(taskId);
      logger.info(`Successfully deleted Nginx config for task ${taskId}`);
    } catch (error) {
      if (error.code === 'ENOENT') {
        logger.warn(`Config file for task ${taskId} not found, deleting task anyway.`);
        await nginxTaskStore.deleteTask(taskId);
        return;
      }
      logger.error(`Failed to delete Nginx config for task ${taskId}: ${error.message}`);
      throw error;
    }
  }

  async processPendingTasks() {
    if (this.isProcessing) {
      logger.info('Already processing pending tasks.');
      return;
    }
    this.isProcessing = true;

    try {
      const { tasks } = await nginxTaskStore.getTasks({ status: 'pending' });
      logger.info(`Found ${tasks.length} pending Nginx tasks to process.`);

      for (const task of tasks) {
        try {
          await this.applyNginxConfig(task.id);
        } catch (error) {
          // Error is logged and status is updated within applyNginxConfig
        }
      }
    } catch (error) {
      logger.error(`Error processing pending tasks: ${error.message}`);
    } finally {
      this.isProcessing = false;
    }
  }
}

module.exports = new NginxManager();
