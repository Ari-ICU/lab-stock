'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Header } from '@/components/Header';
import { useStock } from '@/context/StockContext';
import { ImageUpload } from '@/components/ImageUpload';
import { Dropdown } from '@/components/Dropdown';
import {
  ArrowLeft,
  Save,
  RotateCcw,
  Trash2,
  AlertTriangle,
  Cable,
  MapPin,
  Tag,
  Hash,
  Layers,
  FileText,
  HelpCircle,
  Eye,
} from 'lucide-react';

const statusOptions = [
  { label: 'In Stock (Available in quantity)', value: 'in_stock' },
  { label: 'Low Stock (Replenishment suggested)', value: 'low_stock' },
  { label: 'Out of Stock (Zero count)', value: 'out_of_stock' },
];

const categoryOptions = [
  { label: 'Monitors & Displays', value: 'Monitors' },
  { label: 'Mice & Keyboards', value: 'Mice & Keyboards' },
  { label: 'Cables & Accessories', value: 'Cables & Accessories' },
  { label: 'Power & Climate', value: 'Power & Climate' },
  { label: 'Network Spares & Transceivers', value: 'Network Spares' },
  { label: 'Tools & Lab Consumables', value: 'Tools & Consumables' },
];

const unitOptions = [
  { label: 'Units', value: 'Units' },
  { label: 'Pieces', value: 'Pieces' },
  { label: 'Cables', value: 'Cables' },
  { label: 'Kits', value: 'Kits' },
  { label: 'Rolls', value: 'Rolls' },
  { label: 'Boxes', value: 'Boxes' },
];

export default function EditStockClient({ id: propId }: { id?: string }) {
  const params = useParams();
  const router = useRouter();
  const id = propId || (params?.id as string);

  const { stock, updateStockItem, deleteStockItem, locations, showToast } = useStock();

  const item = stock.find((s) => s.id === id);

  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [category, setCategory] = useState('Cables & Accessories');
  const [quantity, setQuantity] = useState(0);
  const [unit, setUnit] = useState('Units');
  const [location, setLocation] = useState('Computer Lab Rm 102B');
  const [rack, setRack] = useState('');
  const [status, setStatus] = useState<'in_stock' | 'low_stock' | 'out_of_stock'>('in_stock');
  const [expiryDate, setExpiryDate] = useState('Active');
  const [imageUrl, setImageUrl] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (item) {
      setName(item.name || '');
      setCode(item.code || '');
      setCategory(item.category || 'Cables & Accessories');
      setQuantity(item.quantity ?? 0);
      setUnit(item.unit || 'Units');
      setLocation(item.location || 'Computer Lab Rm 102B');
      setRack(item.rack || '');
      setStatus(item.status || 'in_stock');
      setExpiryDate(item.expiryDate || 'Active');
      setImageUrl(item.imageUrl || '');
      setDescription(item.description || '');
    }
  }, [item]);

  if (!item) {
    return (
      <div className="flex-1 flex flex-col min-w-0">
        <Header
          title="Stock Item Not Found"
          subtitle="Inventory Directory"
          showExport={false}
          actionLabel="All Stock Items"
          onAction={() => router.push('/stock')}
        />
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="bg-white border border-neutral-200 rounded-lg p-8 max-w-md w-full text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-neutral-100 flex items-center justify-center mx-auto text-neutral-500">
              <AlertTriangle className="w-6 h-6 text-amber-600" />
            </div>
            <h2 className="text-base font-bold text-neutral-900">Inventory Item Not Found</h2>
            <p className="text-xs text-neutral-500">
              The item with ID <span className="font-mono font-semibold text-neutral-800">{id}</span> does not exist or has been removed.
            </p>
            <Link
              href="/stock"
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-neutral-900 rounded hover:bg-neutral-800 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Return to Stock Directory
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const locationOptions = locations.map((loc) => ({
    label: `${loc.name} (${loc.room})`,
    value: `${loc.name} (${loc.room})`,
  }));

  const handleReset = () => {
    setName(item.name || '');
    setCode(item.code || '');
    setCategory(item.category || 'Cables & Accessories');
    setQuantity(item.quantity ?? 0);
    setUnit(item.unit || 'Units');
    setLocation(item.location || 'Computer Lab Rm 102B');
    setRack(item.rack || '');
    setStatus(item.status || 'in_stock');
    setExpiryDate(item.expiryDate || 'Active');
    setImageUrl(item.imageUrl || '');
    setDescription(item.description || '');
    showToast('Form reset to saved values', 'info');
  };

  const handleGenerateSKU = () => {
    const prefix = category.substring(0, 3).toUpperCase();
    const rand = Math.floor(1000 + Math.random() * 9000);
    setCode(`STK-${prefix}-${rand}`);
    showToast('Generated item SKU / Part Code', 'success');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

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
      updateStockItem({
        id: item.id,
        name: name.trim(),
        code: code.trim().toUpperCase(),
        category: category.trim() || 'General Inventory',
        quantity: Number(quantity) || 0,
        unit: unit.trim() || 'Units',
        location: location.trim(),
        rack: rack.trim() || 'Storage Shelf',
        status,
        expiryDate: expiryDate.trim() || 'Active',
        imageUrl: imageUrl.trim(),
        description: description.trim(),
      });

      setTimeout(() => {
        router.push(`/stock/${item.id}`);
      }, 250);
    } catch {
      showToast('Failed to save changes', 'error');
      setIsSubmitting(false);
    }
  };

  const handleDelete = () => {
    deleteStockItem(item.id);
    router.push('/stock');
  };

  return (
    <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-neutral-50/50">
      <Header
        title={`Edit ${item.name}`}
        subtitle={`SKU: ${item.code} • ${item.location}`}
        backHref={`/stock/${item.id}`}
        backLabel="Details"
        showExport={false}
        actions={
          <div className="flex items-center gap-2">
            <Link
              href={`/stock/${item.id}`}
              className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 bg-white border border-neutral-200 text-neutral-700 hover:bg-neutral-50 rounded text-xs font-medium transition-colors"
            >
              Cancel
            </Link>

            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 bg-white border border-neutral-200 text-neutral-700 hover:bg-neutral-50 rounded text-xs font-medium transition-colors"
              title="Reset to saved values"
            >
              <RotateCcw className="w-3.5 h-3.5 text-neutral-500" />
              <span className="hidden sm:inline">Reset</span>
            </button>

            <button
              type="button"
              onClick={() => {
                const form = document.getElementById('edit-stock-form') as HTMLFormElement;
                if (form) form.requestSubmit();
              }}
              disabled={isSubmitting}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-neutral-900 hover:bg-neutral-800 disabled:bg-neutral-400 text-white rounded text-xs font-semibold transition-colors cursor-pointer shadow-xs"
            >
              <Save className="w-3.5 h-3.5 text-neutral-300" />
              <span>{isSubmitting ? 'Saving...' : 'Save Changes'}</span>
            </button>
          </div>
        }
      />

      <div className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-6 max-w-5xl w-full mx-auto">
        <form id="edit-stock-form" onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left 2 Cols: Form fields */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Core Details */}
              <div className="bg-white border border-neutral-200 rounded p-5 sm:p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
                  <div className="flex items-center gap-2">
                    <Cable className="w-4 h-4 text-neutral-700" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-900">
                      Inventory Information
                    </h3>
                  </div>
                  <span className="text-[11px] font-mono text-neutral-400">ID: {item.id}</span>
                </div>

                <div className="space-y-4 pt-1">
                  {/* Name */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-neutral-900">Item Name *</label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Cat6A UTP 2m RJ45 Blue Patch Cords"
                      className="w-full bg-white border border-neutral-300 text-neutral-900 text-xs px-3 py-2 rounded focus:outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 transition-colors"
                    />
                  </div>

                  {/* SKU / Part Code */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-neutral-900 flex items-center justify-between">
                      <span>Part Number / SKU Code *</span>
                      <button
                        type="button"
                        onClick={handleGenerateSKU}
                        className="text-[11px] text-emerald-700 hover:text-emerald-800 font-medium hover:underline flex items-center gap-1"
                      >
                        <Hash className="w-3 h-3" />
                        Generate SKU
                      </button>
                    </label>
                    <input
                      type="text"
                      required
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      placeholder="e.g. CAB-102B-CAT6A"
                      className="w-full bg-white border border-neutral-300 text-neutral-900 text-xs font-mono uppercase px-3 py-2 rounded focus:outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 transition-colors"
                    />
                  </div>

                  {/* Category & Status */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-neutral-900">Category</label>
                      <Dropdown
                        value={category}
                        options={categoryOptions}
                        onChange={setCategory}
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
                      placeholder="Specify cable pinouts, compatibility, or lab storage procedures..."
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

            {/* Right Column: Visual & Save Card */}
            <div className="space-y-6">
              <div className="bg-white border border-neutral-200 rounded p-5 sm:p-6 space-y-4">
                <div className="flex items-center gap-2 border-b border-neutral-100 pb-3">
                  <Layers className="w-4 h-4 text-neutral-700" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-900">
                    Product Image
                  </h3>
                </div>

                <ImageUpload
                  value={imageUrl}
                  onChange={setImageUrl}
                  label="Upload or Paste Photo URL"
                />
              </div>

              {/* Actions / Danger Zone */}
              <div className="bg-white border border-neutral-200 rounded p-5 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-900">
                  Update Actions
                </h4>

                <div className="pt-1 space-y-2">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-neutral-900 hover:bg-neutral-800 disabled:bg-neutral-400 text-white rounded text-xs font-semibold transition-colors cursor-pointer shadow-xs"
                  >
                    <Save className="w-4 h-4 text-neutral-300" />
                    <span>{isSubmitting ? 'Saving...' : 'Save All Changes'}</span>
                  </button>

                  <Link
                    href={`/stock/${item.id}`}
                    className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-white hover:bg-neutral-50 border border-neutral-200 text-neutral-700 rounded text-xs font-medium transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5 text-neutral-500" />
                    <span>View Live Details</span>
                  </Link>

                  <div className="border-t border-neutral-100 pt-3 mt-3">
                    <button
                      type="button"
                      onClick={() => setShowDeleteConfirm(true)}
                      className="w-full flex items-center justify-center gap-2 py-2 px-3 border border-rose-200 text-rose-700 hover:bg-rose-50 rounded text-xs font-medium transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete Item Permanently</span>
                    </button>
                  </div>
                </div>
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
                <h3 className="text-sm font-bold text-neutral-900">Delete Inventory Item</h3>
                <p className="text-xs text-neutral-500">This action cannot be undone.</p>
              </div>
            </div>

            <p className="text-xs text-neutral-600">
              Are you sure you want to permanently delete{' '}
              <span className="font-semibold text-neutral-900">{item.name}</span> ({item.code}) from the inventory records?
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="px-3 py-1.5 rounded text-xs font-medium border border-neutral-200 text-neutral-700 hover:bg-neutral-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="px-3.5 py-1.5 rounded text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white transition-colors"
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

