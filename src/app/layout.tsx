import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";
import { QueryProvider } from "@/lib/query-provider";
import { ThemeProvider } from "@/lib/theme-provider";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "CircuitHub — Cửa Hàng Linh Kiện & Dự Án Maker Cá Nhân",
  description:
    "Cửa hàng cung cấp vi điều khiển ESP32, STM32, module cảm biến, mạch nguồn và kit điện tử tự phát triển. Kiểm tra kỹ thuật 100% trước khi giao, hỗ trợ kỹ thuật 1-1 tận tình.",
  keywords: [
    "CircuitHub",
    "linh kiện điện tử",
    "ESP32",
    "STM32",
    "Arduino",
    "cảm biến IoT",
    "bo mạch phát triển",
    "mạch nguồn",
    "DIY electronics",
    "maker Vietnam",
  ],
  authors: [{ name: "CircuitHub" }],
  icons: { icon: "/favicon.png" },
  openGraph: {
    title: "CircuitHub — Cửa Hàng Linh Kiện & Dự Án Maker Cá Nhân",
    description:
      "Cửa hàng linh kiện điện tử, vi điều khiển ESP32, STM32, module cảm biến đã kiểm tra kỹ thuật 100%. Giao hàng COD toàn quốc.",
    siteName: "CircuitHub",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "CircuitHub — Cửa Hàng Linh Kiện & Dự Án Maker Cá Nhân",
    description: "Cửa hàng linh kiện điện tử & bo mạch IoT cho Maker và Kỹ sư",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${jetbrains.variable} font-sans antialiased bg-background text-foreground`}
      >
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          <QueryProvider>
            {children}
            <Toaster />
            <SonnerToaster position="top-right" richColors closeButton />
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
