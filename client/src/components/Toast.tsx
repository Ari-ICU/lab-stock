'use client';

import React from 'react';
import { useStock } from '@/context/StockContext';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';

export function Toast() {
  const { toast, closeToast } = useStock();

  if (!toast) return null;

  const renderIcon = () => {
    switch (toast.type) {
      case 'error':
        return (
          <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 border border-rose-200/70 flex items-center justify-center shrink-0">
            <AlertCircle className="w-4 h-4" />
          </div>
        );
      case 'warning':
        return (
          <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 border border-amber-200/70 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-4 h-4" />
          </div>
        );
      case 'info':
        return (
          <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 border border-blue-200/70 flex items-center justify-center shrink-0">
            <Info className="w-4 h-4" />
          </div>
        );
      case 'success':
      default:
        return (
          <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-200/70 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        );
    }
  };

  const getAccentBorder = () => {
    switch (toast.type) {
      case 'error':
        return 'border-l-rose-500';
      case 'warning':
        return 'border-l-amber-500';
      case 'info':
        return 'border-l-blue-500';
      case 'success':
      default:
        return 'border-l-emerald-500';
    }
  };

  return (
    <aside
      key={toast.id}
      role="status"
      aria-live="polite"
      className="fixed top-4 right-4 sm:top-5 sm:right-6 z-[9999] max-w-sm w-[calc(100vw-2rem)] sm:w-auto min-w-[290px] pointer-events-auto transition-all duration-200 ease-out animate-in fade-in slide-in-from-top-3"
    >
      <div
        className={`bg-white/95 backdrop-blur-md border border-neutral-200/90 ${getAccentBorder()} border-l-4 rounded-xl p-3 sm:p-3.5 shadow-[0_12px_28px_-6px_rgba(0,0,0,0.12),0_4px_8px_-2px_rgba(0,0,0,0.04)] flex items-start gap-3`}
      >
        {renderIcon()}

        <div className="flex-1 min-w-0 pt-0.5">
          {toast.title ? (
            <>
              <p className="text-xs font-semibold text-neutral-900 leading-snug">
                {toast.title}
              </p>
              <p className="text-[11px] text-neutral-500 mt-0.5 leading-relaxed break-words">
                {toast.message}
              </p>
            </>
          ) : (
            <p className="text-xs font-medium text-neutral-800 leading-snug break-words">
              {toast.message}
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={closeToast}
          className="text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 p-1 rounded-md transition-colors shrink-0 -mr-1 -mt-0.5 cursor-pointer"
          title="Dismiss notification"
          aria-label="Dismiss notification"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </aside>
  );
}
