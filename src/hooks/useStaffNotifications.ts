import * as React from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchDashboardAlerts } from '../services/dashboardApi';
import { agencyPortalService } from '../services/agencyPortalService';
import { bdPortalService } from '../services/bdPortalService';
import {
  buildAgencyAlerts,
  buildBdAlerts,
  mapAdminAlerts,
} from '../lib/staffAlertRoutes';
import { useStaffRealtime } from '../contexts/StaffRealtimeContext';
import type { StaffAlert } from '../types/staffAlert';

export const STAFF_NOTIFICATIONS_KEY = ['staff-notifications'] as const;

const NOTIFICATION_STALE_SECTIONS = ['withdrawals', 'support', 'overview', 'fraud'] as const;

function useNotificationInvalidation(portal: 'admin' | 'agency' | 'bd') {
  const queryClient = useQueryClient();
  const { stale } = useStaffRealtime();

  React.useEffect(() => {
    const shouldInvalidate = NOTIFICATION_STALE_SECTIONS.some((s) => stale[s]);
    if (!shouldInvalidate) return;
    void queryClient.invalidateQueries({ queryKey: [...STAFF_NOTIFICATIONS_KEY, portal] });
  }, [stale, portal, queryClient]);
}

function useStaffNotificationsQuery<T>(
  portal: 'admin' | 'agency' | 'bd',
  queryFn: () => Promise<T>,
  select: (data: T) => StaffAlert[]
) {
  useNotificationInvalidation(portal);

  const query = useQuery({
    queryKey: [...STAFF_NOTIFICATIONS_KEY, portal],
    queryFn,
    select,
    staleTime: 30_000,
    refetchInterval: 45_000,
  });

  const refetchOnOpen = React.useCallback(
    (open: boolean) => {
      if (open) void query.refetch();
    },
    [query]
  );

  return {
    alerts: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    refetchOnOpen,
  };
}

export function useAdminNotifications() {
  return useStaffNotificationsQuery(
    'admin',
    async () => {
      const data = await fetchDashboardAlerts();
      return data.alerts;
    },
    (alerts) => mapAdminAlerts(alerts)
  );
}

export function useAgencyNotifications() {
  return useStaffNotificationsQuery(
    'agency',
    () => agencyPortalService.getSummary(),
    (summary) => buildAgencyAlerts(summary)
  );
}

export function useBdNotifications(mustChangePassword?: boolean) {
  useNotificationInvalidation('bd');

  const query = useQuery({
    queryKey: [...STAFF_NOTIFICATIONS_KEY, 'bd', Boolean(mustChangePassword)],
    queryFn: async () => {
      const data = await bdPortalService.getDashboard();
      const alerts = buildBdAlerts(data);
      if (mustChangePassword) {
        alerts.unshift({
          id: 'bd-password',
          type: 'security',
          severity: 'warning',
          message: 'Password change required',
          createdAt: new Date().toISOString(),
          href: '/bd/change-password',
        });
      }
      return alerts;
    },
    staleTime: 30_000,
    refetchInterval: 45_000,
  });

  const refetchOnOpen = React.useCallback(
    (open: boolean) => {
      if (open) void query.refetch();
    },
    [query]
  );

  return {
    alerts: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    refetchOnOpen,
  };
}
