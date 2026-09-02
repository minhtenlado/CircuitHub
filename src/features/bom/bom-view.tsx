'use client';

import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useCartStore } from '@/stores/cart-store';
import { formatVND } from '@/lib/format';
import {
  Upload,
  FileSpreadsheet,
  FileText,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Trash2,
  Download,
  Cpu,
  Zap,
  Package,
  Info,
  ShoppingCart,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface BomItem {
  reference: string;
  partNumber: string;
  quantity: number;
  description?: string;
  manufacturer?: string;
  matched?: {
    productId: string;
    name: string;
    slug: string;
    price: number;
    stockAvailable: number;
    shopName: string;
    imageUrl?: string;
  } | null;
  status: 'matched' | 'unmatched' | 'searching';
}

const SAMPLE_BOM = `Reference,Part Number,Quantity,Description,Manufacturer
R1,R0603-10K-1%,10,10K 0603 1% Resistor,Yageo
R2,R0603-4K7-1%,4,4.7K 0603 1% Resistor,Yageo
C1,C0603-100NF,8,100nF 0603 X7R Capacitor,Murata
C2,C0805-10UF,3,10uF 0805 X5R Capacitor,Taiyo Yuden
U1,AMS1117-3.3,2,3.3V LDO Regulator SOT-223,AMS
U2,ESP32-WROOM-32,1,WiFi+BLE Module,Espressif
U3,STM32F103C8T6,1,ARM Cortex-M3 MCU,STMicroelectronics
D1,SMD-LED-BLUE,5,Blue LED 0603,Kingbright
Q1,BC847,3,NPN Transistor SOT-23,NXP
J1,Header-2.54-2x1,4,2.54mm 1x2 Pin Header,Generic`;

export function BomView() {
  const { toast } = useToast();
  const [bomItems, setBomItems] = useState<BomItem[]>([]);
  const [fileName, setFileName] = useState<string>('');
  const [parsing, setParsing] = useState(false);
  const [matching, setMatching] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function parseCsv(text: string): BomItem[] {
    const lines = text.trim().split(/\r?\n/);
    if (lines.length < 2) return [];
    const items: BomItem[] = [];
    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(',').map((c) => c.trim().replace(/^["']|["']$/g, ''));
      if (cols.length < 3) continue;
      items.push({
        reference: cols[0] || `R${i}`,
        partNumber: cols[1] || '',
        quantity: parseInt(cols[2], 10) || 1,
        description: cols[3] || '',
        manufacturer: cols[4] || '',
        status: 'searching',
      });
    }
    return items;
  }

  async function handleFile(file: File) {
    setFileName(file.name);
    setParsing(true);
    setBomItems([]);
    try {
      const text = await file.text();
      const items = parseCsv(text);
      setBomItems(items);
      toast({ title: 'BOM parsed', description: `${items.length} line items found` });
      await matchItems(items);
    } catch {
      toast({ title: 'Parse failed', description: 'Could not read file', variant: 'destructive' });
    } finally {
      setParsing(false);
    }
  }

  async function matchItems(items: BomItem[]) {
    setMatching(true);
    const updated = [...items];
    for (let i = 0; i < updated.length; i++) {
      const item = updated[i];
      try {
        const res = await fetch(`/api/v1/products?q=${encodeURIComponent(item.partNumber)}&limit=1`);
        const json = await res.json();
        if (json.success && json.data.items.length > 0) {
          const p = json.data.items[0];
          updated[i] = {
            ...item,
            status: 'matched',
            matched: {
              productId: p.id,
              name: p.name,
              slug: p.slug,
              price: p.price,
              stockAvailable: p.stockAvailable,
              shopName: p.shop?.name ?? '',
              imageUrl: p.images?.[0]?.url,
            },
          };
        } else {
          updated[i] = { ...item, status: 'unmatched' };
        }
        setBomItems([...updated]);
      } catch {
        updated[i] = { ...item, status: 'unmatched' };
        setBomItems([...updated]);
      }
    }
    setMatching(false);
    const matched = updated.filter((i) => i.status === 'matched').length;
    toast({ title: 'Matching complete', description: `${matched}/${updated.length} parts matched` });
  }

  function loadSample() {
    setFileName('sample-bom.csv');
    const items = parseCsv(SAMPLE_BOM);
    setBomItems(items);
    toast({ title: 'Sample BOM loaded', description: `${items.length} line items` });
    matchItems(items);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  const matchedCount = bomItems.filter((i) => i.status === 'matched').length;
  const unmatchedCount = bomItems.filter((i) => i.status === 'unmatched').length;
  const totalCost = bomItems.reduce((sum, i) => sum + (i.matched ? i.matched.price * i.quantity : 0), 0);
  const totalQty = bomItems.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-cyan-500 to-teal-400 flex items-center justify-center shadow-[0_6px_20px_-6px_rgba(6,182,212,0.5)]">
            <FileSpreadsheet className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">BOM Upload &amp; Cost Estimator</h1>
            <p className="text-sm text-muted-foreground">Upload your Bill of Materials (CSV) to auto-match parts and estimate total cost</p>
          </div>
        </div>
      </div>

      <div className="mb-6 rounded-xl border border-cyan-200 bg-cyan-50/50 p-4 flex items-start gap-3">
        <Info className="h-5 w-5 text-cyan-600 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-cyan-900">
          <p className="font-semibold mb-1">Supported format: CSV</p>
          <p className="text-cyan-800">Columns: <code className="font-mono text-xs bg-cyan-100 px-1.5 py-0.5 rounded">Reference, Part Number, Quantity, Description, Manufacturer</code></p>
          <p className="text-cyan-800 mt-1">We&apos;ll auto-match each part against marketplace products and calculate your total cost.</p>
        </div>
      </div>

      {bomItems.length === 0 ? (
        <Card
          className="border-2 border-dashed border-cyan-300/60 hover:border-cyan-400 transition-colors cursor-pointer overflow-hidden"
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
        >
          <CardContent className="p-12 flex flex-col items-center justify-center text-center min-h-[300px]">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="h-20 w-20 rounded-full bg-cyan-50 border-2 border-cyan-200 flex items-center justify-center mb-4"
            >
              {parsing ? <Loader2 className="h-9 w-9 text-cyan-500 animate-spin" /> : <Upload className="h-9 w-9 text-cyan-500" />}
            </motion.div>
            <h3 className="text-lg font-semibold mb-1">
              {parsing ? 'Parsing BOM...' : 'Drop your BOM CSV here'}
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              or click to browse · max 10MB
            </p>
            <div className="flex gap-2">
              <Button className="bg-cyan-600 hover:bg-cyan-700 text-white">
                <Upload className="h-4 w-4 mr-2" />
                Choose File
              </Button>
              <Button variant="outline" onClick={(e) => { e.stopPropagation(); loadSample(); }} className="border-cyan-200 text-cyan-700 hover:bg-cyan-50">
                <FileText className="h-4 w-4 mr-2" />
                Try Sample BOM
              </Button>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.txt"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFile(file);
              }}
            />
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
            <Card className="border-border/60">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-1">
                  <Package className="h-4 w-4 text-cyan-600" />
                  <span className="text-xs text-muted-foreground">Line Items</span>
                </div>
                <p className="text-2xl font-bold tabular-nums">{bomItems.length}</p>
              </CardContent>
            </Card>
            <Card className="border-border/60">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-1">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  <span className="text-xs text-muted-foreground">Matched</span>
                </div>
                <p className="text-2xl font-bold tabular-nums text-emerald-700">{matchedCount}</p>
              </CardContent>
            </Card>
            <Card className="border-border/60">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-1">
                  <AlertCircle className="h-4 w-4 text-amber-600" />
                  <span className="text-xs text-muted-foreground">Unmatched</span>
                </div>
                <p className="text-2xl font-bold tabular-nums text-amber-700">{unmatchedCount}</p>
              </CardContent>
            </Card>
            <Card className="border-cyan-300/60 bg-gradient-to-br from-cyan-50/60 to-teal-50/40">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-1">
                  <Zap className="h-4 w-4 text-cyan-600" />
                  <span className="text-xs text-muted-foreground">Est. Total Cost</span>
                </div>
                <p className="text-2xl font-bold tabular-nums text-cyan-700">{formatVND(totalCost)}</p>
              </CardContent>
            </Card>
          </div>

          <Card className="border-border/60 overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <FileSpreadsheet className="h-4 w-4 text-cyan-600" />
                  {fileName}
                  {matching && <Loader2 className="h-3.5 w-3.5 animate-spin text-cyan-500" />}
                </CardTitle>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => { setBomItems([]); setFileName(''); }} className="text-xs h-7">
                    <Trash2 className="h-3 w-3 mr-1" />
                    Clear
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => matchItems(bomItems)} disabled={matching} className="text-xs h-7 border-cyan-200 text-cyan-700 hover:bg-cyan-50">
                    {matching ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Zap className="h-3 w-3 mr-1" />}
                    Re-match
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50/60 border-y border-border/40">
                    <tr>
                      <th className="text-left px-4 py-2.5 font-semibold text-xs uppercase tracking-wider text-muted-foreground">Ref</th>
                      <th className="text-left px-4 py-2.5 font-semibold text-xs uppercase tracking-wider text-muted-foreground">Part Number</th>
                      <th className="text-left px-4 py-2.5 font-semibold text-xs uppercase tracking-wider text-muted-foreground">Description</th>
                      <th className="text-right px-4 py-2.5 font-semibold text-xs uppercase tracking-wider text-muted-foreground">Qty</th>
                      <th className="text-left px-4 py-2.5 font-semibold text-xs uppercase tracking-wider text-muted-foreground">Matched Product</th>
                      <th className="text-right px-4 py-2.5 font-semibold text-xs uppercase tracking-wider text-muted-foreground">Unit Price</th>
                      <th className="text-right px-4 py-2.5 font-semibold text-xs uppercase tracking-wider text-muted-foreground">Line Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    <AnimatePresence>
                      {bomItems.map((item, idx) => (
                        <motion.tr
                          key={`${item.reference}-${idx}`}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className={cn('border-b border-border/20', idx % 2 === 1 && 'bg-slate-50/20')}
                        >
                          <td className="px-4 py-3 font-mono text-xs font-semibold">{item.reference}</td>
                          <td className="px-4 py-3 font-mono text-xs">{item.partNumber}</td>
                          <td className="px-4 py-3 text-xs text-muted-foreground">{item.description || '—'}</td>
                          <td className="px-4 py-3 text-right tabular-nums font-medium">{item.quantity}</td>
                          <td className="px-4 py-3">
                            {item.status === 'searching' && (
                              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                <Loader2 className="h-3 w-3 animate-spin" />
                                Searching...
                              </div>
                            )}
                            {item.status === 'unmatched' && (
                              <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 text-[10px]">
                                <AlertCircle className="h-3 w-3 mr-1" />
                                No match
                              </Badge>
                            )}
                            {item.status === 'matched' && item.matched && (
                              <div className="flex items-center gap-2">
                                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 flex-shrink-0" />
                                <div className="min-w-0">
                                  <p className="text-xs font-medium truncate">{item.matched.name}</p>
                                  <p className="text-[10px] text-muted-foreground">{item.matched.shopName}</p>
                                </div>
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right tabular-nums text-xs">
                            {item.matched ? formatVND(item.matched.price) : '—'}
                          </td>
                          <td className="px-4 py-3 text-right tabular-nums text-xs font-semibold text-cyan-700">
                            {item.matched ? formatVND(item.matched.price * item.quantity) : '—'}
                          </td>
                        </motion.tr>
                      ))}
                    </AnimatePresence>
                  </tbody>
                  <tfoot className="bg-cyan-50/40 border-t-2 border-cyan-200">
                    <tr>
                      <td colSpan={3} className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Total ({totalQty} units)
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums font-bold">{totalQty}</td>
                      <td colSpan={2} className="px-4 py-3 text-right text-xs text-muted-foreground">
                        {matchedCount}/{bomItems.length} matched
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums font-bold text-cyan-700 text-base">
                        {formatVND(totalCost)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </CardContent>
          </Card>

          <div className="mt-6 flex flex-wrap gap-3 justify-end">
            <Button variant="outline" onClick={() => {
              const csv = 'Reference,Part Number,Quantity,Description,Manufacturer\n' + bomItems.map(i => `${i.reference},${i.partNumber},${i.quantity},${i.description ?? ''},${i.manufacturer ?? ''}`).join('\n');
              const blob = new Blob([csv], { type: 'text/csv' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = 'bom-export.csv';
              a.click();
              toast({ title: 'BOM exported' });
            }}>
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
            <Button
              className="bg-cyan-600 hover:bg-cyan-700 text-white"
              onClick={() => {
                const matched = bomItems.filter((i) => i.status === 'matched' && i.matched);
                if (matched.length === 0) {
                  toast({ title: 'No matched parts to add', variant: 'destructive' });
                  return;
                }
                matched.forEach((i) => {
                  useCartStore.getState().addItem({
                    productId: i.matched!.productId,
                    slug: i.matched!.slug,
                    name: i.matched!.name,
                    imageUrl: i.matched!.imageUrl,
                    price: i.matched!.price,
                    productType: 'PHYSICAL',
                    shopId: i.matched!.shopName,
                    shopName: i.matched!.shopName,
                  }, i.quantity);
                });
                toast({ title: `${matched.length} parts added to cart`, description: `Total: ${formatVND(totalCost)}` });
              }}
            >
              <ShoppingCart className="h-4 w-4 mr-2" />
              Add All Matched to Cart
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
