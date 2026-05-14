/** Backward-compatible admin portal wrapper around StaffRealtimeContext. */
import React from 'react';
import {
  StaffRealtimeProvider,
  useStaffRealtime,
} from './StaffRealtimeContext';
import { ADMIN_VISIBLE_SECTIONS } from '../types/dashboardStale';

export const AdminRealtimeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => (
  <StaffRealtimeProvider portal="admin" visibleSections={ADMIN_VISIBLE_SECTIONS}>
    {children}
  </StaffRealtimeProvider>
);

export function useAdminRealtime() {
  const { connected, lastError } = useStaffRealtime();
  return { refreshGeneration: 0, connected, lastError };
}

export { useStaffRealtime } from './StaffRealtimeContext';
