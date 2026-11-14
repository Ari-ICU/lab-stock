'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Header } from '@/components/Header';
import { useStock } from '@/context/StockContext';
import { useAuth } from '@/context/AuthContext';
import { ImageUpload } from '@/components/ImageUpload';
import { Dropdown } from '@/components/Dropdown';
import { NumberInput } from '@/components/NumberInput';
import { buildStockCategoryOptions } from '@/lib/categories';
import {
  Save,
  Cable,
  Hash,
  Layers,
} from 'lucide-react';

const statusOptions = [
  { label: 'In Stock', value: 'in_stock' },
  { label: 'Low Stock', value: 'low_stock' },
  { label: 'Out of Stock', value: 'out_of_stock' },
];

function CreateStockForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { addStockItem, stock, categories, locations, showToast } = useStock();
  const { user, canManageLocation } = useAuth();

  const categoryOptions = React.useMemo(
    () => buildStockCategoryOptions(stock, categories),
    [stock, categories]
  );

  // Default Admins to Unassigned central inventory so units can be split across rooms via Assign to Room;
  // scoped non-admin users default to their first manageable room.
  const managedLocations = locations.filter((loc) => canManageLocation(`${loc.name} (${loc.room})`));
  const depotFirst = managedLocations.find((loc) => loc.type === 'STORAGE') || managedLocations[0];
  const defaultLocation = canManageLocation('Unassigned')
    ? 'Unassigned'
    : depotFirst
      ? `${depotFirst.name} (${depotFirst.room})`
      : 'Unassigned';

  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [category, setCategory] = useState('');
  const [quantity, setQuantity] = useState(10);
  const [unit, setUnit] = useState('Units');
  const [status, setStatus] = useState<'in_stock' | 'low_stock' | 'out_of_stock'>('in_stock');
  const [expiryDate, setExpiryDate] = useState('Active');
  const [imageUrl, setImageUrl] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const paramLocation = searchParams.get('location') || '';
  const activeLocation = paramLocation || defaultLocation;

  // Sync incoming search query parameters (e.g. from Barcode/QR Scanner modal or Location details)
  useEffect(() => {
    const paramCode = searchParams.get('code');
    const paramName = searchParams.get('name');
    const paramCategory = searchParams.get('category');
    if (paramCode) setCode(paramCode);
    if (paramName) setName(paramName);
    if (paramCategory) setCategory(paramCategory);
  }, [searchParams]);

  const handleGenerateSKU = () => {
    const cleanCat = category.replace(/[^a-zA-Z0-9]/g, '');
    const prefix = (cleanCat.substring(0, 3) || 'ITM').toUpperCase();
    const rand = Math.floor(1000 + Math.random() * 9000);
    setCode(`STK-${prefix}-${rand}`);
    showToast('Generated item SKU / Part Code', 'success');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!canManageLocation(activeLocation)) {
      showToast(`You can only register items within your assigned laboratories (${user?.assignedLabs?.join(', ') || 'None assigned'})`, 'warning');
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
    if (!category.trim()) {
      showToast('Please enter a category', 'warning');
      return;
    }

    setIsSubmitting(true);

    try {
      addStockItem({
        name: name.trim(),
        code: code.trim().toUpperCase(),
        category: category.trim(),
        quantity: Number(quantity) || 0,
        unit: unit.trim() || 'Units',
        location: activeLocation.trim(),
        rack: '',
        status,
        expiryDate: expiryDate.trim() || 'Active',
        imageUrl: imageUrl.trim() || undefined,
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
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-neutral-200 text-neutral-700 hover:bg-neutral-50 rounded-xl text-xs font-medium transition-colors"
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
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-neutral-900 hover:bg-neutral-800 disabled:bg-neutral-400 text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer shadow-xs"
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
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Column: Item Details */}
            <div className="lg:col-span-8 space-y-6">
              <div className="bg-white border border-neutral-200/80 rounded-2xl p-5 sm:p-6 shadow-2xs space-y-4">
                <div className="flex items-center gap-2 border-b border-neutral-100 pb-3">
                  <Cable className="w-4 h-4 text-neutral-700" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-900">
                    Primary Inventory Information
                  </h3>
                </div>

                <div className="space-y-4 pt-1">
                  {/* Item Name */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-neutral-900">
                      Item / Equipment Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Double A A4 80gsm Copy Paper"
                      className="w-full bg-white border border-neutral-300 text-neutral-900 text-xs px-3 py-2 rounded-xl focus:outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 transition-colors"
                    />
                  </div>

                  {/* SKU / Part Code */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-neutral-900">
                        Part Number / SKU Code <span className="text-rose-500">*</span>
                      </label>
                      <button
                        type="button"
                        onClick={handleGenerateSKU}
                        className="text-[11px] text-neutral-600 hover:text-neutral-900 font-medium hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <Hash className="w-3 h-3" />
                        Generate SKU
                      </button>
                    </div>
                    <input
                      type="text"
                      required
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      placeholder="e.g. CAB-102B-CAT6A"
                      className="w-full bg-white border border-neutral-300 text-neutral-900 text-xs font-mono uppercase px-3 py-2 rounded-xl focus:outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 transition-colors"
                    />
                  </div>

                  {/* Category & Status */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold text-neutral-900">
                        Category <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        list="stock-category-suggestions"
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        placeholder="e.g. Networking, Stationery, Printer Ink"
                        className="w-full bg-white border border-neutral-300 text-neutral-900 text-xs px-3 py-2 rounded-xl focus:outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 transition-colors"
                      />
                      <datalist id="stock-category-suggestions">
                        {categoryOptions.map((opt) => (
                          <option key={opt.value} value={opt.value} />
                        ))}
                      </datalist>
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold text-neutral-900">Stock Availability</label>
                      <Dropdown
                        value={status}
                        options={statusOptions}
                        onChange={(val) => setStatus(val as 'in_stock' | 'low_stock' | 'out_of_stock')}
                        placeholder="Select Status"
                        buttonClassName="rounded-xl py-2"
                      />
                    </div>
                  </div>

                  {/* Quantity & Unit Type */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold text-neutral-900">
                        Quantity in Stock <span className="text-rose-500">*</span>
                      </label>
                      <NumberInput
                        min={0}
                        required
                        value={quantity}
                        onChange={(val) => {
                          setQuantity(val);
                          if (val === 0) setStatus('out_of_stock');
                          else if (val <= 5) setStatus('low_stock');
                          else setStatus('in_stock');
                        }}
                        className="w-full bg-white border border-neutral-300 text-neutral-900 text-xs font-mono px-3 py-2 rounded-xl focus:outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 transition-colors"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold text-neutral-900">Unit Type</label>
                      <input
                        type="text"
                        value={unit}
                        onChange={(e) => setUnit(e.target.value)}
                        placeholder="e.g. Units, Pieces, Boxes, Reams"
                        className="w-full bg-white border border-neutral-300 text-neutral-900 text-xs px-3 py-2 rounded-xl focus:outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 transition-colors"
                      />
                    </div>
                  </div>

                  {/* Warranty / Note */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-neutral-900">
                      Warranty / Inspection Note
                    </label>
                    <input
                      type="text"
                      value={expiryDate}
                      onChange={(e) => setExpiryDate(e.target.value)}
                      placeholder="e.g. Warranty 2027 or Active"
                      className="w-full bg-white border border-neutral-300 text-neutral-900 text-xs px-3 py-2 rounded-xl focus:outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 transition-colors"
                    />
                  </div>

                  {/* Description */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-neutral-900">
                      Technical Description & Deployment Notes
                    </label>
                    <textarea
                      rows={3}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Specify cable lengths, pinout standards, compatibility notes, or lab storage procedures..."
                      className="w-full bg-white border border-neutral-300 text-neutral-900 text-xs px-3 py-2 rounded-xl focus:outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 transition-colors leading-relaxed"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Image Upload */}
            <div className="lg:col-span-4 space-y-6">
              <div className="bg-white border border-neutral-200/80 rounded-2xl p-5 sm:p-6 shadow-2xs space-y-4">
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
            </div>
          </div>
        </form>
      </div>
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

