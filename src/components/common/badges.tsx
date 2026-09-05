'use client';

import { Badge } from '@/components/ui/badge';
import { Package, FileCode, Wrench, Cpu, Layers, Cog } from 'lucide-react';
import { cn } from '@/lib/utils';

const typeConfig: Record<string, { label: string; cls: string; icon: any }> = {
  PHYSICAL: { label: 'Physical', cls: 'bg-cyan-50 text-cyan-700 border-cyan-200', icon: Package },
  DIGITAL: { label: 'Digital', cls: 'bg-teal-50 text-teal-700 border-teal-200', icon: FileCode },
  SERVICE: { label: 'Service', cls: 'bg-amber-50 text-amber-700 border-amber-200', icon: Wrench },
  BUNDLE: { label: 'Bundle', cls: 'bg-violet-50 text-violet-700 border-violet-200', icon: Package },
};

export function ProductTypeBadge({ type, className }: { type: string; className?: string }) {
  const cfg = typeConfig[type] ?? typeConfig.PHYSICAL;
  const Icon = cfg.icon;
  return (
    <Badge variant="outline" className={cn('gap-1 font-medium', cfg.cls, className)}>
      <Icon className="h-3 w-3" />
      {cfg.label}
    </Badge>
  );
}

export function VerifiedBadge({ className }: { className?: string }) {
  return (
    <Badge variant="outline" className={cn('gap-1 bg-emerald-50 text-emerald-700 border-emerald-200 font-medium', className)}>
      <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none">
        <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.6" />
      </svg>
      Verified
    </Badge>
  );
}

export function TechBadge({ icon: Icon, label, className }: { icon?: any; label: string; className?: string }) {
  return (
    <Badge variant="outline" className={cn('gap-1 bg-slate-50 text-slate-700 border-slate-200 font-mono text-[10px] px-1.5 py-0', className)}>
      {Icon && <Icon className="h-3 w-3" />}
      {label}
    </Badge>
  );
}

export function StockBadge({ stock, unlimited }: { stock: number; unlimited: boolean }) {
  if (unlimited) return <Badge variant="outline" className="bg-teal-50 text-teal-700 border-teal-200">Unlimited</Badge>;
  if (stock <= 0) return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Out of stock</Badge>;
  if (stock < 20) return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">Only {stock} left</Badge>;
  return <Badge variant="outline" className="bg-slate-50 text-slate-600 border-slate-200">{stock} in stock</Badge>;
}

export function DiscountBadge({ pct }: { pct: number }) {
  if (pct <= 0) return null;
  return (
    <Badge className="bg-gradient-to-r from-rose-500 to-orange-400 text-white border-0 font-semibold tracking-tight">
      -{pct}%
    </Badge>
  );
}

export function NewBadge({ className }: { className?: string }) {
  return (
    <Badge className={cn('bg-gradient-to-r from-cyan-500 to-teal-400 text-white border-0 font-semibold tracking-tight', className)}>
      NEW
    </Badge>
  );
}

export function TrendingBadge({ className }: { className?: string }) {
  return (
    <Badge variant="outline" className={cn('gap-1 bg-rose-50 text-rose-700 border-rose-200 font-semibold', className)}>
      🔥 Trending
    </Badge>
  );
}

export function FeaturedBadge({ className }: { className?: string }) {
  return (
    <Badge variant="outline" className={cn('gap-1 bg-violet-50 text-violet-700 border-violet-200 font-semibold', className)}>
      ★ Featured
    </Badge>
  );
}

export function CategoryBadge({ category, icon }: { category: string; icon?: string }) {
  const Icon = icon === 'Layers' ? Layers : icon === 'Cpu' ? Cpu : icon === 'Cog' ? Cog : Package;
  return (
    <Badge variant="outline" className="gap-1 bg-slate-50 text-slate-700 border-slate-200">
      <Icon className="h-3 w-3" />
      {category}
    </Badge>
  );
}

export function OpenSourceBadge({ className }: { className?: string }) {
  return (
    <Badge className={cn('gap-1 bg-gradient-to-r from-emerald-500 to-teal-400 text-white border-0 font-semibold', className)}>
      <svg className="h-3 w-3" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93C7.05 19.44 4 16.08 4 12c0-.61.08-1.21.21-1.78l5.79 5.79v1.92zm9.45-4.11c-.57-1.07-1.65-1.82-2.95-1.82-1.32 0-2.5.78-3.05 1.9l-2.43-2.43c.57-1.08.97-2.27.97-3.47 0-1.39-.52-2.65-1.38-3.63l3.06-3.06c1.4.78 3.05 1.23 4.81 1.23.58 0 1.14-.06 1.69-.15C19.4 9.73 20 10.8 20 12c0 1.39-.43 2.69-1.55 3.82z" />
      </svg>
      Open Source
    </Badge>
  );
}

export function FreeBadge({ className }: { className?: string }) {
  return (
    <Badge className={cn('gap-1 bg-gradient-to-r from-emerald-500 to-cyan-400 text-white border-0 font-bold tracking-tight', className)}>
      FREE
    </Badge>
  );
}

