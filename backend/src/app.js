const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const express = require('express');
const http = require('http');
const cors = require('cors');
const morgan = require('morgan');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const fs = require('fs').promises;

const { setupWebSocket } = require('./services/socket');
const logger = require('./utils/logger');
const userStore = require('./services/user-store');
const nginxTaskStore = require('./services/nginx-task-store');
const nginxManager = require('./services/nginx-manager');

const app = express();
const server = http.createServer(app);

// ... (middleware and routes)

const PORT = process.env.PORT || 3000;

const selfConfigureProxy = async () => {
  const apiDomain = process.env.API_DOMAIN;
  const letsEncryptEmail = process.env.LETSENCRYPT_EMAIL;

  if (!apiDomain || !letsEncryptEmail) {
    logger.warn('API_DOMAIN or LETSENCRYPT_EMAIL not set. Skipping self-configuration.');
    return;
  }

  await nginxTaskStore.init();
  const { tasks } = await nginxTaskStore.getTasks({ domain: apiDomain });

  let task = tasks[0];
  let taskExists = !!task;

  if (!taskExists) {
    logger.info(`No proxy task found for ${apiDomain}. Creating a new one...`);
    task = await nginxTaskStore.addTask({
      domain: apiDomain,
      port: PORT,
      ssl: { enabled: true, email: letsEncryptEmail },
      upstreams: [],
    });
  }

  const certPath = `/etc/letsencrypt/live/${apiDomain}/fullchain.pem`;
  try {
    // We check for the certificate inside the container's volume
    await fs.access(path.join(__dirname, `../data/nginx/ssl/live/${apiDomain}/fullchain.pem`));
    logger.info(`Certificate for ${apiDomain} already exists. Skipping certificate request.`);
    // If the task was just created, we still need to apply the final config
    if (!taskExists) {
        await nginxManager.applyNginxConfig(task.id);
    }
  } catch (error) {
    logger.info(`Certificate for ${apiDomain} not found. Proceeding with SSL setup.`);
    try {
      await nginxManager.applyNginxConfig(task.id);
      logger.info('Self-configuration for SSL completed successfully.');
    } catch (sslError) {
      logger.error('Self-configuration for SSL failed:', sslError);
    }
  }
};

const startServer = async () => {
  try {
    logger.info('Initializing services...');
    await userStore.init();
    await selfConfigureProxy();

    server.listen(PORT, () => {
      logger.info(`Server is running on port ${PORT}`);
      logger.info(`API should be accessible at https://${process.env.API_DOMAIN}`);
      setupWebSocket(server);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

module.exports = app;
