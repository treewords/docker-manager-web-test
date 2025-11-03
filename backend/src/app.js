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
const sequelize = require('./config/database');
const userStore = require('./services/user-store');
const errorMiddleware = require('./middleware/errorMiddleware');

// --- App Initialization ---
const app = express();
const server = http.createServer(app);

// --- Middleware ---
// Trust the first proxy
app.set('trust proxy', 1);
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

// --- Swagger API Documentation ---
const swaggerDocument = YAML.load(path.join(__dirname, '../docs/openapi.yaml'));
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// --- Error Handling ---
app.use(errorMiddleware);

// --- Server Startup ---
const PORT = process.env.PORT || 3000;

const startServer = async () => {
  try {
    logger.info('Connecting to the database...');
    await sequelize.sync({ force: false }); // Use { force: true } to drop and re-create tables
    logger.info('Database connected.');

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