import { createSocketManager, SocketManager } from '@/lib/socket-manager';
import { SocketState, SocketStatus } from '@/types/socket';
import { useCallback, useEffect, useRef, useState } from 'react';

interface UseSocketOptions {
  autoConnect?: boolean;
  reconnectOnMount?: boolean;
}

export const useSocket = (options: UseSocketOptions = {}) => {
  const { autoConnect = true, reconnectOnMount = true } = options;
  const [state, setState] = useState<SocketState>({
    isConnected: false,
    isConnecting: false,
    error: null,
    reconnectAttempts: 0,
  });
  const [status, setStatus] = useState<SocketStatus>('disconnected');
  const managerRef = useRef<SocketManager | null>(null);
  const isInitialized = useRef(false);

  const initializeSocket = useCallback(async () => {
    if (isInitialized.current && managerRef.current) {
      return managerRef.current;
    }

    try {
      const manager = createSocketManager({
        url: import.meta.env.VITE_BASE_API_URL,
        options: {
          transports: ['websocket', 'polling'],
          withCredentials: true,
        },
      });

      // Subscribe to state changes
      const unsubscribe = manager.on('stateChange', (newState: SocketState) => {
        setState(newState);
        setStatus(manager.getStatus());
      });

      managerRef.current = manager;
      isInitialized.current = true;

      // Store unsubscribe function for cleanup
      (manager as any)._unsubscribe = unsubscribe;

      return manager;
    } catch (error) {
      console.error('Failed to initialize socket:', error);
      throw error;
    }
  }, []);

  const connect = useCallback(async () => {
    try {
      const manager = await initializeSocket();
      await manager.connect();
    } catch (error) {
      console.error('Failed to connect socket:', error);
    }
  }, [initializeSocket]);

  const disconnect = useCallback(() => {
    if (managerRef.current) {
      managerRef.current.disconnect();
    }
  }, []);

  useEffect(() => {
    if (autoConnect) {
      connect();
    }

    return () => {
      if (!reconnectOnMount) {
        disconnect();
      }
    };
  }, [autoConnect, connect, disconnect, reconnectOnMount]);

  const getSocket = useCallback(() => {
    return managerRef.current?.getSocket() || null;
  }, []);

  const joinRoom = useCallback(async (room: string) => {
    const manager = managerRef.current;
    if (!manager) {
      throw new Error('Socket manager not initialized');
    }
    return manager.joinRoom(room);
  }, []);

  const leaveRoom = useCallback(async (room: string) => {
    const manager = managerRef.current;
    if (!manager) {
      throw new Error('Socket manager not initialized');
    }
    return manager.leaveRoom(room);
  }, []);

  return {
    socket: getSocket(),
    state,
    status,
    isConnected: state.isConnected,
    isConnecting: state.isConnecting,
    error: state.error,
    connect,
    disconnect,
    joinRoom,
    leaveRoom,
  };
};