'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, RefreshCw, ArrowLeft } from 'lucide-react';

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') {
      console.error('Unhandled workspace error:', error);
    }
  }, [error]);

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col items-center justify-center p-6 text-neutral-900 font-sans">
      <div className="w-full max-w-md bg-white border border-neutral-200 rounded-2xl p-8 text-center shadow-sm space-y-5">
        <div className="w-12 h-12 bg-rose-50 border border-rose-200 text-rose-600 rounded-xl flex items-center justify-center mx-auto">
          <AlertTriangle className="w-6 h-6" />
        </div>

        <div>
          <span className="inline-block text-[10px] font-bold uppercase tracking-wider text-rose-700 bg-rose-50 border border-rose-200 px-2.5 py-0.5 rounded font-mono">
            Application Error
          </span>

          <h1 className="text-xl font-bold text-neutral-900 mt-2.5 mb-1.5 tracking-tight">
            Something went wrong
          </h1>

          <p className="text-xs text-neutral-500 leading-relaxed">
            An unexpected error interrupted this page. Your saved laboratory inventory data has not been lost.
          </p>

          {error?.digest && (
            <p className="mt-2 text-[11px] font-mono text-neutral-400">
              Reference ID: {error.digest}
            </p>
          )}
        </div>

        <div className="space-y-2 pt-1">
          <button
            type="button"
            onClick={reset}
            className="inline-flex items-center justify-center gap-2 w-full py-2.5 px-4 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-semibold rounded-xl transition-colors shadow-xs cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5 text-emerald-400" />
            <span>Try Again</span>
          </button>

          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 w-full py-2 px-4 bg-white hover:bg-neutral-50 text-neutral-700 text-xs font-semibold rounded-xl border border-neutral-200 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Department Overview</span>
          </Link>
        </div>
      </div>

      <p className="text-[11px] text-neutral-400 mt-6">
        CSD Stock • Faculty of Science Laboratory Management System
      </p>
    </div>
  );
}

