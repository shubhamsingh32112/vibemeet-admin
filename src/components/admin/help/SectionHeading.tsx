import * as React from 'react';
import { MetricHelpButton } from './MetricHelpButton';
import type { MetricHelpContent } from '../../../content/superadminMetricHelp';
import { cn } from '../../../lib/utils';

type Props = {
  title: string;
  helpKey?: string;
  help?: MetricHelpContent;
  level?: 1 | 2 | 3;
  className?: string;
  children?: React.ReactNode;
};

const levelClass: Record<NonNullable<Props['level']>, string> = {
  1: 'text-2xl font-bold text-white',
  2: 'text-lg font-semibold text-white',
  3: 'text-base font-semibold text-zinc-200',
};

export function SectionHeading({
  title,
  helpKey,
  help,
  level = 2,
  className,
  children,
}: Props) {
  const Tag = (`h${level}` as 'h1' | 'h2' | 'h3');

  return (
    <div className={cn('flex items-center gap-2 flex-wrap', className)}>
      <Tag className={levelClass[level]}>{title}</Tag>
      <MetricHelpButton helpKey={helpKey} help={help} />
      {children}
    </div>
  );
}

export default SectionHeading;
