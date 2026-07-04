import { MetricHelpButton } from './MetricHelpButton';
import type { MetricHelpContent } from '../../../content/superadminMetricHelp';

type Props = {
  label: string;
  helpKey?: string;
  help?: MetricHelpContent;
};

export function HelpColumnHeader({ label, helpKey, help }: Props) {
  return (
    <span className="inline-flex items-center gap-1">
      {label}
      <MetricHelpButton helpKey={helpKey} help={help} size="sm" />
    </span>
  );
}

export default HelpColumnHeader;
