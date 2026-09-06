'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useWishlistStore } from '@/stores/wishlist-store';
import { Share2, Copy, Check, Link2, Mail, MessageCircle } from 'lucide-react';

interface WishlistShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function WishlistShareDialog({ open, onOpenChange }: WishlistShareDialogProps) {
  const { items } = useWishlistStore();
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  // Generate a shareable link with product slugs encoded
  const shareSlug = items.length > 0
    ? btoa(items.map((i) => i.slug).join(',')).replace(/=/g, '').slice(0, 40)
    : 'empty';
  const shareUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/#/products?wishlist=${shareSlug}`
    : '';

  function copyLink() {
    if (!shareUrl) return;
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopied(true);
      toast({ title: 'Link copied!', description: 'Share it with your friends' });
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function shareViaWhatsApp() {
    const text = `Check out my CircuitHub wishlist (${items.length} items):\n${shareUrl}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  }

  function shareViaEmail() {
    const subject = `My CircuitHub Wishlist`;
    const body = `Hi,\n\nI wanted to share my CircuitHub wishlist with you (${items.length} items):\n${shareUrl}\n\nBest regards!`;
    window.open(`mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`, '_blank');
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5 text-cyan-600" />
            Share Wishlist
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Summary */}
          <div className="rounded-lg bg-gradient-to-br from-cyan-50 to-teal-50 border border-cyan-200 p-4">
            <p className="text-sm font-medium text-cyan-900">
              {items.length} {items.length === 1 ? 'item' : 'items'} in your wishlist
            </p>
            <div className="flex -space-x-2 mt-2">
              {items.slice(0, 5).map((item) => (
                <div
                  key={item.productId}
                  className="h-8 w-8 rounded-full border-2 border-white overflow-hidden bg-muted flex-shrink-0"
                >
                  {item.imageUrl && (
                    <img src={item.imageUrl} alt={item.name} className="h-full w-full object-cover" />
                  )}
                </div>
              ))}
              {items.length > 5 && (
                <div className="h-8 w-8 rounded-full border-2 border-white bg-cyan-500 text-white text-xs font-semibold flex items-center justify-center">
                  +{items.length - 5}
                </div>
              )}
            </div>
          </div>

          {/* Share link */}
          <div className="space-y-1.5">
            <Label>Shareable link</Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Link2 className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  readOnly
                  value={shareUrl}
                  className="pl-8 pr-8 text-xs font-mono bg-slate-50 dark:bg-slate-900"
                  onClick={(e) => e.currentTarget.select()}
                />
              </div>
              <Button
                onClick={copyLink}
                className={copied ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : 'bg-cyan-600 hover:bg-cyan-700 text-white'}
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          {/* Quick share options */}
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              onClick={shareViaWhatsApp}
              className="border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/50"
            >
              <MessageCircle className="h-4 w-4 mr-2" />
              WhatsApp
            </Button>
            <Button
              variant="outline"
              onClick={shareViaEmail}
              className="border-cyan-200 dark:border-cyan-800 text-cyan-700 dark:text-cyan-300 hover:bg-cyan-50 dark:hover:bg-cyan-950/50"
            >
              <Mail className="h-4 w-4 mr-2" />
              Email
            </Button>
          </div>

          <p className="text-xs text-muted-foreground text-center">
            Anyone with this link can view your wishlist items on CircuitHub
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
