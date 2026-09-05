'use client';

/* ============================================================
   CircuitHub — AdminCenter
   Single-file admin center with 12 internal tabs:
   Overview · Users · Sellers · Products · Orders · Payments ·
   Returns & Refunds · Withdrawals · Reviews Moderation ·
   Categories · Audit Logs · System Settings.

   Layout:
   - Sticky left sidebar (DARK slate-900, different from buyer/
     seller) grouped into 4 sections: Operations / Catalog /
     Finance / System on lg+.
   - Horizontal scrollable pill nav on mobile.
   - AnimatePresence (mode="wait") for tab transitions.
   - Container: max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8.
   - Header: "Admin Center" with admin avatar + role badge +
     "Last refresh" timestamp + "Refresh" button.

   Data:
   - useAdminAnalytics() for metrics, 12-month GMV/orders/
     commission chart, byType, topSellers, recentProducts,
     recentOrders.
   - useAdminSellers() for seller list.
   - useAdminUsers(role?) for user list.
   - useAdminWithdrawals() for withdrawal list.
   - useAuditLogs(50) for audit log table.
   - useOrders(undefined, 'admin') for all orders.
   - useProducts({}) for full product list (Products tab).
   - Mock data for Returns, Reviews Moderation, Categories.

   Theme:
   - WHITE + CYAN + AQUA primary, but sidebar uses slate-900
     (admin feel) per spec.
   - Dense info layout, smaller fonts, compact tables.
   - Stat cards: icon tile + big number (tabular-nums) + trend.
   - Tables: hover row highlight, sortable headers (visual
     only), pagination footer.
   - Color-coded status badges: pending=amber, success=emerald,
     danger=red, info=cyan.
   - Recharts charts use chart-1..5 palette tokens.
   ============================================================ */

import { useState, useMemo, useEffect } from 'react';
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
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  useAdminAnalytics,
  useAdminSellers,
  useAdminProducts,
  useAdminUsers,
  useAdminWithdrawals,
  useAuditLogs,
  useOrders,
  useProducts,
  useCategories,
} from '@/lib/api/hooks';
import { useToast } from '@/hooks/use-toast';
import {
  formatVND,
  formatVNDCompact,
  formatDate,
  timeAgo,
  initials,
} from '@/lib/format';
import { Rating } from '@/components/common/rating';
import { ProductModerationDialog } from '@/components/admin/product-moderation-dialog';
import {
  ProductTypeBadge,
  VerifiedBadge,
} from '@/components/common/badges';
import {
  LayoutDashboard,
  Users,
  Store,
  Package,
  ShoppingCart,
  CreditCard,
  RefreshCw,
  Wallet,
  Star,
  ListTree,
  ScrollText,
  Settings,
  Search,
  Check,
  X,
  Eye,
  ChevronRight,
  ChevronDown,
  ArrowUpRight,
  ArrowDownRight,
  DollarSign,
  TrendingUp,
  AlertCircle,
  ShieldCheck,
  Activity,
  PieChart as PieIcon,
  BarChart3,
  Building2,
  FileText,
  Clock,
  Filter,
  RotateCcw,
  Plus,
  Pencil,
  Trash2,
  Lock,
  Globe,
  Percent,
  CalendarClock,
  LogOut,
} from 'lucide-react';
import { useAuthStore } from '@/stores/auth-store';
import { useNavStore } from '@/stores/nav-store';
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
  ComposedChart,
} from 'recharts';
import { useQueryClient } from '@tanstack/react-query';
import { cn } from '@/lib/utils';

/* ---------------- Constants ---------------- */

const ADMIN_ID = 'demo-admin';
const CHART_COLORS = ['#06b6d4', '#2dd4bf', '#22d3ee', '#0891b2', '#14b8a6'];
const PIE_COLORS = ['#06b6d4', '#2dd4bf', '#22d3ee', '#0891b2', '#14b8a6', '#67e8f9'];

const ADMIN_INFO = {
  name: 'System Administrator',
  email: 'admin@circuithub.vn',
  avatarUrl: 'https://api.dicebear.com/7.x/initials/svg?seed=SA&backgroundColor=06b6d4',
  role: 'ADMIN',
};

/* ---------------- Types ---------------- */

type TabId =
  | 'overview'
  | 'users'
  | 'sellers'
  | 'products'
  | 'orders'
  | 'payments'
  | 'returns'
  | 'withdrawals'
  | 'reviews'
  | 'categories'
  | 'audit'
  | 'settings';

interface SidebarSection {
  title: string;
  items: { id: TabId; label: string; icon: typeof Package; description: string }[];
}

/* ---------------- Status config ---------------- */

const USER_ROLE_CONFIG: Record<string, { label: string; cls: string }> = {
  BUYER: { label: 'Buyer', cls: 'bg-slate-100 text-slate-700 border-slate-200' },
  SELLER: { label: 'Seller', cls: 'bg-cyan-50 text-cyan-700 border-cyan-200' },
  ADMIN: { label: 'Admin', cls: 'bg-rose-50 text-rose-700 border-rose-200' },
  SUPPORT: { label: 'Support', cls: 'bg-teal-50 text-teal-700 border-teal-200' },
  MODERATOR: { label: 'Moderator', cls: 'bg-amber-50 text-amber-700 border-amber-200' },
  ACCOUNTANT: { label: 'Accountant', cls: 'bg-violet-50 text-violet-700 border-violet-200' },
};

const USER_STATUS_CONFIG: Record<string, { label: string; cls: string; dot: string }> = {
  ACTIVE: { label: 'Active', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
  SUSPENDED: { label: 'Suspended', cls: 'bg-red-50 text-red-700 border-red-200', dot: 'bg-red-500' },
  PENDING: { label: 'Pending', cls: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-500' },
  INVITED: { label: 'Invited', cls: 'bg-cyan-50 text-cyan-700 border-cyan-200', dot: 'bg-cyan-500' },
};

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

const PAYMENT_STATUS_CONFIG: Record<string, { label: string; cls: string; dot: string }> = {
  PENDING: { label: 'Pending', cls: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-500' },
  SUCCESS: { label: 'Success', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
  FAILED: { label: 'Failed', cls: 'bg-red-50 text-red-700 border-red-200', dot: 'bg-red-500' },
  REFUNDED: { label: 'Refunded', cls: 'bg-slate-50 text-slate-700 border-slate-200', dot: 'bg-slate-500' },
  PARTIALLY_REFUNDED: { label: 'Partial refund', cls: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-500' },
};

const WITHDRAWAL_STATUS_CONFIG: Record<string, { label: string; cls: string; dot: string }> = {
  PENDING: { label: 'Pending', cls: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-500' },
  APPROVED: { label: 'Approved', cls: 'bg-cyan-50 text-cyan-700 border-cyan-200', dot: 'bg-cyan-500' },
  PROCESSING: { label: 'Processing', cls: 'bg-blue-50 text-blue-700 border-blue-200', dot: 'bg-blue-500' },
  COMPLETED: { label: 'Completed', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
  REJECTED: { label: 'Rejected', cls: 'bg-red-50 text-red-700 border-red-200', dot: 'bg-red-500' },
};

const REVIEW_STATUS_CONFIG: Record<string, { label: string; cls: string; dot: string }> = {
  PENDING: { label: 'Pending', cls: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-500' },
  APPROVED: { label: 'Approved', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
  REJECTED: { label: 'Rejected', cls: 'bg-red-50 text-red-700 border-red-200', dot: 'bg-red-500' },
};

const SHOP_STATUS_CONFIG: Record<string, { label: string; cls: string; dot: string }> = {
  ACTIVE: { label: 'Active', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
  SUSPENDED: { label: 'Suspended', cls: 'bg-red-50 text-red-700 border-red-200', dot: 'bg-red-500' },
  PENDING_REVIEW: { label: 'Pending review', cls: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-500' },
};

const AUDIT_ACTION_CONFIG: Record<string, { cls: string }> = {
  LOGIN: { cls: 'bg-cyan-50 text-cyan-700 border-cyan-200' },
  LOGOUT: { cls: 'bg-slate-100 text-slate-700 border-slate-200' },
  SELLER_APPROVED: { cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  SELLER_SUSPENDED: { cls: 'bg-red-50 text-red-700 border-red-200' },
  PRODUCT_APPROVED: { cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  PRODUCT_REJECTED: { cls: 'bg-red-50 text-red-700 border-red-200' },
  WITHDRAWAL_APPROVED: { cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  WITHDRAWAL_REJECTED: { cls: 'bg-red-50 text-red-700 border-red-200' },
  USER_SUSPENDED: { cls: 'bg-amber-50 text-amber-700 border-amber-200' },
  SETTINGS_UPDATED: { cls: 'bg-violet-50 text-violet-700 border-violet-200' },
  DEFAULT: { cls: 'bg-slate-100 text-slate-700 border-slate-200' },
};

/* ---------------- Sidebar config ---------------- */

const SIDEBAR_SECTIONS: SidebarSection[] = [
  {
    title: 'Operations',
    items: [
      { id: 'overview', label: 'Overview', icon: LayoutDashboard, description: 'Platform snapshot' },
      { id: 'users', label: 'Users', icon: Users, description: 'All platform users' },
      { id: 'sellers', label: 'Sellers', icon: Store, description: 'Manage seller shops' },
      { id: 'orders', label: 'Orders', icon: ShoppingCart, description: 'All orders' },
    ],
  },
  {
    title: 'Catalog',
    items: [
      { id: 'products', label: 'Products', icon: Package, description: 'Moderate products' },
      { id: 'reviews', label: 'Reviews', icon: Star, description: 'Moderate reviews' },
      { id: 'categories', label: 'Categories', icon: ListTree, description: 'Category tree' },
    ],
  },
  {
    title: 'Finance',
    items: [
      { id: 'payments', label: 'Payments', icon: CreditCard, description: 'All payment records' },
      { id: 'returns', label: 'Returns & Refunds', icon: RotateCcw, description: 'Return requests' },
      { id: 'withdrawals', label: 'Withdrawals', icon: Wallet, description: 'Payout requests' },
    ],
  },
  {
    title: 'System',
    items: [
      { id: 'audit', label: 'Audit Logs', icon: ScrollText, description: 'Activity log' },
      { id: 'settings', label: 'Settings', icon: Settings, description: 'Platform config' },
    ],
  },
];

const ALL_TABS = SIDEBAR_SECTIONS.flatMap((s) => s.items);

/* ---------------- Mock data ---------------- */

const DAY = 86400000;
const NOW = Date.now();

const DEMO_RETURNS = [
  {
    id: 'ret-001',
    code: 'RTN-2024-001',
    orderCode: 'CH-100213',
    buyer: 'Nguyen Van A',
    seller: 'BoardForge Studio',
    product: 'STM32F4 Discovery Kit',
    reason: 'Product not as described — received STM32F1 variant instead.',
    status: 'PENDING_SELLER_APPROVAL',
    amount: 590000,
    requestedAt: new Date(NOW - 1 * DAY).toISOString(),
    timeline: [
      { status: 'Return requested', at: new Date(NOW - 1 * DAY).toISOString(), done: true },
      { status: 'Awaiting seller approval', at: new Date(NOW - 23 * 3600000).toISOString(), done: true, current: true },
      { status: 'Seller approves return', at: null, done: false },
      { status: 'Refund processed', at: null, done: false },
    ],
  },
  {
    id: 'ret-002',
    code: 'RTN-2024-002',
    orderCode: 'CH-100208',
    buyer: 'Tran Thi B',
    seller: 'CircuitKit Co.',
    product: 'KiCad 9 — IoT Sensor Hub Project',
    reason: 'Digital download link expired before I could download the file.',
    status: 'REFUND_PROCESSED',
    amount: 1290000,
    requestedAt: new Date(NOW - 6 * DAY).toISOString(),
    timeline: [
      { status: 'Return requested', at: new Date(NOW - 6 * DAY).toISOString(), done: true },
      { status: 'Seller approved return', at: new Date(NOW - 5 * DAY).toISOString(), done: true },
      { status: 'Refund processed', at: new Date(NOW - 4 * DAY).toISOString(), done: true, current: true },
    ],
  },
  {
    id: 'ret-003',
    code: 'RTN-2024-003',
    orderCode: 'CH-100201',
    buyer: 'Le Van C',
    seller: 'ChipForge',
    product: '0.96" OLED Display Module',
    reason: 'Item arrived with broken glass.',
    status: 'SELLER_REJECTED',
    amount: 75000,
    requestedAt: new Date(NOW - 4 * DAY).toISOString(),
    timeline: [
      { status: 'Return requested', at: new Date(NOW - 4 * DAY).toISOString(), done: true },
      { status: 'Seller rejected', at: new Date(NOW - 3 * DAY).toISOString(), done: true, current: true },
      { status: 'Buyer may escalate', at: null, done: false },
    ],
  },
];

const DEMO_REVIEWS_PENDING = [
  {
    id: 'rv-001',
    productName: 'ESP32-WROOM-32 DevKit v1.2',
    productId: 'p1',
    user: 'nguyen.minh.kh',
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=nmk',
    rating: 5,
    comment: 'Excellent build quality, perfect for prototyping IoT projects. Documentation is thorough and well-translated.',
    status: 'PENDING',
    createdAt: new Date(NOW - 2 * 3600000).toISOString(),
  },
  {
    id: 'rv-002',
    productName: '4-Layer PCB Stack — STM32 Reference Design',
    productId: 'p2',
    user: 'electronics_pro',
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=ep',
    rating: 4,
    comment: 'Great reference design but the silkscreen on top layer had a minor misalignment. Otherwise solid work.',
    status: 'PENDING',
    createdAt: new Date(NOW - 6 * 3600000).toISOString(),
  },
  {
    id: 'rv-003',
    productName: 'KiCad 9 — IoT Sensor Hub Project',
    productId: 'p3',
    user: 'maker.vn',
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=makervn',
    rating: 5,
    comment: 'Save me a ton of time on my IoT project. Gerber files were perfect for the JLCPCB order I placed.',
    status: 'PENDING',
    createdAt: new Date(NOW - 1 * DAY).toISOString(),
  },
  {
    id: 'rv-004',
    productName: 'BME280 Sensor Module',
    productId: 'p4',
    user: 'embedded.dev',
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=emb',
    rating: 2,
    comment: 'Sensors drift after 24h continuous use. Required calibration every 4 hours in my setup.',
    status: 'PENDING',
    createdAt: new Date(NOW - 2 * DAY).toISOString(),
  },
];

const DEMO_CATEGORIES = [
  { id: 'cat1', name: 'Development Boards', slug: 'dev-boards', parentId: null, parentName: null, productCount: 248, icon: 'Cpu' },
  { id: 'cat2', name: 'Microcontrollers', slug: 'mcu', parentId: 'cat1', parentName: 'Development Boards', productCount: 86, icon: 'Cpu' },
  { id: 'cat3', name: 'Sensors', slug: 'sensors', parentId: null, parentName: null, productCount: 312, icon: 'Layers' },
  { id: 'cat4', name: 'Temperature & Humidity', slug: 'temp-humidity', parentId: 'cat3', parentName: 'Sensors', productCount: 124, icon: 'Layers' },
  { id: 'cat5', name: 'PCB Designs', slug: 'pcb-designs', parentId: null, parentName: null, productCount: 167, icon: 'Cog' },
  { id: 'cat6', name: '4-Layer Stack', slug: '4-layer', parentId: 'cat5', parentName: 'PCB Designs', productCount: 42, icon: 'Cog' },
  { id: 'cat7', name: 'KiCad Templates', slug: 'kicad-templates', parentId: 'cat5', parentName: 'PCB Designs', productCount: 89, icon: 'FileCode' },
  { id: 'cat8', name: 'Firmware Bundles', slug: 'firmware', parentId: null, parentName: null, productCount: 56, icon: 'Package' },
];

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
  accent?: 'cyan' | 'teal' | 'aqua' | 'amber' | 'rose' | 'slate';
  hint?: string;
}) {
  const accentMap: Record<string, string> = {
    cyan: 'from-cyan-500 to-cyan-400 shadow-[0_8px_18px_-8px_rgba(6,182,212,0.55)]',
    teal: 'from-teal-500 to-teal-400 shadow-[0_8px_18px_-8px_rgba(45,212,191,0.55)]',
    aqua: 'from-cyan-400 to-teal-300 shadow-[0_8px_18px_-8px_rgba(34,211,238,0.55)]',
    amber: 'from-amber-500 to-amber-400 shadow-[0_8px_18px_-8px_rgba(245,158,11,0.55)]',
    rose: 'from-rose-500 to-rose-400 shadow-[0_8px_18px_-8px_rgba(244,63,94,0.55)]',
    slate: 'from-slate-700 to-slate-600 shadow-[0_8px_18px_-8px_rgba(51,65,85,0.55)]',
  };
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="relative overflow-hidden rounded-xl border border-slate-200 bg-white p-4 hover:shadow-md transition-shadow"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">{label}</p>
          <p className="mt-1 text-xl sm:text-2xl font-bold text-slate-900 tracking-tight tabular-nums truncate">{value}</p>
          {hint && <p className="mt-0.5 text-[11px] text-slate-500">{hint}</p>}
          {trend !== undefined && (
            <div className="mt-1.5 inline-flex items-center gap-1 text-[11px] font-semibold">
              {trend >= 0 ? (
                <span className="inline-flex items-center gap-0.5 text-emerald-600">
                  <ArrowUpRight className="h-3 w-3" />
                  +{trend.toFixed(1)}%
                </span>
              ) : (
                <span className="inline-flex items-center gap-0.5 text-rose-600">
                  <ArrowDownRight className="h-3 w-3" />
                  {trend.toFixed(1)}%
                </span>
              )}
              <span className="text-slate-400 font-normal">vs last month</span>
            </div>
          )}
        </div>
        <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br text-white', accentMap[accent])}>
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
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-500 to-teal-400 text-white shadow-[0_6px_14px_-6px_rgba(6,182,212,0.5)]">
          <Icon className="h-4.5 w-4.5" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-foreground">{title}</h2>
          {description && <p className="text-xs text-muted-foreground">{description}</p>}
        </div>
      </div>
      {action}
    </div>
  );
}

function FilterPills({
  options,
  active,
  onSelect,
}: {
  options: { id: string; label: string; count?: number }[];
  active: string;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {options.map((opt) => (
        <button
          key={opt.id}
          onClick={() => onSelect(opt.id)}
          className={cn(
            'inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-medium transition-colors',
            active === opt.id
              ? 'bg-cyan-500 text-white border-cyan-500 shadow-sm'
              : 'bg-white text-slate-600 border-slate-200 hover:border-cyan-200 hover:text-cyan-700',
          )}
        >
          {opt.label}
          {opt.count !== undefined && (
            <span className={cn('rounded-full px-1.5 text-[10px] font-semibold', active === opt.id ? 'bg-white/20' : 'bg-slate-100 text-slate-600')}>
              {opt.count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

function SearchBox({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="relative w-full sm:w-72">
      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
      <Input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder ?? 'Search...'}
        className="pl-8 h-8 text-xs"
      />
    </div>
  );
}

function PaginationFooter({
  total,
  shown,
  label = 'rows',
}: {
  total: number;
  shown: number;
  label?: string;
}) {
  return (
    <div className="flex items-center justify-between border-t border-slate-100 px-3 py-2 text-xs text-slate-500">
      <span>
        Showing <span className="font-semibold text-slate-700">{shown}</span> of{' '}
        <span className="font-semibold text-slate-700">{total}</span> {label}
      </span>
      <div className="flex items-center gap-1">
        <Button size="sm" variant="outline" className="h-7 px-2 text-[11px]" disabled>
          Prev
        </Button>
        <Button size="sm" variant="outline" className="h-7 px-2 text-[11px] bg-cyan-50 border-cyan-200 text-cyan-700" disabled>
          1
        </Button>
        <Button size="sm" variant="outline" className="h-7 px-2 text-[11px]" disabled>
          Next
        </Button>
      </div>
    </div>
  );
}

function SortHeader({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <TableHead className={cn('text-[11px] font-semibold uppercase tracking-wider text-slate-500', className)}>
      <span className="inline-flex items-center gap-1">
        {children}
        <ChevronDown className="h-3 w-3 opacity-40" />
      </span>
    </TableHead>
  );
}

/* ============================================================
   Tab 1: Overview
   ============================================================ */

function OverviewTab({
  data,
  goTab,
}: {
  data: any;
  goTab: (id: TabId) => void;
}) {
  const metrics = data?.metrics ?? {};
  const chart = data?.chart ?? [];
  const byType = data?.byType ?? [];
  const topSellers = data?.topSellers ?? [];
  const recentProducts = data?.recentProducts ?? [];
  const recentOrders = data?.recentOrders ?? [];

  const kpis = [
    { label: 'GMV', value: formatVNDCompact(metrics.gmv ?? 0), icon: DollarSign, accent: 'cyan' as const, trend: 12.4, hint: 'Gross merchandise value' },
    { label: 'Platform Revenue', value: formatVNDCompact(metrics.commission ?? 0), icon: TrendingUp, accent: 'teal' as const, trend: 14.8, hint: 'Commission earned' },
    { label: 'Total Orders', value: String(metrics.totalOrders ?? 0), icon: ShoppingCart, accent: 'aqua' as const, trend: 8.2 },
    { label: 'Total Users', value: String(metrics.totalUsers ?? 0), icon: Users, accent: 'amber' as const, trend: 6.4 },
    { label: 'Total Sellers', value: String(metrics.totalSellers ?? 0), icon: Store, accent: 'cyan' as const, trend: 4.1 },
    { label: 'Total Products', value: String(metrics.totalProducts ?? 0), icon: Package, accent: 'teal' as const, trend: 9.7 },
    { label: 'Pending Withdrawals', value: String(metrics.pendingWithdrawals ?? 0), icon: Wallet, accent: 'rose' as const, hint: 'Awaiting approval' },
    { label: 'Refunds', value: formatVNDCompact(metrics.refunds ?? 0), icon: RotateCcw, accent: 'slate' as const, trend: 0, hint: 'YTD' },
  ];

  const pieData = byType.map((b: any, i: number) => ({
    name: b.productType,
    value: b.count,
    color: PIE_COLORS[i % PIE_COLORS.length],
  }));

  return (
    <div className="space-y-5">
      <SectionHeader
        icon={LayoutDashboard}
        title="Platform Overview"
        description="Real-time metrics across all markets"
        action={
          <Badge variant="outline" className="bg-cyan-50 text-cyan-700 border-cyan-200 gap-1.5">
            <Activity className="h-3 w-3" />
            Live · updated 30s ago
          </Badge>
        }
      />

      {/* 8 KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {kpis.map((kpi) => (
          <StatCard key={kpi.label} {...kpi} />
        ))}
      </div>

      {/* Charts row */}
      <div className="grid lg:grid-cols-3 gap-4">
        {/* GMV + Commission 12-month */}
        <Card className="lg:col-span-2 border-slate-200 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-cyan-600" />
              GMV &amp; Platform Commission
              <span className="text-xs font-normal text-slate-400">· 12 months</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={chart} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="gmvGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#06b6d4" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#06b6d4" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="commGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2dd4bf" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#2dd4bf" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} tickFormatter={(v) => formatVNDCompact(v)} />
                <Tooltip content={<ChartTooltip valueFormatter={(v: number) => formatVND(v)} />} />
                <Area type="monotone" dataKey="gmv" name="GMV" stroke="#06b6d4" strokeWidth={2} fill="url(#gmvGrad)" />
                <Area type="monotone" dataKey="commission" name="Commission" stroke="#2dd4bf" strokeWidth={2} fill="url(#commGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Sales by type */}
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <PieIcon className="h-4 w-4 text-teal-600" />
              Sales by Product Type
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <ResponsiveContainer width="100%" height={180}>
              <RPieChart>
                <Pie
                  data={pieData.length ? pieData : [{ name: 'N/A', value: 1, color: '#cbd5e1' }]}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={75}
                  paddingAngle={2}
                >
                  {(pieData.length ? pieData : [{ color: '#cbd5e1' }]).map((entry: any, i: number) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<ChartTooltip />} />
              </RPieChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap items-center justify-center gap-3 mt-1">
              {pieData.map((p: any, i: number) => (
                <div key={i} className="flex items-center gap-1.5 text-[11px]">
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: p.color }} />
                  <span className="font-medium text-slate-700">{p.name}</span>
                  <span className="text-slate-400">· {p.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Orders over time bar chart */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-slate-700 flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-cyan-600" />
            Orders Over Time
            <span className="text-xs font-normal text-slate-400">· last 12 months</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={chart} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <Tooltip content={<ChartTooltip />} cursor={{ fill: '#06b6d40d' }} />
              <Bar dataKey="orders" name="Orders" fill="#06b6d4" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Top sellers + Recent orders + Recent products */}
      <div className="grid lg:grid-cols-3 gap-4">
        {/* Top sellers */}
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <Store className="h-4 w-4 text-cyan-600" />
              Top Sellers
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-2">
              {topSellers.length === 0 && (
                <p className="text-xs text-slate-400 text-center py-6">No seller data yet</p>
              )}
              {topSellers.slice(0, 5).map((s: any, i: number) => (
                <div key={s.id ?? i} className="flex items-center gap-3 rounded-lg p-2 hover:bg-slate-50 transition-colors">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-cyan-50 text-cyan-700 text-[11px] font-bold">
                    {i + 1}
                  </span>
                  <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-slate-100">
                    {s.logoUrl ? (
                      <Image src={s.logoUrl} alt={s.name} fill className="object-cover" unoptimized />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-[10px] font-bold text-slate-500">
                        {initials(s.name ?? '')}
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <p className="text-xs font-semibold text-slate-800 truncate">{s.name}</p>
                      {s.verified && <ShieldCheck className="h-3 w-3 text-emerald-500 shrink-0" />}
                    </div>
                    <p className="text-[11px] text-slate-500">
                      {s.completedOrders ?? 0} orders · {s.productCount ?? 0} products
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-0.5">
                      <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                      <span className="text-xs font-semibold text-slate-700">{(s.rating ?? 0).toFixed(1)}</span>
                    </div>
                    <p className="text-[10px] text-slate-400">{s.ratingCount ?? 0} reviews</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent orders */}
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <ShoppingCart className="h-4 w-4 text-cyan-600" />
              Recent Orders
            </CardTitle>
            <Button size="sm" variant="ghost" className="h-7 px-2 text-[11px] text-cyan-700 hover:bg-cyan-50" onClick={() => goTab('orders')}>
              View all
              <ChevronRight className="h-3 w-3" />
            </Button>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-2">
              {recentOrders.length === 0 && (
                <p className="text-xs text-slate-400 text-center py-6">No orders yet</p>
              )}
              {recentOrders.slice(0, 5).map((o: any, i: number) => (
                <div key={o.id ?? i} className="flex items-center gap-2 rounded-lg p-2 hover:bg-slate-50 transition-colors">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-mono font-semibold text-slate-800">{o.code}</p>
                    <p className="text-[11px] text-slate-500 truncate">
                      {o.user?.name ?? '—'} · {timeAgo(o.createdAt)}
                    </p>
                  </div>
                  <StatusPill status={o.status} config={ORDER_STATUS_CONFIG} />
                  <span className="text-xs font-semibold text-slate-700 tabular-nums">
                    {formatVNDCompact(o.grandTotal ?? o.subtotal ?? 0)}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent products */}
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <Package className="h-4 w-4 text-cyan-600" />
              Recent Products
            </CardTitle>
            <Button size="sm" variant="ghost" className="h-7 px-2 text-[11px] text-cyan-700 hover:bg-cyan-50" onClick={() => goTab('products')}>
              View all
              <ChevronRight className="h-3 w-3" />
            </Button>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-2">
              {recentProducts.length === 0 && (
                <p className="text-xs text-slate-400 text-center py-6">No products yet</p>
              )}
              {recentProducts.slice(0, 5).map((p: any, i: number) => (
                <div key={p.id ?? i} className="flex items-center gap-2 rounded-lg p-2 hover:bg-slate-50 transition-colors">
                  <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-md border border-slate-200 bg-slate-100">
                    {p.images?.[0]?.url ? (
                      <Image src={p.images[0].url} alt={p.name} fill className="object-cover" unoptimized />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <Package className="h-4 w-4 text-slate-400" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-slate-800 truncate">{p.name}</p>
                    <p className="text-[11px] text-slate-500 truncate">{p.shop?.name ?? '—'}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-semibold text-slate-700 tabular-nums">{formatVNDCompact(p.price ?? 0)}</p>
                    <p className="text-[10px] text-slate-400">{p.soldCount ?? 0} sold</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

/* ============================================================
   Tab 2: Users
   ============================================================ */

function UsersTab({ toast, goTab }: { toast: any; goTab: (id: TabId) => void }) {
  const [roleFilter, setRoleFilter] = useState('all');
  const [search, setSearch] = useState('');
  const { data } = useAdminUsers(roleFilter === 'all' ? undefined : roleFilter);
  const users: any[] = (data?.items ?? []) as any[];

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    if (!s) return users;
    return users.filter((u) =>
      [u.name, u.email].some((f) => String(f ?? '').toLowerCase().includes(s)),
    );
  }, [users, search]);

  const roleOptions = [
    { id: 'all', label: 'All' },
    { id: 'BUYER', label: 'Buyer' },
    { id: 'SELLER', label: 'Seller' },
    { id: 'ADMIN', label: 'Admin' },
    { id: 'SUPPORT', label: 'Support' },
    { id: 'MODERATOR', label: 'Moderator' },
    { id: 'ACCOUNTANT', label: 'Accountant' },
  ];

  const handleSuspend = (u: any, suspend: boolean) => {
    toast({
      title: suspend ? 'User suspended' : 'User activated',
      description: `${u.name} (${u.email}) is now ${suspend ? 'suspended' : 'active'}.`,
      variant: suspend ? 'destructive' : 'default',
    });
  };

  return (
    <div className="space-y-4">
      <SectionHeader
        icon={Users}
        title="Users"
        description={`${filtered.length} of ${users.length} users shown`}
        action={<SearchBox value={search} onChange={setSearch} placeholder="Search by name or email..." />}
      />

      <FilterPills options={roleOptions} active={roleFilter} onSelect={setRoleFilter} />

      <Card className="border-slate-200 shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50/60 hover:bg-slate-50/60">
              <SortHeader>User</SortHeader>
              <SortHeader>Email</SortHeader>
              <SortHeader>Role</SortHeader>
              <SortHeader>Status</SortHeader>
              <SortHeader>Joined</SortHeader>
              <TableHead className="text-right text-[11px] font-semibold uppercase tracking-wider text-slate-500">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-10">
                  <EmptyState
                    icon={Users}
                    title="No users found"
                    description={search ? 'Try adjusting your search query.' : 'No users match this filter.'}
                    cta={search ? 'Clear search' : undefined}
                    onCta={search ? () => setSearch('') : undefined}
                  />
                </TableCell>
              </TableRow>
            )}
            {filtered.map((u) => {
              const roleCfg = USER_ROLE_CONFIG[u.role] ?? USER_ROLE_CONFIG.BUYER;
              const status = u.status ?? 'ACTIVE';
              return (
                <TableRow key={u.id} className="hover:bg-cyan-50/30">
                  <TableCell>
                    <div className="flex items-center gap-2.5">
                      <Avatar className="h-8 w-8 border border-slate-200">
                        {u.avatarUrl && <AvatarImage src={u.avatarUrl} alt={u.name} />}
                        <AvatarFallback className="bg-cyan-50 text-cyan-700 text-[10px] font-semibold">
                          {initials(u.name ?? u.email ?? 'U')}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-slate-800 truncate">{u.name}</p>
                        <p className="text-[11px] text-slate-500">ID: {u.id.slice(-8)}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-xs text-slate-600 font-mono">{u.email}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={cn('gap-1 text-[11px]', roleCfg.cls)}>
                      {roleCfg.label}
                    </Badge>
                  </TableCell>
                  <TableCell><StatusPill status={status} config={USER_STATUS_CONFIG} /></TableCell>
                  <TableCell className="text-xs text-slate-600">
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3 text-slate-400" />
                      {formatDate(u.createdAt)}
                    </div>
                    <p className="text-[10px] text-slate-400">{timeAgo(u.createdAt)}</p>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="inline-flex items-center gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 w-7 p-0 text-cyan-700 hover:bg-cyan-50"
                        onClick={() => toast({ title: 'View profile', description: `Opening ${u.name}'s profile...` })}
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </Button>
                      {status === 'SUSPENDED' ? (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 px-2 text-[11px] border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                          onClick={() => handleSuspend(u, false)}
                        >
                          Activate
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 px-2 text-[11px] border-red-200 text-red-700 hover:bg-red-50"
                          onClick={() => handleSuspend(u, true)}
                        >
                          Suspend
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
        <PaginationFooter total={users.length} shown={filtered.length} label="users" />
      </Card>
      <p className="text-[11px] text-slate-400">
        Tip: Switch role filter or refine search ·{' '}
        <button onClick={() => goTab('audit')} className="text-cyan-700 hover:underline">View audit log</button>
      </p>
    </div>
  );
}

/* ============================================================
   Tab 3: Sellers
   ============================================================ */

function SellersTab({ toast, queryClient }: { toast: any; queryClient: any }) {
  const [verifiedFilter, setVerifiedFilter] = useState('all');
  const { data } = useAdminSellers();
  const sellers: any[] = (data?.items ?? []) as any[];

  const filtered = useMemo(() => {
    if (verifiedFilter === 'all') return sellers;
    if (verifiedFilter === 'verified') return sellers.filter((s) => s.shop?.verified);
    if (verifiedFilter === 'unverified') return sellers.filter((s) => !s.shop?.verified);
    if (verifiedFilter === 'suspended') return sellers.filter((s) => s.shop?.status === 'SUSPENDED');
    return sellers;
  }, [sellers, verifiedFilter]);

  const filterOptions = [
    { id: 'all', label: 'All', count: sellers.length },
    { id: 'verified', label: 'Verified', count: sellers.filter((s) => s.shop?.verified).length },
    { id: 'unverified', label: 'Unverified', count: sellers.filter((s) => !s.shop?.verified).length },
    { id: 'suspended', label: 'Suspended', count: sellers.filter((s) => s.shop?.status === 'SUSPENDED').length },
  ];

  const handleAction = async (shopId: string, action: 'APPROVE' | 'SUSPEND' | 'REACTIVATE', shopName: string) => {
    try {
      const res = await fetch('/api/v1/admin/sellers', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shopId, action }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.message);
      toast({
        title: `Shop ${action.toLowerCase()}`,
        description: `${shopName} is now ${action === 'APPROVE' ? 'approved & active' : action === 'SUSPEND' ? 'suspended' : 'reactivated'}.`,
        variant: action === 'SUSPEND' ? 'destructive' : 'default',
      });
      queryClient.invalidateQueries({ queryKey: ['admin-sellers'] });
      queryClient.invalidateQueries({ queryKey: ['admin-analytics'] });
    } catch (e: any) {
      toast({ title: 'Action failed', description: e.message, variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-4">
      <SectionHeader
        icon={Store}
        title="Sellers"
        description={`${filtered.length} of ${sellers.length} sellers`}
        action={
          <Badge variant="outline" className="bg-cyan-50 text-cyan-700 border-cyan-200">
            {sellers.filter((s) => !s.shop?.verified && s.shop?.status !== 'SUSPENDED').length} pending review
          </Badge>
        }
      />

      <FilterPills options={filterOptions} active={verifiedFilter} onSelect={setVerifiedFilter} />

      <Card className="border-slate-200 shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50/60 hover:bg-slate-50/60">
              <SortHeader>Shop</SortHeader>
              <SortHeader>Seller</SortHeader>
              <SortHeader>Verified</SortHeader>
              <SortHeader>Completed</SortHeader>
              <SortHeader>Rating</SortHeader>
              <SortHeader>Status</SortHeader>
              <TableHead className="text-right text-[11px] font-semibold uppercase tracking-wider text-slate-500">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-10">
                  <EmptyState icon={Store} title="No sellers" description="No sellers match this filter." />
                </TableCell>
              </TableRow>
            )}
            {filtered.map((s) => {
              const shop = s.shop;
              const status = shop?.status ?? 'PENDING_REVIEW';
              return (
                <TableRow key={s.id} className="hover:bg-cyan-50/30">
                  <TableCell>
                    <div className="flex items-center gap-2.5">
                      <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-slate-100">
                        {shop?.logoUrl ? (
                          <Image src={shop.logoUrl} alt={shop.name} fill className="object-cover" unoptimized />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-[10px] font-bold text-slate-500">
                            {initials(shop?.name ?? 'S')}
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-slate-800 truncate">{shop?.name ?? '—'}</p>
                        <p className="text-[11px] text-slate-500 truncate">{shop?.slug ?? '—'}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <p className="text-xs font-medium text-slate-700">{s.name}</p>
                    <p className="text-[11px] text-slate-500 font-mono">{s.email}</p>
                  </TableCell>
                  <TableCell>
                    {shop?.verified ? (
                      <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 gap-1">
                        <Check className="h-3 w-3" />
                        Verified
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 gap-1">
                        <Clock className="h-3 w-3" />
                        Pending
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-xs font-semibold text-slate-700 tabular-nums">
                    {shop?.completedOrders ?? 0}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                      <span className="text-xs font-semibold text-slate-700">{(shop?.rating ?? 0).toFixed(1)}</span>
                      <span className="text-[10px] text-slate-400">({shop?.ratingCount ?? 0})</span>
                    </div>
                  </TableCell>
                  <TableCell><StatusPill status={status} config={SHOP_STATUS_CONFIG} /></TableCell>
                  <TableCell className="text-right">
                    <div className="inline-flex items-center gap-1">
                      {!shop?.verified && status !== 'SUSPENDED' && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 px-2 text-[11px] border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                          onClick={() => handleAction(shop?.id, 'APPROVE', shop?.name ?? 'Shop')}
                        >
                          <Check className="h-3 w-3" />
                          Approve
                        </Button>
                      )}
                      {status !== 'SUSPENDED' && shop?.verified && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 px-2 text-[11px] border-red-200 text-red-700 hover:bg-red-50"
                          onClick={() => handleAction(shop?.id, 'SUSPEND', shop?.name ?? 'Shop')}
                        >
                          <Lock className="h-3 w-3" />
                          Suspend
                        </Button>
                      )}
                      {status === 'SUSPENDED' && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 px-2 text-[11px] border-cyan-200 text-cyan-700 hover:bg-cyan-50"
                          onClick={() => handleAction(shop?.id, 'REACTIVATE', shop?.name ?? 'Shop')}
                        >
                          <RotateCcw className="h-3 w-3" />
                          Reactivate
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
        <PaginationFooter total={sellers.length} shown={filtered.length} label="sellers" />
      </Card>

      {/* Specializations summary card */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {filtered.slice(0, 3).map((s) => (
          <Card key={s.id} className="border-slate-200 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="relative h-8 w-8 overflow-hidden rounded-lg border border-slate-200 bg-slate-100">
                  {s.shop?.logoUrl ? (
                    <Image src={s.shop.logoUrl} alt={s.shop.name} fill className="object-cover" unoptimized />
                  ) : null}
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-800">{s.shop?.name}</p>
                  <p className="text-[11px] text-slate-500">{s.shop?.slug}</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-1 mt-2">
                {(s.shop?.specializations ?? ['PCB Design', 'Embedded', 'Hardware Kits']).slice(0, 3).map((sp: string, i: number) => (
                  <Badge key={i} variant="outline" className="bg-cyan-50 text-cyan-700 border-cyan-200 text-[10px]">
                    {sp}
                  </Badge>
                ))}
                {s.shop?.verified && <VerifiedBadge className="text-[10px]" />}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

/* ============================================================
   Tab 4: Products
   ============================================================ */

function ProductsTab({ toast, goProduct }: { toast: any; goProduct: (slug: string) => void }) {
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [moderation, setModeration] = useState<{ product: any; action: 'APPROVE' | 'REJECT' | 'SUSPEND' | 'FEATURE' | 'UNFEATURE' } | null>(null);

  // Debounce search input (300ms) to reduce API calls
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, 300);
    return () => clearTimeout(t);
  }, [search]);

  const { data } = useAdminProducts({
    status: statusFilter !== 'all' ? statusFilter : undefined,
    productType: typeFilter !== 'all' ? typeFilter : undefined,
    q: debouncedSearch || undefined,
  });
  const products: any[] = (data?.items ?? []) as any[];

  const filtered = products; // API already filters

  const typeOptions = [
    { id: 'all', label: 'All types' },
    { id: 'PHYSICAL', label: 'Physical' },
    { id: 'DIGITAL', label: 'Digital' },
    { id: 'SERVICE', label: 'Service' },
  ];
  const statusOptions = [
    { id: 'all', label: 'All status' },
    { id: 'ACTIVE', label: 'Active' },
    { id: 'DRAFT', label: 'Draft' },
    { id: 'PENDING_REVIEW', label: 'In review' },
    { id: 'REJECTED', label: 'Rejected' },
  ];

  const handleAction = (p: any, action: 'approve' | 'reject') => {
    setModeration({
      product: p,
      action: action === 'approve' ? 'APPROVE' : 'REJECT',
    });
  };

  return (
    <div className="space-y-4">
      <SectionHeader
        icon={Package}
        title="Products"
        description={`${filtered.length} of ${products.length} products`}
        action={<SearchBox value={search} onChange={setSearch} placeholder="Search products..." />}
      />

      <div className="flex flex-wrap items-center justify-between gap-2">
        <FilterPills options={typeOptions} active={typeFilter} onSelect={setTypeFilter} />
        <FilterPills options={statusOptions} active={statusFilter} onSelect={setStatusFilter} />
      </div>

      <Card className="border-slate-200 shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50/60 hover:bg-slate-50/60">
              <SortHeader>Product</SortHeader>
              <SortHeader>Type</SortHeader>
              <SortHeader className="text-right">Price</SortHeader>
              <SortHeader className="text-right">Sold</SortHeader>
              <SortHeader>Status</SortHeader>
              <SortHeader>Shop</SortHeader>
              <TableHead className="text-right text-[11px] font-semibold uppercase tracking-wider text-slate-500">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-10">
                  <EmptyState icon={Package} title="No products found" description="Try adjusting filters or search query." />
                </TableCell>
              </TableRow>
            )}
            {filtered.map((p) => (
              <TableRow key={p.id} className="hover:bg-cyan-50/30">
                <TableCell>
                  <div className="flex items-center gap-2.5">
                    <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-md border border-slate-200 bg-slate-100">
                      {p.images?.[0]?.url ? (
                        <Image src={p.images[0].url} alt={p.name} fill className="object-cover" unoptimized />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center">
                          <Package className="h-4 w-4 text-slate-400" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 max-w-[220px]">
                      <button
                        onClick={() => goProduct(p.slug)}
                        className="text-xs font-semibold text-slate-800 truncate hover:text-cyan-700 hover:underline text-left"
                      >
                        {p.name}
                      </button>
                      <p className="text-[11px] text-slate-500 font-mono truncate">{p.slug}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell><ProductTypeBadge type={p.productType} className="text-[10px]" /></TableCell>
                <TableCell className="text-right text-xs font-semibold text-slate-700 tabular-nums">
                  {formatVND(p.price)}
                </TableCell>
                <TableCell className="text-right text-xs text-slate-600 tabular-nums">{p.soldCount ?? 0}</TableCell>
                <TableCell>
                  <StatusPill status={p.status ?? 'ACTIVE'} config={{
                    ACTIVE: { label: 'Active', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
                    DRAFT: { label: 'Draft', cls: 'bg-slate-50 text-slate-700 border-slate-200', dot: 'bg-slate-400' },
                    PENDING_REVIEW: { label: 'In review', cls: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-500' },
                    REJECTED: { label: 'Rejected', cls: 'bg-red-50 text-red-700 border-red-200', dot: 'bg-red-500' },
                    DISCONTINUED: { label: 'Discontinued', cls: 'bg-slate-50 text-slate-700 border-slate-200', dot: 'bg-slate-500' },
                  }} />
                </TableCell>
                <TableCell className="text-xs text-slate-600">{p.shop?.name ?? '—'}</TableCell>
                <TableCell className="text-right">
                  <div className="inline-flex items-center gap-1">
                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-cyan-700 hover:bg-cyan-50" onClick={() => goProduct(p.slug)} title="View product">
                      <Eye className="h-3.5 w-3.5" />
                    </Button>
                    {p.isFeatured ? (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 w-7 p-0 text-amber-500 hover:bg-amber-50"
                        onClick={() => setModeration({ product: p, action: 'UNFEATURE' })}
                        title="Remove feature"
                      >
                        <Star className="h-3.5 w-3.5 fill-amber-400" />
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 w-7 p-0 text-slate-400 hover:bg-amber-50 hover:text-amber-500"
                        onClick={() => setModeration({ product: p, action: 'FEATURE' })}
                        title="Feature product"
                      >
                        <Star className="h-3.5 w-3.5" />
                      </Button>
                    )}
                    {(p.status ?? 'ACTIVE') !== 'ACTIVE' && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 px-2 text-[11px] border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                        onClick={() => handleAction(p, 'approve')}
                      >
                        <Check className="h-3 w-3" />
                        Approve
                      </Button>
                    )}
                    {(p.status ?? 'ACTIVE') === 'ACTIVE' && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 px-2 text-[11px] border-red-200 text-red-700 hover:bg-red-50"
                        onClick={() => handleAction(p, 'reject')}
                      >
                        <X className="h-3 w-3" />
                        Reject
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <PaginationFooter total={products.length} shown={filtered.length} label="products" />
      </Card>

      <ProductModerationDialog
        open={!!moderation}
        onOpenChange={(o) => !o && setModeration(null)}
        product={moderation?.product ?? null}
        action={moderation?.action ?? null}
      />
    </div>
  );
}

/* ============================================================
   Tab 5: Orders
   ============================================================ */

function OrdersTab({ toast }: { toast: any }) {
  const [statusFilter, setStatusFilter] = useState('all');
  const [expanded, setExpanded] = useState<string | null>(null);
  const { data } = useOrders(undefined, 'admin');
  const orders: any[] = (data ?? []) as any[];

  const filtered = useMemo(() => {
    if (statusFilter === 'all') return orders;
    return orders.filter((o) => o.status === statusFilter);
  }, [orders, statusFilter]);

  const statusOptions = [
    { id: 'all', label: 'All', count: orders.length },
    { id: 'PENDING', label: 'Pending' },
    { id: 'PAID', label: 'Paid' },
    { id: 'CONFIRMED', label: 'Confirmed' },
    { id: 'SHIPPING', label: 'Shipping' },
    { id: 'COMPLETED', label: 'Completed' },
    { id: 'CANCELLED', label: 'Cancelled' },
  ];

  return (
    <div className="space-y-4">
      <SectionHeader
        icon={ShoppingCart}
        title="Orders"
        description={`${filtered.length} of ${orders.length} orders`}
      />

      <FilterPills options={statusOptions} active={statusFilter} onSelect={setStatusFilter} />

      <Card className="border-slate-200 shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50/60 hover:bg-slate-50/60">
              <TableHead className="w-8" />
              <SortHeader>Code</SortHeader>
              <SortHeader>Date</SortHeader>
              <SortHeader>Buyer</SortHeader>
              <SortHeader className="text-right">Items</SortHeader>
              <SortHeader className="text-right">Total</SortHeader>
              <SortHeader>Payment</SortHeader>
              <SortHeader>Status</SortHeader>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-10">
                  <EmptyState icon={ShoppingCart} title="No orders found" description="No orders match this filter." />
                </TableCell>
              </TableRow>
            )}
            {filtered.map((o) => {
              const isOpen = expanded === o.id;
              const itemCount = o.items?.length ?? 0;
              return (
                <>
                  <TableRow
                    key={o.id}
                    className="hover:bg-cyan-50/30 cursor-pointer"
                    onClick={() => setExpanded(isOpen ? null : o.id)}
                  >
                    <TableCell className="text-center">
                      <ChevronDown className={cn('h-3.5 w-3.5 text-slate-400 transition-transform', isOpen && 'rotate-180')} />
                    </TableCell>
                    <TableCell className="text-xs font-mono font-semibold text-cyan-700">{o.code}</TableCell>
                    <TableCell className="text-xs text-slate-600">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3 text-slate-400" />
                        {formatDate(o.createdAt)}
                      </div>
                      <p className="text-[10px] text-slate-400">{timeAgo(o.createdAt)}</p>
                    </TableCell>
                    <TableCell className="text-xs text-slate-700">{o.user?.name ?? '—'}</TableCell>
                    <TableCell className="text-right text-xs text-slate-600 tabular-nums">{itemCount}</TableCell>
                    <TableCell className="text-right text-xs font-semibold text-slate-800 tabular-nums">
                      {formatVND(o.grandTotal ?? o.subtotal ?? 0)}
                    </TableCell>
                    <TableCell><StatusPill status={o.paymentStatus ?? 'PENDING'} config={PAYMENT_STATUS_CONFIG} /></TableCell>
                    <TableCell><StatusPill status={o.status} config={ORDER_STATUS_CONFIG} /></TableCell>
                  </TableRow>
                  {isOpen && (
                    <TableRow key={o.id + '-exp'} className="bg-slate-50/40 hover:bg-slate-50/40">
                      <TableCell />
                      <TableCell colSpan={7} className="p-4">
                        <div className="grid md:grid-cols-3 gap-4">
                          {/* Items */}
                          <div className="md:col-span-2">
                            <p className="text-[11px] font-semibold text-slate-700 uppercase mb-2">Items</p>
                            <div className="space-y-1.5">
                              {(o.items ?? []).map((it: any) => (
                                <div key={it.id} className="flex items-center gap-2 rounded-md border border-slate-200 bg-white p-2">
                                  <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-md border border-slate-200 bg-slate-100">
                                    {it.imageUrl ? (
                                      <Image src={it.imageUrl} alt={it.name} fill className="object-cover" unoptimized />
                                    ) : (
                                      <div className="flex h-full w-full items-center justify-center">
                                        <Package className="h-3.5 w-3.5 text-slate-400" />
                                      </div>
                                    )}
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <p className="text-xs font-medium text-slate-700 truncate">{it.name}</p>
                                    <p className="text-[10px] text-slate-500 font-mono">{it.sku ?? '—'} · qty {it.quantity}</p>
                                  </div>
                                  <span className="text-xs font-semibold text-slate-700 tabular-nums">
                                    {formatVND(it.lineTotal ?? 0)}
                                  </span>
                                </div>
                              ))}
                              {(o.items ?? []).length === 0 && <p className="text-[11px] text-slate-400">No items</p>}
                            </div>
                          </div>

                          {/* Seller orders */}
                          <div>
                            <p className="text-[11px] font-semibold text-slate-700 uppercase mb-2">Seller Orders</p>
                            <div className="space-y-1.5">
                              {(o.sellerOrders ?? []).map((so: any) => (
                                <div key={so.id} className="rounded-md border border-slate-200 bg-white p-2 text-[11px]">
                                  <div className="flex items-center justify-between">
                                    <span className="font-mono font-semibold text-slate-700">{so.code}</span>
                                    <StatusPill status={so.status} config={ORDER_STATUS_CONFIG} />
                                  </div>
                                  <p className="text-slate-500 mt-1">{so.shop?.name ?? '—'}</p>
                                  <p className="text-slate-600 mt-1">
                                    Revenue: <span className="font-semibold tabular-nums">{formatVND(so.sellerRevenue ?? 0)}</span>
                                    <span className="text-slate-400"> · commission {formatVND(so.commissionAmount ?? 0)}</span>
                                  </p>
                                </div>
                              ))}
                              {(o.sellerOrders ?? []).length === 0 && <p className="text-[11px] text-slate-400">No seller orders</p>}
                            </div>

                            <p className="text-[11px] font-semibold text-slate-700 uppercase mt-3 mb-1.5">Shipment</p>
                            {o.sellerOrders?.some((so: any) => so.fulfillmentType === 'PHYSICAL') ? (
                              <div className="rounded-md border border-cyan-200 bg-cyan-50/60 p-2 text-[11px] text-cyan-800">
                                <p className="flex items-center gap-1 font-medium">
                                  <RefreshCw className="h-3 w-3" /> Auto-tracking (mock provider)
                                </p>
                                <p className="text-cyan-700 mt-0.5">Provider: GHN · ETA: 2-4 days</p>
                              </div>
                            ) : (
                              <p className="text-[11px] text-slate-400">Digital only — no shipment</p>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 mt-4 pt-3 border-t border-slate-200">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-[11px] border-cyan-200 text-cyan-700 hover:bg-cyan-50"
                            onClick={() => toast({ title: 'Order details', description: `Opening ${o.code} invoice...` })}
                          >
                            <FileText className="h-3 w-3" /> View invoice
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-[11px]"
                            onClick={() => toast({ title: 'Refund initiated', description: `Refund flow started for ${o.code}.` })}
                          >
                            <RotateCcw className="h-3 w-3" /> Issue refund
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </>
              );
            })}
          </TableBody>
        </Table>
        <PaginationFooter total={orders.length} shown={filtered.length} label="orders" />
      </Card>
    </div>
  );
}

/* ============================================================
   Tab 6: Payments
   ============================================================ */

function PaymentsTab({ toast }: { toast: any }) {
  const [providerFilter, setProviderFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const { data } = useOrders(undefined, 'admin');
  const orders: any[] = (data ?? []) as any[];

  // Flatten payments from orders
  const payments = useMemo(() => {
    const all: any[] = [];
    for (const o of orders) {
      // The admin orders route doesn't include payments; we mock from order fields if needed.
      // If `payments` array exists use it, else synthesize a single payment record.
      if (Array.isArray(o.payments) && o.payments.length > 0) {
        for (const p of o.payments) {
          all.push({ ...p, orderCode: o.code, user: o.user });
        }
      } else {
        all.push({
          id: `${o.id}-pay`,
          orderCode: o.code,
          provider: o.paymentMethod ?? 'MOCK',
          amount: o.grandTotal ?? o.subtotal ?? 0,
          status: o.paymentStatus ?? 'SUCCESS',
          transactionCode: `MOCK-${o.code}`,
          createdAt: o.createdAt,
          paidAt: o.createdAt,
          user: o.user,
        });
      }
    }
    return all;
  }, [orders]);

  const filtered = useMemo(() => {
    let arr = payments;
    if (providerFilter !== 'all') arr = arr.filter((p) => p.provider === providerFilter);
    if (statusFilter !== 'all') arr = arr.filter((p) => p.status === statusFilter);
    return arr;
  }, [payments, providerFilter, statusFilter]);

  const providers = useMemo(() => {
    const set = new Set<string>(payments.map((p) => p.provider));
    return [{ id: 'all', label: 'All providers' }, ...Array.from(set).map((p) => ({ id: p, label: p }))];
  }, [payments]);

  const statusOptions = [
    { id: 'all', label: 'All status' },
    { id: 'SUCCESS', label: 'Success' },
    { id: 'PENDING', label: 'Pending' },
    { id: 'FAILED', label: 'Failed' },
    { id: 'REFUNDED', label: 'Refunded' },
  ];

  const totalAmount = filtered.reduce((s, p) => s + (p.amount ?? 0), 0);

  return (
    <div className="space-y-4">
      <SectionHeader
        icon={CreditCard}
        title="Payments"
        description={`${filtered.length} of ${payments.length} payment records · total ${formatVNDCompact(totalAmount)}`}
      />

      <div className="flex flex-wrap items-center justify-between gap-2">
        <FilterPills options={providers} active={providerFilter} onSelect={setProviderFilter} />
        <FilterPills options={statusOptions} active={statusFilter} onSelect={setStatusFilter} />
      </div>

      <Card className="border-slate-200 shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50/60 hover:bg-slate-50/60">
              <SortHeader>Order</SortHeader>
              <SortHeader>Provider</SortHeader>
              <SortHeader className="text-right">Amount</SortHeader>
              <SortHeader>Status</SortHeader>
              <SortHeader>Transaction Code</SortHeader>
              <SortHeader>Date</SortHeader>
              <TableHead className="text-right text-[11px] font-semibold uppercase tracking-wider text-slate-500">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-10">
                  <EmptyState icon={CreditCard} title="No payments" description="No payment records match this filter." />
                </TableCell>
              </TableRow>
            )}
            {filtered.map((p) => (
              <TableRow key={p.id} className="hover:bg-cyan-50/30">
                <TableCell className="text-xs font-mono font-semibold text-cyan-700">{p.orderCode}</TableCell>
                <TableCell>
                  <Badge variant="outline" className="bg-slate-50 text-slate-700 border-slate-200 text-[11px] font-mono">
                    {p.provider}
                  </Badge>
                </TableCell>
                <TableCell className="text-right text-xs font-semibold text-slate-800 tabular-nums">{formatVND(p.amount)}</TableCell>
                <TableCell><StatusPill status={p.status} config={PAYMENT_STATUS_CONFIG} /></TableCell>
                <TableCell className="text-xs font-mono text-slate-600">{p.transactionCode ?? '—'}</TableCell>
                <TableCell className="text-xs text-slate-600">
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3 text-slate-400" />
                    {formatDate(p.paidAt ?? p.createdAt)}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 w-7 p-0 text-cyan-700 hover:bg-cyan-50"
                    onClick={() => toast({ title: 'Payment details', description: `Viewing ${p.transactionCode ?? p.id}` })}
                  >
                    <Eye className="h-3.5 w-3.5" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <PaginationFooter total={payments.length} shown={filtered.length} label="payments" />
      </Card>
    </div>
  );
}

/* ============================================================
   Tab 7: Returns & Refunds
   ============================================================ */

function ReturnsTab({ toast }: { toast: any }) {
  return (
    <div className="space-y-4">
      <SectionHeader
        icon={RotateCcw}
        title="Returns & Refunds"
        description="Returns require seller approval. Track all return requests here."
        action={
          <Badge variant="outline" className="bg-cyan-50 text-cyan-700 border-cyan-200">
            {DEMO_RETURNS.length} active requests
          </Badge>
        }
      />

      {/* Empty state explanation banner */}
      <Card className="border-cyan-200 bg-gradient-to-br from-cyan-50 to-teal-50 shadow-sm">
        <CardContent className="p-4 flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cyan-100 text-cyan-700">
            <AlertCircle className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-cyan-900">How returns work</p>
            <p className="text-xs text-cyan-700 mt-0.5 leading-relaxed">
              Returns require seller approval. Track all return requests here. Buyers must submit a return within 7 days of delivery.
              Sellers have 48 hours to approve or reject. If unresolved, the admin can intervene.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Returns list */}
      <div className="space-y-3">
        {DEMO_RETURNS.map((ret) => {
          const statusCfg: Record<string, { label: string; cls: string; dot: string }> = {
            PENDING_SELLER_APPROVAL: { label: 'Pending seller', cls: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-500' },
            SELLER_REJECTED: { label: 'Seller rejected', cls: 'bg-red-50 text-red-700 border-red-200', dot: 'bg-red-500' },
            REFUND_PROCESSED: { label: 'Refunded', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
          };
          return (
            <Card key={ret.id} className="border-slate-200 shadow-sm">
              <CardContent className="p-4">
                <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-semibold text-cyan-700">{ret.code}</span>
                      <StatusPill status={ret.status} config={statusCfg} />
                    </div>
                    <p className="text-sm font-semibold text-slate-800 mt-1">{ret.product}</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Order <span className="font-mono font-semibold text-slate-700">{ret.orderCode}</span> · {ret.buyer} → {ret.seller}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-500">Refund amount</p>
                    <p className="text-base font-bold text-slate-900 tabular-nums">{formatVND(ret.amount)}</p>
                    <p className="text-[10px] text-slate-400">Requested {timeAgo(ret.requestedAt)}</p>
                  </div>
                </div>

                <div className="rounded-md border border-slate-200 bg-slate-50/60 p-2.5 mb-3">
                  <p className="text-[11px] font-semibold text-slate-700 uppercase tracking-wide mb-1">Reason</p>
                  <p className="text-xs text-slate-600 leading-relaxed">{ret.reason}</p>
                </div>

                {/* Timeline */}
                <div className="relative pl-5">
                  <div className="absolute left-[7px] top-1.5 bottom-1.5 w-px bg-slate-200" />
                  {ret.timeline.map((step, i) => (
                    <div key={i} className="relative flex items-start gap-3 py-1.5">
                      <span
                        className={cn(
                          'absolute -left-[10px] mt-1 flex h-3 w-3 items-center justify-center rounded-full border-2',
                          step.done
                            ? step.current
                              ? 'border-cyan-500 bg-cyan-500'
                              : 'border-emerald-500 bg-emerald-500'
                            : 'border-slate-300 bg-white',
                        )}
                      >
                        {step.done && !step.current && <Check className="h-2 w-2 text-white" />}
                        {step.current && <span className="h-1 w-1 rounded-full bg-white" />}
                      </span>
                      <div className="ml-2">
                        <p className={cn('text-xs', step.current ? 'font-semibold text-cyan-700' : step.done ? 'font-medium text-slate-700' : 'text-slate-400')}>
                          {step.status}
                        </p>
                        <p className="text-[10px] text-slate-400">
                          {step.at ? formatDate(step.at) : '—'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {(ret.status === 'PENDING_SELLER_APPROVAL' || ret.status === 'SELLER_REJECTED') && (
                  <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-slate-100">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-[11px] border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                      onClick={() => toast({ title: 'Admin override', description: `Refund approved for ${ret.code}.` })}
                    >
                      <Check className="h-3 w-3" /> Approve refund
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-[11px] border-red-200 text-red-700 hover:bg-red-50"
                      onClick={() => toast({ title: 'Return dismissed', description: `Return ${ret.code} dismissed.`, variant: 'destructive' })}
                    >
                      <X className="h-3 w-3" /> Dismiss
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

/* ============================================================
   Tab 8: Withdrawals
   ============================================================ */

function WithdrawalsTab({ toast, queryClient }: { toast: any; queryClient: any }) {
  const [statusFilter, setStatusFilter] = useState('all');
  const [rejecting, setRejecting] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const { data } = useAdminWithdrawals();
  const withdrawals: any[] = (data?.items ?? []) as any[];

  const filtered = useMemo(() => {
    if (statusFilter === 'all') return withdrawals;
    return withdrawals.filter((w) => w.status === statusFilter);
  }, [withdrawals, statusFilter]);

  const pendingCount = withdrawals.filter((w) => w.status === 'PENDING').length;
  const statusOptions = [
    { id: 'all', label: 'All', count: withdrawals.length },
    { id: 'PENDING', label: 'Pending', count: pendingCount },
    { id: 'COMPLETED', label: 'Completed' },
    { id: 'REJECTED', label: 'Rejected' },
  ];

  const handleApprove = async (w: any) => {
    try {
      const res = await fetch('/api/v1/admin/withdrawals', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ withdrawalId: w.id, action: 'APPROVE' }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.message);
      toast({
        title: 'Withdrawal approved',
        description: `${formatVND(w.amount)} to ${w.seller?.name ?? 'seller'}. Wallet debited.`,
      });
      queryClient.invalidateQueries({ queryKey: ['admin-withdrawals'] });
      queryClient.invalidateQueries({ queryKey: ['admin-analytics'] });
    } catch (e: any) {
      toast({ title: 'Approval failed', description: e.message, variant: 'destructive' });
    }
  };

  const handleReject = async (w: any) => {
    if (!rejectReason.trim()) {
      toast({ title: 'Reason required', description: 'Please provide a rejection reason.', variant: 'destructive' });
      return;
    }
    try {
      const res = await fetch('/api/v1/admin/withdrawals', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ withdrawalId: w.id, action: 'REJECT', reason: rejectReason }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.message);
      toast({
        title: 'Withdrawal rejected',
        description: `${formatVND(w.amount)} request rejected. Funds returned to seller.`,
        variant: 'destructive',
      });
      queryClient.invalidateQueries({ queryKey: ['admin-withdrawals'] });
      queryClient.invalidateQueries({ queryKey: ['admin-analytics'] });
      setRejecting(null);
      setRejectReason('');
    } catch (e: any) {
      toast({ title: 'Rejection failed', description: e.message, variant: 'destructive' });
    }
  };

  const parseBankInfo = (bankInfo: string | null | undefined) => {
    if (!bankInfo) return null;
    try {
      return JSON.parse(bankInfo);
    } catch {
      return null;
    }
  };

  return (
    <div className="space-y-4">
      <SectionHeader
        icon={Wallet}
        title="Withdrawals"
        description={`${filtered.length} of ${withdrawals.length} withdrawal requests`}
        action={
          pendingCount > 0 ? (
            <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 gap-1.5">
              <Clock className="h-3 w-3" />
              {pendingCount} pending
            </Badge>
          ) : undefined
        }
      />

      <FilterPills options={statusOptions} active={statusFilter} onSelect={setStatusFilter} />

      <Card className="border-slate-200 shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50/60 hover:bg-slate-50/60">
              <SortHeader>Seller</SortHeader>
              <SortHeader>Shop</SortHeader>
              <SortHeader className="text-right">Amount</SortHeader>
              <SortHeader>Status</SortHeader>
              <SortHeader>Bank Info</SortHeader>
              <SortHeader>Date</SortHeader>
              <TableHead className="text-right text-[11px] font-semibold uppercase tracking-wider text-slate-500">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-10">
                  <EmptyState icon={Wallet} title="No withdrawals" description="No withdrawal requests match this filter." />
                </TableCell>
              </TableRow>
            )}
            {filtered.map((w) => {
              const bank = parseBankInfo(w.bankInfo);
              const isRejecting = rejecting === w.id;
              return (
                <>
                  <TableRow key={w.id} className={cn('hover:bg-cyan-50/30', isRejecting && 'bg-amber-50/30')}>
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <Avatar className="h-8 w-8 border border-slate-200">
                          {w.seller?.avatarUrl && <AvatarImage src={w.seller.avatarUrl} alt={w.seller.name} />}
                          <AvatarFallback className="bg-cyan-50 text-cyan-700 text-[10px] font-semibold">
                            {initials(w.seller?.name ?? 'S')}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-slate-800 truncate">{w.seller?.name ?? '—'}</p>
                          <p className="text-[11px] text-slate-500 font-mono truncate">{w.seller?.email ?? '—'}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-slate-700">{w.seller?.shop?.name ?? '—'}</TableCell>
                    <TableCell className="text-right text-xs font-bold text-slate-800 tabular-nums">
                      {formatVND(w.amount)}
                    </TableCell>
                    <TableCell><StatusPill status={w.status} config={WITHDRAWAL_STATUS_CONFIG} /></TableCell>
                    <TableCell className="text-[11px] text-slate-600">
                      {bank ? (
                        <div>
                          <p className="font-medium">{bank.bankName ?? '—'}</p>
                          <p className="font-mono text-slate-500">{bank.accountNumber ?? '—'}</p>
                        </div>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-xs text-slate-600">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3 text-slate-400" />
                        {formatDate(w.createdAt)}
                      </div>
                      {w.processedAt && <p className="text-[10px] text-emerald-600">processed {timeAgo(w.processedAt)}</p>}
                    </TableCell>
                    <TableCell className="text-right">
                      {w.status === 'PENDING' && !isRejecting && (
                        <div className="inline-flex items-center gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 px-2 text-[11px] border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                            onClick={() => handleApprove(w)}
                          >
                            <Check className="h-3 w-3" /> Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 px-2 text-[11px] border-red-200 text-red-700 hover:bg-red-50"
                            onClick={() => { setRejecting(w.id); setRejectReason(''); }}
                          >
                            <X className="h-3 w-3" /> Reject
                          </Button>
                        </div>
                      )}
                      {w.status !== 'PENDING' && !isRejecting && (
                        <span className="text-[11px] text-slate-400">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                  {isRejecting && (
                    <TableRow key={w.id + '-reject'} className="bg-amber-50/30">
                      <TableCell colSpan={7} className="p-3">
                        <div className="rounded-md border border-amber-200 bg-white p-3">
                          <p className="text-[11px] font-semibold text-amber-800 uppercase mb-1.5">Rejection reason</p>
                          <Textarea
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                            placeholder="Provide a clear reason for the seller (e.g. insufficient balance, bank info mismatch)..."
                            className="min-h-[60px] text-xs"
                          />
                          <div className="flex items-center justify-end gap-2 mt-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-[11px]"
                              onClick={() => { setRejecting(null); setRejectReason(''); }}
                            >
                              Cancel
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-[11px] border-red-200 text-red-700 hover:bg-red-50"
                              onClick={() => handleReject(w)}
                            >
                              <X className="h-3 w-3" /> Confirm reject
                            </Button>
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </>
              );
            })}
          </TableBody>
        </Table>
        <PaginationFooter total={withdrawals.length} shown={filtered.length} label="withdrawals" />
      </Card>
    </div>
  );
}

/* ============================================================
   Tab 9: Reviews Moderation
   ============================================================ */

function ReviewsTab({ toast, queryClient }: { toast: any; queryClient: any }) {
  const [statusFilter, setStatusFilter] = useState('PENDING');
  const [reviews, setReviews] = useState(DEMO_REVIEWS_PENDING);

  const filtered = useMemo(() => {
    if (statusFilter === 'all') return reviews;
    return reviews.filter((r) => r.status === statusFilter);
  }, [reviews, statusFilter]);

  const statusOptions = [
    { id: 'all', label: 'All', count: reviews.length },
    { id: 'PENDING', label: 'Pending', count: reviews.filter((r) => r.status === 'PENDING').length },
    { id: 'APPROVED', label: 'Approved', count: reviews.filter((r) => r.status === 'APPROVED').length },
    { id: 'REJECTED', label: 'Rejected', count: reviews.filter((r) => r.status === 'REJECTED').length },
  ];

  const updateStatus = (id: string, status: 'APPROVED' | 'REJECTED') => {
    setReviews((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
    const review = reviews.find((r) => r.id === id);
    toast({
      title: status === 'APPROVED' ? 'Review approved' : 'Review rejected',
      description: `${review?.productName ?? 'Review'} is now ${status.toLowerCase()}.`,
      variant: status === 'REJECTED' ? 'destructive' : 'default',
    });
    queryClient.invalidateQueries({ queryKey: ['admin-analytics'] });
  };

  return (
    <div className="space-y-4">
      <SectionHeader
        icon={Star}
        title="Reviews Moderation"
        description="Approve or reject pending reviews before they appear publicly"
      />

      <FilterPills options={statusOptions} active={statusFilter} onSelect={setStatusFilter} />

      {filtered.length === 0 ? (
        <Card className="border-slate-200 shadow-sm">
          <CardContent className="py-12">
            <EmptyState
              icon={Star}
              title="No reviews to moderate"
              description="All reviews have been reviewed. New reviews will appear here for moderation."
            />
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((r) => (
            <Card key={r.id} className="border-slate-200 shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Avatar className="h-9 w-9 border border-slate-200 shrink-0">
                    <AvatarImage src={r.avatarUrl} alt={r.user} />
                    <AvatarFallback className="bg-cyan-50 text-cyan-700 text-[10px] font-semibold">
                      {initials(r.user)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="text-xs font-semibold text-slate-800">{r.user}</p>
                        <p className="text-[11px] text-slate-500">
                          {formatDate(r.createdAt)} · {timeAgo(r.createdAt)}
                        </p>
                      </div>
                      <StatusPill status={r.status} config={REVIEW_STATUS_CONFIG} />
                    </div>
                    <p className="text-sm font-semibold text-slate-800 mt-2">{r.productName}</p>
                    <div className="mt-1.5">
                      <Rating value={r.rating} size="xs" showCount={false} />
                    </div>
                    <p className="text-xs text-slate-700 mt-2 leading-relaxed">{r.comment}</p>
                    {r.status === 'PENDING' && (
                      <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-100">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-[11px] border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                          onClick={() => updateStatus(r.id, 'APPROVED')}
                        >
                          <Check className="h-3 w-3" /> Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-[11px] border-red-200 text-red-700 hover:bg-red-50"
                          onClick={() => updateStatus(r.id, 'REJECTED')}
                        >
                          <X className="h-3 w-3" /> Reject
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 text-[11px] text-cyan-700 hover:bg-cyan-50"
                          onClick={() => toast({ title: 'View product', description: `Opening ${r.productName}...` })}
                        >
                          <Eye className="h-3 w-3" /> View product
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

/* ============================================================
   Tab 10: Categories
   ============================================================ */

function CategoriesTab({ toast }: { toast: any }) {
  const { data } = useCategories();
  const categories: any[] = Array.isArray(data) && data.length ? data : DEMO_CATEGORIES;

  return (
    <div className="space-y-4">
      <SectionHeader
        icon={ListTree}
        title="Categories"
        description={`${categories.length} categories · managing product taxonomy`}
        action={
          <Button
            size="sm"
            className="h-8 text-xs bg-cyan-500 hover:bg-cyan-600 text-white"
            onClick={() => toast({ title: 'Add category', description: 'Opening new category form...' })}
          >
            <Plus className="h-3.5 w-3.5" />
            Add category
          </Button>
        }
      />

      <div className="grid lg:grid-cols-3 gap-3">
        {/* Tree view */}
        <Card className="lg:col-span-2 border-slate-200 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <ListTree className="h-4 w-4 text-cyan-600" />
              Category Tree
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50/60 hover:bg-slate-50/60">
                  <SortHeader>Category</SortHeader>
                  <SortHeader>Parent</SortHeader>
                  <SortHeader className="text-right">Products</SortHeader>
                  <TableHead className="text-right text-[11px] font-semibold uppercase tracking-wider text-slate-500">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories.map((c) => (
                  <TableRow key={c.id} className="hover:bg-cyan-50/30">
                    <TableCell>
                      <div className={cn('flex items-center gap-2', !c.parentId && 'font-semibold')}>
                        {!c.parentId && <span className="text-cyan-500">▸</span>}
                        {c.parentId && <span className="text-slate-300 pl-3">└─</span>}
                        <span className="text-xs text-slate-800">{c.name}</span>
                        <Badge variant="outline" className="text-[10px] bg-slate-50 text-slate-500 border-slate-200 font-mono">
                          /{c.slug}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-slate-500">{c.parentName ?? '—'}</TableCell>
                    <TableCell className="text-right text-xs font-semibold text-slate-700 tabular-nums">{c.productCount ?? 0}</TableCell>
                    <TableCell className="text-right">
                      <div className="inline-flex items-center gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 w-7 p-0 text-cyan-700 hover:bg-cyan-50"
                          onClick={() => toast({ title: 'Edit category', description: `Editing ${c.name}...` })}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 w-7 p-0 text-red-700 hover:bg-red-50"
                          onClick={() => toast({ title: 'Delete category', description: `${c.name} will be removed.`, variant: 'destructive' })}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Summary panel */}
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-teal-600" />
              Top Categories
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-2 space-y-2">
            {[...categories].sort((a, b) => (b.productCount ?? 0) - (a.productCount ?? 0)).slice(0, 5).map((c) => {
              const max = Math.max(...categories.map((x) => x.productCount ?? 0));
              const pct = max > 0 ? Math.round(((c.productCount ?? 0) / max) * 100) : 0;
              return (
                <div key={c.id} className="rounded-md p-2 hover:bg-slate-50 transition-colors">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs font-medium text-slate-700 truncate">{c.name}</p>
                    <span className="text-xs font-semibold text-slate-700 tabular-nums">{c.productCount ?? 0}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-cyan-500 to-teal-400" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

/* ============================================================
   Tab 11: Audit Logs
   ============================================================ */

function AuditTab() {
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const { data } = useAuditLogs(50);
  const logs: any[] = (data?.items ?? []) as any[];

  const filtered = useMemo(() => {
    let arr = logs;
    if (actionFilter !== 'all') {
      arr = arr.filter((l) => (l.action ?? '').includes(actionFilter));
    }
    const s = search.trim().toLowerCase();
    if (s) {
      arr = arr.filter((l) =>
        [l.user?.name, l.user?.email, l.action, l.entityType, l.entityId].some((f) =>
          String(f ?? '').toLowerCase().includes(s),
        ),
      );
    }
    return arr;
  }, [logs, actionFilter, search]);

  const actionOptions = [
    { id: 'all', label: 'All actions' },
    { id: 'LOGIN', label: 'Login' },
    { id: 'SELLER_', label: 'Seller' },
    { id: 'PRODUCT_', label: 'Product' },
    { id: 'WITHDRAWAL_', label: 'Withdrawal' },
    { id: 'USER_', label: 'User' },
    { id: 'SETTINGS_', label: 'Settings' },
  ];

  return (
    <div className="space-y-4">
      <SectionHeader
        icon={ScrollText}
        title="Audit Logs"
        description={`${filtered.length} of ${logs.length} activity records`}
        action={<SearchBox value={search} onChange={setSearch} placeholder="Search by user, action, entity..." />}
      />

      <FilterPills options={actionOptions} active={actionFilter} onSelect={setActionFilter} />

      <Card className="border-slate-200 shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50/60 hover:bg-slate-50/60">
              <SortHeader>Timestamp</SortHeader>
              <SortHeader>User</SortHeader>
              <SortHeader>Action</SortHeader>
              <SortHeader>Entity</SortHeader>
              <SortHeader>Change</SortHeader>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-10">
                  <EmptyState icon={ScrollText} title="No audit logs" description="No activity matches your filters." />
                </TableCell>
              </TableRow>
            )}
            {filtered.map((l) => {
              const actionKey = Object.keys(AUDIT_ACTION_CONFIG).find((k) => k === l.action) ?? 'DEFAULT';
              const cfg = AUDIT_ACTION_CONFIG[actionKey];
              return (
                <TableRow key={l.id} className="hover:bg-cyan-50/30">
                  <TableCell className="text-xs text-slate-600">
                    <div className="font-mono">{new Date(l.createdAt).toLocaleString('en-GB', { timeZone: 'Asia/Ho_Chi_Minh' })}</div>
                    <div className="text-[10px] text-slate-400">{timeAgo(l.createdAt)}</div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6 border border-slate-200">
                        {l.user?.avatarUrl && <AvatarImage src={l.user.avatarUrl} alt={l.user.name} />}
                        <AvatarFallback className="bg-slate-100 text-slate-600 text-[9px] font-semibold">
                          {initials(l.user?.name ?? 'U')}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-slate-700 truncate">{l.user?.name ?? '—'}</p>
                        <p className="text-[10px] text-slate-400 font-mono truncate">{l.user?.email ?? ''}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={cn('text-[11px] font-mono', cfg.cls)}>
                      {l.action ?? '—'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs">
                    <span className="text-slate-700">{l.entityType ?? '—'}</span>
                    <span className="text-slate-400 font-mono ml-1">#{(l.entityId ?? '').slice(-6)}</span>
                  </TableCell>
                  <TableCell className="text-[11px] text-slate-600">
                    {l.oldValue || l.newValue ? (
                      <div className="flex items-center gap-1.5">
                        {l.oldValue && (
                          <span className="px-1.5 py-0.5 rounded bg-red-50 text-red-700 border border-red-100 font-mono">
                            {l.oldValue}
                          </span>
                        )}
                        {l.oldValue && l.newValue && <ChevronRight className="h-3 w-3 text-slate-400" />}
                        {l.newValue && (
                          <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-100 font-mono">
                            {l.newValue}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
        <PaginationFooter total={logs.length} shown={filtered.length} label="logs" />
      </Card>
    </div>
  );
}

/* ============================================================
   Tab 12: System Settings
   ============================================================ */

function SettingsTab({ toast }: { toast: any }) {
  const [brandName, setBrandName] = useState('CircuitHub');
  const [currency, setCurrency] = useState('VND');
  const [timezone, setTimezone] = useState('Asia/Ho_Chi_Minh');
  const [commissionRate, setCommissionRate] = useState('5');
  const [settlementDays, setSettlementDays] = useState('7');
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [featureFlags, setFeatureFlags] = useState({
    buyerSignup: true,
    sellerOnboarding: true,
    pcbMarketplace: true,
    digitalDownloads: true,
    reviewsEnabled: true,
    voucherSystem: true,
  });

  const featureList = [
    { key: 'buyerSignup', label: 'Buyer signups', desc: 'Allow new buyer registrations' },
    { key: 'sellerOnboarding', label: 'Seller onboarding', desc: 'Allow new seller applications' },
    { key: 'pcbMarketplace', label: 'PCB marketplace', desc: 'Enable PCB project category' },
    { key: 'digitalDownloads', label: 'Digital downloads', desc: 'Enable digital product delivery' },
    { key: 'reviewsEnabled', label: 'Reviews', desc: 'Allow product reviews & ratings' },
    { key: 'voucherSystem', label: 'Voucher system', desc: 'Enable promo code redemptions' },
  ];

  const handleSave = () => {
    toast({
      title: 'Settings saved',
      description: `Brand "${brandName}" · commission ${commissionRate}% · settlement ${settlementDays} days.`,
    });
  };

  return (
    <div className="space-y-4">
      <SectionHeader
        icon={Settings}
        title="System Settings"
        description="Platform configuration & feature flags"
        action={
          <Button size="sm" className="h-8 text-xs bg-cyan-500 hover:bg-cyan-600 text-white" onClick={handleSave}>
            <Check className="h-3.5 w-3.5" />
            Save changes
          </Button>
        }
      />

      <div className="grid lg:grid-cols-2 gap-4">
        {/* General settings */}
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <Building2 className="h-4 w-4 text-cyan-600" />
              General
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 pt-2">
            <div className="space-y-1.5">
              <Label htmlFor="brand" className="text-xs">Brand name</Label>
              <Input id="brand" value={brandName} onChange={(e) => setBrandName(e.target.value)} className="h-8 text-xs" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1.5">
                <Label htmlFor="currency" className="text-xs">Currency</Label>
                <div className="relative">
                  <DollarSign className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                  <Input id="currency" value={currency} onChange={(e) => setCurrency(e.target.value)} className="pl-8 h-8 text-xs font-mono" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="tz" className="text-xs">Timezone</Label>
                <div className="relative">
                  <Globe className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                  <Input id="tz" value={timezone} onChange={(e) => setTimezone(e.target.value)} className="pl-8 h-8 text-xs font-mono" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Finance settings */}
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <Percent className="h-4 w-4 text-teal-600" />
              Finance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 pt-2">
            <div className="space-y-1.5">
              <Label htmlFor="commission" className="text-xs">Commission rate (%)</Label>
              <div className="relative">
                <Percent className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                <Input
                  id="commission"
                  type="number"
                  min="0"
                  max="50"
                  step="0.5"
                  value={commissionRate}
                  onChange={(e) => setCommissionRate(e.target.value)}
                  className="pl-8 h-8 text-xs font-mono"
                />
              </div>
              <p className="text-[10px] text-slate-500">Applied to all seller revenue at order completion.</p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="settlement" className="text-xs">Settlement period (days)</Label>
              <div className="relative">
                <CalendarClock className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                <Input
                  id="settlement"
                  type="number"
                  min="0"
                  max="60"
                  value={settlementDays}
                  onChange={(e) => setSettlementDays(e.target.value)}
                  className="pl-8 h-8 text-xs font-mono"
                />
              </div>
              <p className="text-[10px] text-slate-500">Pending balance becomes available after this many days.</p>
            </div>
          </CardContent>
        </Card>

        {/* Maintenance mode */}
        <Card className={cn('border-slate-200 shadow-sm', maintenanceMode && 'border-amber-200 bg-amber-50/30')}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <AlertCircle className={cn('h-4 w-4', maintenanceMode ? 'text-amber-600' : 'text-cyan-600')} />
              Maintenance Mode
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-medium text-slate-700">Take marketplace offline</p>
                <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                  When enabled, all non-admin users see a maintenance banner. Admins can still access the platform.
                </p>
              </div>
              <Switch
                checked={maintenanceMode}
                onCheckedChange={setMaintenanceMode}
              />
            </div>
            {maintenanceMode && (
              <div className="mt-3 rounded-md border border-amber-200 bg-amber-50 p-2.5 text-[11px] text-amber-800">
                <p className="font-semibold flex items-center gap-1.5">
                  <AlertCircle className="h-3 w-3" /> Maintenance banner active
                </p>
                <p className="mt-0.5">Estimated downtime: 30 min · Started {timeAgo(new Date().toISOString())}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Feature flags */}
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-cyan-600" />
              Feature Flags
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-2 space-y-2.5">
            {featureList.map((f) => (
              <div key={f.key} className="flex items-center justify-between gap-3 py-1">
                <div className="min-w-0">
                  <p className="text-xs font-medium text-slate-700">{f.label}</p>
                  <p className="text-[11px] text-slate-500">{f.desc}</p>
                </div>
                <Switch
                  checked={(featureFlags as any)[f.key]}
                  onCheckedChange={(v) => setFeatureFlags((prev) => ({ ...prev, [f.key]: v }))}
                />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Separator />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
          <Clock className="h-3 w-3" />
          Last saved: {timeAgo(new Date(Date.now() - 5 * 3600000).toISOString())}
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            className="h-8 text-xs"
            onClick={() => {
              setBrandName('CircuitHub');
              setCurrency('VND');
              setTimezone('Asia/Ho_Chi_Minh');
              setCommissionRate('5');
              setSettlementDays('7');
              setMaintenanceMode(false);
              setFeatureFlags({
                buyerSignup: true,
                sellerOnboarding: true,
                pcbMarketplace: true,
                digitalDownloads: true,
                reviewsEnabled: true,
                voucherSystem: true,
              });
              toast({ title: 'Settings reset', description: 'All values restored to defaults.' });
            }}
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset to defaults
          </Button>
          <Button size="sm" className="h-8 text-xs bg-cyan-500 hover:bg-cyan-600 text-white" onClick={handleSave}>
            <Check className="h-3.5 w-3.5" />
            Save changes
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   Sidebar + nav
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
          ? 'bg-cyan-500 text-white shadow-[0_8px_18px_-8px_rgba(6,182,212,0.55)]'
          : 'text-slate-300 hover:bg-slate-800 hover:text-cyan-300',
      )}
    >
      <tab.icon className={cn('h-4 w-4 shrink-0', active ? 'text-white' : 'text-cyan-500/80')} />
      <span className="truncate">{tab.label}</span>
      {active && <ChevronRight className="h-3.5 w-3.5 ml-auto" />}
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
        active ? 'bg-cyan-500 text-white border-cyan-500' : 'bg-white text-slate-600 border-slate-200',
      )}
    >
      <tab.icon className="h-3.5 w-3.5" />
      <span className="whitespace-nowrap">{tab.label}</span>
    </button>
  );
}

/* ============================================================
   AdminCenter — main exported component
   ============================================================ */

export function AdminCenter() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  // Live data
  const { data: analyticsData, refetch: refetchAnalytics, isFetching: isAnalyticsFetching } = useAdminAnalytics();

  const handleRefresh = async () => {
    await refetchAnalytics();
    await queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    await queryClient.invalidateQueries({ queryKey: ['admin-sellers'] });
    await queryClient.invalidateQueries({ queryKey: ['admin-withdrawals'] });
    await queryClient.invalidateQueries({ queryKey: ['audit-logs'] });
    await queryClient.invalidateQueries({ queryKey: ['orders'] });
    setLastRefresh(new Date());
    toast({
      title: 'Admin data refreshed',
      description: 'All admin metrics, users, sellers & withdrawals reloaded.',
    });
  };

  const activeTabDef = ALL_TABS.find((t) => t.id === activeTab);
  const activeSection = SIDEBAR_SECTIONS.find((s) => s.items.some((i) => i.id === activeTab));

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-cyan-50/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="relative overflow-hidden rounded-2xl border border-slate-700 bg-slate-900 p-5 sm:p-6 mb-6 text-slate-100"
        >
          <div
            aria-hidden
            className="absolute inset-0 pointer-events-none opacity-[0.07]"
            style={{
              backgroundImage:
                'linear-gradient(to right, #22d3ee 1px, transparent 1px), linear-gradient(to bottom, #22d3ee 1px, transparent 1px)',
              backgroundSize: '24px 24px',
            }}
          />
          <div className="relative flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-teal-400 text-white shadow-[0_8px_18px_-8px_rgba(6,182,212,0.55)]">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-wider text-cyan-300 flex items-center gap-1.5">
                  <Lock className="h-3 w-3" />
                  Admin Center
                </p>
                <h1 className="text-xl sm:text-2xl font-bold text-white">CircuitHub Platform Control</h1>
                <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-2">
                  <Clock className="h-3 w-3" />
                  Last refresh: {lastRefresh.toLocaleString('en-GB', { timeZone: 'Asia/Ho_Chi_Minh' })}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-1.5">
                <Avatar className="h-7 w-7 border border-slate-600">
                  <AvatarImage src={user?.avatarUrl} alt={user?.name ?? 'Admin'} />
                  <AvatarFallback className="bg-cyan-500 text-white text-[10px] font-bold">
                    {initials(user?.name ?? 'AD')}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-xs font-semibold text-white">{user?.name ?? 'System Administrator'}</p>
                  <Badge variant="outline" className="bg-rose-500/20 text-rose-300 border-rose-500/40 text-[10px] gap-1">
                    <ShieldCheck className="h-2.5 w-2.5" />
                    {user?.role ?? 'ADMIN'}
                  </Badge>
                </div>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="h-8 border-slate-600 bg-slate-800 text-slate-100 hover:bg-slate-700 hover:text-cyan-300"
                onClick={handleRefresh}
                disabled={isAnalyticsFetching}
              >
                <RefreshCw className={cn('h-3.5 w-3.5', isAnalyticsFetching && 'animate-spin')} />
                Refresh
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-8 border-rose-800/60 bg-rose-950/40 text-rose-300 hover:bg-rose-900/60 hover:text-white"
                onClick={() => {
                  logout();
                  useNavStore.getState().setView('admin-login', {});
                }}
              >
                <LogOut className="h-3.5 w-3.5" />
                Đăng xuất
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

        {/* Layout: dark sidebar + content */}
        <div className="lg:grid lg:grid-cols-[240px_1fr] lg:gap-8">
          {/* Sidebar — DARK slate-900 (admin feel) */}
          <aside className="hidden lg:block">
            <div className="sticky top-4 rounded-2xl border border-slate-700 bg-slate-900 p-3 space-y-4">
              {SIDEBAR_SECTIONS.map((section) => (
                <div key={section.title} className="space-y-1">
                  <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">
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

              <div className="mt-2 rounded-xl border border-slate-700 bg-slate-800/60 p-3">
                <p className="text-xs font-semibold text-cyan-300 flex items-center gap-1.5">
                  <Activity className="h-3.5 w-3.5" />
                  System Status
                </p>
                <p className="mt-1.5 text-[11px] text-slate-400 leading-relaxed">
                  All services operational. 5% commission · 7-day settlement · Asia/Ho_Chi_Minh timezone.
                </p>
                <div className="mt-2 flex items-center gap-1.5 text-[11px] text-emerald-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Operational
                </div>
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
                  <OverviewTab data={analyticsData} goTab={(id) => setActiveTab(id)} />
                )}
                {activeTab === 'users' && (
                  <UsersTab toast={toast} goTab={(id) => setActiveTab(id)} />
                )}
                {activeTab === 'sellers' && (
                  <SellersTab toast={toast} queryClient={queryClient} />
                )}
                {activeTab === 'products' && (
                  <ProductsTab toast={toast} goProduct={(slug) => {
                    if (typeof window !== 'undefined') window.location.hash = `/product-detail?slug=${slug}`;
                  }} />
                )}
                {activeTab === 'orders' && (
                  <OrdersTab toast={toast} />
                )}
                {activeTab === 'payments' && (
                  <PaymentsTab toast={toast} />
                )}
                {activeTab === 'returns' && (
                  <ReturnsTab toast={toast} />
                )}
                {activeTab === 'withdrawals' && (
                  <WithdrawalsTab toast={toast} queryClient={queryClient} />
                )}
                {activeTab === 'reviews' && (
                  <ReviewsTab toast={toast} queryClient={queryClient} />
                )}
                {activeTab === 'categories' && (
                  <CategoriesTab toast={toast} />
                )}
                {activeTab === 'audit' && (
                  <AuditTab />
                )}
                {activeTab === 'settings' && (
                  <SettingsTab toast={toast} />
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Mobile: section/tab label footer */}
        <div className="lg:hidden mt-8 pt-4 border-t border-slate-200 text-xs text-slate-500">
          <p className="font-semibold text-slate-700 mb-1">
            {activeTabDef?.label} · {activeSection?.title}
          </p>
          <p>{activeTabDef?.description}</p>
        </div>
      </div>
    </div>
  );
}

export default AdminCenter;
