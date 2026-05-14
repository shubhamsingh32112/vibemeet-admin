import React from 'react';

type Props = {
  stale?: boolean;
  className?: string;
};

const StaleSectionBadge: React.FC<Props> = ({ stale, className = '' }) => {
  if (!stale) return null;
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-[11px] font-medium text-amber-400/90 ${className}`}
      title="Updates available — click Refresh"
    >
      <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" aria-hidden />
      Updates available
    </span>
  );
};

export default StaleSectionBadge;
