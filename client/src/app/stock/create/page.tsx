'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/Header';
import { useStock } from '@/context/StockContext';
import { ImageUpload } from '@/components/ImageUpload';
import { Dropdown } from '@/components/Dropdown';
import {
  ArrowLeft,
  Save,
  Sparkles,
  Cable,
  CheckCircle2,
  MapPin,
  Tag,
  Hash,
  Layers,
  FileText,
  AlertCircle,
  HelpCircle,
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

const PRESETS = [
  {
    name: 'Dell 24" FHD IPS Monitors (Student Benches 1-24)',
    code: 'MON-102B-P2419H',
    category: 'Monitors',
    quantity: 24,
    unit: 'Units',
    location: 'Computer Lab Rm 102B',
    rack: 'Student Benches 1-24',
    expiryDate: 'Warranty 2027',
    imageUrl: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=600&q=80',
    description: '24-inch Full HD 1080p IPS Dell display monitors connected to the 24 student desktop towers via DisplayPort.',
  },
  {
    name: 'Dell Optical USB Mice (Lab In-Use + Spares)',
    code: 'MS-102B-MS116',
    category: 'Mice & Keyboards',
    quantity: 28,
    unit: 'Pieces',
    location: 'Computer Lab Rm 102B',
    rack: 'Benches & Shelf SHF-01',
    expiryDate: 'Active',
    imageUrl: 'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?auto=format&fit=crop&w=600&q=80',
    description: 'Standard Dell wired USB optical scroll mice (24 deployed on desks + 4 spare in shelf).',
  },
  {
    name: 'Cat6A UTP 2m RJ45 Blue Patch Cords',
    code: 'CAB-102B-CAT6A',
    category: 'Cables & Accessories',
    quantity: 28,
    unit: 'Cables',
    location: 'Computer Lab Rm 102B',
    rack: 'Desk Outlets to PCs',
    expiryDate: 'Active',
    imageUrl: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&w=600&q=80',
    description: 'High-speed 10Gbps factory-crimped Cat6A patch cords connecting student bench RJ45 jacks to workstation NICs.',
  },
  {
    name: '8-Outlet Bench Power Strips / Surge Protectors',
    code: 'PMR-102B-PDU-8',
    category: 'Power & Climate',
    quantity: 6,
    unit: 'Units',
    location: 'Computer Lab Rm 102B',
    rack: 'Under-Bench Cable Trays',
    expiryDate: 'Active',
    imageUrl: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=600&q=80',
    description: 'Heavy duty grounded 8-way power distribution units mounted under student bench cable management channels.',
  },
  {
    name: 'Cisco Console RJ45 to DB9 Rollover Cables',
    code: 'CAB-206-CONS',
    category: 'Cables & Accessories',
    quantity: 12,
    unit: 'Cables',
    location: 'Network & Systems Lab Rm 206',
    rack: 'Lab 206 Router Benches',
    expiryDate: 'Active',
    imageUrl: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&w=600&q=80',
    description: 'Serial console rollover cables for out-of-band management configuration of Cisco switches and routers.',
  },
];

export default function CreateStockPage() {
  const router = useRouter();
  const { addStockItem, locations, showToast } = useStock();

  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [category, setCategory] = useState('Cables & Accessories');
  const [quantity, setQuantity] = useState(10);
  const [unit, setUnit] = useState('Units');
  const [location, setLocation] = useState(
    locations.length > 0 ? `${locations[0].name} (${locations[0].room})` : 'Computer Lab Rm 102B'
  );
  const [rack, setRack] = useState('');
  const [status, setStatus] = useState<'in_stock' | 'low_stock' | 'out_of_stock'>('in_stock');
  const [expiryDate, setExpiryDate] = useState('Active');
  const [imageUrl, setImageUrl] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const locationOptions = locations.map((loc) => ({
    label: `${loc.name} (${loc.room})`,
    value: `${loc.name} (${loc.room})`,
  }));

  const handleApplyPreset = (preset: typeof PRESETS[0]) => {
    setName(preset.name);
    setCode(preset.code);
    setCategory(preset.category);
    setQuantity(preset.quantity);
    setUnit(preset.unit);
    setLocation(preset.location);
    setRack(preset.rack);
    setExpiryDate(preset.expiryDate);
    setImageUrl(preset.imageUrl);
    setDescription(preset.description);
    setStatus(preset.quantity > 5 ? 'in_stock' : preset.quantity > 0 ? 'low_stock' : 'out_of_stock');
    showToast(`Applied preset for ${preset.name}`, 'info');
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
        router.push(`/stock/${created.id}`);
      }, 250);
    } catch {
      showToast('Failed to register stock item', 'error');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-neutral-50/50">
      <Header
        title="Add Inventory & Stock Item"
        subtitle="Multi-Lab Consumables, Cables & Equipment Stock"
        backHref="/stock"
        backLabel="Stock"
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

      <div className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-6 max-w-5xl w-full mx-auto">
        {/* Quick Presets Carousel / Cards */}
        <div className="bg-white border border-neutral-200 rounded p-4 sm:p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-900">
                Quick Item Presets
              </h2>
            </div>
            <span className="text-[11px] text-neutral-400">
              Click any template to auto-populate fields
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 pt-1">
            {PRESETS.map((p, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleApplyPreset(p)}
                className="text-left p-3 rounded border border-neutral-200 hover:border-neutral-900 hover:bg-neutral-50 transition-colors flex flex-col justify-between group"
              >
                <div>
                  <div className="text-xs font-semibold text-neutral-900 group-hover:text-emerald-700 transition-colors line-clamp-1">
                    {p.name}
                  </div>
                  <div className="text-[11px] text-neutral-500 font-mono mt-0.5">
                    {p.code} • {p.quantity} {p.unit}
                  </div>
                </div>
                <div className="flex items-center gap-1.5 mt-2 text-[10px] text-neutral-400">
                  <Tag className="w-3 h-3" />
                  <span>{p.category}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Main Creation Form */}
        <form id="new-stock-form" onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left 2 Cols: Item Details */}
            <div className="lg:col-span-2 space-y-6">
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
                      <span className="text-[11px] text-neutral-400 font-normal">e.g. Cat6A Patch Cord</span>
                    </label>
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
                    <div className="relative">
                      <input
                        type="text"
                        required
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                        placeholder="e.g. CAB-102B-CAT6A"
                        className="w-full bg-white border border-neutral-300 text-neutral-900 text-xs font-mono uppercase px-3 py-2 rounded focus:outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 transition-colors"
                      />
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
            <div className="space-y-6">
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
    </div>
  );
}

