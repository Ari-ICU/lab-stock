'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Header } from '@/components/Header';
import { useStock } from '@/context/StockContext';
import { useAuth } from '@/context/AuthContext';
import { ImageUpload } from '@/components/ImageUpload';
import { Dropdown } from '@/components/Dropdown';
import { LoadingScreen } from '@/components/LoadingScreen';
import { buildStockCategoryOptions } from '@/lib/categories';
import {
  ArrowLeft,
  Save,
  RotateCcw,
  Trash2,
  AlertTriangle,
  Cable,
  MapPin,
  Hash,
  Layers,
  Shield,
} from 'lucide-react';

const statusOptions = [
  { label: 'In Stock', value: 'in_stock' },
  { label: 'Low Stock', value: 'low_stock' },
  { label: 'Out of Stock', value: 'out_of_stock' },
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

export default function EditStockClient({ id: propId }: { id?: string }) {
  const params = useParams();
  const router = useRouter();
  const id = propId || (params?.id as string);

  const { stock, categories, createCategory, updateStockItem, deleteStockItem, locations, showToast, isLoading } = useStock();
  const { user, canManageLocation } = useAuth();

  const categoryOptions = React.useMemo(
    () => buildStockCategoryOptions(stock, categories),
    [stock, categories]
  );

  const item = stock.find((s) => s.id === id);
  const isAllowed = item ? canManageLocation(item.location) : false;

  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [category, setCategory] = useState('Cables & Accessories');
  const [quantity, setQuantity] = useState(0);
  const [unit, setUnit] = useState('Units');
  const [location, setLocation] = useState('Computer Lab Room 102B');
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
      setLocation(item.location || 'Computer Lab Room 102B');
      setRack(item.rack || '');
      setStatus(item.status || 'in_stock');
      setExpiryDate(item.expiryDate || 'Active');
      setImageUrl(item.imageUrl || '');
      setDescription(item.description || '');
    }
  }, [item]);

  if (!item && isLoading) {
    return <LoadingScreen message="Loading stock item editor..." />;
  }

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

  // Enforce laboratory room management scope
  if (!isAllowed) {
    return (
      <div className="flex-1 flex flex-col min-w-0">
        <Header
          title={`Restricted Scope: ${item.name}`}
          subtitle={`Stationed in ${item.location}`}
          showExport={false}
          backHref={`/stock/${item.id}`}
          backLabel="Back to Item"
        />
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="bg-white border border-neutral-200 rounded-lg p-8 max-w-lg w-full text-center space-y-4 shadow-sm">
            <div className="w-12 h-12 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center mx-auto text-amber-600">
              <Shield className="w-6 h-6" />
            </div>
            <h2 className="text-base font-bold text-neutral-900">Restricted Laboratory Scope</h2>
            <p className="text-xs text-neutral-600 leading-relaxed">
              This inventory item is stored in <span className="font-semibold text-neutral-800">{item.location}</span>. Your account ({user?.role}) is assigned to manage: <span className="font-semibold text-neutral-800">{user?.assignedLabs?.join(', ') || 'Room 102B, Room 206'}</span>.
            </p>
            <p className="text-xs text-neutral-500">
              Modifications and deletions are restricted to operators assigned to this laboratory. Universal access is strictly reserved for Primary Lab Administrators.
            </p>
            <div className="pt-2 flex justify-center gap-3">
              <Link
                href={`/stock/${item.id}`}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded transition-colors"
              >
                View Item Details
              </Link>
              <Link
                href="/stock"
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-neutral-900 hover:bg-neutral-800 rounded transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Return to Stock Directory
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Only allow selecting locations the user is authorized to manage (unless administrator)
  const managedLocations = locations.filter((loc) => canManageLocation(`${loc.name} (${loc.room})`));
  const locationOptions = (managedLocations.length > 0 ? managedLocations : locations).map((loc) => ({
    label: `${loc.name} (${loc.room})`,
    value: `${loc.name} (${loc.room})`,
  }));

  const handleReset = () => {
    setName(item.name || '');
    setCode(item.code || '');
    setCategory(item.category || 'Cables & Accessories');
    setQuantity(item.quantity ?? 0);
    setUnit(item.unit || 'Units');
    setLocation(item.location || 'Computer Lab Room 102B');
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

    if (!isAllowed) {
      showToast('You do not have permission to modify inventory stored in this lab', 'error');
      return;
    }

    if (!canManageLocation(location)) {
      showToast(`You cannot move this item to "${location}". Your assigned labs: ${user?.assignedLabs?.join(', ') || 'Room 102B, Room 206'}`, 'warning');
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
        router.push('/stock');
      }, 250);
    } catch {
      showToast('Failed to save changes', 'error');
      setIsSubmitting(false);
    }
  };

  const handleDelete = () => {
    if (!isAllowed) {
      showToast('You do not have permission to delete inventory stored in this lab', 'error');
      return;
    }
    deleteStockItem(item.id);
    router.push('/stock');
  };

  return (
    <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-neutral-50/50">
      <Header
        title={`Edit ${item.name}`}
        subtitle={`SKU: ${item.code} • ${item.location}`}
        backHref={`/stock/${item.id}`}
        backLabel="Item Details"
        showExport={false}
        actions={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 bg-white border border-neutral-200 text-neutral-700 hover:bg-neutral-50 rounded text-xs font-medium transition-colors cursor-pointer"
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

            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-white border border-neutral-200 hover:border-rose-300 hover:bg-rose-50 text-rose-700 rounded text-xs font-medium transition-colors cursor-pointer"
              title="Delete item"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Delete</span>
            </button>
          </div>
        }
      />

      <div className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-6 w-full">
        <form id="edit-stock-form" onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Column: Form Fields */}
            <div className="lg:col-span-8 xl:col-span-8 2xl:col-span-9 space-y-6">
              {/* Inventory Information */}
              <div className="bg-white border border-neutral-200/80 rounded-2xl p-5 sm:p-6 shadow-2xs space-y-5">
                <div className="flex items-center gap-2 border-b border-neutral-100 pb-3">
                  <Cable className="w-4 h-4 text-neutral-700" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-900">
                    Inventory Information
                  </h3>
                </div>

                <div className="space-y-4">
                  {/* Name */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-neutral-900">
                      Item Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Cat6A UTP 2m RJ45 Blue Patch Cords"
                      className="w-full bg-white border border-neutral-300 text-neutral-900 text-xs px-3 py-2 rounded-xl focus:outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 transition-colors placeholder:text-neutral-400"
                    />
                  </div>

                  {/* SKU / Part Code & Category */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-semibold text-neutral-900">
                          Part Number / SKU <span className="text-rose-500">*</span>
                        </label>
                        <button
                          type="button"
                          onClick={handleGenerateSKU}
                          className="text-[11px] text-emerald-700 hover:text-emerald-800 font-semibold flex items-center gap-1 cursor-pointer"
                        >
                          <Hash className="w-3 h-3" />
                          <span>Generate SKU</span>
                        </button>
                      </div>
                      <input
                        type="text"
                        required
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                        placeholder="e.g. CAB-102B-CAT6A"
                        className="w-full bg-white border border-neutral-300 text-neutral-900 text-xs font-mono uppercase px-3 py-2 rounded-xl focus:outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 transition-colors placeholder:text-neutral-400"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold text-neutral-900">
                        Category
                      </label>
                      <Dropdown
                        value={category}
                        options={categoryOptions}
                        onChange={(val) => {
                          setCategory(val);
                          if (!categoryOptions.some((o) => o.value.toLowerCase() === val.toLowerCase())) {
                            void createCategory(val);
                          }
                        }}
                        allowCustom
                        searchPlaceholder="Search or type new category..."
                        placeholder="Select Category"
                        buttonClassName="rounded-xl py-2"
                      />
                    </div>
                  </div>

                  {/* Quantity, Unit Type & Stock Availability */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold text-neutral-900">
                        Quantity in Stock <span className="text-rose-500">*</span>
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
                        className="w-full bg-white border border-neutral-300 text-neutral-900 text-xs font-mono px-3 py-2 rounded-xl focus:outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 transition-colors"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold text-neutral-900">
                        Unit Type
                      </label>
                      <Dropdown
                        value={unit}
                        options={unitOptions}
                        onChange={setUnit}
                        placeholder="Select Unit"
                        buttonClassName="rounded-xl py-2"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold text-neutral-900">
                        Availability Status
                      </label>
                      <Dropdown
                        value={status}
                        options={statusOptions}
                        onChange={(val) => setStatus(val as 'in_stock' | 'low_stock' | 'out_of_stock')}
                        placeholder="Select Status"
                        buttonClassName="rounded-xl py-2"
                      />
                    </div>
                  </div>

                  {/* Warranty / Inspection Note */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-neutral-900">
                      Warranty / Inspection Note
                    </label>
                    <input
                      type="text"
                      value={expiryDate}
                      onChange={(e) => setExpiryDate(e.target.value)}
                      placeholder="e.g. Warranty 2027 or Active"
                      className="w-full bg-white border border-neutral-300 text-neutral-900 text-xs px-3 py-2 rounded-xl focus:outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 transition-colors placeholder:text-neutral-400"
                    />
                  </div>

                  {/* Description */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-neutral-900">
                      Technical Description &amp; Lab Notes
                    </label>
                    <textarea
                      rows={3}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Specify cable pinouts, compatibility, or lab storage procedures..."
                      className="w-full bg-white border border-neutral-300 text-neutral-900 text-xs px-3 py-2.5 rounded-xl focus:outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 transition-colors leading-relaxed placeholder:text-neutral-400"
                    />
                  </div>
                </div>
              </div>

              {/* Location & Storage Details */}
              <div className="bg-white border border-neutral-200/80 rounded-2xl p-5 sm:p-6 shadow-2xs space-y-4">
                <div className="flex items-center gap-2 border-b border-neutral-100 pb-3">
                  <MapPin className="w-4 h-4 text-neutral-700" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-900">
                    Location &amp; Shelf Placement
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-neutral-900">
                      Assigned Laboratory Room
                    </label>
                    <Dropdown
                      value={location}
                      options={locationOptions}
                      onChange={setLocation}
                      placeholder="Select Lab Room"
                      buttonClassName="rounded-xl py-2"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-neutral-900">
                      Shelf / Cabinet / Bin
                    </label>
                    <input
                      type="text"
                      value={rack}
                      onChange={(e) => setRack(e.target.value)}
                      placeholder="e.g. Benches & Shelf SHF-01"
                      className="w-full bg-white border border-neutral-300 text-neutral-900 text-xs px-3 py-2 rounded-xl focus:outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 transition-colors placeholder:text-neutral-400"
                    />
                  </div>
                </div>
              </div>

              {/* Bottom Form Footer */}
              <div className="flex items-center justify-end gap-2.5">
                <Link
                  href={`/stock/${item.id}`}
                  className="px-4 py-2 bg-white hover:bg-neutral-50 border border-neutral-200 text-neutral-700 text-xs font-medium rounded-lg transition-colors"
                >
                  Cancel
                </Link>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-1.5 px-5 py-2 bg-neutral-900 hover:bg-neutral-800 disabled:bg-neutral-400 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer shadow-xs"
                >
                  <Save className="w-3.5 h-3.5 text-neutral-300" />
                  <span>{isSubmitting ? 'Saving...' : 'Save Changes'}</span>
                </button>
              </div>
            </div>

            {/* Right Column: Product Image */}
            <div className="lg:col-span-4 xl:col-span-4 2xl:col-span-3 space-y-6">
              <div className="bg-white border border-neutral-200/80 rounded-2xl p-5 shadow-2xs space-y-4">
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

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-neutral-200 max-w-md w-full p-6 space-y-4 shadow-xl">
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
                className="px-3 py-1.5 rounded-lg text-xs font-medium border border-neutral-200 text-neutral-700 hover:bg-neutral-50 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white transition-colors cursor-pointer"
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

