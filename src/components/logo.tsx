'use client';

import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { useNavStore } from '@/stores/nav-store';

export function Logo({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizeCls = size === 'sm' ? 'h-8 w-8' : size === 'lg' ? 'h-14 w-14' : 'h-10 w-10';
  const textCls = size === 'sm' ? 'text-base' : size === 'lg' ? 'text-3xl' : 'text-xl';
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
        className={`relative ${sizeCls} rounded-lg overflow-hidden flex items-center justify-center shadow-[0_4px_18px_-4px_rgba(6,182,212,0.4)] transition-transform group-hover:scale-105`}
      >
        <Image
          src="/logo.png"
          alt="CircuitHub Logo"
          fill
          sizes={size === 'sm' ? '32px' : size === 'lg' ? '56px' : '40px'}
          className="object-cover"
          priority
        />
      </motion.div>
      <div className="flex flex-col items-start leading-tight">
        <span className={`font-bold tracking-tight ${textCls} text-foreground`}>
          Circuit<span className="text-gradient-cyan">Hub</span>
        </span>
        {size !== 'sm' && (
          <span className="hidden sm:inline text-[10px] font-mono text-muted-foreground/80 -mt-0.5">
            electronics &amp; open source
          </span>
        )}
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
