'use client';

import { useEffect, useRef, useState } from 'react';
import { useNavStore, setupHashListener } from '@/stores/nav-store';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { CartDrawer } from '@/components/checkout/cart-drawer';
import { CompareDrawer } from '@/components/product/compare-drawer';
import { CompareBar } from '@/components/product/compare-bar';
import { WishlistImportDialog } from '@/components/buyer/wishlist-import-dialog';
import { BackToTop } from '@/components/common/back-to-top';
import { QuickViewDialog } from '@/components/product/quick-view-dialog';
import { useQuickViewStore } from '@/stores/quick-view-store';
import { HomeView } from '@/features/home/home-view';
import { ProductsView } from '@/features/products/products-view';
import { ProductDetailView } from '@/features/products/product-detail-view';
import { CategoryView } from '@/features/products/category-view';
import { CartView } from '@/features/checkout/cart-view';
import { CheckoutView } from '@/features/checkout/checkout-view';
import { BomView } from '@/features/bom/bom-view';
import { BuyerDashboard } from '@/features/buyer/buyer-dashboard';
import { SellerCenter } from '@/features/seller/seller-center';
import { AdminCenter } from '@/features/admin/admin-center';
import { motion, AnimatePresence } from 'framer-motion';
import { useShop } from '@/lib/api/hooks';
import { ArrowLeft, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

function ShopView() {
  const slug = useNavStore((s) => s.params.slug);
  const goProducts = useNavStore((s) => s.goProducts);
  const goProduct = useNavStore((s) => s.goProduct);
  const { data, isLoading } = useShop(slug);
  if (isLoading) return <div className="max-w-6xl mx-auto px-4 py-20 text-center text-muted-foreground">Loading shop...</div>;
  if (!data) return <div className="max-w-6xl mx-auto px-4 py-20 text-center">Shop not found</div>;
  const shop = data.shop;
  const products = data.products ?? [];
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <button onClick={() => goProducts()} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-cyan-700 mb-4">
        <ArrowLeft className="h-3.5 w-3.5" /> Back to products
      </button>
      {/* Banner */}
      <div className="relative h-48 sm:h-64 rounded-2xl overflow-hidden bg-gradient-to-br from-cyan-100 via-teal-50 to-white mb-6">
        {shop.bannerUrl && (
           
          <img src={shop.bannerUrl} alt={shop.name} className="absolute inset-0 w-full h-full object-cover opacity-90" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 to-transparent" />
        <div className="absolute bottom-4 left-4 right-4 flex items-end gap-4">
          <div className="relative h-20 w-20 rounded-xl overflow-hidden bg-white border-2 border-white shadow-lg flex-shrink-0">
            {shop.logoUrl && (
               
              <img src={shop.logoUrl} alt={shop.name} className="w-full h-full object-cover" />
            )}
          </div>
          <div className="flex-1 text-white">
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-2xl font-bold drop-shadow">{shop.name}</h1>
              {shop.verified && (
                <span className="inline-flex items-center gap-1 bg-cyan-500 text-white text-xs font-semibold px-2 py-0.5 rounded-full">✓ Verified</span>
              )}
            </div>
            <p className="text-sm opacity-90 line-clamp-1">{shop.description}</p>
            <div className="flex items-center gap-4 text-xs mt-1">
              <span>★ {shop.rating.toFixed(1)} ({shop.ratingCount})</span>
              <span>{shop.productCount} products</span>
              <span>{shop.completedOrders} orders</span>
              <span>{shop.followersCount} followers</span>
            </div>
          </div>
        </div>
      </div>

      {/* Specializations */}
      {shop.specializations && (
        <div className="flex flex-wrap gap-2 mb-4">
          {shop.specializations.split(',').map((s: string) => (
            <span key={s} className="text-xs bg-cyan-50 text-cyan-700 border border-cyan-200 px-2.5 py-1 rounded-full font-medium">
              {s.trim()}
            </span>
          ))}
        </div>
      )}

      {/* Products grid */}
      <h2 className="text-xl font-bold mb-4">Products from this shop</h2>
      {products.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">No products yet.</div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {products.map((p: any, i: number) => (
            <button
              key={p.id}
              onClick={() => goProduct(p.slug)}
              className="group flex flex-col bg-card border border-border/70 rounded-xl overflow-hidden text-left hover:border-cyan-400/50 hover:shadow-lg transition-all"
            >
              <div className="aspect-[4/3] bg-muted relative overflow-hidden">
                {p.images?.[0]?.url ? (
                   
                  <img src={p.images[0].url} alt={p.name} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    <Building2 className="h-8 w-8" />
                  </div>
                )}
              </div>
              <div className="p-3 space-y-1">
                <p className="text-sm font-semibold line-clamp-2 group-hover:text-cyan-700">{p.name}</p>
                <p className="text-xs text-muted-foreground line-clamp-1">{p.category?.name}</p>
                <p className="text-base font-bold text-cyan-700">{new Intl.NumberFormat('vi-VN').format(p.price)}₫</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function AuthView({ mode }: { mode: 'login' | 'register' }) {
  const setView = useNavStore((s) => s.setView);
  const { toast } = useToastHook();
  const [email, setEmail] = useState('buyer1@example.com');
  const [password, setPassword] = useState('Demo@2025');
  const [name, setName] = useState('New User');
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/auth/${mode}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mode === 'login' ? { email, password } : { email, password, name }),
      });
      const json = await res.json();
      if (json.success) {
        toast({ title: mode === 'login' ? 'Welcome back!' : 'Account created!', description: json.data.user.name });
        setView('home', {});
      } else {
        toast({ title: 'Authentication failed', description: json.message, variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Network error', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-md mx-auto px-4 py-12 sm:py-16">
      <div className="bg-card border border-border/60 rounded-2xl p-6 sm:p-8 shadow-sm">
        <h1 className="text-2xl font-bold text-center mb-1">
          {mode === 'login' ? 'Welcome back' : 'Create your account'}
        </h1>
        <p className="text-sm text-muted-foreground text-center mb-6">
          {mode === 'login' ? 'Sign in to your CircuitHub account' : 'Join CircuitHub — the engineering marketplace'}
        </p>
        <form onSubmit={submit} className="space-y-4">
          {mode === 'register' && (
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Full Name</label>
              <input value={name} onChange={(e) => setName(e.target.value)} required className="w-full h-10 px-3 rounded-md border border-border/60 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100 outline-none" />
            </div>
          )}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full h-10 px-3 rounded-md border border-border/60 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100 outline-none" />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="w-full h-10 px-3 rounded-md border border-border/60 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100 outline-none" />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full h-10 rounded-md bg-gradient-to-r from-cyan-600 to-teal-500 hover:from-cyan-700 hover:to-teal-600 text-white font-semibold disabled:opacity-50"
          >
            {loading ? 'Please wait...' : mode === 'login' ? 'Sign In' : 'Create Account'}
          </button>
        </form>
        <div className="mt-4 text-center text-sm text-muted-foreground">
          {mode === 'login' ? (
            <>Don&apos;t have an account?{' '}
              <button onClick={() => setView('register', {})} className="text-cyan-600 hover:text-cyan-700 font-medium">Sign up</button>
            </>
          ) : (
            <>Already have an account?{' '}
              <button onClick={() => setView('login', {})} className="text-cyan-600 hover:text-cyan-700 font-medium">Sign in</button>
            </>
          )}
        </div>
        <div className="mt-4 pt-4 border-t border-border/40 text-xs text-muted-foreground text-center">
          <p className="font-medium mb-1">Demo accounts:</p>
          <p>buyer1@example.com · seller@boardforge.vn · admin@circuithub.vn</p>
          <p>Password: <code className="font-mono">Demo@2025</code></p>
        </div>
      </div>
    </div>
  );
}

// Quick alias to avoid import name clash
import { useToast as useToastHook } from '@/hooks/use-toast';

function PageRouter() {
  const view = useNavStore((s) => s.view);
  const params = useNavStore((s) => s.params);

  let content: React.ReactNode = null;
  let key = view;

  switch (view) {
    case 'home':
      content = <HomeView />;
      break;
    case 'products':
      content = <ProductsView />;
      break;
    case 'category':
      content = <CategoryView />;
      break;
    case 'product-detail':
      content = <ProductDetailView />;
      break;
    case 'shop':
      content = <ShopView />;
      break;
    case 'cart':
      content = <CartView />;
      break;
    case 'checkout':
      content = <CheckoutView />;
      break;
    case 'bom':
      content = <BomView />;
      break;
    case 'buyer-orders':
    case 'buyer-downloads':
    case 'buyer-wishlist':
    case 'buyer-profile':
      content = <BuyerDashboard />;
      key = 'buyer-dashboard';
      break;
    case 'seller':
    case 'seller-products':
    case 'seller-orders':
    case 'seller-wallet':
    case 'seller-analytics':
      content = <SellerCenter />;
      key = 'seller-center';
      break;
    case 'admin':
    case 'admin-users':
    case 'admin-sellers':
    case 'admin-products':
    case 'admin-orders':
    case 'admin-withdrawals':
    case 'admin-analytics':
    case 'admin-audit-logs':
      content = <AdminCenter />;
      key = 'admin-center';
      break;
    case 'login':
      content = <AuthView mode="login" />;
      key = 'auth-login';
      break;
    case 'register':
      content = <AuthView mode="register" />;
      key = 'auth-register';
      break;
    default:
      content = <HomeView />;
  }

  return (
    <AnimatePresence mode="wait">
      <motion.main
        key={key}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.25 }}
        className="flex-1"
      >
        {content}
      </motion.main>
    </AnimatePresence>
  );
}

export default function Home() {
  // Initialize hash-based routing on mount
  useEffect(() => {
    setupHashListener();
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <PageRouter />
      <Footer />
      <CartDrawer />
      <CompareDrawer />
      <CompareBar />
      <BackToTop />
      <QuickViewListener />
      <WishlistImportListener />
    </div>
  );
}

/** Quick View dialog listener — renders the QuickViewDialog when a product is selected. */
function QuickViewListener() {
  const { product, isOpen, close } = useQuickViewStore();
  return (
    <QuickViewDialog
      open={isOpen}
      onOpenChange={(o) => { if (!o) close(); }}
      product={product}
    />
  );
}

/** Detects ?wishlist=<encoded> in the URL hash and shows the import dialog. */
function WishlistImportListener() {
  const [state, setState] = useState<{ slugs: string[]; open: boolean }>({ slugs: [], open: false });
  const checkedRef = useRef(false);

  useEffect(() => {
    if (checkedRef.current) return;
    checkedRef.current = true;
    if (typeof window === 'undefined') return;
    const hash = window.location.hash;
    const match = hash.match(/wishlist=([^&]+)/);
    if (!match) return;
    try {
      const decoded = atob(match[1].replace(/-/g, '+').replace(/_/g, '/'));
      const slugs = decoded.split(',').filter(Boolean);
      if (slugs.length > 0) {
        // Clean the URL - remove the wishlist param from the hash
        const cleanPath = hash
          .replace(/^#/, '')
          .replace(/[?&]wishlist=[^&]+/, '')
          .replace(/\?$/, '')
          .replace(/\?&/, '?')
          .replace(/&$/, '');
        window.history.replaceState(null, '', `#${cleanPath}`);
        // Open the dialog (via external state update, not synchronous)
        setTimeout(() => setState({ slugs, open: true }), 0);
      }
    } catch {
      // invalid base64
    }
  }, []);

  return (
    <WishlistImportDialog
      open={state.open}
      onOpenChange={(open) => setState((s) => ({ ...s, open }))}
      slugs={state.slugs}
    />
  );
}
