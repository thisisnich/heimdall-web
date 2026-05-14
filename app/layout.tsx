import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Heimdall",
  description: "Your personal AI — always watching",
  manifest: "/manifest.json",
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "Heimdall" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0a0a0a",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  console.log("[RootLayout] Rendering RootLayout");
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`} style={{ height: "100%" }} suppressHydrationWarning>
      <body className="h-full bg-zinc-950 text-zinc-100">{children}</body>
    </html>
  );
}
