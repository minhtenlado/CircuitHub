'use client';

/* ============================================================
   CircuitHub — Engineering Services section
   Custom service card layout (not the same as ProductCard).
   Each card: serviceScope icon, name, starting price,
   duration badge, revisions, seller name, "Request Quote" → goProduct(slug)
   ============================================================ */

import { motion } from 'framer-motion';
import {
  Cog,
  Layers,
  Binary,
  ShieldCheck,
  FileCheck,
  Clock,
  RefreshCw,
  ArrowRight,
  User,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useProducts } from '@/lib/api/hooks';
import { useNavStore } from '@/stores/nav-store';
import { formatVND } from '@/lib/format';
import { SectionHeader } from './categories-section';

/* Static service icon — branch on scope keyword and render the icon.
   Declaring as a top-level component avoids the react-hooks/static-components
   rule, which flags icon references returned from a render-time call. */
function ServiceIcon({ scope, className }: { scope?: string; className?: string }) {
  const s = (scope ?? '').toLowerCase();
  if (s.includes('review') || s.includes('check') || s.includes('dfm') || s.includes('emi')) {
    return <ShieldCheck className={className} />;
  }
  if (s.includes('firmware') || s.includes('driver') || s.includes('rtos')) {
    return <Binary className={className} />;
  }
  if (s.includes('gerber') || s.includes('bom')) {
    return <FileCheck className={className} />;
  }
  if (s.includes('schematic') || s.includes('capture')) {
    return <Layers className={className} />;
  }
  return <Cog className={className} />;
}

export function ServicesSection() {
  const { data, isLoading } = useProducts({ category: 'services', limit: '12' });
  const services = (data?.items ?? []).filter((p: any) => p.productType === 'SERVICE').slice(0, 4);

  return (
    <section className="relative py-12 sm:py-16 lg:py-20 bg-gradient-to-b from-white to-cyan-50/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeader
          eyebrow="On-demand"
          title="Engineering Services"
          subtitle="Hire verified engineering studios for custom PCB design, schematic review, firmware development, and DFM checks — with clear deliverables and revisions."
        />

        {/* Grid */}
        <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {isLoading
            ? Array.from({ length: 4 }).map((_, i) => <ServiceCardSkeleton key={i} />)
            : services.map((p: any, i: number) => <ServiceCard key={p.id} product={p} index={i} />)}
        </div>

        {/* Empty state */}
        {!isLoading && services.length === 0 && (
          <div className="mt-10 text-center text-sm text-muted-foreground">
            No services listed yet. Verified studios are onboarding weekly — come back soon.
          </div>
        )}
      </div>
    </section>
  );
}

/* ----------------------------------------------------------------
   ServiceCard — custom layout
   ---------------------------------------------------------------- */
function ServiceCard({ product, index }: { product: any; index: number }) {
  const goProduct = useNavStore((s) => s.goProduct);
  const days = product.serviceDurationDays;
  const revisions = product.serviceRevisions;

  return (
    <motion.article
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.35, delay: Math.min(index * 0.06, 0.3) }}
      whileHover={{ y: -4 }}
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-border/70 bg-white transition-all duration-300 hover:border-cyan-300 hover:shadow-[0_18px_50px_-20px_rgba(6,182,212,0.4)]"
    >
      {/* Top accent strip */}
      <div className="h-1.5 w-full bg-gradient-to-r from-cyan-500 via-teal-400 to-aqua-400" />

      {/* Body */}
      <div className="flex flex-col gap-3 p-5 flex-1">
        {/* Icon + seller */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500 to-teal-400 text-white shadow-[0_8px_18px_-8px_rgba(6,182,212,0.55)] transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-3">
            <ServiceIcon scope={product.serviceScope} className="h-6 w-6" />
          </div>
          <Badge
            variant="outline"
            className="bg-cyan-50 text-cyan-700 border-cyan-200 font-mono text-[10px]"
          >
            SERVICE
          </Badge>
        </div>

        {/* Name */}
        <button
          onClick={() => goProduct(product.slug)}
          className="text-left text-base font-semibold leading-tight text-foreground hover:text-cyan-700 transition-colors line-clamp-2"
          title={product.name}
        >
          {product.name}
        </button>

        {/* Short description */}
        {product.shortDescription && (
          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
            {product.shortDescription}
          </p>
        )}

        {/* Meta badges row */}
        <div className="flex flex-wrap gap-1.5">
          {days && (
            <Badge
              variant="outline"
              className="gap-1 bg-slate-50 text-slate-700 border-slate-200 font-mono text-[10px]"
            >
              <Clock className="h-3 w-3 text-cyan-500" />
              {days} days
            </Badge>
          )}
          {revisions && (
            <Badge
              variant="outline"
              className="gap-1 bg-slate-50 text-slate-700 border-slate-200 font-mono text-[10px]"
            >
              <RefreshCw className="h-3 w-3 text-teal-500" />
              {revisions} revision{revisions > 1 ? 's' : ''} included
            </Badge>
          )}
        </div>

        {/* Seller */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <User className="h-3.5 w-3.5 text-cyan-500" />
          <span className="truncate">by {product.shop?.name}</span>
          {product.shop?.verified && (
            <span className="text-emerald-600 font-medium text-[10px]">✓ Verified</span>
          )}
        </div>

        {/* Price + CTA */}
        <div className="mt-auto pt-3 border-t border-border/60 flex items-end justify-between gap-3">
          <div className="flex flex-col">
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
              From
            </span>
            <span className="text-xl font-bold text-cyan-700 tracking-tight tabular-nums">
              {formatVND(product.price)}
            </span>
          </div>
          <Button
            onClick={() => goProduct(product.slug)}
            size="sm"
            className="bg-gradient-to-r from-cyan-500 to-teal-400 hover:from-cyan-600 hover:to-teal-500 text-white shadow-sm"
          >
            Request Quote
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </motion.article>
  );
}

/* ----------------------------------------------------------------
   Skeleton
   ---------------------------------------------------------------- */
function ServiceCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-border/70 bg-white">
      <div className="h-1.5 w-full bg-muted shimmer" />
      <div className="p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="h-12 w-12 bg-muted rounded-2xl shimmer" />
          <div className="h-4 w-14 bg-muted rounded shimmer" />
        </div>
        <div className="h-4 w-3/4 bg-muted rounded shimmer" />
        <div className="h-3 w-full bg-muted rounded shimmer" />
        <div className="h-3 w-1/2 bg-muted rounded shimmer" />
        <div className="h-14 w-full bg-muted rounded-xl shimmer" />
      </div>
    </div>
  );
}

export default ServicesSection;
