import type { StaffAlert, StaffAlertBase } from '../types/staffAlert';
import type { AgencySummary } from '../services/agencyPortalService';
import type { BdDashboardData } from '../services/bdPortalService';

export function adminHrefForType(type: string): string {
  if (type === 'payout') return '/withdrawals';
  if (type === 'fraud') return '/fraud';
  if (type === 'support') return '/support';
  return '/';
}

export function mapAdminAlerts(alerts: StaffAlertBase[]): StaffAlert[] {
  return alerts.map((a) => ({ ...a, href: adminHrefForType(a.type) }));
}

export function buildAgencyAlerts(summary: AgencySummary): StaffAlert[] {
  const now = new Date().toISOString();
  const alerts: StaffAlert[] = [];

  const pendingWd = summary.pendingWithdrawals ?? 0;
  if (pendingWd > 0) {
    alerts.push({
      id: 'agency-wd-pending',
      type: 'payout',
      severity: pendingWd > 10 ? 'warning' : 'info',
      message: `${pendingWd} pending withdrawal request(s)`,
      createdAt: now,
      href: '/agency/withdrawals',
    });
  }

  const awaiting =
    summary.referredUsersPendingApproval ??
    summary.referredUsersAwaitingPromotion ??
    summary.pendingApplications ??
    0;
  if (awaiting > 0) {
    alerts.push({
      id: 'agency-referred-awaiting',
      type: 'onboarding',
      severity: 'info',
      message: `${awaiting} referred user(s) pending approval`,
      createdAt: now,
      href: '/agency/referred',
    });
  }

  if (summary.mustChangePassword) {
    alerts.push({
      id: 'agency-password',
      type: 'security',
      severity: 'warning',
      message: 'Password change required',
      createdAt: now,
      href: '/agency/profile',
    });
  }

  return alerts;
}

export function buildBdAlerts(data: BdDashboardData): StaffAlert[] {
  const now = new Date().toISOString();
  const alerts: StaffAlert[] = [];

  const pendingWd = data.withdrawals?.pendingCount ?? 0;
  if (pendingWd > 0) {
    alerts.push({
      id: 'bd-wd-pending',
      type: 'payout',
      severity: pendingWd > 10 ? 'warning' : 'info',
      message: `${pendingWd} pending withdrawal(s)`,
      createdAt: now,
      href: '/bd/wallet',
    });
  }

  const inactive = data.agencyInactive ?? 0;
  if (inactive > 0) {
    alerts.push({
      id: 'bd-agency-inactive',
      type: 'agency',
      severity: 'info',
      message: `${inactive} inactive agency account(s)`,
      createdAt: now,
      href: '/bd/agencies',
    });
  }

  return alerts;
}
