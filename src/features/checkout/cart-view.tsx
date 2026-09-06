'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { useCartStore, cartTotals } from '@/stores/cart-store';
import { useNavStore } from '@/stores/nav-store';
import { useAuthStore } from '@/stores/auth-store';
import { useToast } from '@/hooks/use-toast';
import { formatVND } from '@/lib/format';
import { ProductTypeBadge } from '@/components/common/badges';
import { ShoppingCart, Trash2, Plus, Minus, ArrowRight, Tag, X, Lock, Package, Loader2 } from 'lucide-react';
import Image from 'next/image';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useI18n } from '@/lib/i18n';

export function CartView() {
  const { items, removeItem, updateQty, clear } = useCartStore();
  const { goCheckout, goProducts, goAuth } = useNavStore();
  const user = useAuthStore((s) => s.user);
  const { toast } = useToast();
  const { t } = useI18n();
  const [voucherCode, setVoucherCode] = useState('');
  const [appliedVoucher, setAppliedVoucher] = useState<{ code: string; discount: number } | null>(null);
  const [voucherLoading, setVoucherLoading] = useState(false);

  const { subtotal, count, byShop } = cartTotals(items);
  const discount = appliedVoucher?.discount ?? 0;
  const shippingEstimate = byShop.some((g) => g.items.some((i) => i.productType === 'PHYSICAL')) ? 30000 : 0;
  const total = Math.max(0, subtotal - discount) + shippingEstimate;

  async function applyVoucher() {
    if (!voucherCode.trim()) return;
    setVoucherLoading(true);
    try {
      const res = await fetch('/api/v1/vouchers/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: voucherCode.trim().toUpperCase(), subtotal }),
      });
      const json = await res.json();
      if (json.success) {
        setAppliedVoucher({ code: json.data.code, discount: json.data.discount });
        toast({ title: 'Voucher applied!', description: `You saved ${formatVND(json.data.discount)}` });
      } else {
        toast({ title: 'Voucher invalid', description: json.message, variant: 'destructive' });
      }
    } finally {
      setVoucherLoading(false);
    }
  }

  if (items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <div className="h-24 w-24 rounded-full bg-cyan-50 dark:bg-cyan-950/30 border-2 border-cyan-200 dark:border-cyan-800 flex items-center justify-center mx-auto mb-6">
          <ShoppingCart className="h-11 w-11 text-cyan-400 dark:text-cyan-600" />
        </div>
        <h1 className="text-3xl font-bold mb-2">{t('cart.empty')}</h1>
        <p className="text-muted-foreground mb-8">Browse the marketplace to find PCB boards, KiCad projects, components & engineering services.</p>
        <Button onClick={() => goProducts()} className="bg-cyan-600 hover:bg-cyan-700 text-white dark:bg-cyan-700 dark:hover:bg-cyan-600">
          <Package className="h-4 w-4 mr-2" />
          {t('cart.browseProducts')}
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-end justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">{t('cart.title')}</h1>
          <p className="text-muted-foreground">{count} {count === 1 ? 'item' : 'items'} from {byShop.length} {byShop.length === 1 ? 'shop' : 'shops'}</p>
        </div>
        <Button variant="ghost" size="sm" onClick={() => { clear(); toast({ title: 'Cart cleared' }); }}>
          <Trash2 className="h-3.5 w-3.5 mr-1.5" />
          {t('cart.clear')}
        </Button>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-5">
          {byShop.map((g) => (
            <Card key={g.shopId} className="border-border/60 bg-card dark:bg-slate-900">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center gap-2 pb-2 border-b border-border/40">
                  <Package className="h-4 w-4 text-cyan-600 dark:text-cyan-500" />
                  <span className="font-semibold">{g.shopName}</span>
                  <Badge variant="outline" className="bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800 text-[10px]">✓ Verified</Badge>
                  <span className="ml-auto text-sm font-medium text-muted-foreground">
                    {t('cart.subtotal')}: <span className="font-semibold text-foreground">{formatVND(g.subtotal)}</span>
                  </span>
                </div>
                <AnimatePresence initial={false}>
                  {g.items.map((item) => (
                    <motion.div
                      key={item.productId}
                      layout
                      exit={{ opacity: 0, x: -20 }}
                      className="flex gap-4 p-2 rounded-lg hover:bg-cyan-50/20 dark:hover:bg-cyan-900/10 transition-colors"
                    >
                      <div className="relative h-20 w-20 rounded-md overflow-hidden bg-muted border border-border/40 flex-shrink-0">
                        {item.imageUrl && (
                          <Image src={item.imageUrl} alt={item.name} fill className="object-cover" sizes="80px" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium line-clamp-2">{item.name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <ProductTypeBadge type={item.productType} className="text-[10px]" />
                          <span className="text-xs text-muted-foreground">{formatVND(item.price)} each</span>
                        </div>
                        <div className="flex items-center justify-between mt-3">
                          <div className="flex items-center border border-border/60 rounded-md">
                            <button onClick={() => updateQty(item.productId, item.quantity - 1)} className="p-1.5 hover:bg-cyan-50 dark:hover:bg-cyan-900/30 text-muted-foreground hover:text-cyan-700 dark:hover:text-cyan-400 rounded-l-md transition-colors disabled:opacity-30" disabled={item.quantity <= 1}>
                              <Minus className="h-3.5 w-3.5" />
                            </button>
                            <span className="px-3 text-sm font-semibold tabular-nums">{item.quantity}</span>
                            <button onClick={() => updateQty(item.productId, item.quantity + 1)} className="p-1.5 hover:bg-cyan-50 dark:hover:bg-cyan-900/30 text-muted-foreground hover:text-cyan-700 dark:hover:text-cyan-400 rounded-r-md transition-colors">
                              <Plus className="h-3.5 w-3.5" />
                            </button>
                          </div>
                          <span className="font-bold text-cyan-700 dark:text-cyan-400 tabular-nums">{formatVND(item.price * item.quantity)}</span>
                          <button onClick={() => removeItem(item.productId)} className="p-1.5 text-muted-foreground hover:text-red-500 transition-colors" aria-label="Remove">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="lg:col-span-1">
          <Card className="lg:sticky lg:top-32 border-border/60 bg-card dark:bg-slate-900">
            <CardContent className="p-5 space-y-4">
              <h3 className="font-semibold">Order Summary</h3>
              <Separator />
              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">{t('cart.subtotal')}</span><span className="font-medium">{formatVND(subtotal)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">{t('product.shipping') || 'Shipping estimate'}</span><span className="font-medium">{shippingEstimate === 0 ? 'Free' : formatVND(shippingEstimate)}</span></div>
                {discount > 0 && (
                  <div className="flex justify-between text-emerald-700 dark:text-emerald-400">
                    <span>Discount</span><span className="font-semibold">−{formatVND(discount)}</span>
                  </div>
                )}
              </div>
              <Separator />
              <div className="flex justify-between items-baseline">
                <span className="font-semibold">Total</span>
                <span className="text-xl font-bold text-cyan-700 dark:text-cyan-400 tabular-nums">{formatVND(total)}</span>
              </div>

              {!appliedVoucher ? (
                <div className="flex gap-2 pt-1">
                  <div className="relative flex-1">
                    <Tag className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <Input value={voucherCode} onChange={(e) => setVoucherCode(e.target.value)} placeholder="Voucher" className="pl-8 h-9 text-sm bg-background text-foreground focus-visible:ring-cyan-400 dark:focus-visible:ring-cyan-900" />
                  </div>
                  <Button size="sm" onClick={applyVoucher} disabled={voucherLoading} variant="outline" className="border-cyan-300 dark:border-cyan-800 text-cyan-700 dark:text-cyan-400 hover:bg-cyan-50 dark:hover:bg-cyan-900/30">
                    {voucherLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Apply'}
                  </Button>
                </div>
              ) : (
                <div className="flex items-center justify-between text-xs bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-md px-3 py-1.5">
                  <span className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400"><Tag className="h-3 w-3" />{appliedVoucher.code}</span>
                  <button onClick={() => { setAppliedVoucher(null); setVoucherCode(''); }} className="text-emerald-600 dark:text-emerald-500 hover:text-red-500"><X className="h-3 w-3" /></button>
                </div>
              )}

              <Button
                onClick={() => {
                  if (!user) {
                    toast({
                      title: t('auth.loginRequired') || 'Yêu cầu đăng nhập',
                      description: t('auth.loginRequiredToBuy') || 'Vui lòng đăng nhập để tiến hành mua hàng',
                    });
                    goAuth('login', 'cart');
                    return;
                  }
                  goCheckout();
                }}
                className="w-full bg-cyan-600 hover:bg-cyan-700 text-white dark:bg-cyan-700 dark:hover:bg-cyan-600 cursor-pointer"
              >
                <Lock className="h-4 w-4 mr-2" />
                {t('cart.checkout')}
              </Button>
              <Button onClick={() => goProducts()} variant="outline" className="w-full border-cyan-200 dark:border-cyan-800 text-cyan-700 dark:text-cyan-400 hover:bg-cyan-50 dark:hover:bg-cyan-900/30">
                {t('cart.continueShopping')}
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
