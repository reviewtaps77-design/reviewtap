import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { ArrowUp, ArrowDown, Minus } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  change?: number;
  icon?: React.ReactNode;
  className?: string;
}

export function StatCard({ title, value, change, icon, className }: StatCardProps) {
  return (
    <Card className={cn('', className)}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          {icon && <div className="text-muted-foreground">{icon}</div>}
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <p className="text-2xl font-bold">{value}</p>
          {change !== undefined && (
            <span
              className={cn(
                'inline-flex items-center text-xs font-medium',
                change > 0 && 'text-emerald-600',
                change < 0 && 'text-red-600',
                change === 0 && 'text-muted-foreground'
              )}
            >
              {change > 0 ? <ArrowUp className="h-3 w-3" /> : change < 0 ? <ArrowDown className="h-3 w-3" /> : <Minus className="h-3 w-3" />}
              {Math.abs(change)}%
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
