const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const express = require('express');
const http = require('http');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');

const { setupWebSocket } = require('./services/socket');
const { logger } = require('./config/logger');
const sequelize = require('./config/database');
const userStore = require('./services/user-store');
const errorMiddleware = require('./middleware/errorMiddleware');

// --- Security Validation at Startup ---
// Validate critical environment variables
const validateEnvironment = () => {
  const errors = [];

  // Validate JWT_SECRET
  if (!process.env.JWT_SECRET) {
    errors.push(
      'JWT_SECRET is not set. This is required for authentication security.',
    );
  } else if (process.env.JWT_SECRET.length < 32) {
    errors.push(
      'JWT_SECRET must be at least 32 characters long for adequate security.',
    );
  }

  // Validate ENCRYPTION_SECRET
  if (!process.env.ENCRYPTION_SECRET) {
    errors.push(
      'ENCRYPTION_SECRET is not set. This is required for encrypting sensitive data.',
    );
  } else if (process.env.ENCRYPTION_SECRET.length < 32) {
    errors.push(
      'ENCRYPTION_SECRET must be at least 32 characters long for adequate security.',
    );
  }

  // Validate CORS_ORIGIN
  if (!process.env.CORS_ORIGIN) {
    errors.push(
      'CORS_ORIGIN is not set. Wildcard CORS is a security risk and is not allowed.',
    );
  } else if (process.env.CORS_ORIGIN === '*') {
    errors.push(
      'CORS_ORIGIN cannot be set to wildcard (*). Please specify the exact origin of your frontend.',
    );
  }

  if (errors.length > 0) {
    logger.error('CRITICAL SECURITY CONFIGURATION ERRORS:');
    errors.forEach((err) => logger.error(`  - ${err}`));
    logger.error(
      '\nPlease fix these issues in your .env file before starting the server.',
    );
    logger.error('See .env.example for guidance on generating secure secrets.');
    process.exit(1);
  }

  logger.info('Environment security validation passed.');
};

// Run validation before app initialization
validateEnvironment();

// --- App Initialization ---
const app = express();
const server = http.createServer(app);

// --- Middleware ---
// Trust the first proxy (configure specific IPs in production)
app.set('trust proxy', 1);

// Security headers with helmet
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"], // Allow inline styles for React/Tailwind
        imgSrc: ["'self'", 'data:', 'https:'],
        connectSrc: ["'self'"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"],
      },
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
  }),
);

// CORS - strict origin checking (no wildcard allowed)
app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  }),
);

// Body parsing with size limits to prevent DoS
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
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
      logger.info(
        `API documentation available at http://localhost:${PORT}/api-docs`,
      );
      setupWebSocket(server);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

module.exports = app;
