'use client';

/* ============================================================
   CircuitHub — Turnkey BOM & PCB Service Banner
   Specialized engineering marketplace capability:
   Instant BOM quoting & custom PCB fabrication.
   ============================================================ */

import { motion } from 'framer-motion';
import {
  FileSpreadsheet,
  Upload,
  ArrowRight,
  Layers,
  CheckCircle2,
  Cpu,
  Clock,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavStore } from '@/stores/nav-store';
import { useI18n } from '@/lib/i18n';

export function BomServiceBanner() {
  const goCategory = useNavStore((s) => s.goCategory);
  const goProducts = useNavStore((s) => s.goProducts);
  const { t } = useI18n();

  return (
    <section className="py-8 sm:py-12 border-b border-border/40 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white relative overflow-hidden">
      {/* Circuit overlay glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute -right-32 -bottom-32 h-[400px] w-[400px] rounded-full bg-cyan-500/15 blur-[120px]"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid lg:grid-cols-12 gap-8 items-center">
          {/* Left Text Column */}
          <div className="lg:col-span-7 flex flex-col gap-4">
            <div className="inline-flex items-center gap-2 w-fit rounded-full bg-cyan-500/20 border border-cyan-500/40 px-3 py-1 text-xs font-bold text-cyan-300">
              <Zap className="h-3.5 w-3.5" />
              {t('bomBanner.badge')}
            </div>

            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-white leading-tight">
              {t('bomBanner.title')}
            </h2>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-xl">
              {t('bomBanner.description')}
            </p>

            {/* Key feature points */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2">
              <div className="flex items-center gap-2 text-xs text-slate-200">
                <CheckCircle2 className="h-4 w-4 text-cyan-400 shrink-0" />
                <span>{t('bomBanner.feature1')}</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-200">
                <CheckCircle2 className="h-4 w-4 text-teal-400 shrink-0" />
                <span>{t('bomBanner.feature2')}</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-200">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                <span>{t('bomBanner.feature3')}</span>
              </div>
            </div>

            {/* CTAs */}
            <div className="flex flex-wrap items-center gap-3 pt-3">
              <Button
                onClick={() => goCategory('pcb-boards')}
                size="lg"
                className="h-10 px-5 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-400 hover:from-cyan-600 hover:to-teal-500 text-white font-bold text-xs sm:text-sm gap-2 shadow-[0_8px_20px_-6px_rgba(6,182,212,0.6)] cursor-pointer"
              >
                <Upload className="h-4 w-4" />
                {t('bomBanner.uploadBom')}
              </Button>

              <Button
                onClick={() => goCategory('pcb-boards')}
                variant="outline"
                size="lg"
                className="h-10 px-4 rounded-xl border-slate-700 bg-slate-800/80 text-slate-200 hover:bg-slate-800 hover:text-white text-xs font-semibold gap-1.5 cursor-pointer"
              >
                <Layers className="h-4 w-4 text-cyan-400" />
                {t('bomBanner.instantPcb')}
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>

          {/* Right Interactive Visual Simulation */}
          <div className="lg:col-span-5">
            <div className="rounded-2xl border border-cyan-500/30 bg-slate-900/90 p-4 shadow-xl backdrop-blur-sm">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="h-4 w-4 text-cyan-400" />
                  <span className="text-xs font-mono font-bold text-slate-200">BOM_ESP32_IoT_Project.xlsx</span>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                  Đã ghép 100% kho
                </span>
              </div>

              {/* Sample BOM rows */}
              <div className="mt-3 space-y-2 font-mono text-[11px]">
                <div className="flex items-center justify-between p-2 rounded-lg bg-slate-800/60 border border-slate-700/60">
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">01</span>
                    <span className="text-slate-200 font-semibold">ESP32-WROOM-32E (4MB)</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-slate-400">10 chiếc</span>
                    <span className="text-cyan-400 font-bold">₫650.000</span>
                  </div>
                </div>

                <div className="flex items-center justify-between p-2 rounded-lg bg-slate-800/60 border border-slate-700/60">
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">02</span>
                    <span className="text-slate-200 font-semibold">Sensor BME280 LGA-8</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-slate-400">10 chiếc</span>
                    <span className="text-cyan-400 font-bold">₫450.000</span>
                  </div>
                </div>

                <div className="flex items-center justify-between p-2 rounded-lg bg-slate-800/60 border border-slate-700/60">
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">03</span>
                    <span className="text-slate-200 font-semibold">Mạch PCB 4-Layer ENIG</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-slate-400">5 tấm</span>
                    <span className="text-cyan-400 font-bold">₫140.000</span>
                  </div>
                </div>
              </div>

              {/* Total & Instant Quote CTA */}
              <div className="mt-3 pt-3 border-t border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 block">Tổng trọn gói 3 hạng mục</span>
                  <span className="text-sm font-extrabold text-cyan-400 font-mono">₫1.240.000</span>
                </div>
                <span className="text-[10px] text-emerald-400 flex items-center gap-1">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Đóng gói ESD & Giao trong 48h
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default BomServiceBanner;
