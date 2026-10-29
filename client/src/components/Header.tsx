'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Plus, Download, Menu, ArrowLeft, Check } from 'lucide-react';
import { useStock } from '@/context/StockContext';

interface HeaderProps {
  title: string;
  subtitle?: string;
  backHref?: string;
  backLabel?: string;
  actionLabel?: string;
  onAction?: () => void;
  onExport?: () => void;
  showExport?: boolean;
  showAction?: boolean;
  actions?: React.ReactNode;
}

export function Header({
  title,
  subtitle = 'Engineering Block A',
  backHref,
  backLabel = 'Back',
  actionLabel = 'New Entry',
  onAction,
  onExport,
  showExport = true,
  showAction = true,
  actions,
}: HeaderProps) {
  const { toggleMobileSidebar } = useStock();
  const [isExporting, setIsExporting] = useState(false);

  const handleExportClick = () => {
    if (!onExport) return;
    setIsExporting(true);
    try {
      onExport();
    } finally {
      setTimeout(() => setIsExporting(false), 1200);
    }
  };

  return (
    <header className="h-16 bg-white border-b border-neutral-200 px-3 sm:px-8 flex items-center justify-between shrink-0 gap-2 sm:gap-3">
      <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
        {/* Mobile Hamburger Toggle */}
        <button
          onClick={toggleMobileSidebar}
          className="lg:hidden p-1.5 -ml-1 text-neutral-600 hover:text-neutral-900 rounded hover:bg-neutral-100 transition-colors shrink-0"
          title="Open Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {backHref ? (
          <div className="flex items-center gap-1.5 sm:gap-3 min-w-0 truncate">
            <Link
              href={backHref}
              className="text-xs sm:text-base font-bold text-neutral-500 hover:text-neutral-900 transition-colors flex items-center gap-1 shrink-0 group"
              title={`Back to ${backLabel}`}
            >
              <ArrowLeft className="w-4 h-4 text-neutral-400 group-hover:text-neutral-900 transition-colors" />
              <span className="hidden xs:inline sm:inline">{backLabel}</span>
            </Link>
            <span className="text-neutral-300">/</span>
            <h1 className="text-xs sm:text-base font-bold text-neutral-900 truncate">{title}</h1>
            {subtitle && (
              <>
                <span className="text-neutral-300 hidden sm:inline">/</span>
                <span className="text-xs text-neutral-500 font-medium hidden sm:inline truncate">{subtitle}</span>
              </>
            )}
          </div>
        ) : (
          <div className="min-w-0">
            <h1 className="text-xs sm:text-base font-bold text-neutral-900 truncate">{title}</h1>
            {subtitle && (
              <span className="text-xs text-neutral-500 font-medium hidden md:inline truncate ml-2">
                / {subtitle}
              </span>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        {actions}

        {showExport && onExport && (
          <button
            type="button"
            onClick={handleExportClick}
            disabled={isExporting}
            className="group flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-semibold text-neutral-700 hover:text-neutral-900 bg-white hover:bg-neutral-50 active:bg-neutral-100 border border-neutral-200 hover:border-neutral-300 rounded shadow-2xs hover:shadow-xs active:scale-[0.98] transition-all cursor-pointer"
            title="Download formatted CSV dataset"
          >
            {isExporting ? (
              <Check className="w-3.5 h-3.5 text-emerald-600 animate-in zoom-in duration-150" />
            ) : (
              <Download className="w-3.5 h-3.5 text-neutral-500 group-hover:text-neutral-900 group-hover:translate-y-0.5 transition-all" />
            )}
            <span className="hidden sm:inline">{isExporting ? 'Exported!' : 'Export'}</span>
            <span className="font-mono text-[9px] uppercase font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 transition-colors">
              XLSX
            </span>
          </button>
        )}

        {showAction && onAction && !actions && (
          <button
            onClick={onAction}
            className="flex items-center gap-1.5 px-2.5 sm:px-3.5 py-1.5 text-xs font-semibold text-white bg-neutral-900 rounded hover:bg-neutral-800 transition-colors cursor-pointer shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{actionLabel}</span>
            <span className="sm:hidden">{actionLabel.split(' ')[0]}</span>
          </button>
        )}
      </div>
    </header>
  );
}
