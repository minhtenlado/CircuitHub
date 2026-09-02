'use client';

/* ============================================================
   CircuitHub — BuyerDashboard
   Single-file buyer account center with 8 internal tabs:
   Overview · Orders · Downloads · Wishlist · Licenses ·
   Addresses · Profile · Reviews.

   Layout:
   - Sticky left sidebar (vertical TabsList) on lg+
   - Horizontal scrollable pill TabsList on mobile
   - AnimatePresence (mode="wait") for tab transitions
   - Container: max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8
   - Welcome header with avatar + last login info

   Data:
   - useOrders('demo-buyer') for live orders (fallback to
     DEMO_ORDERS when API returns empty so the dashboard is
     populated for demo accounts).
   - useNotifications('demo-buyer') for recent notifications.
   - useWishlistStore for wishlist items.
   - Mock licenses, reviews, address used for demo state.
   ============================================================ */

import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useOrders, useNotifications } from '@/lib/api/hooks';
import { useWishlistStore } from '@/stores/wishlist-store';
import { useNavStore } from '@/stores/nav-store';
import { useAuthStore } from '@/stores/auth-store';
import { useToast } from '@/hooks/use-toast';
import { formatVND, formatDate, timeAgo, formatFileSize, initials } from '@/lib/format';
import { Rating } from '@/components/common/rating';
import { ProductTypeBadge, VerifiedBadge, TechBadge } from '@/components/common/badges';
import { WishlistShareDialog } from '@/components/buyer/wishlist-share-dialog';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Package,
  Download,
  Heart,
  MapPin,
  User,
  Star,
  Clock,
  ShoppingBag,
  Wallet,
  FileText,
  Bell,
  CheckCircle2,
  ChevronRight,
  ArrowRight,
  Trash2,
  Plus,
  Lock,
  ShieldCheck,
  Key,
  Activity,
  Mail,
  Phone,
  ChevronDown,
  Truck,
  FileArchive,
  Edit2,
  Share2,
  X,
  Sparkles,
  ClipboardList,
  PackageSearch,
  RefreshCw,
  Image as ImageIcon,
} from 'lucide-react';
import Image from 'next/image';
import { useState } from 'react';
import { cn } from '@/lib/utils';

/* ---------------- Types ---------------- */

type TabId =
  | 'overview'
  | 'orders'
  | 'downloads'
  | 'wishlist'
  | 'licenses'
  | 'addresses'
  | 'profile'
  | 'reviews';

interface DemoOrderItem {
  id: string;
  name: string;
  productType: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
  imageUrl?: string;
  fulfillmentType: string;
}

interface DemoShipment {
  id: string;
  trackingNumber: string;
  provider: string;
  status: string;
  estimatedDays: number;
}

interface DemoPayment {
  id: string;
  provider: string;
  amount: number;
  status: string;
  paidAt: string;
}

interface DemoSellerOrder {
  id: string;
  code: string;
  shop: { id: string; name: string; slug: string; verified: boolean };
  status: string;
  fulfillmentType: string;
}

interface DemoOrder {
  id: string;
  code: string;
  createdAt: string;
  status: string;
  paymentStatus: string;
  paymentMethod: string;
  subtotal: number;
  shippingTotal: number;
  grandTotal: number;
  itemsCount: number;
  shippingAddress: { fullName: string; phone: string; line1: string; city: string; district?: string };
  items: DemoOrderItem[];
  sellerOrders: DemoSellerOrder[];
  shipments: DemoShipment[];
  payments: DemoPayment[];
}

interface DemoDownload {
  id: string;
  productId: string;
  slug: string;
  name: string;
  image: string;
  version: string;
  fileSize: number;
  licenseType: string;
  licenseKey: string;
  lastDownloadedAt: string;
  purchaseDate: string;
  software: string;
}

interface DemoLicense {
  id: string;
  productId: string;
  productName: string;
  productSlug: string;
  licenseType: string;
  licenseKey: string;
  purchaseDate: string;
  status: string;
  seats: number;
  usedSeats: number;
  terms: string;
}

interface DemoReview {
  id: string;
  productId: string;
  productName: string;
  productSlug: string;
  rating: number;
  comment: string;
  createdAt: string;
  verifiedPurchase: boolean;
  sellerReply?: string;
  sellerReplyAt?: string;
}

interface DemoAddress {
  id: string;
  fullName: string;
  phone: string;
  line1: string;
  line2?: string;
  city: string;
  district: string;
  ward?: string;
  zipCode?: string;
  country: string;
  isDefault: boolean;
}

/* ---------------- Status config ---------------- */

const ORDER_STATUS_CONFIG: Record<string, { label: string; cls: string; dot: string }> = {
  PENDING: { label: 'Pending', cls: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-500' },
  PENDING_PAYMENT: { label: 'Pending payment', cls: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-500' },
  PAID: { label: 'Paid', cls: 'bg-cyan-50 text-cyan-700 border-cyan-200', dot: 'bg-cyan-500' },
  CONFIRMED: { label: 'Confirmed', cls: 'bg-cyan-50 text-cyan-700 border-cyan-200', dot: 'bg-cyan-500' },
  SHIPPED: { label: 'Shipped', cls: 'bg-blue-50 text-blue-700 border-blue-200', dot: 'bg-blue-500' },
  DELIVERED: { label: 'Delivered', cls: 'bg-teal-50 text-teal-700 border-teal-200', dot: 'bg-teal-500' },
  COMPLETED: { label: 'Completed', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
  CANCELLED: { label: 'Cancelled', cls: 'bg-red-50 text-red-700 border-red-200', dot: 'bg-red-500' },
};

const PAYMENT_STATUS_CONFIG: Record<string, { label: string; cls: string }> = {
  PENDING: { label: 'Pending', cls: 'bg-amber-50 text-amber-700 border-amber-200' },
  SUCCESS: { label: 'Paid', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  FAILED: { label: 'Failed', cls: 'bg-red-50 text-red-700 border-red-200' },
  REFUNDED: { label: 'Refunded', cls: 'bg-slate-50 text-slate-700 border-slate-200' },
};

const LICENSE_TYPE_CONFIG: Record<string, { label: string; cls: string }> = {
  PERSONAL: { label: 'Personal', cls: 'bg-cyan-50 text-cyan-700 border-cyan-200' },
  COMMERCIAL: { label: 'Commercial', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  ENTERPRISE: { label: 'Enterprise', cls: 'bg-violet-50 text-violet-700 border-violet-200' },
  EXTENDED: { label: 'Extended', cls: 'bg-amber-50 text-amber-700 border-amber-200' },
  EDUCATION: { label: 'Education', cls: 'bg-teal-50 text-teal-700 border-teal-200' },
  UNLIMITED: { label: 'Unlimited', cls: 'bg-gradient-to-r from-cyan-500 to-teal-400 text-white border-0' },
};

const TIMELINE_STEPS = [
  { id: 'placed', label: 'Order Placed' },
  { id: 'paid', label: 'Paid' },
  { id: 'confirmed', label: 'Confirmed' },
  { id: 'shipped', label: 'Shipped' },
  { id: 'delivered', label: 'Delivered' },
  { id: 'completed', label: 'Completed' },
] as const;

const STATUS_TO_STEPS: Record<string, number> = {
  PENDING: 1,
  PENDING_PAYMENT: 1,
  PAID: 2,
  CONFIRMED: 3,
  SHIPPED: 4,
  DELIVERED: 5,
  COMPLETED: 6,
  CANCELLED: 1,
};

/* ---------------- Tabs config ---------------- */

const TABS: { id: TabId; label: string; icon: typeof Package; description: string }[] = [
  { id: 'overview', label: 'Overview', icon: Activity, description: 'Quick stats & recent activity' },
  { id: 'orders', label: 'My Orders', icon: Package, description: 'All purchases with tracking' },
  { id: 'downloads', label: 'My Downloads', icon: Download, description: 'Digital products & files' },
  { id: 'wishlist', label: 'My Wishlist', icon: Heart, description: 'Saved products' },
  { id: 'licenses', label: 'My Licenses', icon: Key, description: 'Digital product licenses' },
  { id: 'addresses', label: 'My Addresses', icon: MapPin, description: 'Saved shipping addresses' },
  { id: 'profile', label: 'My Profile', icon: User, description: 'Account settings' },
  { id: 'reviews', label: 'My Reviews', icon: Star, description: 'Reviews you have written' },
];

/* ---------------- Demo data ---------------- */

const DAY = 86400000;
const now = Date.now();

const DEMO_ORDERS: DemoOrder[] = [
  {
    id: 'demo-ord-1',
    code: 'CH-100005',
    createdAt: new Date(now - 7 * DAY).toISOString(),
    status: 'COMPLETED',
    paymentStatus: 'SUCCESS',
    paymentMethod: 'MOCK',
    subtotal: 394000,
    shippingTotal: 30000,
    grandTotal: 424000,
    itemsCount: 2,
    shippingAddress: { fullName: 'Buyer 1', phone: '0901234567', line1: '12 Nguyen Hue', city: 'Ho Chi Minh', district: 'District 1' },
    items: [
      { id: 'i1', name: 'ESP32-WROOM-32 DevKit v1.2', productType: 'PHYSICAL', unitPrice: 95000, quantity: 2, lineTotal: 190000, imageUrl: 'https://api.dicebear.com/7.x/shapes/svg?seed=esp32&backgroundColor=06b6d4', fulfillmentType: 'PHYSICAL' },
      { id: 'i2', name: 'BME280 Sensor Module', productType: 'PHYSICAL', unitPrice: 68000, quantity: 3, lineTotal: 204000, imageUrl: 'https://api.dicebear.com/7.x/shapes/svg?seed=bme280&backgroundColor=22d3ee', fulfillmentType: 'PHYSICAL' },
    ],
    sellerOrders: [
      { id: 'so1', code: 'CH-100005-1', shop: { id: 'shop-a', name: 'BoardForge Studio', slug: 'boardforge-studio', verified: true }, status: 'COMPLETED', fulfillmentType: 'PHYSICAL' },
    ],
    shipments: [
      { id: 'sh1', trackingNumber: 'GHN1234567890', provider: 'GHN', status: 'DELIVERED', estimatedDays: 3 },
    ],
    payments: [
      { id: 'p1', provider: 'MOCK', amount: 424000, status: 'SUCCESS', paidAt: new Date(now - 7 * DAY + 60000).toISOString() },
    ],
  },
  {
    id: 'demo-ord-2',
    code: 'CH-100006',
    createdAt: new Date(now - 3 * DAY).toISOString(),
    status: 'SHIPPED',
    paymentStatus: 'SUCCESS',
    paymentMethod: 'VNPAY',
    subtotal: 2450000,
    shippingTotal: 60000,
    grandTotal: 2510000,
    itemsCount: 1,
    shippingAddress: { fullName: 'Buyer 1', phone: '0901234567', line1: '12 Nguyen Hue', city: 'Ho Chi Minh', district: 'District 1' },
    items: [
      { id: 'i3', name: '4-Layer PCB Stack — STM32 Reference Design', productType: 'PHYSICAL', unitPrice: 2450000, quantity: 1, lineTotal: 2450000, imageUrl: 'https://api.dicebear.com/7.x/shapes/svg?seed=pcb&backgroundColor=2dd4bf', fulfillmentType: 'PHYSICAL' },
    ],
    sellerOrders: [
      { id: 'so2', code: 'CH-100006-1', shop: { id: 'shop-b', name: 'KiCad Craft Lab', slug: 'kicad-craft-lab', verified: true }, status: 'SHIPPING', fulfillmentType: 'PHYSICAL' },
    ],
    shipments: [
      { id: 'sh2', trackingNumber: 'GHTK9876543210', provider: 'GHTK', status: 'IN_TRANSIT', estimatedDays: 2 },
    ],
    payments: [
      { id: 'p2', provider: 'VNPAY', amount: 2510000, status: 'SUCCESS', paidAt: new Date(now - 3 * DAY + 60000).toISOString() },
    ],
  },
  {
    id: 'demo-ord-3',
    code: 'CH-100007',
    createdAt: new Date(now - 1 * DAY).toISOString(),
    status: 'DELIVERED',
    paymentStatus: 'SUCCESS',
    paymentMethod: 'MOCK',
    subtotal: 1290000,
    shippingTotal: 30000,
    grandTotal: 1320000,
    itemsCount: 3,
    shippingAddress: { fullName: 'Buyer 1', phone: '0901234567', line1: '12 Nguyen Hue', city: 'Ho Chi Minh', district: 'District 1' },
    items: [
      { id: 'i4', name: 'STM32F4 Discovery Kit', productType: 'PHYSICAL', unitPrice: 590000, quantity: 1, lineTotal: 590000, imageUrl: 'https://api.dicebear.com/7.x/shapes/svg?seed=stm32&backgroundColor=06b6d4', fulfillmentType: 'PHYSICAL' },
      { id: 'i5', name: '0.96" OLED Display Module', productType: 'PHYSICAL', unitPrice: 75000, quantity: 4, lineTotal: 300000, imageUrl: 'https://api.dicebear.com/7.x/shapes/svg?seed=oled&backgroundColor=22d3ee', fulfillmentType: 'PHYSICAL' },
      { id: 'i6', name: '40-pin GPIO Ribbon Cable', productType: 'PHYSICAL', unitPrice: 400000, quantity: 1, lineTotal: 400000, imageUrl: 'https://api.dicebear.com/7.x/shapes/svg?seed=gpio&backgroundColor=2dd4bf', fulfillmentType: 'PHYSICAL' },
    ],
    sellerOrders: [
      { id: 'so3', code: 'CH-100007-1', shop: { id: 'shop-a', name: 'BoardForge Studio', slug: 'boardforge-studio', verified: true }, status: 'DELIVERED', fulfillmentType: 'PHYSICAL' },
    ],
    shipments: [
      { id: 'sh3', trackingNumber: 'VTP5551212345', provider: 'VIETTEL_POST', status: 'DELIVERED', estimatedDays: 2 },
    ],
    payments: [
      { id: 'p3', provider: 'MOCK', amount: 1320000, status: 'SUCCESS', paidAt: new Date(now - 1 * DAY + 60000).toISOString() },
    ],
  },
  {
    id: 'demo-ord-4',
    code: 'CH-100008',
    createdAt: new Date(now - 2 * 3600000).toISOString(),
    status: 'PAID',
    paymentStatus: 'SUCCESS',
    paymentMethod: 'MOMO',
    subtotal: 1890000,
    shippingTotal: 0,
    grandTotal: 1890000,
    itemsCount: 2,
    shippingAddress: { fullName: 'Buyer 1', phone: '0901234567', line1: '12 Nguyen Hue', city: 'Ho Chi Minh', district: 'District 1' },
    items: [
      { id: 'i7', name: 'KiCad 9 — IoT Sensor Hub Project', productType: 'DIGITAL', unitPrice: 1290000, quantity: 1, lineTotal: 1290000, imageUrl: 'https://api.dicebear.com/7.x/shapes/svg?seed=kicad9&backgroundColor=06b6d4', fulfillmentType: 'DIGITAL' },
      { id: 'i8', name: 'ESP32 Firmware Bundle (BLE + Wi-Fi)', productType: 'DIGITAL', unitPrice: 600000, quantity: 1, lineTotal: 600000, imageUrl: 'https://api.dicebear.com/7.x/shapes/svg?seed=fw&backgroundColor=22d3ee', fulfillmentType: 'DIGITAL' },
    ],
    sellerOrders: [
      { id: 'so4', code: 'CH-100008-1', shop: { id: 'shop-b', name: 'KiCad Craft Lab', slug: 'kicad-craft-lab', verified: true }, status: 'CONFIRMED', fulfillmentType: 'DIGITAL' },
    ],
    shipments: [],
    payments: [
      { id: 'p4', provider: 'MOMO', amount: 1890000, status: 'SUCCESS', paidAt: new Date(now - 2 * 3600000 + 60000).toISOString() },
    ],
  },
  {
    id: 'demo-ord-5',
    code: 'CH-100009',
    createdAt: new Date(now - 14 * DAY).toISOString(),
    status: 'COMPLETED',
    paymentStatus: 'SUCCESS',
    paymentMethod: 'ZALOPAY',
    subtotal: 3200000,
    shippingTotal: 0,
    grandTotal: 3200000,
    itemsCount: 1,
    shippingAddress: { fullName: 'Buyer 1', phone: '0901234567', line1: '12 Nguyen Hue', city: 'Ho Chi Minh', district: 'District 1' },
    items: [
      { id: 'i9', name: 'Custom PCB Design Service — 4-Layer Board', productType: 'SERVICE', unitPrice: 3200000, quantity: 1, lineTotal: 3200000, imageUrl: 'https://api.dicebear.com/7.x/shapes/svg?seed=service&backgroundColor=2dd4bf', fulfillmentType: 'SERVICE' },
    ],
    sellerOrders: [
      { id: 'so5', code: 'CH-100009-1', shop: { id: 'shop-c', name: 'Hardware Workshop', slug: 'hardware-workshop', verified: true }, status: 'COMPLETED', fulfillmentType: 'SERVICE' },
    ],
    shipments: [],
    payments: [
      { id: 'p5', provider: 'ZALOPAY', amount: 3200000, status: 'SUCCESS', paidAt: new Date(now - 14 * DAY + 60000).toISOString() },
    ],
  },
  {
    id: 'demo-ord-6',
    code: 'CH-100010',
    createdAt: new Date(now - 5 * 3600000).toISOString(),
    status: 'PENDING',
    paymentStatus: 'PENDING',
    paymentMethod: 'COD',
    subtotal: 540000,
    shippingTotal: 30000,
    grandTotal: 570000,
    itemsCount: 2,
    shippingAddress: { fullName: 'Buyer 1', phone: '0901234567', line1: '12 Nguyen Hue', city: 'Ho Chi Minh', district: 'District 1' },
    items: [
      { id: 'i10', name: 'Raspberry Pi Pico W', productType: 'PHYSICAL', unitPrice: 145000, quantity: 2, lineTotal: 290000, imageUrl: 'https://api.dicebear.com/7.x/shapes/svg?seed=pico&backgroundColor=06b6d4', fulfillmentType: 'PHYSICAL' },
      { id: 'i11', name: 'Breadboard 830-point + Jumper Kit', productType: 'PHYSICAL', unitPrice: 250000, quantity: 1, lineTotal: 250000, imageUrl: 'https://api.dicebear.com/7.x/shapes/svg?seed=bb&backgroundColor=22d3ee', fulfillmentType: 'PHYSICAL' },
    ],
    sellerOrders: [
      { id: 'so6', code: 'CH-100010-1', shop: { id: 'shop-a', name: 'BoardForge Studio', slug: 'boardforge-studio', verified: true }, status: 'PENDING', fulfillmentType: 'PHYSICAL' },
    ],
    shipments: [],
    payments: [
      { id: 'p6', provider: 'COD', amount: 570000, status: 'PENDING', paidAt: new Date(now - 5 * 3600000).toISOString() },
    ],
  },
];

const DEMO_DOWNLOADS: DemoDownload[] = [
  {
    id: 'dl1',
    productId: 'p1',
    slug: 'kicad-9-iot-sensor-hub',
    name: 'KiCad 9 — IoT Sensor Hub Project',
    image: 'https://api.dicebear.com/7.x/shapes/svg?seed=kicad9&backgroundColor=06b6d4',
    version: 'v9.0.2',
    fileSize: 48230000,
    licenseType: 'COMMERCIAL',
    licenseKey: 'KCH-CM-9X7K2-A3D8F',
    lastDownloadedAt: new Date(now - 2 * DAY).toISOString(),
    purchaseDate: new Date(now - 1 * DAY).toISOString(),
    software: 'KiCad',
  },
  {
    id: 'dl2',
    productId: 'p2',
    slug: 'esp32-firmware-bundle-ble-wifi',
    name: 'ESP32 Firmware Bundle (BLE + Wi-Fi)',
    image: 'https://api.dicebear.com/7.x/shapes/svg?seed=fw&backgroundColor=22d3ee',
    version: 'v2.4.1',
    fileSize: 12400000,
    licenseType: 'PERSONAL',
    licenseKey: 'ESP-PS-2K4M8-B9N1Q',
    lastDownloadedAt: new Date(now - 6 * 3600000).toISOString(),
    purchaseDate: new Date(now - 1 * DAY).toISOString(),
    software: 'ESP-IDF',
  },
  {
    id: 'dl3',
    productId: 'p3',
    slug: 'altium-stm32-reference-design',
    name: 'Altium STM32 Reference Design',
    image: 'https://api.dicebear.com/7.x/shapes/svg?seed=altium&backgroundColor=2dd4bf',
    version: 'v1.0.0',
    fileSize: 89500000,
    licenseType: 'EXTENDED',
    licenseKey: 'ALT-EX-STM32-9XK2M',
    lastDownloadedAt: new Date(now - 21 * DAY).toISOString(),
    purchaseDate: new Date(now - 28 * DAY).toISOString(),
    software: 'Altium',
  },
  {
    id: 'dl4',
    productId: 'p4',
    slug: 'gerber-4layer-board-package',
    name: 'Gerber 4-Layer Board Package',
    image: 'https://api.dicebear.com/7.x/shapes/svg?seed=gerber&backgroundColor=06b6d4',
    version: 'rev-2',
    fileSize: 2400000,
    licenseType: 'COMMERCIAL',
    licenseKey: 'GBR-CM-4L2R-Z8M5P',
    lastDownloadedAt: new Date(now - 30 * DAY).toISOString(),
    purchaseDate: new Date(now - 35 * DAY).toISOString(),
    software: 'Gerber',
  },
];

const DEMO_LICENSES: DemoLicense[] = [
  {
    id: 'lc1',
    productId: 'p1',
    productName: 'KiCad 9 — IoT Sensor Hub Project',
    productSlug: 'kicad-9-iot-sensor-hub',
    licenseType: 'COMMERCIAL',
    licenseKey: 'KCH-CM-9X7K2-A3D8F',
    purchaseDate: new Date(now - 1 * DAY).toISOString(),
    status: 'ACTIVE',
    seats: 5,
    usedSeats: 2,
    terms:
      'This Commercial License grants the purchaser, their team members, and direct contractors the right to use, modify, and distribute the included design files in commercial products. Sub-licensing or resale of the design files themselves is prohibited. Attribution to the original designer is required in any derivative documentation. License is perpetual and tied to the purchasing entity.',
  },
  {
    id: 'lc2',
    productId: 'p2',
    productName: 'ESP32 Firmware Bundle (BLE + Wi-Fi)',
    productSlug: 'esp32-firmware-bundle-ble-wifi',
    licenseType: 'PERSONAL',
    licenseKey: 'ESP-PS-2K4M8-B9N1Q',
    purchaseDate: new Date(now - 1 * DAY).toISOString(),
    status: 'ACTIVE',
    seats: 1,
    usedSeats: 1,
    terms:
      'This Personal License grants the purchaser the right to use, modify, and compile the firmware for personal, non-commercial projects. Commercial deployment requires upgrade to a Commercial License. Redistribution of source code is not permitted. License is perpetual for the purchasing individual.',
  },
  {
    id: 'lc3',
    productId: 'p3',
    productName: 'Altium STM32 Reference Design',
    productSlug: 'altium-stm32-reference-design',
    licenseType: 'EXTENDED',
    licenseKey: 'ALT-EX-STM32-9XK2M',
    purchaseDate: new Date(now - 28 * DAY).toISOString(),
    status: 'ACTIVE',
    seats: 10,
    usedSeats: 4,
    terms:
      'This Extended License grants up to 10 named users the right to use, modify, and manufacture products based on the included design files for both personal and commercial use. Sub-licensing is prohibited. Perpetual license with one year of priority support and free updates.',
  },
  {
    id: 'lc4',
    productId: 'p4',
    productName: 'Gerber 4-Layer Board Package',
    productSlug: 'gerber-4layer-board-package',
    licenseType: 'COMMERCIAL',
    licenseKey: 'GBR-CM-4L2R-Z8M5P',
    purchaseDate: new Date(now - 35 * DAY).toISOString(),
    status: 'ACTIVE',
    seats: 3,
    usedSeats: 1,
    terms:
      'This Commercial License grants the purchaser the right to manufacture, sell, and distribute PCB products based on the included Gerber files. Resale of the Gerber files themselves is prohibited. Perpetual license with no attribution requirement.',
  },
];

const DEMO_REVIEWS: DemoReview[] = [
  {
    id: 'rv1',
    productId: 'p1',
    productName: 'KiCad 9 — IoT Sensor Hub Project',
    productSlug: 'kicad-9-iot-sensor-hub',
    rating: 5,
    comment:
      'Excellent project — opened cleanly in KiCad 9 with no library errors. Schematic hierarchy is well-organized and the BOM is complete. Saved me at least a week of work.',
    createdAt: new Date(now - 6 * 3600000).toISOString(),
    verifiedPurchase: true,
    sellerReply: 'Thank you for the kind words! Let us know if you need any customizations — happy to help with revisions.',
    sellerReplyAt: new Date(now - 4 * 3600000).toISOString(),
  },
  {
    id: 'rv2',
    productId: 'p2',
    productName: 'ESP32 Firmware Bundle (BLE + Wi-Fi)',
    productSlug: 'esp32-firmware-bundle-ble-wifi',
    rating: 4,
    comment:
      'Solid firmware bundle. BLE pairing works out of the box. Documentation could be a bit more detailed around the Wi-Fi reconnect logic, but overall a great value.',
    createdAt: new Date(now - 3 * DAY).toISOString(),
    verifiedPurchase: true,
  },
  {
    id: 'rv3',
    productId: 'p3',
    productName: 'Altium STM32 Reference Design',
    productSlug: 'altium-stm32-reference-design',
    rating: 5,
    comment:
      'Professional-grade design. Power integrity analysis was already done, DRC passed on first try. The included test points and debug header layout are very thoughtful.',
    createdAt: new Date(now - 25 * DAY).toISOString(),
    verifiedPurchase: true,
    sellerReply: 'Appreciate the detailed feedback — we spent extra cycles on PI analysis and test access.',
    sellerReplyAt: new Date(now - 24 * DAY).toISOString(),
  },
];

const DEMO_ADDRESS: DemoAddress = {
  id: 'addr-1',
  fullName: 'Buyer 1',
  phone: '0901234567',
  line1: '12 Nguyen Hue',
  line2: 'Floor 8, Master Building',
  city: 'Ho Chi Minh',
  district: 'District 1',
  ward: 'Ben Nghe',
  zipCode: '700000',
  country: 'Vietnam',
  isDefault: true,
};

const DEMO_NOTIFICATIONS: Array<{
  id: string;
  type: string;
  title: string;
  body: string;
  read: boolean;
  createdAt: string;
}> = [
  { id: 'n1', type: 'ORDER_SHIPPED', title: 'Your order has shipped', body: 'Order CH-100006 is on its way via GHTK. Tracking: GHTK9876543210.', read: false, createdAt: new Date(now - 6 * 3600000).toISOString() },
  { id: 'n2', type: 'ORDER_DELIVERED', title: 'Order delivered', body: 'Order CH-100007 was delivered. Enjoy your new gear!', read: false, createdAt: new Date(now - 18 * 3600000).toISOString() },
  { id: 'n3', type: 'PROMOTION', title: '15% off BoardForge', body: 'Use code FORGE15 at checkout for 15% off all BoardForge products this week.', read: true, createdAt: new Date(now - 2 * DAY).toISOString() },
  { id: 'n4', type: 'DOWNLOAD_READY', title: 'Your download is ready', body: 'KiCad 9 — IoT Sensor Hub Project is ready. Visit My Downloads to grab the files.', read: true, createdAt: new Date(now - 1 * DAY).toISOString() },
  { id: 'n5', type: 'LICENSE_ISSUED', title: 'License issued', body: 'Commercial license KCH-CM-9X7K2-A3D8F has been issued for KiCad 9 — IoT Sensor Hub Project.', read: true, createdAt: new Date(now - 1 * DAY).toISOString() },
];

/* ============================================================
   Helper components — module scope to satisfy React Compiler
   "static-components" rule.
   ============================================================ */

function TabIcon({ id, className }: { id: TabId; className?: string }) {
  const tab = TABS.find((t) => t.id === id);
  const Icon: typeof Package = tab?.icon ?? Package;
  return <Icon className={className} />;
}

function OrderStatusBadge({ status }: { status: string }) {
  const cfg = ORDER_STATUS_CONFIG[status] ?? ORDER_STATUS_CONFIG.PENDING;
  return (
    <Badge variant="outline" className={cn('gap-1.5 font-medium', cfg.cls)}>
      <span className={cn('h-1.5 w-1.5 rounded-full', cfg.dot)} />
      {cfg.label}
    </Badge>
  );
}

function PaymentStatusBadge({ status }: { status: string }) {
  const cfg = PAYMENT_STATUS_CONFIG[status] ?? PAYMENT_STATUS_CONFIG.PENDING;
  return <Badge variant="outline" className={cn('font-medium', cfg.cls)}>{cfg.label}</Badge>;
}

function LicenseTypeBadge({ type }: { type: string }) {
  const cfg = LICENSE_TYPE_CONFIG[type] ?? LICENSE_TYPE_CONFIG.PERSONAL;
  return <Badge variant="outline" className={cn('font-medium', cfg.cls)}>{cfg.label}</Badge>;
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
    <div className="flex flex-col items-center justify-center text-center py-16 px-4">
      <div className="flex h-20 w-20 mb-5 items-center justify-center rounded-3xl bg-cyan-50 border border-cyan-100 text-cyan-500">
        <Icon className="h-10 w-10" />
      </div>
      <h3 className="text-xl font-semibold text-foreground mb-1.5">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-md mb-6">{description}</p>
      {cta && onCta && (
        <Button onClick={onCta} className="bg-cyan-500 hover:bg-cyan-600 text-white">
          {cta}
          <ArrowRight className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}

/* ---------------- Stat card (Overview) ---------------- */

function StatCard({
  icon: Icon,
  label,
  value,
  hint,
  accent,
}: {
  icon: typeof Package;
  label: string;
  value: string;
  hint?: string;
  accent: 'cyan' | 'aqua' | 'rose' | 'amber';
}) {
  const accentCls: Record<typeof accent, string> = {
    cyan: 'from-cyan-500 to-cyan-400',
    aqua: 'from-teal-500 to-cyan-400',
    rose: 'from-rose-500 to-pink-400',
    amber: 'from-amber-500 to-orange-400',
  };
  return (
    <Card className="relative overflow-hidden border-border/60 bg-white/80 backdrop-blur-sm hover:shadow-[0_8px_24px_-12px_rgba(6,182,212,0.25)] transition-shadow">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</p>
            <p className="mt-2 text-2xl sm:text-3xl font-bold text-foreground tabular-nums truncate">{value}</p>
            {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
          </div>
          <div className={cn('flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-[0_8px_18px_-8px_rgba(6,182,212,0.5)]', accentCls[accent])}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/* ---------------- Order timeline ---------------- */

function OrderTimeline({ status, createdAt }: { status: string; createdAt: string }) {
  const completedSteps = STATUS_TO_STEPS[status] ?? 1;
  const base = new Date(createdAt).getTime();
  const isCancelled = status === 'CANCELLED';
  const steps = TIMELINE_STEPS.map((s, idx) => {
    const isComplete = idx < completedSteps;
    const ts = new Date(base + idx * 6 * 3600000).toISOString();
    return { ...s, isComplete, ts };
  });

  return (
    <ol className="relative space-y-4 pl-6">
      {steps.map((s, idx) => {
        const isLast = idx === steps.length - 1;
        return (
          <li key={s.id} className="relative">
            {/* Connector */}
            {!isLast && (
              <span
                aria-hidden
                className={cn(
                  'absolute left-[7px] top-5 bottom-[-1rem] w-px',
                  s.isComplete ? 'bg-cyan-300' : 'bg-border',
                )}
              />
            )}
            {/* Dot */}
            <span
              className={cn(
                'absolute -left-6 top-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full border-2',
                isCancelled && idx === 0 ? 'border-red-400 bg-red-500' : s.isComplete ? 'border-cyan-500 bg-cyan-500' : 'border-border bg-background',
              )}
            >
              {s.isComplete && !isCancelled && <CheckCircle2 className="h-2.5 w-2.5 text-white" />}
            </span>
            {/* Label + time */}
            <div className="flex items-baseline justify-between gap-3">
              <p className={cn('text-sm font-medium', s.isComplete ? 'text-foreground' : 'text-muted-foreground')}>
                {s.label}
                {isCancelled && idx === 0 && <span className="ml-1.5 text-red-600">· cancelled</span>}
              </p>
              <time className="text-xs text-muted-foreground tabular-nums whitespace-nowrap">
                {s.isComplete ? formatDate(s.ts, { hour: '2-digit', minute: '2-digit' }) : '—'}
              </time>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

/* ---------------- Order card (My Orders) ---------------- */

function OrderCard({ order, toast }: { order: DemoOrder; toast: (t: any) => void }) {
  const [expanded, setExpanded] = useState(false);
  const cfg = ORDER_STATUS_CONFIG[order.status] ?? ORDER_STATUS_CONFIG.PENDING;

  return (
    <Card className={cn('overflow-hidden border-border/60 transition-all', expanded ? 'shadow-[0_12px_32px_-12px_rgba(6,182,212,0.35)]' : 'hover:shadow-[0_8px_24px_-12px_rgba(6,182,212,0.25)]')}>
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="w-full text-left p-5 hover:bg-cyan-50/40 transition-colors"
        aria-expanded={expanded}
      >
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
          {/* Code */}
          <div className="flex items-center gap-2 min-w-[8rem]">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-cyan-50 border border-cyan-100 text-cyan-600">
              <Package className="h-4 w-4" />
            </div>
            <div>
              <p className="font-mono text-sm font-semibold text-foreground">{order.code}</p>
              <p className="text-xs text-muted-foreground">{formatDate(order.createdAt)}</p>
            </div>
          </div>

          {/* Items count */}
          <div className="flex flex-col">
            <p className="text-xs text-muted-foreground">Items</p>
            <p className="text-sm font-semibold text-foreground">{order.itemsCount}</p>
          </div>

          {/* Total */}
          <div className="flex flex-col">
            <p className="text-xs text-muted-foreground">Total</p>
            <p className="text-sm font-semibold text-cyan-700 tabular-nums">{formatVND(order.grandTotal)}</p>
          </div>

          {/* Status */}
          <div className="flex flex-col gap-1">
            <p className="text-xs text-muted-foreground">Order status</p>
            <OrderStatusBadge status={order.status} />
          </div>

          {/* Payment */}
          <div className="flex flex-col gap-1">
            <p className="text-xs text-muted-foreground">Payment</p>
            <div className="flex items-center gap-2">
              <PaymentStatusBadge status={order.paymentStatus} />
              <span className="text-xs text-muted-foreground font-mono">{order.paymentMethod}</span>
            </div>
          </div>

          {/* Expand icon */}
          <div className="ml-auto flex items-center gap-1 text-cyan-600">
            <span className="text-xs font-medium">{expanded ? 'Hide' : 'View'}</span>
            <ChevronDown className={cn('h-4 w-4 transition-transform', expanded ? 'rotate-180' : '')} />
          </div>
        </div>
      </button>

      {/* Expanded details */}
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="border-t border-border/60 bg-slate-50/40 overflow-hidden"
          >
            <div className="p-5 grid lg:grid-cols-[1.4fr_1fr] gap-6">
              {/* Left: items + timeline */}
              <div className="space-y-5">
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3 flex items-center gap-1.5">
                    <ClipboardList className="h-3.5 w-3.5" />
                    Items in this order
                  </h4>
                  <div className="space-y-2">
                    {order.items.map((it) => (
                      <div key={it.id} className="flex items-center gap-3 rounded-lg border border-border/60 bg-white p-3">
                        <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-md bg-cyan-50">
                          {it.imageUrl && (
                            <Image src={it.imageUrl} alt={it.name} fill sizes="48px" className="object-cover" unoptimized />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{it.name}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <ProductTypeBadge type={it.productType} />
                            <span className="text-xs text-muted-foreground">×{it.quantity}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold text-foreground tabular-nums">{formatVND(it.lineTotal)}</p>
                          <p className="text-xs text-muted-foreground tabular-nums">{formatVND(it.unitPrice)} ea</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3 flex items-center gap-1.5">
                    <Activity className="h-3.5 w-3.5" />
                    Order timeline
                  </h4>
                  <OrderTimeline status={order.status} createdAt={order.createdAt} />
                </div>
              </div>

              {/* Right: address + tracking + actions */}
              <div className="space-y-5">
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3 flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5" />
                    Shipping address
                  </h4>
                  <div className="rounded-lg border border-border/60 bg-white p-3 text-sm">
                    <p className="font-medium text-foreground">{order.shippingAddress.fullName}</p>
                    <p className="text-muted-foreground">{order.shippingAddress.phone}</p>
                    <p className="text-muted-foreground mt-1.5">
                      {order.shippingAddress.line1}
                      {order.shippingAddress.district ? `, ${order.shippingAddress.district}` : ''}
                    </p>
                    <p className="text-muted-foreground">{order.shippingAddress.city}</p>
                  </div>
                </div>

                {order.shipments.length > 0 && (
                  <div>
                    <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3 flex items-center gap-1.5">
                      <Truck className="h-3.5 w-3.5" />
                      Tracking
                    </h4>
                    <div className="rounded-lg border border-border/60 bg-white p-3 text-sm space-y-1.5">
                      {order.shipments.map((sh) => (
                        <div key={sh.id} className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-foreground">{sh.provider}</p>
                            <p className="text-xs text-muted-foreground font-mono">{sh.trackingNumber}</p>
                          </div>
                          <Badge variant="outline" className="bg-cyan-50 text-cyan-700 border-cyan-200">
                            {sh.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex gap-2 pt-1">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => toast({ title: 'Invoice download', description: `Invoice for ${order.code} is being prepared.` })}
                  >
                    <FileText className="h-3.5 w-3.5" />
                    Invoice
                  </Button>
                  {order.status === 'COMPLETED' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => toast({ title: 'Re-order started', description: `${order.code} items added to cart.` })}
                    >
                      <RefreshCw className="h-3.5 w-3.5" />
                      Re-order
                    </Button>
                  )}
                  {order.status === 'PENDING' && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-red-600 hover:text-red-700"
                      onClick={() => toast({ title: 'Cancel requested', description: `Order ${order.code} cancellation requested.`, variant: 'destructive' })}
                    >
                      <X className="h-3.5 w-3.5" />
                      Cancel
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}

/* ---------------- Download card ---------------- */

function DownloadCard({ download, toast }: { download: DemoDownload; toast: (t: any) => void }) {
  return (
    <Card className="overflow-hidden border-border/60 hover:shadow-[0_8px_24px_-12px_rgba(6,182,212,0.25)] transition-shadow">
      <CardContent className="p-4 flex flex-col sm:flex-row gap-4">
        {/* Image */}
        <div className="relative h-20 w-full sm:h-20 sm:w-20 shrink-0 overflow-hidden rounded-lg bg-cyan-50 border border-cyan-100">
          <Image src={download.image} alt={download.name} fill sizes="80px" className="object-cover" unoptimized />
        </div>
        {/* Body */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-start gap-x-3 gap-y-1.5">
            <h3 className="text-sm font-semibold text-foreground">{download.name}</h3>
            <Badge variant="outline" className="bg-teal-50 text-teal-700 border-teal-200 gap-1">
              <Download className="h-3 w-3" />
              Digital
            </Badge>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <TechBadge label={download.version} />
            <TechBadge label={download.software} />
            <span className="flex items-center gap-1">
              <FileArchive className="h-3 w-3" />
              {formatFileSize(download.fileSize)}
            </span>
            <span className="flex items-center gap-1">
              <Key className="h-3 w-3" />
              {download.licenseType}
            </span>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Purchased {formatDate(download.purchaseDate)} · Last downloaded {download.lastDownloadedAt ? timeAgo(download.lastDownloadedAt) : 'never'}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button
              size="sm"
              className="bg-cyan-500 hover:bg-cyan-600 text-white"
              onClick={() => toast({ title: 'Secure download link generated', description: `${download.name} (${download.version}) — link valid for 24h.` })}
            >
              <Download className="h-3.5 w-3.5" />
              Download
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => toast({ title: 'License copied', description: `License key ${download.licenseKey} copied to clipboard.` })}
            >
              <Key className="h-3.5 w-3.5" />
              Copy license
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/* ---------------- Wishlist card ---------------- */

function WishlistCard({
  item,
  onAddCart,
  onRemove,
}: {
  item: { productId: string; slug: string; name: string; imageUrl?: string; price: number };
  onAddCart: (item: { productId: string; slug: string; name: string; imageUrl?: string; price: number }) => void;
  onRemove: (productId: string) => void;
}) {
  return (
    <Card className="overflow-hidden border-border/60 hover:shadow-[0_8px_24px_-12px_rgba(6,182,212,0.25)] transition-shadow flex flex-col">
      <div className="relative aspect-[4/3] w-full bg-cyan-50">
        {item.imageUrl ? (
          <Image src={item.imageUrl} alt={item.name} fill sizes="(min-width: 1024px) 25vw, 50vw" className="object-cover" unoptimized />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-cyan-300">
            <Package className="h-10 w-10" />
          </div>
        )}
        <button
          type="button"
          onClick={() => onRemove(item.productId)}
          aria-label="Remove from wishlist"
          className="absolute top-2 right-2 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 hover:bg-white shadow border border-border/60 text-rose-500 hover:text-rose-600 transition-colors"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
      <CardContent className="p-4 flex flex-col gap-3 flex-1">
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-foreground line-clamp-2">{item.name}</h3>
          <p className="mt-1.5 text-lg font-bold text-cyan-700 tabular-nums">{formatVND(item.price)}</p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" className="flex-1 bg-cyan-500 hover:bg-cyan-600 text-white" onClick={() => onAddCart(item)}>
            <ShoppingBag className="h-3.5 w-3.5" />
            Add to cart
          </Button>
          <Button size="sm" variant="outline" onClick={() => onRemove(item.productId)} className="text-rose-500 hover:text-rose-600 hover:bg-rose-50">
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

/* ---------------- License card ---------------- */

function LicenseCard({ license }: { license: DemoLicense }) {
  const [showTerms, setShowTerms] = useState(false);
  return (
    <Card className="overflow-hidden border-border/60">
      <CardContent className="p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-teal-400 text-white shadow-[0_8px_18px_-8px_rgba(6,182,212,0.5)]">
              <Key className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-semibold text-foreground truncate">{license.productName}</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Purchased {formatDate(license.purchaseDate)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <LicenseTypeBadge type={license.licenseType} />
            <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 gap-1">
              <CheckCircle2 className="h-3 w-3" />
              Active
            </Badge>
          </div>
        </div>

        <div className="mt-4 grid sm:grid-cols-2 gap-3">
          <div className="rounded-lg border border-border/60 bg-slate-50/60 p-3">
            <p className="text-xs text-muted-foreground mb-1">License key</p>
            <p className="font-mono text-sm font-semibold text-foreground break-all">{license.licenseKey}</p>
          </div>
          <div className="rounded-lg border border-border/60 bg-slate-50/60 p-3">
            <p className="text-xs text-muted-foreground mb-1">Seats</p>
            <p className="text-sm font-semibold text-foreground tabular-nums">
              {license.usedSeats} / {license.seats} <span className="text-muted-foreground font-normal">used</span>
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowTerms((v) => !v)}
          className="mt-4 flex items-center gap-1.5 text-sm font-medium text-cyan-700 hover:text-cyan-800"
        >
          <FileText className="h-4 w-4" />
          {showTerms ? 'Hide' : 'View'} license terms
          <ChevronDown className={cn('h-3.5 w-3.5 transition-transform', showTerms ? 'rotate-180' : '')} />
        </button>
        <AnimatePresence initial={false}>
          {showTerms && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <p className="mt-3 text-sm text-muted-foreground leading-relaxed border-l-2 border-cyan-200 pl-3">
                {license.terms}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}

/* ---------------- Address card ---------------- */

function AddressCard({
  address,
  onEdit,
  onDelete,
}: {
  address: DemoAddress;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <Card className="overflow-hidden border-border/60">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-teal-400 text-white shadow-[0_8px_18px_-8px_rgba(6,182,212,0.5)]">
              <MapPin className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm font-semibold text-foreground">{address.fullName}</h3>
                {address.isDefault && (
                  <Badge variant="outline" className="bg-cyan-50 text-cyan-700 border-cyan-200 gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    Default
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">{address.phone}</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-cyan-700 hover:bg-cyan-50" onClick={onEdit} aria-label="Edit address">
              <Edit2 className="h-3.5 w-3.5" />
            </Button>
            <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-rose-600 hover:bg-rose-50" onClick={onDelete} aria-label="Delete address">
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
        <Separator className="my-4" />
        <div className="text-sm text-muted-foreground space-y-0.5">
          <p>{address.line1}</p>
          {address.line2 && <p>{address.line2}</p>}
          <p>
            {address.ward ? `${address.ward}, ` : ''}{address.district}
          </p>
          <p>
            {address.city}{address.zipCode ? ` ${address.zipCode}` : ''}, {address.country}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

/* ---------------- Review card ---------------- */

function ReviewCard({ review, onGoProduct }: { review: DemoReview; onGoProduct: (slug: string) => void }) {
  return (
    <Card className="overflow-hidden border-border/60">
      <CardContent className="p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <button type="button" onClick={() => onGoProduct(review.productSlug)} className="text-left min-w-0">
            <p className="text-xs font-medium text-cyan-700 uppercase tracking-wide">Reviewed product</p>
            <h3 className="text-sm font-semibold text-foreground hover:text-cyan-700 transition-colors">{review.productName}</h3>
          </button>
          <div className="flex items-center gap-2">
            <Rating value={review.rating} showCount={false} size="sm" />
            {review.verifiedPurchase && <VerifiedBadge />}
          </div>
        </div>
        <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{review.comment}</p>
        <p className="mt-3 text-xs text-muted-foreground">
          Written {formatDate(review.createdAt)} · {timeAgo(review.createdAt)}
        </p>
        {review.sellerReply && (
          <div className="mt-4 rounded-lg border-l-2 border-cyan-300 bg-cyan-50/40 p-3">
            <p className="text-xs font-semibold text-cyan-700 mb-1 flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5" />
              Seller reply
            </p>
            <p className="text-sm text-foreground/90 leading-relaxed">{review.sellerReply}</p>
            {review.sellerReplyAt && (
              <p className="mt-2 text-xs text-muted-foreground">{timeAgo(review.sellerReplyAt)}</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/* ---------------- Notification item ---------------- */

function NotificationItem({ n }: { n: { id: string; type: string; title: string; body: string; read: boolean; createdAt: string } }) {
  const Icon =
    n.type === 'ORDER_SHIPPED' ? Truck
    : n.type === 'ORDER_DELIVERED' ? CheckCircle2
    : n.type === 'PROMOTION' ? Sparkles
    : n.type === 'DOWNLOAD_READY' ? Download
    : n.type === 'LICENSE_ISSUED' ? Key
    : Bell;
  const accentCls =
    n.type === 'ORDER_SHIPPED' ? 'bg-blue-50 text-blue-600'
    : n.type === 'ORDER_DELIVERED' ? 'bg-emerald-50 text-emerald-600'
    : n.type === 'PROMOTION' ? 'bg-amber-50 text-amber-600'
    : n.type === 'DOWNLOAD_READY' ? 'bg-teal-50 text-teal-600'
    : n.type === 'LICENSE_ISSUED' ? 'bg-cyan-50 text-cyan-600'
    : 'bg-slate-50 text-slate-600';

  return (
    <div className="flex gap-3 rounded-lg border border-border/60 bg-white p-3">
      <div className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-lg', accentCls)}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-medium text-foreground">{n.title}</p>
          {!n.read && <span className="h-2 w-2 shrink-0 rounded-full bg-cyan-500 mt-1.5" aria-label="unread" />}
        </div>
        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.body}</p>
        <p className="text-xs text-muted-foreground mt-1.5">{timeAgo(n.createdAt)}</p>
      </div>
    </div>
  );
}

/* ---------------- Tab content components ---------------- */

function OverviewTab({
  orders,
  wishlistCount,
  downloads,
  notifications,
  onGoProducts,
  onGoTab,
}: {
  orders: DemoOrder[];
  wishlistCount: number;
  downloads: DemoDownload[];
  notifications: Array<{ id: string; type: string; title: string; body: string; read: boolean; createdAt: string }>;
  onGoProducts: () => void;
  onGoTab: (t: TabId) => void;
}) {
  const totalSpent = orders.reduce((s, o) => s + o.grandTotal, 0);
  const recentOrders = orders.slice(0, 3);

  return (
    <div className="space-y-6">
      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard icon={Package} label="Total Orders" value={String(orders.length)} hint={`${orders.filter((o) => o.status === 'COMPLETED').length} completed`} accent="cyan" />
        <StatCard icon={Wallet} label="Total Spent" value={formatVND(totalSpent)} hint="All-time spending" accent="aqua" />
        <StatCard icon={Heart} label="Wishlist" value={String(wishlistCount)} hint={wishlistCount === 0 ? 'Add favorites' : 'Saved products'} accent="rose" />
        <StatCard icon={Download} label="Downloads" value={String(downloads.length)} hint="Digital purchases" accent="amber" />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent orders (2 cols) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <Clock className="h-4 w-4 text-cyan-600" />
                Recent orders
              </h2>
              <p className="text-xs text-muted-foreground">Your latest 3 purchases</p>
            </div>
            <Button size="sm" variant="outline" onClick={() => onGoTab('orders')}>
              View all
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
          {recentOrders.length === 0 ? (
            <Card className="border-border/60">
              <CardContent className="p-6 text-center text-sm text-muted-foreground">
                No orders yet — <button className="text-cyan-700 font-medium hover:underline" onClick={onGoProducts}>browse products</button> to place your first order.
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {recentOrders.map((o) => (
                <Card key={o.id} className="border-border/60 hover:shadow-[0_8px_24px_-12px_rgba(6,182,212,0.25)] transition-shadow">
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-cyan-50 border border-cyan-100 text-cyan-600">
                      <Package className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-mono text-sm font-semibold text-foreground">{o.code}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(o.createdAt)} · {o.itemsCount} items</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-cyan-700 tabular-nums">{formatVND(o.grandTotal)}</p>
                      <OrderStatusBadge status={o.status} />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Right column: notifications */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <Bell className="h-4 w-4 text-cyan-600" />
              Notifications
            </h2>
            <Button size="sm" variant="ghost" className="text-xs text-muted-foreground">
              Mark all read
            </Button>
          </div>
          <div className="space-y-2 max-h-[440px] overflow-y-auto pr-1">
            {notifications.length === 0 ? (
              <Card className="border-border/60">
                <CardContent className="p-6 text-center text-sm text-muted-foreground">
                  No notifications yet.
                </CardContent>
              </Card>
            ) : (
              notifications.slice(0, 6).map((n) => <NotificationItem key={n.id} n={n} />)
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function OrdersTab({
  orders,
  toast,
  onGoProducts,
}: {
  orders: DemoOrder[];
  toast: (t: any) => void;
  onGoProducts: () => void;
}) {
  const [filter, setFilter] = useState<string>('ALL');
  const filtered = filter === 'ALL' ? orders : orders.filter((o) => o.status === filter);

  const FILTERS: { id: string; label: string }[] = [
    { id: 'ALL', label: 'All' },
    { id: 'PENDING', label: 'Pending' },
    { id: 'PAID', label: 'Paid' },
    { id: 'SHIPPED', label: 'Shipped' },
    { id: 'DELIVERED', label: 'Delivered' },
    { id: 'COMPLETED', label: 'Completed' },
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-foreground">My Orders</h2>
          <p className="text-sm text-muted-foreground">{orders.length} total orders · Click any order to expand details</p>
        </div>
        <Button variant="outline" size="sm" onClick={onGoProducts}>
          <ShoppingBag className="h-3.5 w-3.5" />
          Continue shopping
        </Button>
      </div>

      {/* Filter pills */}
      <div className="flex flex-wrap gap-1.5">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setFilter(f.id)}
            className={cn(
              'px-3 py-1.5 rounded-full text-xs font-medium border transition-colors',
              filter === f.id
                ? 'bg-cyan-500 text-white border-cyan-500'
                : 'bg-white text-muted-foreground border-border/60 hover:border-cyan-300 hover:text-cyan-700',
            )}
          >
            {f.label}
            <span className="ml-1.5 tabular-nums opacity-70">
              {f.id === 'ALL' ? orders.length : orders.filter((o) => o.status === f.id).length}
            </span>
          </button>
        ))}
      </div>

      {/* Orders list */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={PackageSearch}
          title="No orders found"
          description="Try a different filter, or place your first order from the marketplace."
          cta="Browse products"
          onCta={onGoProducts}
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((o) => (
            <OrderCard key={o.id} order={o} toast={toast} />
          ))}
        </div>
      )}
    </div>
  );
}

function DownloadsTab({
  downloads,
  toast,
  onGoProducts,
}: {
  downloads: DemoDownload[];
  toast: (t: any) => void;
  onGoProducts: () => void;
}) {
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-teal-400 text-white shadow-[0_8px_18px_-8px_rgba(6,182,212,0.5)]">
          <Download className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-foreground">My Downloads</h2>
          <p className="text-sm text-muted-foreground">{downloads.length} digital products · Secure download links valid for 24h</p>
        </div>
      </div>

      {downloads.length === 0 ? (
        <EmptyState
          icon={Download}
          title="No digital purchases yet"
          description="When you buy a digital product (KiCad project, Altium design, firmware bundle, Gerber package), it will appear here for instant download."
          cta="Browse digital products"
          onCta={onGoProducts}
        />
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {downloads.map((d) => (
            <DownloadCard key={d.id} download={d} toast={toast} />
          ))}
        </div>
      )}
    </div>
  );
}

function WishlistTab({
  items,
  onAddCart,
  onRemove,
  onClear,
  onGoProducts,
}: {
  items: Array<{ productId: string; slug: string; name: string; imageUrl?: string; price: number }>;
  onAddCart: (item: { productId: string; slug: string; name: string; imageUrl?: string; price: number }) => void;
  onRemove: (productId: string) => void;
  onClear: () => void;
  onGoProducts: () => void;
}) {
  const [shareOpen, setShareOpen] = useState(false);
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-rose-500 to-pink-400 text-white shadow-[0_8px_18px_-8px_rgba(244,63,94,0.5)]">
            <Heart className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-foreground">My Wishlist</h2>
            <p className="text-sm text-muted-foreground">{items.length} saved products</p>
          </div>
        </div>
        {items.length > 0 && (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setShareOpen(true)} className="border-cyan-200 text-cyan-700 hover:bg-cyan-50">
              <Share2 className="h-3.5 w-3.5" />
              Share
            </Button>
            <Button variant="outline" size="sm" onClick={onClear} className="text-rose-600 hover:text-rose-700 hover:bg-rose-50">
              <Trash2 className="h-3.5 w-3.5" />
              Clear all
            </Button>
          </div>
        )}
      </div>

      <WishlistShareDialog open={shareOpen} onOpenChange={setShareOpen} />

      {items.length === 0 ? (
        <EmptyState
          icon={Heart}
          title="Your wishlist is empty"
          description="Tap the heart icon on any product to save it here. We'll let you know when prices drop or stock changes."
          cta="Browse products"
          onCta={onGoProducts}
        />
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {items.map((it) => (
            <WishlistCard key={it.productId} item={it} onAddCart={onAddCart} onRemove={onRemove} />
          ))}
        </div>
      )}
    </div>
  );
}

function LicensesTab({ licenses, onGoProducts }: { licenses: DemoLicense[]; onGoProducts: () => void }) {
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-teal-400 text-white shadow-[0_8px_18px_-8px_rgba(6,182,212,0.5)]">
          <Key className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-foreground">My Licenses</h2>
          <p className="text-sm text-muted-foreground">{licenses.length} active licenses for digital products</p>
        </div>
      </div>

      {licenses.length === 0 ? (
        <EmptyState
          icon={Key}
          title="No licenses yet"
          description="When you purchase a digital product, a license is automatically issued and listed here. Each license includes terms, seats, and a unique license key."
          cta="Browse digital products"
          onCta={onGoProducts}
        />
      ) : (
        <div className="space-y-3">
          {licenses.map((l) => (
            <LicenseCard key={l.id} license={l} />
          ))}
        </div>
      )}
    </div>
  );
}

function AddressesTab({ toast }: { toast: (t: any) => void }) {
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-teal-400 text-white shadow-[0_8px_18px_-8px_rgba(6,182,212,0.5)]">
            <MapPin className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-foreground">My Addresses</h2>
            <p className="text-sm text-muted-foreground">1 saved address · used at checkout</p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={() => toast({ title: 'Add address', description: 'Address form would open here.' })}>
          <Plus className="h-3.5 w-3.5" />
          Add new address
        </Button>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <AddressCard
          address={DEMO_ADDRESS}
          onEdit={() => toast({ title: 'Edit address', description: 'Edit form would open for the default address.' })}
          onDelete={() => toast({ title: 'Cannot delete default', description: 'You must have at least one address.', variant: 'destructive' })}
        />
      </div>
    </div>
  );
}

function ProfileTab({
  name,
  email,
  phone,
  avatarUrl,
  toast,
}: {
  name: string;
  email: string;
  phone: string;
  avatarUrl?: string;
  toast: (t: any) => void;
}) {
  const [form, setForm] = useState({
    name,
    email,
    phone,
    avatarUrl: avatarUrl ?? '',
  });
  const [pwd, setPwd] = useState({ current: '', next: '', confirm: '' });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-teal-400 text-white shadow-[0_8px_18px_-8px_rgba(6,182,212,0.5)]">
          <User className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-foreground">My Profile</h2>
          <p className="text-sm text-muted-foreground">Manage your account information and security</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Avatar + summary */}
        <Card className="border-border/60 lg:col-span-1">
          <CardContent className="p-6 flex flex-col items-center text-center">
            <Avatar className="h-24 w-24 border-4 border-cyan-100">
              {form.avatarUrl && <AvatarImage src={form.avatarUrl} alt={form.name} />}
              <AvatarFallback className="bg-gradient-to-br from-cyan-500 to-teal-400 text-white text-2xl font-bold">
                {initials(form.name || 'Buyer')}
              </AvatarFallback>
            </Avatar>
            <h3 className="mt-4 text-lg font-semibold text-foreground">{form.name}</h3>
            <p className="text-sm text-muted-foreground">{form.email}</p>
            <Badge variant="outline" className="mt-3 bg-cyan-50 text-cyan-700 border-cyan-200 gap-1">
              <ShieldCheck className="h-3 w-3" />
              Verified buyer
            </Badge>
            <Separator className="my-4" />
            <div className="w-full space-y-2 text-left text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Member since</span>
                <span className="font-medium text-foreground">{formatDate(new Date(now - 90 * DAY).toISOString())}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Last login</span>
                <span className="font-medium text-foreground">{timeAgo(new Date(now - 2 * 3600000).toISOString())}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Forms */}
        <div className="lg:col-span-2 space-y-6">
          {/* Profile info */}
          <Card className="border-border/60">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <User className="h-4 w-4 text-cyan-600" />
                Profile information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="pf-name">Full name</Label>
                  <Input id="pf-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="pf-phone">Phone</Label>
                  <div className="relative">
                    <Phone className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <Input id="pf-phone" className="pl-8" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                  </div>
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="pf-email">Email address</Label>
                  <div className="relative">
                    <Mail className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <Input id="pf-email" type="email" className="pl-8" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                  </div>
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="pf-avatar">Avatar URL</Label>
                  <div className="relative">
                    <ImageIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <Input id="pf-avatar" className="pl-8" value={form.avatarUrl} placeholder="https://…" onChange={(e) => setForm({ ...form, avatarUrl: e.target.value })} />
                  </div>
                </div>
              </div>
              <div className="flex justify-end">
                <Button className="bg-cyan-500 hover:bg-cyan-600 text-white" onClick={() => toast({ title: 'Profile saved', description: 'Your profile information has been updated.' })}>
                  <CheckCircle2 className="h-4 w-4" />
                  Save changes
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Change password */}
          <Card className="border-border/60">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Lock className="h-4 w-4 text-cyan-600" />
                Change password
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="pf-cpwd">Current password</Label>
                  <Input id="pf-cpwd" type="password" value={pwd.current} onChange={(e) => setPwd({ ...pwd, current: e.target.value })} placeholder="••••••••" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="pf-npwd">New password</Label>
                  <Input id="pf-npwd" type="password" value={pwd.next} onChange={(e) => setPwd({ ...pwd, next: e.target.value })} placeholder="At least 8 characters" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="pf-cnpwd">Confirm new password</Label>
                  <Input id="pf-cnpwd" type="password" value={pwd.confirm} onChange={(e) => setPwd({ ...pwd, confirm: e.target.value })} placeholder="Re-type new password" />
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <ShieldCheck className="h-3.5 w-3.5 text-cyan-500" />
                Passwords are hashed with bcrypt — we never store them in plain text.
              </div>
              <div className="flex justify-end">
                <Button variant="outline" onClick={() => toast({ title: 'Password updated', description: 'You will be signed out on other devices.' })}>
                  <Lock className="h-4 w-4" />
                  Update password
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function ReviewsTab({
  reviews,
  onGoProduct,
  onGoProducts,
}: {
  reviews: DemoReview[];
  onGoProduct: (slug: string) => void;
  onGoProducts: () => void;
}) {
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-400 text-white shadow-[0_8px_18px_-8px_rgba(245,158,11,0.5)]">
            <Star className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-foreground">My Reviews</h2>
            <p className="text-sm text-muted-foreground">{reviews.length} reviews written</p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={onGoProducts}>
          <Plus className="h-3.5 w-3.5" />
          Write a review
        </Button>
      </div>

      {reviews.length === 0 ? (
        <EmptyState
          icon={Star}
          title="No reviews yet"
          description="Share your experience with the community. After receiving an order, write a review to help other engineers choose the right products."
          cta="Browse products to review"
          onCta={onGoProducts}
        />
      ) : (
        <div className="space-y-3">
          {reviews.map((r) => (
            <ReviewCard key={r.id} review={r} onGoProduct={onGoProduct} />
          ))}
        </div>
      )}
    </div>
  );
}

/* ---------------- Sidebar / mobile pill trigger ---------------- */

function SidebarTabTrigger({ tab }: { tab: { id: TabId; label: string; icon: typeof Package; description: string } }) {
  return (
    <TabsTrigger
      value={tab.id}
      className="justify-start w-full h-auto py-2.5 px-3 gap-3 rounded-lg data-[state=active]:bg-cyan-50 data-[state=active]:text-cyan-700 data-[state=active]:border-cyan-200 data-[state=active]:shadow-sm text-muted-foreground hover:text-cyan-700 hover:bg-cyan-50/50 font-medium text-sm"
    >
      <TabIcon id={tab.id} className="h-4 w-4 shrink-0" />
      <span className="truncate text-left">{tab.label}</span>
    </TabsTrigger>
  );
}

function MobileTabTrigger({ tab }: { tab: { id: TabId; label: string; icon: typeof Package; description: string } }) {
  return (
    <TabsTrigger
      value={tab.id}
      className="flex-none gap-1.5 rounded-full px-3 py-1.5 text-xs data-[state=active]:bg-cyan-500 data-[state=active]:text-white data-[state=active]:border-cyan-500 text-muted-foreground border-border/60 bg-white"
    >
      <TabIcon id={tab.id} className="h-3.5 w-3.5" />
      <span className="whitespace-nowrap">{tab.label}</span>
    </TabsTrigger>
  );
}

/* ============================================================
   BuyerDashboard — main exported component
   ============================================================ */

export function BuyerDashboard() {
  const { toast } = useToast();
  const user = useAuthStore((s) => s.user);
  const goProducts = useNavStore((s) => s.goProducts);
  const goProduct = useNavStore((s) => s.goProduct);
  const goCart = useNavStore((s) => s.goCart);

  const { items: wishlistItems, remove: removeFromWishlist, clear: clearWishlist } = useWishlistStore();

  // Live data hooks (per task spec use 'demo-buyer')
  const { data: liveOrders } = useOrders('demo-buyer');
  const { data: liveNotifications } = useNotifications('demo-buyer');

  // Fall back to DEMO_ORDERS when API returns empty (demo-buyer not seeded)
  const orders: DemoOrder[] = (Array.isArray(liveOrders) && liveOrders.length > 0 ? liveOrders : DEMO_ORDERS) as DemoOrder[];
  const notifications = (Array.isArray(liveNotifications) && liveNotifications.length > 0 ? liveNotifications : DEMO_NOTIFICATIONS) as Array<{ id: string; type: string; title: string; body: string; read: boolean; createdAt: string }>;

  const displayName = user?.name ?? 'Buyer';
  const displayEmail = user?.email ?? 'buyer1@example.com';
  const displayPhone = '0901234567';
  const displayAvatar = user?.avatarUrl;

  const [activeTab, setActiveTab] = useState<TabId>('overview');

  function handleAddToCart(item: { productId: string; slug: string; name: string; imageUrl?: string; price: number }) {
    toast({
      title: 'Added to cart',
      description: `${item.name} · ${formatVND(item.price)}`,
    });
    goCart();
  }

  function handleRemoveWishlist(productId: string) {
    removeFromWishlist(productId);
    toast({ title: 'Removed from wishlist', description: 'Product removed from your wishlist.' });
  }

  function handleClearWishlist() {
    clearWishlist();
    toast({ title: 'Wishlist cleared', description: 'All saved products removed.' });
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-cyan-50/20 to-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome header */}
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
            <Avatar className="h-14 w-14 sm:h-16 sm:w-16 border-4 border-white shadow-md">
              {displayAvatar && <AvatarImage src={displayAvatar} alt={displayName} />}
              <AvatarFallback className="bg-gradient-to-br from-cyan-500 to-teal-400 text-white text-xl font-bold">
                {initials(displayName)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-cyan-600 uppercase tracking-wide flex items-center gap-1.5">
                <Sparkles className="h-3 w-3" />
                Buyer Dashboard
              </p>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground mt-0.5">
                Welcome back, <span className="text-cyan-700">{displayName}</span>!
              </h1>
              <p className="text-sm text-muted-foreground mt-1 flex flex-wrap items-center gap-2">
                <span className="flex items-center gap-1">
                  <Mail className="h-3.5 w-3.5" />
                  {displayEmail}
                </span>
                <span className="text-border">·</span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  Last login {timeAgo(new Date(now - 2 * 3600000).toISOString())}
                </span>
              </p>
            </div>
            <Button className="bg-cyan-500 hover:bg-cyan-600 text-white" onClick={() => goProducts()}>
              <ShoppingBag className="h-4 w-4" />
              Continue shopping
            </Button>
          </div>
        </motion.div>

        {/* Tabs (controlled) */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabId)} className="flex flex-col gap-4">
          {/* Mobile: horizontal scroll pills */}
          <TabsList className="lg:hidden flex w-full overflow-x-auto justify-start gap-1.5 bg-transparent border-0 p-0 h-auto">
            {TABS.map((tab) => (
              <MobileTabTrigger key={tab.id} tab={tab} />
            ))}
          </TabsList>

          {/* Desktop: sticky sidebar + content */}
          <div className="lg:grid lg:grid-cols-[240px_1fr] lg:gap-8">
            <aside className="hidden lg:block">
              <div className="sticky top-4 space-y-1.5">
                <TabsList className="flex-col h-auto w-full bg-transparent border-0 p-0 gap-1">
                  {TABS.map((tab) => (
                    <SidebarTabTrigger key={tab.id} tab={tab} />
                  ))}
                </TabsList>
                <div className="mt-4 rounded-xl border border-cyan-100 bg-cyan-50/60 p-4">
                  <p className="text-xs font-semibold text-cyan-700 flex items-center gap-1.5">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    Buyer protection
                  </p>
                  <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">
                    All purchases are covered by our 30-day return policy and secure-escrow settlement.
                  </p>
                </div>
              </div>
            </aside>

            {/* Content */}
            <div className="min-w-0">
              <AnimatePresence mode="wait">
                {activeTab === 'overview' && (
                  <motion.div key="overview" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
                    <OverviewTab
                      orders={orders}
                      wishlistCount={wishlistItems.length}
                      downloads={DEMO_DOWNLOADS}
                      notifications={notifications}
                      onGoProducts={() => goProducts()}
                      onGoTab={(t) => setActiveTab(t)}
                    />
                  </motion.div>
                )}
                {activeTab === 'orders' && (
                  <motion.div key="orders" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
                    <OrdersTab orders={orders} toast={toast} onGoProducts={() => goProducts()} />
                  </motion.div>
                )}
                {activeTab === 'downloads' && (
                  <motion.div key="downloads" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
                    <DownloadsTab downloads={DEMO_DOWNLOADS} toast={toast} onGoProducts={() => goProducts()} />
                  </motion.div>
                )}
                {activeTab === 'wishlist' && (
                  <motion.div key="wishlist" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
                    <WishlistTab
                      items={wishlistItems}
                      onAddCart={handleAddToCart}
                      onRemove={handleRemoveWishlist}
                      onClear={handleClearWishlist}
                      onGoProducts={() => goProducts()}
                    />
                  </motion.div>
                )}
                {activeTab === 'licenses' && (
                  <motion.div key="licenses" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
                    <LicensesTab licenses={DEMO_LICENSES} onGoProducts={() => goProducts()} />
                  </motion.div>
                )}
                {activeTab === 'addresses' && (
                  <motion.div key="addresses" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
                    <AddressesTab toast={toast} />
                  </motion.div>
                )}
                {activeTab === 'profile' && (
                  <motion.div key="profile" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
                    <ProfileTab name={displayName} email={displayEmail} phone={displayPhone} avatarUrl={displayAvatar} toast={toast} />
                  </motion.div>
                )}
                {activeTab === 'reviews' && (
                  <motion.div key="reviews" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
                    <ReviewsTab reviews={DEMO_REVIEWS} onGoProduct={(slug) => goProduct(slug)} onGoProducts={() => goProducts()} />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </Tabs>
      </div>
    </div>
  );
}

export default BuyerDashboard;
