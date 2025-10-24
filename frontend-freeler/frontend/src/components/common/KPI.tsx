import { ReactNode } from 'react';
import { cn } from '@/utils/cn';
import { Card, CardContent } from '@/components/ui/Card';

type Trend = {
  label: string;
  value: number;
};

type KPIProps = {
  label: ReactNode;
  value: ReactNode;
  trend?: Trend;
  icon?: ReactNode;
  className?: string;
};

export const KPI = ({ label, value, trend, icon, className }: KPIProps) => {
  const trendPositive = trend ? trend.value >= 0 : null;
  return (
    <Card className={cn('flex flex-col', className)}>
      <CardContent className="flex flex-1 items-center justify-between gap-4">
        <div className="space-y-1">
          {/* Etiqueta superior en tono sutil para mantener jerarquia visual */}
          <span className="text-xs font-medium uppercase tracking-wide text-content-subtle">
            {label}
          </span>
          <p className="text-2xl font-semibold text-content">{value}</p>
          {trend && (
            <span
              className={cn(
                'text-xs font-medium',
                trendPositive ? 'text-emerald-600' : 'text-red-500',
              )}
            >
              {trend.value > 0 && '+'}
              {trend.value}% - {trend.label}
            </span>
          )}
        </div>
        {icon && (
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-surface-muted text-primary-600">
            {icon}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
