'use client';

/* ============================================================
   CircuitHub — Flash Sale Section
   E-commerce limited-time deals showcase with live countdown,
   deep discounts, stock sold indicators, and quick add-to-cart.
   ============================================================ */

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Flame, ArrowRight, Clock, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useProducts } from '@/lib/api/hooks';
import { useNavStore } from '@/stores/nav-store';
import { ProductCard, ProductCardSkeleton } from '@/components/product/product-card';
import { useI18n } from '@/lib/i18n';

export function FlashSaleSection() {
  const goProducts = useNavStore((s) => s.goProducts);
  const { t } = useI18n();
  const { data, isLoading } = useProducts({ limit: '6', sort: 'trending' });

  const [timeLeft, setTimeLeft] = useState({ hours: 3, minutes: 42, seconds: 18 });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
        if (prev.minutes > 0) return { ...prev, minutes: 59, seconds: 59 };
        if (prev.hours > 0) return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        return { hours: 4, minutes: 0, seconds: 0 };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const products = data?.items ?? [];

  return (
    <section className="relative py-6 sm:py-8 lg:py-10 border-b border-border/50 bg-gradient-to-b from-amber-500/[0.03] via-transparent to-transparent">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header with Countdown */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-5 border-b border-border/50">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-rose-500 text-white shadow-sm">
                <Flame className="h-5 w-5 animate-pulse" />
              </span>
              <div>
                <h2 className="text-lg sm:text-xl lg:text-2xl font-black tracking-tight text-foreground flex items-center gap-2">
                  {t('flashSale.title')}
                </h2>
                <p className="text-xs text-muted-foreground hidden sm:block">
                  {t('flashSale.subtitle')}
                </p>
              </div>
            </div>

            {/* Countdown Badge */}
            <div className="flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-mono font-bold text-amber-600 dark:text-amber-400">
              <Clock className="h-3.5 w-3.5 mr-0.5" />
              <span>{t('flashSale.endsIn')}:</span>
              <span className="rounded bg-card px-1.5 py-0.5 shadow-xs border border-border/60">
                {String(timeLeft.hours).padStart(2, '0')}
              </span>
              :
              <span className="rounded bg-card px-1.5 py-0.5 shadow-xs border border-border/60">
                {String(timeLeft.minutes).padStart(2, '0')}
              </span>
              :
              <span className="rounded bg-card px-1.5 py-0.5 shadow-xs border border-border/60">
                {String(timeLeft.seconds).padStart(2, '0')}
              </span>
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => goProducts({ sort: 'trending' })}
            className="self-start sm:self-auto h-8 px-3 rounded-lg border-amber-500/40 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 hover:text-amber-500 text-xs font-semibold gap-1.5 cursor-pointer"
          >
            <span>{t('flashSale.viewAll')}</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </div>

        {/* Product Grid */}
        <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
          {isLoading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <ProductCardSkeleton key={i} />
            ))
          ) : products.length === 0 ? (
            <div className="col-span-full py-8 text-center text-xs text-muted-foreground">
              Đang cập nhật phiên giảm giá mới...
            </div>
          ) : (
            products.slice(0, 6).map((product, idx) => (
              <ProductCard key={product.id} product={product} index={idx} />
            ))
          )}
        </div>
      </div>
    </section>
  );
}

export default FlashSaleSection;
