/**
 * Staff dashboard realtime — stale-state invalidation (no auto-refetch).
 *
 * Ordering: eventually consistent. Unrelated events are not ordered.
 * On reconnect: all visible sections marked stale (no missed-event replay).
 */
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { io, type Socket } from 'socket.io-client';
import { getSocketBaseUrl } from '../config/socketUrl';
import {
  type DashboardSection,
  type RefreshMode,
  type StaleMap,
  FRESH_STALE_MAP,
} from '../types/dashboardStale';
import { sectionsFromDomainEvent, hintForDomainEvent } from '../realtime/domainEventAdapters';

export type StaffPortal = 'admin' | 'agency' | 'bd';

type StaffRealtimeContextValue = {
  stale: StaleMap;
  connected: boolean;
  lastError: string | null;
  pendingHint: string | null;
  refreshGeneration: number;
  refreshMode: Record<DashboardSection, RefreshMode>;
  markStale: (sections: DashboardSection[]) => void;
  markFresh: (sections?: DashboardSection[]) => void;
  markAllFresh: () => void;
  setRefreshMode: (section: DashboardSection, mode: RefreshMode) => void;
};

const StaffRealtimeContext = createContext<StaffRealtimeContextValue | null>(null);

const LEGACY_EVENTS = [
  'billing:settled',
  'creator:status',
  'withdrawal:requested',
  'withdrawal:updated',
  'support:ticket_created',
  'support:ticket_updated',
  'wallet_pricing_updated',
  'metrics:refresh',
] as const;

type InvalidatePayload = {
  type: string;
  affected?: DashboardSection[];
};

function tokenKeyForPortal(portal: StaffPortal): string {
  if (portal === 'bd') return 'bdToken';
  if (portal === 'agency') return 'agencyToken';
  return 'adminToken';
}

type ProviderProps = {
  portal: StaffPortal;
  visibleSections: DashboardSection[];
  children: React.ReactNode;
};

export const StaffRealtimeProvider: React.FC<ProviderProps> = ({
  portal,
  visibleSections,
  children,
}) => {
  const [stale, setStale] = useState<StaleMap>({ ...FRESH_STALE_MAP });
  const [connected, setConnected] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);
  const [pendingHint, setPendingHint] = useState<string | null>(null);
  const [refreshGeneration, setRefreshGeneration] = useState(0);
  const [refreshMode, setRefreshModeState] = useState<Record<DashboardSection, RefreshMode>>(() => {
    const modes = {} as Record<DashboardSection, RefreshMode>;
    for (const s of Object.keys(FRESH_STALE_MAP) as DashboardSection[]) {
      modes[s] = 'manual';
    }
    return modes;
  });
  const socketRef = useRef<Socket | null>(null);
  const hasConnectedBeforeRef = useRef(false);

  const markStale = useCallback((sections: DashboardSection[]) => {
    if (sections.length === 0) return;
    setStale((prev) => {
      const next = { ...prev };
      for (const s of sections) next[s] = true;
      return next;
    });
    setRefreshGeneration((g) => g + 1);
  }, []);

  const markFresh = useCallback((sections?: DashboardSection[]) => {
    if (!sections || sections.length === 0) {
      setStale({ ...FRESH_STALE_MAP });
      setPendingHint(null);
      return;
    }
    setStale((prev) => {
      const next = { ...prev };
      for (const s of sections) next[s] = false;
      return next;
    });
    setPendingHint(null);
  }, []);

  const markAllFresh = useCallback(() => {
    markFresh();
  }, [markFresh]);

  const setRefreshMode = useCallback((section: DashboardSection, mode: RefreshMode) => {
    setRefreshModeState((prev) => ({ ...prev, [section]: mode }));
  }, []);

  const handleInvalidate = useCallback(
    (payload: InvalidatePayload) => {
      const sections = sectionsFromDomainEvent(payload.type, payload.affected);
      markStale(sections);
      setPendingHint(hintForDomainEvent(payload.type));
    },
    [markStale]
  );

  useEffect(() => {
    const token = localStorage.getItem(tokenKeyForPortal(portal));
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

    const onConnect = () => {
      setConnected(true);
      setLastError(null);
      if (hasConnectedBeforeRef.current) {
        markStale(visibleSections);
        setPendingHint('You were disconnected — refresh to see latest data');
      }
      hasConnectedBeforeRef.current = true;
    };

    socket.on('connect', onConnect);
    socket.on('disconnect', () => setConnected(false));
    socket.on('connect_error', (err: Error) => {
      setLastError(err.message || 'socket error');
      setConnected(false);
    });

    socket.on('dashboard:invalidate', handleInvalidate);
    for (const ev of LEGACY_EVENTS) {
      socket.on(ev, (p: InvalidatePayload) =>
        handleInvalidate({ type: ev, affected: p?.affected })
      );
    }

    return () => {
      socket.off('connect', onConnect);
      socket.off('dashboard:invalidate', handleInvalidate);
      for (const ev of LEGACY_EVENTS) {
        socket.off(ev);
      }
      socket.disconnect();
      socketRef.current = null;
    };
  }, [portal, visibleSections, handleInvalidate, markStale]);

  const value = useMemo(
    () => ({
      stale,
      connected,
      lastError,
      pendingHint,
      refreshGeneration,
      refreshMode,
      markStale,
      markFresh,
      markAllFresh,
      setRefreshMode,
    }),
    [
      stale,
      connected,
      lastError,
      pendingHint,
      refreshGeneration,
      refreshMode,
      markStale,
      markFresh,
      markAllFresh,
      setRefreshMode,
    ]
  );

  return (
    <StaffRealtimeContext.Provider value={value}>{children}</StaffRealtimeContext.Provider>
  );
};

export function useStaffRealtime(): StaffRealtimeContextValue {
  const ctx = useContext(StaffRealtimeContext);
  if (!ctx) {
    return {
      stale: { ...FRESH_STALE_MAP },
      connected: false,
      lastError: null,
      pendingHint: null,
      refreshGeneration: 0,
      refreshMode: Object.fromEntries(
        Object.keys(FRESH_STALE_MAP).map((k) => [k, 'manual' as RefreshMode])
      ) as Record<DashboardSection, RefreshMode>,
      markStale: () => {},
      markFresh: () => {},
      markAllFresh: () => {},
      setRefreshMode: () => {},
    };
  }
  return ctx;
}
