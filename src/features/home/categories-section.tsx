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
type CatEntry = {
  slug: string;
  /** i18n key under `categories.*` */
  labelKey: string;
  icon: typeof CircuitBoard;
  accent: string;
};

const CATEGORIES: CatEntry[] = [
  { slug: 'dev-boards', labelKey: 'categories.devBoards', icon: CircuitBoard, accent: 'from-cyan-500 to-cyan-400' },
  { slug: 'pcb-boards', labelKey: 'categories.pcbBoards', icon: Layers, accent: 'from-teal-500 to-cyan-400' },
  { slug: 'components', labelKey: 'categories.components', icon: Cpu, accent: 'from-cyan-500 to-teal-400' },
  { slug: 'sensors', labelKey: 'categories.sensors', icon: Radar, accent: 'from-sky-500 to-cyan-400' },
  { slug: 'modules', labelKey: 'categories.modules', icon: Box, accent: 'from-cyan-500 to-aqua-400' },
  { slug: 'tools', labelKey: 'categories.tools', icon: Wrench, accent: 'from-teal-500 to-aqua-400' },
  { slug: 'open-source', labelKey: 'categories.openSource', icon: FileCode, accent: 'from-cyan-500 to-teal-400' },
  { slug: 'gerber-files', labelKey: 'categories.gerberFiles', icon: FileArchive, accent: 'from-teal-500 to-cyan-400' },
  { slug: 'firmware', labelKey: 'categories.firmware', icon: Binary, accent: 'from-cyan-500 to-cyan-400' },
];

export function CategoriesSection() {
  const goCategory = useNavStore((s) => s.goCategory);
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
    <section className="relative py-12 sm:py-16 lg:py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <SectionHeader
          eyebrow={t('categories.eyebrow')}
          title={t('categories.title')}
          subtitle={t('categories.subtitle')}
        />

        {/* Grid */}
        <div className="mt-10 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
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
              <motion.button
                key={cat.slug}
                onClick={() => goCategory(cat.slug)}
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ duration: 0.35, delay: Math.min(i * 0.04, 0.4) }}
                whileHover={{ y: -4 }}
                className="group relative flex flex-col items-start gap-3 rounded-2xl border border-border/70 bg-card dark:bg-slate-900 p-4 sm:p-5 text-left transition-all duration-300 hover:border-cyan-300 dark:hover:border-cyan-600 hover:shadow-[0_14px_40px_-16px_rgba(6,182,212,0.4)]"
              >
                {/* Icon tile */}
                <div
                  className={`relative flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${cat.accent} text-white shadow-[0_8px_18px_-8px_rgba(6,182,212,0.5)] transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3`}
                >
                  <Icon className="h-6 w-6" />
                </div>

                {/* Name + count */}
                <div className="flex flex-col gap-0.5 min-w-0">
                  <span className="font-semibold text-foreground text-sm sm:text-base leading-tight truncate">
                    {t(cat.labelKey)}
                  </span>
                  <span className="text-[11px] text-muted-foreground tabular-nums">
                    {countLabel}
                  </span>
                </div>

                {/* Hover arrow */}
                <span className="absolute top-3 right-3 flex h-7 w-7 items-center justify-center rounded-full bg-cyan-50 text-cyan-600 dark:bg-cyan-950/50 dark:text-cyan-400 opacity-0 -translate-x-1 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0">
                  <ArrowUpRight className="h-4 w-4" />
                </span>
              </motion.button>
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
