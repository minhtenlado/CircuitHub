'use client';

/* ============================================================
   CircuitHub — SellerCenter
   Single-file seller center with 12 internal tabs:
   Overview · Products · Digital Assets · PCB Projects ·
   Orders · Shipping · Revenue · Wallet · Withdrawals ·
   Reviews · Analytics · Settings.

   Layout:
   - Sticky left sidebar (grouped by section) on lg+
   - Horizontal scrollable pill nav at top on mobile
   - AnimatePresence (mode="wait") for tab transitions
   - Container: max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8
   - Header: "Seller Center" with shop logo + name + verified
     badge + "View shop" button + commission rate badge (5%)

   Data:
   - useSellerAnalytics('demo-seller') for wallet, metrics,
     topProducts, lowStock, recentOrders, withdrawals, reviews,
     12-month chart.
   - useSellerProducts('demo-seller') for the Products /
     Digital Assets / PCB Projects tables.
   - useWallet('demo-seller') for wallet + transactions.
   - useOrders('demo-seller', 'seller') for seller orders.
   - Custom useWithdrawals hook (inline) for the Withdrawals tab.
   - DEMO_SHIPMENTS, DEMO_VERSIONS, DEMO_TRAFFIC used as
     fallback / supplement where the API doesn't yet return
     structured data (e.g. shipments not linked to seller orders).
   ============================================================ */

import { useState, useMemo, Fragment } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  useSellerAnalytics,
  useSellerProducts,
  useWallet,
  useOrders,
} from '@/lib/api/hooks';
import { useNavStore } from '@/stores/nav-store';
import { useToast } from '@/hooks/use-toast';
import { AddProductDialog } from '@/components/seller/add-product-dialog';
import {
  formatVND,
  formatVNDCompact,
  formatDate,
  timeAgo,
  formatFileSize,
} from '@/lib/format';
import { Rating } from '@/components/common/rating';
import {
  ProductTypeBadge,
  StockBadge,
  VerifiedBadge,
  TechBadge,
  DiscountBadge,
} from '@/components/common/badges';
import {
  Package,
  DollarSign,
  TrendingUp,
  ShoppingCart,
  AlertTriangle,
  FileCode,
  Layers,
  Truck,
  Wallet,
  Download,
  Star,
  Settings,
  Cog,
  Plus,
  Pencil,
  Trash2,
  Eye,
  ChevronRight,
  ArrowUpRight,
  ArrowDownRight,
  Banknote,
  Clock,
  CheckCircle2,
  FileText,
  BarChart3,
  PieChart,
  Activity,
  Store,
  MessageSquare,
  ChevronDown,
  Search,
  Image as ImageIcon,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  PieChart as RPieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
} from 'recharts';
import { cn } from '@/lib/utils';

/* ---------------- Constants ---------------- */

const SELLER_ID = 'demo-seller';
const COMMISSION_RATE = 0.05;

const CHART_COLORS = ['#06b6d4', '#2dd4bf', '#22d3ee', '#0891b2', '#14b8a6'];
const PIE_COLORS = ['#06b6d4', '#2dd4bf', '#22d3ee', '#0891b2', '#14b8a6', '#67e8f9'];

const SHOP_INFO = {
  name: 'BoardForge Studio',
  slug: 'boardforge-studio',
  logoUrl: 'https://api.dicebear.com/7.x/shapes/svg?seed=boardforge&backgroundColor=06b6d4',
  bannerUrl: 'https://api.dicebear.com/7.x/shapes/svg?seed=circuit&backgroundColor=22d3ee',
  verified: true,
  commissionRate: COMMISSION_RATE,
  specializations: ['PCB Design', 'Embedded Firmware', 'KiCad Templates', 'Hardware Kits'],
  responseTime: 12,
};

/* ---------------- Types ---------------- */

type TabId =
  | 'overview'
  | 'products'
  | 'digital'
  | 'pcb'
  | 'orders'
  | 'shipping'
  | 'revenue'
  | 'wallet'
  | 'withdrawals'
  | 'reviews'
  | 'analytics'
  | 'settings';

type SectionId = 'Catalog' | 'Sales' | 'Finance' | 'Communication';

interface SidebarSection {
  title: SectionId;
  items: { id: TabId; label: string; icon: typeof Package; description: string }[];
}

/* ---------------- Status config ---------------- */

const ORDER_STATUS_CONFIG: Record<string, { label: string; cls: string; dot: string }> = {
  PENDING: { label: 'Pending', cls: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-500' },
  PENDING_PAYMENT: { label: 'Pending payment', cls: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-500' },
  PAID: { label: 'Paid', cls: 'bg-cyan-50 text-cyan-700 border-cyan-200', dot: 'bg-cyan-500' },
  CONFIRMED: { label: 'Confirmed', cls: 'bg-cyan-50 text-cyan-700 border-cyan-200', dot: 'bg-cyan-500' },
  PACKING: { label: 'Packing', cls: 'bg-blue-50 text-blue-700 border-blue-200', dot: 'bg-blue-500' },
  READY_TO_SHIP: { label: 'Ready to ship', cls: 'bg-blue-50 text-blue-700 border-blue-200', dot: 'bg-blue-500' },
  SHIPPING: { label: 'Shipping', cls: 'bg-blue-50 text-blue-700 border-blue-200', dot: 'bg-blue-500' },
  DELIVERED: { label: 'Delivered', cls: 'bg-teal-50 text-teal-700 border-teal-200', dot: 'bg-teal-500' },
  COMPLETED: { label: 'Completed', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
  CANCELLED: { label: 'Cancelled', cls: 'bg-red-50 text-red-700 border-red-200', dot: 'bg-red-500' },
};

const SHIPMENT_STATUS_CONFIG: Record<string, { label: string; cls: string; dot: string }> = {
  PENDING: { label: 'Pending', cls: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-500' },
  PICKED_UP: { label: 'Picked up', cls: 'bg-cyan-50 text-cyan-700 border-cyan-200', dot: 'bg-cyan-500' },
  IN_TRANSIT: { label: 'In transit', cls: 'bg-blue-50 text-blue-700 border-blue-200', dot: 'bg-blue-500' },
  OUT_FOR_DELIVERY: { label: 'Out for delivery', cls: 'bg-blue-50 text-blue-700 border-blue-200', dot: 'bg-blue-500' },
  DELIVERED: { label: 'Delivered', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
  DELIVERY_FAILED: { label: 'Failed', cls: 'bg-red-50 text-red-700 border-red-200', dot: 'bg-red-500' },
  RETURNING: { label: 'Returning', cls: 'bg-slate-50 text-slate-700 border-slate-200', dot: 'bg-slate-500' },
  RETURNED: { label: 'Returned', cls: 'bg-slate-50 text-slate-700 border-slate-200', dot: 'bg-slate-500' },
};

const WITHDRAWAL_STATUS_CONFIG: Record<string, { label: string; cls: string; dot: string }> = {
  PENDING: { label: 'Pending', cls: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-500' },
  APPROVED: { label: 'Approved', cls: 'bg-cyan-50 text-cyan-700 border-cyan-200', dot: 'bg-cyan-500' },
  PROCESSING: { label: 'Processing', cls: 'bg-blue-50 text-blue-700 border-blue-200', dot: 'bg-blue-500' },
  COMPLETED: { label: 'Completed', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
  REJECTED: { label: 'Rejected', cls: 'bg-red-50 text-red-700 border-red-200', dot: 'bg-red-500' },
};

const WALLET_TX_CONFIG: Record<string, { label: string; cls: string; icon: typeof Banknote }> = {
  SALE: { label: 'Sale', cls: 'text-emerald-600', icon: TrendingUp },
  COMMISSION: { label: 'Commission', cls: 'text-amber-600', icon: Banknote },
  REFUND: { label: 'Refund', cls: 'text-rose-600', icon: ArrowDownRight },
  ADJUSTMENT: { label: 'Adjustment', cls: 'text-cyan-600', icon: Cog },
  WITHDRAWAL: { label: 'Withdrawal', cls: 'text-slate-600', icon: Banknote },
  REVERSAL: { label: 'Reversal', cls: 'text-rose-600', icon: ArrowDownRight },
};

/* ---------------- Tabs config ---------------- */

const SIDEBAR_SECTIONS: SidebarSection[] = [
  {
    title: 'Catalog',
    items: [
      { id: 'overview', label: 'Overview', icon: Activity, description: 'Dashboard snapshot' },
      { id: 'products', label: 'Products', icon: Package, description: 'Manage all products' },
      { id: 'digital', label: 'Digital Assets', icon: FileCode, description: 'Digital products & versions' },
      { id: 'pcb', label: 'PCB Projects', icon: Layers, description: 'Physical PCB products' },
    ],
  },
  {
    title: 'Sales',
    items: [
      { id: 'orders', label: 'Orders', icon: ShoppingCart, description: 'Customer orders' },
      { id: 'shipping', label: 'Shipping', icon: Truck, description: 'Active shipments' },
      { id: 'revenue', label: 'Revenue', icon: DollarSign, description: 'Revenue & settlements' },
    ],
  },
  {
    title: 'Finance',
    items: [
      { id: 'wallet', label: 'Wallet', icon: Wallet, description: 'Balances & ledger' },
      { id: 'withdrawals', label: 'Withdrawals', icon: Banknote, description: 'Withdrawal requests' },
      { id: 'analytics', label: 'Analytics', icon: BarChart3, description: 'Performance charts' },
    ],
  },
  {
    title: 'Communication',
    items: [
      { id: 'reviews', label: 'Reviews', icon: Star, description: 'Product reviews & replies' },
      { id: 'settings', label: 'Settings', icon: Settings, description: 'Shop profile settings' },
    ],
  },
];

const ALL_TABS = SIDEBAR_SECTIONS.flatMap((s) => s.items);

/* ---------------- Demo data (fallback / supplement) ---------------- */

const DAY = 86400000;
const NOW = Date.now();

const DEMO_TOP_PRODUCTS = [
  {
    id: 'tp1',
    name: 'ESP32-WROOM-32 DevKit v1.2',
    slug: 'esp32-wroom-32-devkit',
    price: 95000,
    soldCount: 1842,
    stockAvailable: 240,
    rating: 4.8,
    imageUrl: 'https://api.dicebear.com/7.x/shapes/svg?seed=esp32&backgroundColor=06b6d4',
    trend: 12.4,
  },
  {
    id: 'tp2',
    name: '4-Layer PCB Stack — STM32 Reference Design',
    slug: '4layer-pcb-stm32',
    price: 2450000,
    soldCount: 312,
    stockAvailable: 18,
    rating: 4.9,
    imageUrl: 'https://api.dicebear.com/7.x/shapes/svg?seed=pcb&backgroundColor=2dd4bf',
    trend: 8.1,
  },
  {
    id: 'tp3',
    name: 'KiCad 9 — IoT Sensor Hub Project',
    slug: 'kicad-9-iot-sensor-hub',
    price: 1290000,
    soldCount: 487,
    stockAvailable: 0,
    rating: 4.7,
    imageUrl: 'https://api.dicebear.com/7.x/shapes/svg?seed=kicad9&backgroundColor=22d3ee',
    trend: 24.6,
  },
  {
    id: 'tp4',
    name: 'BME280 Sensor Module',
    slug: 'bme280-sensor-module',
    price: 68000,
    soldCount: 1205,
    stockAvailable: 320,
    rating: 4.6,
    imageUrl: 'https://api.dicebear.com/7.x/shapes/svg?seed=bme280&backgroundColor=0891b2',
    trend: -3.2,
  },
  {
    id: 'tp5',
    name: 'ESP32 Firmware Bundle (BLE + Wi-Fi)',
    slug: 'esp32-firmware-bundle',
    price: 600000,
    soldCount: 354,
    stockAvailable: 0,
    rating: 4.8,
    imageUrl: 'https://api.dicebear.com/7.x/shapes/svg?seed=fw&backgroundColor=14b8a6',
    trend: 5.7,
  },
];

const DEMO_LOW_STOCK = [
  { id: 'ls1', name: '4-Layer PCB Stack — STM32 Reference Design', slug: '4layer-pcb-stm32', stockAvailable: 18, price: 2450000 },
  { id: 'ls2', name: 'STM32F4 Discovery Kit', slug: 'stm32f4-discovery', stockAvailable: 8, price: 590000 },
  { id: 'ls3', name: 'OLED Display Module — 0.96"', slug: 'oled-096', stockAvailable: 12, price: 75000 },
  { id: 'ls4', name: '40-pin GPIO Ribbon Cable', slug: 'gpio-ribbon', stockAvailable: 5, price: 40000 },
];

const DEMO_RECENT_ORDERS = [
  {
    id: 'so1',
    code: 'CH-100010-1',
    status: 'PENDING',
    fulfillmentType: 'PHYSICAL',
    createdAt: new Date(NOW - 5 * 3600000).toISOString(),
    sellerRevenue: 513000,
    items: [
      { id: 'i1', name: 'Raspberry Pi Pico W', quantity: 2, lineTotal: 290000, imageUrl: 'https://api.dicebear.com/7.x/shapes/svg?seed=pico&backgroundColor=06b6d4' },
      { id: 'i2', name: 'Breadboard 830-point + Jumper Kit', quantity: 1, lineTotal: 250000, imageUrl: 'https://api.dicebear.com/7.x/shapes/svg?seed=bb&backgroundColor=22d3ee' },
    ],
    order: { code: 'CH-100010', grandTotal: 570000, shippingAddress: JSON.stringify({ fullName: 'Nguyen Van A', phone: '0901234567', line1: '12 Nguyen Hue', city: 'Ho Chi Minh', district: 'District 1' }) },
  },
  {
    id: 'so2',
    code: 'CH-100008-1',
    status: 'CONFIRMED',
    fulfillmentType: 'DIGITAL',
    createdAt: new Date(NOW - 2 * 3600000).toISOString(),
    sellerRevenue: 1795500,
    items: [
      { id: 'i3', name: 'KiCad 9 — IoT Sensor Hub Project', quantity: 1, lineTotal: 1290000, imageUrl: 'https://api.dicebear.com/7.x/shapes/svg?seed=kicad9&backgroundColor=06b6d4' },
      { id: 'i4', name: 'ESP32 Firmware Bundle (BLE + Wi-Fi)', quantity: 1, lineTotal: 600000, imageUrl: 'https://api.dicebear.com/7.x/shapes/svg?seed=fw&backgroundColor=22d3ee' },
    ],
    order: { code: 'CH-100008', grandTotal: 1890000, shippingAddress: null },
  },
  {
    id: 'so3',
    code: 'CH-100007-1',
    status: 'DELIVERED',
    fulfillmentType: 'PHYSICAL',
    createdAt: new Date(NOW - 1 * DAY).toISOString(),
    sellerRevenue: 1254000,
    items: [
      { id: 'i5', name: 'STM32F4 Discovery Kit', quantity: 1, lineTotal: 590000, imageUrl: 'https://api.dicebear.com/7.x/shapes/svg?seed=stm32&backgroundColor=06b6d4' },
      { id: 'i6', name: '0.96" OLED Display Module', quantity: 4, lineTotal: 300000, imageUrl: 'https://api.dicebear.com/7.x/shapes/svg?seed=oled&backgroundColor=22d3ee' },
    ],
    order: { code: 'CH-100007', grandTotal: 1320000, shippingAddress: JSON.stringify({ fullName: 'Tran B', phone: '0987654321', line1: '34 Le Loi', city: 'Hanoi', district: 'Hoan Kiem' }) },
  },
  {
    id: 'so4',
    code: 'CH-100006-1',
    status: 'SHIPPING',
    fulfillmentType: 'PHYSICAL',
    createdAt: new Date(NOW - 3 * DAY).toISOString(),
    sellerRevenue: 2327500,
    items: [
      { id: 'i7', name: '4-Layer PCB Stack — STM32 Reference Design', quantity: 1, lineTotal: 2450000, imageUrl: 'https://api.dicebear.com/7.x/shapes/svg?seed=pcb&backgroundColor=2dd4bf' },
    ],
    order: { code: 'CH-100006', grandTotal: 2510000, shippingAddress: JSON.stringify({ fullName: 'Le C', phone: '0912345678', line1: '56 Hai Ba Trung', city: 'Da Nang' }) },
  },
  {
    id: 'so5',
    code: 'CH-100005-1',
    status: 'COMPLETED',
    fulfillmentType: 'PHYSICAL',
    createdAt: new Date(NOW - 7 * DAY).toISOString(),
    sellerRevenue: 374300,
    items: [
      { id: 'i8', name: 'ESP32-WROOM-32 DevKit v1.2', quantity: 2, lineTotal: 190000, imageUrl: 'https://api.dicebear.com/7.x/shapes/svg?seed=esp32&backgroundColor=06b6d4' },
      { id: 'i9', name: 'BME280 Sensor Module', quantity: 3, lineTotal: 204000, imageUrl: 'https://api.dicebear.com/7.x/shapes/svg?seed=bme280&backgroundColor=22d3ee' },
    ],
    order: { code: 'CH-100005', grandTotal: 424000, shippingAddress: JSON.stringify({ fullName: 'Pham D', phone: '0909876543', line1: '78 Tran Phu', city: 'Ho Chi Minh', district: 'District 5' }) },
  },
];

const DEMO_RECENT_REVIEWS = [
  {
    id: 'rv1',
    productId: 'p1',
    productName: 'ESP32-WROOM-32 DevKit v1.2',
    rating: 5,
    comment: 'Excellent build quality, works perfectly out of the box. Documentation is thorough.',
    createdAt: new Date(NOW - 1 * DAY).toISOString(),
    verifiedPurchase: true,
    user: { name: 'Nguyen Van A', avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=buyera' },
    sellerReply: null,
  },
  {
    id: 'rv2',
    productId: 'p2',
    productName: '4-Layer PCB Stack — STM32 Reference Design',
    rating: 4,
    comment: 'Great reference design, but I wish the BOM included part substitutes for out-of-stock items.',
    createdAt: new Date(NOW - 3 * DAY).toISOString(),
    verifiedPurchase: true,
    user: { name: 'Tran B', avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=buyerb' },
    sellerReply: null,
  },
  {
    id: 'rv3',
    productId: 'p3',
    productName: 'KiCad 9 — IoT Sensor Hub Project',
    rating: 5,
    comment: 'Saved me a week of design work. Clean schematic, well-organized layers. Highly recommended!',
    createdAt: new Date(NOW - 6 * DAY).toISOString(),
    verifiedPurchase: true,
    user: { name: 'Le C', avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=buyerc' },
    sellerReply: 'Thank you for the kind words! Let us know if you need any customizations.',
  },
  {
    id: 'rv4',
    productId: 'p4',
    productName: 'ESP32 Firmware Bundle (BLE + Wi-Fi)',
    rating: 4,
    comment: 'Solid firmware, but OTA updates would be a great addition.',
    createdAt: new Date(NOW - 9 * DAY).toISOString(),
    verifiedPurchase: true,
    user: { name: 'Pham D', avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=buyerd' },
    sellerReply: null,
  },
  {
    id: 'rv5',
    productId: 'p5',
    productName: 'BME280 Sensor Module',
    rating: 5,
    comment: 'Calibration was spot on. Used it in a weather station project and the readings match my reference sensor.',
    createdAt: new Date(NOW - 12 * DAY).toISOString(),
    verifiedPurchase: true,
    user: { name: 'Hoang E', avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=buyere' },
    sellerReply: 'Thanks! Happy building.',
  },
];

const DEMO_SHIPMENTS = [
  {
    id: 'sh1',
    sellerOrderCode: 'CH-100006-1',
    orderCode: 'CH-100006',
    trackingNumber: 'GHTK9876543210',
    provider: 'GHTK',
    status: 'IN_TRANSIT',
    estimatedDays: 2,
    createdAt: new Date(NOW - 3 * DAY).toISOString(),
    recipient: 'Le C — Da Nang',
  },
  {
    id: 'sh2',
    sellerOrderCode: 'CH-100007-1',
    orderCode: 'CH-100007',
    trackingNumber: 'VTP5551212345',
    provider: 'VIETTEL_POST',
    status: 'DELIVERED',
    estimatedDays: 2,
    createdAt: new Date(NOW - 4 * DAY).toISOString(),
    recipient: 'Tran B — Hanoi',
  },
  {
    id: 'sh3',
    sellerOrderCode: 'CH-100005-1',
    orderCode: 'CH-100005',
    trackingNumber: 'GHN1234567890',
    provider: 'GHN',
    status: 'DELIVERED',
    estimatedDays: 3,
    createdAt: new Date(NOW - 7 * DAY).toISOString(),
    recipient: 'Pham D — Ho Chi Minh',
  },
  {
    id: 'sh4',
    sellerOrderCode: 'CH-100010-1',
    orderCode: 'CH-100010',
    trackingNumber: 'JNT4455667788',
    provider: 'JNT',
    status: 'PENDING',
    estimatedDays: 3,
    createdAt: new Date(NOW - 5 * 3600000).toISOString(),
    recipient: 'Nguyen Van A — Ho Chi Minh',
  },
];

const DEMO_WITHDRAWALS = [
  {
    id: 'wd1',
    amount: 5000000,
    status: 'PENDING',
    bankInfo: JSON.stringify({ bankName: 'Vietcombank', accountNumber: '0123456789', accountHolder: 'BOARDFORGE STUDIO' }),
    createdAt: new Date(NOW - 2 * DAY).toISOString(),
  },
  {
    id: 'wd2',
    amount: 12000000,
    status: 'COMPLETED',
    bankInfo: JSON.stringify({ bankName: 'Techcombank', accountNumber: '9876543210', accountHolder: 'BOARDFORGE STUDIO' }),
    processedAt: new Date(NOW - 10 * DAY).toISOString(),
    createdAt: new Date(NOW - 12 * DAY).toISOString(),
  },
  {
    id: 'wd3',
    amount: 8000000,
    status: 'COMPLETED',
    bankInfo: JSON.stringify({ bankName: 'MB Bank', accountNumber: '55551234', accountHolder: 'BOARDFORGE STUDIO' }),
    processedAt: new Date(NOW - 25 * DAY).toISOString(),
    createdAt: new Date(NOW - 28 * DAY).toISOString(),
  },
];

const DEMO_WALLET_TXS = [
  { id: 'tx1', type: 'SALE', amount: 513000, balanceType: 'PENDING', note: 'Order CH-100010-1', createdAt: new Date(NOW - 5 * 3600000).toISOString() },
  { id: 'tx2', type: 'SALE', amount: 1795500, balanceType: 'PENDING', note: 'Order CH-100008-1', createdAt: new Date(NOW - 2 * 3600000).toISOString() },
  { id: 'tx3', type: 'WITHDRAWAL', amount: -5000000, balanceType: 'AVAILABLE', note: 'Withdrawal request WD-001', createdAt: new Date(NOW - 2 * DAY).toISOString() },
  { id: 'tx4', type: 'SALE', amount: 1254000, balanceType: 'AVAILABLE', note: 'Settlement — Order CH-100007-1', createdAt: new Date(NOW - 7 * DAY).toISOString() },
  { id: 'tx5', type: 'COMMISSION', amount: -62700, balanceType: 'AVAILABLE', note: 'Commission — Order CH-100007-1', createdAt: new Date(NOW - 7 * DAY).toISOString() },
  { id: 'tx6', type: 'SALE', amount: 374300, balanceType: 'AVAILABLE', note: 'Settlement — Order CH-100005-1', createdAt: new Date(NOW - 14 * DAY).toISOString() },
];

const DEMO_WALLET = {
  id: 'wallet-1',
  sellerId: SELLER_ID,
  pendingBalance: 2308500,
  availableBalance: 18742600,
  frozenBalance: 5000000,
  totalEarned: 48250000,
  totalWithdrawn: 20000000,
};

const DEMO_VERSIONS: Record<string, Array<{ version: string; date: string; size: number; downloads: number; changelog: string }>> = {
  default: [
    { version: 'v9.0.2', date: new Date(NOW - 7 * DAY).toISOString(), size: 48230000, downloads: 142, changelog: 'Fixed IoT Hub GPIO mapping; updated BOM for new ESP32-WROOM-32 batches.' },
    { version: 'v9.0.1', date: new Date(NOW - 21 * DAY).toISOString(), size: 48100000, downloads: 89, changelog: 'Initial public release. Includes full schematic, layout, BOM and gerbers.' },
  ],
};

const DEMO_TRAFFIC_SOURCES = [
  { source: 'Direct', visits: 4820, pct: 38 },
  { source: 'Search', visits: 3210, pct: 25 },
  { source: 'CircuitHub Browse', visits: 2450, pct: 19 },
  { source: 'Social', visits: 1180, pct: 9 },
  { source: 'Referral', visits: 980, pct: 8 },
];

/* ---------------- Inline hook: useWithdrawals ---------------- */

function useWithdrawals(sellerId: string | null) {
  return useQuery<any>({
    queryKey: ['withdrawals', sellerId],
    queryFn: async () => {
      const res = await fetch(`/api/v1/withdrawals?sellerId=${sellerId}`);
      const json = await res.json();
      if (!json.success) throw new Error(json.message);
      return json.data.items;
    },
    enabled: !!sellerId,
  });
}

/* ---------------- Helper components ---------------- */

function StatusPill({
  status,
  config,
}: {
  status: string;
  config: Record<string, { label: string; cls: string; dot: string }>;
}) {
  const cfg = config[status] ?? { label: status, cls: 'bg-slate-50 text-slate-700 border-slate-200', dot: 'bg-slate-400' };
  return (
    <Badge variant="outline" className={cn('gap-1.5 font-medium', cfg.cls)}>
      <span className={cn('h-1.5 w-1.5 rounded-full', cfg.dot)} />
      {cfg.label}
    </Badge>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  trend,
  accent = 'cyan',
  hint,
}: {
  label: string;
  value: string;
  icon: typeof Package;
  trend?: number;
  accent?: 'cyan' | 'teal' | 'aqua' | 'amber' | 'rose';
  hint?: string;
}) {
  const accentMap: Record<string, string> = {
    cyan: 'from-cyan-500 to-cyan-400 shadow-[0_10px_20px_-10px_rgba(6,182,212,0.55)]',
    teal: 'from-teal-500 to-teal-400 shadow-[0_10px_20px_-10px_rgba(45,212,191,0.55)]',
    aqua: 'from-cyan-400 to-teal-300 shadow-[0_10px_20px_-10px_rgba(34,211,238,0.55)]',
    amber: 'from-amber-500 to-amber-400 shadow-[0_10px_20px_-10px_rgba(245,158,11,0.55)]',
    rose: 'from-rose-500 to-rose-400 shadow-[0_10px_20px_-10px_rgba(244,63,94,0.55)]',
  };
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="relative overflow-hidden rounded-2xl border border-cyan-100/70 bg-white/80 backdrop-blur-md p-5 hover:shadow-md transition-shadow"
    >
      <div
        aria-hidden
        className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-gradient-to-br from-cyan-100/40 to-teal-100/30 blur-2xl"
      />
      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</p>
          <p className="mt-1 text-2xl sm:text-3xl font-bold text-foreground tracking-tight truncate">{value}</p>
          {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
          {trend !== undefined && (
            <div className="mt-2 inline-flex items-center gap-1 text-xs font-semibold">
              {trend >= 0 ? (
                <span className="inline-flex items-center gap-0.5 text-emerald-600">
                  <ArrowUpRight className="h-3.5 w-3.5" />
                  +{trend.toFixed(1)}%
                </span>
              ) : (
                <span className="inline-flex items-center gap-0.5 text-rose-600">
                  <ArrowDownRight className="h-3.5 w-3.5" />
                  {trend.toFixed(1)}%
                </span>
              )}
              <span className="text-muted-foreground font-normal">vs last month</span>
            </div>
          )}
        </div>
        <div className={cn('flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-white', accentMap[accent])}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </motion.div>
  );
}

function EmptyState({
  icon: Icon,
  title,
  description,
  cta,
  onCta,
}: {
  icon: typeof Package;
  title: string;
  description: string;
  cta?: string;
  onCta?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-50 text-cyan-600">
        <Icon className="h-6 w-6" />
      </div>
      <div className="space-y-1">
        <p className="text-base font-semibold text-foreground">{title}</p>
        <p className="text-sm text-muted-foreground max-w-md">{description}</p>
      </div>
      {cta && onCta && (
        <Button size="sm" variant="outline" className="mt-2 border-cyan-200 text-cyan-700 hover:bg-cyan-50" onClick={onCta}>
          {cta}
        </Button>
      )}
    </div>
  );
}

function ChartTooltip({ active, payload, label, valueFormatter }: any) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="rounded-lg border border-cyan-100 bg-white/95 backdrop-blur-md shadow-lg px-3 py-2 text-xs">
      <p className="font-semibold text-foreground mb-1">{label}</p>
      {payload.map((entry: any, i: number) => (
        <div key={i} className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.color }} />
          <span className="text-muted-foreground">{entry.name}:</span>
          <span className="font-semibold text-foreground">
            {valueFormatter ? valueFormatter(entry.value) : entry.value}
          </span>
        </div>
      ))}
    </div>
  );
}

function SectionHeader({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: typeof Package;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
      <div className="flex items-center gap-2.5">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-teal-400 text-white shadow-[0_8px_18px_-8px_rgba(6,182,212,0.5)]">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-foreground">{title}</h2>
          {description && <p className="text-sm text-muted-foreground">{description}</p>}
        </div>
      </div>
      {action}
    </div>
  );
}

/* ============================================================
   Tab 1: Overview
   ============================================================ */

function OverviewTab({
  data,
  goShop,
  goProducts,
}: {
  data: any;
  goShop: (slug: string) => void;
  goProducts: () => void;
}) {
  const metrics = data?.metrics ?? {};
  const wallet = data?.wallet ?? DEMO_WALLET;
  const topProducts = (data?.topProducts?.length ? data.topProducts : DEMO_TOP_PRODUCTS) as any[];
  const lowStock = (data?.lowStock?.length ? data.lowStock : DEMO_LOW_STOCK) as any[];
  const recentOrders = (data?.recentOrders?.length ? data.recentOrders : DEMO_RECENT_ORDERS) as any[];
  const reviews = (data?.reviews?.length ? data.reviews : DEMO_RECENT_REVIEWS) as any[];
  const chart = (data?.chart ?? []) as any[];

  const totalRevenue = metrics.totalRevenue ?? wallet.totalEarned ?? 0;
  const totalOrders = metrics.totalOrders ?? recentOrders.length;
  const pendingOrders = metrics.pendingOrders ?? recentOrders.filter((o: any) => o.status === 'PENDING' || o.status === 'CONFIRMED' || o.status === 'PACKING').length;
  const lowStockCount = metrics.lowStockCount ?? lowStock.length;

  const stats = [
    { label: 'Total Revenue', value: formatVNDCompact(totalRevenue), icon: DollarSign, trend: 12.4, accent: 'cyan' as const },
    { label: 'Available Balance', value: formatVNDCompact(wallet.availableBalance), icon: Wallet, trend: 8.1, accent: 'teal' as const },
    { label: 'Pending Balance', value: formatVNDCompact(wallet.pendingBalance), icon: Clock, trend: 5.7, accent: 'amber' as const, hint: 'Settlement after 7 days' },
    { label: 'Total Orders', value: String(totalOrders), icon: ShoppingCart, trend: 15.2, accent: 'aqua' as const },
    { label: 'Pending Orders', value: String(pendingOrders), icon: AlertTriangle, trend: -3.2, accent: 'rose' as const },
    { label: 'Low Stock Items', value: String(lowStockCount), icon: Package, trend: -1.8, accent: 'amber' as const },
  ];

  return (
    <div className="space-y-6">
      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {stats.map((s) => (
          <StatCard key={s.label} {...s} />
        ))}
      </div>

      {/* Revenue chart */}
      <Card className="border-cyan-100/70">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-cyan-600" />
            Revenue (last 12 months)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {chart.length === 0 ? (
            <EmptyState icon={TrendingUp} title="No revenue data yet" description="Revenue chart will populate as orders are completed." />
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={chart} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="revArea" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} tickFormatter={(v) => formatVNDCompact(v)} width={56} />
                <Tooltip content={<ChartTooltip valueFormatter={(v: number) => formatVND(v)} />} />
                <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#06b6d4" strokeWidth={2.5} fill="url(#revArea)" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-2 gap-4">
        {/* Top products */}
        <Card className="border-cyan-100/70">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-cyan-600" />
              Top Products
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {topProducts.slice(0, 5).map((p: any, i: number) => (
              <div key={p.id} className="flex items-center gap-3">
                <div className="flex h-7 w-7 items-center justify-center rounded-md bg-cyan-50 text-cyan-700 text-xs font-bold">
                  {i + 1}
                </div>
                <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-slate-100">
                  {p.imageUrl ? (
                    <Image src={p.imageUrl} alt={p.name} fill className="object-cover" unoptimized />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <ImageIcon className="h-4 w-4 text-slate-400" />
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground truncate">{p.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {p.soldCount ?? 0} sold · {formatVND(p.price ?? 0)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-cyan-700">{formatVNDCompact((p.soldCount ?? 0) * (p.price ?? 0))}</p>
                  <p className="text-[10px] text-muted-foreground">revenue</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Low stock */}
        <Card className="border-amber-100/70">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              Low Stock Alerts
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2.5">
            {lowStock.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">All products well stocked.</p>
            ) : (
              lowStock.map((p: any) => (
                <div key={p.id} className="flex items-center justify-between gap-2 rounded-lg border border-amber-100 bg-amber-50/50 p-2.5">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{p.name}</p>
                    <p className="text-xs text-amber-700">Only {p.stockAvailable} left in stock</p>
                  </div>
                  <Badge variant="outline" className="bg-amber-100 text-amber-700 border-amber-200">
                    {formatVND(p.price)}
                  </Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        {/* Recent orders */}
        <Card className="border-cyan-100/70">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <ShoppingCart className="h-4 w-4 text-cyan-600" />
              Recent Orders
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {recentOrders.slice(0, 5).map((o: any) => (
              <div key={o.id} className="flex items-center gap-3 rounded-lg border border-border/60 p-2.5">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-foreground">{o.code}</p>
                  <p className="text-xs text-muted-foreground">
                    {o.items?.length ?? 0} item(s) · {timeAgo(o.createdAt)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-cyan-700">{formatVNDCompact(o.sellerRevenue ?? 0)}</p>
                </div>
                <StatusPill status={o.status} config={ORDER_STATUS_CONFIG} />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Recent reviews */}
        <Card className="border-cyan-100/70">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Star className="h-4 w-4 text-amber-500" />
              Recent Reviews
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2.5">
            {reviews.slice(0, 5).map((r: any) => (
              <div key={r.id} className="rounded-lg border border-border/60 p-2.5">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium text-foreground truncate">
                    {r.product?.name ?? r.productName ?? 'Product'}
                  </p>
                  <Rating value={r.rating} showCount={false} size="xs" />
                </div>
                <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{r.comment}</p>
                <p className="mt-1 text-[10px] text-muted-foreground">
                  {r.user?.name ?? 'Anonymous'} · {timeAgo(r.createdAt)}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end">
        <Button variant="outline" size="sm" onClick={goProducts} className="border-cyan-200 text-cyan-700 hover:bg-cyan-50">
          Manage products
          <ChevronRight className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}

/* ============================================================
   Tab 2: Products
   ============================================================ */

function ProductsTab({ products, toast, goProduct, sellerId, shopId, categories }: { products: any[]; toast: any; goProduct: (slug: string) => void; sellerId: string; shopId: string; categories: { id: string; name: string; slug: string }[] }) {
  const [type, setType] = useState<'ALL' | 'PHYSICAL' | 'DIGITAL' | 'SERVICE'>('ALL');
  const [query, setQuery] = useState('');
  const [showAddProduct, setShowAddProduct] = useState(false);

  const filtered = useMemo(() => {
    return products.filter((p) => {
      if (type !== 'ALL' && p.productType !== type) return false;
      if (query && !p.name.toLowerCase().includes(query.toLowerCase())) return false;
      return true;
    });
  }, [products, type, query]);

  const typeFilters: { id: 'ALL' | 'PHYSICAL' | 'DIGITAL' | 'SERVICE'; label: string }[] = [
    { id: 'ALL', label: 'All' },
    { id: 'PHYSICAL', label: 'Physical' },
    { id: 'DIGITAL', label: 'Digital' },
    { id: 'SERVICE', label: 'Service' },
  ];

  return (
    <div className="space-y-4">
      <SectionHeader
        icon={Package}
        title="Products"
        description={`${products.length} products in your catalog`}
        action={
          <Button
            size="sm"
            className="bg-cyan-500 hover:bg-cyan-600 text-white"
            onClick={() => setShowAddProduct(true)}
          >
            <Plus className="h-3.5 w-3.5" />
            Add Product
          </Button>
        }
      />

      <AddProductDialog
        open={showAddProduct}
        onOpenChange={setShowAddProduct}
        sellerId={sellerId}
        shopId={shopId}
        categories={categories}
      />

      <Card className="border-cyan-100/70">
        <CardContent className="pt-4 space-y-4">
          {/* Filter row */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px] max-w-md">
              <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search products..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-8"
              />
            </div>
            <div className="flex items-center gap-1 rounded-lg border border-border/60 bg-white p-1">
              {typeFilters.map((f) => (
                <button
                  key={f.id}
                  onClick={() => setType(f.id)}
                  className={cn(
                    'rounded-md px-2.5 py-1 text-xs font-medium transition-colors',
                    type === f.id ? 'bg-cyan-500 text-white' : 'text-muted-foreground hover:bg-cyan-50 hover:text-cyan-700',
                  )}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Table */}
          {filtered.length === 0 ? (
            <EmptyState icon={Package} title="No products found" description="Try a different search or filter, or add a new product." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/60 text-left text-xs text-muted-foreground">
                    <th className="py-2 pr-3 font-medium">Product</th>
                    <th className="py-2 px-3 font-medium">Type</th>
                    <th className="py-2 px-3 font-medium text-right">Price</th>
                    <th className="py-2 px-3 font-medium text-right">Stock</th>
                    <th className="py-2 px-3 font-medium text-right">Sold</th>
                    <th className="py-2 px-3 font-medium">Status</th>
                    <th className="py-2 pl-3 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((p) => (
                    <tr key={p.id} className="border-b border-border/40 hover:bg-cyan-50/30 transition-colors">
                      <td className="py-2.5 pr-3">
                        <button onClick={() => goProduct(p.slug)} className="flex items-center gap-2.5 text-left">
                          <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-md bg-slate-100">
                            {p.images?.[0]?.url ? (
                              <Image src={p.images[0].url} alt={p.name} fill className="object-cover" unoptimized />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center">
                                <ImageIcon className="h-4 w-4 text-slate-400" />
                              </div>
                            )}
                          </div>
                          <div className="min-w-0 max-w-[260px]">
                            <p className="font-medium text-foreground truncate">{p.name}</p>
                            {p.category?.name && (
                              <p className="text-xs text-muted-foreground truncate">{p.category.name}</p>
                            )}
                          </div>
                        </button>
                      </td>
                      <td className="py-2.5 px-3">
                        <ProductTypeBadge type={p.productType} />
                      </td>
                      <td className="py-2.5 px-3 text-right font-medium">
                        {formatVND(p.price)}
                        {p.compareAtPrice && p.compareAtPrice > p.price && (
                          <span className="block text-[10px] text-muted-foreground line-through">{formatVND(p.compareAtPrice)}</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        {p.unlimited ? <span className="text-xs text-teal-600">∞</span> : <span className="font-medium">{p.stockAvailable}</span>}
                      </td>
                      <td className="py-2.5 px-3 text-right text-muted-foreground">{p.soldCount ?? 0}</td>
                      <td className="py-2.5 px-3">
                        {p.status === 'ACTIVE' ? (
                          <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">Active</Badge>
                        ) : p.status === 'DRAFT' ? (
                          <Badge variant="outline" className="bg-slate-50 text-slate-700 border-slate-200">Draft</Badge>
                        ) : p.status === 'PENDING_REVIEW' ? (
                          <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">In review</Badge>
                        ) : (
                          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">{p.status}</Badge>
                        )}
                      </td>
                      <td className="py-2.5 pl-3">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 text-cyan-600 hover:bg-cyan-50"
                            onClick={() => goProduct(p.slug)}
                            title="View"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 text-slate-600 hover:bg-slate-100"
                            onClick={() => toast({ title: 'Edit product', description: p.name })}
                            title="Edit"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 text-rose-600 hover:bg-rose-50"
                            onClick={() => toast({ title: 'Delete product?', description: 'This action cannot be undone.' })}
                            title="Delete"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

/* ============================================================
   Tab 3: Digital Assets
   ============================================================ */

function DigitalAssetsTab({ products, toast }: { products: any[]; toast: any }) {
  const [expanded, setExpanded] = useState<string | null>(null);

  const digitals = useMemo(() => products.filter((p) => p.productType === 'DIGITAL'), [products]);

  return (
    <div className="space-y-4">
      <SectionHeader
        icon={FileCode}
        title="Digital Assets"
        description={`${digitals.length} digital products`}
        action={
          <Button
            size="sm"
            className="bg-cyan-500 hover:bg-cyan-600 text-white"
            onClick={() => toast({ title: 'Upload new version', description: 'Version upload dialog will open here.' })}
          >
            <Plus className="h-3.5 w-3.5" />
            Upload New Version
          </Button>
        }
      />

      <Card className="border-cyan-100/70">
        <CardContent className="pt-4">
          {digitals.length === 0 ? (
            <EmptyState icon={FileCode} title="No digital assets yet" description="Digital products (KiCad projects, firmware bundles, design files) will appear here." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/60 text-left text-xs text-muted-foreground">
                    <th className="py-2 pr-3 font-medium">Asset</th>
                    <th className="py-2 px-3 font-medium">Software</th>
                    <th className="py-2 px-3 font-medium">Version</th>
                    <th className="py-2 px-3 font-medium text-right">File size</th>
                    <th className="py-2 px-3 font-medium text-right">Downloads</th>
                    <th className="py-2 px-3 font-medium">Status</th>
                    <th className="py-2 pl-3 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {digitals.map((p) => {
                    const isOpen = expanded === p.id;
                    const versions = DEMO_VERSIONS.default;
                    return (
                      <Fragment key={p.id}>
                        <tr className="border-b border-border/40 hover:bg-cyan-50/30 transition-colors">
                          <td className="py-2.5 pr-3">
                            <div className="flex items-center gap-2.5">
                              <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-md bg-slate-100">
                                {p.images?.[0]?.url ? (
                                  <Image src={p.images[0].url} alt={p.name} fill className="object-cover" unoptimized />
                                ) : (
                                  <div className="flex h-full w-full items-center justify-center">
                                    <FileCode className="h-4 w-4 text-slate-400" />
                                  </div>
                                )}
                              </div>
                              <div className="min-w-0 max-w-[240px]">
                                <p className="font-medium text-foreground truncate">{p.name}</p>
                                {p.licenseType && (
                                  <p className="text-xs text-muted-foreground">{p.licenseType} license</p>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="py-2.5 px-3">
                            <TechBadge label={p.software ?? 'Generic'} />
                          </td>
                          <td className="py-2.5 px-3">
                            <Badge variant="outline" className="font-mono bg-cyan-50 text-cyan-700 border-cyan-200">
                              {p.currentVersion ?? p.softwareVersion ?? 'v1.0.0'}
                            </Badge>
                          </td>
                          <td className="py-2.5 px-3 text-right text-muted-foreground">
                            {p.fileSizeBytes ? formatFileSize(p.fileSizeBytes) : '—'}
                          </td>
                          <td className="py-2.5 px-3 text-right text-muted-foreground">
                            <span className="inline-flex items-center gap-1">
                              <Download className="h-3 w-3" />
                              {p.downloadCount ?? 0}
                            </span>
                          </td>
                          <td className="py-2.5 px-3">
                            {p.status === 'ACTIVE' ? (
                              <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">Active</Badge>
                            ) : (
                              <Badge variant="outline" className="bg-slate-50 text-slate-700 border-slate-200">{p.status}</Badge>
                            )}
                          </td>
                          <td className="py-2.5 pl-3">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 px-2 text-cyan-600 hover:bg-cyan-50"
                                onClick={() => toast({ title: 'Upload new version', description: p.name })}
                              >
                                Upload new version
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-7 w-7 text-slate-600 hover:bg-slate-100"
                                onClick={() => setExpanded(isOpen ? null : p.id)}
                                title="Version history"
                              >
                                <ChevronDown className={cn('h-3.5 w-3.5 transition-transform', isOpen && 'rotate-180')} />
                              </Button>
                            </div>
                          </td>
                        </tr>
                        {isOpen && (
                          <tr key={`${p.id}-v`} className="bg-slate-50/40">
                            <td colSpan={7} className="px-4 pb-3 pt-1">
                              <div className="rounded-lg border border-border/60 bg-white p-3">
                                <p className="text-xs font-semibold text-foreground mb-2 flex items-center gap-1.5">
                                  <FileText className="h-3.5 w-3.5 text-cyan-600" />
                                  Version History
                                </p>
                                <div className="space-y-2">
                                  {versions.map((v) => (
                                    <div key={v.version} className="flex items-start gap-3 rounded-md border border-border/50 p-2">
                                      <Badge variant="outline" className="font-mono bg-cyan-50 text-cyan-700 border-cyan-200 shrink-0">
                                        {v.version}
                                      </Badge>
                                      <div className="min-w-0 flex-1">
                                        <p className="text-xs text-muted-foreground">
                                          {formatDate(v.date)} · {formatFileSize(v.size)} · {v.downloads} downloads
                                        </p>
                                        <p className="text-xs text-foreground mt-0.5">{v.changelog}</p>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

/* ============================================================
   Tab 4: PCB Projects
   ============================================================ */

function PCBProjectsTab({ products, toast }: { products: any[]; toast: any }) {
  // PCB products are physical with pcbLayers set
  const pcbs = useMemo(
    () => products.filter((p) => p.productType === 'PHYSICAL' && (p.pcbLayers || p.pcbColor || p.pcbDimensions)),
    [products],
  );

  return (
    <div className="space-y-4">
      <SectionHeader
        icon={Layers}
        title="PCB Projects"
        description={`${pcbs.length} PCB designs in production`}
        action={
          <Button
            size="sm"
            variant="outline"
            className="border-cyan-200 text-cyan-700 hover:bg-cyan-50"
            onClick={() => toast({ title: 'Manage revisions', description: 'PCB revision manager will open here.' })}
          >
            <Cog className="h-3.5 w-3.5" />
            Manage revisions
          </Button>
        }
      />

      <Card className="border-cyan-100/70">
        <CardContent className="pt-4">
          {pcbs.length === 0 ? (
            <EmptyState icon={Layers} title="No PCB projects yet" description="Physical PCB products with layer/color/dimension specs will appear here." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/60 text-left text-xs text-muted-foreground">
                    <th className="py-2 pr-3 font-medium">Project</th>
                    <th className="py-2 px-3 font-medium text-center">Layers</th>
                    <th className="py-2 px-3 font-medium">Dimensions</th>
                    <th className="py-2 px-3 font-medium">Color</th>
                    <th className="py-2 px-3 font-medium text-right">MOQ</th>
                    <th className="py-2 px-3 font-medium text-right">Lead time</th>
                    <th className="py-2 px-3 font-medium text-right">Stock</th>
                    <th className="py-2 px-3 font-medium">Status</th>
                    <th className="py-2 pl-3 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pcbs.map((p) => (
                    <tr key={p.id} className="border-b border-border/40 hover:bg-cyan-50/30 transition-colors">
                      <td className="py-2.5 pr-3">
                        <div className="flex items-center gap-2.5">
                          <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-md bg-slate-100">
                            {p.images?.[0]?.url ? (
                              <Image src={p.images[0].url} alt={p.name} fill className="object-cover" unoptimized />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center">
                                <Layers className="h-4 w-4 text-slate-400" />
                              </div>
                            )}
                          </div>
                          <div className="min-w-0 max-w-[200px]">
                            <p className="font-medium text-foreground truncate">{p.name}</p>
                            {p.pcbRevision && (
                              <p className="text-xs text-muted-foreground font-mono">rev {p.pcbRevision}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <Badge variant="outline" className="bg-cyan-50 text-cyan-700 border-cyan-200 font-mono">
                          {p.pcbLayers ?? '—'}L
                        </Badge>
                      </td>
                      <td className="py-2.5 px-3 text-muted-foreground font-mono text-xs">{p.pcbDimensions ?? '—'}</td>
                      <td className="py-2.5 px-3">
                        {p.pcbColor ? (
                          <span className="inline-flex items-center gap-1.5">
                            <span className="h-3 w-3 rounded-full border border-slate-300" style={{ backgroundColor: p.pcbColor.toLowerCase().includes('green') ? '#0f7b3a' : p.pcbColor.toLowerCase().includes('blue') ? '#1e40af' : p.pcbColor.toLowerCase().includes('black') ? '#0f172a' : p.pcbColor.toLowerCase().includes('red') ? '#dc2626' : '#15803d' }} />
                            <span className="text-xs">{p.pcbColor}</span>
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-right text-muted-foreground">{p.pcbMoq ?? 1}</td>
                      <td className="py-2.5 px-3 text-right text-muted-foreground">{p.pcbLeadTimeDays ? `${p.pcbLeadTimeDays}d` : '—'}</td>
                      <td className="py-2.5 px-3 text-right font-medium">{p.unlimited ? '∞' : p.stockAvailable}</td>
                      <td className="py-2.5 px-3">
                        {p.status === 'ACTIVE' ? (
                          <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">Active</Badge>
                        ) : (
                          <Badge variant="outline" className="bg-slate-50 text-slate-700 border-slate-200">{p.status}</Badge>
                        )}
                      </td>
                      <td className="py-2.5 pl-3">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 px-2 text-cyan-600 hover:bg-cyan-50"
                          onClick={() => toast({ title: 'Manage revisions', description: p.name })}
                        >
                          Revisions
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

/* ============================================================
   Tab 5: Orders
   ============================================================ */

const ORDER_TIMELINE_STEPS = [
  { id: 'placed', label: 'Placed' },
  { id: 'confirmed', label: 'Confirmed' },
  { id: 'packed', label: 'Packed' },
  { id: 'shipped', label: 'Shipped' },
  { id: 'delivered', label: 'Delivered' },
  { id: 'completed', label: 'Completed' },
] as const;

const ORDER_STATUS_TO_STEP: Record<string, number> = {
  PENDING: 1,
  PENDING_PAYMENT: 1,
  PAID: 1,
  CONFIRMED: 2,
  PACKING: 3,
  READY_TO_SHIP: 3,
  SHIPPING: 4,
  DELIVERED: 5,
  COMPLETED: 6,
  CANCELLED: 0,
};

function OrdersTab({ orders, toast }: { orders: any[]; toast: any }) {
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'CONFIRMED' | 'SHIPPING' | 'COMPLETED' | 'CANCELLED'>('ALL');
  const [expanded, setExpanded] = useState<string | null>(null);

  const filtered = useMemo(() => {
    if (filter === 'ALL') return orders;
    return orders.filter((o) => o.status === filter);
  }, [orders, filter]);

  const filters: { id: typeof filter; label: string }[] = [
    { id: 'ALL', label: 'All' },
    { id: 'PENDING', label: 'Pending' },
    { id: 'CONFIRMED', label: 'Confirmed' },
    { id: 'SHIPPING', label: 'Shipping' },
    { id: 'COMPLETED', label: 'Completed' },
    { id: 'CANCELLED', label: 'Cancelled' },
  ];

  function parseAddress(o: any) {
    if (!o?.order?.shippingAddress) return null;
    try {
      return JSON.parse(o.order.shippingAddress);
    } catch {
      return null;
    }
  }

  return (
    <div className="space-y-4">
      <SectionHeader icon={ShoppingCart} title="Orders" description={`${orders.length} total orders`} />

      <div className="flex items-center gap-1 rounded-lg border border-border/60 bg-white p-1 w-fit">
        {filters.map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={cn(
              'rounded-md px-3 py-1 text-xs font-medium transition-colors',
              filter === f.id ? 'bg-cyan-500 text-white' : 'text-muted-foreground hover:bg-cyan-50 hover:text-cyan-700',
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <Card className="border-cyan-100/70">
          <CardContent>
            <EmptyState icon={ShoppingCart} title="No orders found" description="Orders matching the filter will appear here." />
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((o) => {
            const isOpen = expanded === o.id;
            const address = parseAddress(o);
            const stepIdx = ORDER_STATUS_TO_STEP[o.status] ?? 0;
            return (
              <Card key={o.id} className="border-cyan-100/70 overflow-hidden">
                <CardContent className="pt-4">
                  <button
                    onClick={() => setExpanded(isOpen ? null : o.id)}
                    className="w-full flex flex-wrap items-center gap-3 text-left"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-foreground">{o.code}</p>
                        <StatusPill status={o.status} config={ORDER_STATUS_CONFIG} />
                      </div>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {address?.fullName ?? 'Customer'} · {o.items?.length ?? 0} item(s) · {formatDate(o.createdAt)} · {formatVND(o.sellerRevenue ?? 0)} revenue
                      </p>
                    </div>
                    <ChevronDown className={cn('h-4 w-4 text-muted-foreground transition-transform', isOpen && 'rotate-180')} />
                  </button>

                  {isOpen && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      transition={{ duration: 0.2 }}
                      className="mt-3 pt-3 border-t border-border/40 space-y-3"
                    >
                      {/* Items */}
                      <div className="space-y-1.5">
                        {o.items?.map((it: any) => (
                          <div key={it.id} className="flex items-center gap-2.5">
                            <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded bg-slate-100">
                              {it.imageUrl ? (
                                <Image src={it.imageUrl} alt={it.name} fill className="object-cover" unoptimized />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center">
                                  <Package className="h-3.5 w-3.5 text-slate-400" />
                                </div>
                              )}
                            </div>
                            <p className="text-xs flex-1 min-w-0 truncate">
                              <span className="font-medium text-foreground">{it.name}</span>
                              <span className="text-muted-foreground"> × {it.quantity}</span>
                            </p>
                            <p className="text-xs font-medium text-cyan-700">{formatVND(it.lineTotal ?? it.unitPrice * it.quantity)}</p>
                          </div>
                        ))}
                      </div>

                      {/* Shipping address */}
                      {address && (
                        <div className="rounded-lg border border-border/60 bg-slate-50/50 p-2.5">
                          <p className="text-xs font-semibold text-foreground mb-1 flex items-center gap-1.5">
                            <Truck className="h-3.5 w-3.5 text-cyan-600" />
                            Shipping Address
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {address.fullName} · {address.phone}
                            <br />
                            {address.line1}{address.district ? `, ${address.district}` : ''}{address.city ? `, ${address.city}` : ''}
                          </p>
                        </div>
                      )}

                      {/* Tracking */}
                      {o.status === 'SHIPPING' && (
                        <div className="rounded-lg border border-cyan-100 bg-cyan-50/50 p-2.5">
                          <p className="text-xs font-semibold text-cyan-700 flex items-center gap-1.5">
                            <Truck className="h-3.5 w-3.5" />
                            Tracking
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">In transit · ETA 2 days</p>
                        </div>
                      )}

                      {/* Status timeline */}
                      <div>
                        <p className="text-xs font-semibold text-foreground mb-2">Status Timeline</p>
                        <div className="flex items-center justify-between">
                          {ORDER_TIMELINE_STEPS.map((step, i) => {
                            const done = i < stepIdx;
                            const current = i === stepIdx - 1;
                            return (
                              <div key={step.id} className="flex items-center gap-1 flex-1">
                                <div className="flex flex-col items-center gap-1 flex-1">
                                  <div
                                    className={cn(
                                      'h-2.5 w-2.5 rounded-full',
                                      done ? 'bg-cyan-500' : current ? 'bg-cyan-500 ring-4 ring-cyan-100' : 'bg-slate-200',
                                    )}
                                  />
                                  <span className={cn('text-[10px]', done || current ? 'text-cyan-700 font-medium' : 'text-muted-foreground')}>
                                    {step.label}
                                  </span>
                                </div>
                                {i < ORDER_TIMELINE_STEPS.length - 1 && (
                                  <div className={cn('h-0.5 flex-1 -mt-3.5', done ? 'bg-cyan-500' : 'bg-slate-200')} />
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-wrap items-center justify-end gap-2 pt-1">
                        {(o.status === 'PENDING' || o.status === 'PAID') && (
                          <Button
                            size="sm"
                            className="bg-cyan-500 hover:bg-cyan-600 text-white h-7"
                            onClick={() => toast({ title: 'Order confirmed', description: o.code })}
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Confirm
                          </Button>
                        )}
                        {(o.status === 'CONFIRMED') && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-cyan-200 text-cyan-700 hover:bg-cyan-50 h-7"
                            onClick={() => toast({ title: 'Order packed', description: o.code })}
                          >
                            <Package className="h-3.5 w-3.5" />
                            Mark as Packed
                          </Button>
                        )}
                        {(o.status === 'PACKING' || o.status === 'READY_TO_SHIP') && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-cyan-200 text-cyan-700 hover:bg-cyan-50 h-7"
                            onClick={() => toast({ title: 'Order shipped', description: o.code })}
                          >
                            <Truck className="h-3.5 w-3.5" />
                            Mark as Shipped
                          </Button>
                        )}
                      </div>
                    </motion.div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ============================================================
   Tab 6: Shipping
   ============================================================ */

function ShippingTab({ shipments, toast }: { shipments: any[]; toast: any }) {
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'IN_TRANSIT' | 'DELIVERED'>('ALL');

  const filtered = useMemo(() => {
    if (filter === 'ALL') return shipments;
    if (filter === 'IN_TRANSIT') return shipments.filter((s) => s.status === 'IN_TRANSIT' || s.status === 'OUT_FOR_DELIVERY' || s.status === 'PICKED_UP');
    return shipments.filter((s) => s.status === filter);
  }, [shipments, filter]);

  const filters: { id: typeof filter; label: string }[] = [
    { id: 'ALL', label: 'All' },
    { id: 'PENDING', label: 'Pending pickup' },
    { id: 'IN_TRANSIT', label: 'In transit' },
    { id: 'DELIVERED', label: 'Delivered' },
  ];

  return (
    <div className="space-y-4">
      <SectionHeader icon={Truck} title="Shipping" description={`${shipments.length} active shipments`} />

      <div className="flex items-center gap-1 rounded-lg border border-border/60 bg-white p-1 w-fit">
        {filters.map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={cn(
              'rounded-md px-3 py-1 text-xs font-medium transition-colors',
              filter === f.id ? 'bg-cyan-500 text-white' : 'text-muted-foreground hover:bg-cyan-50 hover:text-cyan-700',
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <Card className="border-cyan-100/70">
          <CardContent>
            <EmptyState icon={Truck} title="No shipments found" description="Active shipments matching the filter will appear here." />
          </CardContent>
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 gap-3">
          {filtered.map((s) => (
            <Card key={s.id} className="border-cyan-100/70">
              <CardContent className="pt-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-foreground">{s.orderCode}</p>
                    <p className="text-xs text-muted-foreground">{s.sellerOrderCode}</p>
                  </div>
                  <StatusPill status={s.status} config={SHIPMENT_STATUS_CONFIG} />
                </div>
                <div className="rounded-lg border border-border/60 bg-slate-50/50 p-2.5 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Provider</span>
                    <Badge variant="outline" className="bg-cyan-50 text-cyan-700 border-cyan-200 font-mono">{s.provider}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Tracking #</span>
                    <span className="text-xs font-mono text-foreground">{s.trackingNumber}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Recipient</span>
                    <span className="text-xs text-foreground">{s.recipient}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">ETA</span>
                    <span className="text-xs text-foreground">{s.estimatedDays} days</span>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full border-cyan-200 text-cyan-700 hover:bg-cyan-50"
                  onClick={() => toast({ title: 'Track shipment', description: `Opening tracker for ${s.trackingNumber}` })}
                >
                  <Truck className="h-3.5 w-3.5" />
                  Track shipment
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

/* ============================================================
   Tab 7: Revenue
   ============================================================ */

function RevenueTab({ data }: { data: any }) {
  const [period, setPeriod] = useState<'30d' | '90d' | '12mo'>('12mo');
  const chart = (data?.chart ?? []) as any[];
  const metrics = data?.metrics ?? {};
  const wallet = data?.wallet ?? DEMO_WALLET;
  const totalRevenue = metrics.totalRevenue ?? wallet.totalEarned ?? 0;
  const totalCommission = metrics.totalCommission ?? Math.round(totalRevenue * COMMISSION_RATE);
  const netRevenue = totalRevenue - totalCommission;

  const periods: { id: typeof period; label: string }[] = [
    { id: '30d', label: 'Last 30 days' },
    { id: '90d', label: 'Last 90 days' },
    { id: '12mo', label: 'Last 12 months' },
  ];

  // For 12mo use full chart, others we slice (mock)
  const chartData = period === '12mo' ? chart : chart.slice(period === '30d' ? -2 : -3);

  return (
    <div className="space-y-4">
      <SectionHeader
        icon={DollarSign}
        title="Revenue"
        description="Revenue, commission and settlement overview"
        action={
          <div className="flex items-center gap-1 rounded-lg border border-border/60 bg-white p-1">
            {periods.map((p) => (
              <button
                key={p.id}
                onClick={() => setPeriod(p.id)}
                className={cn(
                  'rounded-md px-2.5 py-1 text-xs font-medium transition-colors',
                  period === p.id ? 'bg-cyan-500 text-white' : 'text-muted-foreground hover:bg-cyan-50 hover:text-cyan-700',
                )}
              >
                {p.label}
              </button>
            ))}
          </div>
        }
      />

      {/* Revenue / commission cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Total Revenue" value={formatVND(totalRevenue)} icon={DollarSign} accent="cyan" trend={12.4} />
        <StatCard label="Commission (5%)" value={formatVND(totalCommission)} icon={Banknote} accent="amber" trend={12.4} />
        <StatCard label="Net Revenue" value={formatVND(netRevenue)} icon={TrendingUp} accent="teal" trend={12.4} />
      </div>

      {/* Revenue line chart */}
      <Card className="border-cyan-100/70">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-cyan-600" />
            Revenue Over Time
          </CardTitle>
        </CardHeader>
        <CardContent>
          {chartData.length === 0 ? (
            <EmptyState icon={TrendingUp} title="No revenue data" description="Revenue chart will populate as orders are completed." />
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} tickFormatter={(v) => formatVNDCompact(v)} width={56} />
                <Tooltip content={<ChartTooltip valueFormatter={(v: number) => formatVND(v)} />} />
                <Line type="monotone" dataKey="revenue" name="Revenue" stroke="#06b6d4" strokeWidth={2.5} dot={{ r: 3, fill: '#06b6d4' }} activeDot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Settlement note */}
      <Card className="border-cyan-100/70 bg-gradient-to-r from-cyan-50/40 to-teal-50/40">
        <CardContent className="pt-4 flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-teal-400 text-white shrink-0">
            <Clock className="h-5 w-5" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-semibold text-foreground">Settlement Period</p>
            <p className="text-sm text-muted-foreground">
              Funds become <span className="font-semibold text-cyan-700">available for withdrawal 7 days</span> after order completion.
              Pending balance reflects recent sales awaiting settlement.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/* ============================================================
   Tab 8: Wallet
   ============================================================ */

function WalletTab({
  wallet,
  transactions,
  onWithdrawClick,
}: {
  wallet: any;
  transactions: any[];
  onWithdrawClick: () => void;
}) {
  const w = wallet ?? DEMO_WALLET;
  const txs = transactions?.length ? transactions : DEMO_WALLET_TXS;

  const cards = [
    { label: 'Pending Balance', value: w.pendingBalance ?? 0, icon: Clock, accent: 'amber' as const, hint: 'Available after 7 days' },
    { label: 'Available Balance', value: w.availableBalance ?? 0, icon: Wallet, accent: 'teal' as const, hint: 'Withdrawable now' },
    { label: 'Frozen Balance', value: w.frozenBalance ?? 0, icon: AlertTriangle, accent: 'rose' as const, hint: 'In withdrawal' },
    { label: 'Total Earned', value: w.totalEarned ?? 0, icon: TrendingUp, accent: 'cyan' as const },
    { label: 'Total Withdrawn', value: w.totalWithdrawn ?? 0, icon: Banknote, accent: 'aqua' as const },
  ];

  return (
    <div className="space-y-4">
      <SectionHeader
        icon={Wallet}
        title="Wallet"
        description="Balances and transaction ledger"
        action={
          <Button size="sm" className="bg-cyan-500 hover:bg-cyan-600 text-white" onClick={onWithdrawClick}>
            <Banknote className="h-3.5 w-3.5" />
            Request Withdrawal
          </Button>
        }
      />

      {/* Balance cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map((c) => (
          <StatCard key={c.label} label={c.label} value={formatVND(c.value)} icon={c.icon} accent={c.accent} hint={c.hint} />
        ))}
      </div>

      {/* Transactions ledger */}
      <Card className="border-cyan-100/70">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="h-4 w-4 text-cyan-600" />
            Transaction Ledger
          </CardTitle>
        </CardHeader>
        <CardContent>
          {txs.length === 0 ? (
            <EmptyState icon={FileText} title="No transactions yet" description="Wallet transactions will appear here as orders settle." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/60 text-left text-xs text-muted-foreground">
                    <th className="py-2 pr-3 font-medium">Type</th>
                    <th className="py-2 px-3 font-medium text-right">Amount</th>
                    <th className="py-2 px-3 font-medium">Balance type</th>
                    <th className="py-2 px-3 font-medium">Note</th>
                    <th className="py-2 pl-3 font-medium text-right">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {txs.map((t) => {
                    const cfg = WALLET_TX_CONFIG[t.type] ?? { label: t.type, cls: 'text-slate-600', icon: FileText };
                    const Icon = cfg.icon;
                    return (
                      <tr key={t.id} className="border-b border-border/40 hover:bg-cyan-50/30 transition-colors">
                        <td className="py-2.5 pr-3">
                          <span className="inline-flex items-center gap-1.5 text-xs font-medium">
                            <Icon className={cn('h-3.5 w-3.5', cfg.cls)} />
                            {cfg.label}
                          </span>
                        </td>
                        <td className={cn('py-2.5 px-3 text-right font-semibold', t.amount >= 0 ? 'text-emerald-600' : 'text-rose-600')}>
                          {t.amount >= 0 ? '+' : ''}{formatVND(t.amount)}
                        </td>
                        <td className="py-2.5 px-3">
                          <Badge variant="outline" className="bg-slate-50 text-slate-700 border-slate-200">{t.balanceType ?? '—'}</Badge>
                        </td>
                        <td className="py-2.5 px-3 text-muted-foreground text-xs">{t.note ?? '—'}</td>
                        <td className="py-2.5 pl-3 text-right text-xs text-muted-foreground">{formatDate(t.createdAt)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

/* ============================================================
   Tab 9: Withdrawals
   ============================================================ */

function WithdrawalsTab({
  withdrawals,
  onWithdrawClick,
}: {
  withdrawals: any[];
  onWithdrawClick: () => void;
}) {
  const items = withdrawals?.length ? withdrawals : DEMO_WITHDRAWALS;

  function parseBank(bankInfo: any) {
    if (!bankInfo) return null;
    if (typeof bankInfo === 'object') return bankInfo;
    try {
      return JSON.parse(bankInfo);
    } catch {
      return null;
    }
  }

  return (
    <div className="space-y-4">
      <SectionHeader
        icon={Banknote}
        title="Withdrawals"
        description={`${items.length} withdrawal requests`}
        action={
          <Button size="sm" className="bg-cyan-500 hover:bg-cyan-600 text-white" onClick={onWithdrawClick}>
            <Plus className="h-3.5 w-3.5" />
            Request new withdrawal
          </Button>
        }
      />

      {items.length === 0 ? (
        <Card className="border-cyan-100/70">
          <CardContent>
            <EmptyState icon={Banknote} title="No withdrawals yet" description="Withdrawal requests will appear here." />
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {items.map((w) => {
            const bank = parseBank(w.bankInfo);
            return (
              <Card key={w.id} className="border-cyan-100/70">
                <CardContent className="pt-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-teal-400 text-white shrink-0">
                        <Banknote className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-lg font-bold text-foreground">{formatVND(w.amount)}</p>
                        <p className="text-xs text-muted-foreground">Requested {formatDate(w.createdAt)}</p>
                      </div>
                    </div>
                    <StatusPill status={w.status} config={WITHDRAWAL_STATUS_CONFIG} />
                  </div>
                  {bank && (
                    <div className="mt-3 rounded-lg border border-border/60 bg-slate-50/50 p-2.5 space-y-1 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Bank</span>
                        <span className="font-medium text-foreground">{bank.bankName ?? '—'}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Account #</span>
                        <span className="font-mono text-foreground">{bank.accountNumber ?? '—'}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Holder</span>
                        <span className="text-foreground">{bank.accountHolder ?? '—'}</span>
                      </div>
                      {w.processedAt && (
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Processed</span>
                          <span className="text-foreground">{formatDate(w.processedAt)}</span>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ============================================================
   Tab 10: Reviews
   ============================================================ */

function ReviewsTab({ reviews, toast }: { reviews: any[]; toast: any }) {
  const items = reviews?.length ? reviews : DEMO_RECENT_REVIEWS;
  const [reply, setReply] = useState<Record<string, string>>({});

  function submitReply(id: string, productName: string) {
    const text = reply[id]?.trim();
    if (!text) {
      toast({ title: 'Reply is empty', description: 'Please write a reply before submitting.' });
      return;
    }
    toast({ title: 'Reply posted', description: `Reply to "${productName}" posted.` });
    setReply({ ...reply, [id]: '' });
  }

  return (
    <div className="space-y-4">
      <SectionHeader icon={Star} title="Reviews" description={`${items.length} product reviews`} />

      {items.length === 0 ? (
        <Card className="border-cyan-100/70">
          <CardContent>
            <EmptyState icon={Star} title="No reviews yet" description="Customer reviews will appear here. Reply to reviews to engage with your customers." />
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {items.map((r) => (
            <Card key={r.id} className="border-cyan-100/70">
              <CardContent className="pt-4 space-y-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full bg-slate-100">
                      {r.user?.avatarUrl ? (
                        <Image src={r.user.avatarUrl} alt={r.user.name ?? 'User'} fill className="object-cover" unoptimized />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-cyan-500 to-teal-400 text-white text-sm font-semibold">
                          {(r.user?.name ?? '?').slice(0, 1).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{r.user?.name ?? 'Anonymous'}</p>
                      <p className="text-xs text-muted-foreground">
                        on <span className="font-medium text-cyan-700">{r.product?.name ?? r.productName ?? 'Product'}</span>
                        {r.verifiedPurchase && (
                          <Badge variant="outline" className="ml-1.5 bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px]">
                            <CheckCircle2 className="h-2.5 w-2.5 mr-1" />
                            Verified
                          </Badge>
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Rating value={r.rating} showCount={false} size="sm" />
                    <span className="text-xs text-muted-foreground">{timeAgo(r.createdAt)}</span>
                  </div>
                </div>
                <p className="text-sm text-foreground">{r.comment}</p>

                {r.sellerReply ? (
                  <div className="rounded-lg border border-cyan-100 bg-cyan-50/40 p-2.5">
                    <p className="text-xs font-semibold text-cyan-700 flex items-center gap-1.5 mb-1">
                      <MessageSquare className="h-3.5 w-3.5" />
                      Your reply
                    </p>
                    <p className="text-xs text-foreground">{r.sellerReply}</p>
                  </div>
                ) : (
                  <div className="rounded-lg border border-border/60 p-2.5 space-y-2">
                    <Label htmlFor={`reply-${r.id}`} className="text-xs font-medium text-muted-foreground">
                      Write a reply
                    </Label>
                    <Textarea
                      id={`reply-${r.id}`}
                      placeholder="Thank the customer, address their concerns..."
                      value={reply[r.id] ?? ''}
                      onChange={(e) => setReply({ ...reply, [r.id]: e.target.value })}
                      className="min-h-16 text-sm"
                    />
                    <div className="flex justify-end">
                      <Button
                        size="sm"
                        className="bg-cyan-500 hover:bg-cyan-600 text-white h-7"
                        onClick={() => submitReply(r.id, r.product?.name ?? r.productName ?? 'product')}
                      >
                        <MessageSquare className="h-3.5 w-3.5" />
                        Post reply
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

/* ============================================================
   Tab 11: Analytics
   ============================================================ */

function AnalyticsTab({ data, products }: { data: any; products: any[] }) {
  const chart = (data?.chart ?? []) as any[];
  const metrics = data?.metrics ?? {};

  // Top products bar chart
  const topProductsBar = (data?.topProducts?.length ? data.topProducts : DEMO_TOP_PRODUCTS).slice(0, 5).map((p: any) => ({
    name: p.name.length > 28 ? p.name.slice(0, 25) + '...' : p.name,
    sold: p.soldCount ?? 0,
  }));

  // Sales by product type pie
  const typeCounts: Record<string, number> = {};
  products.forEach((p) => {
    typeCounts[p.productType] = (typeCounts[p.productType] ?? 0) + 1;
  });
  const typePieData = Object.entries(typeCounts).map(([name, value]) => ({ name, value }));

  // Traffic sources bar
  const trafficData = DEMO_TRAFFIC_SOURCES;

  return (
    <div className="space-y-4">
      <SectionHeader icon={BarChart3} title="Analytics" description="Performance insights & trends" />

      <div className="grid lg:grid-cols-2 gap-4">
        {/* Revenue over time (area) */}
        <Card className="border-cyan-100/70">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-cyan-600" />
              Revenue Over Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            {chart.length === 0 ? (
              <EmptyState icon={TrendingUp} title="No data" description="Revenue chart will appear here." />
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={chart} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="anaRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} tickFormatter={(v) => formatVNDCompact(v)} width={48} />
                  <Tooltip content={<ChartTooltip valueFormatter={(v: number) => formatVND(v)} />} />
                  <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#06b6d4" strokeWidth={2} fill="url(#anaRev)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Orders over time (bar) */}
        <Card className="border-cyan-100/70">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <ShoppingCart className="h-4 w-4 text-cyan-600" />
              Orders Over Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            {chart.length === 0 ? (
              <EmptyState icon={ShoppingCart} title="No data" description="Orders chart will appear here." />
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={chart} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} width={32} />
                  <Tooltip content={<ChartTooltip />} />
                  <Bar dataKey="orders" name="Orders" fill="#2dd4bf" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Top products (horizontal bar) */}
        <Card className="border-cyan-100/70">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-cyan-600" />
              Top Products (by sold count)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {topProductsBar.length === 0 ? (
              <EmptyState icon={BarChart3} title="No data" description="Top products chart will appear here." />
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={topProductsBar} layout="vertical" margin={{ top: 8, right: 16, left: 8, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} width={120} />
                  <Tooltip content={<ChartTooltip />} />
                  <Bar dataKey="sold" name="Sold" fill="#22d3ee" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Sales by product type (pie) */}
        <Card className="border-cyan-100/70">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <PieChart className="h-4 w-4 text-cyan-600" />
              Sales by Product Type
            </CardTitle>
          </CardHeader>
          <CardContent>
            {typePieData.length === 0 ? (
              <EmptyState icon={PieChart} title="No data" description="Product type breakdown will appear here." />
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <RPieChart>
                  <Pie data={typePieData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={90} paddingAngle={2}>
                    {typePieData.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<ChartTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                </RPieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Traffic sources (mock) */}
      <Card className="border-cyan-100/70">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Activity className="h-4 w-4 text-cyan-600" />
            Traffic Sources
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={trafficData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
              <XAxis dataKey="source" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} width={32} />
              <Tooltip content={<ChartTooltip />} />
              <Bar dataKey="visits" name="Visits" fill="#0891b2" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <div className="mt-3 grid grid-cols-2 sm:grid-cols-5 gap-2">
            {trafficData.map((s, i) => (
              <div key={s.source} className="rounded-lg border border-border/60 p-2 text-center">
                <div className="flex items-center justify-center gap-1.5">
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                  <span className="text-xs font-medium text-foreground">{s.source}</span>
                </div>
                <p className="text-sm font-bold text-cyan-700 mt-0.5">{s.visits.toLocaleString('vi-VN')}</p>
                <p className="text-[10px] text-muted-foreground">{s.pct}%</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Total Items Sold" value={String(metrics.totalItemsSold ?? 0)} icon={Package} accent="cyan" />
        <StatCard label="Completed Orders" value={String(metrics.completedOrders ?? 0)} icon={CheckCircle2} accent="teal" />
        <StatCard label="Product Count" value={String(metrics.productCount ?? 0)} icon={FileCode} accent="aqua" />
        <StatCard label="Total Commission" value={formatVNDCompact(metrics.totalCommission ?? 0)} icon={Banknote} accent="amber" />
      </div>
    </div>
  );
}

/* ============================================================
   Tab 12: Settings
   ============================================================ */

function SettingsTab({ toast }: { toast: any }) {
  const [form, setForm] = useState({
    name: SHOP_INFO.name,
    slug: SHOP_INFO.slug,
    description:
      'BoardForge Studio designs and manufactures developer kits, custom PCB stacks, and reusable design templates for the Vietnamese hardware community. We specialize in ESP32 and STM32 platforms.',
    logoUrl: SHOP_INFO.logoUrl,
    bannerUrl: SHOP_INFO.bannerUrl,
    specializations: SHOP_INFO.specializations.join(', '),
    responseTime: String(SHOP_INFO.responseTime),
  });

  function handleSave() {
    toast({
      title: 'Settings saved',
      description: 'Your shop profile has been updated.',
    });
  }

  return (
    <div className="space-y-4">
      <SectionHeader
        icon={Settings}
        title="Settings"
        description="Shop profile & preferences"
        action={
          <Button size="sm" className="bg-cyan-500 hover:bg-cyan-600 text-white" onClick={handleSave}>
            <CheckCircle2 className="h-3.5 w-3.5" />
            Save changes
          </Button>
        }
      />

      <Card className="border-cyan-100/70">
        <CardHeader>
          <CardTitle className="text-base">Shop Profile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="set-name">Shop name</Label>
              <Input id="set-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="set-slug">Slug</Label>
              <Input id="set-slug" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} className="font-mono" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="set-desc">Description</Label>
            <Textarea id="set-desc" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="min-h-24" />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="set-logo">Logo URL</Label>
              <Input id="set-logo" value={form.logoUrl} onChange={(e) => setForm({ ...form, logoUrl: e.target.value })} className="font-mono text-xs" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="set-banner">Banner URL</Label>
              <Input id="set-banner" value={form.bannerUrl} onChange={(e) => setForm({ ...form, bannerUrl: e.target.value })} className="font-mono text-xs" />
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="set-spec">Specializations (comma separated)</Label>
              <Input id="set-spec" value={form.specializations} onChange={(e) => setForm({ ...form, specializations: e.target.value })} />
              <p className="text-xs text-muted-foreground">e.g. PCB Design, Embedded Firmware, KiCad Templates</p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="set-rt">Response time (minutes)</Label>
              <Input id="set-rt" type="number" value={form.responseTime} onChange={(e) => setForm({ ...form, responseTime: e.target.value })} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Logo / banner preview */}
      <Card className="border-cyan-100/70">
        <CardHeader>
          <CardTitle className="text-base">Preview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative h-32 w-full overflow-hidden rounded-xl bg-gradient-to-r from-cyan-100 via-white to-teal-100">
            {form.bannerUrl && (
              <Image src={form.bannerUrl} alt="Banner" fill className="object-cover opacity-30" unoptimized />
            )}
            <div className="absolute inset-x-0 bottom-0 flex items-end gap-3 p-3">
              <div className="relative h-12 w-12 overflow-hidden rounded-full border-2 border-white shadow-md bg-white">
                {form.logoUrl && <Image src={form.logoUrl} alt="Logo" fill className="object-cover" unoptimized />}
              </div>
              <div className="flex-1 min-w-0 pb-1">
                <p className="text-sm font-semibold text-foreground truncate">{form.name || 'Your shop'}</p>
                <p className="text-xs text-muted-foreground truncate">{form.specializations}</p>
              </div>
              <VerifiedBadge />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button size="sm" className="bg-cyan-500 hover:bg-cyan-600 text-white" onClick={handleSave}>
          <CheckCircle2 className="h-3.5 w-3.5" />
          Save changes
        </Button>
      </div>
    </div>
  );
}

/* ============================================================
   Withdrawal Dialog
   ============================================================ */

function WithdrawalDialog({
  open,
  onOpenChange,
  wallet,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  wallet: any;
}) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [amount, setAmount] = useState('');
  const [bankName, setBankName] = useState('Vietcombank');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountHolder, setAccountHolder] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const w = wallet ?? DEMO_WALLET;
  const available = w.availableBalance ?? 0;
  const amountNum = parseInt(amount, 10) || 0;

  function handleClose(v: boolean) {
    if (!v) {
      setAmount('');
      setAccountNumber('');
      setAccountHolder('');
    }
    onOpenChange(v);
  }

  async function handleSubmit() {
    if (amountNum < 50000) {
      toast({ title: 'Invalid amount', description: 'Minimum withdrawal is 50,000₫.' });
      return;
    }
    if (amountNum > available) {
      toast({ title: 'Insufficient balance', description: `Available: ${formatVND(available)}` });
      return;
    }
    if (!bankName.trim() || !accountNumber.trim() || !accountHolder.trim()) {
      toast({ title: 'Missing bank info', description: 'Please fill in all bank details.' });
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/v1/withdrawals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sellerId: SELLER_ID,
          amount: String(amountNum),
          bankInfo: {
            bankName: bankName.trim(),
            accountNumber: accountNumber.trim(),
            accountHolder: accountHolder.trim().toUpperCase(),
          },
        }),
      });
      const json = await res.json();
      if (!json.success) {
        throw new Error(json.message ?? 'Failed to request withdrawal');
      }
      toast({
        title: 'Withdrawal requested',
        description: `${formatVND(amountNum)} will be transferred to ${bankName}. Pending admin approval.`,
      });
      handleClose(false);
      queryClient.invalidateQueries({ queryKey: ['wallet', SELLER_ID] });
      queryClient.invalidateQueries({ queryKey: ['withdrawals', SELLER_ID] });
      queryClient.invalidateQueries({ queryKey: ['seller-analytics', SELLER_ID] });
    } catch (e: any) {
      toast({ title: 'Withdrawal failed', description: e.message ?? 'Please try again.' });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Banknote className="h-4 w-4 text-cyan-600" />
            Request Withdrawal
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Available balance hint */}
          <div className="rounded-lg border border-cyan-100 bg-cyan-50/50 p-3">
            <p className="text-xs text-muted-foreground">Available balance</p>
            <p className="text-xl font-bold text-cyan-700">{formatVND(available)}</p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="wd-amount">Amount (VND)</Label>
            <Input
              id="wd-amount"
              type="number"
              placeholder="50000"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              min={50000}
              max={available}
            />
            {amountNum > 0 && (
              <p className="text-xs text-muted-foreground">
                You will receive <span className="font-semibold text-cyan-700">{formatVND(amountNum)}</span>
              </p>
            )}
          </div>

          <Separator />

          <div className="space-y-1.5">
            <Label htmlFor="wd-bank">Bank name</Label>
            <Input id="wd-bank" placeholder="Vietcombank" value={bankName} onChange={(e) => setBankName(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="wd-acc">Account number</Label>
            <Input id="wd-acc" placeholder="0123456789" value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} className="font-mono" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="wd-holder">Account holder name</Label>
            <Input id="wd-holder" placeholder="NGUYEN VAN A" value={accountHolder} onChange={(e) => setAccountHolder(e.target.value)} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleClose(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button className="bg-cyan-500 hover:bg-cyan-600 text-white" onClick={handleSubmit} disabled={submitting}>
            {submitting ? 'Submitting...' : 'Submit request'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ============================================================
   Sidebar / mobile pill trigger
   ============================================================ */

function SidebarButton({
  tab,
  active,
  onClick,
}: {
  tab: { id: TabId; label: string; icon: typeof Package };
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors text-left',
        active
          ? 'bg-cyan-500 text-white shadow-[0_8px_18px_-8px_rgba(6,182,212,0.5)]'
          : 'text-slate-600 hover:bg-cyan-50 hover:text-cyan-700',
      )}
    >
      <tab.icon className={cn('h-4 w-4 shrink-0', active ? 'text-white' : 'text-cyan-600')} />
      <span className="truncate">{tab.label}</span>
    </button>
  );
}

function MobilePill({
  tab,
  active,
  onClick,
}: {
  tab: { id: TabId; label: string; icon: typeof Package };
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex-none flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium border transition-colors',
        active ? 'bg-cyan-500 text-white border-cyan-500' : 'bg-white text-muted-foreground border-border/60',
      )}
    >
      <tab.icon className="h-3.5 w-3.5" />
      <span className="whitespace-nowrap">{tab.label}</span>
    </button>
  );
}

/* ============================================================
   SellerCenter — main exported component
   ============================================================ */

export function SellerCenter() {
  const { toast } = useToast();
  const goShop = useNavStore((s) => s.goShop);
  const goProduct = useNavStore((s) => s.goProduct);
  const goProducts = useNavStore((s) => s.goProducts);
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [withdrawalOpen, setWithdrawalOpen] = useState(false);

  // Live data
  const { data: analyticsData } = useSellerAnalytics(SELLER_ID);
  const { data: sellerProducts } = useSellerProducts(SELLER_ID);
  const { data: walletData } = useWallet(SELLER_ID);
  const { data: sellerOrders } = useOrders(SELLER_ID, 'seller');
  const { data: withdrawals } = useWithdrawals(SELLER_ID);

  // Categories for Add Product dialog
  const { data: categoriesData } = useQuery({
    queryKey: ['categories-flat'],
    queryFn: async () => {
      const res = await fetch('/api/v1/categories');
      const json = await res.json();
      if (!json.success) return [];
      // Flatten the tree
      const flat: { id: string; name: string; slug: string }[] = [];
      const walk = (cats: any[]) => {
        for (const c of cats) {
          flat.push({ id: c.id, name: c.name, slug: c.slug });
          if (c.children?.length) walk(c.children);
        }
      };
      walk(json.data);
      return flat;
    },
    staleTime: 5 * 60 * 1000,
  });
  const categories = categoriesData ?? [];

  // Resolve shopId from analytics data (wallet has sellerId, products have shopId)
  const shopId = (sellerProducts?.[0] as any)?.shopId ?? analyticsData?.wallet?.sellerId ?? 'demo-shop';

  const products = (sellerProducts ?? []) as any[];
  const orders = (sellerOrders ?? []) as any[];

  // For Shipping tab — we use DEMO_SHIPMENTS as fallback since API doesn't link shipments yet
  const shipments = DEMO_SHIPMENTS;

  // For Reviews tab — use analytics reviews, fallback to demo
  const reviews = (analyticsData?.reviews?.length ? analyticsData.reviews : DEMO_RECENT_REVIEWS) as any[];

  const activeTabDef = ALL_TABS.find((t) => t.id === activeTab);

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-cyan-50/20 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="relative overflow-hidden rounded-2xl border border-cyan-100 bg-gradient-to-r from-cyan-50 via-white to-teal-50 p-5 sm:p-6 mb-6"
        >
          <div
            aria-hidden
            className="absolute inset-0 pointer-events-none opacity-[0.05]"
            style={{
              backgroundImage:
                'linear-gradient(to right, #06b6d4 1px, transparent 1px), linear-gradient(to bottom, #06b6d4 1px, transparent 1px)',
              backgroundSize: '24px 24px',
            }}
          />
          <div className="relative flex flex-wrap items-center gap-4">
            <div className="relative h-14 w-14 sm:h-16 sm:w-16 overflow-hidden rounded-2xl border-4 border-white shadow-md bg-white shrink-0">
              <Image src={SHOP_INFO.logoUrl} alt={SHOP_INFO.name} fill className="object-cover" unoptimized />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-cyan-600 uppercase tracking-wide flex items-center gap-1.5">
                <Store className="h-3 w-3" />
                Seller Center
              </p>
              <div className="flex flex-wrap items-center gap-2 mt-0.5">
                <h1 className="text-2xl sm:text-3xl font-bold text-foreground">{SHOP_INFO.name}</h1>
                {SHOP_INFO.verified && <VerifiedBadge />}
                <Badge variant="outline" className="bg-cyan-50 text-cyan-700 border-cyan-200 font-mono">
                  {(SHOP_INFO.commissionRate * 100).toFixed(0)}% commission
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-1 flex flex-wrap items-center gap-2">
                <span className="flex items-center gap-1">
                  <Cog className="h-3.5 w-3.5" />
                  {SHOP_INFO.specializations.length} specializations
                </span>
                <span className="text-border">·</span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  ~{SHOP_INFO.responseTime}min response
                </span>
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="border-cyan-200 text-cyan-700 hover:bg-cyan-50" onClick={() => goShop(SHOP_INFO.slug)}>
                <Eye className="h-3.5 w-3.5" />
                View shop
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Mobile: horizontal scrollable pill nav */}
        <div className="lg:hidden -mx-4 px-4 overflow-x-auto pb-2 mb-4">
          <div className="flex gap-1.5 w-max">
            {ALL_TABS.map((tab) => (
              <MobilePill key={tab.id} tab={tab} active={activeTab === tab.id} onClick={() => setActiveTab(tab.id)} />
            ))}
          </div>
        </div>

        {/* Layout: sidebar + content */}
        <div className="lg:grid lg:grid-cols-[240px_1fr] lg:gap-8">
          {/* Sidebar */}
          <aside className="hidden lg:block">
            <div className="sticky top-4 space-y-5">
              {SIDEBAR_SECTIONS.map((section) => (
                <div key={section.title} className="space-y-1.5">
                  <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80">
                    {section.title}
                  </p>
                  {section.items.map((tab) => (
                    <SidebarButton
                      key={tab.id}
                      tab={tab}
                      active={activeTab === tab.id}
                      onClick={() => setActiveTab(tab.id)}
                    />
                  ))}
                </div>
              ))}

              <div className="mt-2 rounded-xl border border-cyan-100 bg-cyan-50/60 p-4">
                <p className="text-xs font-semibold text-cyan-700 flex items-center gap-1.5">
                  <Banknote className="h-3.5 w-3.5" />
                  Settlement Policy
                </p>
                <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">
                  Funds become available 7 days after order completion. Withdrawals are processed within 1–3 business days.
                </p>
              </div>
            </div>
          </aside>

          {/* Content */}
          <div className="min-w-0">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
              >
                {activeTab === 'overview' && (
                  <OverviewTab data={analyticsData} goShop={goShop} goProducts={() => setActiveTab('products')} />
                )}
                {activeTab === 'products' && (
                  <ProductsTab products={products} toast={toast} goProduct={goProduct} sellerId={SELLER_ID} shopId={shopId} categories={categories} />
                )}
                {activeTab === 'digital' && <DigitalAssetsTab products={products} toast={toast} />}
                {activeTab === 'pcb' && <PCBProjectsTab products={products} toast={toast} />}
                {activeTab === 'orders' && <OrdersTab orders={orders} toast={toast} />}
                {activeTab === 'shipping' && <ShippingTab shipments={shipments} toast={toast} />}
                {activeTab === 'revenue' && <RevenueTab data={analyticsData} />}
                {activeTab === 'wallet' && (
                  <WalletTab
                    wallet={walletData?.wallet}
                    transactions={walletData?.transactions}
                    onWithdrawClick={() => setWithdrawalOpen(true)}
                  />
                )}
                {activeTab === 'withdrawals' && (
                  <WithdrawalsTab withdrawals={withdrawals ?? []} onWithdrawClick={() => setWithdrawalOpen(true)} />
                )}
                {activeTab === 'reviews' && <ReviewsTab reviews={reviews} toast={toast} />}
                {activeTab === 'analytics' && (
                  <AnalyticsTab data={analyticsData} products={products} />
                )}
                {activeTab === 'settings' && <SettingsTab toast={toast} />}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Mobile: section tabs at bottom (long list, optional) */}
        <div className="lg:hidden mt-8 pt-4 border-t border-border/40 text-xs text-muted-foreground">
          <p className="font-semibold text-foreground mb-2">
            {activeTabDef?.label} · {SIDEBAR_SECTIONS.find((s) => s.items.some((i) => i.id === activeTab))?.title}
          </p>
          <p>{activeTabDef?.description}</p>
        </div>
      </div>

      {/* Withdrawal dialog (global, accessible from Wallet + Withdrawals tabs) */}
      <WithdrawalDialog open={withdrawalOpen} onOpenChange={setWithdrawalOpen} wallet={walletData?.wallet} />
    </div>
  );
}
