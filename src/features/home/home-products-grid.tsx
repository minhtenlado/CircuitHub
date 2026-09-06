'use client';

/* ============================================================
   CircuitHub — Home Products Multi-Tab Grid
   Marketplace-style category & merchandising shelf with live tabs:
   [🔥 Bán chạy] [⚡ Giá sốc] [✨ Hàng mới] [🛠️ Bo MCU] [📡 Cảm biến] [📄 KiCad]
   ============================================================ */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, PackageSearch, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useProducts } from '@/lib/api/hooks';
import { useNavStore } from '@/stores/nav-store';
import { ProductCard, ProductCardSkeleton } from '@/components/product/product-card';
import { useI18n } from '@/lib/i18n';
import { cn } from '@/lib/utils';

export function HomeProductsGrid() {
  const [activeTab, setActiveTab] = useState<'popular' | 'deals' | 'newest' | 'dev-boards' | 'sensors' | 'pcb-boards'>('popular');
  const goProducts = useNavStore((s) => s.goProducts);
  const goCategory = useNavStore((s) => s.goCategory);
  const { t } = useI18n();

  const tabs: Array<{
    id: 'popular' | 'deals' | 'newest' | 'dev-boards' | 'sensors' | 'pcb-boards';
    label: string;
    params: Record<string, string>;
  }> = [
    { id: 'popular', label: t('homeGrid.tabBestSellers'), params: { sort: 'popular' } },
    { id: 'deals', label: t('homeGrid.tabDeals'), params: { sort: 'trending' } },
    { id: 'newest', label: t('homeGrid.tabNew'), params: { sort: 'newest' } },
    { id: 'dev-boards', label: t('homeGrid.tabDevBoards'), params: { category: 'dev-boards' } },
    { id: 'sensors', label: t('homeGrid.tabSensors'), params: { category: 'sensors' } },
    { id: 'pcb-boards', label: t('homeGrid.tabPcb'), params: { category: 'pcb-boards' } },
  ];

  const currentTab = tabs.find((t) => t.id === activeTab) ?? tabs[0];
  const { data, isLoading } = useProducts({ limit: '8', ...currentTab.params });

  const products = data?.items ?? [];

  return (
    <section className="py-8 sm:py-12 lg:py-14 border-b border-border/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-cyan-600 dark:text-cyan-400 mb-1">
              <Sparkles className="h-3.5 w-3.5" />
              SÀN GIAO DỊCH LINH KIỆN
            </div>
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tight text-foreground">
              {t('homeGrid.title')}
            </h2>
            <p className="mt-1 text-xs sm:text-sm text-muted-foreground max-w-2xl">
              {t('homeGrid.subtitle')}
            </p>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              if (currentTab.params.category) goCategory(currentTab.params.category);
              else goProducts(currentTab.params);
            }}
            className="self-start md:self-auto h-9 px-4 rounded-xl border-cyan-500/40 text-cyan-700 dark:text-cyan-300 hover:bg-cyan-50 dark:hover:bg-cyan-950/40 text-xs font-semibold gap-1.5 cursor-pointer shadow-xs"
          >
            <span>{t('homeGrid.viewAll')}</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </div>

        {/* Tab Switcher */}
        <div className="mt-6 flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {tabs.map((tab) => {
            const isActive = tab.id === activeTab;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'h-9 px-4 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 border',
                  isActive
                    ? 'bg-cyan-500 text-white border-cyan-500 shadow-[0_4px_14px_-4px_rgba(6,182,212,0.55)]'
                    : 'bg-card border-border/70 text-muted-foreground hover:text-foreground hover:bg-accent hover:border-border',
                )}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Product Grid */}
        <div className="mt-6 grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5">
          {isLoading ? (
            Array.from({ length: 8 }).map((_, i) => (
              <ProductCardSkeleton key={i} />
            ))
          ) : products.length === 0 ? (
            <div className="col-span-full py-12 text-center">
              <PackageSearch className="h-10 w-10 text-muted-foreground mx-auto mb-2 opacity-50" />
              <p className="text-xs text-muted-foreground">Không có sản phẩm nào trong danh mục này</p>
            </div>
          ) : (
            products.map((product, idx) => (
              <ProductCard key={product.id} product={product} index={idx} />
            ))
          )}
        </div>
      </div>
    </section>
  );
}

export default HomeProductsGrid;
