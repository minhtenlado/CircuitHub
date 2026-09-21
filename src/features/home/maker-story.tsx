'use client';

import { motion } from 'framer-motion';
import { Cpu, Heart, MessageSquare, Wrench, Sparkles, ArrowRight, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavStore } from '@/stores/nav-store';

export function MakerStory() {
  const goProducts = useNavStore((s) => s.goProducts);

  return (
    <section className="py-12 sm:py-16 lg:py-20 border-b border-border/50 bg-gradient-to-b from-transparent via-cyan-500/[0.02] to-transparent">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          
          {/* Left column: Authentic Maker Story */}
          <div className="lg:col-span-7 space-y-5">
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-xs font-semibold text-cyan-700 dark:text-cyan-300">
              <Sparkles className="h-3.5 w-3.5" />
              <span>CÂU CHUYỆN MAKER & CIRCUIT HUB</span>
            </div>

            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-foreground leading-tight">
              Tạo dựng bởi Maker, phục vụ cho anh em kỹ thuật & sinh viên
            </h2>

            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
              Xin chào, mình thành lập <strong>CircuitHub</strong> xuất phát từ chính nhu cầu thực tế của bản thân: khi làm các dự án IoT, robot và mạch nhúng, việc tìm kiếm linh kiện đúng thông số, bo mạch chuẩn và có người hỗ trợ lúc mạch không chạy là điều vô cùng khó khăn.
            </p>

            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
              Tại CircuitHub, đây không phải là sàn thương mại đại trà. Mọi bo mạch, cảm biến và module bạn nhận được đều do chính tay mình <strong>kiểm tra điện áp, nạp firmware mẫu và test tín hiệu ngoại vi</strong> trước khi đóng gói gửi đi.
            </p>

            {/* Maker commitments checklist */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div className="flex items-start gap-2.5 p-3 rounded-xl border border-border/60 bg-card/60">
                <CheckCircle2 className="h-4 w-4 text-cyan-600 dark:text-cyan-400 shrink-0 mt-0.5" />
                <div className="text-xs">
                  <span className="font-bold text-foreground block">Test 100% trước khi ship</span>
                  <span className="text-muted-foreground">Không lo nhận bo lỗi, tiết kiệm thời gian gỡ mạch.</span>
                </div>
              </div>

              <div className="flex items-start gap-2.5 p-3 rounded-xl border border-border/60 bg-card/60">
                <CheckCircle2 className="h-4 w-4 text-cyan-600 dark:text-cyan-400 shrink-0 mt-0.5" />
                <div className="text-xs">
                  <span className="font-bold text-foreground block">Code mẫu & sơ đồ sẵn có</span>
                  <span className="text-muted-foreground">Tài liệu, thư viện và sơ đồ chân đi kèm.</span>
                </div>
              </div>

              <div className="flex items-start gap-2.5 p-3 rounded-xl border border-border/60 bg-card/60">
                <CheckCircle2 className="h-4 w-4 text-cyan-600 dark:text-cyan-400 shrink-0 mt-0.5" />
                <div className="text-xs">
                  <span className="font-bold text-foreground block">Tư vấn trực tiếp 1-1</span>
                  <span className="text-muted-foreground">Hỗ trợ qua Zalo nếu bạn gặp khúc mắc khi đấu nối.</span>
                </div>
              </div>

              <div className="flex items-start gap-2.5 p-3 rounded-xl border border-border/60 bg-card/60">
                <CheckCircle2 className="h-4 w-4 text-cyan-600 dark:text-cyan-400 shrink-0 mt-0.5" />
                <div className="text-xs">
                  <span className="font-bold text-foreground block">Đổi mới trong 7 ngày</span>
                  <span className="text-muted-foreground">Cam kết bảo hành nhanh gọn, uy tín hàng đầu.</span>
                </div>
              </div>
            </div>

            <div className="pt-3 flex flex-wrap items-center gap-3">
              <Button
                onClick={() => goProducts()}
                className="h-10 px-5 rounded-xl bg-cyan-500 hover:bg-cyan-600 text-white font-semibold text-sm gap-2 shadow-sm cursor-pointer"
              >
                <span>Xem danh sách linh kiện</span>
                <ArrowRight className="h-4 w-4" />
              </Button>

              <a
                href="https://zalo.me"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 h-10 px-4 rounded-xl border border-cyan-500/40 text-cyan-700 dark:text-cyan-300 hover:bg-cyan-50 dark:hover:bg-cyan-950/40 text-sm font-semibold transition-colors"
              >
                <MessageSquare className="h-4 w-4" />
                <span>Nhắn Zalo cho chủ shop</span>
              </a>
            </div>
          </div>

          {/* Right column: Workshop / Lab badge card */}
          <div className="lg:col-span-5">
            <div className="relative rounded-3xl border border-border/70 bg-gradient-to-br from-card via-card to-cyan-50/20 dark:to-cyan-950/20 p-6 sm:p-8 shadow-sm space-y-6">
              <div className="flex items-center gap-3 pb-4 border-b border-border/50">
                <div className="h-12 w-12 rounded-2xl bg-cyan-500 text-white flex items-center justify-center font-black text-lg shadow-sm">
                  CH
                </div>
                <div>
                  <h3 className="font-bold text-foreground text-base">CircuitHub Workshop</h3>
                  <p className="text-xs text-muted-foreground">Gia công bo mạch & Linh kiện kỹ thuật</p>
                </div>
              </div>

              <div className="space-y-3 text-xs text-muted-foreground">
                <div className="flex items-center justify-between py-1.5 border-b border-border/40">
                  <span className="text-foreground font-medium">Chủ shop / Kỹ sư</span>
                  <span className="font-semibold text-cyan-600 dark:text-cyan-400">Maker & Hardware Engineer</span>
                </div>

                <div className="flex items-center justify-between py-1.5 border-b border-border/40">
                  <span className="text-foreground font-medium">Hình thức phục vụ</span>
                  <span>Bán lẻ linh kiện & Hỗ trợ DIY</span>
                </div>

                <div className="flex items-center justify-between py-1.5 border-b border-border/40">
                  <span className="text-foreground font-medium">Quy trình đóng gói</span>
                  <span>Túi chống tĩnh điện ESD + Hộp carton</span>
                </div>

                <div className="flex items-center justify-between py-1.5">
                  <span className="text-foreground font-medium">Vận chuyển</span>
                  <span>Giao hàng COD toàn quốc (GHTK, Viettel)</span>
                </div>
              </div>

              <div className="rounded-2xl border border-cyan-500/20 bg-cyan-50/60 dark:bg-cyan-950/40 p-4 text-xs text-cyan-950 dark:text-cyan-200 flex items-start gap-3">
                <Heart className="h-5 w-5 text-rose-500 shrink-0 mt-0.5 fill-rose-500" />
                <p className="leading-relaxed">
                  "Mỗi đơn hàng dù chỉ là 1 con trở hay bo MCU ESP32 đều được đóng gói tỉ mỉ và trân trọng. Chúc bạn làm project thành công!"
                </p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}

export default MakerStory;
