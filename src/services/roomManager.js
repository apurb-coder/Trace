/**
 * RoomManager manages local WebSocket client connections in memory.
 * It uses native Map and Set collections to match sockets to specific collaborative rooms.
 */
class RoomManager {
  constructor() {
    // Map<roomId, Set<WebSocket>>
    this.rooms = new Map();
  }

  /**
   * Adds a socket connection to a room.
   * @param {string} roomId 
   * @param {import('ws').WebSocket} socket 
   */
  addClient(roomId, socket) {
    if (!this.rooms.has(roomId)) {
      this.rooms.set(roomId, new Set());
    }
    
    // Store reference to the room on the socket itself for rapid lookup in handlers
    socket.roomId = roomId;
    this.rooms.get(roomId).add(socket);
    
    console.log(`[RoomManager] Socket connected to local room: ${roomId}. Total clients in room: ${this.rooms.get(roomId).size}`);
  }

  /**
   * Removes a socket connection from a room.
   * Cleans up the room Set if it becomes empty to prevent memory leaks.
   * @param {string} roomId 
   * @param {import('ws').WebSocket} socket 
   */
  removeClient(roomId, socket) {
    const clients = this.rooms.get(roomId);
    if (clients) {
      clients.delete(socket);
      console.log(`[RoomManager] Socket disconnected from local room: ${roomId}. Remaining clients in room: ${clients.size}`);
      
      if (clients.size === 0) {
        this.rooms.delete(roomId);
        console.log(`[RoomManager] Room ${roomId} has no local clients. Pruned room mapping.`);
      }
    }
  }

  /**
   * Returns all local socket instances active in a given room.
   * @param {string} roomId 
   * @returns {Set<import('ws').WebSocket>}
   */
  getRoomClients(roomId) {
    return this.rooms.get(roomId) || new Set();
  }

  /**
   * Evaluates if a room currently exists on this server node.
   * @param {string} roomId 
   * @returns {boolean}
   */
  isRoomActive(roomId) {
    return this.rooms.has(roomId) && this.rooms.get(roomId).size > 0;
  }

  /**
   * Returns a list of all active room identifiers hosted on this node.
   * @returns {string[]}
   */
  getActiveRooms() {
    return Array.from(this.rooms.keys());
  }

  /**
   * Computes the total count of active connections across all rooms on this node.
   * @returns {number}
   */
  getTotalConnectionCount() {
    let count = 0;
    for (const clients of this.rooms.values()) {
      count += clients.size;
    }
    return count;
  }
}

// Export a singleton instance of the RoomManager
export const roomManager = new RoomManager();
