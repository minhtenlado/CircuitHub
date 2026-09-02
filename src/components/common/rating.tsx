'use client';

import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Rating({
  value,
  count,
  size = 'sm',
  showCount = true,
  className,
}: {
  value: number;
  count?: number;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  showCount?: boolean;
  className?: string;
}) {
  const sizeCls = size === 'xs' ? 'h-3 w-3' : size === 'sm' ? 'h-3.5 w-3.5' : size === 'md' ? 'h-4 w-4' : 'h-5 w-5';
  const textCls = size === 'xs' ? 'text-[10px]' : size === 'sm' ? 'text-xs' : size === 'md' ? 'text-sm' : 'text-base';
  const stars = [1, 2, 3, 4, 5];
  return (
    <div className={cn('flex items-center gap-1.5', className)}>
      <div className="flex items-center gap-0.5">
        {stars.map((s) => {
          const filled = value >= s;
          const half = value >= s - 0.5 && value < s;
          return (
            <Star
              key={s}
              className={cn(sizeCls, filled ? 'text-amber-400 fill-amber-400' : half ? 'text-amber-400 fill-amber-400/40' : 'text-slate-300 fill-slate-200')}
              strokeWidth={1.5}
            />
          );
        })}
      </div>
      <span className={cn('font-semibold text-foreground', textCls)}>{value ? value.toFixed(1) : '—'}</span>
      {showCount && count !== undefined && (
        <span className={cn('text-muted-foreground', textCls)}>({count.toLocaleString('vi-VN')})</span>
      )}
    </div>
  );
}
