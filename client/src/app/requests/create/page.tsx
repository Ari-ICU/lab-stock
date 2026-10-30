'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/Header';
import { Dropdown } from '@/components/Dropdown';
import { ImageUpload } from '@/components/ImageUpload';
import { LabThumbnail } from '@/components/LabThumbnail';
import { useStock } from '@/context/StockContext';
import { useAuth } from '@/context/AuthContext';
import { PurchaseRequest } from '@/types';
import {
  ArrowLeft,
  ShoppingCart,
  Plus,
  Building2,
  Tag,
  DollarSign,
  AlertTriangle,
  User,
  Calendar,
  FileText,
  Sparkles,
  CheckCircle2,
  Flame,
  Layers,
  Package,
} from 'lucide-react';

const PRESETS = [
  {
    title: 'Cat6A UTP RJ45 2-Meter Factory Blue Patch Cords (Pack of 50)',
    category: 'Cables & Accessories',
    quantity: 2,
    unit: 'Boxes',
    estimatedCost: '140.00',
    priority: 'high' as const,
    reason: 'Critical restock needed for 24 student workstation benches before upcoming semester exam.',
    imageUrl: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&w=600&q=80',
  },
  {
    title: 'Cisco 10GBASE-SR SFP+ 850nm Optical Transceiver Modules',
    category: 'Networking Equipment',
    quantity: 8,
    unit: 'Units',
    estimatedCost: '320.00',
    priority: 'medium' as const,
    reason: 'Expansion of 10Gbps fiber uplinks between Rack 01 switch and server cluster in Room 206.',
    imageUrl: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=600&q=80',
  },
  {
    title: 'HP LaserJet 05A (CE505A) High-Yield Black Toner Cartridges',
    category: 'Printer Supplies',
    quantity: 4,
    unit: 'Cartridges',
    estimatedCost: '180.00',
    priority: 'urgent' as const,
    reason: 'Department laboratory report printer is showing low toner warning. Needed for student printouts.',
    imageUrl: 'https://images.unsplash.com/photo-1612815154858-60aa4c59eaa6?auto=format&fit=crop&w=600&q=80',
  },
  {
    title: 'iFixit Pro Tech Electronics & Computer Repair Tool Kit',
    category: 'Electronics & Tools',
    quantity: 2,
    unit: 'Kits',
    estimatedCost: '150.00',
    priority: 'medium' as const,
    reason: 'Replacement precision screwdrivers and anti-static wrist straps for hardware maintenance workbench.',
    imageUrl: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80',
  },
];

const CATEGORY_OPTIONS = [
  { label: 'Networking Equipment', value: 'Networking Equipment' },
  { label: 'Cables & Accessories', value: 'Cables & Accessories' },
  { label: 'Computer Hardware', value: 'Computer Hardware' },
  { label: 'Mice & Keyboards', value: 'Mice & Keyboards' },
  { label: 'Monitors & Displays', value: 'Monitors & Displays' },
  { label: 'Electronics & Tools', value: 'Electronics & Tools' },
  { label: 'Printer Supplies', value: 'Printer Supplies' },
  { label: 'Stationery & Misc', value: 'Stationery & Misc' },
];

const UNIT_OPTIONS = [
  { label: 'Units', value: 'Units' },
  { label: 'Boxes', value: 'Boxes' },
  { label: 'Packs', value: 'Packs' },
  { label: 'Rolls', value: 'Rolls' },
  { label: 'Cartridges', value: 'Cartridges' },
  { label: 'Kits', value: 'Kits' },
  { label: 'Spools', value: 'Spools' },
];

export default function CreatePurchaseRequestPage() {
  const router = useRouter();
  const { user, canManageLocation } = useAuth();
  const { locations, addPurchaseRequest, showToast } = useStock();

  const isPrimaryAdmin = user?.role === 'Primary Lab Administrator' || user?.roleBadge === 'Admin';

  const availableRooms = useMemo(() => {
    if (isPrimaryAdmin) {
      return locations.map((l) => l.room);
    }
    if (user?.assignedLabs && user.assignedLabs.length > 0) {
      return user.assignedLabs;
    }
    return ['Room 102B', 'Room 206'];
  }, [isPrimaryAdmin, user, locations]);

  const defaultRoom = availableRooms[0] || 'Room 102B';

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Networking Equipment');
  const [targetRoom, setTargetRoom] = useState(defaultRoom);
  const [quantity, setQuantity] = useState(1);
  const [unit, setUnit] = useState('Units');
  const [estimatedCost, setEstimatedCost] = useState('');
  const [priority, setPriority] = useState<PurchaseRequest['priority']>('medium');
  const [reason, setReason] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [notes, setNotes] = useState('');

  const applyPreset = (preset: typeof PRESETS[0]) => {
    setTitle(preset.title);
    setCategory(preset.category);
    setQuantity(preset.quantity);
    setUnit(preset.unit);
    setEstimatedCost(preset.estimatedCost);
    setPriority(preset.priority);
    setReason(preset.reason);
    if (preset.imageUrl) {
      setImageUrl(preset.imageUrl);
    }
    showToast(`Loaded preset template: ${preset.title.slice(0, 32)}...`);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      showToast('Please enter an item name or description.', 'error');
      return;
    }
    if (!reason.trim()) {
      showToast('Please provide a justification for this purchase requisition.', 'error');
      return;
    }

    if (!canManageLocation(targetRoom)) {
      showToast(`Action restricted: ${targetRoom} is outside your laboratory supervisory scope.`, 'error');
      return;
    }

    const newReq = addPurchaseRequest({
      title: title.trim(),
      category,
      targetRoom,
      quantity: Number(quantity) || 1,
      unit,
      estimatedCost: estimatedCost ? (estimatedCost.startsWith('$') ? estimatedCost : `$${estimatedCost}`) : undefined,
      priority,
      reason: reason.trim(),
      requestedBy: user?.name || 'Thoeurn Ratha',
      requesterRole: user?.roleBadge || user?.role || 'Faculty Lecturer',
      imageUrl: imageUrl.trim() || undefined,
      notes: notes.trim() || undefined,
    });

    router.push(`/requests/${newReq.id}`);
  };

  return (
    <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-neutral-50/50">
      {/* Top Header with Back Navigation & Action Controls (matching Assets & Inventory style) */}
      <Header
        title="Create Purchase Requisition"
        subtitle="Note Request to Buy Laboratory Supplies, Equipment, or Consumables"
        backHref="/requests"
        backLabel="Purchase Requests"
        showExport={false}
        actions={
          <div className="flex items-center gap-2">
            <Link
              href="/requests"
              className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 bg-white border border-neutral-200 text-neutral-700 hover:bg-neutral-50 rounded text-xs font-medium transition-colors"
            >
              Cancel
            </Link>
            <button
              type="button"
              onClick={() => {
                const form = document.getElementById('new-request-form') as HTMLFormElement;
                if (form) form.requestSubmit();
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-white rounded text-xs font-semibold transition-colors cursor-pointer shadow-xs"
            >
              <Plus className="w-3.5 h-3.5 text-neutral-300" />
              <span>Submit Requisition</span>
            </button>
          </div>
        }
      />

      <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6 w-full">
        {/* Quick Preset Suggestions (No Breadcrumbs) */}
        <div className="bg-white border border-neutral-200/90 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-emerald-600" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-700">
              Quick Requisition Templates
            </h3>
          </div>
          <p className="text-xs text-neutral-500 mb-3">
            Click any common department item below to pre-fill the procurement requisition form and photo:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {PRESETS.map((preset, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => applyPreset(preset)}
                className="p-3 bg-neutral-50 hover:bg-neutral-100/80 border border-neutral-200/80 hover:border-neutral-400 rounded-xl text-left transition-colors cursor-pointer group flex items-start gap-3"
              >
                <div className="w-12 h-12 rounded-lg border border-neutral-200 bg-white overflow-hidden shrink-0">
                  <LabThumbnail
                    src={preset.imageUrl}
                    alt={preset.title}
                    size="thumb"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-xs text-neutral-900 group-hover:text-emerald-700 transition-colors line-clamp-1">
                    {preset.title}
                  </div>
                  <div className="text-[11px] text-neutral-500 mt-0.5 truncate">
                    {preset.quantity} {preset.unit} • Est. ${preset.estimatedCost}
                  </div>
                  <span className="inline-block mt-1 text-[9px] font-bold uppercase bg-white border border-neutral-200 text-neutral-600 px-1.5 py-0.2 rounded">
                    {preset.priority}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Main Requisition Form: Full-Width 12-Column Responsive Grid */}
        <form id="new-request-form" onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column (8 cols): Primary Specifications */}
          <div className="lg:col-span-8 bg-white border border-neutral-200/90 rounded-2xl p-6 shadow-xs space-y-6">
            <div className="border-b border-neutral-100 pb-4">
              <h2 className="text-sm font-bold text-neutral-900">Requisition Specifications</h2>
              <p className="text-xs text-neutral-500 mt-0.5">
                Specify the exact hardware item, required quantity, target laboratory, and purchase justification.
              </p>
            </div>

            <div className="space-y-4">
              {/* Item Title */}
              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1.5">
                  Item Name / Specification <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Cisco Catalyst C9300 48-Port PoE+ Managed Switch, or Cat6A Patch Cords (Pack of 50)"
                  className="w-full px-3.5 py-2.5 text-xs bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:border-neutral-900 focus:bg-white transition-colors"
                />
              </div>

              {/* Category & Destination Room */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1.5">
                    Category <span className="text-rose-500">*</span>
                  </label>
                  <Dropdown
                    value={category}
                    options={CATEGORY_OPTIONS}
                    onChange={(val) => setCategory(val)}
                    buttonClassName="w-full px-3.5 py-2.5 text-xs bg-neutral-50 border border-neutral-200 rounded-xl hover:border-neutral-400 focus:border-neutral-900 focus:bg-white text-neutral-900 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1.5">
                    Destination Laboratory <span className="text-rose-500">*</span>
                  </label>
                  <Dropdown
                    value={targetRoom}
                    options={availableRooms.map((room) => ({
                      label: `${room}${canManageLocation(room) ? ' (Under Your Management)' : ''}`,
                      value: room,
                    }))}
                    onChange={(val) => setTargetRoom(val)}
                    buttonClassName="w-full px-3.5 py-2.5 text-xs bg-neutral-50 border border-neutral-200 rounded-xl hover:border-neutral-400 focus:border-neutral-900 focus:bg-white text-neutral-900 font-medium"
                  />
                </div>
              </div>

              {/* Quantity, Unit, Estimated Cost */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1.5">
                    Quantity <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={quantity}
                    onChange={(e) => setQuantity(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 text-xs bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:border-neutral-900 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1.5">Unit Packaging</label>
                  <Dropdown
                    value={unit}
                    options={UNIT_OPTIONS}
                    onChange={(val) => setUnit(val)}
                    buttonClassName="w-full px-3.5 py-2.5 text-xs bg-neutral-50 border border-neutral-200 rounded-xl hover:border-neutral-400 focus:border-neutral-900 focus:bg-white text-neutral-900 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1.5">Estimated Unit/Total Cost ($)</label>
                  <div className="relative">
                    <DollarSign className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={estimatedCost}
                      onChange={(e) => setEstimatedCost(e.target.value)}
                      placeholder="150.00"
                      className="w-full pl-8 pr-3.5 py-2.5 text-xs bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:border-neutral-900 focus:bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* Priority / Urgency */}
              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1.5">Urgency / Priority Level</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {[
                    { value: 'low', label: 'Low', desc: 'Routine replenishment', color: 'border-neutral-200' },
                    { value: 'medium', label: 'Medium', desc: 'Standard practical need', color: 'border-blue-200' },
                    { value: 'high', label: 'High', desc: 'Upcoming course exam', color: 'border-amber-200' },
                    { value: 'urgent', label: '🔥 Urgent', desc: 'Lab down / Out of stock', color: 'border-rose-200' },
                  ].map((p) => (
                    <button
                      type="button"
                      key={p.value}
                      onClick={() => setPriority(p.value as PurchaseRequest['priority'])}
                      className={`p-3 text-left rounded-xl border transition-all cursor-pointer ${
                        priority === p.value
                          ? 'bg-neutral-900 text-white border-neutral-900 shadow-xs'
                          : `bg-neutral-50 text-neutral-800 ${p.color} hover:bg-neutral-100/70`
                      }`}
                    >
                      <div className="font-bold text-xs">{p.label}</div>
                      <div className={`text-[10px] mt-0.5 ${priority === p.value ? 'text-neutral-300' : 'text-neutral-500'}`}>
                        {p.desc}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Justification / Reason */}
              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1.5">
                  Academic Justification / Purpose <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows={4}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Explain why this equipment or consumable is required (e.g., student semester exam in Room 102B, hardware expansion, replacing burned patch cables)..."
                  className="w-full px-3.5 py-2.5 text-xs bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:border-neutral-900 focus:bg-white leading-relaxed"
                />
              </div>

              {/* Additional Notes */}
              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1.5">
                  Vendor or Procurement Notes (Optional)
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Preferred vendor: Official Cisco Distributor or Phnom Penh Electronics Depot."
                  className="w-full px-3.5 py-2.5 text-xs bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:border-neutral-900 focus:bg-white"
                />
              </div>
            </div>

            {/* Requester Identity Info Card */}
            <div className="bg-neutral-50 border border-neutral-200/80 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-neutral-900 text-emerald-400 font-bold flex items-center justify-center text-xs">
                  {user?.avatarText || 'TR'}
                </div>
                <div>
                  <span className="text-neutral-500 text-[11px] block">Requesting Personnel:</span>
                  <span className="font-bold text-neutral-900">{user?.name || 'Thoeurn Ratha'}</span>
                  <span className="text-neutral-500 ml-1">({user?.roleBadge || user?.role || 'Faculty Lecturer'})</span>
                </div>
              </div>
              <div className="text-[11px] text-neutral-500">
                Target Laboratory Scope: <strong className="text-neutral-900">{targetRoom}</strong>
              </div>
            </div>

            {/* Form Actions */}
            <div className="pt-4 border-t border-neutral-100 flex items-center justify-end gap-3">
              <Link
                href="/requests"
                className="px-4 py-2 text-xs font-semibold text-neutral-600 hover:text-neutral-900 rounded-xl hover:bg-neutral-100 transition-colors"
              >
                Cancel
              </Link>
              <button
                type="submit"
                className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-white bg-neutral-900 hover:bg-neutral-800 rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4 text-emerald-400" />
                <span>Submit Purchase Requisition</span>
              </button>
            </div>
          </div>

          {/* Right Column (4 cols): Equipment Visual / Photo Upload & Live Summary */}
          <div className="lg:col-span-4 space-y-6">
            {/* Visual Photo Upload Component */}
            <div className="bg-white border border-neutral-200/90 rounded-2xl p-5 shadow-xs space-y-4">
              <div className="flex items-center gap-2 border-b border-neutral-100 pb-3">
                <Layers className="w-4 h-4 text-neutral-700" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-900">
                  Equipment / Item Photo
                </h3>
              </div>

              <ImageUpload
                value={imageUrl}
                onChange={setImageUrl}
                label="Upload Photo or Paste URL"
              />
            </div>

            {/* Live Requisition Summary Preview Card */}
            <div className="bg-white border border-neutral-200/90 rounded-2xl p-5 shadow-xs space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-900 flex items-center gap-2">
                <ShoppingCart className="w-4 h-4 text-emerald-600" />
                <span>Requisition Summary</span>
              </h4>

              <div className="space-y-2 text-xs border-t border-neutral-100 pt-3">
                <div className="flex justify-between py-1 border-b border-neutral-50">
                  <span className="text-neutral-500">Item Name</span>
                  <span className="font-semibold text-neutral-900 text-right truncate max-w-[180px]">
                    {title || '—'}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-neutral-50">
                  <span className="text-neutral-500">Category</span>
                  <span className="font-medium text-neutral-800">{category}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-neutral-50">
                  <span className="text-neutral-500">Quantity</span>
                  <span className="font-bold text-neutral-900">{quantity} {unit}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-neutral-50">
                  <span className="text-neutral-500">Est. Cost</span>
                  <span className="font-semibold text-neutral-900">
                    {estimatedCost ? (estimatedCost.startsWith('$') ? estimatedCost : `$${estimatedCost}`) : 'Pending'}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-neutral-50">
                  <span className="text-neutral-500">Target Lab</span>
                  <span className="font-semibold text-neutral-800">{targetRoom}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-neutral-500">Priority</span>
                  <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-neutral-100 text-neutral-800">
                    {priority}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
