import React from 'react';

type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'online' | 'offline';

const styles: Record<BadgeVariant, string> = {
  success: 'bg-emerald-900/40 text-emerald-300 border-emerald-700',
  warning: 'bg-yellow-900/40 text-yellow-300 border-yellow-700',
  danger: 'bg-red-900/40 text-red-300 border-red-700',
  info: 'bg-blue-900/40 text-blue-300 border-blue-700',
  neutral: 'bg-gray-800 text-gray-400 border-gray-600',
  online: 'bg-emerald-900/40 text-emerald-300 border-emerald-700',
  offline: 'bg-gray-800 text-gray-500 border-gray-600',
};

interface StatusBadgeProps {
  variant: BadgeVariant;
  label: string;
  dot?: boolean;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ variant, label, dot }) => {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 text-xs font-medium rounded border ${styles[variant]}`}
    >
      {dot && (
        <span
          className={`inline-block w-1.5 h-1.5 rounded-full ${
            variant === 'online' || variant === 'success'
              ? 'bg-emerald-400'
              : variant === 'danger'
              ? 'bg-red-400'
              : variant === 'warning'
              ? 'bg-yellow-400'
              : 'bg-gray-500'
          }`}
        />
      )}
      {label}
    </span>
  );
};

export default StatusBadge;
