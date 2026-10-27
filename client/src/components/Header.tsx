'use client';

import React from 'react';
import { Plus, Download, Menu } from 'lucide-react';
import { useStock } from '@/context/StockContext';

interface HeaderProps {
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
  onExport?: () => void;
  showExport?: boolean;
}

export function Header({
  title,
  subtitle = 'Engineering Block A',
  actionLabel = 'New Entry',
  onAction,
  onExport,
  showExport = true,
}: HeaderProps) {
  const { toggleMobileSidebar } = useStock();

  return (
    <header className="h-16 bg-white border-b border-neutral-200 px-4 sm:px-8 flex items-center justify-between shrink-0 gap-3">
      <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
        {/* Mobile Hamburger Toggle */}
        <button
          onClick={toggleMobileSidebar}
          className="lg:hidden p-1.5 -ml-1 text-neutral-600 hover:text-neutral-900 rounded hover:bg-neutral-100 transition-colors"
          title="Open Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <h1 className="text-sm sm:text-base font-bold text-neutral-900 truncate">{title}</h1>
        <span className="text-neutral-300 hidden sm:inline">/</span>
        <span className="text-xs text-neutral-500 font-medium hidden sm:inline truncate">{subtitle}</span>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {showExport && (
          <button
            onClick={onExport}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-medium text-neutral-700 bg-white border border-neutral-200 rounded hover:bg-neutral-50 transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-neutral-500" />
            <span className="hidden sm:inline">Export</span>
          </button>
        )}
        <button
          onClick={onAction}
          className="flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 text-xs font-semibold text-white bg-neutral-900 rounded hover:bg-neutral-800 transition-colors cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>{actionLabel}</span>
        </button>
      </div>
    </header>
  );
}
