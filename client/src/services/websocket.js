import { useAuthStore } from '../store/useAuthStore';

class RoomWebSocket {
  constructor() {
    this.socket = null;
    this.listeners = new Map(); // Type -> Set of callbacks
    this.roomId = null;
    this.token = null;
    this.reconnectTimer = null;
    this.isClosedIntentionally = false;
  }

  connect(roomId) {
    this.disconnect();
    this.isClosedIntentionally = false;
    this.roomId = roomId;
    this.token = useAuthStore.getState().token || 'guest';

    const apiURL = import.meta.env.VITE_BACKEND_API_URL || 'http://localhost:3000';
    const wsURL = apiURL.replace(/^http/, 'ws');
    const url = `${wsURL}/connect/${roomId}?token=${encodeURIComponent(this.token)}`;

    this.socket = new WebSocket(url);

    this.socket.onopen = () => {
      console.log(`[WS] Connected to room ${roomId}`);
      this.send('INITIALIZE_ROOM', {});
    };

    this.socket.onmessage = (event) => {
      try {
        const { type, payload } = JSON.parse(event.data);
        const callbacks = this.listeners.get(type);
        if (callbacks) {
          callbacks.forEach((cb) => cb(payload));
        }
      } catch (err) {
        console.error('[WS Message Error]', err);
      }
    };

    this.socket.onclose = () => {
      console.log('[WS] Connection closed');
      if (!this.isClosedIntentionally) {
        // Auto reconnect after 3 seconds
        clearTimeout(this.reconnectTimer);
        this.reconnectTimer = setTimeout(() => this.connect(roomId), 3000);
      }
    };

    this.socket.onerror = (error) => {
      console.error('[WS Error]', error);
    };
  }

  send(type, payload) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify({ type, payload }));
    } else {
      console.warn(`[WS Warning] Cannot send message, socket not open: ${type}`);
    }
  }

  subscribe(type, callback) {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Set());
    }
    this.listeners.get(type).add(callback);
    return () => this.unsubscribe(type, callback);
  }

  unsubscribe(type, callback) {
    const callbacks = this.listeners.get(type);
    if (callbacks) {
      callbacks.delete(callback);
      if (callbacks.size === 0) {
        this.listeners.delete(type);
      }
    }
  }

  disconnect() {
    this.isClosedIntentionally = true;
    clearTimeout(this.reconnectTimer);
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
  }
}

export const roomWS = new RoomWebSocket();
export default roomWS;
