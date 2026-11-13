'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Header } from '@/components/Header';
import { useStock } from '@/context/StockContext';
import { LoadingScreen } from '@/components/LoadingScreen';
import { LabThumbnail } from '@/components/LabThumbnail';
import {
  ArrowLeft,
  ArrowRight,
  ArrowLeftRight,
  Copy,
  Check,
  Calendar,
  MapPin,
  ShieldCheck,
  CheckCircle2,
  FileText,
  ExternalLink,
  Laptop,
  User,
  AlertTriangle,
  Building,
} from 'lucide-react';

function formatTransferDate(value?: string | null): string {
  if (!value) return '—';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value.slice(0, 10);
  }
  return parsed.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export default function TransferDetailsClient({ id: propId }: { id?: string }) {
  const params = useParams();
  const router = useRouter();
  const id = propId || (params?.id as string);

  const { transfers, assets, locations, isLoading, showToast } = useStock();
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const transfer =
    transfers.find((t) => t.id === id || String(t.id).toLowerCase() === (id || '').toLowerCase()) ||
    (id && transfers.length > 0 ? transfers[0] : undefined);

  const asset = assets.find(
    (a) =>
      a.id === transfer?.assetId ||
      a.serialNumber === transfer?.serialNumber ||
      a.name.toLowerCase() === (transfer?.assetName || '').toLowerCase()
  );

  const originLocation = locations.find(
    (l) =>
      transfer?.fromLocation &&
      (transfer.fromLocation.toLowerCase().includes(l.room.toLowerCase()) ||
        transfer.fromLocation.toLowerCase().includes(l.name.toLowerCase()))
  );

  const targetLocation = locations.find(
    (l) =>
      transfer?.toLocation &&
      (transfer.toLocation.toLowerCase().includes(l.room.toLowerCase()) ||
        transfer.toLocation.toLowerCase().includes(l.name.toLowerCase()))
  );

  const copyToClipboard = (text: string, label: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    showToast(`Copied ${label} to clipboard`, 'success');
    setTimeout(() => setCopiedKey(null), 2000);
  };

  if (!transfer && isLoading) {
    return <LoadingScreen message="Loading equipment relocation log..." />;
  }

  if (!transfer) {
    return (
      <div className="flex-1 flex flex-col min-w-0">
        <Header
          title="Relocation Record Not Found"
          subtitle="Equipment Movement Directory"
          showExport={false}
          actionLabel="All Relocations"
          onAction={() => router.push('/loans?tab=transfers')}
        />
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="bg-white border border-neutral-200 rounded-2xl p-8 max-w-md w-full text-center space-y-4 shadow-sm">
            <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h2 className="text-base font-bold text-neutral-900">Relocation Record Not Found</h2>
            <p className="text-xs text-neutral-500 leading-relaxed">
              The relocation log with ID <span className="font-mono font-semibold text-neutral-800">{id}</span> does not exist or has been archived.
            </p>
            <Link
              href="/loans?tab=transfers"
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-neutral-900 rounded-lg hover:bg-neutral-800 transition-colors shadow-2xs"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Relocation Logs</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
      {/* Top Header */}
      <Header
        title="Equipment Relocation Log"
        subtitle={`${transfer.assetName} • SN: ${transfer.serialNumber} • Movement Date: ${formatTransferDate(transfer.transferDate)}`}
        backHref="/loans?tab=transfers"
        backLabel="Relocation Logs"
        actionLabel={asset ? 'Inspect Asset Dossier' : undefined}
        onAction={asset ? () => router.push(`/assets/${asset.id}`) : undefined}
      />

      <div className="flex-1 overflow-y-auto p-4 sm:p-8 w-full space-y-6">
        {/* 1. Hero Relocation Overview Strip */}
        <div className="bg-white border border-neutral-200/80 rounded-2xl p-5 sm:p-6 shadow-2xs space-y-5">
          <div className="flex items-center justify-between flex-wrap gap-3 pb-4 border-b border-neutral-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center shrink-0">
                <ArrowLeftRight className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    <span>Completed Relocation</span>
                  </span>
                </div>
                <h1 className="text-lg font-bold text-neutral-900 mt-1">
                  {transfer.assetName}
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => copyToClipboard(transfer.serialNumber, 'Serial Number', 'top-sn')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-medium text-neutral-700 bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 rounded-lg transition-colors cursor-pointer"
              >
                <span>SN: {transfer.serialNumber}</span>
                {copiedKey === 'top-sn' ? (
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                ) : (
                  <Copy className="w-3.5 h-3.5 text-neutral-400" />
                )}
              </button>
            </div>
          </div>

          {/* Transfer Route Visual Card */}
          <div className="grid grid-cols-1 md:grid-cols-11 gap-3 items-center">
            {/* Origin Card */}
            <div className="md:col-span-5 bg-neutral-50/80 border border-neutral-200 rounded-xl p-4 space-y-2">
              <span className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider block">
                Origin Room / Source Facility
              </span>
              <div className="text-sm font-bold text-neutral-900 flex items-center gap-2">
                <Building className="w-4 h-4 text-neutral-500 shrink-0" />
                <span>{transfer.fromLocation}</span>
              </div>
              {originLocation ? (
                <Link
                  href={`/locations/${originLocation.id}`}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:text-blue-700"
                >
                  <span>View Origin Classroom ({originLocation.room})</span>
                  <ExternalLink className="w-3 h-3" />
                </Link>
              ) : (
                <span className="text-[11px] text-neutral-400">Previous station</span>
              )}
            </div>

            {/* Transfer Arrow Indicator */}
            <div className="md:col-span-1 flex items-center justify-center py-2 md:py-0">
              <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-xs">
                <ArrowRight className="w-5 h-5" />
              </div>
            </div>

            {/* Target Card */}
            <div className="md:col-span-5 bg-emerald-50/50 border border-emerald-200 rounded-xl p-4 space-y-2">
              <span className="text-[10px] uppercase font-bold text-emerald-600 tracking-wider block">
                Target Room / New Lab Station
              </span>
              <div className="text-sm font-bold text-emerald-950 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{transfer.toLocation}</span>
              </div>
              {targetLocation ? (
                <Link
                  href={`/locations/${targetLocation.id}`}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 hover:text-emerald-800"
                >
                  <span>View Current Facility Roster ({targetLocation.room})</span>
                  <ExternalLink className="w-3 h-3" />
                </Link>
              ) : (
                <span className="text-[11px] text-emerald-600">Active placement</span>
              )}
            </div>
          </div>
        </div>

        {/* 2. Detailed Metadata Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Equipment Asset Specifications */}
          <div className="bg-white border border-neutral-200/80 rounded-2xl p-5 sm:p-6 shadow-2xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
              <h2 className="text-xs font-bold text-neutral-900 uppercase tracking-wider flex items-center gap-2">
                <Laptop className="w-4 h-4 text-neutral-700" />
                <span>Relocated Equipment Details</span>
              </h2>
              {asset && (
                <Link
                  href={`/assets/${asset.id}`}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-700 inline-flex items-center gap-1"
                >
                  <span>Asset Profile</span>
                  <ExternalLink className="w-3 h-3" />
                </Link>
              )}
            </div>

            {asset?.imageUrl && (
              <div className="w-full h-44 bg-neutral-100 rounded-xl overflow-hidden border border-neutral-200">
                <LabThumbnail
                  src={asset.imageUrl}
                  alt={transfer.assetName}
                  size="card"
                  className="w-full h-full object-cover"
                  iconClassName="w-8 h-8 text-neutral-400"
                />
              </div>
            )}

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between py-1.5 border-b border-neutral-100">
                <span className="text-neutral-500">Equipment Name</span>
                <span className="font-bold text-neutral-900 text-right">{transfer.assetName}</span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-neutral-100">
                <span className="text-neutral-500">Serial Tag / Asset Code</span>
                <span className="font-mono font-semibold text-neutral-800">{transfer.serialNumber}</span>
              </div>
              {asset?.model && (
                <div className="flex items-center justify-between py-1.5 border-b border-neutral-100">
                  <span className="text-neutral-500">Model / Hardware Build</span>
                  <span className="font-mono text-neutral-800 text-right">{asset.model}</span>
                </div>
              )}
              {asset?.unitType && (
                <div className="flex items-center justify-between py-1.5 border-b border-neutral-100">
                  <span className="text-neutral-500">Unit Type</span>
                  <span className="text-neutral-800 font-medium">{asset.unitType}</span>
                </div>
              )}
              <div className="flex items-center justify-between py-1.5">
                <span className="text-neutral-500">Current Assigned Location</span>
                <span className="font-bold text-emerald-700">{transfer.toLocation}</span>
              </div>
            </div>
          </div>

          {/* Audit, Personnel & Justification */}
          <div className="bg-white border border-neutral-200/80 rounded-2xl p-5 sm:p-6 shadow-2xs space-y-4">
            <div className="pb-3 border-b border-neutral-100">
              <h2 className="text-xs font-bold text-neutral-900 uppercase tracking-wider flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Audit & Custody Authorization</span>
              </h2>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between py-1.5 border-b border-neutral-100">
                <span className="text-neutral-500 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-neutral-400" />
                  <span>Movement Date</span>
                </span>
                <span className="font-mono font-bold text-neutral-900">{formatTransferDate(transfer.transferDate)}</span>
              </div>

              <div className="flex items-center justify-between py-1.5 border-b border-neutral-100">
                <span className="text-neutral-500 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-neutral-400" />
                  <span>Authorized Operator</span>
                </span>
                <span className="font-bold text-neutral-900">{transfer.transferredBy}</span>
              </div>

              <div className="flex items-center justify-between py-1.5 border-b border-neutral-100">
                <span className="text-neutral-500">Movement Verification</span>
                <span className="font-semibold text-emerald-700">Verified & Logged</span>
              </div>
            </div>

            {/* Justification Box */}
            <div className="pt-2 space-y-2">
              <label className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-neutral-400" />
                <span>Relocation Justification</span>
              </label>
              <div className="p-3.5 rounded-xl bg-neutral-50 border border-neutral-200 text-xs text-neutral-700 leading-relaxed">
                {transfer.reason ? (
                  transfer.reason
                ) : (
                  <span className="text-neutral-400 italic">No relocation notes recorded.</span>
                )}
              </div>
            </div>

            {/* Actions strip */}
            <div className="pt-3 border-t border-neutral-100 flex items-center gap-2">
              <Link
                href="/loans?tab=transfers"
                className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-semibold text-neutral-700 bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>All Relocation Logs</span>
              </Link>
              {asset && (
                <Link
                  href={`/assets/${asset.id}/relocate`}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-semibold text-white bg-neutral-900 hover:bg-neutral-800 rounded-lg transition-colors shadow-2xs"
                >
                  <ArrowLeftRight className="w-3.5 h-3.5" />
                  <span>New Relocation</span>
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
