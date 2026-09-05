'use client';

import { useEffect, useRef, useState } from 'react';
import { useNavStore, setupHashListener } from '@/stores/nav-store';
import { useAuthStore } from '@/stores/auth-store';
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
import { AdminLoginView } from '@/features/admin/admin-login-view';
import { SellerOnboardingView } from '@/features/seller/seller-onboarding-view';
import { motion, AnimatePresence } from 'framer-motion';
import { useShop } from '@/lib/api/hooks';
import { ArrowLeft, Building2, Loader2 } from 'lucide-react';
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
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

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
      if (json.success && json.data?.user) {
        toast({ title: mode === 'login' ? 'Đăng nhập thành công!' : 'Tạo tài khoản thành công!', description: `Xin chào ${json.data.user.name}` });
        useAuthStore.getState().setAuth(json.data.user, json.data.token);
        setView('home', {});
      } else {
        toast({ title: 'Đăng nhập thất bại', description: json.message || 'Vui lòng kiểm tra lại thông tin', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Lỗi kết nối mạng', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }

  async function googleLogin() {
    setGoogleLoading(true);
    setTimeout(() => {
      toast({
        title: 'Google Sign-In',
        description: 'Tính năng Google OAuth đang được liên kết. Vui lòng sử dụng Email và Mật khẩu để đăng nhập.',
      });
      setGoogleLoading(false);
    }, 600);
  }

  return (
    <div className="max-w-md mx-auto px-4 py-12 sm:py-16">
      <div className="bg-card border border-border/60 rounded-2xl p-6 sm:p-8 shadow-sm">
        <h1 className="text-2xl font-bold text-center mb-1">
          {mode === 'login' ? 'Welcome back' : 'Create your account'}
        </h1>
        <p className="text-sm text-muted-foreground text-center mb-6">
          {mode === 'login' ? 'Sign in to your CircuitHub account' : 'Join CircuitHub — the electronics marketplace'}
        </p>

        {/* Google Sign-In */}
        <button
          onClick={googleLogin}
          disabled={googleLoading}
          className="w-full h-11 rounded-lg border border-border/60 bg-white hover:bg-slate-50 flex items-center justify-center gap-3 font-medium text-sm text-foreground transition-colors disabled:opacity-50"
        >
          {googleLoading ? (
            <Loader2 className="h-5 w-5 animate-spin text-cyan-500" />
          ) : (
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
          )}
          {mode === 'login' ? 'Continue with Google' : 'Sign up with Google'}
        </button>

        {/* Divider */}
        <div className="flex items-center gap-3 my-5">
          <div className="flex-1 h-px bg-border/60" />
          <span className="text-xs text-muted-foreground">or</span>
          <div className="flex-1 h-px bg-border/60" />
        </div>

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
            {loading ? <Loader2 className="h-5 w-5 animate-spin mx-auto" /> : mode === 'login' ? 'Sign In' : 'Create Account'}
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
        <div className="mt-4 pt-4 border-t border-border/50 text-center text-xs text-muted-foreground">
          <button onClick={() => setView('admin-login', {})} className="hover:text-cyan-600 transition-colors">
            🛡️ Cổng đăng nhập Quản trị viên (Admin)
          </button>
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
  const user = useAuthStore((s) => s.user);

  let content: React.ReactNode = null;
  let key: string = view;

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
      if (!user) {
        content = <AuthView mode="login" />;
        key = 'auth-login';
      } else {
        content = <BuyerDashboard />;
        key = 'buyer-dashboard';
      }
      break;
    case 'seller':
    case 'seller-products':
    case 'seller-orders':
    case 'seller-wallet':
    case 'seller-analytics':
      if (!user) {
        content = <AuthView mode="login" />;
        key = 'auth-login';
      } else if (user.role !== 'SELLER' && user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
        content = <SellerOnboardingView />;
        key = 'seller-onboarding';
      } else {
        content = <SellerCenter />;
        key = 'seller-center';
      }
      break;
    case 'admin':
    case 'admin-users':
    case 'admin-sellers':
    case 'admin-products':
    case 'admin-orders':
    case 'admin-withdrawals':
    case 'admin-analytics':
    case 'admin-audit-logs':
      if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN')) {
        content = <AdminLoginView />;
        key = 'admin-login';
      } else {
        content = <AdminCenter />;
        key = 'admin-center';
      }
      break;
    case 'login':
      content = <AuthView mode="login" />;
      key = 'auth-login';
      break;
    case 'register':
      content = <AuthView mode="register" />;
      key = 'auth-register';
      break;
    case 'admin-login':
      content = <AdminLoginView />;
      key = 'admin-login';
      break;
    case 'seller-onboarding':
      content = <SellerOnboardingView />;
      key = 'seller-onboarding';
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
  const [mounted, setMounted] = useState(false);

  // Initialize hash-based routing on mount
  useEffect(() => {
    setupHashListener();
    setMounted(true);
  }, []);

  const view = useNavStore((s) => s.view);
  const user = useAuthStore((s) => s.user);

  const isAdminView = view === 'admin-login' || (typeof view === 'string' && view.startsWith('admin'));
  const isAdminAuthenticated = user && (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN');

  const isStandaloneView =
    view === 'admin-login' ||
    view === 'seller-onboarding' ||
    (isAdminView && !isAdminAuthenticated);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-cyan-500 border-t-transparent" />
      </div>
    );
  }

  if (isStandaloneView) {
    return (
      <div className="min-h-screen bg-background">
        <PageRouter />
      </div>
    );
  }

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
