'use client';

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useCompareStore, type CompareItem } from '@/stores/compare-store';
import { useCartStore } from '@/stores/cart-store';
import { useNavStore } from '@/stores/nav-store';
import { useAuthStore } from '@/stores/auth-store';
import { useToast } from '@/hooks/use-toast';
import { useI18n } from '@/lib/i18n';
import { formatVND } from '@/lib/format';
import { Rating } from '@/components/common/rating';
import { ProductTypeBadge, VerifiedBadge } from '@/components/common/badges';
import {
  GitCompare,
  X,
  Trash2,
  ArrowRight,
  Check,
  Minus,
  ShoppingCart,
  Layers,
  Cpu,
  FileCode,
  Wrench,
  Award,
} from 'lucide-react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface SpecRow {
  label: string;
  icon?: any;
  getter: (item: CompareItem) => React.ReactNode;
  section: 'general' | 'pcb' | 'digital' | 'service';
}

const SPEC_ROWS: SpecRow[] = [
  // General
  { label: 'Price', icon: Award, section: 'general', getter: (i) => <span className="font-bold text-cyan-700 dark:text-cyan-400">{formatVND(i.price)}</span> },
  { label: 'Type', section: 'general', getter: (i) => <ProductTypeBadge type={i.productType} className="text-[10px]" /> },
  { label: 'Brand', section: 'general', getter: (i) => i.brand || '—' },
  { label: 'Rating', section: 'general', getter: (i) => <Rating value={i.rating} count={i.ratingCount} size="xs" /> },
  { label: 'Seller', section: 'general', getter: (i) => <span className="flex items-center gap-1">{i.shopName}{i.shopVerified && <span className="text-cyan-500 text-xs">✓</span>}</span> },
  { label: 'Stock', section: 'general', getter: (i) => i.unlimited ? <Badge variant="outline" className="bg-teal-50 dark:bg-teal-950/50 text-teal-700 dark:text-teal-300 border-teal-200 dark:border-teal-800 text-[10px]">Unlimited</Badge> : <span className="tabular-nums">{i.stockAvailable ?? 0}</span> },
  { label: 'Sold', section: 'general', getter: (i) => <span className="tabular-nums">{(i.soldCount ?? 0).toLocaleString('vi-VN')}</span> },
  // PCB
  { label: 'Layers', icon: Layers, section: 'pcb', getter: (i) => i.pcbLayers ? `${i.pcbLayers}L` : '—' },
  { label: 'Thickness', icon: Layers, section: 'pcb', getter: (i) => i.pcbThickness ? `${i.pcbThickness}mm` : '—' },
  { label: 'Material', icon: Cpu, section: 'pcb', getter: (i) => i.pcbMaterial || '—' },
  { label: 'Surface Finish', icon: Cpu, section: 'pcb', getter: (i) => i.pcbSurfaceFinish || '—' },
  { label: 'Color', icon: Cpu, section: 'pcb', getter: (i) => i.pcbColor || '—' },
  { label: 'Dimensions', icon: Layers, section: 'pcb', getter: (i) => i.pcbDimensions || '—' },
  // Digital
  { label: 'Software', icon: FileCode, section: 'digital', getter: (i) => i.software ? `${i.software} ${i.softwareVersion ?? ''}`.trim() : '—' },
  { label: 'Version', icon: FileCode, section: 'digital', getter: (i) => i.currentVersion || '—' },
  { label: 'License', icon: FileCode, section: 'digital', getter: (i) => i.licenseType || '—' },
  { label: 'File Format', icon: FileCode, section: 'digital', getter: (i) => i.fileFormat || '—' },
  // Service
  { label: 'Duration', icon: Wrench, section: 'service', getter: (i) => i.serviceDurationDays ? `${i.serviceDurationDays} days` : '—' },
  { label: 'Revisions', icon: Wrench, section: 'service', getter: (i) => i.serviceRevisions ? `${i.serviceRevisions} included` : '—' },
];

const SECTIONS = [
  { id: 'general', label: 'General', icon: Award },
  { id: 'pcb', label: 'PCB Specs', icon: Layers },
  { id: 'digital', label: 'Digital', icon: FileCode },
  { id: 'service', label: 'Service', icon: Wrench },
] as const;

export function CompareDrawer() {
  const { items, isOpen, close, remove, clear } = useCompareStore();
  const { goProduct, goCart, setView } = useNavStore();
  const { toast } = useToast();
  const { t } = useI18n();

  // Determine which sections to show based on items' types
  const types = new Set(items.map((i) => i.productType));
  const activeSections = SECTIONS.filter((s) => {
    if (s.id === 'general') return true;
    if (s.id === 'pcb') return types.has('PHYSICAL');
    if (s.id === 'digital') return types.has('DIGITAL');
    if (s.id === 'service') return types.has('SERVICE');
    return false;
  });

  return (
    <Sheet open={isOpen} onOpenChange={(o) => !o && close()}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-5xl p-0 flex flex-col gap-0"
      >
        <SheetHeader className="px-5 py-4 border-b border-border/60 bg-gradient-to-br from-cyan-50/60 dark:from-cyan-950/40 to-transparent">
          <SheetTitle className="flex items-center gap-2 text-base">
            <GitCompare className="h-4 w-4 text-cyan-600" />
            Product Comparison
            <Badge variant="secondary" className="ml-1 bg-cyan-100 dark:bg-cyan-950 text-cyan-700 dark:text-cyan-300">
              {items.length}/4
            </Badge>
            {items.length > 0 && (
              <Button size="sm" variant="ghost" onClick={clear} className="ml-auto text-xs h-7">
                <Trash2 className="h-3 w-3 mr-1" />
                Clear
              </Button>
            )}
          </SheetTitle>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 px-6 py-12">
            <div className="h-20 w-20 rounded-full bg-cyan-50 border border-cyan-200 flex items-center justify-center">
              <GitCompare className="h-9 w-9 text-cyan-400" />
            </div>
            <div className="text-center">
              <p className="text-base font-semibold">No products to compare</p>
              <p className="text-sm text-muted-foreground mt-1">
                Add up to 4 products to see a side-by-side specification comparison.
              </p>
            </div>
            <Button onClick={() => { close(); setView('products', {}); }} className="bg-cyan-600 hover:bg-cyan-700 text-white">
              Browse Products
            </Button>
          </div>
        ) : (
          <div className="flex-1 overflow-auto">
            {/* Product headers row */}
            <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border/60">
              <div
                className="grid gap-0 px-4 py-3"
                style={{ gridTemplateColumns: `140px repeat(${items.length}, minmax(180px, 1fr))` }}
              >
                <div className="flex items-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Product
                </div>
                {items.map((item) => (
                  <div key={item.productId} className="flex flex-col gap-2 px-2">
                    <button
                      onClick={() => { close(); goProduct(item.slug); }}
                      className="relative aspect-[4/3] rounded-lg overflow-hidden bg-muted border border-border/40 hover:border-cyan-400/50 transition-colors group"
                    >
                      {item.imageUrl && (
                        <Image src={item.imageUrl} alt={item.name} fill className="object-cover group-hover:scale-105 transition-transform duration-500" sizes="200px" />
                      )}
                      <button
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); remove(item.productId); }}
                        className="absolute top-1.5 right-1.5 p-1 bg-white/80 dark:bg-slate-800/80 backdrop-blur rounded-full text-slate-600 dark:text-slate-300 hover:text-red-500 transition-colors"
                        aria-label="Remove from comparison"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </button>
                    <button
                      onClick={() => { close(); goProduct(item.slug); }}
                      className="text-sm font-semibold text-left line-clamp-2 hover:text-cyan-700 dark:hover:text-cyan-400 transition-colors"
                    >
                      {item.name}
                    </button>
                    <p className="text-xs text-muted-foreground">{item.shopName}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Spec rows by section */}
            {activeSections.map((section) => {
              const sectionRows = SPEC_ROWS.filter((r) => r.section === section.id);
              if (sectionRows.length === 0) return null;
              const SectionIcon = section.icon;
              return (
                <div key={section.id} className="border-b border-border/40">
                  {/* Section header */}
                  <div className="flex items-center gap-2 px-4 py-2 bg-slate-50/60 dark:bg-slate-800/60">
                    <SectionIcon className="h-3.5 w-3.5 text-cyan-600 dark:text-cyan-400" />
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{section.label}</span>
                  </div>
                  {/* Rows */}
                  {sectionRows.map((row, idx) => (
                    <div
                      key={row.label}
                      className={cn(
                        'grid gap-0 px-4 py-2.5 items-center border-t border-border/20',
                        idx % 2 === 1 && 'bg-slate-50/30 dark:bg-slate-800/30',
                      )}
                      style={{ gridTemplateColumns: `140px repeat(${items.length}, minmax(180px, 1fr))` }}
                    >
                      <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                        {row.icon && <row.icon className="h-3 w-3" />}
                        {row.label}
                      </div>
                      {items.map((item) => (
                        <div key={item.productId} className="text-sm px-2 text-foreground">
                          {row.getter(item)}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              );
            })}

            {/* Action row */}
            <div
              className="sticky bottom-0 bg-background/95 backdrop-blur border-t border-border/60 px-4 py-3"
              style={{ gridTemplateColumns: `140px repeat(${items.length}, minmax(180px, 1fr))`, display: 'grid' }}
            >
              <div></div>
              {items.map((item) => (
                <div key={item.productId} className="px-2">
                  <Button
                    size="sm"
                    onClick={() => {
                      const user = useAuthStore.getState().user;
                      if (!user) {
                        toast({
                          title: t('auth.loginRequired') || 'Yêu cầu đăng nhập',
                          description: t('auth.loginRequiredToAddCart') || 'Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng',
                        });
                        close();
                        useNavStore.getState().goAuth('login', 'product-detail', { slug: item.slug });
                        return;
                      }
                      toast({ title: 'Added to cart', description: item.name });
                      useCartStore.getState().addItem({
                        productId: item.productId,
                        slug: item.slug,
                        name: item.name,
                        imageUrl: item.imageUrl,
                        price: item.price,
                        productType: item.productType,
                        shopId: item.shopSlug,
                        shopName: item.shopName,
                      });
                    }}
                    className="w-full bg-cyan-600 hover:bg-cyan-700 text-white cursor-pointer"
                  >
                    <ShoppingCart className="h-3 w-3 mr-1" />
                    Add to Cart
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
