import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { io, type Socket } from 'socket.io-client';
import { getSocketBaseUrl } from '../config/socketUrl';

type AdminRealtimeContextValue = {
  /** Incremented on each server push so pages can refetch */
  refreshGeneration: number;
  connected: boolean;
  lastError: string | null;
};

const AdminRealtimeContext = createContext<AdminRealtimeContextValue | null>(null);

const ADMIN_EVENTS = [
  'billing:settled',
  'creator:status',
  'withdrawal:requested',
  'withdrawal:updated',
  'support:ticket_created',
  'support:ticket_updated',
  'wallet_pricing_updated',
  'metrics:refresh',
] as const;

export const AdminRealtimeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const queryClient = useQueryClient();
  const [refreshGeneration, setRefreshGeneration] = useState(0);
  const [connected, setConnected] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);

  const bump = useCallback(() => {
    setRefreshGeneration((g) => g + 1);
    void queryClient.invalidateQueries({ queryKey: ['dashboard'] });
  }, [queryClient]);

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      setConnected(false);
      return;
    }

    const url = getSocketBaseUrl();
    const socket = io(`${url}/admin`, {
      path: '/socket.io',
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      setConnected(true);
      setLastError(null);
    });
    socket.on('disconnect', () => {
      setConnected(false);
    });
    socket.on('connect_error', (err: Error) => {
      setLastError(err.message || 'socket error');
      setConnected(false);
    });

    for (const ev of ADMIN_EVENTS) {
      socket.on(ev, bump);
    }

    return () => {
      for (const ev of ADMIN_EVENTS) {
        socket.off(ev, bump);
      }
      socket.disconnect();
      socketRef.current = null;
    };
  }, [bump]);

  const value = useMemo(
    () => ({ refreshGeneration, connected, lastError }),
    [refreshGeneration, connected, lastError]
  );

  return (
    <AdminRealtimeContext.Provider value={value}>{children}</AdminRealtimeContext.Provider>
  );
};

export function useAdminRealtime(): AdminRealtimeContextValue {
  const ctx = useContext(AdminRealtimeContext);
  if (!ctx) {
    return { refreshGeneration: 0, connected: false, lastError: null };
  }
  return ctx;
}
