const Docker = require('dockerode');
const nginxTaskStore = require('./nginx-task-store');
const nginxConfigGenerator = require('./nginx-config-generator');
const logger = require('../utils/logger');
const fs = require('fs').promises;
const path = require('path');

const configDir = path.join(__dirname, '../../data/nginx/conf.d');
const NGINX_CONTAINER_NAME = 'nginx'; // As defined in the future docker-compose.yml

class NginxManager {
  constructor() {
    this.docker = new Docker();
    this.isProcessing = false;
    this.lastReloadTime = null;
  }

  async _findNginxContainer() {
    const containers = await this.docker.listContainers({
      filters: { name: [NGINX_CONTAINER_NAME] }
    });
    if (containers.length === 0) {
      throw new Error(`Nginx container '${NGINX_CONTAINER_NAME}' not found.`);
    }
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
            // Dockerode streams multiplex stdout and stderr.
            // A simple heuristic is to check for common error patterns.
            const data = chunk.toString('utf8');
            if (data.includes('[emerg]') || data.includes('invalid')) {
                errorOutput += data;
            } else {
                output += data;
            }
        });

        exec.inspect((err, data) => {
            if (err) return reject(err);
            if (data.ExitCode !== 0) {
                const errorMessage = errorOutput || output || `Command exited with code ${data.ExitCode}`;
                logger.error(`Command '${command.join(' ')}' failed: ${errorMessage}`);
                return reject(new Error(errorMessage));
            }
            resolve(output);
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
      const configPath = await nginxConfigGenerator.generateConfigFile(task);

      // The validation happens inside the container which has the correct context
      await this._execInNginx(['nginx', '-t']);

      await this.reloadNginxContainer();

      await nginxTaskStore.updateTask(taskId, { status: 'completed', configPath });
      logger.info(`Successfully applied Nginx config for task ${taskId}`);
    } catch (error) {
      logger.error(`Failed to apply Nginx config for task ${taskId}: ${error.message}`);
      await nginxTaskStore.updateTask(taskId, { status: 'failed', error: error.message });
      // Rollback: delete the invalid config file
      const sanitizedDomain = task.domain.replace(/[^a-zA-Z0-9_.-]/g, '');
      const configPath = path.join(configDir, `${sanitizedDomain}.conf`);
      await fs.unlink(configPath).catch(err => logger.warn(`Failed to rollback config file ${configPath}: ${err.message}`));
      throw error;
    }
  }

  async deleteNginxConfig(taskId) {
    const task = await nginxTaskStore.getTask(taskId);
    if (!task) {
      throw new Error('Task not found');
    }

    const sanitizedDomain = task.domain.replace(/[^a-zA-Z0-9_.-]/g, '');
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
