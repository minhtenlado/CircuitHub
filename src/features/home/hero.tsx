'use client';

/* ============================================================
   CircuitHub — Hero section
   - Full-width with subtle PCB grid background
   - Left: tagline pill, gradient headline, CTAs, stats row
   - Right: 2×2 grid of engineering spec cards (Framer Motion)
   ============================================================ */

import { motion } from 'framer-motion';
import { useCountUp } from '@/hooks/use-count-up';
import {
  Sparkles,
  ArrowRight,
  ArrowUpRight,
  Cpu,
  Wifi,
  Layers,
  Radar,
  FileCode,
  Store,
  Boxes,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavStore } from '@/stores/nav-store';
import { useI18n } from '@/lib/i18n';

/* Floating specification cards — engineering catalog imagery with interactive discovery */
const SPEC_CARDS = [
  {
    id: 'esp32',
    name: 'ESP32-WROOM-32',
    tagKey: 'hero.specCard.devBoard',
    categorySlug: 'dev-boards',
    icon: Wifi,
    rows: [
      { label: 'Flash', value: '4 MB' },
      { label: 'Clock', value: '240 MHz' },
      { label: 'Radio', value: 'WiFi+BLE' },
    ],
    accent: 'from-cyan-500 to-cyan-400',
    delay: 0,
  },
  {
    id: 'kicad',
    name: 'KiCad 9 Project',
    tagKey: 'hero.specCard.digitalDesign',
    categorySlug: 'pcb-boards',
    icon: Layers,
    rows: [
      { label: 'Layers', value: '4-layer' },
      { label: 'Finish', value: 'ENIG' },
      { label: 'Version', value: 'v2.1.0' },
    ],
    accent: 'from-teal-500 to-cyan-400',
    delay: 0.4,
  },
  {
    id: 'bme280',
    name: 'BME280 Sensor',
    tagKey: 'hero.specCard.component',
    categorySlug: 'sensors',
    icon: Radar,
    rows: [
      { label: 'Accuracy', value: '±1 °C' },
      { label: 'Bus', value: 'I²C / SPI' },
      { label: 'Package', value: 'LGA-8' },
    ],
    accent: 'from-sky-500 to-cyan-400',
    delay: 0.8,
  },
  {
    id: 'open-source-rp2040',
    name: 'RP2040 Open Design',
    tagKey: 'hero.specCard.openSource',
    categorySlug: 'open-source',
    icon: FileCode,
    rows: [
      { label: 'License', value: 'MIT Open' },
      { label: 'CAD Tool', value: 'KiCad v9' },
      { label: 'Firmware', value: 'Open Source' },
    ],
    accent: 'from-cyan-500 to-teal-400',
    delay: 1.2,
  },
] as const;

/** Animated stat counter that counts up when scrolled into view. */
function StatCounter({
  value,
  suffix,
  icon: Icon,
  label,
  delay,
}: {
  value: number;
  suffix: string;
  icon: typeof Cpu;
  label: string;
  delay: number;
}) {
  const { ref, display } = useCountUp(value, 1500);
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay }}
      className="flex flex-col"
    >
      <span ref={ref} className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground tabular-nums">
        {display}{suffix}
      </span>
      <span className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
        <Icon className="h-3.5 w-3.5 text-cyan-500" />
        {label}
      </span>
    </motion.div>
  );
}

export function Hero() {
  const goProducts = useNavStore((s) => s.goProducts);
  const goCategory = useNavStore((s) => s.goCategory);
  const goAuth = useNavStore((s) => s.goAuth);
  const { t } = useI18n();

  const stats = [
    { label: t('hero.stats.products'), value: 2800, suffix: '+', icon: Boxes },
    { label: t('hero.stats.sellers'), value: 850, suffix: '+', icon: Store },
    { label: t('hero.stats.engineers'), value: 1200, suffix: '+', icon: Cpu },
  ];

  return (
    <section
      aria-label="Hero"
      className="relative overflow-hidden border-b border-border/60"
    >
      {/* Subtle circuit background grid */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,#0891b20a_1px,transparent_1px),linear-gradient(to_bottom,#0891b20a_1px,transparent_1px)] bg-[size:3rem_3rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_40%,#000_70%,transparent_100%)] opacity-70"
      />

      {/* Decorative cyan glow (soft and controlled) */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-32 -right-24 h-[320px] w-[320px] rounded-full bg-cyan-500/10 dark:bg-cyan-500/15 blur-[100px]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute top-40 -left-32 h-[260px] w-[260px] rounded-full bg-teal-400/10 dark:bg-teal-400/12 blur-[90px]"
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 lg:py-16">
        <div className="grid lg:grid-cols-12 gap-8 lg:gap-8 items-center">
          {/* ---------- Left column ---------- */}
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="lg:col-span-6 flex flex-col gap-5"
          >
            {/* Tagline pill */}
            <motion.span
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="inline-flex w-fit items-center gap-2 rounded-full border border-cyan-200 bg-cyan-50/80 px-3.5 py-1.5 text-xs font-semibold tracking-wider text-cyan-700 backdrop-blur dark:border-cyan-800/50 dark:bg-cyan-950/40 dark:text-cyan-400"
            >
              <Sparkles className="h-3.5 w-3.5" />
              {t('hero.tagline')}
            </motion.span>

            {/* Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.05] text-foreground">
              {t('hero.title1')}{' '}
              <span className="text-gradient-cyan">{t('hero.title2')}</span>
            </h1>

            {/* Subtitle - clean, high-contrast and easy to scan */}
            <p className="max-w-xl text-sm sm:text-base leading-relaxed text-slate-600 dark:text-slate-300 font-normal">
              {t('hero.subtitle')}
            </p>

            {/* CTAs */}
            <div className="flex flex-col gap-3">
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  onClick={() => goProducts()}
                  size="lg"
                  className="h-11 px-6 bg-gradient-to-r from-cyan-500 to-teal-400 hover:from-cyan-600 hover:to-teal-500 text-white font-semibold shadow-[0_8px_24px_-8px_rgba(6,182,212,0.65)] flex items-center gap-2"
                >
                  {t('hero.explore')}
                  <ArrowRight className="h-4 w-4" />
                </Button>
                <Button
                  onClick={() => goCategory('open-source')}
                  size="lg"
                  variant="ghost"
                  className="h-11 px-5 text-foreground/85 hover:text-foreground hover:bg-accent border border-border/70 hover:border-cyan-400/40 flex items-center gap-2"
                >
                  <FileCode className="h-4 w-4 text-cyan-500" />
                  {t('hero.communityProjects')}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground flex items-center gap-1.5 flex-wrap pt-0.5">
                <span>Bạn muốn bán linh kiện & thiết kế?</span>
                <button
                  onClick={() => goAuth('register')}
                  className="text-cyan-600 dark:text-cyan-400 hover:underline font-medium inline-flex items-center gap-0.5"
                >
                  {t('hero.sellOnCircuitHub')}
                  <ArrowRight className="h-3 w-3" />
                </button>
              </p>
            </div>

            {/* Stat row */}
            <div className="mt-1 grid grid-cols-3 gap-3 sm:gap-6 max-w-lg pt-1">
              {stats.map((s, i) => (
                <StatCounter
                  key={s.label}
                  value={s.value}
                  suffix={s.suffix}
                  icon={s.icon}
                  label={s.label}
                  delay={0.3 + i * 0.08}
                />
              ))}
            </div>
          </motion.div>

          {/* ---------- Right column: 2×2 grid of interactive spec cards ---------- */}
          <div className="lg:col-span-6 relative">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative"
            >
              {/* Glow behind cards */}
              <div
                aria-hidden
                className="absolute inset-0 m-auto h-[220px] w-[220px] rounded-full bg-cyan-400/10 dark:bg-cyan-400/15 blur-[80px]"
              />

              {/* 2×2 grid of spec cards */}
              <div className="relative grid grid-cols-2 gap-3 sm:gap-4">
                {SPEC_CARDS.map((card, i) => (
                  <SpecCard key={card.id} card={card} index={i} />
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ----------------------------------------------------------------
   SpecCard — an interactive engineering spec card that allows direct
   discovery of the corresponding category with clear visual affordances.
   ---------------------------------------------------------------- */
function SpecCard({
  card,
  index,
}: {
  card: (typeof SPEC_CARDS)[number];
  index: number;
}) {
  const Icon = card.icon;
  const goCategory = useNavStore((s) => s.goCategory);
  const { t } = useI18n();

  return (
    <motion.div
      onClick={() => goCategory(card.categorySlug)}
      initial={{ opacity: 0, y: 12 }}
      animate={{
        opacity: 1,
        y: [0, -4, 0],
      }}
      transition={{
        opacity: { duration: 0.4, delay: card.delay },
        y: {
          duration: 4 + card.delay,
          repeat: Infinity,
          ease: 'easeInOut',
          delay: card.delay,
        },
      }}
      whileHover={{ scale: 1.025, transition: { duration: 0.2 } }}
      className="group relative z-10 cursor-pointer rounded-2xl border border-border/70 dark:border-slate-800 bg-white/95 dark:bg-slate-900/90 shadow-xs backdrop-blur-sm transition-all duration-200 hover:border-cyan-400/70 dark:hover:border-cyan-500/50 hover:shadow-[0_16px_36px_-12px_rgba(6,182,212,0.35)]"
    >
      <div className="p-4 flex flex-col justify-between h-full">
        <div>
          {/* Header row */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div
                className={`flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br ${card.accent} text-white shadow-xs shrink-0 transition-transform duration-200 group-hover:scale-105`}
              >
                <Icon className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <div className="text-sm font-semibold text-foreground truncate group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">
                  {card.name}
                </div>
                <div className="text-[10px] uppercase tracking-wider text-cyan-600 dark:text-cyan-400 font-medium">
                  {t(card.tagKey)}
                </div>
              </div>
            </div>

            {/* Subtle discovery arrow on hover */}
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-cyan-50 dark:bg-cyan-950/60 text-cyan-600 dark:text-cyan-400 opacity-60 group-hover:opacity-100 group-hover:bg-cyan-100 dark:group-hover:bg-cyan-900/60 transition-all shrink-0">
              <ArrowUpRight className="h-3.5 w-3.5" />
            </span>
          </div>

          {/* Spec rows */}
          <div className="mt-3 space-y-1.5">
            {card.rows.map((r) => (
              <div
                key={r.label}
                className="flex items-center justify-between text-[11px] font-mono technical-data text-slate-700 dark:text-slate-300"
              >
                <span className="text-muted-foreground">{r.label}</span>
                <span className="font-semibold text-foreground tabular-nums">
                  {r.value}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Action discovery footer */}
        <div className="mt-3 pt-2.5 border-t border-border/40 flex items-center justify-between text-[11px] font-medium text-cyan-600 dark:text-cyan-400">
          <span>{t('hero.discoverCard')}</span>
          <span className="flex items-center gap-0.5 group-hover:translate-x-1 transition-transform">
            <ArrowRight className="h-3 w-3" />
          </span>
        </div>
      </div>
    </motion.div>
  );
}

export default Hero;
