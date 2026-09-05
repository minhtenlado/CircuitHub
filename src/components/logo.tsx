'use client';

import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavStore } from '@/stores/nav-store';

export function Logo({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  // Logo is 800×266 (3:1 aspect ratio) — display as horizontal logo image
  const h = size === 'sm' ? 'h-7' : size === 'lg' ? 'h-12' : 'h-9';
  const goHome = useNavStore((s) => s.goHome);
  return (
    <button
      onClick={goHome}
      className="group flex items-center gap-0 outline-none focus-visible:ring-2 focus-visible:ring-ring/40 rounded-md"
      aria-label="CircuitHub home"
    >
      <motion.div
        initial={{ opacity: 0, x: -8 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ type: 'spring', stiffness: 250, damping: 18 }}
        className={`${h} flex items-center transition-transform group-hover:scale-105`}
      >
        { }
        <img
          src="/logo.png"
          alt="CircuitHub"
          className="h-full w-auto object-contain"
        />
      </motion.div>
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
