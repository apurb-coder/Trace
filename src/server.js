import http from 'http';
import dotenv from 'dotenv';
import app from './app.js';
import { initWebSocketServer } from './websocket/socketServer.js';
import { redisClient, redisPub, redisSub } from './config/redis.js';

dotenv.config();

const PORT = parseInt(process.env.PORT || '3000', 10);

// Create the HTTP server wrapping the Express app instance
const server = http.createServer(app);

// Attach and initialize the WebSocket layer to intercept upgrades
const wss = initWebSocketServer(server);

// Start listening for connections
server.listen(PORT, () => {
  console.log(`========================================================`);
  console.log(`🚀 Trace Whiteboard Backend running on Port: ${PORT}`);
  console.log(`🟢 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`========================================================`);
});

/**
 * Handle graceful server shutdown to prevent losing client states or leaving open connections.
 */
async function handleShutdown(signal) {
  console.log(`\n[Server] Received ${signal}. Initiating graceful shutdown...`);

  // 1. Close the HTTP and WebSocket servers (stops accepting new connections)
  server.close(() => {
    console.log('[Server] HTTP and REST API server closed.');
  });

  wss.close(() => {
    console.log('[Server] WebSocket connection manager closed.');
  });

  // 2. Shut down Redis clients cleanly
  try {
    console.log('[Server] Disconnecting Redis cluster connections...');
    
    // Use .quit() to allow pending Redis pipelines to finish executing before disconnecting
    await Promise.all([
      redisClient.quit().catch(() => {}),
      redisPub.quit().catch(() => {}),
      redisSub.quit().catch(() => {})
    ]);
    console.log('[Server] Redis connections terminated successfully.');
  } catch (err) {
    console.error('[Server Error] Exception encountered during Redis disconnection:', err);
  }

  // 3. Close remaining active sockets manually
  console.log('[Server] Shutting down active connections. Exiting process.');
  process.exit(0);
}

// Intercept system termination signals
process.on('SIGTERM', () => handleShutdown('SIGTERM'));
process.on('SIGINT', () => handleShutdown('SIGINT'));

// Capture unhandled promise rejections and exceptions
process.on('unhandledRejection', (reason, promise) => {
  console.error('[Critical Error] Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('[Critical Error] Uncaught Exception occurred:', error);
  // Force clean shutdown
  process.exit(1);
});
