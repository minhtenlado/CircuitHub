'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import { Loader2, CheckCircle2, XCircle, AlertTriangle, Star, StarOff } from 'lucide-react';

interface ProductModerationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: {
    id: string;
    name: string;
    slug: string;
    status: string;
    productType: string;
    price: number;
    shop?: { name: string };
    images?: { url: string }[];
  } | null;
  action: 'APPROVE' | 'REJECT' | 'SUSPEND' | 'FEATURE' | 'UNFEATURE' | null;
}

const ACTION_CONFIG: Record<string, { title: string; description: string; icon: any; color: string; requireReason: boolean }> = {
  APPROVE: {
    title: 'Approve Product',
    description: 'This product will be published and visible on the marketplace.',
    icon: CheckCircle2,
    color: 'text-emerald-600',
    requireReason: false,
  },
  REJECT: {
    title: 'Reject Product',
    description: 'The seller will be notified with your reason. The product will be hidden from the marketplace.',
    icon: XCircle,
    color: 'text-red-600',
    requireReason: true,
  },
  SUSPEND: {
    title: 'Suspend Product',
    description: 'The product will be immediately hidden from the marketplace.',
    icon: AlertTriangle,
    color: 'text-amber-600',
    requireReason: false,
  },
  FEATURE: {
    title: 'Feature Product',
    description: 'This product will be highlighted on the homepage and category pages.',
    icon: Star,
    color: 'text-cyan-600',
    requireReason: false,
  },
  UNFEATURE: {
    title: 'Remove Feature',
    description: 'This product will no longer be highlighted.',
    icon: StarOff,
    color: 'text-slate-600',
    requireReason: false,
  },
};

export function ProductModerationDialog({ open, onOpenChange, product, action }: ProductModerationDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!action || !product) return null;

  const config = ACTION_CONFIG[action];
  const Icon = config.icon;

  async function submit() {
    if (config.requireReason && !reason.trim()) {
      toast({ title: 'Reason required', description: 'Please provide a reason for this action.', variant: 'destructive' });
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch('/api/v1/admin/products', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: product!.id,
          action,
          reason: reason.trim() || undefined,
        }),
      });
      const json = await res.json();
      if (json.success) {
        toast({
          title: `Product ${action.toLowerCase()}`,
          description: `"${product!.name}" is now ${json.data.newStatus.toLowerCase()}.`,
        });
        // Invalidate queries to refresh data
        queryClient.invalidateQueries({ queryKey: ['products'] });
        queryClient.invalidateQueries({ queryKey: ['admin-analytics'] });
        onOpenChange(false);
        setReason('');
      } else {
        toast({ title: 'Action failed', description: json.message, variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Network error', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { onOpenChange(o); if (!o) setReason(''); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icon className={`h-5 w-5 ${config.color}`} />
            {config.title}
          </DialogTitle>
        </DialogHeader>

        {/* Product summary */}
        <div className="rounded-lg border border-border/60 p-3 bg-slate-50/50 flex items-center gap-3">
          <div className="h-12 w-12 flex-shrink-0 overflow-hidden rounded-md bg-muted border border-border/40">
            {product.images?.[0]?.url && (
              <img src={product.images[0].url} alt={product.name} className="h-full w-full object-cover" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate">{product.name}</p>
            <div className="flex items-center gap-2 mt-0.5">
              <Badge variant="outline" className="text-[10px]">{product.productType}</Badge>
              <span className="text-xs text-muted-foreground">{product.shop?.name ?? '—'}</span>
            </div>
          </div>
        </div>

        <p className="text-sm text-muted-foreground">{config.description}</p>

        {config.requireReason && (
          <div className="space-y-1.5">
            <Label htmlFor="reason">
              Reason <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Product images are low quality and don't meet our standards..."
              rows={3}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground">This reason will be sent to the seller via notification.</p>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button
            onClick={submit}
            disabled={submitting || (config.requireReason && !reason.trim())}
            className={
              action === 'APPROVE' ? 'bg-emerald-600 hover:bg-emerald-700 text-white' :
              action === 'REJECT' ? 'bg-red-600 hover:bg-red-700 text-white' :
              action === 'SUSPEND' ? 'bg-amber-600 hover:bg-amber-700 text-white' :
              'bg-cyan-600 hover:bg-cyan-700 text-white'
            }
          >
            {submitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Icon className="h-4 w-4 mr-2" />}
            {config.title}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
