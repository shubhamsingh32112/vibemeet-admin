import * as React from 'react';
import { AlertTriangle } from 'lucide-react';
import { cn } from '../../../lib/utils';
import type { StaffAlertBase } from '../../../types/staffAlert';
import StaffAlertList from '../../staff/StaffAlertList';
import { MetricHelpButton } from '../help/MetricHelpButton';

export type { StaffAlertBase as AlertItem } from '../../../types/staffAlert';

type AlertsPanelProps = {
  alerts: StaffAlertBase[];
  helpKey?: string;
  className?: string;
};

export const AlertsPanel: React.FC<AlertsPanelProps> = ({
  alerts,
  helpKey = 'dashboard.alerts',
  className,
}) => (
  <div className={cn('glass-panel rounded-2xl p-4 flex flex-col', className)}>
    <div className="mb-3 flex items-center justify-between">
      <h3 className="text-sm font-semibold text-white inline-flex items-center gap-1">
        Alerts
        <MetricHelpButton helpKey={helpKey} />
      </h3>
      <AlertTriangle className="h-4 w-4 text-amber-400/80" />
    </div>
    <StaffAlertList alerts={alerts} />
  </div>
);

export default AlertsPanel;
