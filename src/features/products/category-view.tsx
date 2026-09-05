'use client';

/* ============================================================
   CircuitHub — CategoryView
   - Reads `slug` from useNavStore.params.slug
   - Resolves category metadata from useCategories()
   - Renders: Breadcrumb → Category header → ProductsView with
     the category filter pre-applied via the initialCategory prop.
   - Breadcrumb: Home / Categories [<Parent>] / <Name>
   ============================================================ */

import { motion } from 'framer-motion';
import {
  Home,
  ChevronRight,
  Package,
  Layers as LayersIcon,
  Cpu,
  CircuitBoard,
  Radar,
  Box,
  Wrench,
  FileCode,
  FileArchive,
  Binary,
  Cog,
  PackageSearch,
} from 'lucide-react';
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import { useCategories } from '@/lib/api/hooks';
import { useNavStore } from '@/stores/nav-store';
import { useI18n, getCategoryName, getCategoryBlurb } from '@/lib/i18n';
import { ProductsView } from './products-view';

/* ---------------- Static category metadata ---------------- */

const CATEGORY_ICONS: Record<string, typeof CircuitBoard> = {
  'dev-boards': CircuitBoard,
  'pcb-boards': LayersIcon,
  components: Cpu,
  sensors: Radar,
  modules: Box,
  tools: Wrench,
  'kicad-projects': FileCode,
  'altium-projects': FileCode,
  'gerber-packages': FileArchive,
  firmware: Binary,
  services: Cog,
};

const CATEGORY_BLURBS: Record<string, string> = {
  'dev-boards': 'Ready-to-ship development boards — ESP32, STM32, Raspberry Pi, Arduino, and more.',
  'pcb-boards': 'Production-ready PCB boards with verified schematics, Gerber files, and spec sheets.',
  components: 'Electronic components — passives, ICs, connectors, and discrete semiconductors.',
  sensors: 'Sensors and transducers for measurement, monitoring, and control systems.',
  modules: 'Pre-integrated modules for fast prototyping and production.',
  tools: 'Hand tools, soldering equipment, and lab instruments for hardware work.',
  'kicad-projects': 'Open-source KiCad project files, libraries, and templates.',
  'altium-projects': 'Altium Designer projects, libraries, and reference designs.',
  'gerber-packages': 'Manufacturing-ready Gerber packages for PCB fabrication.',
  firmware: 'Firmware, bootloaders, drivers, and SDKs for embedded development.',
  services: 'Engineering services — design review, DFM, schematic capture, firmware, and more.',
};

/* ---------------- Top-level helpers (pure) ---------------- */

function resolveCategory(
  categories: any[] | undefined,
  slug: string | undefined,
): { name: string; description?: string | null; productCount: number; parentName?: string } | null {
  if (!Array.isArray(categories) || !slug) return null;
  for (const c of categories) {
    if (c.slug === slug) {
      return {
        name: c.name,
        description: c.description,
        productCount: c._count?.products ?? 0,
      };
    }
    if (Array.isArray(c.children)) {
      for (const ch of c.children) {
        if (ch.slug === slug) {
          return {
            name: ch.name,
            description: ch.description,
            productCount: ch._count?.products ?? 0,
            parentName: c.name,
          };
        }
      }
    }
  }
  return null;
}

/* ============================================================
   CategoryIcon — wrapper component for the dynamic Lucide icon.
   Declared at module scope so React Compiler doesn't treat the
   dynamic icon assignment as a "component created during render".
   ============================================================ */
function CategoryIcon({ slug, className }: { slug?: string; className?: string }) {
  const Icon: typeof Package = (slug ? CATEGORY_ICONS[slug] : undefined) ?? Package;
  return <Icon className={className} />;
}

/* ============================================================
   CategoryView
   ============================================================ */
export function CategoryView() {
  const slug = useNavStore((s) => s.params.slug);
  const goHome = useNavStore((s) => s.goHome);
  const { data: categories, isLoading } = useCategories();
  const { t } = useI18n();

  const resolved = resolveCategory(categories, slug);
  const rawName = resolved?.name ?? 'Category';
  const name = getCategoryName(slug, rawName, t);
  const rawDescription = (resolved?.description as string) || CATEGORY_BLURBS[slug ?? ''] || '';
  const description = getCategoryBlurb(slug, rawDescription, t);
  const productCount = resolved?.productCount ?? 0;
  const isSubCategory = !!resolved?.parentName;
  const parentName = resolved?.parentName;

  return (
    <main className="min-h-screen bg-background text-foreground">
      {/* Breadcrumb */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 lg:pt-8">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <button onClick={goHome} className="hover:text-cyan-600 dark:hover:text-cyan-400 flex items-center gap-1 text-muted-foreground transition-colors">
                  <Home className="h-3.5 w-3.5" />
                  {t('common.home')}
                </button>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <button onClick={goHome} className="hover:text-cyan-600 dark:hover:text-cyan-400 text-muted-foreground transition-colors">
                  {t('common.categories')}
                </button>
              </BreadcrumbLink>
            </BreadcrumbItem>
            {isSubCategory && parentName && (
              <>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <button className="hover:text-cyan-600 dark:hover:text-cyan-400 text-muted-foreground transition-colors">{parentName}</button>
                  </BreadcrumbLink>
                </BreadcrumbItem>
              </>
            )}
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage className="text-cyan-600 dark:text-cyan-400 font-semibold">{name}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      {/* Category header */}
      <section className="relative overflow-hidden mt-4 border-b border-border/40 bg-gradient-to-b from-cyan-950/15 via-background to-background pb-6 sm:pb-8 pt-2">
        {/* Decorative PCB grid background */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.02] dark:opacity-[0.04]"
          style={{
            backgroundImage:
              'linear-gradient(to right, #06b6d4 1px, transparent 1px), linear-gradient(to bottom, #06b6d4 1px, transparent 1px)',
            backgroundSize: '32px 32px',
          }}
          aria-hidden
        />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="flex flex-col sm:flex-row sm:items-center gap-5"
          >
            {/* Icon tile */}
            <div className="relative flex h-16 w-16 sm:h-20 sm:w-20 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500 to-teal-400 text-white shadow-[0_12px_30px_-10px_rgba(6,182,212,0.6)]">
              <CategoryIcon slug={slug} className="h-8 w-8 sm:h-10 sm:w-10" />
            </div>
            {/* Title + meta */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 text-xs font-semibold tracking-wider text-cyan-600 dark:text-cyan-400 uppercase mb-1.5">
                <span>{t('common.category')}</span>
                <ChevronRight className="h-3 w-3" />
                <span className="text-muted-foreground">
                  {isLoading ? t('common.loading') : `${productCount.toLocaleString('vi-VN')} ${t('categories.countProducts')}`}
                </span>
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-foreground">
                {name}
              </h1>
              {description && (
                <p className="mt-2 text-sm sm:text-base text-muted-foreground max-w-2xl leading-relaxed">
                  {description}
                </p>
              )}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Products view with category pre-applied and clean toolbar without duplicate header */}
      <ProductsView initialCategory={slug ?? undefined} hideHeaderTitle={true} />
    </main>
  );
}

/* ============================================================
   Fallback empty state
   ============================================================ */
export function CategoryNotFound({ slug }: { slug?: string }) {
  const goHome = useNavStore((s) => s.goHome);
  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center space-y-4 max-w-md">
        <div className="flex h-20 w-20 mx-auto items-center justify-center rounded-3xl bg-cyan-50 text-cyan-500 border border-cyan-100">
          <PackageSearch className="h-10 w-10" />
        </div>
        <h1 className="text-2xl font-bold text-foreground">Category not found</h1>
        <p className="text-sm text-muted-foreground">
          The category “{slug ?? 'unknown'}” doesn’t exist or has been removed.
        </p>
        <Button onClick={goHome} className="bg-cyan-500 hover:bg-cyan-600 text-white">
          Back to Home
        </Button>
      </div>
    </main>
  );
}

export default CategoryView;
