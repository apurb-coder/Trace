import xss from 'xss';
import { getRoomSnapshot, patchRoomSnapshot, publishRoomEvent } from '../services/redisService.js';
import { roomManager } from '../services/roomManager.js';

// Generate a unique identifier for this application server node instance
const NODE_ID = `node_${Math.random().toString(36).substring(2, 9)}`;

// Limit WebSocket message payload size to 64KB to prevent buffer exhaust attacks
const MAX_PAYLOAD_SIZE = 65536;

/**
 * Main WebSocket message processing routing pipeline.
 * 
 * @param {import('ws').WebSocket} socket The client socket connection
 * @param {string} rawData Raw message buffer or string received from the client
 */
export async function handleIncomingMessage(socket, rawData) {
  try {
    // 1. Guardrail: Protect memory by rejecting oversized packets immediately
    if (rawData.length > MAX_PAYLOAD_SIZE) {
      console.warn(`[Security Alert] Client ${socket.userId || 'unknown'} sent oversized payload (${rawData.length} bytes). Terminating socket.`);
      socket.send(JSON.stringify({ error: 'Payload size limit exceeded' }));
      return socket.terminate();
    }

    // 2. Parse raw string data into a structured message object
    let parsed;
    try {
      parsed = JSON.parse(rawData);
    } catch {
      console.warn(`[Security Alert] Client ${socket.userId} sent malformed JSON.`);
      return socket.send(JSON.stringify({ error: 'Malformed JSON payload rejected' }));
    }

    const { type, payload } = parsed;
    const { roomId, socketId, userId } = socket;

    if (!type) {
      return socket.send(JSON.stringify({ error: 'Missing message type' }));
    }

    console.log(`[WS Receive] Client: ${userId} | Room: ${roomId} | Event: ${type}`);

    switch (type) {
      // client requests current full room snapshot (e.g. tldraw catch-up synchronization)
      case 'INITIALIZE_ROOM': {
        const snapshot = await getRoomSnapshot(roomId);
        socket.send(JSON.stringify({
          type: 'SNAPSHOT_INIT',
          payload: {
            roomId,
            records: snapshot ? snapshot.records : {},
          }
        }));
        break;
      }

      // Client pushes a fine-grained canvas changeset (records created, updated, or deleted)
      case 'STORE_DIFF': {
        if (!payload || !payload.diff) {
          return socket.send(JSON.stringify({ error: 'Invalid STORE_DIFF payload' }));
        }

        // Apply diff mutations asynchronously to update the persistent master snapshot in Redis cache
        await patchRoomSnapshot(roomId, payload.diff);

        // Broadcast changeset to all cluster nodes via Redis Pub/Sub
        await publishRoomEvent(roomId, {
          senderNodeId: NODE_ID,
          senderSocketId: socketId,
          type: 'STORE_DIFF',
          payload: {
            diff: payload.diff
          }
        });
        break;
      }

      // Client pushes transient cursor position or UI interaction (e.g. mouse coordinates)
      case 'PRESENCE': {
        if (!payload || !payload.presence) return;

        // Broadcast transient presence data instantly without persisting in Redis cache
        await publishRoomEvent(roomId, {
          senderNodeId: NODE_ID,
          senderSocketId: socketId,
          type: 'PRESENCE',
          payload: {
            userId,
            presence: payload.presence
          }
        });
        break;
      }

      // Optional features like live session chat
      case 'CHAT_MESSAGE': {
        if (!payload || !payload.text) return;

        // XSS Guardrail: Sanitize text inputs before broadcasting or storing
        const sanitizedText = xss(payload.text);

        await publishRoomEvent(roomId, {
          senderNodeId: NODE_ID,
          senderSocketId: socketId,
          type: 'CHAT_MESSAGE',
          payload: {
            userId,
            text: sanitizedText,
            timestamp: Date.now()
          }
        });
        break;
      }

      default:
        console.warn(`[WS Warn] Unrecognized message type: ${type}`);
        socket.send(JSON.stringify({ error: `Unsupported event type: ${type}` }));
    }
  } catch (error) {
    console.error('[WS Error] Error executing incoming message handler:', error);
    socket.send(JSON.stringify({ error: 'Internal server error processing event' }));
  }
}

/**
 * Handles messages received from the Redis Pub/Sub subscription cluster.
 * Routes them to local room clients, skipping the socket that originally published the event.
 * 
 * @param {string} roomId 
 * @param {object} eventPayload 
 */
export function handleClusterBroadcast(roomId, eventPayload) {
  const { senderSocketId, type, payload } = eventPayload;
  
  // Fetch only the clients connected locally to this specific server node instance
  const localClients = roomManager.getRoomClients(roomId);
  
  if (localClients.size === 0) return;

  const outgoingPayload = JSON.stringify({
    type,
    payload
  });

  localClients.forEach((socket) => {
    // Prevent loopback reflection: do not echo the message to the socket that sent it
    if (socket.socketId !== senderSocketId) {
      // Check if connection is still in OPEN state before transmitting
      if (socket.readyState === 1) { // 1 = WebSocket.OPEN
        socket.send(outgoingPayload);
      }
    }
  });
}
