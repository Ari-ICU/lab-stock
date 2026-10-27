'use client';

import React from 'react';
import { useStock } from '@/context/StockContext';
import { CheckCircle2 } from 'lucide-react';

export function Toast() {
  const { toast } = useStock();

  if (!toast) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 bg-neutral-900 text-white text-xs py-2.5 px-4 rounded shadow-lg flex items-center gap-2 border border-neutral-800 animate-in fade-in slide-in-from-bottom-2">
      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
      <span>{toast}</span>
    </div>
  );
}
