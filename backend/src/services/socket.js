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
      origin: process.env.CORS_ORIGIN,
      methods: ['GET', 'POST'],
      credentials: true
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

    // Track all active streams for this socket (prevents memory leaks)
    const activeStreams = new Set();
    const streamTimeouts = new Map();

    // Helper function to clean up a stream
    const cleanupStream = (stream) => {
      if (stream && activeStreams.has(stream)) {
        try {
          stream.destroy();
        } catch (err) {
          logger.error('Error destroying stream:', err);
        }
        activeStreams.delete(stream);

        // Clear associated timeout
        const timeout = streamTimeouts.get(stream);
        if (timeout) {
          clearTimeout(timeout);
          streamTimeouts.delete(stream);
        }
      }
    };

    // Helper function to clean up all streams
    const cleanupAllStreams = () => {
      activeStreams.forEach(stream => {
        try {
          stream.destroy();
        } catch (err) {
          logger.error('Error destroying stream during cleanup:', err);
        }
      });
      activeStreams.clear();

      // Clear all timeouts
      streamTimeouts.forEach(timeout => clearTimeout(timeout));
      streamTimeouts.clear();
    };

    // DISABLED: Container exec functionality is disabled for security reasons
    // Arbitrary command execution in containers poses significant security risks
    // including container escape, privilege escalation, and system compromise
    socket.on('exec', async ({ containerId, command }) => {
      logger.warn(`User ${socket.user.username} attempted to execute command in ${containerId} (BLOCKED): ${command}`);
      logAction(socket.user, 'container_exec_blocked', { containerId, command });

      socket.emit('exec:error',
        'Container exec functionality has been disabled for security reasons. ' +
        'Please use docker exec directly on the host if you need to run commands in containers.'
      );
    });

    // Listener for container log streaming requests
    socket.on('container:logs', async ({ containerId }) => {
      logger.info(`User ${socket.user.username} requested logs for container ${containerId}`);
      logAction(socket.user, 'container_logs_start', { containerId });

      try {
        const stream = await dockerService.streamLogs(containerId, (logChunk) => {
          socket.emit('log', logChunk);
        });

        // Track this stream
        activeStreams.add(stream);

        // Set timeout for idle streams (5 minutes)
        const timeout = setTimeout(() => {
          logger.info(`Log stream for container ${containerId} timed out after 5 minutes`);
          cleanupStream(stream);
          socket.emit('log:end', 'Log stream timed out due to inactivity.');
        }, 5 * 60 * 1000);

        streamTimeouts.set(stream, timeout);

        // Handle stream ending or errors
        stream.on('end', () => {
          socket.emit('log:end', 'Log stream finished.');
          logAction(socket.user, 'container_logs_end', { containerId });
          cleanupStream(stream);
        });

        stream.on('error', (err) => {
          logger.error(`Log stream error for ${containerId}:`, err);
          cleanupStream(stream);
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

      // Clean up all active streams for this socket
      cleanupAllStreams();
    });
  });
}

module.exports = { setupWebSocket, getIO };