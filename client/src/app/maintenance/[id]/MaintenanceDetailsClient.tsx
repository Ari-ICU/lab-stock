'use client';

import React, { useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Header } from '@/components/Header';
import { useStock } from '@/context/StockContext';
import { useAuth } from '@/context/AuthContext';
import { LabThumbnail } from '@/components/LabThumbnail';
import { exportToCsv } from '@/lib/exportCsv';
import {
  ArrowLeft,
  Edit3,
  Trash2,
  Copy,
  Check,
  Calendar,
  MapPin,
  Tag,
  Wrench,
  CheckCircle2,
  Clock,
  AlertTriangle,
  DollarSign,
  User,
  Layers,
  FileSpreadsheet,
  ExternalLink,
  Laptop,
  Boxes,
} from 'lucide-react';
import { resolveMaintenanceImage } from '../shared';

export default function MaintenanceDetailsClient({ id: propId }: { id?: string }) {
  const params = useParams();
  const router = useRouter();
  const id = propId || (params?.id as string);

  const { maintenance, assets, stock, updateMaintenance, deleteMaintenance, showToast } = useStock();
  const { user } = useAuth();

  const [copied, setCopied] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const item = maintenance.find((m) => m.id === id || String(m.id) === String(id));

  // Find linked hardware asset or stock item if matching
  const matchedAsset = useMemo(() => {
    if (!item) return undefined;
    return assets.find(
      (a) =>
        a.serialNumber.toLowerCase() === item.serialNumber.toLowerCase() ||
        a.name.toLowerCase() === item.assetName.toLowerCase() ||
        item.assetName.toLowerCase().includes(a.name.toLowerCase())
    );
  }, [item, assets]);

  const matchedStock = useMemo(() => {
    if (!item) return undefined;
    return stock.find(
      (s) =>
        s.code.toLowerCase() === item.serialNumber.toLowerCase() ||
        s.name.toLowerCase() === item.assetName.toLowerCase() ||
        item.assetName.toLowerCase().includes(s.name.toLowerCase())
    );
  }, [item, stock]);

  const displayImage = item ? resolveMaintenanceImage(item, assets, stock) : '';

  if (!item) {
    return (
      <div className="flex-1 flex flex-col min-w-0">
        <Header
          title="Maintenance Log Not Found"
          subtitle="Maintenance & Audits"
          showExport={false}
          actionLabel="All Maintenance Logs"
          onAction={() => router.push('/maintenance')}
        />
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="bg-white border border-neutral-200 rounded-lg p-8 max-w-md w-full text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-neutral-100 flex items-center justify-center mx-auto text-neutral-500">
              <AlertTriangle className="w-6 h-6 text-amber-600" />
            </div>
            <h2 className="text-base font-bold text-neutral-900">Service Record Not Found</h2>
            <p className="text-xs text-neutral-500">
              The maintenance log with ID <span className="font-mono font-semibold text-neutral-800">{id}</span> does not exist or has been deleted.
            </p>
            <Link
              href="/maintenance"
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-neutral-900 rounded hover:bg-neutral-800 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Return to Maintenance List
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const handleCopySerial = () => {
    navigator.clipboard.writeText(item.serialNumber);
    setCopied(true);
    showToast(`Copied serial tag ${item.serialNumber} to clipboard`);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDelete = () => {
    deleteMaintenance(item.id);
    showToast(`Deleted maintenance record for ${item.assetName}`);
    router.push('/maintenance');
  };

  const handleStatusChange = (newStatus: 'Completed' | 'In Progress' | 'Pending') => {
    updateMaintenance({
      ...item,
      status: newStatus,
    });
    showToast(`Marked ${item.assetName} service as ${newStatus}`);
  };

  const handleExportSingle = () => {
    exportToCsv(`maintenance_log_${item.serialNumber}`, [
      {
        'Log ID': item.id,
        'Equipment Name': item.assetName,
        'Serial / Tag': item.serialNumber,
        'Service Type': item.type,
        'Service Date': item.date,
        Technician: item.technician,
        Status: item.status,
        Location: item.location || matchedAsset?.location || matchedStock?.location || 'N/A',
        Cost: item.cost || 'N/A',
        Notes: item.notes,
      },
    ]);
  };

  const statusBadge = {
    Completed: {
      text: 'Completed',
      badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      dotClass: 'bg-emerald-500',
    },
    'In Progress': {
      text: 'In Progress',
      badgeClass: 'bg-blue-50 text-blue-700 border-blue-200',
      dotClass: 'bg-blue-500',
    },
    Pending: {
      text: 'Pending',
      badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
      dotClass: 'bg-amber-500',
    },
  }[item.status] || {
    text: item.status,
    badgeClass: 'bg-neutral-100 text-neutral-700 border-neutral-200',
    dotClass: 'bg-neutral-400',
  };

  return (
    <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-neutral-50/50">
      <Header
        title={item.assetName}
        subtitle={`Serial: ${item.serialNumber} • ${item.type} • ${item.date}`}
        backHref="/maintenance"
        backLabel="Maintenance Logs"
        showExport={false}
        actions={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExportSingle}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-neutral-200 hover:bg-neutral-50 text-neutral-800 rounded text-xs font-semibold transition-colors shadow-2xs cursor-pointer"
              title="Export as CSV"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span className="hidden sm:inline">Export</span>
            </button>

            <Link
              href={`/maintenance/${item.id}/edit`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-neutral-200 hover:bg-neutral-50 text-neutral-800 rounded text-xs font-semibold transition-colors shadow-2xs"
            >
              <Edit3 className="w-3.5 h-3.5 text-neutral-600" />
              <span>Edit Log</span>
            </Link>

            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-white border border-neutral-200 hover:border-rose-300 hover:bg-rose-50 text-rose-700 rounded text-xs font-medium transition-colors cursor-pointer"
              title="Delete record"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Delete</span>
            </button>
          </div>
        }
      />

      <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6 max-w-6xl w-full mx-auto">
        {/* Top Summary Banner */}
        <div className="bg-white border border-neutral-200 rounded-lg p-5 sm:p-6 shadow-2xs flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg border border-neutral-200 bg-neutral-100 overflow-hidden shrink-0 flex items-center justify-center relative">
              {displayImage ? (
                <LabThumbnail
                  src={displayImage}
                  alt={item.assetName}
                  size="thumb"
                  fallbackType="item"
                  className="w-full h-full object-cover"
                />
              ) : (
                <Wrench className="w-8 h-8 text-neutral-400" />
              )}
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-xs font-semibold border ${statusBadge.badgeClass}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${statusBadge.dotClass}`} />
                  {statusBadge.text}
                </span>

                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-neutral-100 text-neutral-700 border border-neutral-200/60">
                  <Tag className="w-3 h-3 text-neutral-400" />
                  {item.type}
                </span>

                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-neutral-100 text-neutral-600 border border-neutral-200/60">
                  <Calendar className="w-3 h-3 text-neutral-400" />
                  {item.date}
                </span>
              </div>

              <h1 className="text-xl sm:text-2xl font-bold text-neutral-900 tracking-tight">
                {item.assetName}
              </h1>

              <div className="flex items-center gap-2 text-xs text-neutral-500 font-mono mt-1">
                <span>Tag: {item.serialNumber}</span>
                <button
                  type="button"
                  onClick={handleCopySerial}
                  className="text-neutral-400 hover:text-neutral-900 transition-colors p-0.5"
                  title="Copy serial tag"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
                <span>•</span>
                <span className="font-sans text-neutral-600">Technician: {item.technician}</span>
              </div>
            </div>
          </div>

          {/* Quick Status Bar */}
          <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-3 self-stretch md:self-auto flex flex-col justify-center gap-2 shrink-0">
            <span className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider">
              Quick Status Switcher
            </span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => handleStatusChange('Completed')}
                className={`px-2.5 py-1 rounded text-xs font-medium transition-all cursor-pointer ${
                  item.status === 'Completed'
                    ? 'bg-emerald-600 text-white font-semibold shadow-xs'
                    : 'bg-white border border-neutral-200 text-neutral-700 hover:bg-neutral-100'
                }`}
              >
                Completed
              </button>
              <button
                type="button"
                onClick={() => handleStatusChange('In Progress')}
                className={`px-2.5 py-1 rounded text-xs font-medium transition-all cursor-pointer ${
                  item.status === 'In Progress'
                    ? 'bg-blue-600 text-white font-semibold shadow-xs'
                    : 'bg-white border border-neutral-200 text-neutral-700 hover:bg-neutral-100'
                }`}
              >
                In Progress
              </button>
              <button
                type="button"
                onClick={() => handleStatusChange('Pending')}
                className={`px-2.5 py-1 rounded text-xs font-medium transition-all cursor-pointer ${
                  item.status === 'Pending'
                    ? 'bg-amber-600 text-white font-semibold shadow-xs'
                    : 'bg-white border border-neutral-200 text-neutral-700 hover:bg-neutral-100'
                }`}
              >
                Pending
              </button>
            </div>
          </div>
        </div>

        {/* 2-Column Main Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Visual & Linked Device (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            {/* Visual Photo Card */}
            <div className="bg-white border border-neutral-200 rounded-lg p-5 shadow-2xs space-y-4">
              <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
                <div className="flex items-center gap-2">
                  <Wrench className="w-4 h-4 text-neutral-700" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-900">
                    Service Photo & Visual
                  </h3>
                </div>
                <Link
                  href={`/maintenance/${item.id}/edit`}
                  className="text-[11px] font-semibold text-emerald-700 hover:underline inline-flex items-center gap-1"
                >
                  <Edit3 className="w-3 h-3" />
                  <span>Update Photo</span>
                </Link>
              </div>

              <div className="w-full aspect-video rounded-lg border border-neutral-200 bg-neutral-50 overflow-hidden flex items-center justify-center">
                {displayImage ? (
                  <img
                    src={displayImage}
                    alt={item.assetName}
                    decoding="async"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex flex-col items-center gap-2 text-neutral-400">
                    <Wrench className="w-10 h-10" />
                    <span className="text-xs">No service photo attached</span>
                    <Link
                      href={`/maintenance/${item.id}/edit`}
                      className="text-xs font-semibold text-emerald-700 hover:underline mt-1"
                    >
                      + Add Photo
                    </Link>
                  </div>
                )}
              </div>
            </div>

            {/* Linked Equipment Card */}
            {(matchedAsset || matchedStock) && (
              <div className="bg-white border border-neutral-200 rounded-lg p-5 shadow-2xs space-y-3">
                <div className="flex items-center gap-2 border-b border-neutral-100 pb-3">
                  {matchedAsset ? <Laptop className="w-4 h-4 text-blue-600" /> : <Boxes className="w-4 h-4 text-emerald-600" />}
                  <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-900">
                    Linked Institutional Equipment
                  </h3>
                </div>

                <div className="p-3 bg-neutral-50 rounded-lg border border-neutral-200/80 space-y-2">
                  <div className="font-semibold text-neutral-900 text-xs">
                    {matchedAsset?.name || matchedStock?.name}
                  </div>
                  <div className="text-[11px] text-neutral-500 font-mono">
                    ID / Tag: {matchedAsset?.serialNumber || matchedStock?.code}
                  </div>
                  <div className="text-[11px] text-neutral-600 flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-neutral-400" />
                    <span>{matchedAsset?.location || matchedStock?.location}</span>
                  </div>

                  <div className="pt-2">
                    {matchedAsset ? (
                      <Link
                        href={`/assets/${matchedAsset.id}`}
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-700 hover:text-blue-800 hover:underline"
                      >
                        <span>View in Hardware Assets</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </Link>
                    ) : matchedStock ? (
                      <Link
                        href={`/stock/${matchedStock.id}`}
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 hover:text-emerald-800 hover:underline"
                      >
                        <span>View in Central Stock</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </Link>
                    ) : null}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Technical Details & Notes (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            {/* Specifications Matrix Card */}
            <div className="bg-white border border-neutral-200 rounded-lg p-5 sm:p-6 shadow-2xs space-y-4">
              <div className="flex items-center gap-2 border-b border-neutral-100 pb-3">
                <Layers className="w-4 h-4 text-neutral-700" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-900">
                  Service Specifications & Record Details
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-neutral-50/70 border border-neutral-100 rounded space-y-1">
                  <div className="text-neutral-400 text-[11px] font-medium">Equipment Name</div>
                  <div className="font-semibold text-neutral-900">{item.assetName}</div>
                </div>

                <div className="p-3 bg-neutral-50/70 border border-neutral-100 rounded space-y-1">
                  <div className="text-neutral-400 text-[11px] font-medium">Serial Tag / Asset ID</div>
                  <div className="font-mono font-bold text-neutral-900">{item.serialNumber}</div>
                </div>

                <div className="p-3 bg-neutral-50/70 border border-neutral-100 rounded space-y-1">
                  <div className="text-neutral-400 text-[11px] font-medium">Service Classification</div>
                  <div className="font-semibold text-neutral-900">{item.type}</div>
                </div>

                <div className="p-3 bg-neutral-50/70 border border-neutral-100 rounded space-y-1">
                  <div className="text-neutral-400 text-[11px] font-medium">Service Date</div>
                  <div className="font-medium text-neutral-900">{item.date}</div>
                </div>

                <div className="p-3 bg-neutral-50/70 border border-neutral-100 rounded space-y-1">
                  <div className="text-neutral-400 text-[11px] font-medium">Assigned Technician</div>
                  <div className="font-semibold text-neutral-900">{item.technician}</div>
                </div>

                <div className="p-3 bg-neutral-50/70 border border-neutral-100 rounded space-y-1">
                  <div className="text-neutral-400 text-[11px] font-medium">Station Location</div>
                  <div className="font-medium text-neutral-900">
                    {item.location || matchedAsset?.location || matchedStock?.location || 'Central Depot'}
                  </div>
                </div>

                <div className="p-3 bg-neutral-50/70 border border-neutral-100 rounded space-y-1">
                  <div className="text-neutral-400 text-[11px] font-medium">Maintenance Cost</div>
                  <div className="font-mono font-semibold text-neutral-900">
                    {item.cost ? `$${Number(item.cost).toFixed(2)}` : 'Standard Department Budget'}
                  </div>
                </div>

                <div className="p-3 bg-neutral-50/70 border border-neutral-100 rounded space-y-1">
                  <div className="text-neutral-400 text-[11px] font-medium">Operational Status</div>
                  <div className="font-semibold">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] border ${statusBadge.badgeClass}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${statusBadge.dotClass}`} />
                      {statusBadge.text}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Diagnostic Findings & Work Carried Out Card */}
            <div className="bg-white border border-neutral-200 rounded-lg p-5 sm:p-6 shadow-2xs space-y-3">
              <div className="flex items-center gap-2 border-b border-neutral-100 pb-3">
                <CheckCircle2 className="w-4 h-4 text-neutral-700" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-900">
                  Diagnostic Findings & Technical Notes
                </h3>
              </div>

              <div className="text-xs text-neutral-700 leading-relaxed pt-1">
                {item.notes ? (
                  <p className="whitespace-pre-line bg-neutral-50/60 p-4 rounded-lg border border-neutral-100 font-sans">
                    {item.notes}
                  </p>
                ) : (
                  <p className="text-neutral-400 italic">
                    No diagnostic findings recorded. Click &quot;Edit Log&quot; to add technician remarks or error logs.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg border border-neutral-200 max-w-md w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center gap-3 text-rose-700">
              <div className="w-10 h-10 rounded-full bg-rose-50 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-neutral-900">Delete Maintenance Record</h3>
                <p className="text-xs text-neutral-500">This action cannot be undone.</p>
              </div>
            </div>

            <p className="text-xs text-neutral-600">
              Are you sure you want to permanently delete the service log for{' '}
              <span className="font-semibold text-neutral-900">{item.assetName}</span> ({item.serialNumber})?
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="px-3 py-1.5 rounded text-xs font-medium border border-neutral-200 text-neutral-700 hover:bg-neutral-50 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="px-3.5 py-1.5 rounded text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white transition-colors cursor-pointer"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

