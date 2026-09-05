'use client';

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useCartStore, cartTotals } from '@/stores/cart-store';
import { useNavStore } from '@/stores/nav-store';
import { useToast } from '@/hooks/use-toast';
import { formatVND } from '@/lib/format';
import { ProductTypeBadge } from '@/components/common/badges';
import {
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  Tag,
  X,
  Lock,
  Package,
  FileCode,
  Wrench,
  Loader2,
} from 'lucide-react';
import Image from 'next/image';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useI18n } from '@/lib/i18n';

export function CartDrawer() {
  const { items, isOpen, close, removeItem, updateQty } = useCartStore();
  const { goCheckout, goProducts } = useNavStore();
  const { toast } = useToast();
  const { t } = useI18n();
  const [voucherCode, setVoucherCode] = useState('');
  const [appliedVoucher, setAppliedVoucher] = useState<{
    code: string;
    discount: number;
  } | null>(null);
  const [voucherLoading, setVoucherLoading] = useState(false);

  const { subtotal, count, byShop } = cartTotals(items);
  const discount = appliedVoucher?.discount ?? 0;
  const finalTotal = Math.max(0, subtotal - discount);

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
        setAppliedVoucher(null);
      }
    } catch (e) {
      toast({ title: 'Voucher check failed', variant: 'destructive' });
    } finally {
      setVoucherLoading(false);
    }
  }

  function handleCheckout() {
    close();
    goCheckout();
  }

  function handleBrowse() {
    close();
    goProducts();
  }

  return (
    <Sheet open={isOpen} onOpenChange={(o) => !o && close()}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-lg p-0 flex flex-col gap-0"
      >
        <SheetHeader className="px-5 py-4 border-b border-border/60 bg-gradient-to-br from-cyan-50/60 to-transparent dark:from-cyan-950/20">
          <SheetTitle className="flex items-center gap-2 text-base">
            <ShoppingCart className="h-4 w-4 text-cyan-600 dark:text-cyan-500" />
            {t('cart.title')}
            <Badge variant="secondary" className="ml-1 bg-cyan-100 text-cyan-700 dark:bg-cyan-900/50 dark:text-cyan-400">
              {count} {count === 1 ? 'item' : 'items'}
            </Badge>
          </SheetTitle>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 px-6 py-12">
            <div className="h-20 w-20 rounded-full bg-cyan-50 dark:bg-cyan-950/30 border border-cyan-200 dark:border-cyan-800 flex items-center justify-center">
              <ShoppingCart className="h-9 w-9 text-cyan-400 dark:text-cyan-600" />
            </div>
            <div className="text-center">
              <p className="text-base font-semibold text-foreground">{t('cart.empty')}</p>
              <p className="text-sm text-muted-foreground mt-1">
                Browse PCB boards, KiCad projects, components & services.
              </p>
            </div>
            <Button onClick={handleBrowse} className="bg-cyan-600 hover:bg-cyan-700 text-white dark:bg-cyan-700 dark:hover:bg-cyan-600">
              <Package className="h-4 w-4 mr-2" />
              {t('cart.browseProducts')}
            </Button>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5">
              {byShop.map((group) => (
                <div key={group.shopId} className="space-y-2">
                  <div className="flex items-center gap-2 px-1 pb-2 border-b border-border/40">
                    <Store className="h-3.5 w-3.5 text-cyan-600" />
                    <span className="text-sm font-semibold text-foreground truncate">{group.shopName}</span>
                    <Badge variant="outline" className="ml-auto bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px]">
                      ✓ Verified
                    </Badge>
                  </div>
                  <AnimatePresence initial={false}>
                    {group.items.map((item) => (
                      <motion.div
                        key={item.productId}
                        layout
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="flex gap-3 p-2 rounded-lg border border-border/40 hover:border-cyan-300/40 hover:bg-cyan-50/30 transition-colors"
                      >
                        <div className="relative h-16 w-16 rounded-md overflow-hidden bg-muted flex-shrink-0 border border-border/40">
                          {item.imageUrl ? (
                            <Image src={item.imageUrl} alt={item.name} fill className="object-cover" sizes="64px" />
                          ) : (
                            <Package className="h-6 w-6 m-auto text-muted-foreground" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start gap-2">
                            <p className="text-sm font-medium text-foreground line-clamp-2 flex-1">{item.name}</p>
                            <button
                              onClick={() => removeItem(item.productId)}
                              className="p-1 text-muted-foreground hover:text-red-500 transition-colors"
                              aria-label="Remove item"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <ProductTypeBadge type={item.productType} className="text-[10px] px-1.5 py-0" />
                          </div>
                          <div className="flex items-center justify-between mt-2">
                            <div className="flex items-center border border-border/60 rounded-md">
                              <button
                                onClick={() => updateQty(item.productId, item.quantity - 1)}
                                className="p-1.5 hover:bg-cyan-50 text-muted-foreground hover:text-cyan-700 rounded-l-md transition-colors disabled:opacity-30"
                                disabled={item.quantity <= 1}
                                aria-label="Decrease quantity"
                              >
                                <Minus className="h-3 w-3" />
                              </button>
                              <span className="px-2.5 text-sm font-semibold text-foreground min-w-[2.5rem] text-center tabular-nums">
                                {item.quantity}
                              </span>
                              <button
                                onClick={() => updateQty(item.productId, item.quantity + 1)}
                                className="p-1.5 hover:bg-cyan-50 text-muted-foreground hover:text-cyan-700 rounded-r-md transition-colors"
                                aria-label="Increase quantity"
                              >
                                <Plus className="h-3 w-3" />
                              </button>
                            </div>
                            <span className="text-sm font-bold text-cyan-700 tabular-nums">
                              {formatVND(item.price * item.quantity)}
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                  <div className="flex items-center justify-between px-2 pt-1 text-xs text-muted-foreground">
                    <span>Subtotal for {group.shopName}</span>
                    <span className="font-semibold text-foreground">{formatVND(group.subtotal)}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Voucher + Footer */}
            <div className="border-t border-border/60 bg-slate-50/40 dark:bg-slate-900/40 px-4 py-3 space-y-3">
              {/* Voucher */}
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Tag className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <input
                    value={voucherCode}
                    onChange={(e) => setVoucherCode(e.target.value)}
                    placeholder="Voucher code (e.g. WELCOME10)"
                    className="w-full h-9 pl-8 pr-3 text-sm bg-background text-foreground rounded-md border border-border/60 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100 dark:focus:ring-cyan-900 outline-none"
                  />
                </div>
                <Button
                  size="sm"
                  onClick={applyVoucher}
                  disabled={voucherLoading || !voucherCode.trim()}
                  variant="outline"
                  className="border-cyan-300 text-cyan-700 hover:bg-cyan-50 dark:border-cyan-800 dark:text-cyan-400 dark:hover:bg-cyan-900/30"
                >
                  {voucherLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Apply'}
                </Button>
              </div>
              {appliedVoucher && (
                <div className="flex items-center justify-between text-xs bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-md px-3 py-1.5">
                  <span className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400">
                    <Tag className="h-3 w-3" />
                    {appliedVoucher.code} applied
                  </span>
                  <span className="font-semibold text-emerald-700 dark:text-emerald-400">−{formatVND(appliedVoucher.discount)}</span>
                  <button
                    onClick={() => {
                      setAppliedVoucher(null);
                      setVoucherCode('');
                    }}
                    className="text-emerald-600 hover:text-red-500 dark:text-emerald-500 dark:hover:text-red-400"
                    aria-label="Remove voucher"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              )}

              <Separator className="dark:bg-border/60" />

              {/* Totals */}
              <div className="space-y-1 text-sm">
                <div className="flex justify-between text-muted-foreground">
                  <span>{t('cart.subtotal')}</span>
                  <span className="text-foreground font-medium">{formatVND(subtotal)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-emerald-700 dark:text-emerald-400">
                    <span>Discount</span>
                    <span className="font-semibold">−{formatVND(discount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-muted-foreground">
                  <span>{t('product.shipping') || 'Shipping'}</span>
                  <span className="text-foreground">Calculated at checkout</span>
                </div>
                <div className="flex justify-between pt-1 border-t border-border/40">
                  <span className="font-semibold text-foreground">Estimated Total</span>
                  <span className="text-lg font-bold text-cyan-700 dark:text-cyan-400 tabular-nums">{formatVND(finalTotal)}</span>
                </div>
              </div>

              <div className="flex gap-2">
                <Button onClick={handleCheckout} className="flex-1 bg-cyan-600 hover:bg-cyan-700 text-white dark:bg-cyan-700 dark:hover:bg-cyan-600">
                  <Lock className="h-3.5 w-3.5 mr-1.5" />
                  {t('cart.checkout')}
                </Button>
                <Button onClick={handleBrowse} variant="outline" className="border-cyan-200 text-cyan-700 hover:bg-cyan-50 dark:border-cyan-800 dark:text-cyan-400 dark:hover:bg-cyan-900/30">
                  {t('cart.continueShopping')}
                </Button>
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

function Store(props: any) {
  return (
    <svg viewBox="0 0 24 24" fill="none" {...props}>
      <path d="M3 9l1.5-5h15L21 9M3 9v10a1 1 0 001 1h16a1 1 0 001-1V9M3 9h18M9 13h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
