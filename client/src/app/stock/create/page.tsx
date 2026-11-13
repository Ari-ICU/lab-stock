'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Header } from '@/components/Header';
import { useStock } from '@/context/StockContext';
import { useAuth } from '@/context/AuthContext';
import { ImageUpload } from '@/components/ImageUpload';
import { Dropdown } from '@/components/Dropdown';
import { ScanCodeModal } from '@/components/ScanCodeModal';
import { buildStockCategoryOptions } from '@/lib/categories';
import {
  ArrowLeft,
  Save,
  Cable,
  CheckCircle2,
  MapPin,
  Hash,
  Layers,
  FileText,
  AlertCircle,
  HelpCircle,
  QrCode,
} from 'lucide-react';

const statusOptions = [
  { label: 'In Stock (Available in quantity)', value: 'in_stock' },
  { label: 'Low Stock (Replenishment suggested)', value: 'low_stock' },
  { label: 'Out of Stock (Zero count)', value: 'out_of_stock' },
];

const unitOptions = [
  { label: 'Units', value: 'Units' },
  { label: 'Pieces', value: 'Pieces' },
  { label: 'Reams (Paper)', value: 'Reams' },
  { label: 'Cartridges (Toner/Ink)', value: 'Cartridges' },
  { label: 'Bottles (Ink Refill)', value: 'Bottles' },
  { label: 'Sets / Kits (Tools)', value: 'Sets' },
  { label: 'Boxes / Packs', value: 'Boxes' },
  { label: 'Cables', value: 'Cables' },
  { label: 'Rolls', value: 'Rolls' },
];

function CreateStockForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { addStockItem, stock, locations, showToast } = useStock();
  const { user, canManageLocation } = useAuth();

  const categoryOptions = React.useMemo(() => buildStockCategoryOptions(stock), [stock]);

  // Find first manageable location for default
  const managedLocations = locations.filter((loc) => canManageLocation(`${loc.name} (${loc.room})`));
  const defaultLocation = managedLocations.length > 0
    ? `${managedLocations[0].name} (${managedLocations[0].room})`
    : 'Computer Lab Room 102B';

  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [category, setCategory] = useState('Cables & Accessories');
  const [quantity, setQuantity] = useState(10);
  const [unit, setUnit] = useState('Units');
  const [location, setLocation] = useState(defaultLocation);
  const [rack, setRack] = useState('');
  const [status, setStatus] = useState<'in_stock' | 'low_stock' | 'out_of_stock'>('in_stock');
  const [expiryDate, setExpiryDate] = useState('Active');
  const [imageUrl, setImageUrl] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isScanModalOpen, setIsScanModalOpen] = useState(false);

  // Sync incoming search query parameters (e.g. from Barcode/QR Scanner modal or Location details)
  useEffect(() => {
    const paramCode = searchParams.get('code');
    const paramName = searchParams.get('name');
    const paramCategory = searchParams.get('category');
    const paramLocation = searchParams.get('location');
    if (paramCode) setCode(paramCode);
    if (paramName) setName(paramName);
    if (paramCategory) setCategory(paramCategory);
    if (paramLocation) setLocation(paramLocation);
  }, [searchParams]);

  const locationOptions = (managedLocations.length > 0 ? managedLocations : locations).map((loc) => ({
    label: `${loc.name} (${loc.room})`,
    value: `${loc.name} (${loc.room})`,
  }));

  const handleGenerateSKU = () => {
    const prefix = category.substring(0, 3).toUpperCase();
    const rand = Math.floor(1000 + Math.random() * 9000);
    setCode(`STK-${prefix}-${rand}`);
    showToast('Generated item SKU / Part Code', 'success');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!canManageLocation(location)) {
      showToast(`You can only register items within your assigned laboratories (${user?.assignedLabs?.join(', ') || 'Room 102B, Room 206'})`, 'warning');
      return;
    }

    if (!name.trim()) {
      showToast('Please enter an item name', 'warning');
      return;
    }
    if (!code.trim()) {
      showToast('Please enter a Part / SKU code', 'warning');
      return;
    }

    setIsSubmitting(true);

    try {
      const created = addStockItem({
        name: name.trim(),
        code: code.trim().toUpperCase(),
        category: category.trim() || 'General Inventory',
        quantity: Number(quantity) || 0,
        unit: unit.trim() || 'Units',
        location: location.trim(),
        rack: rack.trim() || 'Storage Shelf',
        status,
        expiryDate: expiryDate.trim() || 'Active',
        imageUrl: imageUrl.trim() || 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&w=600&q=80',
        description: description.trim(),
      });

      setTimeout(() => {
        router.push('/stock');
      }, 250);
    } catch {
      showToast('Failed to register stock item', 'error');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-neutral-50/50">
      <Header
        title="Add Inventory Item"
        subtitle="Stationery, Printer Ink, Hardware Tools, Consumables & Spares"
        backHref="/stock"
        backLabel="Inventory"
        showExport={false}
        actions={
          <div className="flex items-center gap-2">
            <Link
              href="/stock"
              className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 bg-white border border-neutral-200 text-neutral-700 hover:bg-neutral-50 rounded text-xs font-medium transition-colors"
            >
              Cancel
            </Link>

            <button
              type="button"
              onClick={() => {
                const form = document.getElementById('new-stock-form') as HTMLFormElement;
                if (form) form.requestSubmit();
              }}
              disabled={isSubmitting}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-neutral-900 hover:bg-neutral-800 disabled:bg-neutral-400 text-white rounded text-xs font-semibold transition-colors cursor-pointer shadow-xs"
            >
              <Save className="w-3.5 h-3.5 text-neutral-300" />
              <span>{isSubmitting ? 'Registering...' : 'Register Item'}</span>
            </button>
          </div>
        }
      />

      <div className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-6 w-full">
        {/* Main Creation Form */}
        <form id="new-stock-form" onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left Column: Item Details */}
            <div className="lg:col-span-8 xl:col-span-8 2xl:col-span-9 space-y-6">
              <div className="bg-white border border-neutral-200 rounded p-5 sm:p-6 space-y-4">
                <div className="flex items-center gap-2 border-b border-neutral-100 pb-3">
                  <Cable className="w-4 h-4 text-neutral-700" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-900">
                    Primary Inventory Information
                  </h3>
                </div>

                <div className="space-y-4 pt-1">
                  {/* Item Name */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-neutral-900 flex items-center justify-between">
                      <span>Item / Equipment Name *</span>
                      <span className="text-[11px] text-neutral-400 font-normal">e.g. A4 Paper, HP Toner, RJ45 Crimper</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Double A A4 80gsm Copy Paper"
                      className="w-full bg-white border border-neutral-300 text-neutral-900 text-xs px-3 py-2 rounded focus:outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 transition-colors"
                    />
                  </div>

                  {/* SKU / Part Code */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-neutral-900">
                        Part Number / SKU Code <span className="text-rose-500">*</span>
                      </label>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setIsScanModalOpen(true)}
                          className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-2 py-0.5 rounded cursor-pointer transition-colors shadow-2xs"
                        >
                          <QrCode className="w-3.5 h-3.5 text-emerald-700" />
                          <span>Scan Barcode / QR</span>
                        </button>
                        <button
                          type="button"
                          onClick={handleGenerateSKU}
                          className="text-[11px] text-neutral-600 hover:text-neutral-900 font-medium hover:underline flex items-center gap-1"
                        >
                          <Hash className="w-3 h-3" />
                          Generate SKU
                        </button>
                      </div>
                    </div>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                        placeholder="e.g. CAB-102B-CAT6A"
                        className="w-full bg-white border border-neutral-300 text-neutral-900 text-xs font-mono uppercase px-3 py-2 pr-9 rounded focus:outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 transition-colors"
                      />
                      <button
                        type="button"
                        onClick={() => setIsScanModalOpen(true)}
                        title="Scan Barcode or QR Code"
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-900 p-1 rounded cursor-pointer transition-colors"
                      >
                        <QrCode className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Category & Status */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-neutral-900">Category</label>
                      <Dropdown
                        value={category}
                        options={categoryOptions}
                        onChange={setCategory}
                        allowCustom
                        searchPlaceholder="Search or type new category..."
                        placeholder="Select Category"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-neutral-900">Stock Availability</label>
                      <Dropdown
                        value={status}
                        options={statusOptions}
                        onChange={(val) => setStatus(val as any)}
                        placeholder="Select Status"
                      />
                    </div>
                  </div>

                  {/* Quantity & Unit Type */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-neutral-900 flex items-center justify-between">
                        <span>Quantity in Stock *</span>
                        <span className="text-[11px] text-neutral-400 font-normal">Count</span>
                      </label>
                      <input
                        type="number"
                        min={0}
                        required
                        value={quantity}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setQuantity(val);
                          if (val === 0) setStatus('out_of_stock');
                          else if (val <= 5) setStatus('low_stock');
                          else setStatus('in_stock');
                        }}
                        className="w-full bg-white border border-neutral-300 text-neutral-900 text-xs font-mono px-3 py-2 rounded focus:outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 transition-colors"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-neutral-900">Unit Type</label>
                      <Dropdown
                        value={unit}
                        options={unitOptions}
                        onChange={setUnit}
                        placeholder="Select Unit"
                      />
                    </div>
                  </div>

                  {/* Warranty / Note */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-neutral-900 flex items-center justify-between">
                      <span>Warranty / Inspection Note</span>
                      <span className="text-[11px] text-neutral-400 font-normal">e.g. Warranty 2027, Active</span>
                    </label>
                    <input
                      type="text"
                      value={expiryDate}
                      onChange={(e) => setExpiryDate(e.target.value)}
                      placeholder="e.g. Warranty 2027 or Active"
                      className="w-full bg-white border border-neutral-300 text-neutral-900 text-xs px-3 py-2 rounded focus:outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 transition-colors"
                    />
                  </div>

                  {/* Description */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-neutral-900">
                      Technical Description & Deployment Notes
                    </label>
                    <textarea
                      rows={3}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Specify cable lengths, pinout standards, compatibility notes, or lab storage procedures..."
                      className="w-full bg-white border border-neutral-300 text-neutral-900 text-xs px-3 py-2 rounded focus:outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 transition-colors leading-relaxed"
                    />
                  </div>
                </div>
              </div>

              {/* Location & Storage Details */}
              <div className="bg-white border border-neutral-200 rounded p-5 sm:p-6 space-y-4">
                <div className="flex items-center gap-2 border-b border-neutral-100 pb-3">
                  <MapPin className="w-4 h-4 text-neutral-700" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-900">
                    Location & Shelf Placement
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-neutral-900">Assigned Laboratory Room</label>
                    <Dropdown
                      value={location}
                      options={locationOptions}
                      onChange={setLocation}
                      placeholder="Select Lab Room"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-neutral-900">Shelf / Cabinet / Bin</label>
                    <input
                      type="text"
                      value={rack}
                      onChange={(e) => setRack(e.target.value)}
                      placeholder="e.g. Benches & Shelf SHF-01"
                      className="w-full bg-white border border-neutral-300 text-neutral-900 text-xs px-3 py-2 rounded focus:outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 transition-colors"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Image & Summary Card */}
            <div className="lg:col-span-4 xl:col-span-4 2xl:col-span-3 space-y-6">
              {/* Product Visual */}
              <div className="bg-white border border-neutral-200 rounded p-5 sm:p-6 space-y-4">
                <div className="flex items-center gap-2 border-b border-neutral-100 pb-3">
                  <Layers className="w-4 h-4 text-neutral-700" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-900">
                    Item Photo
                  </h3>
                </div>

                <ImageUpload
                  value={imageUrl}
                  onChange={setImageUrl}
                  label="Upload or Paste Photo URL"
                />
              </div>

              {/* Registry Summary Preview */}
              <div className="bg-white border border-neutral-200 rounded p-5 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-900">
                  Item Preview Summary
                </h4>
                <div className="space-y-2 text-xs border-t border-neutral-100 pt-3">
                  <div className="flex justify-between py-1 border-b border-neutral-50">
                    <span className="text-neutral-500">Name</span>
                    <span className="font-semibold text-neutral-900 text-right truncate max-w-[160px]">
                      {name || '—'}
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-neutral-50">
                    <span className="text-neutral-500">SKU / Code</span>
                    <span className="font-mono text-neutral-800 font-semibold">{code || '—'}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-neutral-50">
                    <span className="text-neutral-500">Total Count</span>
                    <span className="font-mono font-bold text-neutral-900">{quantity} {unit}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-neutral-50">
                    <span className="text-neutral-500">Category</span>
                    <span className="text-neutral-700">{category}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-neutral-500">Room</span>
                    <span className="text-neutral-700 truncate max-w-[160px] text-right">{location}</span>
                  </div>
                </div>

                <div className="pt-3">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-neutral-900 hover:bg-neutral-800 disabled:bg-neutral-400 text-white rounded text-xs font-semibold transition-colors cursor-pointer shadow-xs"
                  >
                    <Save className="w-4 h-4 text-neutral-300" />
                    <span>{isSubmitting ? 'Registering Item...' : 'Register Stock Item'}</span>
                  </button>
                </div>
              </div>
            </div>

          </div>
        </form>
      </div>

      <ScanCodeModal
        isOpen={isScanModalOpen}
        onClose={() => setIsScanModalOpen(false)}
        title="Scan Peripheral Item / SKU Code"
        targetFieldLabel="Part Number / SKU Code"
        onScan={(scannedCode, meta) => {
          setCode(scannedCode);
          if (meta?.name && !name) setName(meta.name);
          if (meta?.category && !category) setCategory(meta.category);
          showToast(`Scanned SKU inserted: ${scannedCode}`, 'success');
        }}
      />
    </div>
  );
}

export default function CreateStockPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-8 text-neutral-500 text-xs">
          Loading inventory form...
        </div>
      }
    >
      <CreateStockForm />
    </Suspense>
  );
}

