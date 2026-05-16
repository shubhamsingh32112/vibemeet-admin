export type StaffAlertSeverity = 'info' | 'warning' | 'danger';

export type StaffAlertBase = {
  id: string;
  type: string;
  severity: StaffAlertSeverity;
  message: string;
  createdAt: string;
};

export type StaffAlert = StaffAlertBase & {
  href: string;
};

/** @deprecated Use StaffAlertBase — kept for dashboard AlertsPanel imports */
export type AlertItem = StaffAlertBase;
