'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { useCartStore, cartTotals } from '@/stores/cart-store';
import { useNavStore } from '@/stores/nav-store';
import { useToast } from '@/hooks/use-toast';
import { formatVND } from '@/lib/format';
import { ProductTypeBadge } from '@/components/common/badges';
import {
  ArrowLeft,
  ArrowRight,
  CreditCard,
  Truck,
  ShieldCheck,
  CheckCircle2,
  Tag,
  X,
  Lock,
  Package,
  MapPin,
  Loader2,
  Banknote,
  Smartphone,
  Wallet,
} from 'lucide-react';
import Image from 'next/image';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

type Step = 'address' | 'shipping' | 'payment' | 'review' | 'success';
type PaymentMethod = 'MOCK' | 'COD' | 'VNPAY' | 'MOMO' | 'ZALOPAY';
type ShippingMethod = 'STANDARD' | 'EXPRESS' | 'SAMEDAY' | 'INSTANT';

const SHIPPING_OPTIONS: { id: ShippingMethod; label: string; desc: string; fee: number; days: string; types: string[] }[] = [
  { id: 'STANDARD', label: 'Standard', desc: '3-5 business days', fee: 30000, days: '3-5 days', types: ['PHYSICAL', 'SERVICE'] },
  { id: 'EXPRESS', label: 'Express', desc: '1-2 business days', fee: 60000, days: '1-2 days', types: ['PHYSICAL'] },
  { id: 'SAMEDAY', label: 'Same-Day', desc: 'Within Ho Chi Minh City', fee: 120000, days: 'today', types: ['PHYSICAL'] },
  { id: 'INSTANT', label: 'Instant Download', desc: 'Available after payment', fee: 0, days: 'instant', types: ['DIGITAL'] },
];

const PAYMENT_OPTIONS: { id: PaymentMethod; label: string; desc: string; icon: any; color: string }[] = [
  { id: 'MOCK', label: 'Mock (Test)', desc: 'Sandbox payment for development', icon: Wallet, color: 'bg-slate-100 text-slate-700' },
  { id: 'COD', label: 'Cash on Delivery', desc: 'Pay when you receive the order', icon: Banknote, color: 'bg-emerald-100 text-emerald-700' },
  { id: 'VNPAY', label: 'VNPay', desc: 'Vietnamese e-wallet & QR', icon: CreditCard, color: 'bg-cyan-100 text-cyan-700' },
  { id: 'MOMO', label: 'MoMo', desc: 'MoMo e-wallet', icon: Smartphone, color: 'bg-pink-100 text-pink-700' },
  { id: 'ZALOPAY', label: 'ZaloPay', desc: 'ZaloPay e-wallet', icon: CreditCard, color: 'bg-blue-100 text-blue-700' },
];

export function CheckoutView() {
  const { items, clear } = useCartStore();
  const { goProducts, goBuyer, setView } = useNavStore();
  const { toast } = useToast();
  const [step, setStep] = useState<Step>('address');
  const [address, setAddress] = useState({
    fullName: 'Buyer 1',
    phone: '0901234567',
    line1: '12 Nguyen Hue',
    line2: '',
    city: 'Ho Chi Minh',
    district: 'District 1',
    ward: 'Ben Nghe',
    zipCode: '700000',
    country: 'Vietnam',
  });
  const [shippingByShop, setShippingByShop] = useState<Record<string, ShippingMethod>>({});
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('MOCK');
  const [voucherCode, setVoucherCode] = useState('');
  const [appliedVoucher, setAppliedVoucher] = useState<{ code: string; discount: number } | null>(null);
  const [voucherLoading, setVoucherLoading] = useState(false);
  const [placing, setPlacing] = useState(false);
  const [orderCode, setOrderCode] = useState('');

  const { subtotal, count, byShop } = cartTotals(items);

  // Compute shipping per shop
  const shippingTotal = byShop.reduce((sum, g) => {
    const method = shippingByShop[g.shopId] ?? defaultShippingForGroup(g.items);
    const opt = SHIPPING_OPTIONS.find((o) => o.id === method)!;
    return sum + opt.fee;
  }, 0);

  const discount = appliedVoucher?.discount ?? 0;
  const grandTotal = Math.max(0, subtotal - discount) + shippingTotal;

  function defaultShippingForGroup(items: any[]): ShippingMethod {
    const types = new Set(items.map((i) => i.productType));
    if (types.has('DIGITAL') && types.size === 1) return 'INSTANT';
    if (types.has('SERVICE') && types.size === 1) return 'STANDARD';
    return 'STANDARD';
  }

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
    } catch {
      toast({ title: 'Voucher check failed', variant: 'destructive' });
    } finally {
      setVoucherLoading(false);
    }
  }

  async function placeOrder() {
    setPlacing(true);
    try {
      const res = await fetch('/api/v1/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
          address,
          voucherCode: appliedVoucher?.code,
          paymentMethod,
          shippingMethod: 'STANDARD',
          userId: useAuthStore.getState().user?.id ?? 'demo-buyer',
        }),
      });
      const json = await res.json();
      if (json.success) {
        setOrderCode(json.data.order.code);
        clear();
        setStep('success');
        toast({ title: 'Order placed!', description: json.data.order.code });
      } else {
        toast({ title: 'Order failed', description: json.message, variant: 'destructive' });
      }
    } catch (e) {
      toast({ title: 'Order failed', description: 'Network error', variant: 'destructive' });
    } finally {
      setPlacing(false);
    }
  }

  // === SUCCESS STATE ===
  if (step === 'success') {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="h-20 w-20 rounded-full bg-emerald-50 border-2 border-emerald-200 flex items-center justify-center mx-auto mb-6"
        >
          <CheckCircle2 className="h-12 w-12 text-emerald-500" />
        </motion.div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Order Placed!</h1>
        <p className="text-muted-foreground mb-2">
          Your order <span className="font-mono font-semibold text-cyan-700">{orderCode}</span> has been confirmed.
        </p>
        <p className="text-sm text-muted-foreground mb-8">
          Payment method: <Badge variant="outline" className="font-mono">{paymentMethod}</Badge>
        </p>
        <div className="flex justify-center gap-3">
          <Button onClick={() => goBuyer('buyer-orders')} className="bg-cyan-600 hover:bg-cyan-700 text-white">
            <Package className="h-4 w-4 mr-2" />
            View My Orders
          </Button>
          <Button onClick={() => goProducts()} variant="outline">
            Continue Shopping
          </Button>
        </div>
      </div>
    );
  }

  // === EMPTY STATE ===
  if (items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="h-20 w-20 rounded-full bg-cyan-50 border border-cyan-200 flex items-center justify-center mx-auto mb-6">
          <Package className="h-9 w-9 text-cyan-400" />
        </div>
        <h1 className="text-2xl font-bold mb-2">Your cart is empty</h1>
        <p className="text-muted-foreground mb-6">Add some products before checking out.</p>
        <Button onClick={() => goProducts()} className="bg-cyan-600 hover:bg-cyan-700 text-white">
          Browse Products
        </Button>
      </div>
    );
  }

  const steps: { id: Step; label: string; icon: any }[] = [
    { id: 'address', label: 'Address', icon: MapPin },
    { id: 'shipping', label: 'Shipping', icon: Truck },
    { id: 'payment', label: 'Payment', icon: CreditCard },
    { id: 'review', label: 'Review', icon: ShieldCheck },
  ];
  const currentIdx = steps.findIndex((s) => s.id === step);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <button
        onClick={() => useNavStore.getState().setView('cart')}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-cyan-700 mb-6"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to cart
      </button>

      <h1 className="text-3xl font-bold text-foreground mb-2">Checkout</h1>
      <p className="text-muted-foreground mb-6">Complete your purchase in 4 steps</p>

      {/* Stepper */}
      <div className="flex items-center gap-2 sm:gap-4 mb-8 overflow-x-auto pb-2">
        {steps.map((s, i) => {
          const Icon = s.icon;
          const isActive = step === s.id;
          const isPast = currentIdx > i;
          return (
            <div key={s.id} className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
              <div className={cn('flex items-center gap-2', isActive ? 'text-cyan-700' : isPast ? 'text-emerald-600' : 'text-muted-foreground')}>
                <div className={cn(
                  'h-9 w-9 rounded-full flex items-center justify-center border-2 font-semibold text-sm',
                  isActive ? 'border-cyan-500 bg-cyan-50' : isPast ? 'border-emerald-500 bg-emerald-50' : 'border-border bg-background',
                )}>
                  {isPast ? <CheckCircle2 className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                </div>
                <span className="text-sm font-medium hidden sm:inline">{s.label}</span>
              </div>
              {i < steps.length - 1 && (
                <div className={cn('h-0.5 w-8 sm:w-16', isPast ? 'bg-emerald-300' : 'bg-border')} />
              )}
            </div>
          );
        })}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2">
          <AnimatePresence mode="wait">
            {step === 'address' && (
              <motion.div key="address" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                <Card className="border-border/60">
                  <CardContent className="p-6 space-y-5">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-5 w-5 text-cyan-600" />
                      <h2 className="text-lg font-semibold">Shipping Address</h2>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label htmlFor="fullName">Full Name</Label>
                        <Input id="fullName" value={address.fullName} onChange={(e) => setAddress({ ...address, fullName: e.target.value })} />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="phone">Phone</Label>
                        <Input id="phone" value={address.phone} onChange={(e) => setAddress({ ...address, phone: e.target.value })} />
                      </div>
                      <div className="space-y-1.5 sm:col-span-2">
                        <Label htmlFor="line1">Address Line 1</Label>
                        <Input id="line1" value={address.line1} onChange={(e) => setAddress({ ...address, line1: e.target.value })} />
                      </div>
                      <div className="space-y-1.5 sm:col-span-2">
                        <Label htmlFor="line2">Address Line 2 (optional)</Label>
                        <Input id="line2" value={address.line2} onChange={(e) => setAddress({ ...address, line2: e.target.value })} />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="city">City</Label>
                        <Input id="city" value={address.city} onChange={(e) => setAddress({ ...address, city: e.target.value })} />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="district">District</Label>
                        <Input id="district" value={address.district} onChange={(e) => setAddress({ ...address, district: e.target.value })} />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="ward">Ward</Label>
                        <Input id="ward" value={address.ward} onChange={(e) => setAddress({ ...address, ward: e.target.value })} />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="zipCode">Zip Code</Label>
                        <Input id="zipCode" value={address.zipCode} onChange={(e) => setAddress({ ...address, zipCode: e.target.value })} />
                      </div>
                    </div>
                    <div className="flex justify-end pt-2">
                      <Button onClick={() => setStep('shipping')} className="bg-cyan-600 hover:bg-cyan-700 text-white">
                        Continue
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {step === 'shipping' && (
              <motion.div key="shipping" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                <Card className="border-border/60">
                  <CardContent className="p-6 space-y-5">
                    <div className="flex items-center gap-2">
                      <Truck className="h-5 w-5 text-cyan-600" />
                      <h2 className="text-lg font-semibold">Shipping Method</h2>
                    </div>
                    <p className="text-sm text-muted-foreground">Choose a shipping method for each shop. Digital & service items ship instantly.</p>
                    <div className="space-y-5">
                      {byShop.map((g) => {
                        const types = new Set(g.items.map((i) => i.productType));
                        const isDigital = types.has('DIGITAL') && types.size === 1;
                        const current = shippingByShop[g.shopId] ?? defaultShippingForGroup(g.items);
                        const applicable = SHIPPING_OPTIONS.filter((o) => o.types.some((t) => types.has(t)));
                        return (
                          <div key={g.shopId} className="space-y-2">
                            <div className="flex items-center justify-between pb-2 border-b border-border/40">
                              <div className="flex items-center gap-2">
                                <Package className="h-3.5 w-3.5 text-cyan-600" />
                                <span className="text-sm font-semibold">{g.shopName}</span>
                                <Badge variant="outline" className="text-[10px]">
                                  {g.items.length} item{g.items.length !== 1 ? 's' : ''}
                                </Badge>
                                {isDigital && <Badge variant="outline" className="text-[10px] bg-teal-50 text-teal-700 border-teal-200">Digital</Badge>}
                              </div>
                              <span className="text-sm font-medium text-muted-foreground">{formatVND(g.subtotal)}</span>
                            </div>
                            <RadioGroup
                              value={current}
                              onValueChange={(v) => setShippingByShop((s) => ({ ...s, [g.shopId]: v as ShippingMethod }))}
                              className="grid sm:grid-cols-2 gap-2"
                            >
                              {applicable.map((opt) => (
                                <label
                                  key={opt.id}
                                  className={cn(
                                    'flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors',
                                    current === opt.id ? 'border-cyan-500 bg-cyan-50/50' : 'border-border/60 hover:bg-cyan-50/20',
                                  )}
                                >
                                  <RadioGroupItem value={opt.id} id={`${g.shopId}-${opt.id}`} className="mt-0.5" />
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between gap-2">
                                      <span className="text-sm font-semibold">{opt.label}</span>
                                      <span className="text-sm font-bold text-cyan-700">{opt.fee === 0 ? 'Free' : formatVND(opt.fee)}</span>
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-0.5">{opt.desc} · {opt.days}</p>
                                  </div>
                                </label>
                              ))}
                            </RadioGroup>
                          </div>
                        );
                      })}
                    </div>
                    <div className="flex justify-between pt-2">
                      <Button onClick={() => setStep('address')} variant="outline">
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back
                      </Button>
                      <Button onClick={() => setStep('payment')} className="bg-cyan-600 hover:bg-cyan-700 text-white">
                        Continue
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {step === 'payment' && (
              <motion.div key="payment" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                <Card className="border-border/60">
                  <CardContent className="p-6 space-y-5">
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-5 w-5 text-cyan-600" />
                      <h2 className="text-lg font-semibold">Payment Method</h2>
                    </div>
                    <RadioGroup value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as PaymentMethod)} className="grid sm:grid-cols-2 gap-3">
                      {PAYMENT_OPTIONS.map((opt) => {
                        const Icon = opt.icon;
                        return (
                          <label
                            key={opt.id}
                            className={cn(
                              'flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors',
                              paymentMethod === opt.id ? 'border-cyan-500 bg-cyan-50/50' : 'border-border/60 hover:bg-cyan-50/20',
                            )}
                          >
                            <RadioGroupItem value={opt.id} id={opt.id} className="mt-0.5" />
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <div className={cn('h-8 w-8 rounded-md flex items-center justify-center', opt.color)}>
                                  <Icon className="h-4 w-4" />
                                </div>
                                <span className="text-sm font-semibold">{opt.label}</span>
                              </div>
                              <p className="text-xs text-muted-foreground mt-1">{opt.desc}</p>
                            </div>
                          </label>
                        );
                      })}
                    </RadioGroup>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground bg-cyan-50/40 border border-cyan-100 rounded-md p-3">
                      <Lock className="h-3.5 w-3.5 text-cyan-600 flex-shrink-0" />
                      All payments are processed securely. Your card information is never stored on our servers.
                    </div>
                    <div className="flex justify-between pt-2">
                      <Button onClick={() => setStep('shipping')} variant="outline">
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back
                      </Button>
                      <Button onClick={() => setStep('review')} className="bg-cyan-600 hover:bg-cyan-700 text-white">
                        Continue
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {step === 'review' && (
              <motion.div key="review" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                <Card className="border-border/60">
                  <CardContent className="p-6 space-y-5">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="h-5 w-5 text-cyan-600" />
                      <h2 className="text-lg font-semibold">Review & Place Order</h2>
                    </div>

                    {/* Address review */}
                    <div className="rounded-lg border border-border/60 p-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Shipping to</span>
                        <button onClick={() => setStep('address')} className="text-xs text-cyan-600 hover:text-cyan-700">Edit</button>
                      </div>
                      <p className="text-sm font-medium">{address.fullName} · {address.phone}</p>
                      <p className="text-sm text-muted-foreground">{address.line1}{address.line2 ? `, ${address.line2}` : ''}</p>
                      <p className="text-sm text-muted-foreground">{address.ward}, {address.district}, {address.city}, {address.country} {address.zipCode}</p>
                    </div>

                    {/* Items by shop */}
                    <div className="space-y-3">
                      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Items ({count})</span>
                      {byShop.map((g) => (
                        <div key={g.shopId} className="rounded-lg border border-border/60 p-3 space-y-2">
                          <div className="flex items-center gap-2 pb-2 border-b border-border/40">
                            <Package className="h-3.5 w-3.5 text-cyan-600" />
                            <span className="text-sm font-semibold">{g.shopName}</span>
                            <span className="ml-auto text-xs text-muted-foreground">
                              Shipping: {formatVND(SHIPPING_OPTIONS.find(o => o.id === (shippingByShop[g.shopId] ?? defaultShippingForGroup(g.items)))!.fee)}
                            </span>
                          </div>
                          {g.items.map((item) => (
                            <div key={item.productId} className="flex gap-3">
                              <div className="relative h-12 w-12 rounded-md overflow-hidden bg-muted border border-border/40 flex-shrink-0">
                                {item.imageUrl && (
                                  <Image src={item.imageUrl} alt={item.name} fill className="object-cover" sizes="48px" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium line-clamp-1">{item.name}</p>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                  <ProductTypeBadge type={item.productType} className="text-[10px] px-1.5 py-0" />
                                  <span>×{item.quantity}</span>
                                </div>
                              </div>
                              <span className="text-sm font-semibold text-cyan-700">{formatVND(item.price * item.quantity)}</span>
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>

                    {/* Payment review */}
                    <div className="rounded-lg border border-border/60 p-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Payment</span>
                        <button onClick={() => setStep('payment')} className="text-xs text-cyan-600 hover:text-cyan-700">Change</button>
                      </div>
                      <p className="text-sm font-medium">
                        {PAYMENT_OPTIONS.find(p => p.id === paymentMethod)?.label}
                      </p>
                    </div>

                    <div className="flex justify-between pt-2">
                      <Button onClick={() => setStep('payment')} variant="outline">
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back
                      </Button>
                      <Button onClick={placeOrder} disabled={placing} className="bg-gradient-to-r from-cyan-600 to-teal-500 hover:from-cyan-700 hover:to-teal-600 text-white">
                        {placing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Lock className="h-4 w-4 mr-2" />}
                        {placing ? 'Placing Order...' : `Place Order · ${formatVND(grandTotal)}`}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Order Summary sidebar */}
        <div className="lg:col-span-1">
          <Card className="lg:sticky lg:top-32 border-border/60">
            <CardContent className="p-5 space-y-4">
              <h3 className="font-semibold text-base flex items-center gap-2">
                <Package className="h-4 w-4 text-cyan-600" />
                Order Summary
              </h3>
              <Separator />
              <div className="space-y-2">
                {byShop.map((g) => (
                  <div key={g.shopId} className="text-sm">
                    <div className="flex justify-between text-xs text-muted-foreground mb-1">
                      <span>{g.shopName} ({g.items.length})</span>
                      <span className="font-medium text-foreground">{formatVND(g.subtotal)}</span>
                    </div>
                  </div>
                ))}
              </div>
              <Separator />
              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-medium">{formatVND(subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Shipping</span>
                  <span className="font-medium">{formatVND(shippingTotal)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-emerald-700">
                    <span>Discount ({appliedVoucher?.code})</span>
                    <span className="font-semibold">−{formatVND(discount)}</span>
                  </div>
                )}
              </div>
              <Separator />
              <div className="flex justify-between items-baseline">
                <span className="font-semibold">Total</span>
                <span className="text-xl font-bold text-cyan-700 tabular-nums">{formatVND(grandTotal)}</span>
              </div>

              {/* Voucher input in sidebar */}
              {!appliedVoucher ? (
                <div className="flex gap-2 pt-1">
                  <div className="relative flex-1">
                    <Tag className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <Input
                      value={voucherCode}
                      onChange={(e) => setVoucherCode(e.target.value)}
                      placeholder="Voucher code"
                      className="pl-8 h-9 text-sm"
                    />
                  </div>
                  <Button size="sm" onClick={applyVoucher} disabled={voucherLoading} variant="outline" className="border-cyan-300 text-cyan-700 hover:bg-cyan-50">
                    {voucherLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Apply'}
                  </Button>
                </div>
              ) : (
                <div className="flex items-center justify-between text-xs bg-emerald-50 border border-emerald-200 rounded-md px-3 py-1.5">
                  <span className="flex items-center gap-1.5 text-emerald-700">
                    <Tag className="h-3 w-3" />
                    {appliedVoucher.code} applied
                  </span>
                  <button onClick={() => { setAppliedVoucher(null); setVoucherCode(''); }} className="text-emerald-600 hover:text-red-500">
                    <X className="h-3 w-3" />
                  </button>
                </div>
              )}

              <p className="text-[11px] text-muted-foreground flex items-center gap-1 pt-1">
                <Lock className="h-3 w-3" />
                Secure checkout · 256-bit SSL
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
