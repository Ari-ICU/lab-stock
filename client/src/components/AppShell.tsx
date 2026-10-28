'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { Sidebar } from '@/components/Sidebar';
import { QRScannerModal } from '@/components/QRScannerModal';
import { GlobalSearchModal } from '@/components/GlobalSearchModal';
import { AddEntityModal } from '@/components/AddEntityModal';
import { ItemDetailsModal } from '@/components/ItemDetailsModal';
import { EditEntityModal } from '@/components/EditEntityModal';
import { Toast } from '@/components/Toast';

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLoginPage = pathname === '/login' || pathname?.startsWith('/login/');

  if (isLoginPage) {
    return (
      <div className="min-h-screen w-full flex flex-col bg-[#f8fafc] text-slate-900 font-sans">
        <main className="flex-1 flex flex-col min-h-0">
          {children}
        </main>
        <Toast />
      </div>
    );
  }

  return (
    <div className="h-full flex overflow-hidden bg-neutral-100 text-neutral-900 font-sans w-full">
      <Sidebar />
      <main className="flex-1 flex flex-col min-w-0 bg-neutral-50 overflow-hidden">
        {children}
      </main>
      <QRScannerModal />
      <GlobalSearchModal />
      <AddEntityModal />
      <ItemDetailsModal />
      <EditEntityModal />
      <Toast />
    </div>
  );
}
