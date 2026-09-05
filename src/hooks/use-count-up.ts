'use client';

import { useState, useEffect, useRef } from 'react';

/** Animate a number from 0 to target with a delay. */
export function useCountUp(target: number, duration = 1500, startDelay = 300): { ref: React.RefObject<HTMLSpanElement | null>; display: string } {
  const ref = useRef<HTMLSpanElement>(null);
  const [count, setCount] = useState(0);

  useEffect(() => {
    let raf = 0;
    let started = false;

    function animate() {
      if (started) return;
      started = true;
      const start = performance.now();
      function step(now: number) {
        const elapsed = now - start;
        const progress = Math.min(elapsed / duration, 1);
        // Ease-out cubic
        const eased = 1 - Math.pow(1 - progress, 3);
        setCount(Math.round(target * eased));
        if (progress < 1) {
          raf = requestAnimationFrame(step);
        }
      }
      raf = requestAnimationFrame(step);
    }

    // Start after delay (simpler + more reliable than IntersectionObserver for hero)
    const timer = setTimeout(animate, startDelay);

    return () => {
      clearTimeout(timer);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [target, duration, startDelay]);

  // Format: if >= 1000 and < 100000, show as X.XK
  let display: string;
  if (target >= 100000) {
    display = `${Math.round(count / 1000)}K`;
  } else if (target >= 1000) {
    display = `${(count / 1000).toFixed(1)}K`;
  } else {
    display = count.toLocaleString('en-US');
  }

  return { ref, display };
}
