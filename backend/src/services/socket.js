const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const dockerService = require('./docker');
const { logger, logAction } = require('../config/logger');

let io;

/**
 * Returns the socket.io instance.
 * @returns {Server|null} The io instance or null if not initialized.
 */
function getIO() {
    return io;
}

/**
 * Sets up and initializes the WebSocket server.
 * @param {http.Server} server - The HTTP server to attach the WebSocket server to.
 */
function setupWebSocket(server) {
  io = new Server(server, {
    cors: {
      origin: process.env.CORS_ORIGIN || '*',
      methods: ['GET', 'POST'],
    },
  });

  // WebSocket Authentication Middleware
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error('Authentication error: No token provided.'));
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if (err) {
        return next(new Error('Authentication error: Invalid token.'));
      }
      socket.user = decoded.user;
      next();
    });
  });

  // Handle WebSocket Connections
  io.on('connection', (socket) => {
    logger.info(`WebSocket connected: ${socket.id} for user ${socket.user.username}`);
    logAction(socket.user, 'websocket_connect');

    // Join a room based on the user's ID to allow for targeted messaging
    socket.join(socket.user.id);

    let logStream = null;
    let execStream = null;


    socket.on('exec', async ({ containerId, command }) => {
      logger.info(`User ${socket.user.username} executing command in ${containerId}: ${command}`);
      logAction(socket.user, 'container_exec_start', { containerId, command });

      try {
        const { stream, exec } = await dockerService.executeCommand(containerId, command);
        execStream = stream; // Store the stream to be able to disconnect

        stream.on('data', (chunk) => {
          socket.emit('exec:data', chunk.toString('utf8'));
        });

        stream.on('end', () => {
          socket.emit('exec:end', 'Command execution finished.');
          logAction(socket.user, 'container_exec_end', { containerId, command });
        });

        socket.on('exec:data', (data) => {
            if (execStream) {
                execStream.write(data);
            }
        });

      } catch (error) {
        logger.error(`Error executing command in ${containerId}:`, error);
        logAction(socket.user, 'container_exec_failed', { containerId, command, error: error.message });
        socket.emit('exec:error', `Error executing command: ${error.message}`);
      }
    });

    // Listener for container log streaming requests
    socket.on('container:logs', async ({ containerId }) => {
      logger.info(`User ${socket.user.username} requested logs for container ${containerId}`);
      logAction(socket.user, 'container_logs_start', { containerId });

      // If already streaming, stop the old stream first
      if (logStream) {
        logStream.destroy();
        logStream = null;
      }

      try {
        logStream = await dockerService.streamLogs(containerId, (logChunk) => {
          socket.emit('log', logChunk);
        });

        // Handle stream ending or errors
        logStream.on('end', () => {
            socket.emit('log:end', 'Log stream finished.');
            logAction(socket.user, 'container_logs_end', { containerId });
        });

      } catch (error) {
        logger.error(`Error streaming logs for ${containerId}:`, error);
        logAction(socket.user, 'container_logs_failed', { containerId, error: error.message });
        socket.emit('log:error', `Error fetching logs for container ${containerId}.`);
      }
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      logger.info(`WebSocket disconnected: ${socket.id}`);
      logAction(socket.user, 'websocket_disconnect');
      // Clean up the log stream if it exists
      if (logStream) {
        logStream.destroy();
        logStream = null;
      }
      if (execStream) {
        execStream.destroy();
        execStream = null;
      }
    });
  });
}

module.exports = { setupWebSocket, getIO };