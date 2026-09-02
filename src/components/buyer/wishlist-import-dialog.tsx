'use client';

import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useWishlistStore } from '@/stores/wishlist-store';
import { useToast } from '@/hooks/use-toast';
import { Heart, Check, Loader2, Package } from 'lucide-react';
import { formatVND } from '@/lib/format';

interface WishlistImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  slugs: string[];
}

export function WishlistImportDialog({ open, onOpenChange, slugs }: WishlistImportDialogProps) {
  const { toast } = useToast();
  const wishlist = useWishlistStore();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(open && slugs.length > 0);
  const [importing, setImporting] = useState(false);
  const [imported, setImported] = useState<Set<string>>(new Set());

  // Fetch product details for the slugs
  useEffect(() => {
    if (!open || slugs.length === 0) return;
    let cancelled = false;
    Promise.all(
      slugs.map(async (slug) => {
        try {
          const res = await fetch(`/api/v1/products/${slug}`);
          const json = await res.json();
          if (json.success) return json.data;
          return null;
        } catch {
          return null;
        }
      }),
    ).then((results) => {
      if (!cancelled) {
        setProducts(results.filter(Boolean));
        setLoading(false);
      }
    });
    return () => { cancelled = true; };
  }, [open, slugs]);

  function importAll() {
    setImporting(true);
    const newItems = products.filter((p) => !wishlist.has(p.id));
    newItems.forEach((p) => {
      wishlist.toggle({
        productId: p.id,
        slug: p.slug,
        name: p.name,
        imageUrl: p.images?.[0]?.url,
        price: p.price,
      });
    });
    setTimeout(() => {
      setImporting(false);
      setImported(new Set(newItems.map((p) => p.id)));
      toast({
        title: 'Wishlist imported!',
        description: `${newItems.length} items added to your wishlist`,
      });
    }, 600);
  }

  function importOne(productId: string, product: any) {
    if (wishlist.has(productId)) {
      wishlist.remove(productId);
      toast({ title: 'Removed from wishlist', description: product.name });
    } else {
      wishlist.toggle({
        productId: product.id,
        slug: product.slug,
        name: product.name,
        imageUrl: product.images?.[0]?.url,
        price: product.price,
      });
      setImported((s) => new Set(s).add(productId));
      toast({ title: 'Added to wishlist', description: product.name });
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-rose-500" />
            Shared Wishlist
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            {slugs.length} {slugs.length === 1 ? 'item' : 'items'} shared with you. Add them to your wishlist in one click.
          </p>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-cyan-500" />
            <span className="ml-2 text-sm text-muted-foreground">Loading shared items...</span>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-8">
            <Package className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm font-medium">No valid products found</p>
            <p className="text-xs text-muted-foreground mt-1">This wishlist link may have expired.</p>
          </div>
        ) : (
          <>
            {/* Import all button */}
            <div className="flex items-center justify-between gap-2 mb-3">
              <span className="text-xs font-medium text-muted-foreground">
                {products.filter((p) => !wishlist.has(p.id)).length} of {products.length} new
              </span>
              <Button
                size="sm"
                onClick={importAll}
                disabled={importing || products.every((p) => wishlist.has(p.id))}
                className="bg-gradient-to-r from-cyan-600 to-teal-500 hover:from-cyan-700 hover:to-teal-600 text-white"
              >
                {importing ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <Check className="h-3.5 w-3.5 mr-1" />}
                {importing ? 'Importing...' : 'Add All to Wishlist'}
              </Button>
            </div>

            {/* Product list */}
            <div className="space-y-2 max-h-[50vh] overflow-y-auto">
              {products.map((p) => {
                const inWishlist = wishlist.has(p.id);
                return (
                  <div
                    key={p.id}
                    className="flex items-center gap-3 rounded-lg border border-border/60 p-2.5 hover:border-cyan-300/50 transition-colors"
                  >
                    <div className="h-12 w-12 flex-shrink-0 overflow-hidden rounded-md bg-muted border border-border/40">
                      {p.images?.[0]?.url && (
                        <img src={p.images[0].url} alt={p.name} className="h-full w-full object-cover" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{p.name}</p>
                      <p className="text-xs text-muted-foreground">{p.shop?.name}</p>
                      <p className="text-sm font-bold text-cyan-700">{formatVND(p.price)}</p>
                    </div>
                    <button
                      onClick={() => importOne(p.id, p)}
                      className={`flex-shrink-0 p-2 rounded-full transition-colors ${
                        inWishlist
                          ? 'bg-rose-100 text-rose-500'
                          : 'bg-slate-100 text-slate-400 hover:text-rose-500 hover:bg-rose-50'
                      }`}
                      aria-label={inWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
                    >
                      <Heart className={`h-4 w-4 ${inWishlist ? 'fill-rose-500' : ''}`} />
                    </button>
                  </div>
                );
              })}
            </div>
          </>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
