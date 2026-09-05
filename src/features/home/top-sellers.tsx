'use client';

/* ============================================================
   CircuitHub — Top Sellers section
   Grid of verified shop cards.
   Each card: banner + logo overlap, name + verified badge,
   rating, completedOrders / productCount / followersCount,
   specializations chips, "Visit Shop →" → goShop(slug)
   ============================================================ */

import { motion } from 'framer-motion';
import {
  ArrowRight,
  Star,
  CheckCircle2,
  Package,
  ShoppingBag,
  Users,
  Store,
  ShieldCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useShops } from '@/lib/api/hooks';
import { useNavStore } from '@/stores/nav-store';
import { Rating } from '@/components/common/rating';
import { SectionHeader } from './categories-section';

export function TopSellers() {
  const { data, isLoading } = useShops(true, 8);
  const shops = (data ?? []).slice(0, 8);

  return (
    <section className="relative py-12 sm:py-16 lg:py-20 bg-background text-foreground">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeader
          eyebrow="Trusted partners"
          title="Top Sellers"
          subtitle="Vetted engineering studios with proven track records, secure licenses, and on-time delivery."
          action={
            <div className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground">
              <ShieldCheck className="h-4 w-4 text-emerald-500" />
              All sellers are spec-sheet verified
            </div>
          }
        />

        {/* Grid */}
        <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {isLoading
            ? Array.from({ length: 4 }).map((_, i) => <ShopCardSkeleton key={i} />)
            : shops.map((shop: any, i: number) => (
                <ShopCard key={shop.id} shop={shop} index={i} />
              ))}
        </div>

        {/* Empty state */}
        {!isLoading && shops.length === 0 && (
          <div className="mt-10 text-center text-sm text-muted-foreground">
            No verified shops found yet. New engineering studios are joining every week.
          </div>
        )}
      </div>
    </section>
  );
}

/* ----------------------------------------------------------------
   ShopCard
   ---------------------------------------------------------------- */
function ShopCard({ shop, index }: { shop: any; index: number }) {
  const goShop = useNavStore((s) => s.goShop);

  const specs = (shop.specializations ?? '')
    .split(',')
    .map((s: string) => s.trim())
    .filter(Boolean)
    .slice(0, 3);

  return (
    <motion.article
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.35, delay: Math.min(index * 0.06, 0.4) }}
      whileHover={{ y: -4 }}
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-border/70 bg-white dark:bg-slate-900 shadow-sm transition-all duration-300 hover:border-cyan-300 hover:shadow-[0_18px_50px_-20px_rgba(6,182,212,0.45)]"
    >
      {/* Banner */}
      <div className="relative h-24 w-full overflow-hidden bg-gradient-to-br from-cyan-100 via-cyan-50 to-teal-50">
        {shop.bannerUrl ? (
          <img
            src={shop.bannerUrl}
            alt={`${shop.name} banner`}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center">
            <Store className="h-10 w-10 text-cyan-300" />
          </div>
        )}
        {/* Verified badge (top-right) */}
        {shop.verified && (
          <span className="absolute top-2 right-2 inline-flex items-center gap-1 rounded-full bg-white dark:bg-slate-900/90 backdrop-blur px-2 py-0.5 text-[10px] font-semibold text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="h-3 w-3" />
            Verified
          </span>
        )}
        {/* Logo (overlap bottom-left) */}
        <div className="absolute -bottom-5 left-4 h-12 w-12 rounded-xl bg-white dark:bg-slate-900 border border-border shadow-md overflow-hidden flex items-center justify-center">
          {shop.logoUrl ? (
            <img
              src={shop.logoUrl}
              alt={`${shop.name} logo`}
              loading="lazy"
              className="h-full w-full object-cover"
            />
          ) : (
            <span className="text-cyan-600 font-bold text-sm">
              {shop.name?.slice(0, 2).toUpperCase()}
            </span>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-col gap-3 p-4 pt-7 flex-1">
        {/* Name + rating */}
        <div className="flex flex-col gap-1">
          <button
            onClick={() => goShop(shop.slug)}
            className="text-left text-base font-semibold leading-tight text-foreground hover:text-cyan-700 transition-colors truncate"
            title={shop.name}
          >
            {shop.name}
          </button>
          <Rating
            value={shop.rating ?? 0}
            count={shop.ratingCount}
            size="xs"
          />
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-1 rounded-xl bg-cyan-50/50 border border-cyan-100/70 p-2.5">
          <Stat
            icon={ShoppingBag}
            value={(shop.completedOrders ?? 0).toLocaleString('vi-VN')}
            label="Orders"
          />
          <Stat
            icon={Package}
            value={(shop.productCount ?? 0).toLocaleString('vi-VN')}
            label="Products"
          />
          <Stat
            icon={Users}
            value={(shop.followersCount ?? 0).toLocaleString('vi-VN')}
            label="Followers"
          />
        </div>

        {/* Specializations chips */}
        {specs.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {specs.map((s: string) => (
              <Badge
                key={s}
                variant="outline"
                className="bg-cyan-50 text-cyan-700 border-cyan-200 font-medium text-[10px]"
              >
                {s}
              </Badge>
            ))}
          </div>
        )}

        {/* CTA */}
        <div className="mt-auto pt-2">
          <Button
            onClick={() => goShop(shop.slug)}
            size="sm"
            variant="outline"
            className="w-full border-cyan-200 text-cyan-700 hover:bg-cyan-50 hover:text-cyan-800"
          >
            Visit Shop
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </motion.article>
  );
}

function Stat({
  icon: Icon,
  value,
  label,
}: {
  icon: typeof Package;
  value: string;
  label: string;
}) {
  return (
    <div className="flex flex-col items-center text-center">
      <Icon className="h-3.5 w-3.5 text-cyan-500 mb-0.5" />
      <span className="text-[11px] font-bold text-foreground tabular-nums leading-tight">
        {value}
      </span>
      <span className="text-[9px] uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
    </div>
  );
}

/* ----------------------------------------------------------------
   Skeleton
   ---------------------------------------------------------------- */
function ShopCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-border/70 bg-white dark:bg-slate-900">
      <div className="h-24 w-full bg-muted shimmer" />
      <div className="p-4 pt-7 space-y-3">
        <div className="h-4 w-3/4 bg-muted rounded shimmer" />
        <div className="h-3 w-1/2 bg-muted rounded shimmer" />
        <div className="h-14 w-full bg-muted rounded-xl shimmer" />
        <div className="h-7 w-full bg-muted rounded shimmer" />
      </div>
    </div>
  );
}

export default TopSellers;
