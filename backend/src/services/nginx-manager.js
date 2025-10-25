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
    const container = await this._findNginxContainer();
    const exec = await container.exec({
      Cmd: command,
      AttachStdout: true,
      AttachStderr: true,
    });
    // ... (rest of the exec implementation)
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
        // --- SSL Workflow ---
        // 1. Apply temporary config for challenge
        logger.info(`[SSL] Applying temporary config for ${task.domain}`);
        await nginxConfigGenerator.generateTemporaryConfigFile(task);
        await this.reloadNginxContainer();

        // Give Nginx a moment to reload
        await new Promise(resolve => setTimeout(resolve, 2000));

        // 2. Request certificate
        logger.info(`[SSL] Requesting certificate for ${task.domain}`);
        await certbotManager.requestCertificate(task.domain, task.ssl.email);

        // 3. Apply final HTTPS config
        logger.info(`[SSL] Applying final HTTPS config for ${task.domain}`);
        const configPath = await nginxConfigGenerator.generateFinalConfigFile(task);
        await this._execInNginx(['nginx', '-t']);
        await this.reloadNginxContainer();

        await nginxTaskStore.updateTask(taskId, { status: 'completed', configPath });
        logger.info(`Successfully applied Nginx config for task ${taskId}`);

      } else {
        // --- Non-SSL Workflow ---
        const configPath = await nginxConfigGenerator.generateFinalConfigFile(task);
        await this._execInNginx(['nginx', '-t']);
        await this.reloadNginxContainer();
        await nginxTaskStore.updateTask(taskId, { status: 'completed', configPath });
        logger.info(`Successfully applied Nginx config for task ${taskId}`);
      }
    } catch (error) {
      logger.error(`Failed to apply Nginx config for task ${taskId}: ${error.message}`);
      await nginxTaskStore.updateTask(taskId, { status: 'failed', error: error.message });
      // Rollback might involve deleting the config file
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

  // ... (processPendingTasks implementation)
}

module.exports = new NginxManager();
