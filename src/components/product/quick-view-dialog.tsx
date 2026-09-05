'use client';

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
import { useCartStore } from '@/stores/cart-store';
import { useWishlistStore } from '@/stores/wishlist-store';
import { useToast } from '@/hooks/use-toast';
import { formatVND, discountPct as calcPct } from '@/lib/format';
import { Rating } from '@/components/common/rating';
import {
  ProductTypeBadge,
  StockBadge,
  DiscountBadge,
  NewBadge,
  TrendingBadge,
  TechBadge,
  VerifiedBadge,
  OpenSourceBadge,
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
  CheckCircle2,
} from 'lucide-react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface QuickViewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: any;
}

export function QuickViewDialog({ open, onOpenChange, product }: QuickViewDialogProps) {
  const goProduct = useNavStore((s) => s.goProduct);
  const goShop = useNavStore((s) => s.goShop);
  const cart = useCartStore();
  const wishlist = useWishlistStore();
  const { toast } = useToast();

  if (!product) return null;

  const pct = product.compareAtPrice ? calcPct(product.price, product.compareAtPrice) : 0;
  const image = product.images?.[0]?.url ?? '/logo.svg';
  const inWishlist = wishlist.has(product.id);

  function handleAddToCart() {
    cart.addItem({
      productId: product.id,
      slug: product.slug,
      name: product.name,
      imageUrl: image,
      price: product.price,
      productType: product.productType,
      shopId: product.shop?.id ?? '',
      shopName: product.shop?.name ?? 'Shop',
    });
    toast({ title: 'Added to cart', description: product.name });
    onOpenChange(false);
  }

  function handleViewFullDetails() {
    onOpenChange(false);
    goProduct(product.slug);
  }

  // Build tech specs based on product type
  const specs: { icon: any; label: string; value: string }[] = [];
  if (product.productType === 'PHYSICAL' && product.pcbLayers) {
    specs.push({ icon: Layers, label: 'Layers', value: `${product.pcbLayers}L` });
    if (product.pcbThickness) specs.push({ icon: Layers, label: 'Thickness', value: `${product.pcbThickness}mm` });
    if (product.pcbMaterial) specs.push({ icon: Cpu, label: 'Material', value: product.pcbMaterial });
    if (product.pcbSurfaceFinish) specs.push({ icon: Cpu, label: 'Finish', value: product.pcbSurfaceFinish });
    if (product.pcbColor) specs.push({ icon: Cpu, label: 'Color', value: product.pcbColor });
  }
  if (product.productType === 'DIGITAL' && product.software) {
    specs.push({ icon: FileCode, label: 'Software', value: `${product.software} ${product.softwareVersion ?? ''}`.trim() });
    if (product.currentVersion) specs.push({ icon: Download, label: 'Version', value: product.currentVersion });
    if (product.licenseType) specs.push({ icon: FileCode, label: 'License', value: product.licenseType });
  }
  if (product.productType === 'SERVICE' && product.serviceDurationDays) {
    specs.push({ icon: Clock, label: 'Duration', value: `${product.serviceDurationDays} days` });
    if (product.serviceRevisions) specs.push({ icon: Wrench, label: 'Revisions', value: `${product.serviceRevisions} included` });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-0">
        <DialogHeader className="sr-only">
          <DialogTitle>Quick View: {product.name}</DialogTitle>
        </DialogHeader>

        <div className="grid sm:grid-cols-2 gap-0">
          {/* Left: Image */}
          <div className="relative aspect-square sm:aspect-auto bg-gradient-to-br from-slate-50 to-cyan-50/40 overflow-hidden sm:rounded-l-xl">
            <Image
              src={image}
              alt={product.name}
              fill
              sizes="(max-width: 640px) 100vw, 50vw"
              className="object-cover"
            />
            {/* Badges */}
            <div className="absolute top-3 left-3 flex flex-col items-start gap-1.5">
              {pct > 0 && <DiscountBadge pct={pct} />}
              {product.isNew && <NewBadge />}
              {product.isTrending && <TrendingBadge />}
            </div>
            <div className="absolute bottom-3 left-3">
              <ProductTypeBadge type={product.productType} />
            </div>
          </div>

          {/* Right: Details */}
          <div className="flex flex-col p-5 gap-3">
            {/* Shop + rating */}
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <button
                onClick={() => { onOpenChange(false); goShop(product.shop?.slug ?? ''); }}
                className="flex items-center gap-1.5 hover:text-cyan-600 truncate"
              >
                <span className="relative h-5 w-5 rounded overflow-hidden bg-cyan-50 border border-cyan-100">
                  {product.shop?.logoUrl && (
                    <Image src={product.shop.logoUrl} alt={product.shop.name} fill className="object-cover" sizes="20px" />
                  )}
                </span>
                <span className="font-medium truncate max-w-[120px]">{product.shop?.name}</span>
                {product.shop?.verified && <span className="text-cyan-500">✓</span>}
              </button>
              <Rating value={product.rating} count={product.ratingCount} size="xs" showCount={false} />
            </div>

            {/* Name */}
            <h2 className="text-lg font-bold leading-snug text-foreground line-clamp-2">
              {product.name}
            </h2>

            {/* Short description */}
            {product.shortDescription && (
              <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed">
                {product.shortDescription}
              </p>
            )}

            {/* Tech specs grid */}
            {specs.length > 0 && (
              <div className="grid grid-cols-2 gap-1.5 py-1">
                {specs.slice(0, 6).map((spec, i) => {
                  const Icon = spec.icon;
                  return (
                    <div key={i} className="flex items-center gap-1.5 rounded-md bg-slate-50 border border-border/40 px-2 py-1">
                      <Icon className="h-3 w-3 text-cyan-500 flex-shrink-0" />
                      <span className="text-[10px] text-muted-foreground truncate">{spec.label}:</span>
                      <span className="text-[10px] font-semibold text-foreground truncate">{spec.value}</span>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Price / Free badge */}
            {product.price === 0 && product.productType === 'DIGITAL' ? (
              <div className="flex items-center gap-2 pt-1">
                <FreeBadge />
                <span className="text-sm text-emerald-600 font-medium">Free & Open Source</span>
              </div>
            ) : (
              <div className="flex items-end gap-2 pt-1">
                {product.compareAtPrice && (
                  <span className="text-xs text-muted-foreground line-through mb-0.5">{formatVND(product.compareAtPrice)}</span>
                )}
                <span className="text-2xl font-bold text-cyan-700 tracking-tight">{formatVND(product.price)}</span>
                {pct > 0 && (
                  <Badge className="bg-gradient-to-r from-rose-500 to-orange-400 text-white border-0 text-[10px] mb-1">
                    -{pct}%
                  </Badge>
                )}
              </div>
            )}

            {/* Stock + sold / downloads */}
            <div className="flex items-center justify-between text-xs">
              {product.price === 0 && product.productType === 'DIGITAL' ? (
                <span className="text-muted-foreground">{(product.downloadCount ?? product.soldCount ?? 0).toLocaleString('vi-VN')} downloads</span>
              ) : (
                <>
                  <StockBadge stock={product.stockAvailable} unlimited={product.unlimited} />
                  {product.soldCount > 0 && (
                    <span className="text-muted-foreground">{product.soldCount.toLocaleString('vi-VN')} sold</span>
                  )}
                </>
              )}
            </div>

            <Separator />

            {/* Actions */}
            <div className="flex items-center gap-2 mt-auto">
              {product.price === 0 && product.productType === 'DIGITAL' ? (
                <Button
                  onClick={() => {
                    toast({ title: 'Download started', description: `${product.name} — Free open source download` });
                    onOpenChange(false);
                  }}
                  className="flex-1 bg-gradient-to-r from-emerald-500 to-cyan-400 hover:from-emerald-600 hover:to-cyan-500 text-white"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download Free
                </Button>
              ) : (
                <Button
                  onClick={handleAddToCart}
                  className="flex-1 bg-cyan-600 hover:bg-cyan-700 text-white"
                  disabled={product.productType === 'SERVICE'}
                >
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  {product.productType === 'SERVICE' ? 'Request Quote' : 'Add to Cart'}
                </Button>
              )}
              <Button
                onClick={() => {
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
                variant="outline"
                className="border-cyan-200 text-cyan-700 hover:bg-cyan-50"
              >
                <Heart className={cn('h-4 w-4', inWishlist && 'fill-rose-500 text-rose-500')} />
              </Button>
            </div>

            {/* View full details */}
            <button
              onClick={handleViewFullDetails}
              className="flex items-center justify-center gap-1.5 text-xs font-medium text-cyan-600 hover:text-cyan-700 transition-colors pt-1"
            >
              <Eye className="h-3.5 w-3.5" />
              View full product details
              <ArrowRight className="h-3 w-3" />
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
