import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/Sidebar";
import { StockProvider } from "@/context/StockContext";
import { QRScannerModal } from "@/components/QRScannerModal";
import { AddEntityModal } from "@/components/AddEntityModal";
import { ItemDetailsModal } from "@/components/ItemDetailsModal";
import { EditEntityModal } from "@/components/EditEntityModal";
import { Toast } from "@/components/Toast";

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
        <StockProvider>
          <Sidebar />
          <main className="flex-1 flex flex-col min-w-0 bg-neutral-50 overflow-hidden">
            {children}
          </main>
          <QRScannerModal />
          <AddEntityModal />
          <ItemDetailsModal />
          <EditEntityModal />
          <Toast />
        </StockProvider>
      </body>
    </html>
  );
}
