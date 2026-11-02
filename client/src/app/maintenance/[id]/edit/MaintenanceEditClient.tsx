'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Header } from '@/components/Header';
import { useStock } from '@/context/StockContext';
import { useAuth } from '@/context/AuthContext';
import { ImageUpload } from '@/components/ImageUpload';
import { Dropdown } from '@/components/Dropdown';
import { DatePicker } from '@/components/DatePicker';
import {
  ArrowLeft,
  Wrench,
  Save,
  Trash2,
  AlertTriangle,
  Calendar,
  MapPin,
  Tag,
  DollarSign,
  User,
  Layers,
  FileText,
} from 'lucide-react';
import {
  MAINTENANCE_TYPES,
  MAINTENANCE_STATUS_OPTIONS,
  DEFAULT_MAINTENANCE_PRESETS,
} from '../../shared';

export default function MaintenanceEditClient({ id: propId }: { id?: string }) {
  const params = useParams();
  const router = useRouter();
  const id = propId || (params?.id as string);

  const { maintenance, updateMaintenance, deleteMaintenance, showToast } = useStock();
  const { user } = useAuth();

  const item = maintenance.find((m) => m.id === id || String(m.id) === String(id));

  const [assetName, setAssetName] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  const [type, setType] = useState('Firmware Upgrade');
  const [date, setDate] = useState('');
  const [technician, setTechnician] = useState('');
  const [status, setStatus] = useState<'Completed' | 'Pending' | 'In Progress'>('In Progress');
  const [location, setLocation] = useState('');
  const [cost, setCost] = useState('');
  const [notes, setNotes] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (item) {
      setAssetName(item.assetName || '');
      setSerialNumber(item.serialNumber || '');
      setType(item.type || 'Firmware Upgrade');
      setDate(item.date || new Date().toISOString().split('T')[0]);
      setTechnician(item.technician || '');
      setStatus(item.status || 'In Progress');
      setLocation(item.location || '');
      setCost(item.cost ? String(item.cost) : '');
      setNotes(item.notes || '');
      setImageUrl(item.imageUrl || '');
    }
  }, [item]);

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
            <h2 className="text-base font-bold text-neutral-900">Record Not Found</h2>
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!assetName.trim()) {
      showToast('Please enter equipment name', 'warning');
      return;
    }
    if (!serialNumber.trim()) {
      showToast('Please enter serial number / tag', 'warning');
      return;
    }
    if (!technician.trim()) {
      showToast('Please specify technician name', 'warning');
      return;
    }

    setSubmitting(true);

    updateMaintenance({
      ...item,
      assetName: assetName.trim(),
      serialNumber: serialNumber.trim(),
      type,
      date,
      technician: technician.trim(),
      status,
      notes: notes.trim(),
      imageUrl: imageUrl.trim() || undefined,
      location: location.trim() || undefined,
      cost: cost.trim() ? Number(cost) || cost.trim() : undefined,
    });

    showToast(`Updated service log for ${assetName}`, 'success');
    setTimeout(() => {
      router.push(`/maintenance/${item.id}`);
    }, 200);
  };

  const handleDelete = () => {
    deleteMaintenance(item.id);
    showToast(`Deleted maintenance record for ${item.assetName}`);
    router.push('/maintenance');
  };

  const inputCls =
    'w-full bg-white border border-neutral-300 text-neutral-900 text-xs px-3 py-2 rounded focus:outline-none focus:border-neutral-900 transition-colors placeholder:text-neutral-400';
  const dropdownBtn = 'w-full justify-between bg-white border border-neutral-300 text-neutral-900 text-xs px-3 py-2 rounded';

  return (
    <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-neutral-50/50">
      <Header
        title={`Edit Service Log: ${item.assetName}`}
        subtitle={`Serial: ${item.serialNumber} • Record #${item.id}`}
        backHref={`/maintenance/${item.id}`}
        backLabel="View Record"
        showExport={false}
        actions={
          <button
            type="button"
            onClick={() => setShowDeleteConfirm(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-neutral-200 hover:border-rose-300 hover:bg-rose-50 text-rose-700 rounded text-xs font-semibold transition-colors shadow-2xs cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete Log</span>
          </button>
        }
      />

      <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 max-w-5xl w-full mx-auto">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left 7 Cols: Form Inputs */}
            <div className="lg:col-span-7 space-y-6">
              <div className="bg-white border border-neutral-200 rounded-lg p-5 sm:p-6 shadow-2xs space-y-4">
                <div className="flex items-center gap-2 border-b border-neutral-100 pb-3">
                  <Wrench className="w-4 h-4 text-neutral-700" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-900">
                    Service Record Details
                  </h3>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-800 mb-1">
                    Equipment / Instrument Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={assetName}
                    onChange={(e) => setAssetName(e.target.value)}
                    className={inputCls}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-neutral-800 mb-1">
                      Serial Number / Equipment Tag *
                    </label>
                    <input
                      type="text"
                      required
                      value={serialNumber}
                      onChange={(e) => setSerialNumber(e.target.value)}
                      className={`${inputCls} font-mono`}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-neutral-800 mb-1">
                      Service Type *
                    </label>
                    <Dropdown
                      value={type}
                      options={MAINTENANCE_TYPES.map((t) => ({ label: t, value: t }))}
                      onChange={setType}
                      className="w-full"
                      buttonClassName={dropdownBtn}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-neutral-800 mb-1">
                      Service Date *
                    </label>
                    <DatePicker value={date} onChange={setDate} />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-neutral-800 mb-1">
                      Service Status *
                    </label>
                    <Dropdown
                      value={status}
                      options={MAINTENANCE_STATUS_OPTIONS}
                      onChange={(v) => setStatus(v as any)}
                      className="w-full"
                      buttonClassName={dropdownBtn}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-neutral-800 mb-1">
                      Assigned Technician / Team *
                    </label>
                    <input
                      type="text"
                      required
                      value={technician}
                      onChange={(e) => setTechnician(e.target.value)}
                      className={inputCls}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-neutral-800 mb-1">
                      Room Location (Optional)
                    </label>
                    <input
                      type="text"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      className={inputCls}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-800 mb-1">
                    Repair / Service Cost (USD, optional)
                  </label>
                  <div className="relative">
                    <DollarSign className="w-3.5 h-3.5 text-neutral-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={cost}
                      onChange={(e) => setCost(e.target.value)}
                      placeholder="e.g. 45.00"
                      className={`${inputCls} pl-8 font-mono`}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-800 mb-1">
                    Diagnostic Notes & Work Carried Out
                  </label>
                  <textarea
                    rows={4}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className={inputCls}
                  />
                </div>
              </div>
            </div>

            {/* Right 5 Cols: Image Upload & Presets */}
            <div className="lg:col-span-5 space-y-6">
              <div className="bg-white border border-neutral-200 rounded-lg p-5 sm:p-6 shadow-2xs space-y-4">
                <div className="border-b border-neutral-100 pb-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-900">
                    Equipment Image & Visual
                  </h3>
                  <p className="text-[11px] text-neutral-500 mt-0.5">
                    Update or upload a new photo for this service log
                  </p>
                </div>

                <ImageUpload
                  value={imageUrl}
                  onChange={setImageUrl}
                  label="Service / Equipment Photo"
                />

                <div className="space-y-2 pt-2 border-t border-neutral-100">
                  <div className="text-[11px] font-semibold text-neutral-700">Quick Presets:</div>
                  <div className="grid grid-cols-1 gap-1.5">
                    {DEFAULT_MAINTENANCE_PRESETS.map((p, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setImageUrl(p.imageUrl)}
                        className={`text-left text-xs p-2 rounded border flex items-center gap-2 transition-all cursor-pointer ${
                          imageUrl === p.imageUrl
                            ? 'bg-emerald-50 border-emerald-300 text-emerald-900 font-semibold'
                            : 'bg-neutral-50 border-neutral-200 text-neutral-700 hover:bg-neutral-100'
                        }`}
                      >
                        <img src={p.imageUrl} alt={p.name} className="w-8 h-8 rounded object-cover shrink-0" />
                        <span className="truncate">{p.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Form Action Controls */}
              <div className="bg-white border border-neutral-200 rounded-lg p-4 shadow-2xs space-y-2.5">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 bg-neutral-900 hover:bg-neutral-800 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer shadow-xs"
                >
                  <Save className="w-4 h-4 text-emerald-400" />
                  <span>{submitting ? 'Updating...' : 'Save Changes'}</span>
                </button>

                <Link
                  href={`/maintenance/${item.id}`}
                  className="w-full inline-flex items-center justify-center gap-1.5 py-2 px-4 bg-white hover:bg-neutral-50 border border-neutral-200 text-neutral-700 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Cancel</span>
                </Link>
              </div>
            </div>
          </div>
        </form>
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
