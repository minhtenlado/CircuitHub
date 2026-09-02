'use client';

import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavStore } from '@/stores/nav-store';

export function Logo({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizeCls = size === 'sm' ? 'h-7 w-7' : size === 'lg' ? 'h-12 w-12' : 'h-9 w-9';
  const textCls = size === 'sm' ? 'text-base' : size === 'lg' ? 'text-2xl' : 'text-lg';
  const goHome = useNavStore((s) => s.goHome);
  return (
    <button
      onClick={goHome}
      className="group flex items-center gap-2.5 outline-none focus-visible:ring-2 focus-visible:ring-ring/40 rounded-md"
      aria-label="CircuitHub home"
    >
      <motion.div
        initial={{ rotate: -10, opacity: 0 }}
        animate={{ rotate: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 250, damping: 18 }}
        className={`relative ${sizeCls} rounded-lg bg-gradient-to-br from-cyan-500 via-cyan-400 to-teal-400 flex items-center justify-center shadow-[0_4px_18px_-4px_rgba(6,182,212,0.6)]`}
      >
        {/* PCB-style chip pattern */}
        <svg viewBox="0 0 24 24" fill="none" className="h-3/5 w-3/5 text-white">
          <path d="M5 5h14v14H5z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
          <path d="M8 8h8M8 12h8M8 16h5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          <circle cx="9" cy="9" r="1.1" fill="currentColor" />
          <circle cx="15" cy="13" r="1.1" fill="currentColor" />
          <circle cx="12.5" cy="17" r="1.1" fill="currentColor" />
        </svg>
        <span className="absolute -top-1 -right-1 text-[8px] font-bold tracking-tight text-cyan-50 bg-cyan-700 rounded-full px-1.5 py-px shadow-sm">
          v1
        </span>
      </motion.div>
      <div className="flex flex-col items-start leading-tight">
        <span className={`font-bold tracking-tight ${textCls} text-foreground`}>
          Circuit<span className="text-gradient-cyan">Hub</span>
        </span>
        <span className="hidden sm:inline text-[10px] font-mono text-muted-foreground/80 -mt-0.5">
          for hardware creators
        </span>
      </div>
    </button>
  );
}

export function HeroCTA() {
  const goProducts = useNavStore((s) => s.goProducts);
  return (
    <Button
      onClick={() => goProducts()}
      size="lg"
      className="bg-gradient-to-r from-cyan-500 to-teal-400 hover:from-cyan-600 hover:to-teal-500 text-white shadow-[0_8px_30px_-8px_rgba(6,182,212,0.6)]"
    >
      <Sparkles className="mr-2 h-4 w-4" />
      Explore Marketplace
    </Button>
  );
}
