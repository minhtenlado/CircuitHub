'use client';

/* ============================================================
   CircuitHub — Hero section
   - Full-width with subtle PCB grid background
   - Left: tagline pill, gradient headline, CTAs, stats row
   - Right: floating engineering spec cards (Framer Motion)
   ============================================================ */

import { motion } from 'framer-motion';
import { useCountUp } from '@/hooks/use-count-up';
import {
  Sparkles,
  ArrowRight,
  Cpu,
  Wifi,
  Layers,
  CircuitBoard,
  Radar,
  Wrench,
  Store,
  Boxes,
  ShieldCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavStore } from '@/stores/nav-store';

/* Floating specification cards — engineering catalog imagery */
const SPEC_CARDS = [
  {
    id: 'esp32',
    name: 'ESP32-WROOM-32',
    tag: 'Dev Board',
    icon: Wifi,
    rows: [
      { label: 'Flash', value: '4 MB' },
      { label: 'Clock', value: '240 MHz' },
      { label: 'Radio', value: 'WiFi+BLE' },
    ],
    accent: 'from-cyan-500 to-cyan-400',
    rotation: -4,
    delay: 0,
  },
  {
    id: 'kicad',
    name: 'KiCad 9 Project',
    tag: 'Digital Design',
    icon: Layers,
    rows: [
      { label: 'Layers', value: '4-layer' },
      { label: 'Finish', value: 'ENIG' },
      { label: 'Version', value: 'v2.1.0' },
    ],
    accent: 'from-teal-500 to-aqua-400',
    rotation: 3,
    delay: 0.4,
  },
  {
    id: 'bme280',
    name: 'BME280 Sensor',
    tag: 'Component',
    icon: Radar,
    rows: [
      { label: 'Accuracy', value: '±1 °C' },
      { label: 'Bus', value: 'I²C / SPI' },
      { label: 'Package', value: 'LGA-8' },
    ],
    accent: 'from-sky-500 to-cyan-400',
    rotation: -2,
    delay: 0.8,
  },
  {
    id: 'pcb-service',
    name: 'PCB Design Service',
    tag: 'Engineering',
    icon: Wrench,
    rows: [
      { label: 'Lead time', value: '14 days' },
      { label: 'Revisions', value: '3 rounds' },
      { label: 'Quote', value: 'On request' },
    ],
    accent: 'from-cyan-500 to-teal-400',
    rotation: 4,
    delay: 1.2,
  },
] as const;

const STATS = [
  { label: 'Products', value: 2800, suffix: '+', format: 'K', icon: Boxes },
  { label: 'Verified Sellers', value: 850, suffix: '+', format: '', icon: Store },
  { label: 'Engineers', value: 120000, suffix: '+', format: 'K', icon: Cpu },
];

/** Animated stat counter that counts up when scrolled into view. */
function StatCounter({ stat, delay }: { stat: typeof STATS[number]; delay: number }) {
  const { ref, display } = useCountUp(stat.value, 1500);
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay }}
      className="flex flex-col"
    >
      <span ref={ref} className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground tabular-nums">
        {display}{stat.suffix}
      </span>
      <span className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
        <stat.icon className="h-3.5 w-3.5 text-cyan-500" />
        {stat.label}
      </span>
    </motion.div>
  );
}

export function Hero() {
  const goProducts = useNavStore((s) => s.goProducts);
  const goAuth = useNavStore((s) => s.goAuth);

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
              FOR HARDWARE CREATORS
            </motion.span>

            {/* Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.05] text-foreground">
              Buy electronics.{' '}
              <span className="text-gradient-cyan">Build anything.</span>
            </h1>

            {/* Subtitle */}
            <p className="max-w-xl text-base sm:text-lg leading-relaxed text-muted-foreground">
              The modern electronics marketplace for PCB boards, dev boards,
              components, sensors, modules, and tools — plus free open source
              KiCad projects, Gerber files, and firmware for the community.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <Button
                onClick={() => goProducts()}
                size="lg"
                className="bg-gradient-to-r from-cyan-500 to-teal-400 hover:from-cyan-600 hover:to-teal-500 text-white shadow-[0_10px_32px_-10px_rgba(6,182,212,0.65)]"
              >
                Explore Marketplace
                <ArrowRight className="h-4 w-4" />
              </Button>
              <Button
                onClick={() => goAuth('register')}
                size="lg"
                variant="outline"
                className="border-cyan-300 text-cyan-700 hover:bg-cyan-50 hover:text-cyan-800"
              >
                Become a Seller
              </Button>
            </div>

            {/* Stat row */}
            <div className="mt-2 grid grid-cols-3 gap-3 sm:gap-6 max-w-lg">
              {STATS.map((s, i) => (
                <StatCounter key={s.label} stat={s} delay={0.3 + i * 0.08} />
              ))}
            </div>
          </motion.div>

          {/* ---------- Right column: floating spec cards ---------- */}
          <div className="lg:col-span-6 relative min-h-[420px] sm:min-h-[480px]">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative h-full w-full"
            >
              {/* Glow behind cards */}
              <div
                aria-hidden
                className="absolute inset-0 m-auto h-[280px] w-[280px] rounded-full bg-cyan-400/15 blur-[100px]"
              />

              {/* Card 1: ESP32 (top-left) */}
              <FloatingCard
                card={SPEC_CARDS[0]}
                className="top-2 left-0 sm:left-4 lg:left-0 w-[280px] sm:w-[300px]"
              />

              {/* Card 2: KiCad (top-right, slight overlap) */}
              <FloatingCard
                card={SPEC_CARDS[1]}
                className="top-12 right-0 sm:right-2 lg:right-0 w-[260px] sm:w-[290px]"
              />

              {/* Card 3: BME280 (bottom-left) */}
              <FloatingCard
                card={SPEC_CARDS[2]}
                className="bottom-6 left-4 sm:left-12 w-[260px] sm:w-[280px]"
              />

              {/* Card 4: PCB Service (bottom-right) */}
              <FloatingCard
                card={SPEC_CARDS[3]}
                className="bottom-0 right-4 sm:right-10 w-[270px] sm:w-[290px]"
              />

              {/* Center chip ornament */}
              <motion.div
                aria-hidden
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.6 }}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 hidden sm:flex h-16 w-16 rounded-2xl bg-gradient-to-br from-cyan-500 via-cyan-400 to-teal-400 items-center justify-center shadow-[0_10px_30px_-8px_rgba(6,182,212,0.7)] glow-cyan"
              >
                <CircuitBoard className="h-8 w-8 text-white" />
              </motion.div>

              {/* Small trust chip bottom-center */}
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.9 }}
                className="absolute -bottom-1 left-1/2 -translate-x-1/2 hidden md:flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50/90 px-3 py-1 text-[11px] font-semibold text-emerald-700 backdrop-blur"
              >
                <ShieldCheck className="h-3.5 w-3.5" />
                Spec-sheet verified · Secure download
              </motion.div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ----------------------------------------------------------------
   FloatingCard — a single "engineering specification" card with
   subtle Y oscillation and slight rotation, infinite loop.
   ---------------------------------------------------------------- */
function FloatingCard({
  card,
  className,
}: {
  card: (typeof SPEC_CARDS)[number];
  className?: string;
}) {
  const Icon = card.icon;
  return (
    <motion.div
      initial={{ opacity: 0, y: 12, rotate: card.rotation }}
      animate={{
        opacity: 1,
        y: [0, -8, 0],
        rotate: card.rotation,
      }}
      transition={{
        opacity: { duration: 0.4, delay: card.delay },
        y: {
          duration: 4 + card.delay,
          repeat: Infinity,
          ease: 'easeInOut',
          delay: card.delay,
        },
        rotate: { duration: 0.4, delay: card.delay },
      }}
      whileHover={{ scale: 1.03, transition: { duration: 0.2 } }}
      className={`absolute z-10 rounded-2xl bg-white/95 hairline shadow-[0_14px_40px_-16px_rgba(6,182,212,0.35)] backdrop-blur-sm ${className ?? ''}`}
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
                {card.tag}
              </div>
            </div>
          </div>
          <span className="text-[10px] font-mono text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-full px-2 py-0.5">
            ● live
          </span>
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
