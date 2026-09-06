'use client';

/* ============================================================
   CircuitHub — Hero section
   - Full-width with subtle PCB grid background
   - Left: tagline pill, gradient headline, CTAs, stats row
   - Right: 2×2 grid of engineering spec cards (Framer Motion)
   ============================================================ */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRight,
  ChevronRight,
  ChevronLeft,
  Flame,
  Zap,
  Shield,
  Truck,
  RotateCcw,
  PackageCheck,
  ShoppingCart,
  Star,
  CircuitBoard,
  Layers,
  Radar,
  Cpu,
  Box,
  Wrench,
  FileCode,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNavStore } from '@/stores/nav-store';
import { useCartStore } from '@/stores/cart-store';
import { useToast } from '@/hooks/use-toast';
import { useI18n } from '@/lib/i18n';
import { formatVND } from '@/lib/format';

/* ----------------------------------------------------------------
   PROMOTIONAL CAROUSEL BANNERS
   ---------------------------------------------------------------- */
const BANNERS = [
  {
    id: 'esp32-kit',
    eyebrow: '⚡ COMBO KHUYẾN MẠI TUẦN NÀY',
    title: 'Kit Học Tập IoT ESP32-S3 Pro Kèm Màn Hình 1.9" TFT',
    description:
      'Đầy đủ cảm biến nhiệt ẩm SHT40, relay 5V, sơ đồ nguyên lý KiCad 9 & mã nguồn mẫu. Ưu đãi 25% cho sinh viên & kỹ sư maker.',
    priceBadge: 'Chỉ từ ₫285.000',
    ctaText: 'Mua ngay combo',
    category: 'dev-boards',
    query: 'ESP32',
    accent: 'from-cyan-950/80 via-slate-900 to-slate-950',
    glowColor: 'bg-cyan-500/20',
    tag: 'Bán chạy nhất',
  },
  {
    id: 'pcb-service',
    eyebrow: '🛠️ DỊCH VỤ GIA CÔNG TRỌN GÓI',
    title: 'Gia Công Mạch In PCB 4 Lớp & Mua Linh Kiện Trọn Bộ',
    description:
      'Kiểm định DFM tự động, chuẩn hóa mã linh kiện theo file BOM. Cam kết bo mạch test 100% E-test trước khi giao hàng.',
    priceBadge: 'Chỉ từ ₫120.000 / 5 tấm',
    ctaText: 'Báo giá nhanh PCB',
    category: 'pcb-boards',
    query: '',
    accent: 'from-teal-950/80 via-slate-900 to-slate-950',
    glowColor: 'bg-teal-500/20',
    tag: 'Dịch vụ Hot',
  },
  {
    id: 'open-source-hub',
    eyebrow: '🎁 KHO DỰ ÁN CỘNG ĐỒNG KỸ THUẬT',
    title: '500+ Dự Án KiCad, Gerber & Firmware Miễn Phí',
    description:
      'Tải ngay thiết kế mạch nguồn xung, bo điều khiển BLDC, đồng hồ LED RGB... Đã thẩm định thông số, tải file về gia công được ngay.',
    priceBadge: '100% Miễn phí tải',
    ctaText: 'Khám phá dự án',
    category: 'open-source',
    query: '',
    accent: 'from-blue-950/80 via-slate-900 to-slate-950',
    glowColor: 'bg-blue-500/20',
    tag: 'Mã nguồn mở',
  },
];

/* ----------------------------------------------------------------
   SIDEBAR CATEGORIES
   ---------------------------------------------------------------- */
const SIDEBAR_CATEGORIES = [
  {
    slug: 'dev-boards',
    name: 'Bo phát triển & MCU',
    icon: CircuitBoard,
    hotTags: ['ESP32-S3', 'STM32F4', 'RP2040'],
  },
  {
    slug: 'sensors',
    name: 'Module & Cảm biến',
    icon: Radar,
    hotTags: ['BME280', 'MPU6050', 'SHT40'],
  },
  {
    slug: 'pcb-boards',
    name: 'Mạch in PCB & KiCad',
    icon: Layers,
    hotTags: ['4-Layer', 'Gerber', 'KiCad 9'],
  },
  {
    slug: 'components',
    name: 'Linh kiện & Bán dẫn',
    icon: Cpu,
    hotTags: ['IC Nguồn', 'Mosfet', 'Opto'],
  },
  {
    slug: 'modules',
    name: 'Module chức năng',
    icon: Box,
    hotTags: ['OLED 0.96"', 'Relay', 'Sạc pin'],
  },
  {
    slug: 'tools',
    name: 'Dụng cụ đo kiểm & Hàn',
    icon: Wrench,
    hotTags: ['Đồng hồ VOM', 'Mỏ hàn T12'],
  },
  {
    slug: 'open-source',
    name: 'Dự án mã nguồn mở',
    icon: FileCode,
    hotTags: ['Hardware', 'Free KiCad'],
  },
];

export function Hero() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [timeLeft, setTimeLeft] = useState({ hours: 4, minutes: 28, seconds: 15 });
  const goProducts = useNavStore((s) => s.goProducts);
  const goCategory = useNavStore((s) => s.goCategory);
  const goProduct = useNavStore((s) => s.goProduct);
  const cart = useCartStore();
  const { toast } = useToast();
  const { t } = useI18n();

  /* Auto-rotate banner every 6s */
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % BANNERS.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  /* Countdown timer simulation */
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
        if (prev.minutes > 0) return { ...prev, minutes: 59, seconds: 59 };
        if (prev.hours > 0) return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        return { hours: 4, minutes: 0, seconds: 0 };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const slide = BANNERS[currentSlide];

  function handleAddFlashDeal() {
    cart.addItem({
      productId: 'flash-deal-esp32',
      slug: 'esp32-wroom-32-module',
      name: 'Bo mạch ESP32-WROOM-32E Wi-Fi / BLE 4MB Flash',
      imageUrl: '/logo.svg',
      price: 65000,
      productType: 'PHYSICAL',
      shopId: 'circuit-official',
      shopName: 'CircuitHub Official Store',
    });
    toast({
      title: 'Đã thêm vào giỏ hàng!',
      description: 'Bo mạch ESP32-WROOM-32E (₫65.000) — Deal chớp nhoáng',
    });
  }

  return (
    <section aria-label="Electronics Marketplace Hero" className="relative border-b border-border/60 bg-background/50">
      {/* Subtle circuit background grid */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,#0891b20a_1px,transparent_1px),linear-gradient(to_bottom,#0891b20a_1px,transparent_1px)] bg-[size:3rem_3rem] [mask-image:radial-gradient(ellipse_70%_60%_at_50%_30%,#000_70%,transparent_100%)] opacity-70"
      />

      <div className="relative mx-auto max-w-screen-2xl px-3 sm:px-4 lg:px-6 pt-3 sm:pt-4 pb-6 sm:pb-8">
        {/* ============================================================
            3-COLUMN COMMERCE HERO GRID
            ============================================================ */}
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-12 lg:gap-4 items-stretch">
          
          {/* 1. LEFT COLUMN: CATEGORY QUICK MENU (Desktop lg+) */}
          <div className="hidden lg:col-span-3 lg:flex flex-col rounded-2xl border border-border/70 bg-card p-3 shadow-xs">
            <div className="flex items-center justify-between pb-2.5 mb-1.5 border-b border-border/50">
              <span className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-2">
                <CircuitBoard className="h-4 w-4 text-cyan-500" />
                Danh mục linh kiện
              </span>
              <button
                onClick={() => goProducts()}
                className="text-[11px] text-cyan-600 dark:text-cyan-400 hover:underline font-medium cursor-pointer"
              >
                Tất cả →
              </button>
            </div>

            <ul className="flex flex-col gap-1 flex-1 justify-between">
              {SIDEBAR_CATEGORIES.map((cat) => {
                const Icon = cat.icon;
                return (
                  <li key={cat.slug}>
                    <div
                      onClick={() => goCategory(cat.slug)}
                      className="group flex flex-col p-2 rounded-xl cursor-pointer hover:bg-cyan-50/80 dark:hover:bg-cyan-950/40 border border-transparent hover:border-cyan-500/20 transition-all"
                    >
                      <div className="flex items-center justify-between text-xs font-semibold text-foreground group-hover:text-cyan-600 dark:group-hover:text-cyan-400">
                        <div className="flex items-center gap-2">
                          <Icon className="h-3.5 w-3.5 text-muted-foreground group-hover:text-cyan-500" />
                          <span>{cat.name}</span>
                        </div>
                        <ChevronRight className="h-3 w-3 text-muted-foreground/50 group-hover:text-cyan-500 group-hover:translate-x-0.5 transition-all" />
                      </div>

                      {/* Hot component tags */}
                      <div className="mt-1 flex flex-wrap gap-1 pl-5.5">
                        {cat.hotTags.map((tag) => (
                          <span
                            key={tag}
                            onClick={(e) => {
                              e.stopPropagation();
                              goProducts({ q: tag });
                            }}
                            className="text-[10px] text-muted-foreground/80 hover:text-cyan-600 dark:hover:text-cyan-300 font-mono hover:underline cursor-pointer"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* 2. CENTER COLUMN: PROMOTIONAL HERO BANNER CAROUSEL */}
          <div className="lg:col-span-6 relative flex flex-col justify-between overflow-hidden rounded-2xl border border-border/70 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 p-6 sm:p-8 text-white shadow-md min-h-[360px] sm:min-h-[400px]">
            {/* Background Glow */}
            <div
              aria-hidden
              className={`pointer-events-none absolute -right-20 -top-20 h-[300px] w-[300px] rounded-full blur-[100px] transition-colors duration-1000 ${slide.glowColor}`}
            />

            {/* Banner Content (Animated via AnimatePresence) */}
            <AnimatePresence mode="wait">
              <motion.div
                key={slide.id}
                initial={{ opacity: 0, x: 15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -15 }}
                transition={{ duration: 0.35 }}
                className="relative z-10 flex flex-col gap-3.5 flex-1"
              >
                {/* Eyebrow badge */}
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-cyan-500/20 border border-cyan-500/40 px-3 py-1 text-xs font-semibold tracking-wide text-cyan-300 backdrop-blur-sm">
                    {slide.eyebrow}
                  </span>
                  <Badge className="bg-amber-500/20 border-amber-500/40 text-amber-300 text-[10px] font-bold">
                    {slide.tag}
                  </Badge>
                </div>

                {/* Main Headline */}
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight leading-[1.15] text-white max-w-xl">
                  {slide.title}
                </h1>

                {/* Subtitle */}
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-lg">
                  {slide.description}
                </p>

                {/* Price pill & CTA Buttons */}
                <div className="mt-auto pt-4 flex flex-wrap items-center gap-3">
                  <div className="flex flex-col">
                    <span className="text-[10px] uppercase text-slate-400 tracking-wider">Giá ưu đãi</span>
                    <span className="text-lg sm:text-xl font-bold text-cyan-400 font-mono">
                      {slide.priceBadge}
                    </span>
                  </div>

                  <Button
                    onClick={() => {
                      if (slide.category) goCategory(slide.category);
                      else goProducts({ q: slide.query });
                    }}
                    size="lg"
                    className="h-10 px-5 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-400 hover:from-cyan-600 hover:to-teal-500 text-white font-bold text-xs sm:text-sm shadow-[0_8px_20px_-6px_rgba(6,182,212,0.6)] gap-1.5 cursor-pointer"
                  >
                    <span>{slide.ctaText}</span>
                    <ArrowRight className="h-4 w-4" />
                  </Button>

                  <Button
                    onClick={() => goProducts()}
                    variant="outline"
                    size="sm"
                    className="h-10 px-3.5 rounded-xl border-slate-700 bg-slate-800/60 text-slate-300 hover:bg-slate-800 hover:text-white text-xs cursor-pointer"
                  >
                    Xem sản phẩm khác
                  </Button>
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Slider Controls Bottom */}
            <div className="relative z-10 mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
              {/* Slide dots */}
              <div className="flex items-center gap-1.5">
                {BANNERS.map((b, i) => (
                  <button
                    key={b.id}
                    onClick={() => setCurrentSlide(i)}
                    aria-label={`Slide ${i + 1}`}
                    className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                      i === currentSlide ? 'w-6 bg-cyan-400' : 'w-2 bg-slate-700 hover:bg-slate-500'
                    }`}
                  />
                ))}
              </div>

              {/* Prev / Next Arrows */}
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCurrentSlide((prev) => (prev - 1 + BANNERS.length) % BANNERS.length)}
                  aria-label="Previous slide"
                  className="h-7 w-7 rounded-lg bg-slate-800/80 hover:bg-slate-700 flex items-center justify-center text-slate-300 hover:text-white transition-colors cursor-pointer"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setCurrentSlide((prev) => (prev + 1) % BANNERS.length)}
                  aria-label="Next slide"
                  className="h-7 w-7 rounded-lg bg-slate-800/80 hover:bg-slate-700 flex items-center justify-center text-slate-300 hover:text-white transition-colors cursor-pointer"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          {/* 3. RIGHT COLUMN: DAILY FLASH DEAL WIDGET */}
          <div className="lg:col-span-3 flex flex-col justify-between rounded-2xl border border-amber-500/40 bg-gradient-to-b from-amber-500/5 via-card to-card p-4 shadow-xs">
            {/* Header: Flash deal + countdown */}
            <div>
              <div className="flex items-center justify-between pb-2 border-b border-border/60">
                <span className="flex items-center gap-1.5 text-xs font-bold text-amber-500 uppercase tracking-wider">
                  <Flame className="h-4 w-4 animate-bounce" />
                  Deal chớp nhoáng
                </span>
                <span className="text-[10px] font-semibold rounded px-1.5 py-0.5 bg-rose-500/10 text-rose-500 border border-rose-500/20">
                  -24%
                </span>
              </div>

              {/* Countdown ticker */}
              <div className="mt-2.5 flex items-center justify-between bg-amber-500/10 dark:bg-amber-950/30 rounded-lg p-2 border border-amber-500/20">
                <span className="text-[11px] font-medium text-amber-600 dark:text-amber-400">Kết thúc trong:</span>
                <div className="flex items-center gap-1 font-mono text-xs font-bold text-amber-500">
                  <span className="rounded bg-card px-1.5 py-0.5 shadow-xs border border-border/60">
                    {String(timeLeft.hours).padStart(2, '0')}
                  </span>
                  :
                  <span className="rounded bg-card px-1.5 py-0.5 shadow-xs border border-border/60">
                    {String(timeLeft.minutes).padStart(2, '0')}
                  </span>
                  :
                  <span className="rounded bg-card px-1.5 py-0.5 shadow-xs border border-border/60">
                    {String(timeLeft.seconds).padStart(2, '0')}
                  </span>
                </div>
              </div>

              {/* Flash Product Card */}
              <div
                onClick={() => goProduct('esp32-wroom-32-module')}
                className="mt-3 group cursor-pointer"
              >
                {/* Product Image */}
                <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-slate-900/60 border border-border/50 flex items-center justify-center">
                  <div className="flex flex-col items-center justify-center p-4 text-center">
                    <CircuitBoard className="h-16 w-16 text-cyan-400 group-hover:scale-105 transition-transform" />
                    <span className="text-[11px] font-mono text-cyan-300 mt-1">ESP32-WROOM-32E</span>
                  </div>
                  <span className="absolute top-2 left-2 rounded-md bg-emerald-500 text-white font-bold text-[10px] px-1.5 py-0.5">
                    SẴN HÀNG
                  </span>
                </div>

                {/* Product Title & Rating */}
                <h3 className="mt-2.5 text-xs sm:text-sm font-bold text-foreground line-clamp-2 group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">
                  Bo mạch ESP32-WROOM-32E Wi-Fi / BLE 4MB Flash Chuẩn Công Nghiệp
                </h3>

                <div className="mt-1 flex items-center gap-1.5 text-[11px] text-muted-foreground">
                  <span className="flex items-center text-amber-500 font-bold">
                    <Star className="h-3 w-3 fill-amber-500 mr-0.5" />
                    4.9
                  </span>
                  <span>(182 đánh giá)</span>
                </div>

                {/* Price block */}
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-base sm:text-lg font-extrabold text-cyan-600 dark:text-cyan-400">
                    {formatVND(65000)}
                  </span>
                  <span className="text-xs text-muted-foreground line-through">
                    {formatVND(85000)}
                  </span>
                </div>

                {/* Inventory progress bar */}
                <div className="mt-2">
                  <div className="flex justify-between text-[10px] font-medium text-muted-foreground mb-1">
                    <span>Đã bán 42 sản phẩm</span>
                    <span className="text-rose-500 font-semibold">Chỉ còn 8</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-amber-500 to-rose-500 rounded-full w-[84%]" />
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Action Button */}
            <div className="mt-3.5 pt-2 border-t border-border/50">
              <Button
                onClick={handleAddFlashDeal}
                className="w-full h-9 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold text-xs gap-1.5 shadow-sm cursor-pointer"
              >
                <ShoppingCart className="h-3.5 w-3.5" />
                Thêm vào giỏ hàng
              </Button>
            </div>
          </div>
        </div>

        {/* ============================================================
            4. BOTTOM BAR: E-COMMERCE VALUE ASSURANCE STRIP
            ============================================================ */}
        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-3">
          <div className="flex items-center gap-3 p-3 rounded-xl border border-border/70 bg-card/80 shadow-xs">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400">
              <Truck className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-foreground truncate">{t('commerceTrust.shipTitle')}</div>
              <div className="text-[11px] text-muted-foreground truncate">{t('commerceTrust.shipDesc')}</div>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-xl border border-border/70 bg-card/80 shadow-xs">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Shield className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-foreground truncate">{t('commerceTrust.qualityTitle')}</div>
              <div className="text-[11px] text-muted-foreground truncate">{t('commerceTrust.qualityDesc')}</div>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-xl border border-border/70 bg-card/80 shadow-xs">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <RotateCcw className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-foreground truncate">{t('commerceTrust.returnTitle')}</div>
              <div className="text-[11px] text-muted-foreground truncate">{t('commerceTrust.returnDesc')}</div>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-xl border border-border/70 bg-card/80 shadow-xs">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <PackageCheck className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-foreground truncate">{t('commerceTrust.escrowTitle')}</div>
              <div className="text-[11px] text-muted-foreground truncate">{t('commerceTrust.escrowDesc')}</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Hero;
