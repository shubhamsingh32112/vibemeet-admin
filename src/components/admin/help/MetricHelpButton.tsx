import { HelpCircle } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '../../ui/dropdown-menu';
import type { MetricHelpContent } from '../../../content/superadminMetricHelp';
import { getMetricHelp } from '../../../content/superadminMetricHelp';
import { cn } from '../../../lib/utils';

type Props = {
  help?: MetricHelpContent;
  helpKey?: string;
  className?: string;
  size?: 'sm' | 'md';
};

const timezoneLabels: Record<NonNullable<MetricHelpContent['timezone']>, string> = {
  IST: 'IST calendar day',
  header_range: 'Header date filter (IST)',
  realtime: 'Live / realtime',
  none: 'Not time-bound',
  custom_range: 'Custom page time range',
};

export function MetricHelpButton({ help: helpProp, helpKey, className, size = 'sm' }: Props) {
  const help = helpProp ?? (helpKey ? getMetricHelp(helpKey) : undefined);
  if (!help) return null;

  const iconSize = size === 'sm' ? 14 : 16;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={cn(
            'inline-flex shrink-0 items-center justify-center rounded-full text-zinc-500 hover:text-violet-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/50',
            className
          )}
          aria-label={`Explain ${help.title}`}
          onClick={(e) => e.stopPropagation()}
        >
          <HelpCircle size={iconSize} aria-hidden />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        className="max-w-xs p-3 text-xs leading-relaxed text-zinc-300"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="font-semibold text-white">{help.title}</p>
        <p className="mt-1.5">{help.body}</p>
        {help.source ? (
          <p className="mt-2 text-zinc-500">
            <span className="font-medium text-zinc-400">Source:</span> {help.source}
          </p>
        ) : null}
        {help.timezone ? (
          <p className="mt-1 text-zinc-500">
            <span className="font-medium text-zinc-400">Time:</span>{' '}
            {timezoneLabels[help.timezone]}
          </p>
        ) : null}
        {help.filterScope ? (
          <p className="mt-1 text-zinc-500">
            <span className="font-medium text-zinc-400">Filter:</span> {help.filterScope}
          </p>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default MetricHelpButton;
