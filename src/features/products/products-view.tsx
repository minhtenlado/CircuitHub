'use client';

/* ============================================================
   CircuitHub — ProductsView
   Product listing page with technical filters.
   - Reads initial filters from useNavStore.params (q, category,
     productType, software, sort, minPrice, maxPrice, offset).
   - Sidebar filters (lg+ sticky) + product grid (right).
   - Mobile: filter button opens a Drawer with the same filters.
   - Grid: 2 cols mobile, 3 cols md, 4 cols lg.
   - Pagination: numbered, 12 per page (offset/limit).
   - When filter changes, update URL params via goProducts(newFilters).
   ============================================================ */

import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Search,
  SlidersHorizontal,
  X,
  RotateCcw,
  ChevronDown,
  ChevronRight,
  Package,
  Star,
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
  Check,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Drawer,
  DrawerContent,
  DrawerTrigger,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { useProducts, useCategories } from '@/lib/api/hooks';
import { useNavStore } from '@/stores/nav-store';
import { ProductCard, ProductCardSkeleton } from '@/components/product/product-card';
import { formatVND } from '@/lib/format';
import { cn } from '@/lib/utils';

/* ---------------- Constants ---------------- */

const PAGE_SIZE = 12;
const PRICE_MAX = 5_000_000; // 5M VND cap

const SORT_OPTIONS: { value: string; label: string }[] = [
  { value: 'popular', label: 'Popular' },
  { value: 'newest', label: 'Newest' },
  { value: 'price-asc', label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
  { value: 'rating', label: 'Top Rated' },
  { value: 'trending', label: 'Trending' },
];

const PRODUCT_TYPES: { value: string; label: string; icon: typeof Package }[] = [
  { value: 'PHYSICAL', label: 'Physical', icon: Package },
  { value: 'DIGITAL', label: 'Digital', icon: FileCode },
  { value: 'SERVICE', label: 'Service', icon: Wrench },
  { value: 'BUNDLE', label: 'Bundle', icon: Box },
];

const SOFTWARE_OPTIONS = ['KiCad', 'Altium', 'Proteus', 'Gerber', 'ESP-IDF'];
const PCB_LAYERS_OPTIONS = [2, 4, 6, 8];

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

/* ---------------- Helpers ---------------- */

function getInitialCategory(initialCategory?: string, params?: Record<string, string>) {
  return (params?.category as string) || initialCategory || '';
}

/* ============================================================
   ProductsView
   ============================================================ */
export function ProductsView({ initialCategory }: { initialCategory?: string }) {
  const params = useNavStore((s) => s.params);
  const goProducts = useNavStore((s) => s.goProducts);

  /* ---- URL-driven filter state (single source of truth) ---- */
  const category = getInitialCategory(initialCategory, params);
  const productType = params.productType ?? '';
  const software = params.software ?? '';
  const sort = params.sort ?? 'popular';
  const minPrice = params.minPrice ?? '';
  const maxPrice = params.maxPrice ?? '';
  const offset = Math.max(0, parseInt(params.offset ?? '0', 10) || 0);

  /* ---- Local-only filter state (client-side filtering) ---- */
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [minRating, setMinRating] = useState<number>(0);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [selectedPcbLayers, setSelectedPcbLayers] = useState<number[]>([]);

  /* ---- Search box with debounce (300ms) ----
     We use the "adjust state during render" pattern (recommended by React docs)
     instead of useEffect to sync the local input with the URL `q` param when
     it changes externally (e.g., from header search). */
  const qParam = params.q ?? '';
  const [searchInput, setSearchInput] = useState(qParam);
  const [prevQParam, setPrevQParam] = useState(qParam);
  if (qParam !== prevQParam) {
    setPrevQParam(qParam);
    setSearchInput(qParam);
  }

  /* ---- Apply filters helper ----
     Strips the `slug` key (only present when arriving from a category view)
     before merging — products view uses `category` instead. */
  function applyFilters(newFilters: Record<string, string | undefined>) {
    const merged: Record<string, string> = {};
    const { slug: _slug, ...restParams } = params;
    void _slug;
    for (const [k, v] of Object.entries({ ...restParams, ...newFilters })) {
      if (v !== undefined && v !== '' && v !== null) merged[k] = String(v);
    }
    // Always include category from initialCategory when present
    if (!merged.category && initialCategory) merged.category = initialCategory;
    goProducts(merged);
  }

  // Debounced update to URL (300ms) — setState inside setTimeout is async,
  // so the set-state-in-effect rule does not apply.
  useEffect(() => {
    const t = setTimeout(() => {
      if (qParam !== searchInput) {
        applyFilters({ q: searchInput || undefined, offset: undefined });
      }
    }, 300);
    return () => clearTimeout(t);
  }, [searchInput, qParam, applyFilters]);

  function resetAllFilters() {
    setSearchInput('');
    setSelectedBrands([]);
    setMinRating(0);
    setInStockOnly(false);
    setSelectedPcbLayers([]);
    const merged: Record<string, string> = {};
    if (initialCategory) merged.category = initialCategory;
    merged.sort = 'popular';
    goProducts(merged);
  }

  /* ---- Data fetch ---- */
  const query = useMemo(
    () => ({
      q: qParam || undefined,
      category: category || undefined,
      productType: productType || undefined,
      software: software || undefined,
      sort: sort || 'popular',
      minPrice: minPrice || undefined,
      maxPrice: maxPrice || undefined,
      limit: String(PAGE_SIZE),
      offset: offset > 0 ? String(offset) : undefined,
    }),
    [qParam, category, productType, software, sort, minPrice, maxPrice, offset],
  );
  const { data, isLoading } = useProducts(query);
  const { data: categories } = useCategories();

  /* ---- Apply local filters client-side ---- */
  const allItems = (data?.items ?? []) as any[];
  const visibleItems = useMemo(() => {
    let arr = allItems;
    if (selectedBrands.length > 0) {
      arr = arr.filter((p) => p.brand && selectedBrands.includes(p.brand));
    }
    if (minRating > 0) {
      arr = arr.filter((p) => (p.rating ?? 0) >= minRating);
    }
    if (inStockOnly) {
      arr = arr.filter((p) => p.unlimited || (p.stockAvailable ?? 0) > 0);
    }
    if (selectedPcbLayers.length > 0 && category === 'pcb-boards') {
      arr = arr.filter((p) => p.pcbLayers && selectedPcbLayers.includes(p.pcbLayers));
    }
    return arr;
  }, [allItems, selectedBrands, minRating, inStockOnly, selectedPcbLayers, category]);

  /* ---- Brand options (dynamically populated from current results) ---- */
  const brandOptions = useMemo(() => {
    const set = new Set<string>();
    for (const p of allItems) {
      if (p.brand) set.add(p.brand);
    }
    return Array.from(set).sort();
  }, [allItems]);

  /* ---- Pagination ---- */
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const currentPage = Math.floor(offset / PAGE_SIZE) + 1;

  function goToPage(page: number) {
    const newOffset = (page - 1) * PAGE_SIZE;
    applyFilters({ offset: newOffset > 0 ? String(newOffset) : undefined });
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  /* ---- Price slider state ----
     Same "adjust state during render" pattern: sync local slider state
     with URL `minPrice`/`maxPrice` when they change externally. */
  const minP = minPrice ? parseInt(minPrice, 10) : 0;
  const maxP = maxPrice ? parseInt(maxPrice, 10) : PRICE_MAX;
  const [priceRange, setPriceRange] = useState<[number, number]>([minP, maxP]);
  const [prevPriceKey, setPrevPriceKey] = useState(`${minP}-${maxP}`);
  const priceKey = `${minP}-${maxP}`;
  if (priceKey !== prevPriceKey) {
    setPrevPriceKey(priceKey);
    setPriceRange([minP, maxP]);
  }

  function applyPriceRange(range: [number, number]) {
    applyFilters({
      minPrice: range[0] > 0 ? String(range[0]) : undefined,
      maxPrice: range[1] < PRICE_MAX ? String(range[1]) : undefined,
      offset: undefined,
    });
  }

  /* ---- Mobile drawer state ---- */
  const [drawerOpen, setDrawerOpen] = useState(false);

  /* ============================================================
     Render
     ============================================================ */
  return (
    <main className="min-h-screen bg-gradient-to-b from-white via-cyan-50/20 to-white">
      {/* Page header */}
      <div className="border-b border-border/60 bg-white/70 backdrop-blur-sm sticky top-[60px] z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-teal-400 text-white shadow-[0_8px_18px_-8px_rgba(6,182,212,0.5)]">
                <Package className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                  {initialCategory && categories ? getCategoryName(categories, initialCategory) : 'All Products'}
                </h1>
                <p className="text-xs sm:text-sm text-muted-foreground tabular-nums">
                  {isLoading
                    ? 'Loading products…'
                    : total > 0
                      ? `Showing ${offset + 1}–${Math.min(offset + (data?.items?.length ?? 0), total)} of ${total.toLocaleString('vi-VN')} products`
                      : 'No products found'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {/* Mobile filter button */}
              <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
                <DrawerTrigger asChild>
                  <Button variant="outline" size="sm" className="lg:hidden border-cyan-200 text-cyan-700">
                    <SlidersHorizontal className="h-4 w-4" />
                    Filters
                  </Button>
                </DrawerTrigger>
                <DrawerContent className="max-w-[85vw] sm:max-w-[400px]">
                  <DrawerHeader className="border-b border-border/60">
                    <DrawerTitle className="flex items-center gap-2 text-cyan-700">
                      <SlidersHorizontal className="h-4 w-4" />
                      Filters
                    </DrawerTitle>
                  </DrawerHeader>
                  <div className="flex-1 overflow-y-auto p-4">
                    <FiltersPanel
                      categories={categories}
                      category={category}
                      productType={productType}
                      software={software}
                      minPrice={minPrice}
                      maxPrice={maxPrice}
                      brandOptions={brandOptions}
                      selectedBrands={selectedBrands}
                      minRating={minRating}
                      inStockOnly={inStockOnly}
                      selectedPcbLayers={selectedPcbLayers}
                      priceRange={priceRange}
                      searchInput={searchInput}
                      onSearchChange={setSearchInput}
                      onCategoryChange={(v) => applyFilters({ category: v || undefined, offset: undefined })}
                      onProductTypeChange={(v) => applyFilters({ productType: v || undefined, offset: undefined })}
                      onSoftwareChange={(v) => applyFilters({ software: v || undefined, offset: undefined })}
                      onPriceRangeChange={applyPriceRange}
                      onPriceRangeCommit={applyPriceRange}
                      onBrandsChange={setSelectedBrands}
                      onRatingChange={(v) => setMinRating(v)}
                      onInStockChange={setInStockOnly}
                      onPcbLayersChange={setSelectedPcbLayers}
                      onReset={resetAllFilters}
                    />
                  </div>
                  <div className="border-t border-border/60 p-4 flex gap-2">
                    <Button variant="outline" className="flex-1" onClick={resetAllFilters}>
                      <RotateCcw className="h-4 w-4" />
                      Reset
                    </Button>
                    <Button
                      className="flex-1 bg-cyan-500 hover:bg-cyan-600 text-white"
                      onClick={() => setDrawerOpen(false)}
                    >
                      Show {total.toLocaleString('vi-VN')} results
                    </Button>
                  </div>
                </DrawerContent>
              </Drawer>

              {/* Sort dropdown */}
              <Select value={sort} onValueChange={(v) => applyFilters({ sort: v, offset: undefined })}>
                <SelectTrigger size="sm" className="w-[180px] sm:w-[200px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  {SORT_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>

      {/* Body grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        <div className="lg:grid lg:grid-cols-[280px_1fr] lg:gap-8">
          {/* Sidebar — desktop */}
          <aside className="hidden lg:block">
            <div className="lg:sticky lg:top-32 max-h-[calc(100vh-9rem)] overflow-y-auto pr-2 pb-8 space-y-4">
              <FiltersPanel
                categories={categories}
                category={category}
                productType={productType}
                software={software}
                minPrice={minPrice}
                maxPrice={maxPrice}
                brandOptions={brandOptions}
                selectedBrands={selectedBrands}
                minRating={minRating}
                inStockOnly={inStockOnly}
                selectedPcbLayers={selectedPcbLayers}
                priceRange={priceRange}
                searchInput={searchInput}
                onSearchChange={setSearchInput}
                onCategoryChange={(v) => applyFilters({ category: v || undefined, offset: undefined })}
                onProductTypeChange={(v) => applyFilters({ productType: v || undefined, offset: undefined })}
                onSoftwareChange={(v) => applyFilters({ software: v || undefined, offset: undefined })}
                onPriceRangeChange={setPriceRange}
                onPriceRangeCommit={applyPriceRange}
                onBrandsChange={setSelectedBrands}
                onRatingChange={setMinRating}
                onInStockChange={setInStockOnly}
                onPcbLayersChange={setSelectedPcbLayers}
                onReset={resetAllFilters}
              />
            </div>
          </aside>

          {/* Right column */}
          <div className="min-w-0">
            {/* Result bar — mobile (compact) */}
            <div className="lg:hidden mb-3 text-xs text-muted-foreground tabular-nums">
              {total > 0
                ? `${offset + 1}–${Math.min(offset + (data?.items?.length ?? 0), total)} of ${total.toLocaleString('vi-VN')} products`
                : 'No products found'}
            </div>

            {/* Grid */}
            {isLoading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <ProductCardSkeleton key={i} />
                ))}
              </div>
            ) : visibleItems.length === 0 ? (
              <EmptyState onReset={resetAllFilters} />
            ) : (
              <motion.div
                layout
                className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4"
              >
                {visibleItems.map((p, i) => (
                  <ProductCard key={p.id} product={p} index={i} />
                ))}
              </motion.div>
            )}

            {/* Pagination */}
            {!isLoading && totalPages > 1 && (
              <div className="mt-8 flex items-center justify-center gap-1.5">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === 1}
                  onClick={() => goToPage(currentPage - 1)}
                  className="border-cyan-200 text-cyan-700 hover:bg-cyan-50"
                >
                  <ChevronRight className="h-4 w-4 rotate-180" />
                  Prev
                </Button>
                {getPageNumbers(currentPage, totalPages).map((p, idx) =>
                  p === '...' ? (
                    <span key={`e-${idx}`} className="px-2 text-muted-foreground text-sm">
                      …
                    </span>
                  ) : (
                    <button
                      key={p}
                      onClick={() => goToPage(p as number)}
                      className={cn(
                        'h-8 min-w-8 px-2 rounded-md text-sm font-medium transition-colors',
                        p === currentPage
                          ? 'bg-cyan-500 text-white shadow-sm hover:bg-cyan-600'
                          : 'border border-border bg-white text-foreground hover:bg-cyan-50 hover:border-cyan-200',
                      )}
                    >
                      {p}
                    </button>
                  ),
                )}
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === totalPages}
                  onClick={() => goToPage(currentPage + 1)}
                  className="border-cyan-200 text-cyan-700 hover:bg-cyan-50"
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

/* ============================================================
   FiltersPanel — used both in sidebar (desktop) and Drawer (mobile)
   ============================================================ */
interface FiltersPanelProps {
  categories: any[] | undefined;
  category: string;
  productType: string;
  software: string;
  minPrice: string;
  maxPrice: string;
  brandOptions: string[];
  selectedBrands: string[];
  minRating: number;
  inStockOnly: boolean;
  selectedPcbLayers: number[];
  priceRange: [number, number];
  searchInput: string;
  onSearchChange: (v: string) => void;
  onCategoryChange: (v: string) => void;
  onProductTypeChange: (v: string) => void;
  onSoftwareChange: (v: string) => void;
  onPriceRangeChange: (v: [number, number]) => void;
  onPriceRangeCommit: (v: [number, number]) => void;
  onBrandsChange: (v: string[]) => void;
  onRatingChange: (v: number) => void;
  onInStockChange: (v: boolean) => void;
  onPcbLayersChange: (v: number[]) => void;
  onReset: () => void;
}

function FiltersPanel(props: FiltersPanelProps) {
  const {
    categories,
    category,
    productType,
    software,
    brandOptions,
    selectedBrands,
    minRating,
    inStockOnly,
    selectedPcbLayers,
    priceRange,
    searchInput,
    onSearchChange,
    onCategoryChange,
    onProductTypeChange,
    onSoftwareChange,
    onPriceRangeChange,
    onPriceRangeCommit,
    onBrandsChange,
    onRatingChange,
    onInStockChange,
    onPcbLayersChange,
    onReset,
  } = props;

  const isPcbCategory = category === 'pcb-boards';
  const isDigitalType = productType === 'DIGITAL';

  return (
    <div className="space-y-4">
      {/* Search box */}
      <FilterCard title="Search" icon={Search}>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            value={searchInput}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search products…"
            className="pl-8 h-8 text-sm"
          />
          {searchInput && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label="Clear search"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </FilterCard>

      {/* Product Type */}
      <FilterCard title="Product Type" icon={Package}>
        <div className="space-y-0.5">
          <RadioRow
            label="All types"
            checked={!productType}
            onCheck={() => onProductTypeChange('')}
          />
          {PRODUCT_TYPES.map((pt) => {
            const Icon = pt.icon;
            return (
              <RadioRow
                key={pt.value}
                label={pt.label}
                checked={productType === pt.value}
                onCheck={() => onProductTypeChange(productType === pt.value ? '' : pt.value)}
                icon={<Icon className="h-3.5 w-3.5" />}
              />
            );
          })}
        </div>
      </FilterCard>

      {/* Category tree */}
      <FilterCard title="Category" icon={LayersIcon}>
        <div className="space-y-0.5">
          <RadioRow
            label="All categories"
            checked={!category}
            onCheck={() => onCategoryChange('')}
          />
          {Array.isArray(categories) &&
            categories.map((cat) => {
              const Icon = CATEGORY_ICONS[cat.slug] ?? Package;
              const isSel = category === cat.slug;
              const hasChildren = cat.children && cat.children.length > 0;
              return (
                <CategoryTreeRow
                  key={cat.id}
                  label={cat.name}
                  slug={cat.slug}
                  count={(cat._count?.products ?? 0) as number}
                  icon={<Icon className="h-3.5 w-3.5" />}
                  selected={isSel}
                  onSelect={(slug) => onCategoryChange(category === slug ? '' : slug)}
                  subCategories={cat.children ?? []}
                  activeChildSlug={category}
                />
              );
            })}
        </div>
      </FilterCard>

      {/* Price range */}
      <FilterCard title="Price Range" icon={Cpu}>
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-muted-foreground tabular-nums">
            <span>{formatVND(priceRange[0])}</span>
            <span>{priceRange[1] >= PRICE_MAX ? `${formatVND(PRICE_MAX)}+` : formatVND(priceRange[1])}</span>
          </div>
          <Slider
            min={0}
            max={PRICE_MAX}
            step={50_000}
            value={priceRange}
            onValueChange={(v) => onPriceRangeChange([v[0], v[1]] as [number, number])}
            onValueCommit={(v) => onPriceRangeCommit([v[0], v[1]] as [number, number])}
            className="[&_[data-slot=slider-range]]:bg-gradient-to-r [&_[data-slot=slider-range]]:from-cyan-500 [&_[data-slot=slider-range]]:to-teal-400 [&_[data-slot=slider-thumb]]:border-cyan-500"
          />
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-[10px] text-muted-foreground">Min</Label>
              <Input
                type="number"
                value={priceRange[0] || ''}
                onChange={(e) => onPriceRangeChange([parseInt(e.target.value, 10) || 0, priceRange[1]])}
                onBlur={() => onPriceRangeCommit(priceRange)}
                placeholder="0"
                className="h-7 text-xs"
              />
            </div>
            <div>
              <Label className="text-[10px] text-muted-foreground">Max</Label>
              <Input
                type="number"
                value={priceRange[1] >= PRICE_MAX ? '' : priceRange[1]}
                onChange={(e) => onPriceRangeChange([priceRange[0], parseInt(e.target.value, 10) || PRICE_MAX])}
                onBlur={() => onPriceRangeCommit(priceRange)}
                placeholder="Any"
                className="h-7 text-xs"
              />
            </div>
          </div>
        </div>
      </FilterCard>

      {/* Software — only when DIGITAL selected */}
      {isDigitalType && (
        <FilterCard title="Software" icon={FileCode}>
          <div className="space-y-0.5">
            <RadioRow
              label="All software"
              checked={!software}
              onCheck={() => onSoftwareChange('')}
            />
            {SOFTWARE_OPTIONS.map((sw) => (
              <RadioRow
                key={sw}
                label={sw}
                checked={software === sw}
                onCheck={() => onSoftwareChange(software === sw ? '' : sw)}
              />
            ))}
          </div>
        </FilterCard>
      )}

      {/* PCB Layers — only when category is PCB */}
      {isPcbCategory && (
        <FilterCard title="PCB Layers" icon={LayersIcon}>
          <div className="space-y-0.5">
            {PCB_LAYERS_OPTIONS.map((layer) => (
              <CheckRow
                key={layer}
                label={`${layer} layers`}
                checked={selectedPcbLayers.includes(layer)}
                onCheck={(checked) =>
                  onPcbLayersChange(
                    checked
                      ? [...selectedPcbLayers, layer]
                      : selectedPcbLayers.filter((l) => l !== layer),
                  )
                }
              />
            ))}
          </div>
        </FilterCard>
      )}

      {/* Brand — dynamic from current results */}
      {brandOptions.length > 0 && (
        <FilterCard title={`Brand (${brandOptions.length})`} icon={Cpu}>
          <div className="space-y-0.5 max-h-48 overflow-y-auto -mr-2 pr-2">
            {brandOptions.map((b) => (
              <CheckRow
                key={b}
                label={b}
                checked={selectedBrands.includes(b)}
                onCheck={(checked) =>
                  onBrandsChange(
                    checked
                      ? [...selectedBrands, b]
                      : selectedBrands.filter((x) => x !== b),
                  )
                }
              />
            ))}
          </div>
        </FilterCard>
      )}

      {/* Rating minimum */}
      <FilterCard title="Minimum Rating" icon={Star}>
        <div className="space-y-0.5">
          <RadioRow label="Any rating" checked={minRating === 0} onCheck={() => onRatingChange(0)} />
          <RadioRow
            label="4★ & up"
            checked={minRating === 4}
            onCheck={() => onRatingChange(4)}
            icon={<RatingMini value={4} />}
          />
          <RadioRow
            label="3★ & up"
            checked={minRating === 3}
            onCheck={() => onRatingChange(3)}
            icon={<RatingMini value={3} />}
          />
        </div>
      </FilterCard>

      {/* In stock toggle */}
      <FilterCard title="Availability" icon={Check}>
        <label
          htmlFor="in-stock-only"
          className="flex items-center justify-between gap-2 cursor-pointer rounded-md px-1.5 py-1.5 hover:bg-cyan-50 transition-colors"
        >
          <span className="text-sm text-foreground">In stock only</span>
          <Switch id="in-stock-only" checked={inStockOnly} onCheckedChange={onInStockChange} />
        </label>
      </FilterCard>

      {/* Reset button */}
      <Button variant="outline" className="w-full border-cyan-200 text-cyan-700 hover:bg-cyan-50" onClick={onReset}>
        <RotateCcw className="h-3.5 w-3.5" />
        Reset all filters
      </Button>
    </div>
  );
}

/* ============================================================
   Sub-components
   ============================================================ */

function FilterCard({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: typeof Package;
  children: React.ReactNode;
}) {
  return (
    <Card className="py-3 px-3 gap-3 border-border/60 bg-white/80 backdrop-blur-sm">
      <div className="flex items-center gap-1.5 px-0 text-xs font-semibold uppercase tracking-wider text-cyan-700">
        <Icon className="h-3.5 w-3.5" />
        {title}
      </div>
      <div className="px-0">{children}</div>
    </Card>
  );
}

function RadioRow({
  label,
  checked,
  onCheck,
  icon,
}: {
  label: string;
  checked: boolean;
  onCheck: () => void;
  icon?: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onCheck}
      className={cn(
        'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-left transition-colors hover:bg-cyan-50',
        checked && 'bg-cyan-50 text-cyan-700 font-medium',
      )}
    >
      <span
        className={cn(
          'flex h-3.5 w-3.5 items-center justify-center rounded-full border transition-colors',
          checked ? 'bg-cyan-500 border-cyan-500' : 'border-input bg-background',
        )}
      >
        {checked && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
      </span>
      {icon && <span className="text-muted-foreground">{icon}</span>}
      <span className="truncate">{label}</span>
    </button>
  );
}

function CheckRow({
  label,
  checked,
  onCheck,
}: {
  label: string;
  checked: boolean;
  onCheck: (checked: boolean) => void;
}) {
  return (
    <label
      className={cn(
        'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm cursor-pointer transition-colors hover:bg-cyan-50',
        checked && 'text-cyan-700 font-medium',
      )}
    >
      <Checkbox checked={checked} onCheckedChange={(v) => onCheck(!!v)} className="data-[state=checked]:bg-cyan-500 data-[state=checked]:border-cyan-500" />
      <span className="truncate">{label}</span>
    </label>
  );
}

function CategoryTreeRow({
  label,
  slug,
  count,
  icon,
  selected,
  onSelect,
  subCategories,
  activeChildSlug,
}: {
  label: string;
  slug: string;
  count: number;
  icon: React.ReactNode;
  selected: boolean;
  onSelect: (slug: string) => void;
  subCategories: any[];
  activeChildSlug: string;
}) {
  const hasChildren = subCategories && subCategories.length > 0;
  const [open, setOpen] = useState(true);

  return (
    <div>
      <div
        className={cn(
          'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm cursor-pointer transition-colors hover:bg-cyan-50',
          selected && 'bg-cyan-50 text-cyan-700 font-medium',
        )}
        onClick={() => onSelect(slug)}
      >
        {hasChildren ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setOpen((o) => !o);
            }}
            className="text-muted-foreground hover:text-foreground"
            aria-label={open ? 'Collapse' : 'Expand'}
          >
            <ChevronDown className={cn('h-3.5 w-3.5 transition-transform', !open && '-rotate-90')} />
          </button>
        ) : (
          <span className="flex h-3.5 w-3.5 items-center justify-center">
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/50" />
          </span>
        )}
        <span
          className={cn(
            'flex h-3.5 w-3.5 items-center justify-center rounded-full border transition-colors',
            selected ? 'bg-cyan-500 border-cyan-500' : 'border-input bg-background',
          )}
        >
          {selected && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
        </span>
        <span className="text-muted-foreground">{icon}</span>
        <span className="truncate flex-1">{label}</span>
        {count > 0 && (
          <span className="text-[10px] text-muted-foreground tabular-nums">
            {count.toLocaleString('vi-VN')}
          </span>
        )}
      </div>
      {hasChildren && open && (
        <div className="ml-3 border-l border-border/60 pl-2 mt-0.5 space-y-0.5">
          {subCategories.map((ch: any) => {
            const isChildSel = activeChildSlug === ch.slug;
            return (
              <div
                key={ch.id}
                onClick={() => onSelect(ch.slug)}
                className={cn(
                  'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm cursor-pointer transition-colors hover:bg-cyan-50',
                  isChildSel && 'bg-cyan-50 text-cyan-700 font-medium',
                )}
              >
                <span
                  className={cn(
                    'flex h-3 w-3 items-center justify-center rounded-full border transition-colors',
                    isChildSel ? 'bg-cyan-500 border-cyan-500' : 'border-input bg-background',
                  )}
                >
                  {isChildSel && <span className="h-1 w-1 rounded-full bg-white" />}
                </span>
                <span className="truncate flex-1">{ch.name}</span>
                {(ch._count?.products ?? 0) > 0 && (
                  <span className="text-[10px] text-muted-foreground tabular-nums">
                    {(ch._count?.products as number).toLocaleString('vi-VN')}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function RatingMini({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          className={cn(
            'h-3 w-3',
            s <= value ? 'text-amber-400 fill-amber-400' : 'text-slate-200 fill-slate-100',
          )}
        />
      ))}
    </div>
  );
}

function EmptyState({ onReset }: { onReset: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-cyan-50 text-cyan-500 border border-cyan-100">
        <PackageSearch className="h-8 w-8" />
      </div>
      <div>
        <p className="text-lg font-semibold text-foreground">No products found</p>
        <p className="text-sm text-muted-foreground mt-1 max-w-md">
          Try adjusting your search or filters to find what you're looking for.
        </p>
      </div>
      <Button variant="outline" className="border-cyan-200 text-cyan-700 hover:bg-cyan-50" onClick={onReset}>
        <RotateCcw className="h-4 w-4" />
        Reset filters
      </Button>
    </div>
  );
}

/* ============================================================
   Utilities
   ============================================================ */

function getCategoryName(categories: any[], slug: string): string {
  for (const c of categories) {
    if (c.slug === slug) return c.name;
    if (Array.isArray(c.children)) {
      for (const ch of c.children) {
        if (ch.slug === slug) return ch.name;
      }
    }
  }
  return 'Products';
}

function getPageNumbers(current: number, total: number): (number | '...')[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }
  const result: (number | '...')[] = [1];
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  if (start > 2) result.push('...');
  for (let i = start; i <= end; i++) result.push(i);
  if (end < total - 1) result.push('...');
  result.push(total);
  return result;
}

export default ProductsView;
