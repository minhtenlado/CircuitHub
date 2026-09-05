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
    "The modern engineering marketplace for hardware creators. Buy & sell PCB boards, KiCad/Altium projects, Gerber packages, electronic components, and engineering services.",
  keywords: [
    "CircuitHub",
    "PCB marketplace",
    "KiCad projects",
    "Altium",
    "Gerber files",
    "ESP32",
    "STM32",
    "Raspberry Pi",
    "electronics components",
    "embedded engineering",
    "firmware",
    "BOM",
    "engineering services",
  ],
  authors: [{ name: "CircuitHub" }],
  icons: { icon: "/logo.svg" },
  openGraph: {
    title: "CircuitHub — Buy Electronics. Build Anything.",
    description:
      "The modern engineering marketplace for hardware creators. PCB, digital designs, components & services.",
    siteName: "CircuitHub",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "CircuitHub",
    description: "Engineering marketplace for hardware creators",
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
