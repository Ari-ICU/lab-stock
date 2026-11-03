'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Header } from '@/components/Header';
import { useStock } from '@/context/StockContext';
import { useAuth } from '@/context/AuthContext';
import { ImageUpload } from '@/components/ImageUpload';
import { Dropdown, DropdownOption } from '@/components/Dropdown';
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
  Package,
  Edit3,
} from 'lucide-react';
import {
  MAINTENANCE_TYPES,
  MAINTENANCE_STATUS_OPTIONS,
  resolveMaintenanceImage,
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
  const [quantity, setQuantity] = useState<number>(1);
  const [unit, setUnit] = useState<string>('Units');
  const [notes, setNotes] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [entryMode, setEntryMode] = useState<'inventory' | 'manual'>(prefillName ? 'manual' : 'inventory');
  const [selectedInventoryValue, setSelectedInventoryValue] = useState<string>('');

  // Comprehensive inventory options: Hardware Assets, Central Stock, and Classroom Equipment
  const inventoryOptions = useMemo<DropdownOption[]>(() => {
    const list: DropdownOption[] = [];

    assets.forEach((a) => {
      list.push({
        label: `[Asset] ${a.name} (${a.serialNumber}) • ${a.location || 'Facility'}`,
        value: `asset:${a.id}`,
      });
    });

    stock.forEach((s) => {
      list.push({
        label: `[Stock] ${s.name} (${s.code}) • ${s.quantity} ${s.unit || 'units'} in ${s.location || 'Depot'}`,
        value: `stock:${s.id}`,
      });
    });

    locations.forEach((loc) => {
      loc.inventories?.forEach((inv) => {
        const serialTag = inv.brandSpec ? `${inv.brandSpec}` : `${loc.room || 'LOC'}-${inv.id}`;
        list.push({
          label: `[${loc.room || loc.name}] ${inv.name} (${serialTag}) • ${loc.name}`,
          value: `loc:${loc.id}:${inv.id}`,
        });
      });
    });

    return list;
  }, [assets, stock, locations]);

  // Map inventory key to full equipment attributes
  const inventoryMap = useMemo(() => {
    const map = new Map<
      string,
      { name: string; serial: string; location?: string; quantity?: number; unit?: string; imageUrl?: string }
    >();

    assets.forEach((a) => {
      map.set(`asset:${a.id}`, {
        name: a.name,
        serial: a.serialNumber,
        location: a.location,
        quantity: a.totalUnits || 1,
        unit: a.unitType || 'Units',
        imageUrl: a.imageUrl,
      });
    });

    stock.forEach((s) => {
      map.set(`stock:${s.id}`, {
        name: s.name,
        serial: s.code,
        location: s.location,
        quantity: s.quantity || 1,
        unit: s.unit || 'Units',
        imageUrl: s.imageUrl,
      });
    });

    locations.forEach((loc) => {
      loc.inventories?.forEach((inv) => {
        const serialTag = inv.brandSpec ? `${inv.brandSpec}` : `${loc.room || 'LOC'}-${inv.id}`;
        map.set(`loc:${loc.id}:${inv.id}`, {
          name: inv.name,
          serial: serialTag,
          location: loc.name,
          quantity: (inv.qtyWorking || 0) + (inv.qtyBroken || 0) || 1,
          unit: inv.unit || 'Units',
          imageUrl: undefined,
        });
      });
    });

    return map;
  }, [assets, stock, locations]);

  const handleSelectInventory = (val: string) => {
    setSelectedInventoryValue(val);
    const found = inventoryMap.get(val);
    if (!found) return;
    setAssetName(found.name);
    setSerialNumber(found.serial);
    if (found.location) setLocation(found.location);
    if (found.quantity) setQuantity(found.quantity);
    if (found.unit) setUnit(found.unit);
    if (found.imageUrl) setImageUrl(found.imageUrl);
    showToast(`Loaded ${found.name} (${found.serial}) from Inventory`, 'info');
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
      imageUrl: imageUrl.trim() || resolveMaintenanceImage({ assetName, serialNumber }, assets, stock),
      location: location.trim() || undefined,
      cost: cost.trim() ? Number(cost) || cost.trim() : undefined,
      quantity: quantity > 0 ? quantity : 1,
      unit: unit.trim() || 'Units',
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

      <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 w-full space-y-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left 7 Cols: Service & Equipment Details */}
            <div className="lg:col-span-7 space-y-6">
              <div className="bg-white border border-neutral-200 rounded-lg p-5 sm:p-6 shadow-2xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-neutral-100 pb-3">
                  <div className="flex items-center gap-2">
                    <Wrench className="w-4 h-4 text-neutral-700" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-900">
                      Service Information
                    </h3>
                  </div>

                  {/* Mode switcher: Select from Inventory vs Type Manually */}
                  <div className="inline-flex rounded-lg border border-neutral-200 bg-neutral-100 p-0.5 text-xs self-start sm:self-auto">
                    <button
                      type="button"
                      onClick={() => setEntryMode('inventory')}
                      className={`inline-flex items-center gap-1.5 px-3 py-1 font-semibold rounded-md transition-all cursor-pointer ${
                        entryMode === 'inventory'
                          ? 'bg-white text-neutral-900 shadow-2xs'
                          : 'text-neutral-600 hover:text-neutral-900'
                      }`}
                    >
                      <Package className="w-3.5 h-3.5 text-emerald-600" />
                      Select from Inventory
                    </button>
                    <button
                      type="button"
                      onClick={() => setEntryMode('manual')}
                      className={`inline-flex items-center gap-1.5 px-3 py-1 font-semibold rounded-md transition-all cursor-pointer ${
                        entryMode === 'manual'
                          ? 'bg-white text-neutral-900 shadow-2xs'
                          : 'text-neutral-600 hover:text-neutral-900'
                      }`}
                    >
                      <Edit3 className="w-3.5 h-3.5 text-neutral-500" />
                      Type Manually
                    </button>
                  </div>
                </div>

                {/* INVENTORY SELECTOR MODE */}
                {entryMode === 'inventory' && (
                  <div className="space-y-3 bg-neutral-50/70 border border-neutral-200 rounded-lg p-3.5">
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-xs font-bold text-neutral-900 flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Select Equipment from Inventory *</span>
                        </label>
                        <span className="text-[11px] font-medium text-neutral-500">
                          {inventoryOptions.length} registered items
                        </span>
                      </div>
                      <Dropdown
                        value={selectedInventoryValue}
                        options={[
                          { label: '-- Search & select an equipment from inventory --', value: '' },
                          ...inventoryOptions,
                        ]}
                        onChange={handleSelectInventory}
                        searchable
                        searchPlaceholder="Type name, serial code, or room..."
                        placeholder="Search & select from Inventory (Assets, Stock, Rooms)..."
                        className="w-full"
                        buttonClassName="w-full justify-between bg-white border border-neutral-300 text-neutral-900 text-xs px-3 py-2.5 rounded font-medium shadow-2xs"
                      />
                    </div>

                    {/* Selected Item Summary Card */}
                    {assetName ? (
                      <div className="flex items-center justify-between p-3 bg-white border border-neutral-200 rounded-lg shadow-2xs">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-9 h-9 rounded border border-neutral-200 bg-neutral-100 overflow-hidden shrink-0 flex items-center justify-center font-bold text-neutral-600 text-xs">
                            {imageUrl ? (
                              <img src={imageUrl} alt={assetName} className="w-full h-full object-cover" />
                            ) : (
                              assetName.charAt(0)
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="font-bold text-neutral-900 text-xs truncate flex items-center gap-2">
                              <span>{assetName}</span>
                              <span className="text-[10px] text-emerald-800 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded font-semibold shrink-0">
                                ✓ From Inventory
                              </span>
                            </div>
                            <div className="text-[11px] text-neutral-500 font-mono flex items-center gap-2 mt-0.5 flex-wrap">
                              <span>Tag: <strong className="text-neutral-800 font-semibold">{serialNumber}</strong></span>
                              {location && <span>• {location}</span>}
                              <span>• {quantity} {unit}</span>
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => setEntryMode('manual')}
                          className="text-[11px] text-emerald-700 hover:text-emerald-800 font-semibold underline shrink-0 cursor-pointer ml-3"
                          title="Switch to typing custom name or serial"
                        >
                          Edit text
                        </button>
                      </div>
                    ) : (
                      <p className="text-[11px] text-neutral-500 italic">
                        Tip: Select any registered item above to automatically fill the equipment name, serial tag, location, and photo without typing.
                      </p>
                    )}
                  </div>
                )}

                {/* MANUAL TYPING MODE */}
                {entryMode === 'manual' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-neutral-500">
                        Entering custom equipment details manually:
                      </span>
                      <button
                        type="button"
                        onClick={() => setEntryMode('inventory')}
                        className="text-[11px] text-emerald-700 hover:text-emerald-800 font-semibold underline cursor-pointer"
                      >
                        Prefer to select from inventory? Click here
                      </button>
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
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

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

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
                      Quantity Serviced *
                    </label>
                    <input
                      type="number"
                      min={1}
                      required
                      value={quantity}
                      onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                      className={inputCls}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-neutral-800 mb-1">
                      Unit (e.g. Switches, Units)
                    </label>
                    <input
                      type="text"
                      value={unit}
                      onChange={(e) => setUnit(e.target.value)}
                      placeholder="e.g. Switches, Units, Desktops"
                      className={inputCls}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                    Upload a photo or paste an image URL for this equipment
                  </p>
                </div>

                <ImageUpload
                  value={imageUrl}
                  onChange={setImageUrl}
                  label="Service / Equipment Photo"
                />
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

