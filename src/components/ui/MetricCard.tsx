import React from 'react';

interface MetricCardProps {
  label: string;
  value: string | number;
  subtitle?: string;
  trend?: { value: number; label: string };
  icon?: React.ReactNode;
  onClick?: () => void;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
}

const variantStyles: Record<string, string> = {
  default: 'border-gray-700 bg-gray-800',
  success: 'border-emerald-800 bg-emerald-900/20',
  warning: 'border-yellow-800 bg-yellow-900/20',
  danger: 'border-red-800 bg-red-900/20',
  info: 'border-blue-800 bg-blue-900/20',
};

const MetricCard: React.FC<MetricCardProps> = ({
  label,
  value,
  subtitle,
  trend,
  icon,
  onClick,
  variant = 'default',
}) => {
  return (
    <div
      className={`border rounded-lg p-4 ${variantStyles[variant]} ${
        onClick ? 'cursor-pointer hover:brightness-110 transition-all' : ''
      }`}
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wider truncate">
            {label}
          </p>
          <p className="mt-1 text-2xl font-bold text-white tabular-nums">
            {typeof value === 'number' ? value.toLocaleString() : value}
          </p>
          {subtitle && (
            <p className="mt-0.5 text-xs text-gray-500">{subtitle}</p>
          )}
          {trend && (
            <p
              className={`mt-1 text-xs font-medium ${
                trend.value > 0
                  ? 'text-emerald-400'
                  : trend.value < 0
                  ? 'text-red-400'
                  : 'text-gray-400'
              }`}
            >
              {trend.value > 0 ? '↑' : trend.value < 0 ? '↓' : '→'}{' '}
              {Math.abs(trend.value).toLocaleString()} {trend.label}
            </p>
          )}
        </div>
        {icon && (
          <div className="ml-3 flex-shrink-0 text-gray-500">{icon}</div>
        )}
      </div>
    </div>
  );
};

export default MetricCard;
