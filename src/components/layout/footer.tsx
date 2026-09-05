'use client';

import * as React from 'react';
import { useState } from 'react';
import { useNavStore, type AppView } from '@/stores/nav-store';
import { brand, footerLinks } from '@/lib/brand';
import { Logo } from '@/components/logo';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import {
  Github,
  Twitter,
  Linkedin,
  Youtube,
  Lock,
  ShieldCheck,
  Cpu,
  RefreshCw,
  ArrowRight,
} from 'lucide-react';
import { motion } from 'framer-motion';

/* ============================================================
   CircuitHub Footer
   - Sticky bottom via `mt-auto` (page wrapper owns min-h-screen flex-col)
   - PCB-grid soft background, decorative circuit trace at top
   - Trust mini-cards, brand + link columns, newsletter, bottom bar
   ============================================================ */

type FooterLinkItem = { readonly label: string; readonly view: string; readonly params?: Readonly<Record<string, string>> };

const TRUST_ITEMS = [
  { icon: Lock, title: 'Secure payments', subtitle: '256-bit SSL checkout' },
  { icon: ShieldCheck, title: 'Verified sellers', subtitle: 'Vetted engineering vendors' },
  { icon: Cpu, title: 'Engineering-grade quality', subtitle: 'Spec-sheet verified' },
  { icon: RefreshCw, title: '30-day returns', subtitle: 'Hassle-free refunds' },
] as const;

const SOCIALS = [
  { key: 'github', icon: Github, href: brand.socials.github, label: 'CircuitHub on GitHub' },
  { key: 'twitter', icon: Twitter, href: brand.socials.twitter, label: 'CircuitHub on Twitter' },
  { key: 'linkedin', icon: Linkedin, href: brand.socials.linkedin, label: 'CircuitHub on LinkedIn' },
  { key: 'youtube', icon: Youtube, href: brand.socials.youtube, label: 'CircuitHub on YouTube' },
] as const;

function FooterBadge({
  label,
  highlight = false,
}: {
  label: string;
  highlight?: boolean;
}) {
  return (
    <span
      className={
        'inline-flex items-center rounded-md border px-2 py-1 font-mono text-[10px] tracking-tight transition-colors ' +
        (highlight
          ? 'border-cyan-300/60 bg-cyan-50/70 text-cyan-700'
          : 'border-border/60 bg-white/80 text-muted-foreground')
      }
    >
      {label}
    </span>
  );
}

export function Footer() {
  const { toast } = useToast();
  const setView = useNavStore((s) => s.setView);
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubscribe = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed) {
      toast({
        title: 'Email required',
        description: 'Please enter your email to subscribe.',
        variant: 'destructive',
      });
      return;
    }
    // Basic email format check — no real backend, just toast.
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);
    if (!emailOk) {
      toast({
        title: 'Invalid email',
        description: 'That email looks malformed. Mind double-checking?',
        variant: 'destructive',
      });
      return;
    }
    setSubmitting(true);
    // Simulate a brief network round-trip for UX feel.
    window.setTimeout(() => {
      setSubmitting(false);
      toast({
        title: 'Subscribed!',
        description: `Engineering updates will land in ${trimmed}. Welcome aboard.`,
      });
      setEmail('');
    }, 350);
  };

  const handleNav = (link: FooterLinkItem) => {
    setView(link.view as AppView, link.params ? { ...link.params } : {});
  };

  return (
    <footer className="mt-auto relative border-t border-border/60 bg-slate-50/40 backdrop-blur-sm">

      {/* Content wrapper */}
      <div>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
          {/* ---------- Trust section (above the columns) ---------- */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-12">
            {TRUST_ITEMS.map((item, idx) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ delay: idx * 0.06, duration: 0.4, ease: 'easeOut' }}
                className="group relative flex items-center gap-3 rounded-xl border border-border/60 bg-white/80 px-4 py-3.5 backdrop-blur-sm transition-all hover:border-cyan-300/70 hover:shadow-[0_8px_24px_-12px_rgba(6,182,212,0.35)]"
              >
                {/* Cyan-accented icon tile */}
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-50 to-teal-50 text-cyan-600 ring-1 ring-cyan-200/60 transition-all group-hover:from-cyan-500 group-hover:to-teal-400 group-hover:text-white group-hover:ring-transparent">
                  <item.icon className="h-4 w-4" />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-semibold text-slate-800 group-hover:text-cyan-700 transition-colors">
                    {item.title}
                  </span>
                  <span className="block truncate text-[11px] text-muted-foreground">
                    {item.subtitle}
                  </span>
                </span>
              </motion.div>
            ))}
          </div>

          {/* ---------- Main columns ---------- */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8 lg:gap-10">
            {/* Column 1 — Brand */}
            <div className="col-span-2 lg:col-span-2">
              <Logo size="md" />

              {/* Tagline */}
              <p className="mt-4 font-mono text-[13px] font-medium tracking-tight text-cyan-700/90">
                {brand.tagline}
              </p>

              {/* Short description */}
              <p className="mt-3 max-w-sm text-sm leading-relaxed text-muted-foreground">
                {brand.description}
              </p>

              {/* Social icons */}
              <div className="mt-5 flex items-center gap-2">
                {SOCIALS.map((s) => (
                  <a
                    key={s.key}
                    href={s.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={s.label}
                    title={s.label}
                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-border/60 bg-white text-slate-600 transition-all hover:border-cyan-300 hover:bg-cyan-50/60 hover:text-cyan-600 hover:shadow-[0_4px_18px_-8px_rgba(6,182,212,0.4)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/40"
                  >
                    <s.icon className="h-4 w-4" />
                  </a>
                ))}
              </div>

              {/* Newsletter subscribe — colocated with brand */}
              <form onSubmit={handleSubscribe} className="mt-7 max-w-sm">
                <label
                  htmlFor="footer-newsletter"
                  className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground"
                >
                  Stay in the loop
                </label>
                <div className="mt-2 flex gap-2">
                  <Input
                    id="footer-newsletter"
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    placeholder="you@circuithub.vn"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    aria-label="Email for newsletter"
                    className="flex-1 bg-white/85"
                  />
                  <Button
                    type="submit"
                    disabled={submitting}
                    className="shrink-0 bg-gradient-to-r from-cyan-500 to-teal-400 text-white shadow-[0_4px_18px_-6px_rgba(6,182,212,0.5)] transition-all hover:from-cyan-600 hover:to-teal-500 hover:shadow-[0_6px_22px_-8px_rgba(6,182,212,0.55)]"
                  >
                    <span className="hidden sm:inline">Subscribe</span>
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
                <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground/80">
                  Engineering updates, new PCB drops, and seller tips. No spam — unsubscribe anytime.
                </p>
              </form>
            </div>

            {/* Columns 2–5 — Link groups from footerLinks */}
            {Object.entries(footerLinks).map(([group, links]) => (
              <div key={group}>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                  {group}
                </h3>
                <ul className="mt-4 space-y-2.5">
                  {links.map((link) => {
                    const item = link as FooterLinkItem;
                    return (
                      <li key={item.label}>
                        <button
                          type="button"
                          onClick={() => handleNav(item)}
                          className="group inline-flex items-center gap-1 text-left text-sm text-muted-foreground transition-colors hover:text-cyan-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/40 rounded"
                        >
                          <span className="transition-transform group-hover:translate-x-0.5">
                            {item.label}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>

          {/* ---------- Bottom bar ---------- */}
          <div className="mt-12 flex flex-col gap-4 border-t border-border/60 pt-6 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-muted-foreground">
              © 2025 {brand.name}. All rights reserved.
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <FooterBadge label={`VND ${brand.currencySymbol}`} />
              <FooterBadge label={brand.timezone} />
              <FooterBadge label="Made in Vietnam" highlight />
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
