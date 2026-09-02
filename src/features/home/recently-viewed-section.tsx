'use client';

import { motion } from 'framer-motion';
import { History, ArrowRight, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useRecentlyViewedStore } from '@/stores/recently-viewed-store';
import { useNavStore } from '@/stores/nav-store';
import { formatVND } from '@/lib/format';
import { ProductTypeBadge } from '@/components/common/badges';
import Image from 'next/image';
import { timeAgo } from '@/lib/format';

export function RecentlyViewedSection() {
  const { items, clear } = useRecentlyViewedStore();
  const { goProduct } = useNavStore();

  if (items.length === 0) return null;

  return (
    <section className="py-12 sm:py-16 border-t border-border/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-cyan-500 to-teal-400 flex items-center justify-center shadow-[0_4px_14px_-4px_rgba(6,182,212,0.5)]">
              <History className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-foreground">Recently Viewed</h2>
              <p className="text-sm text-muted-foreground">Pick up where you left off</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={clear} className="text-xs text-muted-foreground hover:text-red-500">
            <X className="h-3.5 w-3.5 mr-1" />
            Clear
          </Button>
        </div>

        <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-thin">
          {items.map((item, i) => (
            <motion.button
              key={item.productId}
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3, delay: Math.min(i * 0.05, 0.3) }}
              onClick={() => goProduct(item.slug)}
              className="group flex-shrink-0 w-44 sm:w-52 snap-start text-left bg-card border border-border/70 rounded-xl overflow-hidden hover:border-cyan-400/50 hover:shadow-[0_10px_30px_-12px_rgba(6,182,212,0.3)] transition-all duration-300"
            >
              <div className="relative aspect-[4/3] bg-muted overflow-hidden">
                {item.imageUrl && (
                  <Image src={item.imageUrl} alt={item.name} fill className="object-cover group-hover:scale-105 transition-transform duration-500" sizes="200px" />
                )}
                <div className="absolute top-2 left-2">
                  <ProductTypeBadge type={item.productType} className="text-[10px]" />
                </div>
              </div>
              <div className="p-3 space-y-1">
                <p className="text-sm font-semibold line-clamp-2 group-hover:text-cyan-700 transition-colors">{item.name}</p>
                <p className="text-xs text-muted-foreground truncate">{item.shopName}</p>
                <div className="flex items-center justify-between pt-1">
                  <span className="text-sm font-bold text-cyan-700">{formatVND(item.price)}</span>
                  <span className="text-[10px] text-muted-foreground">{timeAgo(item.viewedAt)}</span>
                </div>
              </div>
            </motion.button>
          ))}
        </div>
      </div>
    </section>
  );
}
