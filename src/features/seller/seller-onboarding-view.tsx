'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Store,
  CreditCard,
  ScanFace,
  MapPin,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Camera,
  CameraOff,
  Package,
  ShieldCheck,
  FileCode,
} from 'lucide-react';
import { useNavStore } from '@/stores/nav-store';
import { useAuthStore } from '@/stores/auth-store';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';

const STEPS = [
  { id: 'welcome', label: 'Bắt đầu', icon: Store },
  { id: 'id', label: 'Xác minh CCCD', icon: CreditCard },
  { id: 'biometric', label: 'eKYC Khuôn mặt', icon: ScanFace },
  { id: 'shop', label: 'Hồ sơ Gian hàng', icon: Package },
  { id: 'address', label: 'Kho lấy hàng', icon: MapPin },
  { id: 'review', label: 'Kích hoạt', icon: CheckCircle2 },
];

export function SellerOnboardingView() {
  const setView = useNavStore.getState().setView;
  const { toast } = useToast();
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  // ID verification state
  const [idFront, setIdFront] = useState<string | null>(null);
  const [idBack, setIdBack] = useState<string | null>(null);
  const [idVerifying, setIdVerifying] = useState(false);
  const [idVerified, setIdVerified] = useState(false);

  // Biometric state
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraOn, setCameraOn] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [biometricDone, setBiometricDone] = useState(false);

  // Shop info state
  const [shopName, setShopName] = useState('');
  const [shopDesc, setShopDesc] = useState('');
  const [shopCategory, setShopCategory] = useState('PCB');
  const [specializations, setSpecializations] = useState('');

  // Address state
  const [addrName, setAddrName] = useState('');
  const [addrPhone, setAddrPhone] = useState('');
  const [addrLine, setAddrLine] = useState('');
  const [addrCity, setAddrCity] = useState('');
  const [addrDistrict, setAddrDistrict] = useState('');
  const [addrWard, setAddrWard] = useState('');

  function next() { setStep(s => Math.min(s + 1, STEPS.length - 1)); }
  function prev() { setStep(s => Math.max(s - 1, 0)); }

  // File upload handler
  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>, setter: (v: string | null) => void) {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => setter(reader.result as string);
      reader.readAsDataURL(file);
    }
  }

  // ID verification
  function verifyId() {
    if (!idFront || !idBack) {
      toast({ title: 'Please upload both sides of your ID', variant: 'destructive' });
      return;
    }
    setIdVerifying(true);
    setTimeout(() => {
      setIdVerifying(false);
      setIdVerified(true);
      toast({ title: 'ID verified!', description: 'Your citizen ID has been confirmed.' });
    }, 2000);
  }

  // Camera functions
  async function startCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setCameraOn(true);
    } catch {
      toast({ title: 'Camera access denied', description: 'Please enable camera for biometric verification.', variant: 'destructive' });
    }
  }

  function stopCamera() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    setCameraOn(false);
  }

  function startBiometricScan() {
    setScanning(true);
    setScanProgress(0);
    const interval = setInterval(() => {
      setScanProgress(p => {
        if (p >= 100) {
          clearInterval(interval);
          setScanning(false);
          setBiometricDone(true);
          stopCamera();
          toast({ title: 'Biometric verification complete!', description: 'Your identity has been confirmed.' });
          return 100;
        }
        return p + 2;
      });
    }, 100);
  }

  // Cleanup camera on unmount
  useEffect(() => {
    return () => { stopCamera(); };
  }, []);

  // Cleanup camera when leaving biometric step
  useEffect(() => {
    if (step !== 2) stopCamera();
  }, [step]);

  function canProceed(): boolean {
    if (step === 1) return idVerified;
    if (step === 2) return biometricDone;
    if (step === 3) return !!shopName.trim() && !!shopDesc.trim();
    if (step === 4) return !!addrName.trim() && !!addrPhone.trim() && !!addrLine.trim() && !!addrCity.trim();
    return true;
  }

  async function submitApplication() {
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      const auth = useAuthStore.getState();
      const shopSlugGen = (shopName || 'maker-studio')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      if (auth.user) {
        auth.setAuth(
          {
            ...auth.user,
            role: 'SELLER',
            shopId: auth.user.shopId || `shop-${Date.now()}`,
            shopSlug: auth.user.shopSlug || shopSlugGen,
          },
          auth.token || `demo-token-${Date.now()}`
        );
      }
      toast({
        title: 'Kích hoạt Kênh Bán & Creator thành công!',
        description: 'Tài khoản của bạn đã được nâng cấp lên Người bán & Chia sẻ Dự án Mã nguồn mở.',
      });
      setView('seller', {});
    }, 1200);
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Step indicator */}
        <div className="flex items-center justify-between mb-8">
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            const isCurrent = i === step;
            const isPast = i < step;
            return (
              <div key={s.id} className="flex flex-col items-center gap-1.5 flex-1">
                <div
                  className={`h-10 w-10 rounded-full flex items-center justify-center border-2 transition-all ${
                    isCurrent ? 'border-cyan-500 bg-cyan-50 dark:bg-cyan-950/60 shadow-[0_4px_12px_-4px_rgba(6,182,212,0.4)]' :
                    isPast ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/60' : 'border-border bg-card'
                  }`}
                >
                  {isPast ? <CheckCircle2 className="h-5 w-5 text-emerald-500" /> : <Icon className={`h-5 w-5 ${isCurrent ? 'text-cyan-600' : 'text-slate-400'}`} />}
                </div>
                <span className={`text-[10px] font-medium hidden sm:block ${isCurrent ? 'text-cyan-700 dark:text-cyan-400' : isPast ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`}>
                  {s.label}
                </span>
              </div>
            );
          })}
        </div>

        {/* Step content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.25 }}
          >
            {/* Step 0: Welcome */}
            {step === 0 && (
              <div className="text-center py-8">
                <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-cyan-500 to-teal-400 flex items-center justify-center mx-auto mb-6 shadow-[0_8px_24px_-6px_rgba(6,182,212,0.5)]">
                  <Store className="h-10 w-10 text-white" />
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold mb-3">Thiết lập Bán hàng & Chia sẻ Mã nguồn mở</h1>
                <p className="text-muted-foreground mb-8 max-w-lg mx-auto text-sm sm:text-base leading-relaxed">
                  Gia nhập cộng đồng hơn 15.000 kỹ sư maker — Đăng bán bo mạch, linh kiện điện tử hoặc chia sẻ thiết kế phần cứng mở (KiCad, Altium, Arduino, ESP-IDF) hoàn toàn miễn phí hoặc có thu phí.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                  {[
                    { icon: Package, title: 'Bán linh kiện & bo mạch', desc: 'Đăng bán MCU, module, sensor, nhận đơn COD toàn quốc tự động' },
                    { icon: FileCode, title: 'Chia sẻ Mã nguồn mở', desc: 'Đăng tải KiCad, Altium, Gerber, firmware với giấy phép MIT / CERN-OHL' },
                    { icon: ShieldCheck, title: 'Định danh CCCD / eKYC', desc: 'Bảo vệ bản quyền sở hữu trí tuệ và nâng cao uy tín kỹ sư' },
                  ].map((b, i) => {
                    const Icon = b.icon;
                    return (
                      <div key={i} className="rounded-xl border border-border/60 bg-card p-4 text-center">
                        <Icon className="h-6 w-6 text-cyan-500 mx-auto mb-2" />
                        <p className="text-sm font-semibold">{b.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{b.desc}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Step 1: ID Verification */}
            {step === 1 && (
              <div className="py-4">
                <h2 className="text-xl font-bold mb-2">Citizen ID Verification</h2>
                <p className="text-sm text-muted-foreground mb-6">Upload both sides of your Citizen ID Card (CCCD)</p>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  {/* Front side */}
                  <div>
                    <label className="text-sm font-medium mb-2 block">Front Side</label>
                    <div
                      className="aspect-[1.6] rounded-xl border-2 border-dashed border-border/60 hover:border-cyan-400 transition-colors cursor-pointer overflow-hidden bg-slate-50/60 dark:bg-slate-900/60"
                      onClick={() => document.getElementById('id-front')?.click()}
                    >
                      {idFront ? (
                        <img src={idFront} alt="ID Front" className="w-full h-full object-cover" />
                      ) : (
                        <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                          <CreditCard className="h-8 w-8 mb-1" />
                          <span className="text-xs">Click to upload</span>
                        </div>
                      )}
                    </div>
                    <input id="id-front" type="file" accept="image/*" className="hidden" onChange={e => handleFileUpload(e, setIdFront)} />
                  </div>

                  {/* Back side */}
                  <div>
                    <label className="text-sm font-medium mb-2 block">Back Side</label>
                    <div
                      className="aspect-[1.6] rounded-xl border-2 border-dashed border-border/60 hover:border-cyan-400 transition-colors cursor-pointer overflow-hidden bg-slate-50/60 dark:bg-slate-900/60"
                      onClick={() => document.getElementById('id-back')?.click()}
                    >
                      {idBack ? (
                        <img src={idBack} alt="ID Back" className="w-full h-full object-cover" />
                      ) : (
                        <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                          <CreditCard className="h-8 w-8 mb-1" />
                          <span className="text-xs">Click to upload</span>
                        </div>
                      )}
                    </div>
                    <input id="id-back" type="file" accept="image/*" className="hidden" onChange={e => handleFileUpload(e, setIdBack)} />
                  </div>
                </div>

                {idVerified && (
                  <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50/50 p-3 mb-4">
                    <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                    <span className="text-sm font-medium text-emerald-700">ID Verified Successfully</span>
                  </div>
                )}

                <Button
                  onClick={verifyId}
                  disabled={!idFront || !idBack || idVerifying || idVerified}
                  className="w-full bg-cyan-600 hover:bg-cyan-700 text-white"
                >
                  {idVerifying ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <ShieldCheck className="h-4 w-4 mr-2" />}
                  {idVerifying ? 'Verifying ID...' : idVerified ? 'Verified' : 'Verify ID'}
                </Button>
              </div>
            )}

            {/* Step 2: Biometric Verification */}
            {step === 2 && (
              <div className="py-4">
                <h2 className="text-xl font-bold mb-2">Biometric Verification</h2>
                <p className="text-sm text-muted-foreground mb-6">Enable your camera for liveness detection — similar to bank-level verification</p>

                {!cameraOn && !biometricDone && (
                  <div className="flex flex-col items-center gap-4 py-8">
                    <div className="h-24 w-24 rounded-full bg-cyan-50 border-2 border-cyan-200 flex items-center justify-center">
                      <Camera className="h-10 w-10 text-cyan-500" />
                    </div>
                    <Button onClick={startCamera} className="bg-cyan-600 hover:bg-cyan-700 text-white">
                      <Camera className="h-4 w-4 mr-2" />
                      Enable Camera
                    </Button>
                  </div>
                )}

                {cameraOn && !biometricDone && (
                  <div className="flex flex-col items-center gap-4">
                    <div className="relative w-64 h-64 rounded-full overflow-hidden border-4 border-cyan-400 shadow-[0_0_30px_-8px_rgba(6,182,212,0.5)]">
                      <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                      {/* Scanning overlay */}
                      {scanning && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-cyan-900/30">
                          <div className="w-full px-4">
                            <div className="h-1.5 bg-cyan-900/50 rounded-full overflow-hidden">
                              <div className="h-full bg-cyan-400 rounded-full transition-all" style={{ width: `${scanProgress}%` }} />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {scanning ? (
                      <div className="text-center">
                        <p className="text-sm font-medium text-cyan-700 dark:text-cyan-400 mb-1">Scanning... {scanProgress}%</p>
                        <p className="text-xs text-muted-foreground">Keep looking at the camera</p>
                      </div>
                    ) : (
                      <div className="text-center space-y-3">
                        <div className="space-y-1 text-xs text-muted-foreground">
                          <p>Look at the camera and blink slowly</p>
                          <p>Turn your head left, then right</p>
                        </div>
                        <Button onClick={startBiometricScan} className="bg-cyan-600 hover:bg-cyan-700 text-white">
                          <ScanFace className="h-4 w-4 mr-2" />
                          Start Biometric Scan
                        </Button>
                      </div>
                    )}
                  </div>
                )}

                {biometricDone && (
                  <div className="flex flex-col items-center gap-4 py-8">
                    <div className="h-20 w-20 rounded-full bg-emerald-50 border-2 border-emerald-200 flex items-center justify-center">
                      <CheckCircle2 className="h-10 w-10 text-emerald-500" />
                    </div>
                    <p className="text-sm font-medium text-emerald-700">Biometric verification complete!</p>
                    <p className="text-xs text-muted-foreground text-center max-w-xs">
                      Your identity has been verified using facial recognition and liveness detection.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Step 3: Shop Information */}
            {step === 3 && (
              <div className="py-4 space-y-4">
                <h2 className="text-xl font-bold mb-2">Shop Information</h2>
                <p className="text-sm text-muted-foreground mb-4">Tell buyers about your shop</p>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Shop Name *</label>
                  <input value={shopName} onChange={e => setShopName(e.target.value)} placeholder="e.g. BoardForge Studio" className="w-full h-10 px-3 rounded-md border border-border/60 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100 outline-none" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Description *</label>
                  <textarea value={shopDesc} onChange={e => setShopDesc(e.target.value)} placeholder="What do you sell? What makes your shop special?" rows={3} className="w-full px-3 py-2 rounded-md border border-border/60 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100 outline-none resize-none" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Shop Category</label>
                  <select value={shopCategory} onChange={e => setShopCategory(e.target.value)} className="w-full h-10 px-3 rounded-md border border-border/60 bg-background focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100 outline-none">
                    <option>PCB</option>
                    <option>Components</option>
                    <option>Dev Boards</option>
                    <option>Services</option>
                    <option>Open Source</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Specializations (comma-separated)</label>
                  <input value={specializations} onChange={e => setSpecializations(e.target.value)} placeholder="e.g. PCB Design, ESP32, KiCad, Firmware" className="w-full h-10 px-3 rounded-md border border-border/60 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100 outline-none" />
                </div>
              </div>
            )}

            {/* Step 4: Pickup Address */}
            {step === 4 && (
              <div className="py-4 space-y-4">
                <h2 className="text-xl font-bold mb-2">Pickup Address</h2>
                <p className="text-sm text-muted-foreground mb-4">Shipping partners will pick up your products from this address</p>

                {/* Map placeholder */}
                <div className="h-32 rounded-xl bg-gradient-to-br from-cyan-50 to-teal-50 border border-cyan-100 flex items-center justify-center mb-4">
                  <div className="flex flex-col items-center text-cyan-600">
                    <MapPin className="h-6 w-6 mb-1" />
                    <span className="text-xs font-medium">Pickup location on map</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">Full Name *</label>
                    <input value={addrName} onChange={e => setAddrName(e.target.value)} className="w-full h-10 px-3 rounded-md border border-border/60 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100 outline-none" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">Phone *</label>
                    <input value={addrPhone} onChange={e => setAddrPhone(e.target.value)} placeholder="0901234567" className="w-full h-10 px-3 rounded-md border border-border/60 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100 outline-none" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Address Line *</label>
                  <input value={addrLine} onChange={e => setAddrLine(e.target.value)} placeholder="123 Nguyen Hue" className="w-full h-10 px-3 rounded-md border border-border/60 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100 outline-none" />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">City *</label>
                    <input value={addrCity} onChange={e => setAddrCity(e.target.value)} placeholder="Ho Chi Minh" className="w-full h-10 px-3 rounded-md border border-border/60 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100 outline-none" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">District</label>
                    <input value={addrDistrict} onChange={e => setAddrDistrict(e.target.value)} placeholder="District 1" className="w-full h-10 px-3 rounded-md border border-border/60 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100 outline-none" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">Ward</label>
                    <input value={addrWard} onChange={e => setAddrWard(e.target.value)} placeholder="Ben Nghe" className="w-full h-10 px-3 rounded-md border border-border/60 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100 outline-none" />
                  </div>
                </div>
              </div>
            )}

            {/* Step 5: Review */}
            {step === 5 && (
              <div className="py-4">
                <h2 className="text-xl font-bold mb-4">Review Your Application</h2>
                <div className="space-y-3 rounded-xl border border-border/60 divide-y divide-border/40">
                  <ReviewItem label="Citizen ID" value={idVerified ? 'Verified ✓' : 'Not verified'} />
                  <ReviewItem label="Biometric" value={biometricDone ? 'Verified ✓' : 'Not verified'} />
                  <ReviewItem label="Shop Name" value={shopName || '—'} />
                  <ReviewItem label="Description" value={shopDesc || '—'} />
                  <ReviewItem label="Category" value={shopCategory} />
                  <ReviewItem label="Specializations" value={specializations || '—'} />
                  <ReviewItem label="Pickup Address" value={`${addrName}, ${addrLine}, ${addrCity}`} />
                </div>
                <p className="text-xs text-muted-foreground text-center mt-4">
                  By submitting, you agree to our seller terms. Your application will be reviewed within 24 hours.
                </p>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Navigation buttons */}
        <div className="flex items-center justify-between mt-8">
          {step > 0 ? (
            <Button variant="outline" onClick={prev} disabled={submitting}>
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
          ) : (
            <Button variant="ghost" onClick={() => setView('home', {})}>
              Cancel
            </Button>
          )}

          {step < STEPS.length - 1 ? (
            <Button onClick={next} disabled={!canProceed()} className="bg-cyan-600 hover:bg-cyan-700 text-white">
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          ) : (
            <Button onClick={submitApplication} disabled={submitting} className="bg-gradient-to-r from-cyan-600 to-teal-500 hover:from-cyan-700 hover:to-teal-600 text-white">
              {submitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
              {submitting ? 'Submitting...' : 'Submit Application'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function ReviewItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between px-4 py-3">
      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</span>
      <span className="text-sm text-right">{value}</span>
    </div>
  );
}
