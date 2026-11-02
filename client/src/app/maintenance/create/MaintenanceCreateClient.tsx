'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
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
  CheckCircle2,
  Calendar,
  MapPin,
  Tag,
  DollarSign,
  User,
  Layers,
  FileText,
  AlertTriangle,
  Sparkles,
} from 'lucide-react';
import {
  MAINTENANCE_TYPES,
  MAINTENANCE_STATUS_OPTIONS,
  DEFAULT_MAINTENANCE_PRESETS,
} from '../shared';

export default function MaintenanceCreateClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const prefillSerial = searchParams.get('serial') || '';
  const prefillName = searchParams.get('name') || '';

  const { assets, stock, locations, addMaintenance, showToast } = useStock();
  const { user } = useAuth();

  const [assetName, setAssetName] = useState(prefillName);
  const [serialNumber, setSerialNumber] = useState(prefillSerial);
  const [type, setType] = useState<string>('Firmware Upgrade');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [technician, setTechnician] = useState(user?.name || 'Thoeurn Ratha');
  const [status, setStatus] = useState<'Completed' | 'Pending' | 'In Progress'>('In Progress');
  const [location, setLocation] = useState('');
  const [cost, setCost] = useState('');
  const [notes, setNotes] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Quick equipment pickers from registered assets & stock
  const equipmentOptions = useMemo(() => {
    const list: Array<{ label: string; value: string; name: string; serial: string; image?: string; loc?: string }> = [];

    assets.forEach((a) => {
      list.push({
        label: `[Asset] ${a.name} (${a.serialNumber}) — ${a.location}`,
        value: `asset-${a.id}`,
        name: a.name,
        serial: a.serialNumber,
        image: a.imageUrl,
        loc: a.location,
      });
    });

    stock.forEach((s) => {
      list.push({
        label: `[Stock] ${s.name} (${s.code}) — ${s.location}`,
        value: `stock-${s.id}`,
        name: s.name,
        serial: s.code,
        image: s.imageUrl,
        loc: s.location,
      });
    });

    return list;
  }, [assets, stock]);

  const handleSelectEquipment = (val: string) => {
    const found = equipmentOptions.find((o) => o.value === val);
    if (!found) return;
    setAssetName(found.name);
    setSerialNumber(found.serial);
    if (found.loc) setLocation(found.loc);
    if (found.image && !imageUrl) setImageUrl(found.image);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!assetName.trim()) {
      showToast('Please enter the instrument or equipment name', 'warning');
      return;
    }
    if (!serialNumber.trim()) {
      showToast('Please enter the serial number or equipment tag', 'warning');
      return;
    }
    if (!technician.trim()) {
      showToast('Please specify the technician or team in charge', 'warning');
      return;
    }

    setSubmitting(true);

    addMaintenance({
      assetName: assetName.trim(),
      serialNumber: serialNumber.trim(),
      type,
      date,
      technician: technician.trim(),
      status,
      notes: notes.trim() || 'Service and diagnostic checks performed.',
      imageUrl: imageUrl.trim() || undefined,
      location: location.trim() || undefined,
      cost: cost.trim() ? Number(cost) || cost.trim() : undefined,
    });

    showToast(`Scheduled maintenance log for ${assetName}`, 'success');
    setTimeout(() => {
      router.push('/maintenance');
    }, 200);
  };

  const inputCls =
    'w-full bg-white border border-neutral-300 text-neutral-900 text-xs px-3 py-2 rounded focus:outline-none focus:border-neutral-900 transition-colors placeholder:text-neutral-400';
  const dropdownBtn = 'w-full justify-between bg-white border border-neutral-300 text-neutral-900 text-xs px-3 py-2 rounded';

  return (
    <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-neutral-50/50">
      <Header
        title="Schedule Service & Maintenance"
        subtitle="Log calibration, firmware upgrades, repairs or safety audits"
        backHref="/maintenance"
        backLabel="Maintenance Logs"
        showExport={false}
      />

      <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 max-w-5xl w-full mx-auto">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Quick Select Banner */}
          <div className="bg-white border border-neutral-200 rounded-lg p-4 sm:p-5 shadow-2xs space-y-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              <label className="text-xs font-bold uppercase tracking-wider text-neutral-900">
                Quick Select Registered Equipment (Optional)
              </label>
            </div>
            <p className="text-xs text-neutral-500">
              Pick a registered Hardware Asset or Central Stock item to auto-populate equipment name, serial tag, location, and photo:
            </p>
            <Dropdown
              value=""
              options={[{ label: '-- Search & Select Equipment from Database --', value: '' }, ...equipmentOptions]}
              onChange={handleSelectEquipment}
              searchable
              searchPlaceholder="Search by name, serial, or room location..."
              className="w-full"
              buttonClassName={dropdownBtn}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left 7 Cols: Service & Equipment Details */}
            <div className="lg:col-span-7 space-y-6">
              <div className="bg-white border border-neutral-200 rounded-lg p-5 sm:p-6 shadow-2xs space-y-4">
                <div className="flex items-center gap-2 border-b border-neutral-100 pb-3">
                  <Wrench className="w-4 h-4 text-neutral-700" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-900">
                    Service Information
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
                    placeholder="e.g. Dell OptiPlex 7090 or Daikin 2.5 HP AC"
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
                      placeholder="e.g. OPT-102B-01 or USG-405-SEC"
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
                      Initial Status *
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
                      placeholder="e.g. Thoeurn Ratha or Audio-Visual Staff"
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
                      placeholder="e.g. Computer Lab Room 102B"
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
                    placeholder="Enter diagnostic details, parts replaced, error codes, firmware version installed..."
                    className={inputCls}
                  />
                </div>
              </div>
            </div>

            {/* Right 5 Cols: Photo / Image Upload & Presets */}
            <div className="lg:col-span-5 space-y-6">
              <div className="bg-white border border-neutral-200 rounded-lg p-5 sm:p-6 shadow-2xs space-y-4">
                <div className="border-b border-neutral-100 pb-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-900">
                    Equipment Image & Visual
                  </h3>
                  <p className="text-[11px] text-neutral-500 mt-0.5">
                    Upload a diagnostic photo, paste an image URL, or choose a preset
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
                  <span>{submitting ? 'Saving Record...' : 'Save Maintenance Record'}</span>
                </button>

                <Link
                  href="/maintenance"
                  className="w-full inline-flex items-center justify-center gap-1.5 py-2 px-4 bg-white hover:bg-neutral-50 border border-neutral-200 text-neutral-700 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Cancel & Return</span>
                </Link>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
