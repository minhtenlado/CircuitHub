'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { GitCompare, X, ArrowRight } from 'lucide-react';
import { useCompareStore } from '@/stores/compare-store';
import Image from 'next/image';

export function CompareBar() {
  const { items, open, remove, clear } = useCompareStore();

  return (
    <AnimatePresence>
      {items.length > 0 && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 w-[calc(100%-2rem)] max-w-3xl"
        >
          <div className="glass-card rounded-2xl shadow-[0_10px_40px_-8px_rgba(6,182,212,0.35)] border border-cyan-200/60 p-3 flex items-center gap-3">
            {/* Icon + count */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-cyan-500 to-teal-400 flex items-center justify-center">
                <GitCompare className="h-4 w-4 text-white" />
              </div>
              <div className="text-xs">
                <p className="font-semibold">{items.length}/4</p>
                <p className="text-muted-foreground">Compare</p>
              </div>
            </div>

            {/* Thumbnails */}
            <div className="flex-1 flex items-center gap-1.5 overflow-x-auto scrollbar-thin">
              {items.map((item) => (
                <div key={item.productId} className="relative flex-shrink-0 group">
                  <div className="h-10 w-10 rounded-md overflow-hidden bg-muted border border-border/40">
                    {item.imageUrl && (
                      <Image src={item.imageUrl} alt={item.name} fill className="object-cover" sizes="40px" />
                    )}
                  </div>
                  <button
                    onClick={() => remove(item.productId)}
                    className="absolute -top-1 -right-1 p-0.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    aria-label="Remove"
                  >
                    <X className="h-2.5 w-2.5" />
                  </button>
                </div>
              ))}
              {/* Empty slots */}
              {Array.from({ length: Math.max(0, 4 - items.length) }).map((_, i) => (
                <div key={`empty-${i}`} className="h-10 w-10 rounded-md border border-dashed border-border/60 flex-shrink-0" />
              ))}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={clear}
                className="text-xs text-muted-foreground hover:text-red-500 transition-colors hidden sm:inline"
              >
                Clear
              </button>
              <button
                onClick={open}
                disabled={items.length < 2}
                className="flex items-center gap-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-semibold px-3 py-2 transition-colors"
              >
                Compare Now
                <ArrowRight className="h-3 w-3" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
