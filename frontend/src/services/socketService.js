import { io } from 'socket.io-client';

class SocketService {
  constructor() {
    this.socket = null;
    // Registry of persistent listeners: { event -> Set<callback> }
    // These are re-registered automatically on every (re)connect
    this._persistent = {};
  }

  connect(token) {
    // Already connected — nothing to do
    if (this.socket?.connected) return;

    // Socket exists but is disconnected (e.g. server restart, network blip).
    // Socket.IO will auto-reconnect it — don't create a second instance.
    if (this.socket) return;

    if (!token) {
      try {
        const u = localStorage.getItem('user');
        if (u) token = JSON.parse(u).token;
      } catch {}
      if (!token) token = localStorage.getItem('token');
    }

    if (!token) {
      console.error('❌ No se puede conectar Socket.IO sin token');
      return;
    }

    console.log('🔌 Conectando Socket.IO...');

    this.socket = io(process.env.REACT_APP_API_URL || 'http://localhost:5000', {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
    });

    this.socket.on('connect', () => {
      console.log('✅ Socket.IO conectado:', this.socket.id);
      // Re-register all persistent listeners after every (re)connect
      this._reattachPersistent();
    });

    this.socket.on('disconnect', (reason) => {
      console.log('❌ Socket.IO desconectado:', reason);
    });

    this.socket.on('error', (err) => {
      console.error('Socket.IO error:', err);
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this._persistent = {};
    }
  }

  // ── Persistent listener API ─────────────────────────────────────────────
  // Use this instead of socket.on() for notifications.
  // Callbacks survive reconnects automatically.

  addPersistentListener(event, callback) {
    if (!this._persistent[event]) this._persistent[event] = new Set();
    this._persistent[event].add(callback);
    // FIX: registrar en el socket apenas exista, sin importar si ya conectó.
    // socket.on() no requiere conexión activa — el handler simplemente espera
    // al evento. Antes solo se registraba si socket.connected === true, lo que
    // causaba que en sesión fresca el listener nunca se adjuntara porque el
    // evento 'connect' ya había disparado antes de que este método se llamara.
    if (this.socket) {
      this.socket.on(event, callback);
    }
  }

  removePersistentListener(event, callback) {
    this._persistent[event]?.delete(callback);
    this.socket?.off(event, callback);
  }

  _reattachPersistent() {
    for (const [event, callbacks] of Object.entries(this._persistent)) {
      for (const cb of callbacks) {
        // off first to avoid duplicates, then on
        this.socket.off(event, cb);
        this.socket.on(event, cb);
      }
    }
  }

  // ── Conversation helpers ──────────────────────────────────────────────────
  joinConversation(id_solicitud) {
    this.socket?.emit('join_conversation', id_solicitud);
  }

  leaveConversation(id_solicitud) {
    this.socket?.emit('leave_conversation', id_solicitud);
  }

  sendMessage(id_solicitud, contenido) {
    this.socket?.emit('send_message', { id_solicitud, contenido });
  }

  markAsRead(id_solicitud) {
    this.socket?.emit('mark_as_read', { id_solicitud });
  }

  typing(id_solicitud) {
    this.socket?.emit('typing', { id_solicitud });
  }

  stopTyping(id_solicitud) {
    this.socket?.emit('stop_typing', { id_solicitud });
  }

  // ── One-shot listeners (kept for chat compatibility) ──────────────────────
  onNewMessage(callback) {
    this.socket?.on('new_message', callback);
  }

  onMessagesRead(callback) {
    this.socket?.on('messages_read', callback);
  }

  onUserTyping(callback) {
    this.socket?.on('user_typing', callback);
  }

  onUserStopTyping(callback) {
    this.socket?.on('user_stop_typing', callback);
  }

  off(event) {
    this.socket?.off(event);
  }
}

const socketService = new SocketService();
export default socketService;