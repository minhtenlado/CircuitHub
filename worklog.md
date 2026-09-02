# Project Worklog — CircuitHub (Tech Electronics + PCB + Digital Design Marketplace)

> Brand: **CircuitHub** — "Build it. Design it. Ship it."
> Theme: WHITE + CYAN + AQUA (#06B6D4 primary, #22D3EE secondary, #2DD4BF aqua)
> Font: Inter
> Currency: VND (₫) | Timezone: Asia/Ho_Chi_Minh

---

## Project Status (Initial)

- Next.js 16 + Tailwind 4 + shadcn/ui scaffold đã có sẵn.
- Prisma + SQLite đã cấu hình, schema tối giản (User/Post) cần thay hoàn toàn.
- Chỉ có 1 route `/` được phép. Cần xây dựng SPA-style multi-view (Buyer/Seller/Admin) với tab/section switcher.
- Tech stack bổ sung: Framer Motion, Zustand, TanStack Query, React Hook Form, Zod, Lucide, Recharts.

## Architecture Decision

Do môi trường chỉ có Next.js (không có NestJS monorepo, không Redis, không PostgreSQL), đặc tả được điều chỉnh thành:

- **Backend**: Next.js App Router API routes (`/api/v1/*`) với Prisma + SQLite.
- **State**: Zustand (cart/wishlist/ui/auth) + TanStack Query (server state).
- **UI**: shadcn/ui + Framer Motion + cyan/aqua design tokens.
- **Navigation**: Single `/` route, view switching via Zustand store + hash router for deep linking.
- **Mock providers**: Payment (Mock), Shipping (Mock), Email (console), Storage (local) — abstractions ready for production swap.

## Goals / Phases

### Phase 1 — Foundation (current)
- Prisma schema đầy đủ: User, Role, Shop, Category, Attribute, Product, ProductSpec, ProductVersion, ProductFile, Inventory, Cart, CartItem, Order, OrderItem, SellerOrder, Payment, Shipment, Wallet, WalletTx, Withdrawal, Review, Voucher, Notification, AuditLog.
- Seed demo data thực tế.
- Design system + layout shell (header, footer, theme).
- Zustand stores + TanStack Query provider.

### Phase 2 — Buyer Experience
- Homepage: Hero, Technical Search, Categories, Featured PCB, Popular Dev Boards, Trending Digital, Top Sellers, PCB Services, Trust Section.
- Product listing với technical filters theo category.
- Product detail drawer (gallery, specs, license, versions, reviews, add-to-cart, wishlist).
- Cart multi-seller + checkout flow (address, shipping, payment, voucher).

### Phase 3 — Seller Center
- Dashboard (revenue, orders, products, low stock, wallet balance).
- Products management, orders, shipping, wallet, withdrawals, analytics.

### Phase 4 — Admin Center
- Dashboard (GMV, revenue, commission, orders, users, sellers, products).
- Moderation, withdrawals approval, audit logs.

### Phase 5 — Polish
- Framer Motion animations, dark mode, responsive, accessibility, self-verification with Agent Browser.
- Cron job webDevReview mỗi 15 phút.

## Unresolved / Risks

- Scope khổng lồ (4940 dòng spec) — phải ưu tiên MVP production-grade với các luồng chính hoạt động.
- Không có payment/shipping thật — sử dụng mock provider có abstraction production-ready.
- File upload/security: MVP sẽ dùng local storage abstraction, không có antivirus thật.

## Priority Recommendations for Next Phase

1. Hoàn tất Phase 1 + 2 (buyer experience) trước — đây là flow user chính.
2. Sau đó Phase 3 + 4 (seller/admin center).
3. Phase 5 polish + cron job để tiếp tục phát triển tính năng mới mỗi 15 phút.

---

Task ID: 1
Agent: Main (Z.ai Code)
Task: Khởi tạo worklog, lập kế hoạch kiến trúc tổng thể

Work Log:
- Đọc kỹ toàn bộ đặc tả 4940 dòng
- Kiểm tra trạng thái dự án hiện tại (Next.js 16, Prisma SQLite, shadcn/ui full)
- Quyết định kiến trúc: Next.js-only SPA-style multi-view với cyan/aqua theme
- Tạo worklog.md với 3 phần: status, goals/phases, risks

Stage Summary:
- Brand name: **CircuitHub**
- Tagline: "Build it. Design it. Ship it."
- Architecture: Single Next.js app, view-switcher pattern (Buyer/Seller/Admin), Prisma+SQLite backend, mock providers with production-ready abstractions
- Ready to start Phase 1: Foundation (Prisma schema + seed + design system)

---
Task ID: 5
Agent: Header Builder
Task: Build the responsive Header component for CircuitHub marketplace (desktop + mobile sheet menu)

Work Log:
- Read worklog.md and explored project structure: stores (nav/cart/wishlist/auth), hooks (useNotifications, useToast), Logo component, shadcn/ui primitives (Sheet, DropdownMenu, Avatar, Badge, Button, Input), brand config, theme tokens (cyan/aqua palette).
- Verified all required dependencies are installed: next-themes, framer-motion, zustand, lucide-react, @tanstack/react-query.
- Created `src/components/layout/` directory and wrote `header.tsx` (~895 LOC) with the following composition:
  - `Header` — sticky container (`sticky top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur-md`), scroll listener adds subtle cyan shadow on scroll, two-row layout on lg+ (main row + secondary "Browse" nav row).
  - `NavPills` — pill-style links for Marketplace / Products / PCB Boards / KiCad Projects / Services wired to `goHome`, `goProducts`, `goCategory(slug)`. Active state computed from `view` + `params.slug` and styled with cyan gradient + shadow.
  - `SearchBar` — center, prominent rounded input with search icon. Enter submits → `goProducts({ q: query })`. Popular searches (ESP32, STM32, KiCad 9, 4-layer PCB) shown as cyan chips in an AnimatePresence dropdown on focus; outside-click handler closes the dropdown. Compact variant used on mobile.
  - `ThemeToggle` — uses `next-themes` `useTheme`, mounted guard to avoid hydration mismatch, Sun/Moon icons.
  - `ActionWishlist` — Heart icon + rose badge count from `useWishlistStore.items.length`, navigates `goBuyer('buyer-wishlist')` on click.
  - `ActionCart` — ShoppingCart icon + cyan badge count from `useCartStore.items.length`, opens cart drawer via `useCartStore.open()`.
  - `NotificationsBell` — Bell icon + amber unread badge; dropdown lists recent notifications fetched via `useNotifications(user?.id ?? 'demo-buyer')` (defaults to `demo-buyer` per spec); each item shows title, body, time-ago, unread dot.
  - `RoleSwitcher` — segmented control with Buyer/Seller/Admin tabs, calls `setRole()` + navigates to `goBuyer('buyer-orders')` / `goSeller()` / `goAdmin()`. Active tab uses framer-motion `layoutId` for sliding cyan-gradient pill.
  - `UserMenu` — DropdownMenu with avatar+chevron trigger when logged in, "Sign In" cyan-gradient button when logged out. Logged-in menu: Profile / My Orders / Downloads / Settings (and "My Shop" via `goShop(shopSlug)` if seller). Always-visible "Demo logins" section with Demo Login as Buyer/Seller/Admin → `useAuthStore.demoLogin(role)` + toast + navigation. Logout → `useAuthStore.logout()` + toast (destructive variant).
  - `MobileMenu` — shadcn Sheet (left side) triggered by hamburger Menu icon (visible below lg). Inside: Logo header, compact SearchBar, role switcher grid, full vertical NavPills list, account section (profile/orders/downloads/wishlist/shop for logged-in; sign-in/create-account for guest), demo logins, logout. All items call `setOpen(false)` after navigating.
- Responsive breakdown:
  - Mobile (<md): hamburger + logo + cart + theme + user; second row = compact search bar; nav/role in Sheet.
  - md–lg: hamburger + logo + search (in row) + wishlist + cart + bell + theme + user; nav in Sheet.
  - lg+: logo + search + wishlist + cart + bell + theme + role switcher + user; secondary "Browse" row with NavPills.
- Styling: glass blur on sticky container, cyan gradient on primary CTAs (role pill, sign-in button, mobile sheet header), rose for wishlist, amber for notifications, primary cyan for cart — using the existing design tokens from `globals.css` (no new CSS needed).
- Hydration safety: theme toggle uses mounted guard; nav state selectors subscribe via Zustand to avoid SSR/CSR mismatch.
- Ran `npx tsc --noEmit --skipLibCheck` and `npx eslint src/components/layout/header.tsx` — both pass with zero errors on header.tsx (other pre-existing errors in seed.ts/api routes are unrelated to this task).

Stage Summary:
- Header component delivered at `src/components/layout/header.tsx` (named export `Header` + default export), 895 LOC, fully responsive, sticky with glass blur.
- All acceptance criteria met: sticky glass header, Enter-to-search with popular-searches dropdown, nav links highlight active view via Zustand, cart/wishlist counts from stores, theme toggle (light/dark), Buyer/Seller/Admin role switcher, user dropdown with demo-login buttons + logout, mobile Sheet menu with full nav/role/user contents.
- No TypeScript or ESLint errors in the new file. Ready to be imported into `app/page.tsx` (or a shared layout shell) by the next agent via `import { Header } from '@/components/layout/header'`.

---
Task ID: 6
Agent: Footer Builder
Task: Build the Footer component at `src/components/layout/footer.tsx` for CircuitHub marketplace

Work Log:
- Read `worklog.md` (Task IDs 1 and 5) to align with architecture, brand, theme tokens, and the header component already shipped at `src/components/layout/header.tsx`.
- Read supporting modules: `src/lib/brand.ts` (brand + footerLinks), `src/stores/nav-store.ts` (AppView union + `setView(view, params)`), `src/components/logo.tsx` (clickable Logo component using `goHome`), `src/hooks/use-toast.ts` (`useToast().toast(...)` API + destructive variant), `src/components/ui/input.tsx` + `src/components/ui/button.tsx` (shadcn primitives accept className merge), `src/app/globals.css` (verified `pcb-grid-bg-soft` and `circuit-trace` component classes + `trace-flow` keyframes already defined in `@layer components`).
- Created `src/components/layout/footer.tsx` (~220 LOC) with both named `Footer` and default exports.
- Composition:
  1. **Sticky bottom**: outer `<footer>` uses `mt-auto relative border-t border-border/60 bg-slate-50/40 backdrop-blur-sm`. Page wrapper is expected to own `min-h-screen flex flex-col`, so `mt-auto` pushes the footer to the bottom on short content and lets it flow naturally on long content.
  2. **Circuit trace top**: `<div className="circuit-trace absolute top-0 left-0 right-0" aria-hidden />` renders the 1px animated cyan/aqua trace line at the very top of the footer (uses the existing `circuit-trace` + `trace-flow` keyframes from globals.css).
  3. **PCB-grid background**: full content wrapped in `<div className="pcb-grid-bg-soft">` (cyan 22px grid pattern, dark-mode aware).
  4. **Trust section above columns**: 2-col on mobile / 4-col on md+ grid of mini-cards rendered via `TRUST_ITEMS` array (Lock → "Secure payments" / "256-bit SSL checkout", ShieldCheck → "Verified sellers" / "Vetted engineering vendors", Cpu → "Engineering-grade quality" / "Spec-sheet verified", RefreshCw → "30-day returns" / "Hassle-free refunds"). Each card: white/80 glass, border-border/60, Framer Motion fade-up on view (staggered 60ms), cyan-gradient icon tile that flips to filled cyan→teal gradient on hover, title + tiny subtitle, hover shadow `[0_8px_24px_-12px_rgba(6,182,212,0.35)]`.
  5. **Main columns** (`grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8 lg:gap-10`):
     - Column 1 (spans 2 on md & lg): `<Logo size="md" />` (already clickable → goHome) + tagline "Build it. Design it. Ship it." in `font-mono` cyan-700 + short `brand.description` + social icons (Github/Twitter/Linkedin/Youtube) wired to `brand.socials` with `target=_blank rel=noopener noreferrer`, hover cyan-300 border + cyan-50 bg + cyan glow shadow + focus-visible ring. Newsletter `<form>` colocated with brand: label "Stay in the loop", `<Input type="email">` (autoComplete="email", inputMode="email", placeholder "you@circuithub.vn") + `<Button>` "Subscribe" with ArrowRight icon and cyan→teal gradient + glow shadow. Submit handler validates empty + email regex, toasts destructive on invalid, then 350ms simulated round-trip + success toast ("Subscribed! Engineering updates will land in <email>.") and clears the field.
     - Columns 2–5: render `Object.entries(footerLinks)` (Marketplace, For Sellers, Company, Legal) — each group gets an `<h3>` uppercase tracking header and `<ul>` of `<button>` links. Clicking calls `handleNav(item)` which dispatches `setView(link.view as AppView, link.params ? { ...link.params } : {})` (cast to `AppView` is required because some footer views like `seller-pricing`, `blog`, `careers`, `contact`, `terms`, `privacy`, `license-terms`, `refund-policy` aren't in the current `AppView` union — runtime is unaffected since `setView` just stores the string). Each link uses `hover:text-cyan-600` transition + a subtle `translate-x-0.5` nudge on hover, plus focus-visible ring.
  6. **Bottom bar** (`mt-12 border-t border-border/60 pt-6`): "© 2025 CircuitHub. All rights reserved." on the left, three small `font-mono` badges on the right via local `FooterBadge` helper — `VND ₫`, `Asia/Ho_Chi_Minh`, and highlighted `Made in Vietnam` (cyan-300 border + cyan-50 bg + cyan-700 text). Stacks vertically on mobile, row on sm+.
- Accessibility: every social link has `aria-label` + `title`, newsletter input has `<label htmlFor>` + `aria-label`, link buttons have `focus-visible:ring-2 focus-visible:ring-cyan-500/40`, decorative trace has `aria-hidden`.
- Imports match the required list exactly: `useNavStore`, `brand`/`footerLinks`, `Logo`, `Input`, `Button`, `useToast`, all 9 lucide icons, `motion` from framer-motion.
- Validation: `npx tsc --noEmit --skipLibCheck` — zero errors mentioning `footer.tsx`. `npx eslint src/components/layout/footer.tsx` — clean. Pre-existing errors in `prisma/seed.ts`, `examples/`, `skills/`, and several API routes are unrelated to this task.

Stage Summary:
- Footer component delivered at `src/components/layout/footer.tsx` with named `Footer` export + default export, ~220 LOC, fully responsive (2-col mobile / 3-col md / 6-col lg).
- All 7 acceptance criteria met: `mt-auto` sticky-bottom + glass surface, `circuit-trace` top line, `pcb-grid-bg-soft` background, brand column (Logo + tagline + description + 4 socials) + 4 link groups from `footerLinks` via `useNavStore`, 4 cyan-accented trust mini-cards above the columns, newsletter input + Subscribe button (toast only, no backend), bottom bar with © 2025 + VND/timezone/Made-in-Vietnam `font-mono` badges.
- No TypeScript or ESLint errors in the new file. Ready to be wired into the page shell via `import { Footer } from '@/components/layout/footer'` alongside the already-shipped `Header`.

