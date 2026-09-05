'use client';

import * as React from 'react';
import { useEffect, useRef, useState } from 'react';
import { useNavStore, type ViewRole } from '@/stores/nav-store';
import { useCartStore } from '@/stores/cart-store';
import { useWishlistStore } from '@/stores/wishlist-store';
import { useAuthStore } from '@/stores/auth-store';
import { useSearchHistoryStore } from '@/stores/search-history-store';
import { useNotifications } from '@/lib/api/hooks';
import { Logo } from '@/components/logo';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { useTheme } from 'next-themes';
import {
  Search,
  ShoppingCart,
  Heart,
  Bell,
  Menu,
  Moon,
  Sun,
  User,
  Settings,
  Package,
  Download,
  LogOut,
  ChevronDown,
  UserPlus,
  ChevronRight,
  Cpu,
  Zap,
  Store,
  FileSpreadsheet,
  Clock,
  X,
  Truck,
  DollarSign,
  Wallet,
  Sparkles,
  CheckCircle2,
  XCircle,
  Globe,
  Check,
  Shield,
  CircuitBoard,
  FileCode,
  AlertCircle,
  Layers as LayersIcon,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { initials, timeAgo } from '@/lib/format';
import { cn } from '@/lib/utils';
import { useI18n, LANGS, type Lang } from '@/lib/i18n';

/* ============================================================
   CircuitHub Header
   Sticky, glass-blur on scroll, responsive.
   ============================================================ */

const POPULAR_SEARCHES = ['ESP32', 'STM32', 'KiCad 9', '4-layer PCB'];

interface NavLinkDef {
  label: string;
  icon: React.ReactNode;
  active: (view: string, params: Record<string, string>) => boolean;
  go: () => void;
}

/* ---------- Desktop Nav Pills ---------- */
function NavPills({ onNavigate }: { onNavigate?: () => void }) {
  const view = useNavStore((s) => s.view);
  const params = useNavStore((s) => s.params);
  const goHome = useNavStore((s) => s.goHome);
  const goProducts = useNavStore((s) => s.goProducts);
  const goCategory = useNavStore((s) => s.goCategory);
  const { t } = useI18n();

  const links: NavLinkDef[] = [
    { label: t('nav.marketplace'), icon: <Cpu className="h-3.5 w-3.5" />, active: (v) => v === 'home', go: goHome },
    { label: t('nav.products'), icon: <Package className="h-3.5 w-3.5" />, active: (v) => v === 'products', go: goProducts },
    {
      label: t('nav.pcbBoards'),
      icon: <LayersIcon className="h-3.5 w-3.5" />,
      active: (v, p) => v === 'category' && p.slug === 'pcb-boards',
      go: () => goCategory('pcb-boards'),
    },
    {
      label: t('nav.devBoards'),
      icon: <CircuitBoard className="h-3.5 w-3.5" />,
      active: (v, p) => v === 'category' && p.slug === 'dev-boards',
      go: () => goCategory('dev-boards'),
    },
    {
      label: t('nav.components'),
      icon: <Cpu className="h-3.5 w-3.5" />,
      active: (v, p) => v === 'category' && p.slug === 'components',
      go: () => goCategory('components'),
    },
    {
      label: t('nav.openSource'),
      icon: <FileCode className="h-3.5 w-3.5" />,
      active: (v, p) => v === 'category' && p.slug === 'open-source',
      go: () => goCategory('open-source'),
    },
  ];

  return (
    <ul className="flex items-center gap-1">
      {links.map((l) => {
        const isActive = l.active(view, params);
        return (
          <li key={l.label}>
            <button
              onClick={() => {
                l.go();
                onNavigate?.();
              }}
              aria-current={isActive ? 'page' : undefined}
              className={cn(
                'group inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-all',
                isActive
                  ? 'bg-primary text-primary-foreground shadow-[0_4px_14px_-4px_rgba(6,182,212,0.55)]'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent',
              )}
            >
              <span
                className={cn(
                  'transition-colors',
                  isActive ? 'text-primary-foreground' : 'text-muted-foreground/70 group-hover:text-primary',
                )}
              >
                {l.icon}
              </span>
              {l.label}
            </button>
          </li>
        );
      })}
    </ul>
  );
}

/* ---------- Search Bar ---------- */
/* ---------- Search Bar with Live Autocomplete ---------- */
interface SearchResult {
  products: Array<{
    id: string;
    name: string;
    slug: string;
    price: number;
    productType: string;
    brand: string | null;
    rating: number;
    imageUrl?: string;
    shopName?: string;
    shopVerified?: boolean;
  }>;
  categories: Array<{ id: string; name: string; slug: string; icon?: string | null }>;
  shops: Array<{
    id: string;
    name: string;
    slug: string;
    logoUrl?: string | null;
    verified: boolean;
    rating: number;
  }>;
  brands: string[];
}

function SearchBar({ compact = false }: { compact?: boolean }) {
  const goProducts = useNavStore((s) => s.goProducts);
  const goProduct = useNavStore((s) => s.goProduct);
  const goCategory = useNavStore((s) => s.goCategory);
  const goShop = useNavStore((s) => s.goShop);
  const searchHistory = useSearchHistoryStore();
  const { t } = useI18n();
  const [query, setQuery] = useState('');
  const [focused, setFocused] = useState(false);
  const [results, setResults] = useState<SearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!wrapperRef.current?.contains(e.target as Node)) setFocused(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const q = query.trim();
    if (q.length < 2) {
      setResults(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/v1/search?q=${encodeURIComponent(q)}`);
        const json = await res.json();
        if (json.success) {
          setResults(json.data);
        }
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  const submit = (q?: string) => {
    const term = (q ?? query).trim();
    if (term) searchHistory.add(term);
    goProducts(term ? { q: term } : {});
    setFocused(false);
  };

  const hasResults = results && (
    results.products.length > 0 ||
    results.categories.length > 0 ||
    results.shops.length > 0 ||
    results.brands.length > 0
  );

  // Flatten all items for keyboard navigation
  const flatItems: Array<{ type: 'product' | 'category' | 'shop' | 'brand'; data: any; label: string }> = [];
  if (results) {
    results.products.forEach((p) => flatItems.push({ type: 'product', data: p, label: p.name }));
    results.categories.forEach((c) => flatItems.push({ type: 'category', data: c, label: c.name }));
    results.shops.forEach((s) => flatItems.push({ type: 'shop', data: s, label: s.name }));
    results.brands.forEach((b) => flatItems.push({ type: 'brand', data: b, label: b }));
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') {
      if (activeIndex >= 0 && activeIndex < flatItems.length) {
        const item = flatItems[activeIndex];
        handleSelect(item.type, item.data);
      } else {
        submit();
      }
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, flatItems.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, -1));
    } else if (e.key === 'Escape') {
      setFocused(false);
    }
  }

  function handleSelect(type: string, data: any) {
    setFocused(false);
    if (type === 'product') goProduct(data.slug);
    else if (type === 'category') goCategory(data.slug);
    else if (type === 'shop') goShop(data.slug);
    else if (type === 'brand') goProducts({ q: data });
  }

  return (
    <div ref={wrapperRef} className="relative w-full">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setActiveIndex(-1);
          }}
          onFocus={() => setFocused(true)}
          onKeyDown={handleKeyDown}
          placeholder={t('common.searchPlaceholder')}
          aria-label="Search CircuitHub"
          className={cn(
            'h-10 rounded-full border-border/70 bg-background/70 pl-9 pr-9 text-sm shadow-xs transition-all',
            'focus-visible:border-primary focus-visible:ring-primary/30 focus-visible:ring-[3px]',
            compact && 'h-9',
          )}
        />
        {loading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-cyan-300 border-t-cyan-600" />
          </div>
        )}
        {!loading && query && (
          <button
            onClick={() => { setQuery(''); setResults(null); }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            aria-label="Clear search"
          >
            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Autocomplete dropdown */}
      <AnimatePresence>
        {focused && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className="absolute left-0 right-0 top-[calc(100%+6px)] z-50 rounded-xl border border-border/70 bg-popover/95 shadow-lg backdrop-blur-md max-h-[70vh] overflow-y-auto"
          >
            {/* No query: show recent + popular searches */}
            {!query.trim() && (
              <div className="p-3 space-y-3">
                {searchHistory.searches.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between px-1 pb-1.5">
                      <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                        {t('common.recentSearches')}
                      </span>
                      <button
                        onClick={() => searchHistory.clear()}
                        className="text-[10px] text-muted-foreground hover:text-rose-500 transition-colors"
                      >
                        {t('common.clear')}
                      </button>
                    </div>
                    <div className="space-y-0.5">
                      {searchHistory.searches.map((s) => (
                        <button
                          key={s}
                          onClick={() => { setQuery(s); submit(s); }}
                          className="flex items-center gap-2 w-full rounded-md px-2 py-1.5 text-sm text-left hover:bg-cyan-50 transition-colors group"
                        >
                          <Clock className="h-3.5 w-3.5 text-muted-foreground group-hover:text-cyan-600 flex-shrink-0" />
                          <span className="flex-1 truncate text-slate-700">{s}</span>
                          <span
                            onClick={(e) => { e.stopPropagation(); searchHistory.remove(s); }}
                            className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-rose-500 p-0.5 rounded transition-all"
                          >
                            <X className="h-3 w-3" />
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                <div>
                  <div className="px-1 pb-1.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                    {t('common.popularSearches')}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {POPULAR_SEARCHES.map((s) => (
                      <button
                        key={s}
                        onClick={() => { setQuery(s); submit(s); }}
                        className="rounded-full border border-cyan-200/60 bg-cyan-50/60 px-2.5 py-1 text-xs font-medium text-cyan-800 transition-colors hover:border-primary hover:bg-primary hover:text-primary-foreground"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Query too short */}
            {query.trim().length > 0 && query.trim().length < 2 && (
              <div className="p-4 text-center text-sm text-muted-foreground">
                {t('common.keepTyping')}
              </div>
            )}

            {/* Loading */}
            {query.trim().length >= 2 && loading && (
              <div className="p-4 text-center text-sm text-muted-foreground flex items-center justify-center gap-2">
                <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-cyan-300 border-t-cyan-600" />
                {t('common.searching')}
              </div>
            )}

            {/* Results */}
            {query.trim().length >= 2 && !loading && hasResults && (
              <div className="p-2">
                {/* Products */}
                {results!.products.length > 0 && (
                  <div className="mb-2">
                    <div className="px-2 py-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                      {t('nav.products')} ({results!.products.length})
                    </div>
                    {results!.products.map((p, i) => {
                      const idx = flatItems.findIndex((it) => it.type === 'product' && it.data.id === p.id);
                      return (
                        <button
                          key={p.id}
                          onClick={() => handleSelect('product', p)}
                          onMouseEnter={() => setActiveIndex(idx)}
                          className={cn(
                            'flex w-full items-center gap-2.5 rounded-lg p-2 text-left transition-colors',
                            activeIndex === idx ? 'bg-cyan-50' : 'hover:bg-slate-50',
                          )}
                        >
                          <div className="h-9 w-9 flex-shrink-0 overflow-hidden rounded-md bg-muted border border-border/40">
                            {p.imageUrl && (
                              <img src={p.imageUrl} alt={p.name} className="h-full w-full object-cover" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{p.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {p.brand ? `${p.brand} · ` : ''}{p.shopName ?? 'Shop'}
                            </p>
                          </div>
                          <span className="text-xs font-bold text-cyan-700 tabular-nums flex-shrink-0">
                            {new Intl.NumberFormat('vi-VN').format(p.price)}₫
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Categories */}
                {results!.categories.length > 0 && (
                  <div className="mb-2">
                    <div className="px-2 py-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                      {t('common.categories')}
                    </div>
                    {results!.categories.map((c) => {
                      const idx = flatItems.findIndex((it) => it.type === 'category' && it.data.id === c.id);
                      return (
                        <button
                          key={c.id}
                          onClick={() => handleSelect('category', c)}
                          onMouseEnter={() => setActiveIndex(idx)}
                          className={cn(
                            'flex w-full items-center gap-2.5 rounded-lg p-2 text-left transition-colors',
                            activeIndex === idx ? 'bg-cyan-50' : 'hover:bg-slate-50',
                          )}
                        >
                          <div className="h-8 w-8 flex-shrink-0 rounded-md bg-cyan-50 border border-cyan-100 flex items-center justify-center">
                            <Package className="h-3.5 w-3.5 text-cyan-600" />
                          </div>
                          <span className="text-sm font-medium flex-1">{c.name}</span>
                          <span className="text-[10px] text-muted-foreground">{t('common.categories')}</span>
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Shops */}
                {results!.shops.length > 0 && (
                  <div className="mb-2">
                    <div className="px-2 py-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                      {t('common.shops')}
                    </div>
                    {results!.shops.map((s) => {
                      const idx = flatItems.findIndex((it) => it.type === 'shop' && it.data.id === s.id);
                      return (
                        <button
                          key={s.id}
                          onClick={() => handleSelect('shop', s)}
                          onMouseEnter={() => setActiveIndex(idx)}
                          className={cn(
                            'flex w-full items-center gap-2.5 rounded-lg p-2 text-left transition-colors',
                            activeIndex === idx ? 'bg-cyan-50' : 'hover:bg-slate-50',
                          )}
                        >
                          <div className="h-8 w-8 flex-shrink-0 overflow-hidden rounded-full bg-muted border border-border/40">
                            {s.logoUrl && (
                              <img src={s.logoUrl} alt={s.name} className="h-full w-full object-cover" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate flex items-center gap-1">
                              {s.name}
                              {s.verified && <span className="text-cyan-500 text-xs">✓</span>}
                            </p>
                            <p className="text-xs text-muted-foreground">★ {s.rating.toFixed(1)}</p>
                          </div>
                          <span className="text-[10px] text-muted-foreground">{t('common.shops')}</span>
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Brands */}
                {results!.brands.length > 0 && (
                  <div className="mb-1">
                    <div className="px-2 py-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                      {t('common.brands')}
                    </div>
                    <div className="flex flex-wrap gap-1.5 px-2 pb-1">
                      {results!.brands.map((b) => {
                        const idx = flatItems.findIndex((it) => it.type === 'brand' && it.data === b);
                        return (
                          <button
                            key={b}
                            onClick={() => handleSelect('brand', b)}
                            onMouseEnter={() => setActiveIndex(idx)}
                            className={cn(
                              'rounded-full border px-2.5 py-1 text-xs font-medium transition-colors',
                              activeIndex === idx
                                ? 'border-primary bg-primary text-primary-foreground'
                                : 'border-cyan-200/60 bg-cyan-50/60 text-cyan-800 hover:border-primary',
                            )}
                          >
                            {b}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* View all results */}
                <button
                  onClick={() => submit()}
                  className="mt-1 flex w-full items-center justify-center gap-1.5 rounded-lg border border-cyan-200 bg-cyan-50/40 p-2 text-sm font-medium text-cyan-700 transition-colors hover:bg-cyan-100/50"
                >
                  <Search className="h-3.5 w-3.5" />
                  {t('common.viewAllResults').replace('{query}', query)}
                </button>
              </div>
            )}

            {/* No results */}
            {query.trim().length >= 2 && !loading && !hasResults && (
              <div className="p-6 text-center">
                <div className="mx-auto mb-2 h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center">
                  <Search className="h-5 w-5 text-muted-foreground" />
                </div>
                <p className="text-sm font-medium">{t('common.noResults').replace('{query}', query)}</p>
                <p className="text-xs text-muted-foreground mt-1">{t('common.noResultsHint')}</p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ---------- Theme Toggle ---------- */
function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  // Mark as mounted after hydration so we can safely read resolved theme.
  // The set-state-in-effect rule is intentionally disabled for this one-time mount flag.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setMounted(true), []);

  const isDark = (resolvedTheme ?? theme) === 'dark';

  if (!mounted) {
    // Avoid hydration mismatch — render a same-sized placeholder
    return <Button variant="ghost" size="icon" aria-label="Toggle theme" className="opacity-0" />;
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label="Toggle theme"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className="text-muted-foreground hover:text-foreground hover:bg-accent"
    >
      {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </Button>
  );
}

/* ---------- Language Switcher ---------- */
function LanguageSwitcher() {
  const { lang, setLang } = useI18n();
  const current = LANGS.find((l) => l.code === lang) ?? LANGS[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          aria-label={current.label}
          className="gap-1.5 px-2 text-muted-foreground hover:text-foreground hover:bg-accent"
        >
          <Globe className="h-4 w-4" />
          <span className="text-xs font-semibold tabular-nums">{current.short}</span>
          <ChevronDown className="h-3 w-3 opacity-70" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuLabel className="text-[11px] uppercase tracking-wider text-muted-foreground">
          Language
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {LANGS.map((l) => {
          const isActive = l.code === lang;
          return (
            <DropdownMenuItem
              key={l.code}
              onClick={() => setLang(l.code as Lang)}
              className={cn(
                'flex items-center justify-between gap-2 cursor-pointer',
                isActive && 'bg-cyan-50/60',
              )}
            >
              <span className="flex items-center gap-2">
                <span className="text-base leading-none">{l.flag}</span>
                <span className="text-sm">{l.label}</span>
              </span>
              {isActive && <Check className="h-3.5 w-3.5 text-cyan-600" />}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/* ---------- Wishlist button ---------- */
function ActionWishlist() {
  const count = useWishlistStore((s) => s.items.length);
  const goBuyer = useNavStore((s) => s.goBuyer);
  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label={`Wishlist, ${count} items`}
      onClick={() => goBuyer('buyer-wishlist')}
      className="relative text-muted-foreground hover:text-rose-500 hover:bg-rose-50/60 dark:hover:bg-rose-950/20"
    >
      <Heart className="h-4 w-4" />
      {count > 0 && (
        <Badge className="absolute -right-0.5 -top-0.5 h-4 min-w-4 justify-center rounded-full bg-rose-500 px-1 text-[10px] font-semibold leading-none text-white">
          {count > 99 ? '99+' : count}
        </Badge>
      )}
    </Button>
  );
}

/* ---------- Cart button ---------- */
function ActionCart() {
  const count = useCartStore((s) => s.items.length);
  const open = useCartStore((s) => s.open);
  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label={`Cart, ${count} items`}
      onClick={open}
      className="relative text-muted-foreground hover:text-primary hover:bg-accent"
    >
      <ShoppingCart className="h-4 w-4" />
      {count > 0 && (
        <Badge className="absolute -right-0.5 -top-0.5 h-4 min-w-4 justify-center rounded-full bg-primary px-1 text-[10px] font-semibold leading-none text-primary-foreground">
          {count > 99 ? '99+' : count}
        </Badge>
      )}
    </Button>
  );
}

/* ---------- Notifications Bell + dropdown ---------- */
/* ---------- Notifications Bell with pulse + mark-all-as-read ---------- */
const NOTIF_ICON_MAP: Record<string, { icon: any; color: string; bg: string }> = {
  ORDER_CREATED: { icon: Package, color: 'text-cyan-600', bg: 'bg-cyan-50' },
  ORDER_SHIPPED: { icon: Truck, color: 'text-blue-600', bg: 'bg-blue-50' },
  PAYMENT_SUCCESS: { icon: DollarSign, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  PAYMENT_FAILED: { icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-50' },
  SELLER_APPROVED: { icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  SELLER_REJECTED: { icon: XCircle, color: 'text-red-600', bg: 'bg-red-50' },
  PRODUCT_APPROVED: { icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  PRODUCT_REJECTED: { icon: XCircle, color: 'text-red-600', bg: 'bg-red-50' },
  WITHDRAWAL_REQUEST: { icon: Wallet, color: 'text-amber-600', bg: 'bg-amber-50' },
  WITHDRAWAL_COMPLETED: { icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  WITHDRAWAL_REJECTED: { icon: XCircle, color: 'text-red-600', bg: 'bg-red-50' },
  PROMOTION: { icon: Sparkles, color: 'text-violet-600', bg: 'bg-violet-50' },
  NEW_SELLER: { icon: Store, color: 'text-cyan-600', bg: 'bg-cyan-50' },
  NEW_ORDER: { icon: Package, color: 'text-cyan-600', bg: 'bg-cyan-50' },
  DEFAULT: { icon: Bell, color: 'text-slate-600', bg: 'bg-slate-50' },
};

function NotificationsBell() {
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();
  const goBuyer = useNavStore((s) => s.goBuyer);
  const goSeller = useNavStore((s) => s.goSeller);
  const goAdmin = useNavStore((s) => s.goAdmin);
  const goProducts = useNavStore((s) => s.goProducts);
  const setView = useNavStore((s) => s.setView);
  const { t } = useI18n();
  const { data, isLoading } = useNotifications(user?.id ?? 'demo-buyer');
  const [markingRead, setMarkingRead] = useState(false);
  const items: Array<{
    id: string;
    type: string;
    title: string;
    body: string;
    read: boolean;
    createdAt: string;
    link?: string | null;
  }> = (data ?? []) as any;

  const unread = items.filter((n) => !n.read).length;

  async function markAllRead() {
    setMarkingRead(true);
    try {
      const unreadItems = items.filter((n) => !n.read);
      await Promise.all(
        unreadItems.map((n) =>
          fetch('/api/v1/notifications', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: n.id }),
          }),
        ),
      );
      // Invalidate queries to refetch notifications
      queryClient.invalidateQueries({ queryKey: ['notifications', user?.id ?? 'demo-buyer'] });
    } finally {
      setMarkingRead(false);
    }
  }

  async function handleNotificationClick(n: any) {
    // Mark as read
    if (!n.read) {
      fetch('/api/v1/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: n.id }),
      }).then(() => {
        queryClient.invalidateQueries({ queryKey: ['notifications', user?.id ?? 'demo-buyer'] });
      });
    }
    // Navigate to the linked page
    if (n.link) {
      // Parse the link hash (e.g. "#/orders" → view "buyer-orders")
      const hash = n.link.replace(/^#\/?/, '');
      const [viewPart] = hash.split('?');
      const viewMap: Record<string, string> = {
        'orders': 'buyer-orders',
        'seller': 'seller',
        'seller/orders': 'seller-orders',
        'admin': 'admin',
        'admin/withdrawals': 'admin-withdrawals',
        'admin/sellers': 'admin-sellers',
        'products': 'products',
      };
      const targetView = viewMap[viewPart] ?? viewPart;
      try {
        setView(targetView as any);
      } catch {
        // Fallback: just close the dropdown
      }
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label={`Notifications, ${unread} unread`}
          className="relative text-muted-foreground hover:text-foreground hover:bg-accent"
        >
          <Bell className="h-4 w-4" />
          {unread > 0 && (
            <>
              {/* Pulse ring */}
              <span className="absolute -right-0.5 -top-0.5 h-4 w-4 rounded-full bg-amber-400 animate-ping opacity-75" style={{ animationDuration: '2s' }} />
              {/* Badge */}
              <Badge className="absolute -right-0.5 -top-0.5 h-4 min-w-4 justify-center rounded-full bg-amber-500 px-1 text-[10px] font-semibold leading-none text-white border border-background">
                {unread > 99 ? '99+' : unread}
              </Badge>
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-0">
        <DropdownMenuLabel className="flex items-center justify-between px-3 py-2 text-sm">
          <span className="flex items-center gap-1.5">
            <Bell className="h-3.5 w-3.5 text-cyan-600" />
            {t('common.notifications')}
          </span>
          {unread > 0 && (
            <button
              onClick={markAllRead}
              disabled={markingRead}
              className="text-[11px] font-medium text-cyan-600 hover:text-cyan-700 transition-colors disabled:opacity-50"
            >
              {markingRead ? t('common.loading') : t('common.markAllRead')}
            </button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <div className="max-h-80 overflow-y-auto">
          {isLoading ? (
            <div className="px-3 py-6 text-center text-sm text-muted-foreground">{t('common.loading')}</div>
          ) : items.length === 0 ? (
            <div className="px-3 py-8 text-center">
              <Bell className="h-8 w-8 text-slate-300 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">{t('common.noNotifications')}</p>
            </div>
          ) : (
            items.slice(0, 10).map((n) => {
              const cfg = NOTIF_ICON_MAP[n.type] ?? NOTIF_ICON_MAP.DEFAULT;
              const Icon = cfg.icon;
              return (
                <button
                  key={n.id}
                  onClick={() => handleNotificationClick(n)}
                  className={cn(
                    'w-full flex gap-3 px-3 py-2.5 text-sm text-left transition-colors hover:bg-accent border-b border-border/30 last:border-0',
                    !n.read && 'bg-cyan-50/40 dark:bg-cyan-950/15',
                  )}
                >
                  <div className={cn('mt-0.5 h-7 w-7 shrink-0 rounded-full flex items-center justify-center', cfg.bg)}>
                    <Icon className={cn('h-3.5 w-3.5', cfg.color)} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <span className="truncate font-medium text-foreground text-xs">{n.title}</span>
                      {!n.read && <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-cyan-500" />}
                    </div>
                    <div className="line-clamp-2 text-[11px] text-muted-foreground mt-0.5">{n.body}</div>
                    <div className="mt-0.5 flex items-center justify-between">
                      <span className="text-[10px] text-muted-foreground/70">{timeAgo(n.createdAt)}</span>
                      {n.link && <ChevronRight className="h-3 w-3 text-muted-foreground/50" />}
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
        {items.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <div className="px-3 py-2 text-center">
              <span className="text-[11px] text-muted-foreground">
                {t('common.unreadTotal')
                  .replace('{unread}', String(unread))
                  .replace('{total}', String(items.length))}
              </span>
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/* ---------- Role Switcher (segmented control) ---------- */
function RoleSwitcher() {
  const role = useNavStore((s) => s.role);
  const setRole = useNavStore((s) => s.setRole);
  const goBuyer = useNavStore((s) => s.goBuyer);
  const goSeller = useNavStore((s) => s.goSeller);
  const goAdmin = useNavStore((s) => s.goAdmin);
  const { t } = useI18n();

  const tabs: { key: ViewRole; label: string; onPick: () => void }[] = [
    { key: 'buyer', label: t('roles.buyer'), onPick: () => goBuyer('buyer-orders') },
    { key: 'seller', label: t('roles.seller'), onPick: () => goSeller() },
    { key: 'admin', label: t('roles.admin'), onPick: () => goAdmin() },
  ];

  return (
    <div
      role="tablist"
      aria-label={t('roles.viewAs')}
      className="inline-flex items-center rounded-full border border-border/70 bg-background/60 p-0.5 shadow-xs"
    >
      {tabs.map((tab) => {
        const active = role === tab.key;
        return (
          <button
            key={tab.key}
            role="tab"
            aria-selected={active}
            onClick={() => {
              setRole(tab.key);
              tab.onPick();
            }}
            className={cn(
              'relative rounded-full px-3 py-1 text-xs font-semibold transition-all',
              active ? 'text-primary-foreground' : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {active && (
              <motion.span
                layoutId="role-pill"
                className="absolute inset-0 -z-10 rounded-full bg-gradient-to-r from-cyan-500 to-teal-400 shadow-[0_4px_14px_-4px_rgba(6,182,212,0.55)]"
                transition={{ type: 'spring', stiffness: 320, damping: 28 }}
              />
            )}
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}

/* ---------- User Menu ---------- */
function UserMenu() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const goBuyer = useNavStore((s) => s.goBuyer);
  const goShop = useNavStore((s) => s.goShop);
  const goAuth = useNavStore((s) => s.goAuth);
  const goAdmin = useNavStore((s) => s.goAdmin);
  const { toast } = useToast();
  const { t } = useI18n();

  const handleLogout = () => {
    logout();
    toast({ title: t('common.logout'), description: '' });
  };

  const trigger = user ? (
    <button
      className="flex items-center gap-1.5 rounded-full border border-border/70 bg-background/60 py-1 pl-1 pr-2 shadow-xs transition-colors hover:border-primary/40 hover:bg-accent"
      aria-label={t('common.account')}
    >
      <Avatar className="h-7 w-7 ring-1 ring-primary/30">
        {user.avatarUrl ? <AvatarImage src={user.avatarUrl} alt={user.name} /> : null}
        <AvatarFallback className="bg-cyan-100 text-xs font-semibold text-cyan-800 dark:bg-cyan-950/50 dark:text-cyan-200">
          {initials(user.name)}
        </AvatarFallback>
      </Avatar>
      <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
    </button>
  ) : (
    <Button
      size="sm"
      className="bg-gradient-to-r from-cyan-500 to-teal-400 text-white shadow-[0_4px_14px_-4px_rgba(6,182,212,0.55)] hover:from-cyan-600 hover:to-teal-500"
      onClick={() => goAuth('login')}
    >
      <User className="h-4 w-4" />
      {t('auth.signIn')}
    </Button>
  );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60">
        {user ? (
          <>
            <DropdownMenuLabel className="flex flex-col gap-0.5">
              <span className="text-sm font-semibold">{user.name}</span>
              <span className="text-xs font-normal text-muted-foreground">{user.email}</span>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => goBuyer('buyer-profile')}>
              <User className="h-4 w-4" /> {t('common.profile')}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => goBuyer('buyer-orders')}>
              <Package className="h-4 w-4" /> {t('common.myOrders')}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => goBuyer('buyer-downloads')}>
              <Download className="h-4 w-4" /> {t('common.downloads')}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => goBuyer('buyer-profile')}>
              <Settings className="h-4 w-4" /> {t('common.settings')}
            </DropdownMenuItem>
            {user.shopSlug && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => goShop(user.shopSlug!)}>
                  <Store className="h-4 w-4" /> {t('common.myShop')}
                </DropdownMenuItem>
              </>
            )}
            {user.role === 'ADMIN' || user.role === 'SUPER_ADMIN' ? (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => goAdmin()} className="text-cyan-600 font-medium">
                  <Shield className="h-4 w-4" /> Cổng Quản trị (Admin)
                </DropdownMenuItem>
              </>
            ) : null}
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onClick={handleLogout}>
              <LogOut className="h-4 w-4" /> {t('common.logout')}
            </DropdownMenuItem>
          </>
        ) : (
          <>
            <DropdownMenuLabel>{t('common.guest')}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => goAuth('login')}>
              <User className="h-4 w-4" /> {t('auth.signIn')}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => goAuth('register')}>
              <UserPlus className="h-4 w-4" /> {t('auth.createAccount')}
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/* ---------- Mobile Sheet Menu ---------- */
function MobileMenu() {
  const [open, setOpen] = useState(false);
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const role = useNavStore((s) => s.role);
  const setRole = useNavStore((s) => s.setRole);
  const goBuyer = useNavStore((s) => s.goBuyer);
  const goSeller = useNavStore((s) => s.goSeller);
  const goAdmin = useNavStore((s) => s.goAdmin);
  const goShop = useNavStore((s) => s.goShop);
  const goAuth = useNavStore((s) => s.goAuth);
  const wishlistCount = useWishlistStore((s) => s.items.length);
  const { toast } = useToast();
  const { t } = useI18n();

  const handleLogout = () => {
    logout();
    toast({ title: t('common.logout') });
    setOpen(false);
  };

  const roleTabs: { key: ViewRole; label: string; onPick: () => void }[] = [
    { key: 'buyer', label: t('roles.buyer'), onPick: () => goBuyer('buyer-orders') },
    { key: 'seller', label: t('roles.seller'), onPick: () => goSeller() },
    { key: 'admin', label: t('roles.admin'), onPick: () => goAdmin() },
  ];

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Open menu"
          className="text-muted-foreground hover:text-foreground hover:bg-accent"
        >
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-80 max-w-[85vw] p-0">
        <SheetHeader className="border-b border-border/60 bg-gradient-to-br from-cyan-50/60 to-teal-50/40 px-4 py-4 dark:from-cyan-950/20 dark:to-teal-950/10">
          <SheetTitle className="flex items-center justify-between">
            <div onClick={() => setOpen(false)} role="presentation">
              <Logo size="sm" />
            </div>
          </SheetTitle>
        </SheetHeader>

        {/* Mobile search */}
        <div className="px-4 py-3">
          <SearchBar compact />
        </div>

        {/* Nav links */}
        <nav className="flex-1 overflow-y-auto px-2 pb-3">
          <div className="px-2 py-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            {t('common.browse')}
          </div>
          <MobileNavList onNavigate={() => setOpen(false)} />
          <div className="my-2 h-px bg-border/60" />

          {user ? (
            <div className="px-2">
              <div className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                {t('common.account')}
              </div>
              <MobileLink
                icon={<User className="h-4 w-4" />}
                label={t('common.profile')}
                onClick={() => {
                  goBuyer('buyer-profile');
                  setOpen(false);
                }}
              />
              <MobileLink
                icon={<Package className="h-4 w-4" />}
                label={t('common.myOrders')}
                onClick={() => {
                  goBuyer('buyer-orders');
                  setOpen(false);
                }}
              />
              <MobileLink
                icon={<Download className="h-4 w-4" />}
                label={t('common.downloads')}
                onClick={() => {
                  goBuyer('buyer-downloads');
                  setOpen(false);
                }}
              />
              <MobileLink
                icon={<Heart className="h-4 w-4" />}
                label={`${t('common.wishlist')}${wishlistCount > 0 ? ` (${wishlistCount})` : ''}`}
                onClick={() => {
                  goBuyer('buyer-wishlist');
                  setOpen(false);
                }}
              />
              {user.shopSlug && (
                <MobileLink
                  icon={<Store className="h-4 w-4" />}
                  label={t('common.myShop')}
                  onClick={() => {
                    goShop(user.shopSlug!);
                    setOpen(false);
                  }}
                />
              )}
            </div>
          ) : (
            <div className="px-2">
              <MobileLink
                icon={<User className="h-4 w-4" />}
                label={t('auth.signIn')}
                onClick={() => {
                  goAuth('login');
                  setOpen(false);
                }}
              />
              <MobileLink
                icon={<Package className="h-4 w-4" />}
                label={t('auth.createAccount')}
                onClick={() => {
                  goAuth('register');
                  setOpen(false);
                }}
              />
            </div>
          )}


          {user && (
            <>
              <div className="my-2 h-px bg-border/60" />
              <div className="px-2">
                <MobileLink
                  icon={<LogOut className="h-4 w-4" />}
                  label={t('common.logout')}
                  danger
                  onClick={handleLogout}
                />
              </div>
            </>
          )}
        </nav>
      </SheetContent>
    </Sheet>
  );
}

function MobileNavList({ onNavigate }: { onNavigate: () => void }) {
  const view = useNavStore((s) => s.view);
  const params = useNavStore((s) => s.params);
  const goHome = useNavStore((s) => s.goHome);
  const goProducts = useNavStore((s) => s.goProducts);
  const goCategory = useNavStore((s) => s.goCategory);
  const { t } = useI18n();

  const links: NavLinkDef[] = [
    { label: t('nav.marketplace'), icon: <Cpu className="h-4 w-4" />, active: (v) => v === 'home', go: goHome },
    { label: t('nav.products'), icon: <Package className="h-4 w-4" />, active: (v) => v === 'products', go: goProducts },
    {
      label: t('nav.pcbBoards'),
      icon: <LayersIcon className="h-4 w-4" />,
      active: (v, p) => v === 'category' && p.slug === 'pcb-boards',
      go: () => goCategory('pcb-boards'),
    },
    {
      label: t('nav.devBoards'),
      icon: <CircuitBoard className="h-4 w-4" />,
      active: (v, p) => v === 'category' && p.slug === 'dev-boards',
      go: () => goCategory('dev-boards'),
    },
    {
      label: t('nav.components'),
      icon: <Cpu className="h-4 w-4" />,
      active: (v, p) => v === 'category' && p.slug === 'components',
      go: () => goCategory('components'),
    },
    {
      label: t('nav.openSource'),
      icon: <FileCode className="h-4 w-4" />,
      active: (v, p) => v === 'category' && p.slug === 'open-source',
      go: () => goCategory('open-source'),
    },
  ];

  return (
    <ul>
      {links.map((l) => {
        const isActive = l.active(view, params);
        return (
          <li key={l.label}>
            <button
              onClick={() => {
                l.go();
                onNavigate();
              }}
              className={cn(
                'flex w-full items-center gap-2.5 rounded-md px-2 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-foreground hover:bg-accent hover:text-accent-foreground',
              )}
            >
              <span className={isActive ? 'text-primary' : 'text-muted-foreground'}>{l.icon}</span>
              {l.label}
            </button>
          </li>
        );
      })}
    </ul>
  );
}

function MobileLink({
  icon,
  label,
  onClick,
  danger,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex w-full items-center gap-2.5 rounded-md px-2 py-2 text-sm font-medium transition-colors',
        danger
          ? 'text-destructive hover:bg-destructive/10'
          : 'text-foreground hover:bg-accent hover:text-accent-foreground',
      )}
    >
      <span className={danger ? 'text-destructive' : 'text-muted-foreground'}>{icon}</span>
      {label}
    </button>
  );
}

/* ---------- Main Header ---------- */
export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const { t } = useI18n();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className={cn(
        'sticky top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur-md transition-shadow',
        scrolled && 'shadow-[0_8px_24px_-12px_rgba(6,182,212,0.35)]',
      )}
    >
      {/* Main row */}
      <div className="mx-auto flex h-16 max-w-screen-2xl items-center gap-2 px-3 sm:gap-3 sm:px-6">
        {/* Hamburger (mobile/tablet) */}
        <div className="lg:hidden">
          <MobileMenu />
        </div>

        {/* Logo */}
        <div className="shrink-0">
          <Logo size="md" />
        </div>

        {/* Search bar (center, prominent) — visible at md and above */}
        <div className="mx-2 hidden flex-1 md:block md:max-w-xl lg:max-w-md xl:max-w-xl">
          <SearchBar />
        </div>

        {/* Spacer for mobile (search below row handles it) */}
        <div className="flex-1 md:hidden" />

        {/* Right side actions */}
        <div className="ml-auto flex items-center gap-1 sm:gap-1.5">
          <div className="hidden md:block">
            <ActionWishlist />
          </div>
          <ActionCart />
          <div className="hidden md:block">
            <NotificationsBell />
          </div>
          <ThemeToggle />
          <LanguageSwitcher />
          <UserMenu />
        </div>
      </div>

      {/* Mobile search row (visible only on small screens) */}
      <div className="border-t border-border/50 bg-background/60 px-3 py-2 md:hidden">
        <SearchBar compact />
      </div>

      {/* Desktop secondary nav row (lg+) */}
      <div className="hidden border-t border-border/40 bg-background/40 lg:block">
        <div className="mx-auto flex h-11 max-w-screen-2xl items-center justify-center gap-2 px-6">
          <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            {t('common.browse')}
          </span>
          <NavPills />
        </div>
      </div>
    </header>
  );
}

export default Header;
