/**
 * Implements the WebSocket heartbeat mechanism to identify and terminate stale, half-open client connections.
 * 
 * Every 30 seconds, the server iterates through all active connections. If a client has failed to respond
 * with a 'pong' frame to the previous ping, it is forcibly terminated.
 */

const HEARTBEAT_INTERVAL = 30000; // 30 seconds

/**
 * Initializes heartbeat attributes and listeners on a newly established WebSocket client.
 * @param {import('ws').WebSocket} socket 
 */
export function registerSocketHeartbeat(socket) {
  // Flag tracking client responsiveness
  socket.isAlive = true;

  // Listen for client's pong frame response to update responsiveness flag
  socket.on('pong', () => {
    socket.isAlive = true;
  });
}

/**
 * Starts the central ping/pong heartbeat verification interval.
 * @param {import('ws').WebSocketServer} wss 
 * @returns {NodeJS.Timeout} The interval object to clear on shutdown
 */
export function startHeartbeatMonitor(wss) {
  const interval = setInterval(() => {
    console.log(`[Heartbeat] Checking responsiveness of ${wss.clients.size} active socket connection(s)...`);
    
    wss.clients.forEach((socket) => {
      // If client didn't respond to the last ping, terminate connection
      if (socket.isAlive === false) {
        console.warn(`[Heartbeat] Client ${socket.userId || 'unauthenticated'} failed to respond to ping. Terminating connection.`);
        return socket.terminate();
      }

      // Mark as unresponsive until a pong frame is received back
      socket.isAlive = false;
      
      // Send standard Ping frame
      socket.ping();
    });
  }, HEARTBEAT_INTERVAL);

  // Return the interval reference so it can be cleared on server shutdown
  return interval;
}
