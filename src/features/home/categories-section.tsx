'use client';

/* ============================================================
   CircuitHub — Explore Categories grid
   - Static category manifest merged with live `_count` from API
   - Each card: large cyan-gradient icon tile, name, product count
   - Hover lift + goCategory(slug) navigation
   ============================================================ */

import { motion } from 'framer-motion';
import {
  CircuitBoard,
  Layers,
  Cpu,
  Radar,
  Box,
  Wrench,
  FileCode,
  FileArchive,
  Binary,
  Cog,
  ArrowUpRight,
} from 'lucide-react';
import { useCategories } from '@/lib/api/hooks';
import { useNavStore } from '@/stores/nav-store';
import { useI18n } from '@/lib/i18n';

/* Static manifest — slug, i18n key, Lucide icon, gradient accent */
interface CatEntry {
  slug: string;
  labelKey: string;
  icon: typeof CircuitBoard;
  accent: string;
  hotTags: string[];
}

const CATEGORIES: CatEntry[] = [
  { slug: 'dev-boards', labelKey: 'categories.devBoards', icon: CircuitBoard, accent: 'from-cyan-500 to-cyan-400', hotTags: ['ESP32', 'STM32', 'RP2040'] },
  { slug: 'pcb-boards', labelKey: 'categories.pcbBoards', icon: Layers, accent: 'from-teal-500 to-cyan-400', hotTags: ['4-Lớp', 'KiCad 9', 'Gerber'] },
  { slug: 'components', labelKey: 'categories.components', icon: Cpu, accent: 'from-cyan-500 to-teal-400', hotTags: ['IC Nguồn', 'Mosfet', 'Diode'] },
  { slug: 'sensors', labelKey: 'categories.sensors', icon: Radar, accent: 'from-sky-500 to-cyan-400', hotTags: ['BME280', 'MPU6050', 'SHT40'] },
  { slug: 'modules', labelKey: 'categories.modules', icon: Box, accent: 'from-cyan-500 to-aqua-400', hotTags: ['OLED 0.96"', 'Relay', 'Sạc pin'] },
  { slug: 'tools', labelKey: 'categories.tools', icon: Wrench, accent: 'from-teal-500 to-aqua-400', hotTags: ['Đồng hồ VOM', 'Mỏ hàn T12'] },
  { slug: 'open-source', labelKey: 'categories.openSource', icon: FileCode, accent: 'from-cyan-500 to-teal-400', hotTags: ['Hardware', 'Open Design'] },
  { slug: 'gerber-files', labelKey: 'categories.gerberFiles', icon: FileArchive, accent: 'from-teal-500 to-cyan-400', hotTags: ['Bo sạc', 'Nguồn xung'] },
  { slug: 'firmware', labelKey: 'categories.firmware', icon: Binary, accent: 'from-cyan-500 to-cyan-400', hotTags: ['ESP-IDF', 'MicroPython'] },
];

export function CategoriesSection() {
  const goCategory = useNavStore((s) => s.goCategory);
  const goProducts = useNavStore((s) => s.goProducts);
  const { data, isLoading } = useCategories();
  const { t } = useI18n();

  /* Build count map: slug -> product count (from API tree, includes children count) */
  const countMap = new Map<string, number>();
  if (Array.isArray(data)) {
    for (const c of data) {
      const total = (c._count?.products ?? 0) + (c.children ?? []).reduce(
        (acc: number, ch: any) => acc + (ch._count?.products ?? 0),
        0,
      );
      countMap.set(c.slug, total);
    }
  }

  return (
    <section className="relative pt-8 pb-10 sm:pt-10 sm:pb-14 border-b border-border/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <SectionHeader
          eyebrow={t('categories.eyebrow')}
          title={t('categories.title')}
          subtitle={t('categories.subtitle')}
        />

        {/* Grid */}
        <div className="mt-6 sm:mt-8 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
          {CATEGORIES.map((cat, i) => {
            const Icon = cat.icon;
            const count = countMap.get(cat.slug);
            const productsLabel = t('categories.countProducts');
            const countLabel =
              isLoading
                ? `— ${productsLabel}`
                : count !== undefined
                  ? `${count.toLocaleString('vi-VN')} ${productsLabel}`
                  : `${count ?? 0} ${productsLabel}`;

            return (
              <motion.div
                key={cat.slug}
                onClick={() => goCategory(cat.slug)}
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ duration: 0.35, delay: Math.min(i * 0.04, 0.4) }}
                whileHover={{ y: -3 }}
                className="group relative flex flex-col justify-between rounded-2xl border border-border/70 bg-card dark:bg-slate-900 p-4 text-left transition-all duration-300 hover:border-cyan-400/60 dark:hover:border-cyan-500/50 hover:shadow-[0_12px_32px_-12px_rgba(6,182,212,0.3)] cursor-pointer"
              >
                <div>
                  <div className="flex items-start justify-between">
                    {/* Icon tile */}
                    <div
                      className={`flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${cat.accent} text-white shadow-xs transition-transform duration-300 group-hover:scale-105 group-hover:rotate-2`}
                    >
                      <Icon className="h-5 w-5" />
                    </div>

                    {/* Hover arrow */}
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-cyan-50 text-cyan-600 dark:bg-cyan-950/50 dark:text-cyan-400 opacity-70 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all">
                      <ArrowUpRight className="h-3.5 w-3.5" />
                    </span>
                  </div>

                  {/* Name + count */}
                  <div className="mt-3 flex flex-col gap-0.5 min-w-0">
                    <span className="font-bold text-foreground text-sm leading-tight truncate group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">
                      {t(cat.labelKey)}
                    </span>
                    <span className="text-[11px] text-muted-foreground tabular-nums font-mono">
                      {countLabel}
                    </span>
                  </div>
                </div>

                {/* Hot component tags for immediate discovery */}
                <div className="mt-3 pt-2.5 border-t border-border/40 flex flex-wrap gap-1">
                  {cat.hotTags.map((tag) => (
                    <span
                      key={tag}
                      onClick={(e) => {
                        e.stopPropagation();
                        goProducts({ q: tag });
                      }}
                      className="inline-block text-[10px] px-1.5 py-0.5 rounded bg-muted/60 text-muted-foreground hover:text-cyan-600 dark:hover:text-cyan-400 hover:bg-cyan-50 dark:hover:bg-cyan-950/40 font-mono transition-colors"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ---------------- Section header helper ---------------- */
export function SectionHeader({
  eyebrow,
  title,
  subtitle,
  action,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.4 }}
      className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4"
    >
      <div className="flex flex-col gap-2 max-w-2xl">
        {eyebrow && (
          <span className="text-xs font-semibold tracking-wider text-cyan-600 uppercase">
            {eyebrow}
          </span>
        )}
        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-foreground">
          {title}
        </h2>
        {subtitle && (
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
            {subtitle}
          </p>
        )}
      </div>
      {action}
    </motion.div>
  );
}

export default CategoriesSection;
