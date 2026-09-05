'use client';

import { motion } from 'framer-motion';
import { Heart, ShoppingBag, Eye, GitCompare } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useNavStore } from '@/stores/nav-store';
import { useWishlistStore } from '@/stores/wishlist-store';
import { useCartStore } from '@/stores/cart-store';
import { useCompareStore } from '@/stores/compare-store';
import { useRecentlyViewedStore } from '@/stores/recently-viewed-store';
import { useQuickViewStore } from '@/stores/quick-view-store';
import { useToast } from '@/hooks/use-toast';
import { formatVND, discountPct as calcPct } from '@/lib/format';
import { Rating } from '@/components/common/rating';
import { ProductTypeBadge, StockBadge, DiscountBadge, NewBadge, TrendingBadge, TechBadge, OpenSourceBadge, FreeBadge } from '@/components/common/badges';
import { Cpu, Layers, FileCode, Download } from 'lucide-react';

export function ProductCard({ product, index = 0 }: { product: any; index?: number }) {
  const goProduct = useNavStore((s) => s.goProduct);
  const goShop = useNavStore((s) => s.goShop);
  const wishlist = useWishlistStore();
  const cart = useCartStore();
  const compare = useCompareStore();
  const recentlyViewed = useRecentlyViewedStore();
  const quickView = useQuickViewStore();
  const { toast } = useToast();

  const inWishlist = wishlist.has(product.id);
  const inCompare = compare.has(product.id);
  const pct = product.compareAtPrice ? calcPct(product.price, product.compareAtPrice) : 0;
  const image = product.images?.[0]?.url ?? '/logo.svg';

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
      className="group relative flex flex-col bg-card border border-border/70 rounded-xl overflow-hidden hover:border-cyan-400/50 hover:shadow-[0_10px_40px_-12px_rgba(6,182,212,0.25)] transition-all duration-300"
    >
      {/* Image */}
      <div
        role="button"
        tabIndex={0}
        onClick={handleOpenProduct}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleOpenProduct(); } }}
        className="relative block aspect-[4/3] overflow-hidden bg-gradient-to-br from-slate-50 to-cyan-50/40 cursor-pointer"
        aria-label={product.name}
      >
        <Image
          src={image}
          alt={product.name}
          fill
          sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
        {/* Top-left badges */}
        <div className="absolute top-2 left-2 flex flex-col items-start gap-1.5">
          {pct > 0 && <DiscountBadge pct={pct} />}
          {product.isNew && <NewBadge />}
          {product.isTrending && <TrendingBadge />}
        </div>
        {/* Top-right action buttons */}
        <div className="absolute top-2 right-2 flex flex-col gap-1.5">
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
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
            className="p-1.5 bg-white/80 backdrop-blur rounded-full text-slate-600 hover:text-rose-500 transition-colors"
            aria-label="Toggle wishlist"
          >
            <Heart className={inWishlist ? 'h-4 w-4 fill-rose-500 text-rose-500' : 'h-4 w-4'} />
          </button>
          <button
            onClick={handleToggleCompare}
            className={`p-1.5 backdrop-blur rounded-full transition-colors ${inCompare ? 'bg-cyan-500 text-white' : 'bg-white/80 text-slate-600 hover:text-cyan-600'}`}
            aria-label="Toggle compare"
          >
            <GitCompare className="h-4 w-4" />
          </button>
        </div>
        {/* Bottom-left product type */}
        <div className="absolute bottom-2 left-2">
          <ProductTypeBadge type={product.productType} />
        </div>
        {/* Quick View hover overlay */}
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            quickView.open(product);
          }}
          className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center pb-3 cursor-pointer"
          aria-label="Quick view"
        >
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/90 backdrop-blur-sm px-3 py-1.5 text-xs font-semibold text-cyan-700 shadow-lg translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
            <Eye className="h-3.5 w-3.5" />
            Quick View
          </span>
        </button>
      </div>

      {/* Body */}
      <div className="flex flex-col gap-2 p-3 flex-1">
        {/* Shop + rating */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <button
            onClick={() => goShop(product.shop.slug)}
            className="flex items-center gap-1.5 hover:text-cyan-600 truncate"
          >
            <span className="relative h-4 w-4 rounded overflow-hidden bg-cyan-50 border border-cyan-100">
              {product.shop.logoUrl && (
                <Image src={product.shop.logoUrl} alt={product.shop.name} fill className="object-cover" sizes="16px" />
              )}
            </span>
            <span className="font-medium truncate max-w-[140px]">{product.shop.name}</span>
            {product.shop.verified && <span className="text-cyan-500">✓</span>}
          </button>
          <Rating value={product.rating} count={product.ratingCount} size="xs" showCount={false} />
        </div>

        {/* Name */}
        <button
          onClick={handleOpenProduct}
          className="text-sm font-semibold leading-snug text-foreground text-left line-clamp-2 hover:text-cyan-700 transition-colors"
        >
          {product.name}
        </button>

        {/* Short description */}
        {product.shortDescription && (
          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">{product.shortDescription}</p>
        )}

        {/* Tech badges */}
        <div className="flex flex-wrap gap-1 mt-auto">
          {product.productType === 'DIGITAL' && product.licenseType === 'OPEN_SOURCE' && (
            <OpenSourceBadge className="text-[10px]" />
          )}
          {product.productType === 'DIGITAL' && product.software && (
            <TechBadge icon={FileCode} label={`${product.software} ${product.softwareVersion ?? ''}`.trim()} />
          )}
          {product.productType === 'DIGITAL' && product.currentVersion && (
            <TechBadge icon={Download} label={product.currentVersion} />
          )}
          {product.productType === 'PHYSICAL' && product.pcbLayers && (
            <TechBadge icon={Layers} label={`${product.pcbLayers}L`} />
          )}
          {product.productType === 'PHYSICAL' && product.pcbColor && (
            <TechBadge icon={Cpu} label={product.pcbColor} />
          )}
          {product.productType === 'SERVICE' && product.serviceDurationDays && (
            <TechBadge icon={Layers} label={`${product.serviceDurationDays} days`} />
          )}
        </div>

        {/* Price + cart / Free download */}
        <div className="flex items-end justify-between pt-2 mt-1 border-t border-border/60">
          {product.price === 0 && product.productType === 'DIGITAL' ? (
            <>
              <div className="flex items-center gap-1.5">
                <FreeBadge className="text-[11px]" />
                <span className="text-xs text-emerald-600 font-medium">Open Source</span>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toast({ title: 'Download started', description: `${product.name} — Free open source download` });
                }}
                className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-emerald-500 to-cyan-400 hover:from-emerald-600 hover:to-cyan-500 text-white text-xs font-semibold px-2.5 py-1.5 transition-colors shadow-sm"
                aria-label="Download free"
              >
                <Download className="h-3.5 w-3.5" />
                Get
              </button>
            </>
          ) : (
            <>
              <div className="flex flex-col">
                {product.compareAtPrice && (
                  <span className="text-[11px] text-muted-foreground line-through">{formatVND(product.compareAtPrice)}</span>
                )}
                <span className="text-base font-bold text-cyan-700 tracking-tight">{formatVND(product.price)}</span>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
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
                    shopId: product.shop.id,
                    shopName: product.shop.name,
                  });
                  toast({ title: 'Added to cart', description: product.name });
                }}
                className="flex items-center gap-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-600 text-white text-xs font-semibold px-2.5 py-1.5 transition-colors shadow-sm"
                aria-label="Add to cart"
              >
                <ShoppingBag className="h-3.5 w-3.5" />
                Add
              </button>
            </>
          )}
        </div>

        {/* Stock footer */}
        <div className="flex items-center justify-between pt-1">
          {product.price === 0 && product.productType === 'DIGITAL' ? (
            <span className="text-[10px] text-muted-foreground">{(product.downloadCount ?? product.soldCount ?? 0).toLocaleString('vi-VN')} downloads</span>
          ) : (
            <>
              <StockBadge stock={product.stockAvailable} unlimited={product.unlimited} />
              {product.soldCount > 0 && (
                <span className="text-[10px] text-muted-foreground">{product.soldCount.toLocaleString('vi-VN')} sold</span>
              )}
            </>
          )}
        </div>
      </div>
    </motion.article>
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="flex flex-col bg-card border border-border/70 rounded-xl overflow-hidden">
      <div className="aspect-[4/3] bg-muted shimmer" />
      <div className="p-3 space-y-2">
        <div className="h-3 w-1/2 bg-muted rounded shimmer" />
        <div className="h-4 w-3/4 bg-muted rounded shimmer" />
        <div className="h-3 w-full bg-muted rounded shimmer" />
        <div className="flex justify-between pt-2">
          <div className="h-5 w-20 bg-muted rounded shimmer" />
          <div className="h-7 w-12 bg-muted rounded shimmer" />
        </div>
      </div>
    </div>
  );
}
