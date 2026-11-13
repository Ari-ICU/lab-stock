'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FlaskConical, ArrowLeft, MapPin } from 'lucide-react';
import LocationDetailsClient from './locations/[id]/LocationDetailsClient';
import StockDetailsClient from './stock/[id]/StockDetailsClient';
import AssetDetailsClient from './assets/[id]/AssetDetailsClient';
import LoanDetailsClient from './loans/[id]/LoanDetailsClient';
import EditAssetClient from './assets/[id]/edit/EditAssetClient';
import EditStockClient from './stock/[id]/edit/EditStockClient';
import AssetRelocateClient from './assets/[id]/relocate/AssetRelocateClient';
import LoanCheckoutWorkspace from '@/components/LoanCheckoutWorkspace';
import NewRoomItemClient from './locations/[id]/items/new/NewRoomItemClient';
import EditRoomItemClient from './locations/[id]/items/edit/EditRoomItemClient';
import RoomItemDetailsClient from './locations/[id]/items/view/RoomItemDetailsClient';
import TransferDetailsClient from './transfers/[id]/TransferDetailsClient';
import { LoadingScreen } from '@/components/LoadingScreen';

export default function NotFound() {
  const router = useRouter();
  const [resolvedRoute, setResolvedRoute] = useState<{
    type:
      | 'location'
      | 'stock'
      | 'asset'
      | 'loan'
      | 'asset-edit'
      | 'stock-edit'
      | 'asset-relocate'
      | 'loans-relocate'
      | 'asset-lend'
      | 'stock-lend'
      | 'loans-checkout'
      | 'location-item-new'
      | 'location-item-edit'
      | 'location-item-view'
      | 'maint'
      | 'maint-edit'
      | 'transfer'
      | null;
    id: string;
  }>({ type: null, id: '' });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (typeof window === 'undefined') return;

    const path = window.location.pathname || '';

    // 1. Assets sub-routes (must match before base /assets/:id)
    const assetRelocateMatch = path.match(/\/assets\/([^/?#]+)\/relocate(?:\/|$|\?|#)/i);
    if (assetRelocateMatch && assetRelocateMatch[1]) {
      setResolvedRoute({ type: 'asset-relocate', id: decodeURIComponent(assetRelocateMatch[1]) });
      return;
    }

    const assetLendMatch = path.match(/\/assets\/([^/?#]+)\/lend(?:\/|$|\?|#)/i);
    if (assetLendMatch && assetLendMatch[1]) {
      setResolvedRoute({ type: 'asset-lend', id: decodeURIComponent(assetLendMatch[1]) });
      return;
    }

    const assetEditMatch = path.match(/\/assets\/([^/?#]+)\/edit(?:\/|$|\?|#)/i);
    if (assetEditMatch && assetEditMatch[1]) {
      setResolvedRoute({ type: 'asset-edit', id: decodeURIComponent(assetEditMatch[1]) });
      return;
    }

    // 2. Stock sub-routes
    const stockLendMatch = path.match(/\/stock\/([^/?#]+)\/lend(?:\/|$|\?|#)/i);
    if (stockLendMatch && stockLendMatch[1]) {
      setResolvedRoute({ type: 'stock-lend', id: decodeURIComponent(stockLendMatch[1]) });
      return;
    }

    const stockEditMatch = path.match(/\/stock\/([^/?#]+)\/edit(?:\/|$|\?|#)/i);
    if (stockEditMatch && stockEditMatch[1]) {
      setResolvedRoute({ type: 'stock-edit', id: decodeURIComponent(stockEditMatch[1]) });
      return;
    }

    // 3. Loans sub-routes
    if (/\/loans\/relocate(?:\/|$|\?|#)/i.test(path)) {
      setResolvedRoute({ type: 'loans-relocate', id: '' });
      return;
    }

    if (/\/loans\/checkout(?:\/|$|\?|#)/i.test(path)) {
      setResolvedRoute({ type: 'loans-checkout', id: '' });
      return;
    }

    // 4. Locations sub-routes
    const locItemNewMatch = path.match(/\/locations\/([^/?#]+)\/items\/new(?:\/|$|\?|#)/i);
    if (locItemNewMatch && locItemNewMatch[1]) {
      setResolvedRoute({ type: 'location-item-new', id: decodeURIComponent(locItemNewMatch[1]) });
      return;
    }

    const locItemEditMatch = path.match(/\/locations\/([^/?#]+)\/items\/edit(?:\/|$|\?|#)/i);
    if (locItemEditMatch && locItemEditMatch[1]) {
      setResolvedRoute({ type: 'location-item-edit', id: decodeURIComponent(locItemEditMatch[1]) });
      return;
    }

    const locItemViewMatch = path.match(/\/locations\/([^/?#]+)\/items\/view(?:\/|$|\?|#)/i);
    if (locItemViewMatch && locItemViewMatch[1]) {
      setResolvedRoute({ type: 'location-item-view', id: decodeURIComponent(locItemViewMatch[1]) });
      return;
    }

    // 5. Base detail routes (evaluated after specific sub-actions)
    const locMatch = path.match(/\/locations\/([^/?#]+)(?:\/|$|\?|#)/i);
    if (locMatch && locMatch[1]) {
      setResolvedRoute({ type: 'location', id: decodeURIComponent(locMatch[1]) });
      return;
    }

    const stockMatch = path.match(/\/stock\/([^/?#]+)(?:\/|$|\?|#)/i);
    if (stockMatch && stockMatch[1]) {
      setResolvedRoute({ type: 'stock', id: decodeURIComponent(stockMatch[1]) });
      return;
    }

    const assetMatch = path.match(/\/assets\/([^/?#]+)(?:\/|$|\?|#)/i);
    if (assetMatch && assetMatch[1]) {
      setResolvedRoute({ type: 'asset', id: decodeURIComponent(assetMatch[1]) });
      return;
    }

    const loanMatch = path.match(/\/loans\/([^/?#]+)(?:\/|$|\?|#)/i);
    if (loanMatch && loanMatch[1] && loanMatch[1] !== 'checkout' && loanMatch[1] !== 'relocate') {
      setResolvedRoute({ type: 'loan', id: decodeURIComponent(loanMatch[1]) });
      return;
    }

    const transferMatch = path.match(/\/transfers\/([^/?#]+)(?:\/|$|\?|#)/i);
    if (transferMatch && transferMatch[1]) {
      setResolvedRoute({ type: 'transfer', id: decodeURIComponent(transferMatch[1]) });
      return;
    }
  }, []);

  if (resolvedRoute.type === 'asset-relocate') {
    return <AssetRelocateClient id={resolvedRoute.id} />;
  }
  if (resolvedRoute.type === 'loans-relocate') {
    return <AssetRelocateClient returnTo="/loans" />;
  }
  if (resolvedRoute.type === 'asset-lend') {
    return <LoanCheckoutWorkspace itemId={resolvedRoute.id} itemType="asset" returnTo={`/assets/${resolvedRoute.id}`} />;
  }
  if (resolvedRoute.type === 'stock-lend') {
    return <LoanCheckoutWorkspace itemId={resolvedRoute.id} itemType="stock" returnTo={`/stock/${resolvedRoute.id}`} />;
  }
  if (resolvedRoute.type === 'loans-checkout') {
    return <LoanCheckoutWorkspace returnTo="/loans" />;
  }
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
  if (resolvedRoute.type === 'asset-edit') {
    return <EditAssetClient id={resolvedRoute.id} />;
  }
  if (resolvedRoute.type === 'stock-edit') {
    return <EditStockClient id={resolvedRoute.id} />;
  }
  if (resolvedRoute.type === 'location-item-new') {
    return <NewRoomItemClient id={resolvedRoute.id} />;
  }
  if (resolvedRoute.type === 'location-item-edit') {
    return <EditRoomItemClient id={resolvedRoute.id} />;
  }
  if (resolvedRoute.type === 'location-item-view') {
    return <RoomItemDetailsClient id={resolvedRoute.id} />;
  }
  if (resolvedRoute.type === 'transfer') {
    return <TransferDetailsClient id={resolvedRoute.id} />;
  }

  if (!mounted) {
    return <LoadingScreen message="Loading laboratory workspace..." />;
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
            className="inline-flex items-center justify-center gap-2 w-full py-2.5 px-4 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-semibold rounded-xl transition-colors shadow-xs"
          >
            <MapPin className="w-3.5 h-3.5 text-emerald-400" />
            <span>View All Classrooms & Laboratories</span>
          </Link>

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
        CSD Stock • Location-Centric Asset & Inventory Management
      </p>
    </div>
  );
}
