import React from 'react';
import RefreshButton from './RefreshButton';

type Props = {
  message: string;
  onRefreshAll: () => void;
  loading?: boolean;
};

const GlobalStaleBanner: React.FC<Props> = ({ message, onRefreshAll, loading }) => (
  <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-200">
    <span>{message}</span>
    <RefreshButton onRefresh={onRefreshAll} stale label="Refresh all" loading={loading} />
  </div>
);

export default GlobalStaleBanner;
