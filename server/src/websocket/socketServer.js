import { WebSocketServer } from 'ws';
import { authenticateWebSocket } from '../middleware/auth.js';
import { roomManager } from '../services/roomManager.js';
import { subscribeToRoom, unsubscribeFromRoom, flushRoomSnapshotToDb } from '../services/redisService.js';
import { handleIncomingMessage, handleClusterBroadcast } from './eventHandlers.js';
import { registerSocketHeartbeat, startHeartbeatMonitor } from './heartbeat.js';

/**
 * Initializes and binds the WebSocketServer to the HTTP server instance.
 * Handles manually intercepting upgrade handshakes, authentication, and routing path validations.
 * 
 * @param {import('http').Server} server The active HTTP node server
 * @returns {WebSocketServer}
 */
export function initWebSocketServer(server) {
  // Create a WebSocket Server decoupled from any physical port upgrade triggers
  const wss = new WebSocketServer({ noServer: true });

  // Start the background ping-pong validation loop (prunes dead sockets every 30s)
  const heartbeatInterval = startHeartbeatMonitor(wss);

  // Intercept the HTTP Upgrade handshake process
  server.on('upgrade', async (request, socket, head) => {
    try {
      const { pathname } = new URL(request.url, `http://${request.headers.host}`);
      
      // Match connection route pattern: /connect/:roomId (e.g. /connect/room-abc-123)
      const roomMatch = pathname.match(/^\/connect\/([^/]+)$/);
      
      if (!roomMatch) {
        console.warn(`[Upgrade Rejected] Invalid path handshake attempted: ${pathname}`);
        socket.write('HTTP/1.1 400 Bad Request\r\n\r\n');
        socket.destroy();
        return;
      }

      const roomId = roomMatch[1];

      // 1. Authenticate user credentials from handshake query token or authorization header
      const user = await authenticateWebSocket(request);
      if (!user) {
        socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
        socket.destroy();
        return;
      }

      // 2. Upgrade connection to WebSocket protocol
      wss.handleUpgrade(request, socket, head, (ws) => {
        // Embed parsed metadata variables on request before triggering connection handler
        request.roomId = roomId;
        request.user = user;
        wss.emit('connection', ws, request);
      });
    } catch (err) {
      console.error('[WebSocket Upgrade Exception]', err);
      socket.write('HTTP/1.1 500 Internal Server Error\r\n\r\n');
      socket.destroy();
    }
  });

  // Handle successful connection upgrade
  wss.on('connection', async (socket, request) => {
    const { roomId, user } = request;
    const socketId = `ws_${Math.random().toString(36).substring(2, 9)}`;

    // Attach connection metadata to socket instance for routing reference
    socket.socketId = socketId;
    socket.roomId = roomId;
    socket.userId = user.userId;
    socket.role = user.role;

    console.log(`[WS Connection] Socket ${socketId} (User: ${user.userId}) upgraded for Room: ${roomId}`);

    // Register socket connection inside local RoomManager Maps and Sets
    roomManager.addClient(roomId, socket);

    // Create a specific, bound callback for routing Redis Pub/Sub messages back to this socket
    const clusterCallback = (eventPayload) => {
      handleClusterBroadcast(roomId, eventPayload);
    };

    // Subscribes this server node instance to Redis cluster updates for the room channel
    await subscribeToRoom(roomId, clusterCallback);

    // Register Ping/Pong heartbeat check hooks on the socket
    registerSocketHeartbeat(socket);

    // Route incoming WebSocket message payloads to event handlers
    socket.on('message', async (message) => {
      await handleIncomingMessage(socket, message.toString());
    });

    // Cleanup routines on connection closure
    const cleanup = async () => {
      console.log(`[WS Disconnect] Socket ${socketId} disconnected from Room: ${roomId}`);
      
      // Remove connection from local map
      roomManager.removeClient(roomId, socket);
      
      // Unsubscribe from Redis pub/sub channel for this room callback
      await unsubscribeFromRoom(roomId, clusterCallback);

      // If no clients left in the room on this node, flush snapshot to database immediately
      if (!roomManager.isRoomActive(roomId)) {
        await flushRoomSnapshotToDb(roomId);
      }
      
      socket.removeAllListeners();
    };

    socket.on('close', cleanup);
    socket.on('error', (error) => {
      console.error(`[WS Socket Error] Socket ${socketId} encountered error:`, error);
      // 'close' event is standardly emitted after 'error', but clean just in case
    });
  });

  // Handle graceful cleanup during server shutdown
  wss.on('close', () => {
    console.log('[WebSocket Server] Server instance closing, clearing heartbeat intervals...');
    clearInterval(heartbeatInterval);
  });

  return wss;
}
