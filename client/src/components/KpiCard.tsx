import React from 'react';

interface KpiCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  trend?: string;
  trendColor?: string;
}

export const KpiCard: React.FC<KpiCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  trend,
  trendColor = 'text-slate-500'
}) => {
  return (
    <div className="panel-enterprise p-4 flex items-start justify-between">
      <div className="space-y-1">
        <p className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider">
          {title}
        </p>
        <p className="text-2xl font-bold font-mono text-slate-900 tracking-tight tabular-nums">
          {value}
        </p>
        {subtitle && (
          <p className="text-[11px] font-mono text-slate-500">
            {subtitle}
          </p>
        )}
        {trend && (
          <p className={`text-[10px] font-mono font-medium ${trendColor}`}>
            {trend}
          </p>
        )}
      </div>
      <div className="p-2 bg-slate-50 border border-slate-200 rounded text-slate-600">
        {icon}
      </div>
    </div>
  );
};
