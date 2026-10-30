'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FlaskConical, ArrowLeft, MapPin } from 'lucide-react';

export default function NotFound() {
  const router = useRouter();

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
