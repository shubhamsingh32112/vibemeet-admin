import * as React from 'react';
import { AlertTriangle } from 'lucide-react';
import { cn } from '../../../lib/utils';
import type { StaffAlertBase } from '../../../types/staffAlert';
import StaffAlertList from '../../staff/StaffAlertList';

export type { StaffAlertBase as AlertItem } from '../../../types/staffAlert';

type AlertsPanelProps = {
  alerts: StaffAlertBase[];
  className?: string;
};

export const AlertsPanel: React.FC<AlertsPanelProps> = ({ alerts, className }) => (
  <div className={cn('glass-panel rounded-2xl p-4 flex flex-col', className)}>
    <div className="mb-3 flex items-center justify-between">
      <h3 className="text-sm font-semibold text-white">Alerts</h3>
      <AlertTriangle className="h-4 w-4 text-amber-400/80" />
    </div>
    <StaffAlertList alerts={alerts} />
  </div>
);

export default AlertsPanel;
