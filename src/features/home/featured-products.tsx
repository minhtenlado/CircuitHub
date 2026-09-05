'use client';

/* ============================================================
   CircuitHub — Featured Products
   Three horizontal-scroll carousels:
     1. Featured PCB Projects        (category=pcb-boards)
     2. Popular Development Boards   (category=dev-boards)
     3. Trending Digital Designs      (trending=true)
   Each carousel: section header + "View all →" + overflow-x-auto
   with snap-x snap-mandatory and custom scrollbar + arrow buttons.
   ============================================================ */

import { useRef } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, ChevronLeft, ChevronRight, PackageSearch } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useProducts } from '@/lib/api/hooks';
import { useNavStore } from '@/stores/nav-store';
import { ProductCard, ProductCardSkeleton } from '@/components/product/product-card';
import { SectionHeader } from './categories-section';
import { useI18n } from '@/lib/i18n';

const VISIBLE_COUNT = 6;

/* ----------------------------------------------------------------
   ProductCarousel — one horizontal scroll carousel
   ---------------------------------------------------------------- */
function ProductCarousel({
  eyebrow,
  title,
  subtitle,
  hookParams,
  viewAllFilters,
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
  hookParams: Record<string, string | undefined>;
  viewAllFilters: Record<string, string>;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const goProducts = useNavStore((s) => s.goProducts);
  const { t } = useI18n();

  const { data, isLoading } = useProducts({ limit: '12', ...hookParams });

  const items = (data?.items ?? []).slice(0, VISIBLE_COUNT);
  const total = data?.total ?? 0;

  const scrollByCards = (dir: 1 | -1) => {
    const el = scrollRef.current;
    if (!el) return;
    const cardWidth = 280;
    el.scrollBy({ left: dir * cardWidth * 2, behavior: 'smooth' });
  };

  return (
    <section className="py-8 sm:py-10 lg:py-12 border-b border-border/40 last:border-b-0">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeader
          eyebrow={eyebrow}
          title={title}
          subtitle={subtitle}
          action={
            <div className="flex items-center gap-2">
              {/* Desktop scroll arrows */}
              <div className="hidden sm:flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => scrollByCards(-1)}
                  aria-label="Scroll left"
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card dark:bg-slate-900 text-muted-foreground hover:text-cyan-600 dark:hover:text-cyan-400 hover:border-cyan-300 dark:hover:border-cyan-700 transition-colors"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => scrollByCards(1)}
                  aria-label="Scroll right"
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card dark:bg-slate-900 text-muted-foreground hover:text-cyan-600 dark:hover:text-cyan-400 hover:border-cyan-300 dark:hover:border-cyan-700 transition-colors"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => goProducts(viewAllFilters)}
                className="border-cyan-200 dark:border-cyan-800 text-cyan-700 dark:text-cyan-400 hover:bg-cyan-50 dark:hover:bg-slate-800 hover:text-cyan-800 dark:hover:text-cyan-300"
              >
                {t('featured.viewAll')}
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          }
        />

        {/* Carousel */}
        <div
          ref={scrollRef}
          className="mt-7 -mx-4 sm:mx-0 px-4 sm:px-0 overflow-x-auto scroll-smooth snap-x snap-mandatory pb-4"
          style={{
            scrollbarWidth: 'thin',
          }}
        >
          <div className="flex gap-4 sm:gap-5">
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="snap-start shrink-0 w-[260px] sm:w-[280px]"
                >
                  <ProductCardSkeleton />
                </div>
              ))
            ) : items.length === 0 ? (
              <EmptyState />
            ) : (
              items.map((p, i) => (
                <div
                  key={p.id}
                  className="snap-start shrink-0 w-[260px] sm:w-[280px]"
                >
                  <ProductCard product={p} index={i} />
                </div>
              ))
            )}
          </div>
        </div>

        {/* Footer total */}
        {!isLoading && total > 0 && (
          <div className="mt-2 text-xs text-muted-foreground tabular-nums">
            {t('common.showing')} {items.length} {t('common.of')} {total.toLocaleString('vi-VN')} {t('categories.countProducts')}
          </div>
        )}
      </div>
    </section>
  );
}

/* ----------------------------------------------------------------
   Empty state
   ---------------------------------------------------------------- */
function EmptyState() {
  const { t } = useI18n();
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-10 w-full text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-50 dark:bg-cyan-950/60 text-cyan-500 border border-cyan-100 dark:border-cyan-800/60">
        <PackageSearch className="h-6 w-6" />
      </div>
      <div>
        <p className="text-sm font-medium text-foreground">{t('featured.noProducts')}</p>
        <p className="text-xs text-muted-foreground">
          {t('featured.noProductsHint')}
        </p>
      </div>
    </div>
  );
}

/* ----------------------------------------------------------------
   FeaturedProducts — wraps 3 carousels
   ---------------------------------------------------------------- */
export function FeaturedProducts() {
  const { t } = useI18n();

  return (
    <section className="py-12 sm:py-16 lg:py-20 bg-background text-foreground">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-50px' }}
        transition={{ duration: 0.4 }}
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
      >
        <div className="flex flex-col gap-2 mb-2">
          <span className="text-xs font-semibold tracking-wider text-cyan-600 dark:text-cyan-400 uppercase">
            {t('featured.curated')}
          </span>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-foreground">
            {t('featured.title')}
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground max-w-2xl">
            {t('featured.subtitle')}
          </p>
        </div>
      </motion.div>

      <ProductCarousel
        eyebrow={t('featured.manufactured')}
        title={t('featured.pcbTitle')}
        subtitle={t('featured.pcbSubtitle')}
        hookParams={{ category: 'pcb-boards' }}
        viewAllFilters={{ category: 'pcb-boards' }}
      />

      <ProductCarousel
        eyebrow={t('featured.readyToShip')}
        title={t('featured.devBoardsTitle')}
        subtitle={t('featured.devBoardsSubtitle')}
        hookParams={{ category: 'dev-boards' }}
        viewAllFilters={{ category: 'dev-boards' }}
      />

      <ProductCarousel
        eyebrow={t('featured.freeOpenSource')}
        title={t('featured.openSourceTitle')}
        subtitle={t('featured.openSourceSubtitle')}
        hookParams={{ category: 'open-source' }}
        viewAllFilters={{ category: 'open-source' }}
      />
    </section>
  );
}

export default FeaturedProducts;
