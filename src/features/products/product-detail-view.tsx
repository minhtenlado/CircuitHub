'use client';

/* ============================================================
   CircuitHub — ProductDetailView
   - Reads `slug` from useNavStore.params.slug, fetches useProduct(slug)
   - Top breadcrumb: Home / Category / Shop / Product name (clickable)
   - Left: image gallery (main + thumbnails), Preview overlay for digital
   - Right: badges, H1, rating+sold+views, price block, short desc,
     seller row, qty selector (physical only), stock+shipping,
     Add to Cart + Buy Now, Wishlist + Compare,
     Digital: software/license/compat/size/version/download policy,
     PCB: technical specs mini-table,
     Service: scope/deliverables/duration/revisions/portfolio
   - Tabs: Description / Specifications / Versions / Reviews / Shipping
   - Related products horizontal scroll (6 cards)
   - Digital: License acceptance checkbox before Add to Cart
   ============================================================ */

import { useMemo, useState } from 'react';
import Image from 'next/image';
import {
  ChevronRight,
  Star,
  ShoppingBag,
  Heart,
  GitCompare,
  Truck,
  Download,
  ShieldCheck,
  Minus,
  Plus,
  Eye,
  Clock,
  CheckCircle2,
  Package,
  Layers,
  Cpu,
  CircuitBoard,
  Radar,
  Box,
  Wrench,
  FileCode,
  FileArchive,
  Binary,
  Cog,
  ArrowRight,
  PackageSearch,
  Loader2,
  FileCheck2,
  Briefcase,
  RefreshCw,
  ThumbsUp,
  Star as StarIcon,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible';
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { useProduct } from '@/lib/api/hooks';
import { useNavStore } from '@/stores/nav-store';
import { useCartStore } from '@/stores/cart-store';
import { useWishlistStore } from '@/stores/wishlist-store';
import { useToast } from '@/hooks/use-toast';
import { useAuthStore } from '@/stores/auth-store';
import { Rating } from '@/components/common/rating';
import {
  ProductTypeBadge,
  VerifiedBadge,
  StockBadge,
  DiscountBadge,
  NewBadge,
  TrendingBadge,
  FeaturedBadge,
} from '@/components/common/badges';
import { ProductCard } from '@/components/product/product-card';
import {
  formatVND,
  formatFileSize,
  formatDate,
  timeAgo,
  discountPct as calcPct,
  initials,
} from '@/lib/format';
import { cn } from '@/lib/utils';

/* ---------------- Constants ---------------- */

const CATEGORY_ICONS: Record<string, typeof CircuitBoard> = {
  'dev-boards': CircuitBoard,
  'pcb-boards': Layers,
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

/* ============================================================
   FrequentlyBoughtTogether
   ============================================================ */
function FrequentlyBoughtTogether({ mainProduct, related }: { mainProduct: any; related: any[] }) {
  const { toast } = useToast();
  const cart = useCartStore();
  const [selected, setSelected] = useState<Set<string>>(new Set(related.map((r) => r.id)));

  const items = [mainProduct, ...related];
  const checkedItems = items.filter((i) => i.id === mainProduct.id || selected.has(i.id));
  const bundleTotal = checkedItems.reduce((sum, i) => sum + i.price, 0);
  const bundleOriginal = checkedItems.reduce((sum, i) => sum + (i.compareAtPrice ?? i.price), 0);
  const savings = bundleOriginal - bundleTotal;

  function toggle(id: string) {
    if (id === mainProduct.id) return; // main product always selected
    setSelected((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function addBundleToCart() {
    checkedItems.forEach((item) => {
      cart.addItem({
        productId: item.id,
        slug: item.slug,
        name: item.name,
        imageUrl: item.images?.[0]?.url,
        price: item.price,
        productType: item.productType,
        shopId: item.shop?.id ?? item.shopId,
        shopName: item.shop?.name ?? 'Shop',
      });
    });
    toast({
      title: 'Bundle added to cart',
      description: `${checkedItems.length} items · ${formatVND(bundleTotal)}`,
    });
  }

  return (
    <section className="mt-12">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-cyan-500" />
            Frequently Bought Together
          </h2>
          <p className="text-sm text-muted-foreground mt-1">Customers who bought this item also bought</p>
        </div>
      </div>

      <div className="rounded-2xl border border-cyan-200/60 bg-gradient-to-br from-cyan-50/40 via-white to-teal-50/30 p-5 sm:p-6">
        <div className="grid lg:grid-cols-[1fr_300px] gap-6">
          {/* Products visual */}
          <div className="flex items-center gap-3 flex-wrap">
            {items.map((item, idx) => {
              const isMain = item.id === mainProduct.id;
              const isChecked = isMain || selected.has(item.id);
              return (
                <div key={item.id} className="flex items-center gap-3">
                  {idx > 0 && <Plus className="h-4 w-4 text-muted-foreground flex-shrink-0" />}
                  <button
                    onClick={() => toggle(item.id)}
                    className={`relative w-28 sm:w-32 rounded-xl overflow-hidden border-2 transition-all text-left ${
                      isChecked ? 'border-cyan-500 shadow-md' : 'border-border opacity-60 hover:opacity-100'
                    }`}
                  >
                    <div className="aspect-square bg-muted relative">
                      {item.images?.[0]?.url && (
                        <img src={item.images[0].url} alt={item.name} className="absolute inset-0 w-full h-full object-cover" />
                      )}
                      {isMain && (
                        <span className="absolute top-1 left-1 text-[9px] font-bold bg-cyan-500 text-white px-1.5 py-0.5 rounded">
                          THIS ITEM
                        </span>
                      )}
                      <div className={`absolute top-1 right-1 h-4 w-4 rounded-full border-2 flex items-center justify-center ${
                        isChecked ? 'bg-cyan-500 border-cyan-500' : 'bg-white border-border'
                      }`}>
                        {isChecked && <CheckCircle2 className="h-3 w-3 text-white" />}
                      </div>
                    </div>
                    <div className="p-2 bg-white">
                      <p className="text-xs font-medium line-clamp-2 leading-tight">{item.name}</p>
                      <p className="text-xs font-bold text-cyan-700 mt-1">{formatVND(item.price)}</p>
                    </div>
                  </button>
                </div>
              );
            })}
          </div>

          {/* Bundle summary */}
          <div className="rounded-xl bg-white border border-border/60 p-4 flex flex-col gap-3 justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                Bundle Price ({checkedItems.length} items)
              </p>
              <div className="space-y-1">
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-cyan-700">{formatVND(bundleTotal)}</span>
                  {savings > 0 && (
                    <span className="text-sm text-muted-foreground line-through">{formatVND(bundleOriginal)}</span>
                  )}
                </div>
                {savings > 0 && (
                  <p className="text-xs text-emerald-600 font-medium flex items-center gap-1">
                    <Sparkles className="h-3 w-3" />
                    You save {formatVND(savings)}
                  </p>
                )}
              </div>
            </div>
            <Button
              onClick={addBundleToCart}
              className="w-full bg-gradient-to-r from-cyan-600 to-teal-500 hover:from-cyan-700 hover:to-teal-600 text-white"
            >
              <ShoppingBag className="h-4 w-4 mr-2" />
              Add Bundle to Cart
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   ProductDetailView
   ============================================================ */
export function ProductDetailView() {
  const slug = useNavStore((s) => s.params.slug);
  const { data: product, isLoading } = useProduct(slug ?? null);

  if (isLoading) return <ProductDetailSkeleton />;
  if (!product) return <ProductNotFound />;

  return <ProductDetailContent product={product} />;
}

/* ============================================================
   ProductDetailContent — main rendering
   ============================================================ */
function ProductDetailContent({ product }: { product: any }) {
  const goHome = useNavStore((s) => s.goHome);
  const goCategory = useNavStore((s) => s.goCategory);
  const goShop = useNavStore((s) => s.goShop);
  const goCheckout = useNavStore((s) => s.goCheckout);
  const cart = useCartStore();
  const wishlist = useWishlistStore();
  const { toast } = useToast();

  const [selectedImage, setSelectedImage] = useState(0);
  const [qty, setQty] = useState(1);
  const [licenseAccepted, setLicenseAccepted] = useState(false);
  const [activeTab, setActiveTab] = useState('description');

  const isDigital = product.productType === 'DIGITAL';
  const isService = product.productType === 'SERVICE';
  const isPhysical = product.productType === 'PHYSICAL';
  const isPcb = isPhysical && product.category?.slug === 'pcb-boards';

  const images = (product.images ?? []).length > 0 ? product.images : [{ url: '/logo.svg', alt: product.name }];
  const mainImage = images[selectedImage]?.url ?? images[0]?.url;
  const pct = product.compareAtPrice ? calcPct(product.price, product.compareAtPrice) : 0;
  const savings = product.compareAtPrice ? product.compareAtPrice - product.price : 0;
  const inWishlist = wishlist.has(product.id);
  const imageForCard = mainImage;

  /* Quantity behavior: physical uses qty selector, digital/service always 1 */
  const effectiveQty = isPhysical ? qty : 1;

  function handleAddToCart(buyNow = false) {
    if (isDigital && !licenseAccepted) {
      toast({
        title: 'License acceptance required',
        description: 'Please accept the license terms before adding to cart.',
        variant: 'destructive',
      });
      return;
    }
    cart.addItem({
      productId: product.id,
      slug: product.slug,
      name: product.name,
      imageUrl: imageForCard,
      price: product.price,
      productType: product.productType,
      shopId: product.shop?.id,
      shopName: product.shop?.name,
    }, effectiveQty);
    toast({
      title: buyNow ? 'Proceeding to checkout' : 'Added to cart',
      description: `${effectiveQty} × ${product.name}`,
    });
    if (buyNow) goCheckout();
  }

  function handleWishlistToggle() {
    wishlist.toggle({
      productId: product.id,
      slug: product.slug,
      name: product.name,
      imageUrl: imageForCard,
      price: product.price,
    });
    toast({
      title: inWishlist ? 'Removed from wishlist' : 'Added to wishlist',
      description: product.name,
    });
  }

  function handleCompare() {
    toast({
      title: 'Compare feature coming soon',
      description: `${product.name} marked for comparison.`,
    });
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-white via-cyan-50/20 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        {/* Breadcrumb */}
        <Breadcrumb className="mb-5">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <button onClick={goHome} className="hover:text-cyan-600">Home</button>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <button
                  onClick={() => product.category?.slug && goCategory(product.category.slug)}
                  className="hover:text-cyan-600"
                >
                  {product.category?.name ?? 'Category'}
                </button>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <button
                  onClick={() => product.shop?.slug && goShop(product.shop.slug)}
                  className="hover:text-cyan-600"
                >
                  {product.shop?.name ?? 'Shop'}
                </button>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage className="text-cyan-700 font-medium line-clamp-1">
                {product.name}
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Main two-column */}
        <div className="grid grid-cols-1 lg:grid-cols-[5fr_7fr] gap-6 lg:gap-10">
          {/* Image gallery */}
          <div className="space-y-3">
            <div className="relative aspect-square w-full rounded-2xl overflow-hidden bg-gradient-to-br from-slate-50 to-cyan-50/40 border border-border/60">
              <Image
                src={mainImage}
                alt={product.name}
                fill
                sizes="(max-width: 1024px) 100vw, 40vw"
                className="object-cover"
                priority
              />
              {isDigital && (
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-cyan-900/80 to-transparent px-5 py-4 flex items-center gap-2 text-white">
                  <Download className="h-5 w-5" />
                  <div>
                    <p className="text-sm font-semibold">Digital Product — Preview</p>
                    <p className="text-xs text-cyan-100">Instant download after payment</p>
                  </div>
                </div>
              )}
              {pct > 0 && (
                <div className="absolute top-3 left-3">
                  <DiscountBadge pct={pct} />
                </div>
              )}
            </div>
            {/* Thumbnails */}
            {images.length > 1 && (
              <div className="grid grid-cols-5 gap-2">
                {images.slice(0, 5).map((img: any, i: number) => (
                  <button
                    key={i}
                    onClick={() => setSelectedImage(i)}
                    className={cn(
                      'relative aspect-square rounded-lg overflow-hidden border-2 transition-all',
                      selectedImage === i
                        ? 'border-cyan-500 shadow-[0_4px_12px_-4px_rgba(6,182,212,0.5)]'
                        : 'border-transparent hover:border-cyan-200',
                    )}
                  >
                    <Image
                      src={img.url}
                      alt={img.alt ?? product.name}
                      fill
                      sizes="80px"
                      className="object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right column */}
          <div className="flex flex-col gap-4">
            {/* Badges row */}
            <div className="flex flex-wrap items-center gap-2">
              <ProductTypeBadge type={product.productType} />
              {product.isFeatured && <FeaturedBadge />}
              {product.isTrending && <TrendingBadge />}
              {product.isNew && <NewBadge />}
              {pct > 0 && (
                <Badge className="bg-rose-50 text-rose-700 border-rose-200 border">
                  Save {pct}%
                </Badge>
              )}
            </div>

            {/* Title */}
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground leading-tight">
              {product.name}
            </h1>

            {/* Rating + sold + views */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
              <Rating value={product.rating ?? 0} count={product.ratingCount ?? 0} size="sm" />
              <span className="flex items-center gap-1">
                <ShoppingBag className="h-3.5 w-3.5" />
                {(product.soldCount ?? 0).toLocaleString('vi-VN')} sold
              </span>
              <span className="flex items-center gap-1">
                <Eye className="h-3.5 w-3.5" />
                {(product.viewCount ?? 0).toLocaleString('vi-VN')} views
              </span>
              {product.brand && (
                <span className="flex items-center gap-1">
                  <Package className="h-3.5 w-3.5" />
                  {product.brand}
                </span>
              )}
            </div>

            {/* Price block */}
            <div className="flex flex-wrap items-baseline gap-3 rounded-xl bg-cyan-50/60 border border-cyan-100 p-4">
              <span className="text-3xl font-bold text-cyan-700 tracking-tight">
                {formatVND(product.price)}
              </span>
              {product.compareAtPrice && product.compareAtPrice > product.price && (
                <>
                  <span className="text-base text-muted-foreground line-through">
                    {formatVND(product.compareAtPrice)}
                  </span>
                  <Badge className="bg-gradient-to-r from-rose-500 to-orange-400 text-white border-0 font-semibold">
                    -{pct}%
                  </Badge>
                  <span className="ml-auto text-sm text-emerald-700 font-medium">
                    You save {formatVND(savings)}
                  </span>
                </>
              )}
            </div>

            {/* Short description */}
            {product.shortDescription && (
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                {product.shortDescription}
              </p>
            )}

            {/* Seller row */}
            {product.shop && (
              <div className="flex items-center gap-3 rounded-xl border border-border/60 bg-white/80 p-3">
                <div className="relative h-11 w-11 rounded-full overflow-hidden border border-cyan-100 bg-cyan-50">
                  {product.shop.logoUrl && (
                    <Image
                      src={product.shop.logoUrl}
                      alt={product.shop.name}
                      fill
                      sizes="44px"
                      className="object-cover"
                    />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => goShop(product.shop.slug)}
                      className="font-semibold text-foreground hover:text-cyan-600 truncate"
                    >
                      {product.shop.name}
                    </button>
                    {product.shop.verified && <VerifiedBadge />}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                    <Rating value={product.shop.rating ?? 0} size="xs" showCount={false} />
                    <span>·</span>
                    <span>{(product.shop.productCount ?? 0).toLocaleString('vi-VN')} products</span>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-cyan-200 text-cyan-700 hover:bg-cyan-50"
                  onClick={() => goShop(product.shop.slug)}
                >
                  Visit Shop
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            )}

            {/* Quantity (physical only) */}
            {isPhysical && (
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-foreground">Quantity</span>
                <div className="flex items-center rounded-lg border border-border bg-white overflow-hidden">
                  <button
                    onClick={() => setQty((q) => Math.max(1, q - 1))}
                    className="flex h-9 w-9 items-center justify-center hover:bg-cyan-50 transition-colors text-muted-foreground hover:text-cyan-600"
                    aria-label="Decrease quantity"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <input
                    type="number"
                    value={qty}
                    onChange={(e) => setQty(Math.max(1, parseInt(e.target.value, 10) || 1))}
                    min={1}
                    className="h-9 w-12 border-0 text-center text-sm font-semibold focus:outline-none focus:ring-0 bg-transparent"
                  />
                  <button
                    onClick={() => setQty((q) => q + 1)}
                    className="flex h-9 w-9 items-center justify-center hover:bg-cyan-50 transition-colors text-muted-foreground hover:text-cyan-600"
                    aria-label="Increase quantity"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
                <StockBadge stock={product.stockAvailable ?? 0} unlimited={product.unlimited} />
              </div>
            )}

            {/* Stock + shipping estimate */}
            <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
              {!isPhysical && (
                <Badge variant="outline" className="bg-teal-50 text-teal-700 border-teal-200 gap-1">
                  <Download className="h-3 w-3" />
                  Digital delivery
                </Badge>
              )}
              {isPhysical && (
                <Badge variant="outline" className="bg-cyan-50 text-cyan-700 border-cyan-200 gap-1">
                  <Truck className="h-3 w-3" />
                  Ships in {product.pcbLeadTimeDays ?? 3}–{(product.pcbLeadTimeDays ?? 3) + 2} days
                </Badge>
              )}
              {isService && (
                <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 gap-1">
                  <Clock className="h-3 w-3" />
                  Service · {product.serviceDurationDays ?? 7} days
                </Badge>
              )}
              {product.warranty && (
                <Badge variant="outline" className="bg-slate-50 text-slate-700 border-slate-200 gap-1">
                  <ShieldCheck className="h-3 w-3" />
                  {product.warranty}
                </Badge>
              )}
            </div>

            {/* Digital-specific quick info */}
            {isDigital && (
              <DigitalQuickInfo product={product} />
            )}

            {/* PCB technical specs mini-table */}
            {isPcb && <PcbQuickSpecs product={product} />}

            {/* Service-specific quick info */}
            {isService && <ServiceQuickInfo product={product} />}

            {/* License acceptance for digital */}
            {isDigital && (
              <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-4 space-y-3">
                <label
                  htmlFor="license-accept"
                  className="flex items-start gap-2.5 cursor-pointer"
                >
                  <Checkbox
                    id="license-accept"
                    checked={licenseAccepted}
                    onCheckedChange={(v) => setLicenseAccepted(!!v)}
                    className="mt-0.5 data-[state=checked]:bg-cyan-500 data-[state=checked]:border-cyan-500"
                  />
                  <div className="text-sm">
                    <span className="font-medium text-foreground">
                      I accept the license terms
                    </span>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      You must accept the license agreement to add this digital product to your cart.
                    </p>
                  </div>
                </label>
                <Collapsible>
                  <CollapsibleTrigger className="flex items-center gap-1 text-xs text-cyan-700 hover:text-cyan-800 font-medium">
                    <ChevronRight className="h-3 w-3 [&[data-state=open]>svg]:rotate-90" />
                    View license terms
                  </CollapsibleTrigger>
                  <CollapsibleContent className="pt-2 text-xs text-muted-foreground leading-relaxed space-y-1.5">
                    <p>
                      License type: <span className="font-medium text-foreground">{formatLicenseType(product.licenseType)}</span>
                    </p>
                    <p>
                      This license grants you the right to use this digital design for {product.licenseType === 'COMMERCIAL' ? 'commercial' : 'personal'} projects.
                      Redistribution, reselling, or sharing the source files is prohibited.
                    </p>
                    <p>
                      For commercial projects, attribution to the original designer may be required.
                      Violations may result in license termination without refund.
                    </p>
                  </CollapsibleContent>
                </Collapsible>
              </div>
            )}

            {/* CTAs */}
            <div className="grid grid-cols-2 gap-3">
              <Button
                size="lg"
                className="bg-gradient-to-r from-cyan-500 to-teal-400 hover:from-cyan-600 hover:to-teal-500 text-white shadow-[0_8px_20px_-8px_rgba(6,182,212,0.5)] border-0"
                disabled={isDigital && !licenseAccepted}
                onClick={() => handleAddToCart(false)}
              >
                <ShoppingBag className="h-4 w-4" />
                Add to Cart
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-cyan-300 text-cyan-700 hover:bg-cyan-50"
                disabled={isDigital && !licenseAccepted}
                onClick={() => handleAddToCart(true)}
              >
                Buy Now
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>

            {/* Wishlist + Compare */}
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                size="sm"
                className={cn(
                  'border-border',
                  inWishlist ? 'text-rose-600 border-rose-200 bg-rose-50 hover:bg-rose-100' : 'hover:bg-cyan-50 hover:border-cyan-200',
                )}
                onClick={handleWishlistToggle}
              >
                <Heart className={cn('h-4 w-4', inWishlist && 'fill-rose-500')} />
                {inWishlist ? 'In Wishlist' : 'Add to Wishlist'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="border-border hover:bg-cyan-50 hover:border-cyan-200"
                onClick={handleCompare}
              >
                <GitCompare className="h-4 w-4" />
                Compare
              </Button>
            </div>
          </div>
        </div>

        {/* Below the fold — Tabs */}
        <ProductTabs product={product} activeTab={activeTab} onTabChange={setActiveTab} />

        {/* Frequently Bought Together */}
        {product.related && product.related.length >= 2 && (
          <FrequentlyBoughtTogether mainProduct={product} related={product.related.slice(0, 3)} />
        )}

        {/* Related products */}
        {product.related && product.related.length > 0 && (
          <section className="mt-12">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                Related products
              </h2>
              <span className="text-xs text-muted-foreground">
                {product.related.length} items
              </span>
            </div>
            <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0 pb-4 snap-x snap-mandatory scroll-smooth">
              <div className="flex gap-4">
                {product.related.map((p: any, i: number) => (
                  <div key={p.id} className="snap-start shrink-0 w-[260px] sm:w-[280px]">
                    <ProductCard product={p} index={i} />
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}

/* ============================================================
   DigitalQuickInfo — for DIGITAL products
   ============================================================ */
function DigitalQuickInfo({ product }: { product: any }) {
  const items: { label: string; value: string | null; icon: typeof FileCode }[] = [
    {
      label: 'Software',
      value: product.software
        ? `${product.software}${product.softwareVersion ? ` ${product.softwareVersion}` : ''}`
        : null,
      icon: FileCode,
    },
    { label: 'License', value: formatLicenseType(product.licenseType), icon: ShieldCheck },
    { label: 'Compatibility', value: formatCompatibility(product.compatibility), icon: Cpu },
    {
      label: 'File size',
      value: product.fileSizeBytes ? formatFileSize(product.fileSizeBytes) : null,
      icon: FileArchive,
    },
    { label: 'Current version', value: product.currentVersion, icon: Binary },
  ];

  return (
    <div className="rounded-xl border border-teal-200 bg-teal-50/40 p-4">
      <p className="text-xs font-semibold uppercase tracking-wider text-teal-700 mb-3 flex items-center gap-1.5">
        <FileCode className="h-3.5 w-3.5" />
        Digital product details
      </p>
      <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2.5 text-sm">
        {items.map((it) => (
          <div key={it.label} className="flex items-center gap-2">
            <it.icon className="h-3.5 w-3.5 text-teal-600 shrink-0" />
            <dt className="text-muted-foreground min-w-[100px]">{it.label}:</dt>
            <dd className="font-medium text-foreground truncate">{it.value ?? '—'}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-3 pt-3 border-t border-teal-200/60 text-xs text-teal-700 flex items-center gap-1.5">
        <ShieldCheck className="h-3.5 w-3.5" />
        Secure download with license verification
      </p>
    </div>
  );
}

/* ============================================================
   PcbQuickSpecs — for PHYSICAL PCB products
   ============================================================ */
function PcbQuickSpecs({ product }: { product: any }) {
  const specs: { label: string; value: string | null }[] = [
    { label: 'Layers', value: product.pcbLayers ? `${product.pcbLayers}` : null },
    { label: 'Thickness', value: product.pcbThickness ? `${product.pcbThickness} mm` : null },
    { label: 'Material', value: product.pcbMaterial },
    { label: 'Surface finish', value: product.pcbSurfaceFinish },
    { label: 'Copper weight', value: product.pcbCopperWeight },
    { label: 'Min track', value: product.pcbMinTrack },
    { label: 'Min spacing', value: product.pcbMinSpacing },
    { label: 'Color', value: product.pcbColor },
    { label: 'Dimensions', value: product.pcbDimensions },
    { label: 'Revision', value: product.pcbRevision },
    { label: 'MOQ', value: product.pcbMoq ? `${product.pcbMoq} units` : null },
    { label: 'Lead time', value: product.pcbLeadTimeDays ? `${product.pcbLeadTimeDays} days` : null },
  ];

  const filtered = specs.filter((s) => s.value);
  if (filtered.length === 0) return null;

  return (
    <div className="rounded-xl border border-cyan-200 bg-cyan-50/40 p-4">
      <p className="text-xs font-semibold uppercase tracking-wider text-cyan-700 mb-3 flex items-center gap-1.5">
        <Layers className="h-3.5 w-3.5" />
        Technical Specifications
      </p>
      <dl className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-2 text-sm">
        {filtered.map((s) => (
          <div key={s.label} className="flex flex-col gap-0.5 min-w-0">
            <dt className="text-[11px] text-muted-foreground uppercase tracking-wider">{s.label}</dt>
            <dd className="font-mono text-foreground text-sm truncate">{s.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

/* ============================================================
   ServiceQuickInfo — for SERVICE products
   ============================================================ */
function ServiceQuickInfo({ product }: { product: any }) {
  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50/40 p-4 space-y-3">
      <p className="text-xs font-semibold uppercase tracking-wider text-amber-700 flex items-center gap-1.5">
        <Briefcase className="h-3.5 w-3.5" />
        Service details
      </p>
      <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2.5 text-sm">
        {product.serviceScope && (
          <div className="flex items-start gap-2 sm:col-span-2">
            <Briefcase className="h-3.5 w-3.5 text-amber-600 mt-0.5 shrink-0" />
            <dt className="text-muted-foreground min-w-[100px]">Service scope:</dt>
            <dd className="font-medium text-foreground">{product.serviceScope}</dd>
          </div>
        )}
        {product.serviceDeliverables && (
          <div className="flex items-start gap-2 sm:col-span-2">
            <FileCheck2 className="h-3.5 w-3.5 text-amber-600 mt-0.5 shrink-0" />
            <dt className="text-muted-foreground min-w-[100px]">Deliverables:</dt>
            <dd className="font-medium text-foreground">{product.serviceDeliverables}</dd>
          </div>
        )}
        <div className="flex items-center gap-2">
          <Clock className="h-3.5 w-3.5 text-amber-600 shrink-0" />
          <dt className="text-muted-foreground">Duration:</dt>
          <dd className="font-medium text-foreground">{product.serviceDurationDays ?? '—'} days</dd>
        </div>
        <div className="flex items-center gap-2">
          <RefreshCw className="h-3.5 w-3.5 text-amber-600 shrink-0" />
          <dt className="text-muted-foreground">Revisions:</dt>
          <dd className="font-medium text-foreground">{product.serviceRevisions ?? 0} included</dd>
        </div>
      </dl>
      {product.servicePortfolio && (
        <a
          href={product.servicePortfolio}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-sm text-amber-700 hover:text-amber-800 font-medium"
        >
          <Eye className="h-3.5 w-3.5" />
          View portfolio
          <ArrowRight className="h-3 w-3" />
        </a>
      )}
    </div>
  );
}

/* ============================================================
   ProductTabs — Description / Specs / Versions / Reviews / Shipping
   ============================================================ */
function ProductTabs({
  product,
  activeTab,
  onTabChange,
}: {
  product: any;
  activeTab: string;
  onTabChange: (v: string) => void;
}) {
  const isDigital = product.productType === 'DIGITAL';
  return (
    <Tabs value={activeTab} onValueChange={onTabChange} className="mt-12">
      <TabsList className="bg-cyan-50/60 border border-cyan-100 p-1 flex flex-wrap h-auto">
        <TabsTrigger value="description" className="data-[state=active]:bg-white data-[state=active]:text-cyan-700">
          Description
        </TabsTrigger>
        <TabsTrigger value="specifications" className="data-[state=active]:bg-white data-[state=active]:text-cyan-700">
          Specifications
        </TabsTrigger>
        {isDigital && (
          <TabsTrigger value="versions" className="data-[state=active]:bg-white data-[state=active]:text-cyan-700">
            Versions
          </TabsTrigger>
        )}
        <TabsTrigger value="reviews" className="data-[state=active]:bg-white data-[state=active]:text-cyan-700">
          Reviews ({product.reviews?.length ?? 0})
        </TabsTrigger>
        <TabsTrigger value="shipping" className="data-[state=active]:bg-white data-[state=active]:text-cyan-700">
          Shipping
        </TabsTrigger>
      </TabsList>

      <TabsContent value="description" className="mt-6">
        <DescriptionTab description={product.description} />
      </TabsContent>
      <TabsContent value="specifications" className="mt-6">
        <SpecificationsTab product={product} />
      </TabsContent>
      {isDigital && (
        <TabsContent value="versions" className="mt-6">
          <VersionsTab versions={product.versions ?? []} />
        </TabsContent>
      )}
      <TabsContent value="reviews" className="mt-6">
        <ReviewsTab product={product} />
      </TabsContent>
      <TabsContent value="shipping" className="mt-6">
        <ShippingTab product={product} />
      </TabsContent>
    </Tabs>
  );
}

/* ============================================================
   Description tab
   ============================================================ */
function DescriptionTab({ description }: { description?: string | null }) {
  if (!description) {
    return (
      <Card className="p-6 text-sm text-muted-foreground">
        No description available for this product.
      </Card>
    );
  }
  const paragraphs = description.split(/\n{2,}|\r\n{2,}/).filter(Boolean);
  return (
    <Card className="p-6">
      <div className="prose prose-sm max-w-none space-y-4">
        {paragraphs.map((p, i) => {
          const trimmed = p.trim();
          // Headings (lines starting with #)
          if (trimmed.startsWith('### ')) {
            return (
              <h3 key={i} className="text-base font-semibold text-foreground mt-4">
                {trimmed.slice(4)}
              </h3>
            );
          }
          if (trimmed.startsWith('## ')) {
            return (
              <h2 key={i} className="text-lg font-semibold text-foreground mt-4">
                {trimmed.slice(3)}
              </h2>
            );
          }
          if (trimmed.startsWith('# ')) {
            return (
              <h1 key={i} className="text-xl font-bold text-foreground">
                {trimmed.slice(2)}
              </h1>
            );
          }
          // Bulleted list (lines starting with -)
          if (trimmed.split('\n').every((l) => l.trim().startsWith('-'))) {
            return (
              <ul key={i} className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                {trimmed.split('\n').map((l, j) => (
                  <li key={j}>{l.trim().slice(2)}</li>
                ))}
              </ul>
            );
          }
          return (
            <p key={i} className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
              {trimmed}
            </p>
          );
        })}
      </div>
    </Card>
  );
}

/* ============================================================
   Specifications tab — comprehensive spec table
   ============================================================ */
function SpecificationsTab({ product }: { product: any }) {
  const sections = useMemo(() => {
    const arr: { title: string; rows: { label: string; value: string | null }[] }[] = [];

    /* General */
    arr.push({
      title: 'General Information',
      rows: [
        { label: 'Product type', value: product.productType },
        { label: 'SKU', value: product.sku },
        { label: 'MPN', value: product.mpn },
        { label: 'Brand', value: product.brand },
        { label: 'Category', value: product.category?.name ?? null },
        { label: 'Country of origin', value: product.countryOfOrigin },
        { label: 'Warranty', value: product.warranty },
        { label: 'Released', value: product.releaseDate ? formatDate(product.releaseDate) : null },
      ],
    });

    /* Physical */
    if (product.productType === 'PHYSICAL') {
      const dims =
        product.length || product.width || product.height
          ? `${product.length ?? '—'} × ${product.width ?? '—'} × ${product.height ?? '—'} mm`
          : null;
      arr.push({
        title: 'Physical Attributes',
        rows: [
          { label: 'Weight', value: product.weight ? `${product.weight} g` : null },
          { label: 'Dimensions (L×W×H)', value: dims },
          { label: 'Stock available', value: product.unlimited ? 'Unlimited' : String(product.stockAvailable ?? 0) },
          { label: 'Units sold', value: (product.soldCount ?? 0).toLocaleString('vi-VN') },
        ],
      });
    }

    /* PCB fields */
    if (product.pcbLayers || product.pcbMaterial || product.pcbThickness) {
      arr.push({
        title: 'PCB Specifications',
        rows: [
          { label: 'Layers', value: product.pcbLayers ? `${product.pcbLayers}` : null },
          { label: 'Thickness', value: product.pcbThickness ? `${product.pcbThickness} mm` : null },
          { label: 'Material', value: product.pcbMaterial },
          { label: 'Surface finish', value: product.pcbSurfaceFinish },
          { label: 'Copper weight', value: product.pcbCopperWeight },
          { label: 'Min track width', value: product.pcbMinTrack },
          { label: 'Min spacing', value: product.pcbMinSpacing },
          { label: 'Color', value: product.pcbColor },
          { label: 'Dimensions', value: product.pcbDimensions },
          { label: 'Revision', value: product.pcbRevision },
          { label: 'MOQ', value: product.pcbMoq ? `${product.pcbMoq} units` : null },
          { label: 'Lead time', value: product.pcbLeadTimeDays ? `${product.pcbLeadTimeDays} days` : null },
        ],
      });
    }

    /* Digital fields */
    if (product.productType === 'DIGITAL' || product.software) {
      arr.push({
        title: 'Digital Product',
        rows: [
          { label: 'Software', value: product.software },
          { label: 'Software version', value: product.softwareVersion },
          { label: 'Current version', value: product.currentVersion },
          { label: 'File format', value: product.fileFormat },
          {
            label: 'File size',
            value: product.fileSizeBytes ? formatFileSize(product.fileSizeBytes) : null,
          },
          { label: 'License type', value: formatLicenseType(product.licenseType) },
          { label: 'Compatibility', value: formatCompatibility(product.compatibility) },
          { label: 'Downloads', value: (product.downloadCount ?? 0).toLocaleString('vi-VN') },
          { label: 'Released', value: product.releaseDate ? formatDate(product.releaseDate) : null },
        ],
      });
    }

    /* Service fields */
    if (product.productType === 'SERVICE' || product.serviceScope) {
      arr.push({
        title: 'Service Details',
        rows: [
          { label: 'Service scope', value: product.serviceScope },
          { label: 'Deliverables', value: product.serviceDeliverables },
          {
            label: 'Duration',
            value: product.serviceDurationDays ? `${product.serviceDurationDays} days` : null,
          },
          {
            label: 'Revisions',
            value: product.serviceRevisions ? `${product.serviceRevisions} included` : null,
          },
          { label: 'Portfolio', value: product.servicePortfolio },
        ],
      });
    }

    /* Pricing & ratings */
    const _pct = product.compareAtPrice ? calcPct(product.price, product.compareAtPrice) : 0;
    arr.push({
      title: 'Pricing & Reviews',
      rows: [
        { label: 'Price', value: formatVND(product.price) },
        { label: 'Compare at', value: product.compareAtPrice ? formatVND(product.compareAtPrice) : null },
        { label: 'Discount', value: _pct > 0 ? `${_pct}%` : null },
        { label: 'Rating', value: product.rating ? `${product.rating.toFixed(1)} / 5` : null },
        { label: 'Rating count', value: (product.ratingCount ?? 0).toLocaleString('vi-VN') },
        { label: 'Sold count', value: (product.soldCount ?? 0).toLocaleString('vi-VN') },
        { label: 'View count', value: (product.viewCount ?? 0).toLocaleString('vi-VN') },
      ],
    });

    return arr;
  }, [product]);

  return (
    <div className="space-y-4">
      {sections.map((sec) => {
        const visible = sec.rows.filter((r) => r.value);
        if (visible.length === 0) return null;
        return (
          <Card key={sec.title} className="p-5">
            <h3 className="text-sm font-semibold text-cyan-700 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Cpu className="h-3.5 w-3.5" />
              {sec.title}
            </h3>
            <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-2 text-sm">
              {visible.map((r) => (
                <div key={r.label} className="flex items-center justify-between gap-3 border-b border-border/40 py-1.5">
                  <dt className="text-muted-foreground">{r.label}</dt>
                  <dd className="font-mono text-foreground text-right truncate">{r.value}</dd>
                </div>
              ))}
            </dl>
          </Card>
        );
      })}
    </div>
  );
}

/* ============================================================
   Versions tab — for digital products
   ============================================================ */
function VersionsTab({ versions }: { versions: any[] }) {
  if (!versions || versions.length === 0) {
    return (
      <Card className="p-6 text-sm text-muted-foreground">
        No version history available.
      </Card>
    );
  }
  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-cyan-200 bg-cyan-50/40 p-3 flex items-start gap-2 text-sm text-cyan-700">
        <RefreshCw className="h-4 w-4 mt-0.5" />
        <p>
          <span className="font-semibold">Update policy:</span> All future updates for this product
          are free for lifetime. You'll be notified by email when a new version is released.
        </p>
      </div>
      {versions.map((v: any, i: number) => (
        <Card key={v.id ?? i} className="p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-teal-400 text-white">
                <Download className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-foreground">Version {v.version}</h3>
                  {i === 0 && (
                    <Badge className="bg-gradient-to-r from-cyan-500 to-teal-400 text-white border-0 text-[10px]">
                      LATEST
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Released {formatDate(v.releaseDate)}
                </p>
              </div>
            </div>
            <div className="flex flex-col items-end gap-1 text-xs text-muted-foreground">
              {v.fileSizeBytes && (
                <span className="flex items-center gap-1">
                  <FileArchive className="h-3 w-3" />
                  {formatFileSize(v.fileSizeBytes)}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Download className="h-3 w-3" />
                {(v.downloadCount ?? 0).toLocaleString('vi-VN')} downloads
              </span>
            </div>
          </div>
          {v.changelog && (
            <div className="mt-4 pt-4 border-t border-border/60">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                Changelog
              </p>
              <div className="text-sm text-muted-foreground whitespace-pre-line leading-relaxed">
                {v.changelog}
              </div>
            </div>
          )}
        </Card>
      ))}
    </div>
  );
}

/* ============================================================
   Reviews tab
   ============================================================ */
function ReviewsTab({ product }: { product: any }) {
  const reviews = (product.reviews ?? []) as any[];
  const { user } = useAuthStore();
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  /* Rating distribution */
  const distribution = useMemo(() => {
    const counts = [0, 0, 0, 0, 0, 0]; // index 1..5
    for (const r of reviews) {
      const v = Math.max(1, Math.min(5, r.rating));
      counts[v] = (counts[v] ?? 0) + 1;
    }
    const total = reviews.length || 1;
    return [5, 4, 3, 2, 1].map((star) => ({
      star,
      count: counts[star] ?? 0,
      pct: Math.round(((counts[star] ?? 0) / total) * 100),
    }));
  }, [reviews]);

  async function submitReview() {
    setSubmitting(true);
    try {
      const res = await fetch('/api/v1/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.id ?? 'demo-buyer',
          productId: product.id,
          rating: reviewRating,
          comment: reviewComment,
        }),
      });
      const json = await res.json();
      if (json.success) {
        toast({
          title: 'Review submitted',
          description: 'Thanks for your feedback!',
        });
        setShowForm(false);
        setReviewComment('');
        setReviewRating(5);
      } else {
        toast({
          title: 'Could not submit review',
          description: json.message ?? 'Please try again later.',
          variant: 'destructive',
        });
      }
    } catch (err) {
      toast({
        title: 'Network error',
        description: 'Please try again later.',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-5">
      {/* Rating summary + distribution */}
      <Card className="p-5">
        <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-6">
          <div className="text-center md:border-r md:border-border/60 md:pr-6">
            <p className="text-5xl font-bold text-cyan-700 tracking-tight">
              {(product.rating ?? 0).toFixed(1)}
            </p>
            <Rating
              value={product.rating ?? 0}
              size="md"
              showCount={false}
              className="justify-center mt-2"
            />
            <p className="text-xs text-muted-foreground mt-2">
              {(product.ratingCount ?? 0).toLocaleString('vi-VN')} ratings
            </p>
          </div>
          <div className="space-y-1.5">
            {distribution.map((d) => (
              <div key={d.star} className="flex items-center gap-2 text-xs">
                <span className="flex items-center gap-0.5 w-12 text-muted-foreground">
                  {d.star}
                  <Star className="h-3 w-3 text-amber-400 fill-amber-400" />
                </span>
                <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-amber-400 to-amber-300"
                    style={{ width: `${d.pct}%` }}
                  />
                </div>
                <span className="w-10 text-right text-muted-foreground tabular-nums">
                  {d.pct}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Write a review button + form */}
      <div>
        {!showForm ? (
          <Button
            variant="outline"
            className="border-cyan-200 text-cyan-700 hover:bg-cyan-50"
            onClick={() => setShowForm(true)}
          >
            <StarIcon className="h-4 w-4" />
            Write a review
          </Button>
        ) : (
          <Card className="p-5 space-y-3">
            <h3 className="font-semibold text-foreground">Write your review</h3>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Your rating:</span>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((s) => (
                  <button
                    key={s}
                    onClick={() => setReviewRating(s)}
                    aria-label={`${s} stars`}
                  >
                    <Star
                      className={cn(
                        'h-5 w-5 transition-colors',
                        s <= reviewRating
                          ? 'text-amber-400 fill-amber-400'
                          : 'text-slate-300 fill-slate-200 hover:text-amber-300',
                      )}
                    />
                  </button>
                ))}
              </div>
            </div>
            <textarea
              value={reviewComment}
              onChange={(e) => setReviewComment(e.target.value)}
              placeholder="Share your experience with this product…"
              className="w-full min-h-[100px] rounded-lg border border-border bg-white px-3 py-2 text-sm focus-visible:border-cyan-500 focus-visible:ring-cyan-500/30 outline-none"
            />
            <div className="flex items-center gap-2">
              <Button
                className="bg-cyan-500 hover:bg-cyan-600 text-white"
                onClick={submitReview}
                disabled={submitting}
              >
                {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                Submit review
              </Button>
              <Button variant="outline" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
            </div>
          </Card>
        )}
      </div>

      {/* Reviews list */}
      {reviews.length === 0 ? (
        <Card className="p-6 text-sm text-muted-foreground text-center">
          No reviews yet. Be the first to review this product.
        </Card>
      ) : (
        <div className="space-y-3">
          {reviews.map((r) => (
            <Card key={r.id} className="p-4">
              <div className="flex items-start gap-3">
                <Avatar>
                  {r.user?.avatarUrl && (
                    <AvatarImage src={r.user.avatarUrl} alt={r.user?.name ?? 'Reviewer'} />
                  )}
                  <AvatarFallback className="bg-cyan-100 text-cyan-700 font-semibold text-xs">
                    {initials(r.user?.name ?? 'A')}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-foreground text-sm">
                      {r.user?.name ?? 'Anonymous'}
                    </span>
                    {r.verifiedPurchase && (
                      <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 gap-1 text-[10px] py-0">
                        <CheckCircle2 className="h-3 w-3" />
                        Verified purchase
                      </Badge>
                    )}
                    <span className="text-xs text-muted-foreground">{timeAgo(r.createdAt)}</span>
                  </div>
                  <Rating value={r.rating} size="xs" showCount={false} className="mt-1" />
                  {r.comment && (
                    <p className="text-sm text-muted-foreground leading-relaxed mt-2">
                      {r.comment}
                    </p>
                  )}
                  {r.sellerReply && (
                    <div className="mt-3 ml-3 pl-3 border-l-2 border-cyan-200 text-sm">
                      <p className="text-xs font-semibold text-cyan-700 mb-1">
                        Seller reply
                      </p>
                      <p className="text-muted-foreground">{r.sellerReply}</p>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

/* ============================================================
   Shipping tab
   ============================================================ */
function ShippingTab({ product }: { product: any }) {
  const isDigital = product.productType === 'DIGITAL';
  const isService = product.productType === 'SERVICE';

  if (isDigital) {
    return (
      <Card className="p-6">
        <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
          <Download className="h-4 w-4 text-cyan-600" />
          Digital delivery
        </h3>
        <ul className="space-y-3 text-sm text-muted-foreground">
          <li className="flex items-start gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
            <span><strong className="text-foreground">Instant download</strong> after payment confirmation.</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
            <span><strong className="text-foreground">License granted immediately</strong> — your license key is available in your Downloads page.</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
            <span><strong className="text-foreground">Download logs stored securely</strong> for license verification and audit purposes.</span>
          </li>
          <li className="flex items-start gap-2">
            <ShieldCheck className="h-4 w-4 text-cyan-500 mt-0.5 shrink-0" />
            <span>All downloads are scanned for malware and integrity-checked with SHA-256 hashes.</span>
          </li>
        </ul>
      </Card>
    );
  }

  if (isService) {
    return (
      <Card className="p-6">
        <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
          <Briefcase className="h-4 w-4 text-amber-600" />
          Service delivery
        </h3>
        <ul className="space-y-3 text-sm text-muted-foreground">
          <li className="flex items-start gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
            <span>Service starts within <strong className="text-foreground">24 hours</strong> after payment.</span>
          </li>
          <li className="flex items-start gap-2">
            <Clock className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
            <span>Estimated duration: <strong className="text-foreground">{product.serviceDurationDays ?? 7} days</strong> from kick-off.</span>
          </li>
          <li className="flex items-start gap-2">
            <RefreshCw className="h-4 w-4 text-cyan-500 mt-0.5 shrink-0" />
            <span>Includes <strong className="text-foreground">{product.serviceRevisions ?? 0} revision(s)</strong>. Additional revisions available at extra cost.</span>
          </li>
          <li className="flex items-start gap-2">
            <FileCheck2 className="h-4 w-4 text-cyan-500 mt-0.5 shrink-0" />
            <span>Deliverables: <strong className="text-foreground">{product.serviceDeliverables ?? 'As agreed in scope'}</strong>.</span>
          </li>
        </ul>
      </Card>
    );
  }

  // Physical
  const providers = [
    { name: 'GHN', desc: 'Giao Hàng Nhanh — 2-3 days nationwide', cost: 'Free over ₫500K' },
    { name: 'GHTK', desc: 'Giao Hàng Tiết Kiệm — 2-4 days nationwide', cost: '₫25,000–45,000' },
    { name: 'Viettel Post', desc: 'Viettel Post — 1-3 days nationwide', cost: '₫30,000–50,000' },
    { name: 'J&T Express', desc: 'J&T Express — 2-4 days nationwide', cost: '₫22,000–40,000' },
  ];
  return (
    <Card className="p-6">
      <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
        <Truck className="h-4 w-4 text-cyan-600" />
        Shipping information
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {providers.map((p) => (
          <div
            key={p.name}
            className="rounded-lg border border-border/60 p-3 hover:border-cyan-200 hover:bg-cyan-50/40 transition-colors"
          >
            <div className="flex items-center justify-between">
              <span className="font-semibold text-foreground text-sm">{p.name}</span>
              <span className="text-xs text-cyan-700 font-medium">{p.cost}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">{p.desc}</p>
          </div>
        ))}
      </div>
      <div className="mt-4 pt-4 border-t border-border/60 text-sm text-muted-foreground space-y-1.5">
        <p className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-cyan-500" />
          Estimated delivery: <strong className="text-foreground">{product.pcbLeadTimeDays ?? 3}–{(product.pcbLeadTimeDays ?? 3) + 5} business days</strong> (including processing)
        </p>
        <p className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-emerald-500" />
          All shipments are insured. Tracking number provided once shipped.
        </p>
        {product.warranty && (
          <p className="flex items-center gap-2">
            <ThumbsUp className="h-4 w-4 text-amber-500" />
            Warranty: <strong className="text-foreground">{product.warranty}</strong>
          </p>
        )}
      </div>
    </Card>
  );
}

/* ============================================================
   Loading skeleton
   ============================================================ */
function ProductDetailSkeleton() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-white via-cyan-50/20 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        <div className="h-5 w-72 mb-5">
          <Skeleton className="h-5 w-72" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-[5fr_7fr] gap-6 lg:gap-10">
          <div className="space-y-3">
            <Skeleton className="aspect-square w-full rounded-2xl" />
            <div className="grid grid-cols-5 gap-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="aspect-square rounded-lg" />
              ))}
            </div>
          </div>
          <div className="space-y-4">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-5 w-2/3" />
            <Skeleton className="h-20 w-full rounded-xl" />
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-16 w-full rounded-xl" />
            <Skeleton className="h-12 w-full rounded-xl" />
            <div className="grid grid-cols-2 gap-3">
              <Skeleton className="h-12 w-full rounded-xl" />
              <Skeleton className="h-12 w-full rounded-xl" />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

/* ============================================================
   Not found
   ============================================================ */
function ProductNotFound() {
  const goHome = useNavStore((s) => s.goHome);
  const goProducts = useNavStore((s) => s.goProducts);
  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center space-y-4 max-w-md">
        <div className="flex h-20 w-20 mx-auto items-center justify-center rounded-3xl bg-cyan-50 text-cyan-500 border border-cyan-100">
          <PackageSearch className="h-10 w-10" />
        </div>
        <h1 className="text-2xl font-bold text-foreground">Product not found</h1>
        <p className="text-sm text-muted-foreground">
          The product you're looking for doesn't exist or has been removed by the seller.
        </p>
        <div className="flex items-center justify-center gap-3 pt-2">
          <Button variant="outline" onClick={goHome}>
            Back to Home
          </Button>
          <Button className="bg-cyan-500 hover:bg-cyan-600 text-white" onClick={() => goProducts()}>
            Browse Products
          </Button>
        </div>
      </div>
    </main>
  );
}

/* ============================================================
   Utilities
   ============================================================ */

function formatLicenseType(type?: string | null): string {
  if (!type) return '—';
  return type
    .toLowerCase()
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

function formatCompatibility(compat?: string | null): string {
  if (!compat) return '—';
  try {
    const arr = JSON.parse(compat);
    if (Array.isArray(arr)) return arr.join(' / ');
    return compat;
  } catch {
    return compat;
  }
}

export default ProductDetailView;
