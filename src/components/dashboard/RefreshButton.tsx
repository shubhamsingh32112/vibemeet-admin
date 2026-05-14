import React from 'react';

type Props = {
  onRefresh: () => void;
  stale?: boolean;
  label?: string;
  loading?: boolean;
  className?: string;
};

const RefreshButton: React.FC<Props> = ({
  onRefresh,
  stale,
  label = 'Refresh',
  loading,
  className = '',
}) => (
  <button
    type="button"
    onClick={onRefresh}
    disabled={loading}
    className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
      stale
        ? 'border-amber-500/50 text-amber-300 hover:bg-amber-500/10'
        : 'border-admin-border text-zinc-400 hover:text-white hover:border-zinc-500'
    } disabled:opacity-50 ${className}`}
  >
    {loading ? '…' : `↻ ${label}`}
  </button>
);

export default RefreshButton;
