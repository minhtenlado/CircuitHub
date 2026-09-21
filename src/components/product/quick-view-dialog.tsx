'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useNavStore } from '@/stores/nav-store';
import { useAuthStore } from '@/stores/auth-store';
import { useCartStore } from '@/stores/cart-store';
import { useWishlistStore } from '@/stores/wishlist-store';
import { useToast } from '@/hooks/use-toast';
import { useI18n } from '@/lib/i18n';
import { formatVND, discountPct as calcPct } from '@/lib/format';
import { Rating } from '@/components/common/rating';
import { sanitizeProductImage } from '@/components/product/product-card';
import {
  ProductTypeBadge,
  StockBadge,
  DiscountBadge,
  NewBadge,
  TrendingBadge,
  FreeBadge,
} from '@/components/common/badges';
import {
  ShoppingCart,
  Heart,
  Eye,
  ArrowRight,
  Layers,
  Cpu,
  FileCode,
  Download,
  Wrench,
  Clock,
  Package,
  ShieldCheck,
  Truck,
} from 'lucide-react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface QuickViewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: any;
}

export function QuickViewDialog({ open, onOpenChange, product }: QuickViewDialogProps) {
  const { t } = useI18n();
  const goProduct = useNavStore((s) => s.goProduct);
  const goShop = useNavStore((s) => s.goShop);
  const goAuth = useNavStore((s) => s.goAuth);
  const user = useAuthStore((s) => s.user);
  const cart = useCartStore();
  const wishlist = useWishlistStore();
  const { toast } = useToast();

  const [selectedImage, setSelectedImage] = useState(0);

  useEffect(() => {
    setSelectedImage(0);
  }, [product?.id]);

  if (!product) return null;

  const pct = product.compareAtPrice ? calcPct(product.price, product.compareAtPrice) : 0;
  const inWishlist = wishlist.has(product.id);

  // Normalize images with hardware fallback
  const rawImages: { url: string; alt?: string }[] =
    product.images && product.images.length > 0
      ? product.images
      : [{ url: product.imageUrl || '/logo.svg', alt: product.name }];

  const images = rawImages.map((img) => ({
    ...img,
    url: sanitizeProductImage(img.url, product.id || product.slug),
  }));

  const currentImage = images[selectedImage]?.url ?? images[0]?.url ?? '/logo.svg';

  function handleAddToCart() {
    if (!user) {
      toast({
        title: t('auth.loginRequired') || 'Yêu cầu đăng nhập',
        description: t('auth.loginRequiredToAddCart') || 'Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng',
      });
      onOpenChange(false);
      goAuth('login', 'product-detail', { slug: product.slug });
      return;
    }
    cart.addItem({
      productId: product.id,
      slug: product.slug,
      name: product.name,
      imageUrl: currentImage,
      price: product.price,
      productType: product.productType,
      shopId: product.shop?.id ?? '',
      shopName: product.shop?.name ?? 'Shop',
    });
    toast({ title: 'Đã thêm vào giỏ hàng', description: product.name });
    onOpenChange(false);
  }

  function handleViewFullDetails() {
    onOpenChange(false);
    goProduct(product.slug);
  }

  // Build tech specs based on product type
  const specs: { icon: any; label: string; value: string }[] = [];
  if (product.category?.name) {
    specs.push({ icon: Package, label: 'Danh mục', value: product.category.name });
  }
  if (product.productType === 'PHYSICAL' && product.pcbLayers) {
    specs.push({ icon: Layers, label: 'Số lớp', value: `${product.pcbLayers} Layers` });
    if (product.pcbThickness) specs.push({ icon: Layers, label: 'Độ dày', value: `${product.pcbThickness}mm` });
    if (product.pcbMaterial) specs.push({ icon: Cpu, label: 'Vật liệu', value: product.pcbMaterial });
    if (product.pcbSurfaceFinish) specs.push({ icon: Cpu, label: 'Bề mặt mạ', value: product.pcbSurfaceFinish });
    if (product.pcbColor) specs.push({ icon: Cpu, label: 'Màu sắc', value: product.pcbColor });
  }
  if (product.productType === 'DIGITAL' && product.software) {
    specs.push({ icon: FileCode, label: 'Phần mềm', value: `${product.software} ${product.softwareVersion ?? ''}`.trim() });
    if (product.currentVersion) specs.push({ icon: Download, label: 'Phiên bản', value: product.currentVersion });
    if (product.licenseType) specs.push({ icon: FileCode, label: 'Giấy phép', value: product.licenseType });
  }
  if (product.productType === 'SERVICE' && product.serviceDurationDays) {
    specs.push({ icon: Clock, label: 'Thời gian', value: `${product.serviceDurationDays} ngày` });
    if (product.serviceRevisions) specs.push({ icon: Wrench, label: 'Chỉnh sửa', value: `${product.serviceRevisions} lần` });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[96vw] sm:max-w-3xl md:max-w-4xl lg:max-w-5xl max-h-[92vh] overflow-y-auto p-0 rounded-2xl border border-border/80 shadow-2xl bg-card">
        <DialogHeader className="sr-only">
          <DialogTitle>Xem nhanh: {product.name}</DialogTitle>
        </DialogHeader>

        <div className="grid md:grid-cols-12 gap-0 min-h-[520px]">
          {/* ============================================================
              LEFT COLUMN: High-res Image & Thumbnail Gallery
              ============================================================ */}
          <div className="md:col-span-6 bg-slate-50/70 dark:bg-slate-900/60 p-5 sm:p-7 flex flex-col justify-between border-b md:border-b-0 md:border-r border-border/60">
            <div>
              {/* Main Image Stage */}
              <div className="relative aspect-[4/3] sm:aspect-square w-full rounded-2xl overflow-hidden bg-background border border-border/70 shadow-sm flex-shrink-0">
                <Image
                  src={currentImage}
                  alt={product.name}
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-cover transition-all duration-300"
                  priority
                />

                {/* Overlaid Badges */}
                <div className="absolute top-3.5 left-3.5 flex flex-col items-start gap-1.5 z-10">
                  {pct > 0 && (
                    <span className="bg-red-600 text-white font-bold text-xs px-2 py-0.5 rounded shadow-xs">
                      -{pct}%
                    </span>
                  )}
                  {product.isNew && <NewBadge />}
                </div>
              </div>

              {/* Thumbnail Gallery Strip */}
              {images.length > 1 && (
                <div className="flex items-center gap-2.5 mt-3.5 overflow-x-auto pb-1 scrollbar-none">
                  {images.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedImage(idx)}
                      className={cn(
                        'relative h-16 w-16 rounded-xl overflow-hidden border-2 transition-all shrink-0 cursor-pointer',
                        selectedImage === idx
                          ? 'border-red-600 ring-2 ring-red-600/20 shadow-xs scale-105'
                          : 'border-border/60 hover:border-red-400/60 opacity-70 hover:opacity-100',
                      )}
                      aria-label={`Thumbnail ${idx + 1}`}
                    >
                      <Image src={img.url} alt={`Preview ${idx + 1}`} fill className="object-cover" sizes="64px" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Quality & Trust Indicator */}
            <div className="mt-4 pt-3 border-t border-border/50 flex items-center justify-between text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>100% Linh kiện chuẩn</span>
              </span>
              <span className="flex items-center gap-1.5">
                <Truck className="h-3.5 w-3.5 text-slate-600 dark:text-slate-400" />
                <span>Giao hàng COD toàn quốc</span>
              </span>
            </div>
          </div>

          {/* ============================================================
              RIGHT COLUMN: Product Info, Specs, Price, and Actions
              ============================================================ */}
          <div className="md:col-span-6 p-5 sm:p-7 flex flex-col justify-between gap-4 overflow-y-auto">
            {/* Header: SKU, Brand & Rating */}
            <div className="flex items-center justify-between text-xs text-muted-foreground pr-8">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono text-xs text-slate-500 dark:text-slate-400">
                  Mã: <span className="font-bold text-foreground">{product.sku || product.id?.slice(0, 7).toUpperCase() || 'SP-01'}</span>
                </span>
                <span>•</span>
                <span className="font-medium text-foreground">{product.brand || product.category?.name || 'Hshop Maker'}</span>
              </div>

              <Rating value={product.rating ?? 0} count={product.ratingCount ?? 0} size="xs" showCount={true} />
            </div>

            {/* Product Title */}
            <div>
              <h2 className="text-xl sm:text-2xl font-bold leading-snug text-foreground tracking-tight line-clamp-2">
                {product.name}
              </h2>

              {/* Short description */}
              {product.shortDescription && (
                <p className="mt-2 text-xs sm:text-sm text-muted-foreground line-clamp-3 leading-relaxed">
                  {product.shortDescription}
                </p>
              )}
            </div>

            {/* Tech Specs Cards (Spacious, no truncated labels) */}
            {specs.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 py-1">
                {specs.map((spec, i) => {
                  const Icon = spec.icon;
                  return (
                    <div
                      key={i}
                      className="flex flex-col gap-0.5 rounded-xl bg-slate-50/80 dark:bg-slate-900/80 border border-border/60 p-2.5 transition-colors hover:border-red-500/40"
                    >
                      <div className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
                        <Icon className="h-3.5 w-3.5 text-red-600 dark:text-red-400 shrink-0" />
                        <span className="truncate">{spec.label}</span>
                      </div>
                      <span className="text-xs font-bold text-foreground mt-0.5 truncate" title={spec.value}>
                        {spec.value}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Price Block / Free Digital File */}
            {product.price === 0 && product.productType === 'DIGITAL' ? (
              <div className="flex items-center justify-between rounded-xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 p-3.5">
                <div className="flex items-center gap-2.5">
                  <FreeBadge />
                  <span className="text-sm font-bold text-emerald-700 dark:text-emerald-300">
                    Tài liệu kỹ thuật (Free)
                  </span>
                </div>
                <span className="text-xs text-muted-foreground font-medium">
                  {(product.downloadCount ?? product.soldCount ?? 0).toLocaleString('vi-VN')} {t('product.downloads')}
                </span>
              </div>
            ) : (
              <div className="flex flex-wrap items-baseline justify-between gap-2 rounded-xl bg-red-50/40 dark:bg-red-950/20 border border-red-100 dark:border-red-900/40 p-4">
                <div className="flex items-baseline gap-2.5">
                  <span className="text-2xl sm:text-3xl font-bold text-red-600 dark:text-red-500 tracking-tight tabular-nums">
                    {formatVND(product.price)}
                  </span>
                  {product.compareAtPrice && product.compareAtPrice > product.price && (
                    <>
                      <span className="text-sm text-muted-foreground line-through tabular-nums">
                        {formatVND(product.compareAtPrice)}
                      </span>
                      <span className="bg-red-600 text-white text-xs font-bold px-1.5 py-0.5 rounded">
                        -{pct}%
                      </span>
                    </>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {product.stockAvailable > 0 || product.unlimited ? (
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 px-2.5 py-1 rounded-full">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      Còn hàng ({product.unlimited ? 'Sẵn' : product.stockAvailable})
                    </span>
                  ) : (
                    <span className="text-xs font-semibold text-rose-500 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 px-2.5 py-1 rounded-full">
                      Hết hàng
                    </span>
                  )}
                  {product.soldCount > 0 && (
                    <span className="text-xs text-muted-foreground font-medium">
                      Đã bán {product.soldCount.toLocaleString('vi-VN')}
                    </span>
                  )}
                </div>
              </div>
            )}

            <Separator className="my-0.5" />

            {/* Action Buttons Row */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 pt-1">
              {product.price === 0 && product.productType === 'DIGITAL' ? (
                <Button
                  size="lg"
                  onClick={() => {
                    if (!user) {
                      toast({
                        title: t('auth.loginRequired') || 'Yêu cầu đăng nhập',
                        description: t('auth.loginRequiredToBuy') || 'Vui lòng đăng nhập để tải dự án này',
                      });
                      onOpenChange(false);
                      goAuth('login', 'product-detail', { slug: product.slug });
                      return;
                    }
                    toast({
                      title: 'Bắt đầu tải về',
                      description: `${product.name} — Tải tài liệu kỹ thuật`,
                    });
                    onOpenChange(false);
                  }}
                  className="flex-1 h-12 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-bold text-sm shadow-md cursor-pointer"
                >
                  <Download className="h-4 w-4 mr-2" />
                  {t('productDetail.downloadFree')}
                </Button>
              ) : (
                <Button
                  size="lg"
                  onClick={handleAddToCart}
                  className="flex-1 h-12 rounded-xl bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-bold text-sm shadow-md cursor-pointer"
                  disabled={product.productType === 'SERVICE'}
                >
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  {product.productType === 'SERVICE' ? 'Yêu cầu báo giá' : 'THÊM VÀO GIỎ HÀNG'}
                </Button>
              )}

              {/* View Full Details button */}
              <Button
                size="lg"
                variant="outline"
                onClick={handleViewFullDetails}
                className="h-12 rounded-xl border-border/80 hover:bg-red-50/60 dark:hover:bg-slate-800 text-foreground font-semibold text-sm cursor-pointer"
              >
                <Eye className="h-4 w-4 mr-2 text-red-600 dark:text-red-400" />
                {t('product.viewDetails')}
              </Button>

              {/* Wishlist toggle button */}
              <Button
                size="lg"
                variant="outline"
                onClick={() => {
                  if (!user) {
                    toast({
                      title: t('auth.loginRequired') || 'Yêu cầu đăng nhập',
                      description: t('auth.loginRequiredWishlist') || 'Vui lòng đăng nhập để lưu vào danh sách yêu thích',
                    });
                    onOpenChange(false);
                    goAuth('login', 'product-detail', { slug: product.slug });
                    return;
                  }
                  wishlist.toggle({
                    productId: product.id,
                    slug: product.slug,
                    name: product.name,
                    imageUrl: currentImage,
                    price: product.price,
                  });
                  toast({
                    title: inWishlist
                      ? (t('product.removedFromWishlist') || 'Đã xóa khỏi danh sách yêu thích')
                      : (t('product.addedToWishlist') || 'Đã thêm vào danh sách yêu thích'),
                    description: product.name,
                  });
                }}
                className="h-12 w-12 p-0 rounded-xl border-border/80 hover:border-rose-300 dark:hover:border-rose-800 cursor-pointer shrink-0"
                aria-label="Toggle wishlist"
              >
                <Heart className={cn('h-5 w-5', inWishlist ? 'fill-rose-500 text-rose-500' : 'text-muted-foreground hover:text-rose-500')} />
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
