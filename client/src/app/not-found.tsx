'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FlaskConical, ArrowLeft, MapPin } from 'lucide-react';
import LocationDetailsClient from './locations/[id]/LocationDetailsClient';
import StockDetailsClient from './stock/[id]/StockDetailsClient';
import AssetDetailsClient from './assets/[id]/AssetDetailsClient';
import LoanDetailsClient from './loans/[id]/LoanDetailsClient';

export default function NotFound() {
  const router = useRouter();
  const [resolvedRoute, setResolvedRoute] = useState<{
    type: 'location' | 'stock' | 'asset' | 'loan' | null;
    id: string;
  }>({ type: null, id: '' });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (typeof window === 'undefined') return;

    const path = window.location.pathname || '';

    // Check for /locations/<id>
    const locMatch = path.match(/\/locations\/([^/?#]+)/i);
    if (locMatch && locMatch[1]) {
      setResolvedRoute({ type: 'location', id: decodeURIComponent(locMatch[1]) });
      return;
    }

    // Check for /stock/<id>
    const stockMatch = path.match(/\/stock\/([^/?#]+)/i);
    if (stockMatch && stockMatch[1]) {
      setResolvedRoute({ type: 'stock', id: decodeURIComponent(stockMatch[1]) });
      return;
    }

    // Check for /assets/<id>
    const assetMatch = path.match(/\/assets\/([^/?#]+)/i);
    if (assetMatch && assetMatch[1]) {
      setResolvedRoute({ type: 'asset', id: decodeURIComponent(assetMatch[1]) });
      return;
    }

    // Check for /loans/<id>
    const loanMatch = path.match(/\/loans\/([^/?#]+)/i);
    if (loanMatch && loanMatch[1]) {
      setResolvedRoute({ type: 'loan', id: decodeURIComponent(loanMatch[1]) });
      return;
    }
  }, []);

  if (resolvedRoute.type === 'location') {
    return <LocationDetailsClient id={resolvedRoute.id} />;
  }
  if (resolvedRoute.type === 'stock') {
    return <StockDetailsClient id={resolvedRoute.id} />;
  }
  if (resolvedRoute.type === 'asset') {
    return <AssetDetailsClient id={resolvedRoute.id} />;
  }
  if (resolvedRoute.type === 'loan') {
    return <LoanDetailsClient id={resolvedRoute.id} />;
  }

  if (!mounted) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 text-neutral-400 text-xs">
        Loading...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col items-center justify-center p-6 text-neutral-900 font-sans">
      <div className="w-full max-w-md bg-white border border-neutral-200 rounded-2xl p-8 text-center shadow-sm space-y-4">
        <div className="w-12 h-12 bg-neutral-900 text-emerald-400 rounded-xl flex items-center justify-center mx-auto mb-2">
          <FlaskConical className="w-6 h-6" />
        </div>

        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 bg-neutral-100 px-2 py-0.5 rounded">
            Error 404
          </span>

          <h1 className="text-xl font-bold text-neutral-900 mt-2 mb-1">
            Page Not Found
          </h1>

          <p className="text-xs text-neutral-500 leading-relaxed">
            The laboratory facility or resource you requested could not be located or has been updated to the location-centric format.
          </p>
        </div>

        <div className="space-y-2 pt-2">
          <Link
            href="/locations"
            className="inline-flex items-center justify-center gap-2 w-full py-2.5 px-4 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-semibold rounded-lg transition-colors shadow-xs"
          >
            <MapPin className="w-3.5 h-3.5 text-emerald-400" />
            <span>View All Classrooms & Laboratories</span>
          </Link>

          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 w-full py-2 px-4 bg-white hover:bg-neutral-50 text-neutral-700 text-xs font-semibold rounded-lg border border-neutral-200 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Department Overview</span>
          </Link>
        </div>
      </div>

      <p className="text-[11px] text-neutral-400 mt-6">
        CSD Stock • Location-Centric Asset & Inventory Management
      </p>
    </div>
  );
}
