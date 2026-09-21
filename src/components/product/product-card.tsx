'use client';

import { motion } from 'framer-motion';
import { Heart, ShoppingBag, ShoppingCart, Eye, GitCompare, CheckCircle2 } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useNavStore } from '@/stores/nav-store';
import { useAuthStore } from '@/stores/auth-store';
import { useWishlistStore } from '@/stores/wishlist-store';
import { useCartStore } from '@/stores/cart-store';
import { useCompareStore } from '@/stores/compare-store';
import { useRecentlyViewedStore } from '@/stores/recently-viewed-store';
import { useQuickViewStore } from '@/stores/quick-view-store';
import { useToast } from '@/hooks/use-toast';
import { useI18n } from '@/lib/i18n';
import { formatVND, discountPct as calcPct } from '@/lib/format';
import { Rating } from '@/components/common/rating';
import { StockBadge, DiscountBadge, NewBadge, TrendingBadge, TechBadge, OpenSourceBadge, FreeBadge } from '@/components/common/badges';
import { Cpu, Layers, FileCode, Download } from 'lucide-react';

/* Curated high quality electronics images for realistic hardware display */
const HARDWARE_IMAGES = [
  'https://images.unsplash.com/photo-1553406830-ef2513450d76?w=800&q=80&auto=format&fit=crop', // Arduino
  'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&q=80&auto=format&fit=crop', // PCB microchip
  'https://images.unsplash.com/photo-1608564697071-ddf911d81370?w=800&q=80&auto=format&fit=crop', // Blue circuit board
  'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800&q=80&auto=format&fit=crop', // Soldered board
  'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=800&q=80&auto=format&fit=crop', // Chip
];

export function sanitizeProductImage(rawUrl: string | undefined, id: string = ''): string {
  if (!rawUrl || rawUrl === '/logo.svg') return HARDWARE_IMAGES[0];
  // Replace photos of HTML/CSS code on monitors or laptops with real hardware photos
  if (rawUrl.includes('photo-1542831371') || rawUrl.includes('photo-1498050108023') || rawUrl.includes('photo-1551033406')) {
    const hash = (id || 'default').split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return HARDWARE_IMAGES[hash % HARDWARE_IMAGES.length];
  }
  return rawUrl;
}

export function ProductCard({ product, index = 0 }: { product: any; index?: number }) {
  const { t } = useI18n();
  const goProduct = useNavStore((s) => s.goProduct);
  const goAuth = useNavStore((s) => s.goAuth);
  const user = useAuthStore((s) => s.user);
  const wishlist = useWishlistStore();
  const cart = useCartStore();
  const compare = useCompareStore();
  const recentlyViewed = useRecentlyViewedStore();
  const quickView = useQuickViewStore();
  const { toast } = useToast();

  const inWishlist = wishlist.has(product.id);
  const inCompare = compare.has(product.id);
  const pct = product.compareAtPrice ? calcPct(product.price, product.compareAtPrice) : 0;
  const rawImage = product.images?.[0]?.url ?? '/logo.svg';
  const image = sanitizeProductImage(rawImage, product.id || product.slug);

  function handleOpenProduct() {
    // Track recently viewed
    recentlyViewed.add({
      productId: product.id,
      slug: product.slug,
      name: product.name,
      imageUrl: image,
      price: product.price,
      productType: product.productType,
      shopName: product.shop?.name ?? '',
      shopSlug: product.shop?.slug ?? '',
    });
    goProduct(product.slug);
  }

  function handleToggleCompare(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (compare.items.length >= 4 && !inCompare) {
      toast({ title: 'Compare list full', description: 'Max 4 products', variant: 'destructive' });
      return;
    }
    compare.toggle({
      productId: product.id,
      slug: product.slug,
      name: product.name,
      imageUrl: image,
      price: product.price,
      productType: product.productType,
      brand: product.brand,
      rating: product.rating,
      ratingCount: product.ratingCount,
      shopName: product.shop?.name ?? '',
      shopSlug: product.shop?.slug ?? '',
      shopVerified: product.shop?.verified ?? false,
      pcbLayers: product.pcbLayers,
      pcbThickness: product.pcbThickness,
      pcbMaterial: product.pcbMaterial,
      pcbSurfaceFinish: product.pcbSurfaceFinish,
      pcbColor: product.pcbColor,
      pcbDimensions: product.pcbDimensions,
      software: product.software,
      softwareVersion: product.softwareVersion,
      currentVersion: product.currentVersion,
      licenseType: product.licenseType,
      fileFormat: product.fileFormat,
      serviceDurationDays: product.serviceDurationDays,
      serviceRevisions: product.serviceRevisions,
      stockAvailable: product.stockAvailable,
      unlimited: product.unlimited,
      soldCount: product.soldCount,
    });
    toast({
      title: inCompare ? 'Removed from comparison' : 'Added to comparison',
      description: `${product.name} (${compare.items.length + (inCompare ? -1 : 1)}/4)`,
    });
  }

  return (
    <motion.article
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: Math.min(index * 0.025, 0.4) }}
      className="group relative flex flex-col bg-card border border-border/80 dark:border-slate-800 rounded-xl overflow-hidden hover:border-red-500/60 dark:hover:border-red-500/60 hover:shadow-md transition-all duration-300"
    >
      {/* Image Block */}
      <div
        role="button"
        tabIndex={0}
        onClick={handleOpenProduct}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleOpenProduct(); } }}
        className="relative block aspect-square bg-white dark:bg-slate-900/60 p-3 border-b border-border/40 cursor-pointer overflow-hidden flex items-center justify-center"
        aria-label={product.name}
      >
        <Image
          src={image}
          alt={product.name}
          fill
          sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
          className="object-contain p-2 transition-transform duration-300 group-hover:scale-105"
        />

        {/* Top-left badges: Discount */}
        <div className="absolute top-2.5 left-2.5 flex flex-col items-start gap-1.5 z-10">
          {pct > 0 && (
            <span className="bg-red-600 text-white font-bold text-[11px] px-2 py-0.5 rounded shadow-xs">
              -{pct}%
            </span>
          )}
          {product.isNew && <NewBadge />}
        </div>

        {/* Top-right action buttons */}
        <div className="absolute top-2.5 right-2.5 flex flex-col gap-1.5 z-10">
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (!user) {
                toast({
                  title: t('auth.loginRequired'),
                  description: t('auth.loginRequiredWishlist'),
                });
                goAuth('login', 'product-detail', { slug: product.slug });
                return;
              }
              wishlist.toggle({
                productId: product.id,
                slug: product.slug,
                name: product.name,
                imageUrl: image,
                price: product.price,
              });
              toast({
                title: inWishlist ? 'Removed from wishlist' : 'Added to wishlist',
                description: product.name,
              });
            }}
            className="p-1.5 bg-white/90 dark:bg-slate-800/90 backdrop-blur rounded-full text-slate-600 dark:text-slate-300 hover:text-rose-500 transition-colors shadow-xs"
            aria-label="Toggle wishlist"
          >
            <Heart className={inWishlist ? 'h-4 w-4 fill-rose-500 text-rose-500' : 'h-4 w-4'} />
          </button>
          <button
            onClick={handleToggleCompare}
            className={`p-1.5 backdrop-blur rounded-full transition-all shadow-xs ${
              inCompare
                ? 'bg-red-500 text-white opacity-100'
                : 'bg-white/90 dark:bg-slate-800/90 text-slate-600 dark:text-slate-300 hover:text-red-600 opacity-0 group-hover:opacity-100'
            }`}
            aria-label="Toggle compare"
          >
            <GitCompare className="h-4 w-4" />
          </button>
        </div>

        {/* Quick View hover overlay */}
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            quickView.open(product);
          }}
          className="absolute inset-x-0 bottom-0 bg-slate-950/70 backdrop-blur-xs py-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-1.5 text-white text-xs font-medium cursor-pointer z-10"
          aria-label="Quick view"
        >
          <Eye className="h-3.5 w-3.5" />
          {t('product.quickView')}
        </button>
      </div>

      {/* Body */}
      <div className="flex flex-col gap-2 p-3 flex-1">
        {/* SKU code + Stock status */}
        <div className="flex items-center justify-between text-xs">
          <span className="font-mono text-[11px] text-slate-500 dark:text-slate-400">
            Mã: <span className="font-semibold text-foreground">{product.sku || product.id?.slice(0, 7).toUpperCase() || 'SP-01'}</span>
          </span>
          {product.stockAvailable > 0 || product.unlimited ? (
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              Còn hàng
            </span>
          ) : (
            <span className="text-[11px] font-medium text-rose-500">Hết hàng</span>
          )}
        </div>

        {/* Name */}
        <button
          onClick={handleOpenProduct}
          className="text-sm font-semibold leading-snug text-foreground text-left line-clamp-2 min-h-[2.5rem] hover:text-red-600 dark:hover:text-red-400 transition-colors"
        >
          {product.name}
        </button>

        {/* Brand / Category & Rating */}
        <div className="flex items-center justify-between text-[11px] text-muted-foreground">
          <span className="truncate max-w-[120px]">{product.brand || product.category?.name || 'Linh kiện Maker'}</span>
          <Rating value={product.rating} count={product.ratingCount} size="xs" showCount={true} />
        </div>

        {/* Price + cart row */}
        <div className="flex items-center justify-between pt-2 mt-auto border-t border-border/50">
          <div className="flex flex-col">
            {product.compareAtPrice && product.compareAtPrice > product.price ? (
              <span className="text-[11px] text-muted-foreground line-through tabular-nums">
                {formatVND(product.compareAtPrice)}
              </span>
            ) : null}
            <span className="text-base sm:text-lg font-bold text-red-600 dark:text-red-500 tabular-nums">
              {formatVND(product.price)}
            </span>
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              if (!user) {
                toast({
                  title: t('auth.loginRequired'),
                  description: t('auth.loginRequiredToAddCart'),
                });
                goAuth('login', 'product-detail', { slug: product.slug });
                return;
              }
              if (product.productType === 'SERVICE') {
                goProduct(product.slug);
                return;
              }
              cart.addItem({
                productId: product.id,
                slug: product.slug,
                name: product.name,
                imageUrl: image,
                price: product.price,
                productType: product.productType,
                shopId: product.shop?.id,
                shopName: product.shop?.name,
              });
              toast({ title: 'Đã thêm vào giỏ hàng', description: product.name });
            }}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 active:bg-red-800 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            aria-label="Thêm vào giỏ"
          >
            <ShoppingCart className="h-3.5 w-3.5" />
            <span className="hidden xs:inline sm:inline">Thêm giỏ</span>
          </button>
        </div>
      </div>
    </motion.article>
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="flex flex-col bg-card border border-border/70 rounded-xl overflow-hidden">
      <div className="aspect-square bg-muted shimmer" />
      <div className="p-3 space-y-2">
        <div className="h-3 w-1/2 bg-muted rounded shimmer" />
        <div className="h-4 w-3/4 bg-muted rounded shimmer" />
        <div className="h-3 w-full bg-muted rounded shimmer" />
        <div className="flex justify-between pt-2">
          <div className="h-5 w-20 bg-muted rounded shimmer" />
          <div className="h-7 w-16 bg-muted rounded shimmer" />
        </div>
      </div>
    </div>
  );
}
