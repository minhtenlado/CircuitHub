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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import {
  Loader2,
  Package,
  FileCode,
  Wrench,
  Layers,
  Cpu,
  Tag,
  DollarSign,
  Boxes,
  Image as ImageIcon,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatVND } from '@/lib/format';

interface AddProductDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sellerId: string;
  shopId: string;
  categories: { id: string; name: string; slug: string }[];
}

type ProductType = 'PHYSICAL' | 'DIGITAL' | 'SERVICE';
type Step = 'type' | 'basic' | 'specs' | 'review';

const PRODUCT_TYPES: { id: ProductType; label: string; desc: string; icon: any; color: string }[] = [
  { id: 'PHYSICAL', label: 'Physical Product', desc: 'PCB boards, components, dev boards, sensors, tools', icon: Package, color: 'from-cyan-500 to-teal-400' },
  { id: 'DIGITAL', label: 'Digital Product', desc: 'KiCad/Altium projects, Gerber files, firmware, 3D models', icon: FileCode, color: 'from-teal-500 to-emerald-400' },
  { id: 'SERVICE', label: 'Engineering Service', desc: 'PCB design, review, firmware dev, consultation', icon: Wrench, color: 'from-amber-500 to-orange-400' },
];

export function AddProductDialog({ open, onOpenChange, sellerId, shopId, categories }: AddProductDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [step, setStep] = useState<Step>('type');
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [productType, setProductType] = useState<ProductType>('PHYSICAL');
  const [name, setName] = useState('');
  const [shortDescription, setShortDescription] = useState('');
  const [description, setDescription] = useState('');
  const [brand, setBrand] = useState('');
  const [sku, setSku] = useState('');
  const [mpn, setMpn] = useState('');
  const [price, setPrice] = useState('');
  const [compareAtPrice, setCompareAtPrice] = useState('');
  const [stock, setStock] = useState('');
  const [unlimited, setUnlimited] = useState(false);
  const [categoryId, setCategoryId] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  // PCB
  const [pcbLayers, setPcbLayers] = useState('');
  const [pcbThickness, setPcbThickness] = useState('');
  const [pcbMaterial, setPcbMaterial] = useState('FR4');
  const [pcbSurfaceFinish, setPcbSurfaceFinish] = useState('HASL');
  const [pcbColor, setPcbColor] = useState('Blue');
  const [pcbDimensions, setPcbDimensions] = useState('');
  // Digital
  const [software, setSoftware] = useState('KiCad');
  const [softwareVersion, setSoftwareVersion] = useState('');
  const [currentVersion, setCurrentVersion] = useState('v1.0.0');
  const [fileFormat, setFileFormat] = useState('');
  const [licenseType, setLicenseType] = useState('PERSONAL');
  // Service
  const [serviceScope, setServiceScope] = useState('');
  const [serviceDeliverables, setServiceDeliverables] = useState('');
  const [serviceDurationDays, setServiceDurationDays] = useState('');
  const [serviceRevisions, setServiceRevisions] = useState('3');

  function reset() {
    setStep('type');
    setProductType('PHYSICAL');
    setName('');
    setShortDescription('');
    setDescription('');
    setBrand('');
    setSku('');
    setMpn('');
    setPrice('');
    setCompareAtPrice('');
    setStock('');
    setUnlimited(false);
    setCategoryId('');
    setImageUrl('');
    setPcbLayers('');
    setPcbThickness('');
    setPcbMaterial('FR4');
    setPcbSurfaceFinish('HASL');
    setPcbColor('Blue');
    setPcbDimensions('');
    setSoftware('KiCad');
    setSoftwareVersion('');
    setCurrentVersion('v1.0.0');
    setFileFormat('');
    setLicenseType('PERSONAL');
    setServiceScope('');
    setServiceDeliverables('');
    setServiceDurationDays('');
    setServiceRevisions('3');
  }

  function close() {
    onOpenChange(false);
    setTimeout(reset, 300);
  }

  const steps: { id: Step; label: string }[] = [
    { id: 'type', label: 'Type' },
    { id: 'basic', label: 'Basic Info' },
    { id: 'specs', label: 'Specifications' },
    { id: 'review', label: 'Review' },
  ];
  const currentIdx = steps.findIndex((s) => s.id === step);

  function canProceed(): boolean {
    if (step === 'type') return !!productType;
    if (step === 'basic') return !!name && !!price && !!categoryId;
    if (step === 'specs') {
      if (productType === 'PHYSICAL') return true;
      if (productType === 'DIGITAL') return !!software && !!currentVersion;
      if (productType === 'SERVICE') return !!serviceScope && !!serviceDurationDays;
    }
    return true;
  }

  async function submit() {
    setSubmitting(true);
    try {
      const body: any = {
        sellerId,
        shopId,
        categoryId,
        name,
        productType,
        shortDescription,
        description,
        sku: sku || undefined,
        mpn: mpn || undefined,
        brand: brand || undefined,
        price: parseInt(price, 10),
        compareAtPrice: compareAtPrice ? parseInt(compareAtPrice, 10) : undefined,
        stock: stock ? parseInt(stock, 10) : 0,
        unlimited,
        imageUrl: imageUrl || undefined,
      };
      if (productType === 'PHYSICAL') {
        body.pcbLayers = pcbLayers ? parseInt(pcbLayers, 10) : undefined;
        body.pcbThickness = pcbThickness ? parseFloat(pcbThickness) : undefined;
        body.pcbMaterial = pcbMaterial;
        body.pcbSurfaceFinish = pcbSurfaceFinish;
        body.pcbColor = pcbColor;
        body.pcbDimensions = pcbDimensions || undefined;
      }
      if (productType === 'DIGITAL') {
        body.software = software;
        body.softwareVersion = softwareVersion || undefined;
        body.currentVersion = currentVersion;
        body.fileFormat = fileFormat || undefined;
        body.licenseType = licenseType;
      }
      if (productType === 'SERVICE') {
        body.serviceScope = serviceScope;
        body.serviceDeliverables = serviceDeliverables || undefined;
        body.serviceDurationDays = parseInt(serviceDurationDays, 10);
        body.serviceRevisions = parseInt(serviceRevisions, 10);
      }

      const res = await fetch('/api/v1/seller/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (json.success) {
        toast({ title: 'Product created!', description: name });
        queryClient.invalidateQueries({ queryKey: ['seller-products', sellerId] });
        queryClient.invalidateQueries({ queryKey: ['seller-analytics', sellerId] });
        close();
      } else {
        toast({ title: 'Failed to create product', description: json.message, variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Network error', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && close()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border/60 sticky top-0 bg-background z-10">
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Package className="h-5 w-5 text-cyan-600" />
            Add New Product
          </DialogTitle>
          {/* Step indicator */}
          <div className="flex items-center gap-2 mt-3">
            {steps.map((s, i) => (
              <div key={s.id} className="flex items-center gap-2">
                <div className={cn(
                  'h-7 w-7 rounded-full flex items-center justify-center text-xs font-semibold border-2 transition-colors',
                  step === s.id ? 'border-cyan-500 bg-cyan-50 text-cyan-700' :
                  i < currentIdx ? 'border-emerald-500 bg-emerald-50 text-emerald-600' :
                  'border-border bg-background text-muted-foreground',
                )}>
                  {i < currentIdx ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
                </div>
                <span className={cn('text-xs font-medium hidden sm:inline', step === s.id ? 'text-cyan-700' : 'text-muted-foreground')}>
                  {s.label}
                </span>
                {i < steps.length - 1 && <div className={cn('h-0.5 w-6 sm:w-10', i < currentIdx ? 'bg-emerald-300' : 'bg-border')} />}
              </div>
            ))}
          </div>
        </DialogHeader>

        <div className="px-6 py-5 space-y-5">
          {/* Step 1: Type */}
          {step === 'type' && (
            <div className="space-y-3">
              <Label className="text-sm font-semibold">Select product type</Label>
              <div className="grid gap-3">
                {PRODUCT_TYPES.map((t) => {
                  const Icon = t.icon;
                  return (
                    <button
                      key={t.id}
                      onClick={() => setProductType(t.id)}
                      className={cn(
                        'flex items-start gap-3 p-4 rounded-xl border-2 text-left transition-all',
                        productType === t.id ? 'border-cyan-500 bg-cyan-50/50 shadow-sm' : 'border-border hover:border-cyan-300 hover:bg-cyan-50/20',
                      )}
                    >
                      <div className={cn('h-10 w-10 rounded-lg bg-gradient-to-br flex items-center justify-center flex-shrink-0', t.color)}>
                        <Icon className="h-5 w-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-sm">{t.label}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{t.desc}</p>
                      </div>
                      {productType === t.id && <CheckCircle2 className="h-5 w-5 text-cyan-500 flex-shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Step 2: Basic Info */}
          {step === 'basic' && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="name">Product Name <span className="text-red-500">*</span></Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. ESP32-WROOM-32 DevKit V1" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="shortDesc">Short Description</Label>
                <Input id="shortDesc" value={shortDescription} onChange={(e) => setShortDescription(e.target.value)} placeholder="One-line summary" maxLength={120} />
                <p className="text-xs text-muted-foreground">{shortDescription.length}/120 characters</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="category">Category <span className="text-red-500">*</span></Label>
                  <select
                    id="category"
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full h-9 px-3 rounded-md border border-border bg-background text-sm focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100 outline-none"
                  >
                    <option value="">Select category...</option>
                    {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="brand">Brand</Label>
                  <Input id="brand" value={brand} onChange={(e) => setBrand(e.target.value)} placeholder="e.g. Espressif" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="sku">SKU</Label>
                  <Input id="sku" value={sku} onChange={(e) => setSku(e.target.value)} placeholder="BF-ESP32-DK" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="mpn">MPN</Label>
                  <Input id="mpn" value={mpn} onChange={(e) => setMpn(e.target.value)} placeholder="Manufacturer Part Number" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="price">Price (VND) <span className="text-red-500">*</span></Label>
                  <div className="relative">
                    <DollarSign className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input id="price" type="number" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="89000" className="pl-8" />
                  </div>
                  {price && <p className="text-xs text-cyan-600">{formatVND(parseInt(price, 10) || 0)}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="compareAt">Compare-at Price</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input id="compareAt" type="number" value={compareAtPrice} onChange={(e) => setCompareAtPrice(e.target.value)} placeholder="120000" className="pl-8" />
                  </div>
                </div>
              </div>
              {productType !== 'DIGITAL' && (
                <div className="space-y-1.5">
                  <Label htmlFor="stock">Stock Quantity</Label>
                  <div className="flex items-center gap-3">
                    <div className="relative flex-1">
                      <Boxes className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input id="stock" type="number" value={stock} onChange={(e) => setStock(e.target.value)} placeholder="100" className="pl-8" disabled={unlimited} />
                    </div>
                    <label className="flex items-center gap-2 text-sm whitespace-nowrap">
                      <input type="checkbox" checked={unlimited} onChange={(e) => setUnlimited(e.target.checked)} className="rounded" />
                      Unlimited
                    </label>
                  </div>
                </div>
              )}
              {productType === 'DIGITAL' && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-teal-50 border border-teal-200">
                  <Boxes className="h-4 w-4 text-teal-600 flex-shrink-0" />
                  <span className="text-xs text-teal-800">Digital products have unlimited inventory. License keys are issued per purchase.</span>
                </div>
              )}
              <div className="space-y-1.5">
                <Label htmlFor="image">Image URL</Label>
                <div className="relative">
                  <ImageIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input id="image" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://..." className="pl-8" />
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Specs (type-specific) */}
          {step === 'specs' && (
            <div className="space-y-4">
              {productType === 'PHYSICAL' && (
                <>
                  <div className="flex items-center gap-2 text-sm font-semibold text-cyan-700">
                    <Layers className="h-4 w-4" /> PCB Specifications
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="layers">Layers</Label>
                      <select id="layers" value={pcbLayers} onChange={(e) => setPcbLayers(e.target.value)} className="w-full h-9 px-3 rounded-md border border-border bg-background text-sm">
                        <option value="">Select...</option>
                        <option value="1">1 layer</option>
                        <option value="2">2 layers</option>
                        <option value="4">4 layers</option>
                        <option value="6">6 layers</option>
                        <option value="8">8 layers</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="thickness">Thickness (mm)</Label>
                      <Input id="thickness" type="number" step="0.1" value={pcbThickness} onChange={(e) => setPcbThickness(e.target.value)} placeholder="1.6" />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="material">Material</Label>
                      <select id="material" value={pcbMaterial} onChange={(e) => setPcbMaterial(e.target.value)} className="w-full h-9 px-3 rounded-md border border-border bg-background text-sm">
                        <option value="FR4">FR4</option>
                        <option value="FR408">FR408 (High-Frequency)</option>
                        <option value="Rogers">Rogers</option>
                        <option value="Aluminum">Aluminum (MCPCB)</option>
                        <option value="Polyimide">Polyimide (Flexible)</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="finish">Surface Finish</Label>
                      <select id="finish" value={pcbSurfaceFinish} onChange={(e) => setPcbSurfaceFinish(e.target.value)} className="w-full h-9 px-3 rounded-md border border-border bg-background text-sm">
                        <option value="HASL">HASL (Lead)</option>
                        <option value="HASL-RoHS">HASL Lead-Free</option>
                        <option value="ENIG">ENIG (Gold)</option>
                        <option value="OSP">OSP</option>
                        <option value="Immersion Silver">Immersion Silver</option>
                        <option value="Immersion Tin">Immersion Tin</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="color">Solder Mask Color</Label>
                      <select id="color" value={pcbColor} onChange={(e) => setPcbColor(e.target.value)} className="w-full h-9 px-3 rounded-md border border-border bg-background text-sm">
                        <option value="Blue">Blue</option>
                        <option value="Green">Green</option>
                        <option value="Red">Red</option>
                        <option value="Black">Black</option>
                        <option value="White">White</option>
                        <option value="Yellow">Yellow</option>
                        <option value="Purple">Purple</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="dims">Dimensions</Label>
                      <Input id="dims" value={pcbDimensions} onChange={(e) => setPcbDimensions(e.target.value)} placeholder="50x80mm" />
                    </div>
                  </div>
                </>
              )}

              {productType === 'DIGITAL' && (
                <>
                  <div className="flex items-center gap-2 text-sm font-semibold text-teal-700">
                    <FileCode className="h-4 w-4" /> Digital Asset Details
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="software">Software <span className="text-red-500">*</span></Label>
                      <select id="software" value={software} onChange={(e) => setSoftware(e.target.value)} className="w-full h-9 px-3 rounded-md border border-border bg-background text-sm">
                        <option value="KiCad">KiCad</option>
                        <option value="Altium">Altium Designer</option>
                        <option value="Proteus">Proteus</option>
                        <option value="Eagle">Eagle</option>
                        <option value="Gerber">Gerber (Universal)</option>
                        <option value="ESP-IDF">ESP-IDF (Firmware)</option>
                        <option value="STM32CubeIDE">STM32CubeIDE</option>
                        <option value="Arduino">Arduino IDE</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="swVersion">Software Version</Label>
                      <Input id="swVersion" value={softwareVersion} onChange={(e) => setSoftwareVersion(e.target.value)} placeholder="KiCad 9" />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="version">Current Version</Label>
                      <Input id="version" value={currentVersion} onChange={(e) => setCurrentVersion(e.target.value)} placeholder="v1.0.0" />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="format">File Format</Label>
                      <Input id="format" value={fileFormat} onChange={(e) => setFileFormat(e.target.value)} placeholder=".kicad_pro,.kicad_pcb,.zip" />
                    </div>
                    <div className="space-y-1.5 col-span-2">
                      <Label htmlFor="license">License Type</Label>
                      <select id="license" value={licenseType} onChange={(e) => setLicenseType(e.target.value)} className="w-full h-9 px-3 rounded-md border border-border bg-background text-sm">
                        <option value="PERSONAL">Personal Use</option>
                        <option value="COMMERCIAL">Commercial Use</option>
                        <option value="EDUCATIONAL">Educational</option>
                        <option value="EXTENDED_COMMERCIAL">Extended Commercial</option>
                        <option value="PRIVATE_USE">Private Use Only</option>
                      </select>
                    </div>
                  </div>
                </>
              )}

              {productType === 'SERVICE' && (
                <>
                  <div className="flex items-center gap-2 text-sm font-semibold text-amber-700">
                    <Wrench className="h-4 w-4" /> Service Details
                  </div>
                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="scope">Service Scope <span className="text-red-500">*</span></Label>
                      <Textarea id="scope" value={serviceScope} onChange={(e) => setServiceScope(e.target.value)} placeholder="e.g. End-to-end custom PCB design: schematic, layout, gerbers, BOM" rows={2} />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="deliverables">Deliverables</Label>
                      <Textarea id="deliverables" value={serviceDeliverables} onChange={(e) => setServiceDeliverables(e.target.value)} placeholder="e.g. Schematic (PDF+source), PCB layout, Gerbers, BOM, 3D model" rows={2} />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label htmlFor="duration">Duration (days) <span className="text-red-500">*</span></Label>
                        <Input id="duration" type="number" value={serviceDurationDays} onChange={(e) => setServiceDurationDays(e.target.value)} placeholder="14" />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="revisions">Revisions Included</Label>
                        <Input id="revisions" type="number" value={serviceRevisions} onChange={(e) => setServiceRevisions(e.target.value)} placeholder="3" />
                      </div>
                    </div>
                  </div>
                </>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="description">Full Description</Label>
                <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Detailed product description..." rows={4} />
              </div>
            </div>
          )}

          {/* Step 4: Review */}
          {step === 'review' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-cyan-700">
                <CheckCircle2 className="h-4 w-4" /> Review &amp; Confirm
              </div>
              <div className="rounded-xl border border-border/60 divide-y divide-border/40">
                <ReviewRow label="Type" value={<Badge variant="outline" className="bg-cyan-50 text-cyan-700 border-cyan-200">{productType}</Badge>} />
                <ReviewRow label="Name" value={name || '—'} />
                <ReviewRow label="Category" value={categories.find((c) => c.id === categoryId)?.name ?? '—'} />
                <ReviewRow label="Price" value={<span className="font-bold text-cyan-700">{price ? formatVND(parseInt(price, 10)) : '—'}</span>} />
                {compareAtPrice && <ReviewRow label="Compare-at" value={<span className="line-through text-muted-foreground">{formatVND(parseInt(compareAtPrice, 10))}</span>} />}
                {brand && <ReviewRow label="Brand" value={brand} />}
                {productType !== 'DIGITAL' && <ReviewRow label="Stock" value={unlimited ? 'Unlimited' : (stock || '0')} />}
                {productType === 'PHYSICAL' && pcbLayers && <ReviewRow label="PCB Layers" value={`${pcbLayers} layers`} />}
                {productType === 'DIGITAL' && <ReviewRow label="Software" value={`${software} ${softwareVersion}`} />}
                {productType === 'SERVICE' && <ReviewRow label="Duration" value={`${serviceDurationDays} days`} />}
              </div>
              <p className="text-xs text-muted-foreground">By clicking &quot;Create Product&quot;, your product will be published immediately. Admin may moderate it later.</p>
            </div>
          )}
        </div>

        <DialogFooter className="px-6 py-4 border-t border-border/60 sticky bottom-0 bg-background">
          <div className="flex items-center justify-between w-full">
            <Button variant="ghost" onClick={close} disabled={submitting}>
              Cancel
            </Button>
            <div className="flex gap-2">
              {step !== 'type' && (
                <Button variant="outline" onClick={() => setStep(steps[currentIdx - 1].id)} disabled={submitting}>
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Back
                </Button>
              )}
              {step !== 'review' ? (
                <Button onClick={() => setStep(steps[currentIdx + 1].id)} disabled={!canProceed()} className="bg-cyan-600 hover:bg-cyan-700 text-white">
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              ) : (
                <Button onClick={submit} disabled={submitting} className="bg-gradient-to-r from-cyan-600 to-teal-500 hover:from-cyan-700 hover:to-teal-600 text-white">
                  {submitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
                  {submitting ? 'Creating...' : 'Create Product'}
                </Button>
              )}
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ReviewRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between px-4 py-2.5">
      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</span>
      <span className="text-sm text-right">{value}</span>
    </div>
  );
}
