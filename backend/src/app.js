const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const express = require('express');
const http = require('http');
const cors = require('cors');
const morgan = require('morgan');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');

const { setupWebSocket } = require('./services/socket');
const logger = require('./utils/logger');
const userStore = require('./services/user-store');
const nginxTaskStore = require('./services/nginx-task-store');
const nginxManager = require('./services/nginx-manager');

// --- App Initialization ---
const app = express();
const server = http.createServer(app);

// --- Middleware ---
app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
app.use(express.json());
// ... (rest of the middleware)

// --- API Routes ---
app.use('/api/auth', require('./routes/auth'));
// ... (rest of the routes)
app.use('/api/nginx', require('./routes/nginx'));

// --- Swagger API Documentation ---
const swaggerDocument = YAML.load(path.join(__dirname, '../docs/openapi.yaml'));
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

const { errorHandler } = require('./utils/error-handler');
app.use(errorHandler);

// --- Server Startup ---
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

  if (tasks.length === 0) {
    logger.info(`No proxy found for ${apiDomain}. Starting self-configuration...`);
    try {
      const selfTask = await nginxTaskStore.addTask({
        domain: apiDomain,
        port: PORT,
        ssl: {
          enabled: true,
          email: letsEncryptEmail,
        },
        upstreams: [], // The default proxy will point to localhost
      });

      // We must wait for this to complete to ensure the API is accessible
      await nginxManager.applyNginxConfig(selfTask.id);
      logger.info('Self-configuration completed successfully.');

    } catch (error) {
      logger.error('Self-configuration failed:', error);
      // We don't want to crash the whole app if this fails
    }
  } else {
    logger.info(`Proxy for ${apiDomain} already exists. Skipping self-configuration.`);
  }
};


const startServer = async () => {
  try {
    logger.info('Initializing user store...');
    await userStore.init();
    logger.info('User store initialized.');

    // Self-configure the reverse proxy for the API itself
    await selfConfigureProxy();

    server.listen(PORT, () => {
      logger.info(`Server is running on port ${PORT}`);
      logger.info(`API is accessible at https://${process.env.API_DOMAIN}`);
      setupWebSocket(server);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

module.exports = app;
