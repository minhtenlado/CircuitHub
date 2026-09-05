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
  title: "CircuitHub — Buy Electronics. Build Anything.",
  description:
    "The modern electronics marketplace for hardware creators. Buy & sell dev boards, PCB modules, electronic components, sensors, and explore free open-source KiCad projects, Gerber packages, and firmware.",
  keywords: [
    "CircuitHub",
    "electronics marketplace",
    "open source hardware",
    "KiCad 9 projects",
    "Altium",
    "Gerber files",
    "ESP32",
    "STM32",
    "Raspberry Pi",
    "electronics components",
    "sensors",
    "embedded engineering",
    "firmware",
    "open hardware",
  ],
  authors: [{ name: "CircuitHub" }],
  icons: { icon: "/favicon.png" },
  openGraph: {
    title: "CircuitHub — Buy Electronics. Build Anything.",
    description:
      "The modern electronics marketplace for hardware creators. Buy components, boards & share open-source hardware designs.",
    siteName: "CircuitHub",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "CircuitHub",
    description: "Electronics marketplace and open-source hardware community",
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
