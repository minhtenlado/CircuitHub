'use client';

/* ============================================================
   CircuitHub — Open Source Projects & Designs Section
   Spotlights free open-source hardware, KiCad projects,
   Gerber packages, and community firmware.
   ============================================================ */

import { motion } from 'framer-motion';
import {
  FileCode,
  Download,
  ExternalLink,
  Layers,
  Cpu,
  Github,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useProducts } from '@/lib/api/hooks';
import { useNavStore } from '@/stores/nav-store';
import { SectionHeader } from './categories-section';

interface FallbackProject {
  id: string;
  name: string;
  slug: string;
  shortDescription: string;
  software: string;
  license: string;
  downloads: number;
  stars: number;
  layers: number;
}

const FALLBACK_PROJECTS: FallbackProject[] = [
  {
    id: 'kicad-esp32-s3',
    name: 'ESP32-S3 AI Camera & IoT Gateway',
    slug: 'kicad-esp32-s3-ai-camera',
    shortDescription: 'Thiết kế 4-layer KiCad 9 hoàn chỉnh kèm schematic, Gerbers sẵn sàng sản xuất và firmware nhận diện khuôn mặt.',
    software: 'KiCad v9',
    license: 'CERN-OHL-P',
    downloads: 1420,
    stars: 284,
    layers: 4,
  },
  {
    id: 'stm32-flight-ctrl',
    name: 'STM32F405 Flight Controller Drone',
    slug: 'stm32f405-flight-controller',
    shortDescription: 'Bo mạch điều khiển bay mini drone 20x20mm với IMU kép BMI270, OSD tích hợp và hỗ trợ Betaflight/INAV.',
    software: 'KiCad v9',
    license: 'MIT',
    downloads: 980,
    stars: 195,
    layers: 6,
  },
  {
    id: 'usbc-pd-trigger',
    name: 'USB-C PD 100W Trigger & Power Supply',
    slug: 'usbc-pd-100w-trigger-board',
    shortDescription: 'Module nguồn lập trình USB-C Power Delivery hỗ trợ điện áp 5V-20V 5A với màn hình OLED 0.91 inch hiển thị công suất.',
    software: 'KiCad v9',
    license: 'Apache-2.0',
    downloads: 2150,
    stars: 412,
    layers: 2,
  },
  {
    id: 'rp2040-macropad',
    name: 'RP2040 Dual-Core Macro Keyboard',
    slug: 'rp2040-dual-core-macropad',
    shortDescription: 'Bàn phím cơ mini 9 phím kèm rotary encoder, LED RGB từng phím và firmware QMK / KMK mã nguồn mở.',
    software: 'KiCad v9',
    license: 'MIT',
    downloads: 1680,
    stars: 320,
    layers: 2,
  },
];

export function OpenSourceSection() {
  const goCategory = useNavStore((s) => s.goCategory);
  const goProduct = useNavStore((s) => s.goProduct);
  const { data, isLoading } = useProducts({ category: 'open-source', limit: '8' });

  // Use real open-source products from API or high-quality curated open source designs
  const liveItems = (data?.items ?? []).filter((p: any) => p.productType === 'DIGITAL');

  return (
    <section className="relative py-12 sm:py-16 lg:py-20 bg-background text-foreground border-y border-border/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <SectionHeader
            eyebrow="Cộng đồng & Mã nguồn mở"
            title="Dự án KiCad & Mã Nguồn Mở Miễn Phí"
            subtitle="Kho schematic, layout PCB KiCad/Altium, file Gerber và firmware mở do cộng đồng kỹ sư chia sẻ. Hoàn toàn miễn phí để tải về, học tập và sản xuất."
          />
          <Button
            variant="outline"
            onClick={() => goCategory('open-source')}
            className="hidden sm:inline-flex items-center gap-2 border-cyan-300 text-cyan-700 hover:bg-cyan-50 hover:text-cyan-800 self-start sm:self-auto shrink-0"
          >
            <FileCode className="h-4 w-4" />
            Xem tất cả dự án
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Project Cards Grid */}
        <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {FALLBACK_PROJECTS.map((proj, i) => (
            <motion.article
              key={proj.id}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.35, delay: i * 0.08 }}
              whileHover={{ y: -4 }}
              className="group relative flex flex-col overflow-hidden rounded-2xl border border-border/70 bg-white dark:bg-slate-900 transition-all duration-300 hover:border-cyan-300 hover:shadow-[0_18px_50px_-20px_rgba(6,182,212,0.35)]"
            >
              {/* Top Accent Strip */}
              <div className="h-1.5 w-full bg-gradient-to-r from-teal-500 via-cyan-400 to-emerald-400" />

              <div className="flex flex-col gap-3 p-5 flex-1">
                {/* Header: Icon + License */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-cyan-400 text-white shadow-sm transition-transform duration-300 group-hover:scale-105">
                    <FileCode className="h-5 w-5" />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] font-mono">
                      ✓ Open Source
                    </Badge>
                  </div>
                </div>

                {/* Title */}
                <h3
                  onClick={() => goCategory('open-source')}
                  className="cursor-pointer text-base font-semibold leading-snug text-foreground group-hover:text-cyan-600 transition-colors line-clamp-2"
                >
                  {proj.name}
                </h3>

                {/* Description */}
                <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed flex-1">
                  {proj.shortDescription}
                </p>

                {/* Tech Badges */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  <span className="inline-flex items-center gap-1 rounded-md bg-cyan-50 border border-cyan-200/80 px-2 py-0.5 text-[10px] font-medium text-cyan-700">
                    <Layers className="h-2.5 w-2.5" />
                    {proj.software}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 border border-slate-200 px-2 py-0.5 text-[10px] font-mono text-slate-700">
                    {proj.layers} Lớp
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 border border-slate-200 px-2 py-0.5 text-[10px] font-mono text-slate-600">
                    {proj.license}
                  </span>
                </div>

                {/* Download CTA */}
                <div className="pt-3 mt-2 border-t border-border/50 flex items-center justify-between">
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Download className="h-3.5 w-3.5 text-cyan-500" />
                    {proj.downloads.toLocaleString()} lượt tải
                  </span>
                  <button
                    onClick={() => goCategory('open-source')}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-cyan-600 hover:text-cyan-700 hover:underline transition-all"
                  >
                    Tải về miễn phí
                    <ArrowRight className="h-3 w-3" />
                  </button>
                </div>
              </div>
            </motion.article>
          ))}
        </div>

        {/* Mobile View All CTA */}
        <div className="mt-8 text-center sm:hidden">
          <Button
            variant="outline"
            onClick={() => goCategory('open-source')}
            className="w-full border-cyan-300 text-cyan-700 hover:bg-cyan-50"
          >
            <FileCode className="h-4 w-4 mr-2" />
            Xem tất cả dự án mã nguồn mở
          </Button>
        </div>
      </div>
    </section>
  );
}
