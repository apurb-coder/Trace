import { redisClient, redisPub, redisSub } from '../config/redis.js';

// Central mapping to route incoming Redis Pub/Sub messages to room handlers
const roomCallbacks = new Map(); // Map<roomId, Set<Function>>

// Handle incoming messages on the global Redis Subscriber client
redisSub.on('message', (channel, message) => {
  try {
    if (channel.startsWith('room:')) {
      const roomId = channel.split(':')[1];
      const parsedMessage = JSON.parse(message);
      
      const callbacks = roomCallbacks.get(roomId);
      if (callbacks) {
        callbacks.forEach((cb) => cb(parsedMessage));
      }
    }
  } catch (error) {
    console.error('[Redis Service] Error processing subscription message:', error);
  }
});

/**
 * Gets the Redis key for a room snapshot.
 * @param {string} roomId 
 * @returns {string}
 */
const getSnapshotKey = (roomId) => `room:${roomId}:snapshot`;

/**
 * Gets the Redis channel name for a room.
 * @param {string} roomId 
 * @returns {string}
 */
const getRoomChannel = (roomId) => `room:${roomId}`;

/**
 * Fetches the consolidated whiteboard snapshot from Redis.
 * @param {string} roomId 
 * @returns {Promise<object|null>}
 */
export async function getRoomSnapshot(roomId) {
  try {
    const raw = await redisClient.get(getSnapshotKey(roomId));
    return raw ? JSON.parse(raw) : null;
  } catch (error) {
    console.error(`[Redis Service] Failed to get room snapshot for ${roomId}:`, error);
    return null;
  }
}

/**
 * Saves a consolidated whiteboard snapshot to Redis.
 * @param {string} roomId 
 * @param {object} snapshot 
 */
export async function saveRoomSnapshot(roomId, snapshot) {
  try {
    await redisClient.set(getSnapshotKey(roomId), JSON.stringify(snapshot));
  } catch (error) {
    console.error(`[Redis Service] Failed to save room snapshot for ${roomId}:`, error);
  }
}

/**
 * Merges a excalidraw-structured changeset (diff) into the existing snapshot stored in Redis.
 * This ensures the catch-up state is kept complete.
 * 
 * excalidraw diff structures:
 * {
 *   created: { [id]: record },
 *   updated: { [id]: [oldRecord, newRecord] or newRecord },
 *   deleted: { [id]: record }
 * }
 * 
 * We consolidate this into a master map of shapes/records: { [id]: record }
 * 
 * @param {string} roomId 
 * @param {object} diff 
 */
export async function patchRoomSnapshot(roomId, diff) {
  try {
    const key = getSnapshotKey(roomId);
    
    // Perform transaction using Redis pipeline/multi or standard get-and-set
    // For complex JSON operations on whiteboard states, a get-patch-set cycle is standard.
    const rawSnapshot = await redisClient.get(key);
    let snapshot = rawSnapshot ? JSON.parse(rawSnapshot) : { records: {} };
    
    if (!snapshot.records) {
      snapshot.records = {};
    }

    const { created, updated, deleted } = diff;

    // 1. Process creations: add records to snapshot
    if (created && typeof created === 'object') {
      Object.entries(created).forEach(([id, record]) => {
        snapshot.records[id] = record;
      });
    }

    // 2. Process updates: modify existing records in snapshot
    if (updated && typeof updated === 'object') {
      Object.entries(updated).forEach(([id, change]) => {
        // In excalidraw, updated changes can be [oldRecord, newRecord] or just the new properties
        if (Array.isArray(change)) {
          const [, newRecord] = change;
          snapshot.records[id] = { ...snapshot.records[id], ...newRecord };
        } else {
          snapshot.records[id] = { ...snapshot.records[id], ...change };
        }
      });
    }

    // 3. Process deletions: remove records from snapshot
    if (deleted && typeof deleted === 'object') {
      Object.keys(deleted).forEach((id) => {
        delete snapshot.records[id];
      });
    }

    // Save patched snapshot back to Redis
    await redisClient.set(key, JSON.stringify(snapshot));
  } catch (error) {
    console.error(`[Redis Service] Failed to patch room snapshot for ${roomId}:`, error);
  }
}

/**
 * Subscribes this server node instance to a room's Redis Pub/Sub events.
 * Dynamically binds subscriber listeners to route events to a specific callback.
 * 
 * @param {string} roomId 
 * @param {Function} callback 
 */
export async function subscribeToRoom(roomId, callback) {
  const channel = getRoomChannel(roomId);
  
  if (!roomCallbacks.has(roomId)) {
    roomCallbacks.set(roomId, new Set());
    
    try {
      // First local listener, initiate physical Redis subscription
      await redisSub.subscribe(channel);
      console.log(`[Redis Service] Dynamic Pub/Sub: Subscribed to channel: ${channel}`);
    } catch (error) {
      console.error(`[Redis Service] Failed to subscribe to channel ${channel}:`, error);
      roomCallbacks.delete(roomId);
      return;
    }
  }

  roomCallbacks.get(roomId).add(callback);
}

/**
 * Unsubscribes a callback or cleans up the entire channel subscription if no callbacks remain.
 * 
 * @param {string} roomId 
 * @param {Function} callback 
 */
export async function unsubscribeFromRoom(roomId, callback) {
  const callbacks = roomCallbacks.get(roomId);
  if (!callbacks) return;

  callbacks.delete(callback);

  if (callbacks.size === 0) {
    roomCallbacks.delete(roomId);
    const channel = getRoomChannel(roomId);
    try {
      await redisSub.unsubscribe(channel);
      console.log(`[Redis Service] Dynamic Pub/Sub: Unsubscribed from channel: ${channel}`);
    } catch (error) {
      console.error(`[Redis Service] Failed to unsubscribe from channel ${channel}:`, error);
    }
  }
}

/**
 * Publishes a canvas event (diff, presence, cursor) to the Redis cluster channel.
 * 
 * @param {string} roomId 
 * @param {object} eventPayload 
 */
export async function publishRoomEvent(roomId, eventPayload) {
  try {
    const channel = getRoomChannel(roomId);
    await redisPub.publish(channel, JSON.stringify(eventPayload));
  } catch (error) {
    console.error(`[Redis Service] Failed to publish event to room ${roomId}:`, error);
  }
}

/**
 * Deletes the room snapshot from Redis.
 * @param {string} roomId
 */
export async function deleteRoomSnapshot(roomId) {
  try {
    await redisClient.del(getSnapshotKey(roomId));
  } catch (error) {
    console.error(`[Redis Service] Failed to delete room snapshot for ${roomId}:`, error);
  }
}
