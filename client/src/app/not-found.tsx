import Link from 'next/link';
import { FlaskConical, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col items-center justify-center p-6 text-neutral-900 font-sans">
      <div className="w-full max-w-md bg-white border border-neutral-200 rounded p-8 text-center">
        <div className="w-12 h-12 bg-neutral-900 text-emerald-400 rounded flex items-center justify-center mx-auto mb-4">
          <FlaskConical className="w-6 h-6" />
        </div>

        <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
          Error 404
        </span>

        <h1 className="text-xl font-bold text-neutral-900 mt-1 mb-2">
          Page Not Found
        </h1>

        <p className="text-xs text-neutral-500 mb-6 leading-relaxed">
          The laboratory page or resource you are looking for does not exist or has been relocated.
        </p>

        <Link
          href="/"
          className="inline-flex items-center justify-center gap-2 w-full py-2.5 px-4 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-semibold rounded transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Inventory</span>
        </Link>
      </div>

      <p className="text-[11px] text-neutral-400 mt-6">
        LabStock Inventory & Asset Management
      </p>
    </div>
  );
}
