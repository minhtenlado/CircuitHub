'use client';

/* ============================================================
   CircuitHub — Trust section
   Distinct from the footer's trust mini-cards.
   - Big stats bar (4 metrics)
   - 3 trust pillars (Cpu, ShieldCheck, Award)
   - Uses a cyan gradient hero panel + PCB-grid background
   ============================================================ */

import { motion } from 'framer-motion';
import {
  Cpu,
  ShieldCheck,
  Award,
  TrendingUp,
  Download,
  Star,
  Clock,
  CheckCircle2,
} from 'lucide-react';

const STATS = [
  { label: 'GMV processed', value: '₫8.2B+', icon: TrendingUp, sub: 'Gross marketplace volume' },
  { label: 'Downloads', value: '1.2M+', icon: Download, sub: 'Digital products delivered' },
  { label: 'Avg rating', value: '4.9/5', icon: Star, sub: 'Across 24K+ reviews' },
  { label: 'On-time delivery', value: '97%', icon: Clock, sub: 'Shipped & delivered on schedule' },
] as const;

const PILLARS = [
  {
    icon: Cpu,
    title: 'Technical verification',
    body: 'Every product is spec-sheet reviewed — pin counts, voltage rails, package outlines, and stack-ups are validated by engineers before listing goes live.',
    accent: 'from-cyan-500 to-cyan-400',
    points: ['Spec-sheet verification', 'Stack-up & layer check', 'DFM rule pass'],
  },
  {
    icon: ShieldCheck,
    title: 'Secure download license system',
    body: 'Signed download URLs, per-customer licenses, and revocation tracking keep digital assets protected across PERSONAL, COMMERCIAL, and EXTENDED_COMMERCIAL tiers.',
    accent: 'from-teal-500 to-aqua-400',
    points: ['Per-license signing', 'Revocation & audit trail', 'License tier enforcement'],
  },
  {
    icon: Award,
    title: 'Engineering-grade quality',
    body: 'Verified studios only — with response-rate, on-time delivery, and revision discipline tracked publicly on every shop profile.',
    accent: 'from-sky-500 to-cyan-400',
    points: ['Verified seller program', 'Public quality metrics', 'Quality-driven ranking'],
  },
] as const;

export function TrustSection() {
  return (
    <section className="relative py-12 sm:py-16 lg:py-20 overflow-hidden">
      {/* Cyan glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 h-[300px] w-[800px] rounded-full bg-cyan-300/20 blur-[120px]"
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Stats panel */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.45 }}
          className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-cyan-500 via-cyan-500 to-teal-400 text-white shadow-[0_24px_70px_-24px_rgba(6,182,212,0.65)]"
        >
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-px">
            {STATS.map((s, i) => {
              const Icon = s.icon;
              return (
                <motion.div
                  key={s.label}
                  initial={{ opacity: 0, y: 8 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-50px' }}
                  transition={{ duration: 0.35, delay: i * 0.08 }}
                  className="relative p-6 sm:p-8 flex flex-col gap-2 text-center sm:text-left"
                >
                  <div className="flex items-center justify-center sm:justify-start gap-2 text-white/80">
                    <Icon className="h-4 w-4" />
                    <span className="text-[11px] uppercase tracking-wider font-medium">
                      {s.label}
                    </span>
                  </div>
                  <span className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight tabular-nums">
                    {s.value}
                  </span>
                  <span className="text-[11px] text-white/70 leading-relaxed">
                    {s.sub}
                  </span>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* Pillars */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          {PILLARS.map((p, i) => {
            const Icon = p.icon;
            return (
              <motion.div
                key={p.title}
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ duration: 0.4, delay: i * 0.08 }}
                whileHover={{ y: -4 }}
                className="group relative flex flex-col gap-4 rounded-2xl border border-border/70 bg-white p-6 transition-all duration-300 hover:border-cyan-300 hover:shadow-[0_18px_50px_-20px_rgba(6,182,212,0.35)]"
              >
                {/* Icon */}
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${p.accent} text-white shadow-[0_8px_18px_-8px_rgba(6,182,212,0.5)] transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-3`}
                >
                  <Icon className="h-6 w-6" />
                </div>

                <div className="flex flex-col gap-2">
                  <h3 className="text-lg font-semibold text-foreground leading-tight">
                    {p.title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {p.body}
                  </p>
                </div>

                {/* Points */}
                <ul className="mt-auto flex flex-col gap-1.5">
                  {p.points.map((pt) => (
                    <li
                      key={pt}
                      className="flex items-center gap-2 text-xs text-foreground"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5 text-cyan-500 shrink-0" />
                      <span>{pt}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default TrustSection;
