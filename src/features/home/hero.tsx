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
  Cpu,
  Wifi,
  Layers,
  Radar,
  Wrench,
  Store,
  Boxes,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavStore } from '@/stores/nav-store';
import { useI18n } from '@/lib/i18n';

/* Floating specification cards — engineering catalog imagery */
const SPEC_CARDS = [
  {
    id: 'esp32',
    name: 'ESP32-WROOM-32',
    tagKey: 'hero.specCard.devBoard',
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
    id: 'pcb-service',
    name: 'PCB Design Service',
    tagKey: 'hero.specCard.engineering',
    icon: Wrench,
    rows: [
      { label: 'Lead time', value: '14 days' },
      { label: 'Revisions', value: '3 rounds' },
      { label: 'Quote', value: 'On request' },
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
  const goAuth = useNavStore((s) => s.goAuth);
  const { t } = useI18n();

  const stats = [
    { label: t('hero.stats.products'), value: 2800, suffix: '+', icon: Boxes },
    { label: t('hero.stats.sellers'), value: 850, suffix: '+', icon: Store },
    { label: t('hero.stats.engineers'), value: 120000, suffix: '+', icon: Cpu },
  ];

  return (
    <section
      aria-label="Hero"
      className="relative overflow-hidden border-b border-border/60"
    >
      {/* Decorative cyan glow (top-right) */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-32 -right-24 h-[420px] w-[420px] rounded-full bg-cyan-400/20 blur-[120px]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute top-40 -left-32 h-[320px] w-[320px] rounded-full bg-teal-300/20 blur-[120px]"
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-20 lg:py-24">
        <div className="grid lg:grid-cols-12 gap-10 lg:gap-8 items-center">
          {/* ---------- Left column ---------- */}
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="lg:col-span-6 flex flex-col gap-6"
          >
            {/* Tagline pill */}
            <motion.span
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="inline-flex w-fit items-center gap-2 rounded-full border border-cyan-200 bg-cyan-50/80 px-3.5 py-1.5 text-xs font-semibold tracking-wider text-cyan-700 backdrop-blur"
            >
              <Sparkles className="h-3.5 w-3.5" />
              {t('hero.tagline')}
            </motion.span>

            {/* Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.05] text-foreground">
              {t('hero.title1')}{' '}
              <span className="text-gradient-cyan">{t('hero.title2')}</span>
            </h1>

            {/* Subtitle */}
            <p className="max-w-xl text-base sm:text-lg leading-relaxed text-muted-foreground">
              {t('hero.subtitle')}
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <Button
                onClick={() => goProducts()}
                size="lg"
                className="bg-gradient-to-r from-cyan-500 to-teal-400 hover:from-cyan-600 hover:to-teal-500 text-white shadow-[0_10px_32px_-10px_rgba(6,182,212,0.65)]"
              >
                {t('hero.explore')}
                <ArrowRight className="h-4 w-4" />
              </Button>
              <Button
                onClick={() => goAuth('register')}
                size="lg"
                variant="outline"
                className="border-cyan-300 text-cyan-700 hover:bg-cyan-50 hover:text-cyan-800"
              >
                {t('hero.becomeSeller')}
              </Button>
            </div>

            {/* Stat row */}
            <div className="mt-2 grid grid-cols-3 gap-3 sm:gap-6 max-w-lg">
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

          {/* ---------- Right column: 2×2 grid of spec cards ---------- */}
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
                className="absolute inset-0 m-auto h-[280px] w-[280px] rounded-full bg-cyan-400/15 blur-[100px]"
              />

              {/* 2×2 grid of spec cards (single column on mobile, 2 cols sm+) */}
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
   SpecCard — a single engineering specification card with subtle
   Y oscillation (4px amplitude) and a gentle hover lift. No rotation.
   ---------------------------------------------------------------- */
function SpecCard({
  card,
  index,
}: {
  card: (typeof SPEC_CARDS)[number];
  index: number;
}) {
  const Icon = card.icon;
  const { t } = useI18n();
  return (
    <motion.div
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
      whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
      className="relative z-10 rounded-2xl bg-white/95 hairline shadow-sm backdrop-blur-sm transition-shadow duration-200 hover:shadow-[0_14px_40px_-16px_rgba(6,182,212,0.35)]"
    >
      <div className="p-4">
        {/* Header row */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className={`flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br ${card.accent} text-white shadow-sm shrink-0`}
            >
              <Icon className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <div className="text-sm font-semibold text-foreground truncate">
                {card.name}
              </div>
              <div className="text-[10px] uppercase tracking-wider text-cyan-600 font-medium">
                {t(card.tagKey)}
              </div>
            </div>
          </div>
        </div>

        {/* Spec rows */}
        <div className="mt-3 space-y-1.5">
          {card.rows.map((r) => (
            <div
              key={r.label}
              className="flex items-center justify-between text-[11px] font-mono technical-data text-slate-700"
            >
              <span className="text-muted-foreground">{r.label}</span>
              <span className="font-semibold text-foreground tabular-nums">
                {r.value}
              </span>
            </div>
          ))}
        </div>

        {/* Footer accent line */}
        <div className="mt-3 h-1 w-full rounded-full bg-gradient-to-r from-cyan-500/80 via-teal-400/60 to-transparent" />
      </div>
    </motion.div>
  );
}

export default Hero;
