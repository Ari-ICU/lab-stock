'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
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
  Trash2,
  AlertTriangle,
  Calendar,
  MapPin,
  Tag,
  DollarSign,
  User,
  Layers,
  FileText,
  Sparkles,
  CheckCircle2,
  Package,
  Edit3,
} from 'lucide-react';
import {
  MAINTENANCE_TYPES,
  MAINTENANCE_STATUS_OPTIONS,
  resolveMaintenanceImage,
} from '../../shared';

export default function MaintenanceEditClient({ id: propId }: { id?: string }) {
  const params = useParams();
  const router = useRouter();
  const id = propId || (params?.id as string);

  const { maintenance, assets, stock, locations, updateMaintenance, deleteMaintenance, showToast } = useStock();
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
  const [quantity, setQuantity] = useState<number>(1);
  const [unit, setUnit] = useState<string>('Units');
  const [notes, setNotes] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [entryMode, setEntryMode] = useState<'inventory' | 'manual'>('inventory');
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
      setQuantity(item.quantity && item.quantity > 0 ? Number(item.quantity) : 1);
      setUnit(item.unit || 'Units');
      setNotes(item.notes || '');
      setImageUrl(item.imageUrl || resolveMaintenanceImage(item, assets, stock));

      // Try matching current equipment with inventory
      for (const [val, data] of inventoryMap.entries()) {
        if (
          (item.serialNumber && data.serial.toLowerCase() === item.serialNumber.toLowerCase()) ||
          (item.assetName && data.name.toLowerCase() === item.assetName.toLowerCase())
        ) {
          setSelectedInventoryValue(val);
          break;
        }
      }
    }
  }, [item, inventoryMap, assets, stock]);

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
      quantity: quantity > 0 ? quantity : 1,
      unit: unit.trim() || 'Units',
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

      <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 w-full space-y-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left 8 Cols: Form Inputs */}
            <div className="lg:col-span-8 space-y-6">
              <div className="bg-white border border-neutral-200 rounded-lg p-5 sm:p-6 shadow-2xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-neutral-100 pb-3">
                  <div className="flex items-center gap-2">
                    <Wrench className="w-4 h-4 text-neutral-700" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-900">
                      Service Record Details
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
                        Tip: Select any item above to automatically fill the equipment name, serial tag, location, and photo without typing.
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
                        placeholder="e.g. Cisco C9300 48P Switch or Dell OptiPlex 7090"
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
                        placeholder="e.g. FCW2348L09M or OPT-102B-01"
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
                        placeholder="0.00"
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
                    className={inputCls}
                  />
                </div>
              </div>
            </div>

            {/* Right 4 Cols: Image Upload & Presets */}
            <div className="lg:col-span-4 space-y-6">
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

