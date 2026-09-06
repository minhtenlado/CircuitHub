'use client';

import { useState, useEffect } from 'react';
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
  Layers,
  Cpu,
  Boxes,
  Sparkles,
  Github,
  CheckCircle2,
  ShieldCheck,
  Eye,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatVND } from '@/lib/format';

interface AddProductDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sellerId: string;
  shopId: string;
  categories: { id: string; name: string; slug: string }[];
  initialType?: ProductType;
  initialLicense?: string;
}

type ProductType = 'PHYSICAL' | 'DIGITAL';

const SAMPLE_PRESETS = [
  {
    name: 'KiCad 3D PCB',
    url: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=600&auto=format&fit=crop&q=80',
    tag: 'KiCad 9',
  },
  {
    name: 'ESP32 IoT Node',
    url: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&auto=format&fit=crop&q=80',
    tag: 'ESP-IDF',
  },
  {
    name: 'Cảm biến Sensor',
    url: 'https://images.unsplash.com/photo-1517420704952-d9f39e95b43e?w=600&auto=format&fit=crop&q=80',
    tag: 'Altium',
  },
];

export function AddProductDialog({ open, onOpenChange, sellerId, shopId, categories, initialType, initialLicense }: AddProductDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [submitting, setSubmitting] = useState(false);

  // Mode state: 'DIGITAL' = Open Source Project Studio, 'PHYSICAL' = Hardware Product
  const [productType, setProductType] = useState<ProductType>(initialType || 'DIGITAL');

  // Form state
  const [name, setName] = useState('');
  const [shortDescription, setShortDescription] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [imageUrl, setImageUrl] = useState('');

  // Physical fields
  const [brand, setBrand] = useState('');
  const [sku, setSku] = useState('');
  const [mpn, setMpn] = useState('');
  const [price, setPrice] = useState('');
  const [compareAtPrice, setCompareAtPrice] = useState('');
  const [stock, setStock] = useState('10');
  const [unlimited, setUnlimited] = useState(false);
  const [pcbLayers, setPcbLayers] = useState('');
  const [pcbThickness, setPcbThickness] = useState('');
  const [pcbMaterial, setPcbMaterial] = useState('FR4');
  const [pcbSurfaceFinish, setPcbSurfaceFinish] = useState('HASL');
  const [pcbColor, setPcbColor] = useState('Blue');
  const [pcbDimensions, setPcbDimensions] = useState('');

  // Digital / Open Source fields
  const [software, setSoftware] = useState('KiCad');
  const [softwareVersion, setSoftwareVersion] = useState('');
  const [currentVersion, setCurrentVersion] = useState('v1.0.0');
  const [fileFormat, setFileFormat] = useState('');
  const [licenseType, setLicenseType] = useState('OPEN_SOURCE');
  const [githubUrl, setGithubUrl] = useState('');

  useEffect(() => {
    if (open) {
      if (initialType) {
        setProductType(initialType);
      }
      if (initialLicense) {
        setLicenseType(initialLicense);
        if (initialLicense === 'OPEN_SOURCE') {
          setProductType('DIGITAL');
          setPrice('0');
        }
      }
    }
  }, [open, initialType, initialLicense]);

  function reset() {
    setProductType(initialType || 'DIGITAL');
    setName('');
    setShortDescription('');
    setDescription('');
    setBrand('');
    setSku('');
    setMpn('');
    setPrice('');
    setCompareAtPrice('');
    setStock('10');
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
    setLicenseType('OPEN_SOURCE');
    setGithubUrl('');
  }

  function close() {
    onOpenChange(false);
    setTimeout(reset, 300);
  }

  async function submit() {
    if (!name.trim()) {
      toast({ title: 'Vui lòng nhập tên dự án / sản phẩm', variant: 'destructive' });
      return;
    }
    if (productType === 'PHYSICAL') {
      if (!price || isNaN(parseInt(price, 10))) {
        toast({ title: 'Vui lòng nhập giá bán hợp lệ', variant: 'destructive' });
        return;
      }
      if (!categoryId) {
        toast({ title: 'Vui lòng chọn danh mục sản phẩm', variant: 'destructive' });
        return;
      }
    }

    setSubmitting(true);
    try {
      const body: any = {
        sellerId,
        shopId,
        categoryId: categoryId || undefined,
        name: name.trim(),
        productType,
        shortDescription: shortDescription.trim() || undefined,
        description: description.trim() || undefined,
        imageUrl: imageUrl.trim() || undefined,
      };

      if (productType === 'PHYSICAL') {
        body.sku = sku.trim() || undefined;
        body.mpn = mpn.trim() || undefined;
        body.brand = brand.trim() || undefined;
        body.price = parseInt(price, 10);
        body.compareAtPrice = compareAtPrice ? parseInt(compareAtPrice, 10) : undefined;
        body.stock = stock ? parseInt(stock, 10) : 0;
        body.unlimited = unlimited;
        body.pcbLayers = pcbLayers ? parseInt(pcbLayers, 10) : undefined;
        body.pcbThickness = pcbThickness ? parseFloat(pcbThickness) : undefined;
        body.pcbMaterial = pcbMaterial;
        body.pcbSurfaceFinish = pcbSurfaceFinish;
        body.pcbColor = pcbColor;
        body.pcbDimensions = pcbDimensions.trim() || undefined;
      } else {
        // DIGITAL / OPEN SOURCE
        body.price = 0;
        body.unlimited = true;
        body.software = software;
        body.softwareVersion = softwareVersion.trim() || undefined;
        body.currentVersion = currentVersion.trim() || 'v1.0.0';
        body.fileFormat = fileFormat.trim() || undefined;
        body.licenseType = licenseType || 'OPEN_SOURCE';
        body.githubUrl = githubUrl.trim() || undefined;
      }

      const res = await fetch('/api/v1/seller/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (json.success) {
        toast({
          title: productType === 'DIGITAL'
            ? '🚀 Dự án Mã nguồn mở đã xuất bản thành công!'
            : '📦 Sản phẩm linh kiện đã được tạo thành công!',
          description: name,
        });
        queryClient.invalidateQueries({ queryKey: ['seller-products'] });
        queryClient.invalidateQueries({ queryKey: ['products'] });
        close();
      } else {
        toast({
          title: 'Không thể tạo sản phẩm / dự án',
          description: json.message,
          variant: 'destructive',
        });
      }
    } catch {
      toast({ title: 'Lỗi kết nối mạng, vui lòng thử lại', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && close()}>
      <DialogContent className="sm:max-w-4xl max-w-[96vw] max-h-[90vh] flex flex-col p-0 overflow-hidden rounded-2xl border-border/80 bg-background shadow-2xl">
        {/* Header */}
        <div className="px-6 pt-5 pb-4 border-b border-border/60 bg-muted/20">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <DialogTitle className="text-xl font-bold flex items-center gap-2.5">
                {productType === 'DIGITAL' ? (
                  <>
                    <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
                      <FileCode className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span>Chia Sẻ Dự Án Mã Nguồn Mở</span>
                        <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 text-[11px] font-semibold">
                          0 ₫ Miễn phí
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground font-normal mt-0.5">
                        Tự do chia sẻ thiết kế KiCad, Altium, Gerber &amp; Firmware cho cộng đồng. Không cần CCCD.
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-cyan-500 to-teal-600 flex items-center justify-center text-white shadow-md shadow-cyan-500/20">
                      <Package className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span>Đăng Bán Linh Kiện / Bo Mạch Mới</span>
                        <Badge className="bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border-cyan-500/30 text-[11px] font-semibold">
                          Thương mại
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground font-normal mt-0.5">
                        Thiết lập sản phẩm thương mại vào gian hàng phần cứng của bạn.
                      </p>
                    </div>
                  </>
                )}
              </DialogTitle>
            </div>

            {/* Mode Switcher */}
            <div className="flex items-center bg-muted/60 p-1 rounded-xl border border-border/60 self-start sm:self-auto">
              <button
                type="button"
                onClick={() => {
                  setProductType('DIGITAL');
                  setLicenseType('OPEN_SOURCE');
                  setPrice('0');
                }}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer',
                  productType === 'DIGITAL'
                    ? 'bg-emerald-600 text-white shadow-sm font-semibold'
                    : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
                )}
              >
                <Sparkles className="h-3.5 w-3.5" />
                Mã Nguồn Mở (0 ₫)
              </button>
              <button
                type="button"
                onClick={() => {
                  setProductType('PHYSICAL');
                  if (price === '0') setPrice('');
                }}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer',
                  productType === 'PHYSICAL'
                    ? 'bg-cyan-600 text-white shadow-sm font-semibold'
                    : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
                )}
              >
                <Package className="h-3.5 w-3.5" />
                Bán Hàng
              </button>
            </div>
          </div>
        </div>

        {/* Scrollable Form Body */}
        <div className="flex-1 overflow-y-auto">
          {productType === 'DIGITAL' ? (
            /* Open Source Hardware Studio */
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 p-6">
              {/* Left Column: Form Details (7 cols) */}
              <div className="lg:col-span-7 space-y-4">
                {/* Project Name */}
                <div className="space-y-1.5">
                  <Label htmlFor="name" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                    <span>Tên Dự Án Mã Nguồn Mở <span className="text-red-500">*</span></span>
                    <span className="text-[11px] font-normal lowercase text-emerald-600 dark:text-emerald-400">công khai cộng đồng</span>
                  </Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ví dụ: ESP32-S3 Voice Assistant Node (KiCad 9)"
                    className="h-10 text-sm focus-visible:ring-emerald-500"
                  />
                </div>

                {/* Short Description */}
                <div className="space-y-1.5">
                  <Label htmlFor="shortDesc" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                    <span>Tóm Tắt Tính Năng</span>
                    <span className="text-[11px] font-normal text-muted-foreground">{shortDescription.length}/120 ký tự</span>
                  </Label>
                  <Input
                    id="shortDesc"
                    value={shortDescription}
                    onChange={(e) => setShortDescription(e.target.value)}
                    placeholder="Mô tả 1 câu ngắn gọn về tính năng, chip sử dụng và ứng dụng thực tế"
                    maxLength={120}
                    className="h-9 text-sm"
                  />
                </div>

                {/* Category & EDA Software */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="category" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Danh Mục Phần Cứng
                    </Label>
                    <select
                      id="category"
                      value={categoryId}
                      onChange={(e) => setCategoryId(e.target.value)}
                      className="w-full h-9 px-3 rounded-lg border border-border bg-background text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none"
                    >
                      <option value="">Chọn danh mục phù hợp...</option>
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="software" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Phần Mềm Thiết Kế (EDA)
                    </Label>
                    <select
                      id="software"
                      value={software}
                      onChange={(e) => setSoftware(e.target.value)}
                      className="w-full h-9 px-3 rounded-lg border border-border bg-background text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none"
                    >
                      <option value="KiCad">KiCad (Mã nguồn mở)</option>
                      <option value="Altium">Altium Designer</option>
                      <option value="EasyEDA">EasyEDA</option>
                      <option value="Gerber">File Gerber (.zip)</option>
                      <option value="ESP-IDF">Firmware ESP-IDF / FreeRTOS</option>
                      <option value="Arduino">Mã nguồn Arduino</option>
                      <option value="STM32CubeIDE">STM32CubeIDE / HAL</option>
                      <option value="Proteus">Proteus Design Suite</option>
                    </select>
                  </div>
                </div>

                {/* Version & File Format */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="version" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Phiên Bản Phát Hành
                    </Label>
                    <Input
                      id="version"
                      value={currentVersion}
                      onChange={(e) => setCurrentVersion(e.target.value)}
                      placeholder="v1.0.0 hoặc Rev B"
                      className="h-9 text-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="format" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Định Dạng Tệp Tin
                    </Label>
                    <Input
                      id="format"
                      value={fileFormat}
                      onChange={(e) => setFileFormat(e.target.value)}
                      placeholder=".kicad_pcb, .zip Gerber, .hex"
                      className="h-9 text-sm"
                    />
                  </div>
                </div>

                {/* GitHub repo URL */}
                <div className="space-y-1.5">
                  <Label htmlFor="githubUrl" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <Github className="h-3.5 w-3.5 text-foreground" />
                    <span>Kho Lưu Trữ GitHub / GitLab (Mã nguồn mở)</span>
                  </Label>
                  <Input
                    id="githubUrl"
                    value={githubUrl}
                    onChange={(e) => setGithubUrl(e.target.value)}
                    placeholder="https://github.com/maker/esp32-project"
                    className="h-9 text-xs font-mono focus-visible:ring-emerald-500"
                  />
                </div>

                {/* License */}
                <div className="space-y-1.5">
                  <Label htmlFor="license" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Giấy Phép Bản Quyền Mở (Open Source License)
                  </Label>
                  <select
                    id="license"
                    value={licenseType}
                    onChange={(e) => setLicenseType(e.target.value)}
                    className="w-full h-9 px-3 rounded-lg border border-border bg-background text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none"
                  >
                    <option value="OPEN_SOURCE">CERN Open Hardware Licence (CERN-OHL-P)</option>
                    <option value="PERSONAL">MIT License (Tự do, phổ biến nhất)</option>
                    <option value="COMMERCIAL">Apache License 2.0 (Bảo hộ sáng chế)</option>
                    <option value="EDUCATIONAL">Creative Commons BY-SA 4.0</option>
                    <option value="PRIVATE_USE">GNU General Public License (GPL-3.0)</option>
                  </select>
                </div>

                {/* Description */}
                <div className="space-y-1.5">
                  <Label htmlFor="description" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Mô Tả Kỹ Thuật &amp; Hướng Dẫn Thi Công
                  </Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Mô tả sơ đồ nguyên lý mạch (Schematic), hướng dẫn nạp firmware, danh sách linh kiện BOM cần mua, lưu ý hàn dán SMD..."
                    rows={4}
                    className="text-sm resize-none"
                  />
                </div>
              </div>

              {/* Right Column: Visual Preview & Live Card (5 cols) */}
              <div className="lg:col-span-5 space-y-4">
                {/* Image URL & Presets */}
                <div className="space-y-2">
                  <Label htmlFor="imageUrl" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                    <span>Ảnh Đại Diện Bo Mạch</span>
                    <span className="text-[11px] font-normal text-muted-foreground">URL hình ảnh</span>
                  </Label>
                  <Input
                    id="imageUrl"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="https://... hoặc bấm ảnh mẫu bên dưới"
                    className="h-9 text-xs"
                  />
                  {/* Sample presets */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[11px] text-muted-foreground">Ảnh mẫu:</span>
                    {SAMPLE_PRESETS.map((preset) => (
                      <button
                        key={preset.name}
                        type="button"
                        onClick={() => {
                          setImageUrl(preset.url);
                          setSoftware(preset.tag.includes('KiCad') ? 'KiCad' : preset.tag.includes('ESP') ? 'ESP-IDF' : 'Altium');
                        }}
                        className="text-[11px] px-2 py-0.5 rounded-md border border-border/80 bg-muted/40 hover:bg-emerald-500/10 hover:border-emerald-500/50 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors cursor-pointer"
                      >
                        + {preset.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Live Card Preview */}
                <div className="space-y-2">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <Eye className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span>Xem Trước Thẻ Dự Án (Live Preview)</span>
                  </Label>
                  <div className="rounded-xl border border-border/80 bg-card overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                    <div className="relative aspect-video bg-muted/60 flex items-center justify-center overflow-hidden border-b border-border/60">
                      {imageUrl ? (
                        <img
                          src={imageUrl}
                          alt="Preview"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center text-muted-foreground p-4 text-center">
                          <Cpu className="h-10 w-10 text-muted-foreground/40 mb-1" />
                          <span className="text-xs">Chưa có ảnh (sẽ dùng ảnh vi mạch mẫu)</span>
                        </div>
                      )}
                      <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                        <Badge className="bg-emerald-600/90 text-white hover:bg-emerald-600 text-[10px] shadow-sm backdrop-blur-sm">
                          MÃ NGUỒN MỞ
                        </Badge>
                        <Badge variant="outline" className="bg-background/80 backdrop-blur-sm text-[10px] font-mono border-border/80">
                          {software} {currentVersion}
                        </Badge>
                      </div>
                      <div className="absolute bottom-2.5 right-2.5">
                        <Badge className="bg-background/90 text-foreground text-[10px] font-bold shadow-sm backdrop-blur-sm">
                          0 ₫ Miễn Phí
                        </Badge>
                      </div>
                    </div>

                    <div className="p-3.5 space-y-2">
                      <h4 className="font-semibold text-sm line-clamp-1 text-foreground">
                        {name.trim() || 'Tên dự án mã nguồn mở của bạn'}
                      </h4>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {shortDescription.trim() || 'Mô tả ngắn gọn về phần cứng, vi điều khiển, tính năng và mục đích của bo mạch...'}
                      </p>

                      <div className="pt-2 border-t border-border/60 flex items-center justify-between text-xs">
                        <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                          <ShieldCheck className="h-3.5 w-3.5" />
                          {licenseType === 'OPEN_SOURCE' ? 'CERN-OHL' : licenseType}
                        </span>
                        {githubUrl ? (
                          <span className="text-[11px] text-muted-foreground flex items-center gap-1 font-mono">
                            <Github className="h-3 w-3" />
                            GitHub Repo
                          </span>
                        ) : (
                          <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                            File Release (.zip)
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Community notice */}
                <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 space-y-1.5">
                  <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                    <Sparkles className="h-4 w-4 text-emerald-600" />
                    <span>Quyền lợi cộng đồng Maker</span>
                  </div>
                  <p className="text-[11px] text-emerald-800/80 dark:text-emerald-200/80 leading-relaxed">
                    Dự án của bạn sẽ xuất hiện công khai trên chuyên mục <strong>Mã Nguồn Mở CircuitHub</strong>. Kỹ sư và sinh viên có thể tải về file thiết kế, xem schematic và đóng góp cho bạn trên GitHub.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            /* Physical Hardware Product Form */
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 p-6">
              {/* Left Column: Product Info & Pricing (7 cols) */}
              <div className="lg:col-span-7 space-y-4">
                {/* Product Name */}
                <div className="space-y-1.5">
                  <Label htmlFor="phys-name" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Tên Linh Kiện / Bo Mạch <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="phys-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ví dụ: Bo Mạch Phát Triển STM32F407VET6 Black Board"
                    className="h-10 text-sm focus-visible:ring-cyan-500"
                  />
                </div>

                {/* Short Description */}
                <div className="space-y-1.5">
                  <Label htmlFor="phys-short" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                    <span>Tóm Tắt Ngắn</span>
                    <span className="text-[11px] font-normal text-muted-foreground">{shortDescription.length}/120 ký tự</span>
                  </Label>
                  <Input
                    id="phys-short"
                    value={shortDescription}
                    onChange={(e) => setShortDescription(e.target.value)}
                    placeholder="Mô tả tóm tắt tính năng chính của sản phẩm"
                    maxLength={120}
                    className="h-9 text-sm"
                  />
                </div>

                {/* Category & Brand */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="phys-category" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Danh Mục <span className="text-red-500">*</span>
                    </Label>
                    <select
                      id="phys-category"
                      value={categoryId}
                      onChange={(e) => setCategoryId(e.target.value)}
                      className="w-full h-9 px-3 rounded-lg border border-border bg-background text-sm focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 outline-none"
                    >
                      <option value="">Chọn danh mục sản phẩm...</option>
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="phys-brand" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Thương Hiệu / Nhà Sản Xuất
                    </Label>
                    <Input
                      id="phys-brand"
                      value={brand}
                      onChange={(e) => setBrand(e.target.value)}
                      placeholder="Ví dụ: STMicroelectronics, Espressif..."
                      className="h-9 text-sm"
                    />
                  </div>
                </div>

                {/* Price & Compare-at Price */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="phys-price" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Giá Bán (₫) <span className="text-red-500">*</span>
                    </Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-muted-foreground">
                        ₫
                      </span>
                      <Input
                        id="phys-price"
                        type="number"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        placeholder="120000"
                        className="pl-8 h-9 text-sm"
                      />
                    </div>
                    {price && !isNaN(parseInt(price, 10)) && (
                      <p className="text-xs font-medium text-cyan-600 dark:text-cyan-400">
                        {formatVND(parseInt(price, 10))}
                      </p>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="phys-compare" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Giá Gốc Niêm Yết (₫)
                    </Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-muted-foreground">
                        ₫
                      </span>
                      <Input
                        id="phys-compare"
                        type="number"
                        value={compareAtPrice}
                        onChange={(e) => setCompareAtPrice(e.target.value)}
                        placeholder="150000"
                        className="pl-8 h-9 text-sm"
                      />
                    </div>
                  </div>
                </div>

                {/* Stock & Unlimited */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-end">
                  <div className="space-y-1.5">
                    <Label htmlFor="phys-stock" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Số Lượng Tồn Kho
                    </Label>
                    <div className="relative">
                      <Boxes className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="phys-stock"
                        type="number"
                        value={stock}
                        onChange={(e) => setStock(e.target.value)}
                        placeholder="50"
                        className="pl-9 h-9 text-sm"
                        disabled={unlimited}
                      />
                    </div>
                  </div>
                  <label className="flex items-center gap-2 text-xs font-medium text-muted-foreground h-9 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={unlimited}
                      onChange={(e) => setUnlimited(e.target.checked)}
                      className="rounded border-border text-cyan-600 focus:ring-cyan-500"
                    />
                    <span>Không giới hạn số lượng tồn kho</span>
                  </label>
                </div>

                {/* SKU & MPN */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="phys-sku" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Mã SKU Quản Lý
                    </Label>
                    <Input
                      id="phys-sku"
                      value={sku}
                      onChange={(e) => setSku(e.target.value)}
                      placeholder="CH-STM32-407"
                      className="h-9 text-sm font-mono"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="phys-mpn" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Mã Linh Kiện Gốc (MPN)
                    </Label>
                    <Input
                      id="phys-mpn"
                      value={mpn}
                      onChange={(e) => setMpn(e.target.value)}
                      placeholder="STM32F407VET6"
                      className="h-9 text-sm font-mono"
                    />
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-1.5">
                  <Label htmlFor="phys-desc" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Mô Tả Chi Tiết Sản Phẩm
                  </Label>
                  <Textarea
                    id="phys-desc"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Thông tin chi tiết về sản phẩm, quy cách đóng gói, chính sách bảo hành, tài liệu kỹ thuật..."
                    rows={3}
                    className="text-sm resize-none"
                  />
                </div>
              </div>

              {/* Right Column: Media & PCB Specs (5 cols) */}
              <div className="lg:col-span-5 space-y-4">
                {/* Product Image */}
                <div className="space-y-2">
                  <Label htmlFor="phys-img" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                    <span>Ảnh Sản Phẩm</span>
                    <span className="text-[11px] font-normal text-muted-foreground">URL hình ảnh</span>
                  </Label>
                  <Input
                    id="phys-img"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="https://... hoặc chọn ảnh mẫu bên dưới"
                    className="h-9 text-xs"
                  />
                  {/* Sample images */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[11px] text-muted-foreground">Ảnh mẫu:</span>
                    {SAMPLE_PRESETS.map((preset) => (
                      <button
                        key={preset.name}
                        type="button"
                        onClick={() => setImageUrl(preset.url)}
                        className="text-[11px] px-2 py-0.5 rounded-md border border-border/80 bg-muted/40 hover:bg-cyan-500/10 hover:border-cyan-500/50 hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors cursor-pointer"
                      >
                        + {preset.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Image preview */}
                {imageUrl && (
                  <div className="relative aspect-video rounded-xl overflow-hidden border border-border/80 bg-muted">
                    <img
                      src={imageUrl}
                      alt="Product Preview"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                  </div>
                )}

                {/* PCB Specs (Optional) */}
                <div className="p-4 rounded-xl border border-border/80 bg-muted/20 space-y-3">
                  <div className="flex items-center gap-2 text-xs font-semibold text-cyan-700 dark:text-cyan-400">
                    <Layers className="h-4 w-4" />
                    <span>Thông Số Kỹ Thuật PCB (Nếu Có)</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5 text-xs">
                    <div className="space-y-1">
                      <Label className="text-[11px] text-muted-foreground">Số lớp (Layers)</Label>
                      <select
                        value={pcbLayers}
                        onChange={(e) => setPcbLayers(e.target.value)}
                        className="w-full h-8 px-2 rounded-md border border-border bg-background text-xs"
                      >
                        <option value="">Không áp dụng</option>
                        <option value="1">1 lớp</option>
                        <option value="2">2 lớp</option>
                        <option value="4">4 lớp</option>
                        <option value="6">6 lớp</option>
                        <option value="8">8 lớp</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-[11px] text-muted-foreground">Độ dày PCB (mm)</Label>
                      <Input
                        type="number"
                        step="0.1"
                        value={pcbThickness}
                        onChange={(e) => setPcbThickness(e.target.value)}
                        placeholder="1.6"
                        className="h-8 text-xs"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label className="text-[11px] text-muted-foreground">Vật liệu bo mạch</Label>
                      <select
                        value={pcbMaterial}
                        onChange={(e) => setPcbMaterial(e.target.value)}
                        className="w-full h-8 px-2 rounded-md border border-border bg-background text-xs"
                      >
                        <option value="FR4">FR4 tiêu chuẩn</option>
                        <option value="FR408">FR408 (Tần số cao)</option>
                        <option value="Rogers">Rogers RF</option>
                        <option value="Aluminum">Nhôm tản nhiệt (MCPCB)</option>
                        <option value="Polyimide">Polyimide (Dẻo Flex)</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-[11px] text-muted-foreground">Bề mặt mạ</Label>
                      <select
                        value={pcbSurfaceFinish}
                        onChange={(e) => setPcbSurfaceFinish(e.target.value)}
                        className="w-full h-8 px-2 rounded-md border border-border bg-background text-xs"
                      >
                        <option value="HASL">HASL chì</option>
                        <option value="HASL-RoHS">HASL không chì RoHS</option>
                        <option value="ENIG">Mạ vàng ENIG</option>
                        <option value="OSP">Màng bảo vệ OSP</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-[11px] text-muted-foreground">Màu phủ hàn</Label>
                      <select
                        value={pcbColor}
                        onChange={(e) => setPcbColor(e.target.value)}
                        className="w-full h-8 px-2 rounded-md border border-border bg-background text-xs"
                      >
                        <option value="Blue">Xanh dương (Blue)</option>
                        <option value="Green">Xanh lá (Green)</option>
                        <option value="Black">Đen nhám (Black)</option>
                        <option value="Red">Đỏ (Red)</option>
                        <option value="White">Trắng (White)</option>
                        <option value="Purple">Tím OSH Park (Purple)</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-[11px] text-muted-foreground">Kích thước</Label>
                      <Input
                        value={pcbDimensions}
                        onChange={(e) => setPcbDimensions(e.target.value)}
                        placeholder="50x80 mm"
                        className="h-8 text-xs"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Sticky Footer */}
        <DialogFooter className="px-6 py-4 border-t border-border/60 bg-muted/20 sticky bottom-0 z-10">
          <div className="flex items-center justify-between w-full">
            <Button variant="ghost" onClick={close} disabled={submitting} className="text-sm">
              Hủy bỏ
            </Button>

            <div>
              {productType === 'DIGITAL' ? (
                <Button
                  onClick={submit}
                  disabled={submitting || !name.trim()}
                  className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold shadow-md px-6 h-10 cursor-pointer"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Đang xuất bản...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Xuất Bản Dự Án Ngay (0 ₫)
                    </>
                  )}
                </Button>
              ) : (
                <Button
                  onClick={submit}
                  disabled={submitting || !name.trim() || !price || !categoryId}
                  className="bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-700 hover:to-teal-700 text-white font-semibold shadow-md px-6 h-10 cursor-pointer"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Đang lưu...
                    </>
                  ) : (
                    <>
                      <Package className="h-4 w-4 mr-2" />
                      Lưu &amp; Đăng Bán Sản Phẩm
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
