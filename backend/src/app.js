const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const express = require('express');
const http = require('http');
const cors = require('cors');
const morgan = require('morgan');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');

const { setupWebSocket } = require('./services/socket');
const { logger } = require('./config/logger');
const userStore = require('./services/user-store');

// --- App Initialization ---
const app = express();
const server = http.createServer(app);

// --- Middleware ---
app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('combined', { stream: logger.stream }));

// Disable caching for all API responses
app.use((req, res, next) => {
  res.set('Cache-Control', 'no-store');
  next();
});

// --- API Routes ---
app.use('/api/auth', require('./routes/auth'));
app.use('/api/containers', require('./routes/containers'));
app.use('/api/images', require('./routes/images'));
app.use('/api/networks', require('./routes/networks'));
app.use('/api/volumes', require('./routes/volumes'));
app.use('/api/health', require('./routes/health'));
app.use('/api/user', require('./routes/user'));
app.use('/api/nginx', require('./routes/nginx'));

// --- Swagger API Documentation ---
const swaggerDocument = YAML.load(path.join(__dirname, '../docs/openapi.yaml'));
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// --- Error Handling ---
app.use((err, req, res, next) => {
  logger.error(`${err.status || 500} - ${err.message} - ${req.originalUrl} - ${req.method} - ${req.ip}`);
  res.status(err.status || 500).json({
    error: {
      message: err.message || 'Internal Server Error',
    },
  });
});

// --- Server Startup ---
const PORT = process.env.PORT || 3000;

const startServer = async () => {
  try {
    logger.info('Initializing user store...');
    await userStore.init();
    logger.info('User store initialized.');

    server.listen(PORT, () => {
      logger.info(`Server is running on port ${PORT}`);
      logger.info(`API documentation available at http://localhost:${PORT}/api-docs`);
      setupWebSocket(server);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

module.exports = app;