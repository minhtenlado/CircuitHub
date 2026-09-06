/** Format currency (VND by default) */
export function formatVND(amount: number | null | undefined): string {
  const n = Math.round(Number(amount ?? 0));
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(n);
}

/** Compact currency for cards (e.g. 1.2M₫) */
export function formatVNDCompact(amount: number | null | undefined): string {
  const n = Math.round(Number(amount ?? 0));
  if (Math.abs(n) >= 1_000_000) return `${(n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1)}M₫`;
  if (Math.abs(n) >= 1_000) return `${(n / 1_000).toFixed(0)}K₫`;
  return `${n}₫`;
}

/** Format file size */
export function formatFileSize(bytes: number | null | undefined): string {
  const b = Number(bytes ?? 0);
  if (b === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(b) / Math.log(1024));
  return `${(b / Math.pow(1024, i)).toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

/** Format date (Asia/Ho_Chi_Minh) */
export function formatDate(input: string | Date | null | undefined, opts?: Intl.DateTimeFormatOptions): string {
  if (!input) return '—';
  return new Intl.DateTimeFormat('en-GB', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    ...opts,
    timeZone: 'Asia/Ho_Chi_Minh',
  }).format(new Date(input));
}

/** Relative time, e.g. "3 days ago" */
export function timeAgo(input: string | Date | null | undefined): string {
  if (!input) return '—';
  const diff = Date.now() - new Date(input).getTime();
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return 'just now';
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  if (day < 30) return `${day}d ago`;
  const mo = Math.floor(day / 30);
  if (mo < 12) return `${mo}mo ago`;
  const yr = Math.floor(mo / 12);
  return `${yr}y ago`;
}

/** Generate a slug */
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

/** Initials for avatar */
export function initials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');
}

/** Discount percentage from price/compareAt */
export function discountPct(price: number, compareAt?: number | null): number {
  if (!compareAt || compareAt <= price) return 0;
  return Math.round(((compareAt - price) / compareAt) * 100);
}

/** Map icon string to Lucide icon */
export const productTypeBadge: Record<string, { label: string; cls: string }> = {
  PHYSICAL: { label: 'Physical', cls: 'bg-cyan-50 dark:bg-cyan-950/50 text-cyan-700 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800' },
  DIGITAL: { label: 'Digital', cls: 'bg-teal-50 dark:bg-teal-950/50 text-teal-700 dark:text-teal-300 border-teal-200 dark:border-teal-800' },
  SERVICE: { label: 'Service', cls: 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800' },
  BUNDLE: { label: 'Bundle', cls: 'bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800' },
};
