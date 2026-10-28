import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { StockProvider } from "@/context/StockContext";
import { AppShell } from "@/components/AppShell";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "NetLab Stock - Network Laboratory Inventory & Assets",
  description: "Network lab stock, Cisco switches, fiber optics, cables, and rack asset management.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body
        suppressHydrationWarning
        className="h-full flex overflow-hidden bg-neutral-100 text-neutral-900 font-sans"
      >
        <AuthProvider>
          <StockProvider>
            <AppShell>{children}</AppShell>
          </StockProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
