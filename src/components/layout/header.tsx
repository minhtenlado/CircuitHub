'use client';

import * as React from 'react';
import { useEffect, useRef, useState } from 'react';
import { useNavStore, type ViewRole } from '@/stores/nav-store';
import { useCartStore } from '@/stores/cart-store';
import { useWishlistStore } from '@/stores/wishlist-store';
import { useAuthStore } from '@/stores/auth-store';
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
  Cpu,
  Zap,
  Store,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';
import { initials, timeAgo } from '@/lib/format';
import { cn } from '@/lib/utils';

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

  const links: NavLinkDef[] = [
    { label: 'Marketplace', icon: <Cpu className="h-3.5 w-3.5" />, active: (v) => v === 'home', go: goHome },
    { label: 'Products', icon: <Package className="h-3.5 w-3.5" />, active: (v) => v === 'products', go: goProducts },
    {
      label: 'PCB Boards',
      icon: <Cpu className="h-3.5 w-3.5" />,
      active: (v, p) => v === 'category' && p.slug === 'pcb-boards',
      go: () => goCategory('pcb-boards'),
    },
    {
      label: 'KiCad Projects',
      icon: <Cpu className="h-3.5 w-3.5" />,
      active: (v, p) => v === 'category' && p.slug === 'kicad-projects',
      go: () => goCategory('kicad-projects'),
    },
    {
      label: 'Services',
      icon: <Zap className="h-3.5 w-3.5" />,
      active: (v, p) => v === 'category' && p.slug === 'services',
      go: () => goCategory('services'),
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
function SearchBar({ compact = false }: { compact?: boolean }) {
  const goProducts = useNavStore((s) => s.goProducts);
  const [query, setQuery] = useState('');
  const [focused, setFocused] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Close popular-searches dropdown on outside click
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!wrapperRef.current?.contains(e.target as Node)) setFocused(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const submit = (q?: string) => {
    const term = (q ?? query).trim();
    goProducts(term ? { q: term } : {});
    setFocused(false);
  };

  return (
    <div ref={wrapperRef} className="relative w-full">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setFocused(true)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') submit();
          }}
          placeholder="Search by product, MPN, KiCad project, component, service..."
          aria-label="Search CircuitHub"
          className={cn(
            'h-10 rounded-full border-border/70 bg-background/70 pl-9 pr-3 text-sm shadow-xs transition-all',
            'focus-visible:border-primary focus-visible:ring-primary/30 focus-visible:ring-[3px]',
            compact && 'h-9',
          )}
        />
      </div>

      {/* Popular searches dropdown */}
      <AnimatePresence>
        {focused && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className="absolute left-0 right-0 top-[calc(100%+6px)] z-50 rounded-xl border border-border/70 bg-popover/95 p-2 shadow-lg backdrop-blur-md"
          >
            <div className="px-2 pb-1.5 pt-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              Popular searches
            </div>
            <div className="flex flex-wrap gap-1.5">
              {POPULAR_SEARCHES.map((s) => (
                <button
                  key={s}
                  onClick={() => {
                    setQuery(s);
                    submit(s);
                  }}
                  className="rounded-full border border-cyan-200/60 bg-cyan-50/60 px-2.5 py-1 text-xs font-medium text-cyan-800 transition-colors hover:border-primary hover:bg-primary hover:text-primary-foreground dark:border-cyan-900/40 dark:bg-cyan-950/30 dark:text-cyan-200"
                >
                  {s}
                </button>
              ))}
            </div>
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
function NotificationsBell() {
  const user = useAuthStore((s) => s.user);
  const { data, isLoading } = useNotifications(user?.id ?? 'demo-buyer');
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
            <Badge className="absolute -right-0.5 -top-0.5 h-4 min-w-4 justify-center rounded-full bg-amber-500 px-1 text-[10px] font-semibold leading-none text-white">
              {unread > 99 ? '99+' : unread}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-0">
        <DropdownMenuLabel className="flex items-center justify-between px-3 py-2 text-sm">
          <span>Notifications</span>
          {unread > 0 && (
            <Badge variant="secondary" className="bg-cyan-50 text-cyan-700 dark:bg-cyan-950/40 dark:text-cyan-300">
              {unread} new
            </Badge>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <div className="max-h-72 overflow-y-auto">
          {isLoading ? (
            <div className="px-3 py-6 text-center text-sm text-muted-foreground">Loading…</div>
          ) : items.length === 0 ? (
            <div className="px-3 py-6 text-center text-sm text-muted-foreground">No notifications yet.</div>
          ) : (
            items.slice(0, 8).map((n) => (
              <div
                key={n.id}
                className={cn(
                  'flex gap-3 px-3 py-2.5 text-sm transition-colors hover:bg-accent',
                  !n.read && 'bg-cyan-50/40 dark:bg-cyan-950/15',
                )}
              >
                <span
                  className={cn(
                    'mt-1.5 h-2 w-2 shrink-0 rounded-full',
                    n.read ? 'bg-transparent ring-1 ring-border' : 'bg-primary',
                  )}
                />
                <div className="min-w-0 flex-1">
                  <div className="truncate font-medium text-foreground">{n.title}</div>
                  <div className="line-clamp-2 text-xs text-muted-foreground">{n.body}</div>
                  <div className="mt-0.5 text-[11px] text-muted-foreground/70">{timeAgo(n.createdAt)}</div>
                </div>
              </div>
            ))
          )}
        </div>
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

  const tabs: { key: ViewRole; label: string; onPick: () => void }[] = [
    { key: 'buyer', label: 'Buyer', onPick: () => goBuyer('buyer-orders') },
    { key: 'seller', label: 'Seller', onPick: () => goSeller() },
    { key: 'admin', label: 'Admin', onPick: () => goAdmin() },
  ];

  return (
    <div
      role="tablist"
      aria-label="Switch role"
      className="inline-flex items-center rounded-full border border-border/70 bg-background/60 p-0.5 shadow-xs"
    >
      {tabs.map((t) => {
        const active = role === t.key;
        return (
          <button
            key={t.key}
            role="tab"
            aria-selected={active}
            onClick={() => {
              setRole(t.key);
              t.onPick();
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
            {t.label}
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
  const demoLogin = useAuthStore((s) => s.demoLogin);
  const goBuyer = useNavStore((s) => s.goBuyer);
  const goSeller = useNavStore((s) => s.goSeller);
  const goAdmin = useNavStore((s) => s.goAdmin);
  const goShop = useNavStore((s) => s.goShop);
  const goAuth = useNavStore((s) => s.goAuth);
  const { toast } = useToast();

  const handleDemoLogin = (r: 'buyer' | 'seller' | 'admin') => {
    demoLogin(r);
    const label = r.charAt(0).toUpperCase() + r.slice(1);
    toast({
      title: `Signed in as ${label}`,
      description: 'Demo mode active — explore the full experience.',
    });
    if (r === 'buyer') goBuyer('buyer-orders');
    else if (r === 'seller') goSeller();
    else goAdmin();
  };

  const handleLogout = () => {
    logout();
    toast({ title: 'Signed out', description: 'You have been logged out.' });
  };

  const trigger = user ? (
    <button
      className="flex items-center gap-1.5 rounded-full border border-border/70 bg-background/60 py-1 pl-1 pr-2 shadow-xs transition-colors hover:border-primary/40 hover:bg-accent"
      aria-label="Account menu"
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
      Sign In
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
              <User className="h-4 w-4" /> Profile
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => goBuyer('buyer-orders')}>
              <Package className="h-4 w-4" /> My Orders
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => goBuyer('buyer-downloads')}>
              <Download className="h-4 w-4" /> Downloads
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => goBuyer('buyer-profile')}>
              <Settings className="h-4 w-4" /> Settings
            </DropdownMenuItem>
            {user.shopSlug && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => goShop(user.shopSlug!)}>
                  <Store className="h-4 w-4" /> My Shop
                </DropdownMenuItem>
              </>
            )}
          </>
        ) : (
          <>
            <DropdownMenuLabel>Guest account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => goAuth('login')}>
              <User className="h-4 w-4" /> Sign In
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => goAuth('register')}>
              <Package className="h-4 w-4" /> Create Account
            </DropdownMenuItem>
          </>
        )}

        <DropdownMenuSeparator />
        <DropdownMenuLabel className="text-[11px] uppercase tracking-wider text-muted-foreground">
          Demo logins
        </DropdownMenuLabel>
        <DropdownMenuItem onClick={() => handleDemoLogin('buyer')}>
          <User className="h-4 w-4" /> Demo Login as Buyer
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleDemoLogin('seller')}>
          <Store className="h-4 w-4" /> Demo Login as Seller
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleDemoLogin('admin')}>
          <Settings className="h-4 w-4" /> Demo Login as Admin
        </DropdownMenuItem>

        {user && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onClick={handleLogout}>
              <LogOut className="h-4 w-4" /> Logout
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
  const demoLogin = useAuthStore((s) => s.demoLogin);
  const role = useNavStore((s) => s.role);
  const setRole = useNavStore((s) => s.setRole);
  const goBuyer = useNavStore((s) => s.goBuyer);
  const goSeller = useNavStore((s) => s.goSeller);
  const goAdmin = useNavStore((s) => s.goAdmin);
  const goShop = useNavStore((s) => s.goShop);
  const goAuth = useNavStore((s) => s.goAuth);
  const wishlistCount = useWishlistStore((s) => s.items.length);
  const { toast } = useToast();

  const handleDemoLogin = (r: 'buyer' | 'seller' | 'admin') => {
    demoLogin(r);
    toast({ title: `Signed in as ${r.charAt(0).toUpperCase() + r.slice(1)}`, description: 'Demo mode active.' });
    setOpen(false);
    if (r === 'buyer') goBuyer('buyer-orders');
    else if (r === 'seller') goSeller();
    else goAdmin();
  };

  const handleLogout = () => {
    logout();
    toast({ title: 'Signed out' });
    setOpen(false);
  };

  const roleTabs: { key: ViewRole; label: string; onPick: () => void }[] = [
    { key: 'buyer', label: 'Buyer', onPick: () => goBuyer('buyer-orders') },
    { key: 'seller', label: 'Seller', onPick: () => goSeller() },
    { key: 'admin', label: 'Admin', onPick: () => goAdmin() },
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

        {/* Role switcher */}
        <div className="px-4 pb-2">
          <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            View as
          </div>
          <div className="grid grid-cols-3 gap-1 rounded-full border border-border/70 bg-background/60 p-0.5">
            {roleTabs.map((t) => {
              const active = role === t.key;
              return (
                <button
                  key={t.key}
                  onClick={() => {
                    setRole(t.key);
                    t.onPick();
                    setOpen(false);
                  }}
                  className={cn(
                    'rounded-full px-2 py-1 text-xs font-semibold transition-all',
                    active
                      ? 'bg-gradient-to-r from-cyan-500 to-teal-400 text-white shadow-[0_4px_14px_-4px_rgba(6,182,212,0.55)]'
                      : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  {t.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Nav links */}
        <nav className="flex-1 overflow-y-auto px-2 pb-3">
          <div className="px-2 py-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Browse
          </div>
          <MobileNavList onNavigate={() => setOpen(false)} />
          <div className="my-2 h-px bg-border/60" />

          {user ? (
            <div className="px-2">
              <div className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Account
              </div>
              <MobileLink
                icon={<User className="h-4 w-4" />}
                label="Profile"
                onClick={() => {
                  goBuyer('buyer-profile');
                  setOpen(false);
                }}
              />
              <MobileLink
                icon={<Package className="h-4 w-4" />}
                label="My Orders"
                onClick={() => {
                  goBuyer('buyer-orders');
                  setOpen(false);
                }}
              />
              <MobileLink
                icon={<Download className="h-4 w-4" />}
                label="Downloads"
                onClick={() => {
                  goBuyer('buyer-downloads');
                  setOpen(false);
                }}
              />
              <MobileLink
                icon={<Heart className="h-4 w-4" />}
                label={`Wishlist${wishlistCount > 0 ? ` (${wishlistCount})` : ''}`}
                onClick={() => {
                  goBuyer('buyer-wishlist');
                  setOpen(false);
                }}
              />
              {user.shopSlug && (
                <MobileLink
                  icon={<Store className="h-4 w-4" />}
                  label="My Shop"
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
                label="Sign In"
                onClick={() => {
                  goAuth('login');
                  setOpen(false);
                }}
              />
              <MobileLink
                icon={<Package className="h-4 w-4" />}
                label="Create Account"
                onClick={() => {
                  goAuth('register');
                  setOpen(false);
                }}
              />
            </div>
          )}

          <div className="my-2 h-px bg-border/60" />
          <div className="px-2">
            <div className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Demo logins
            </div>
            <MobileLink icon={<User className="h-4 w-4" />} label="Demo Login as Buyer" onClick={() => handleDemoLogin('buyer')} />
            <MobileLink icon={<Store className="h-4 w-4" />} label="Demo Login as Seller" onClick={() => handleDemoLogin('seller')} />
            <MobileLink icon={<Settings className="h-4 w-4" />} label="Demo Login as Admin" onClick={() => handleDemoLogin('admin')} />
          </div>

          {user && (
            <>
              <div className="my-2 h-px bg-border/60" />
              <div className="px-2">
                <MobileLink
                  icon={<LogOut className="h-4 w-4" />}
                  label="Logout"
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

  const links: NavLinkDef[] = [
    { label: 'Marketplace', icon: <Cpu className="h-4 w-4" />, active: (v) => v === 'home', go: goHome },
    { label: 'Products', icon: <Package className="h-4 w-4" />, active: (v) => v === 'products', go: goProducts },
    {
      label: 'PCB Boards',
      icon: <Cpu className="h-4 w-4" />,
      active: (v, p) => v === 'category' && p.slug === 'pcb-boards',
      go: () => goCategory('pcb-boards'),
    },
    {
      label: 'KiCad Projects',
      icon: <Cpu className="h-4 w-4" />,
      active: (v, p) => v === 'category' && p.slug === 'kicad-projects',
      go: () => goCategory('kicad-projects'),
    },
    {
      label: 'Services',
      icon: <Zap className="h-4 w-4" />,
      active: (v, p) => v === 'category' && p.slug === 'services',
      go: () => goCategory('services'),
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
          <div className="hidden lg:block">
            <RoleSwitcher />
          </div>
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
            Browse
          </span>
          <NavPills />
        </div>
      </div>
    </header>
  );
}

export default Header;
