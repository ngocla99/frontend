import { io, Socket } from 'socket.io-client';
import { SocketEvents, SocketState, SocketStatus } from '@/types/socket';

export class SocketManager {
  private socket: Socket<SocketEvents, SocketEvents> | null = null;
  private state: SocketState = {
    isConnected: false,
    isConnecting: false,
    error: null,
    reconnectAttempts: 0,
  };
  private listeners = new Map<string, Set<Function>>();
  private reconnectTimer: NodeJS.Timeout | null = null;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000; // Start with 1 second
  private maxReconnectDelay = 30000; // Max 30 seconds

  constructor(
    private config: {
      url: string;
      options?: any;
    }
  ) {}

  connect(): Promise<Socket<SocketEvents, SocketEvents>> {
    return new Promise((resolve, reject) => {
      if (this.socket?.connected) {
        resolve(this.socket);
        return;
      }

      this.state.isConnecting = true;
      this.state.error = null;
      this.notifyListeners('stateChange', this.state);

      try {
        this.socket = io(this.config.url, {
          transports: ['websocket', 'polling'],
          withCredentials: true,
          timeout: 10000,
          forceNew: true,
          ...this.config.options,
        });

        this.setupEventHandlers(resolve, reject);
      } catch (error) {
        this.handleError(error as Error);
        reject(error);
      }
    });
  }

  private setupEventHandlers(
    resolve: (socket: Socket<SocketEvents, SocketEvents>) => void,
    reject: (error: Error) => void
  ) {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      this.state.isConnected = true;
      this.state.isConnecting = false;
      this.state.error = null;
      this.state.reconnectAttempts = 0;
      this.reconnectDelay = 1000; // Reset delay
      this.notifyListeners('stateChange', this.state);
      this.notifyListeners('connect');
      resolve(this.socket!);
    });

    this.socket.on('disconnect', (reason) => {
      this.state.isConnected = false;
      this.state.isConnecting = false;
      this.notifyListeners('stateChange', this.state);
      this.notifyListeners('disconnect', reason);
      
      if (reason === 'io server disconnect') {
        // Server disconnected us, don't reconnect
        this.cleanup();
      } else {
        this.scheduleReconnect();
      }
    });

    this.socket.on('connect_error', (error) => {
      this.handleError(error);
      reject(error);
    });

    this.socket.on('error', (error) => {
      this.handleError(new Error(error.message || 'Socket error'));
    });

    // Forward all other events to listeners
    Object.keys(this.socket._callbacks).forEach(event => {
      if (!['connect', 'disconnect', 'connect_error', 'error'].includes(event)) {
        this.socket!.on(event as keyof SocketEvents, (...args: any[]) => {
          this.notifyListeners(event, ...args);
        });
      }
    });
  }

  private handleError(error: Error) {
    this.state.error = error.message;
    this.state.isConnecting = false;
    this.notifyListeners('stateChange', this.state);
    this.notifyListeners('error', error);
  }

  private scheduleReconnect() {
    if (this.state.reconnectAttempts >= this.maxReconnectAttempts) {
      this.state.error = 'Max reconnection attempts reached';
      this.notifyListeners('stateChange', this.state);
      return;
    }

    this.reconnectTimer = setTimeout(() => {
      this.state.reconnectAttempts++;
      this.state.isConnecting = true;
      this.notifyListeners('stateChange', this.state);
      
      this.connect().catch(() => {
        // Error handling is done in setupEventHandlers
      });
    }, this.reconnectDelay);

    // Exponential backoff with jitter
    this.reconnectDelay = Math.min(
      this.reconnectDelay * 2 + Math.random() * 1000,
      this.maxReconnectDelay
    );
  }

  private cleanup() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  disconnect() {
    this.cleanup();
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.state = {
      isConnected: false,
      isConnecting: false,
      error: null,
      reconnectAttempts: 0,
    };
    this.notifyListeners('stateChange', this.state);
  }

  // Event subscription system
  on(event: string, callback: Function) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);

    // Return unsubscribe function
    return () => {
      this.listeners.get(event)?.delete(callback);
    };
  }

  private notifyListeners(event: string, ...args: any[]) {
    this.listeners.get(event)?.forEach(callback => {
      try {
        callback(...args);
      } catch (error) {
        console.error(`Error in socket listener for ${event}:`, error);
      }
    });
  }

  // Room management
  joinRoom(room: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.socket?.connected) {
        reject(new Error('Socket not connected'));
        return;
      }

      this.socket.emit('join', { room }, (response: any) => {
        if (response?.error) {
          reject(new Error(response.error));
        } else {
          resolve();
        }
      });
    });
  }

  leaveRoom(room: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.socket?.connected) {
        reject(new Error('Socket not connected'));
        return;
      }

      this.socket.emit('leave', { room }, (response: any) => {
        if (response?.error) {
          reject(new Error(response.error));
        } else {
          resolve();
        }
      });
    });
  }

  getSocket() {
    return this.socket;
  }

  getState(): SocketState {
    return { ...this.state };
  }

  getStatus(): SocketStatus {
    if (this.state.error) return 'error';
    if (this.state.isConnecting) return 'connecting';
    if (this.state.isConnected) return 'connected';
    if (this.state.reconnectAttempts > 0) return 'reconnecting';
    return 'disconnected';
  }
}

// Singleton instance
let socketManagerInstance: SocketManager | null = null;

export const createSocketManager = (config: { url: string; options?: any }) => {
  if (socketManagerInstance) {
    socketManagerInstance.disconnect();
  }
  socketManagerInstance = new SocketManager(config);
  return socketManagerInstance;
};

export const getSocketManager = () => {
  if (!socketManagerInstance) {
    throw new Error('SocketManager not initialized. Call createSocketManager first.');
  }
  return socketManagerInstance;
};