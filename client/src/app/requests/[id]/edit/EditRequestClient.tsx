'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { Header } from '@/components/Header';
import { Dropdown } from '@/components/Dropdown';
import { ImageUpload } from '@/components/ImageUpload';
import { useStock } from '@/context/StockContext';
import { useAuth } from '@/context/AuthContext';
import { PurchaseRequest } from '@/types';
import {
  ArrowLeft,
  ShoppingCart,
  Save,
  Building2,
  Tag,
  DollarSign,
  AlertTriangle,
  User,
  Calendar,
  FileText,
  Flame,
  CheckCircle2,
  ShieldAlert,
  Layers,
} from 'lucide-react';

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

const PRIORITY_OPTIONS = [
  { label: 'Low Priority', value: 'low' },
  { label: 'Medium Priority', value: 'medium' },
  { label: 'High Priority', value: 'high' },
  { label: '🔥 Urgent Priority', value: 'urgent' },
];

const STATUS_OPTIONS = [
  { label: '⏳ Pending Review', value: 'pending' },
  { label: '✓ Approved for Purchase', value: 'approved' },
  { label: '📦 PO Dispatched (Ordered)', value: 'ordered' },
  { label: '🎉 Fulfilled & Received', value: 'fulfilled' },
  { label: '✕ Rejected', value: 'rejected' },
];

export default function EditRequestClient({ id: propId }: { id?: string }) {
  const params = useParams();
  const router = useRouter();
  const id = propId || (params?.id as string);

  const { user, canManageLocation } = useAuth();
  const { requests, locations, updatePurchaseRequest, showToast } = useStock();

  const isPrimaryAdmin = user?.role === 'Primary Lab Administrator' || user?.roleBadge === 'Admin';
  const request = requests.find((r) => r.id === id);

  const availableRooms = useMemo(() => {
    if (isPrimaryAdmin) {
      return locations.map((l) => l.room);
    }
    if (user?.assignedLabs && user.assignedLabs.length > 0) {
      return user.assignedLabs;
    }
    return ['Room 102B', 'Room 206'];
  }, [isPrimaryAdmin, user, locations]);

  // Form states
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Networking Equipment');
  const [targetRoom, setTargetRoom] = useState('Room 102B');
  const [quantity, setQuantity] = useState(1);
  const [unit, setUnit] = useState('Units');
  const [estimatedCost, setEstimatedCost] = useState('');
  const [priority, setPriority] = useState<PurchaseRequest['priority']>('medium');
  const [status, setStatus] = useState<PurchaseRequest['status']>('pending');
  const [reason, setReason] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (request) {
      setTitle(request.title);
      setCategory(request.category);
      setTargetRoom(request.targetRoom);
      setQuantity(request.quantity);
      setUnit(request.unit);
      setEstimatedCost(request.estimatedCost ? request.estimatedCost.replace('$', '') : '');
      setPriority(request.priority);
      setStatus(request.status);
      setReason(request.reason);
      setImageUrl(request.imageUrl || '');
      setNotes(request.notes || '');
    }
  }, [request]);

  if (!request) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-neutral-50/50">
        <div className="bg-white border border-neutral-200 rounded-2xl p-8 max-w-md w-full text-center space-y-4 shadow-xs">
          <div className="w-12 h-12 rounded-xl bg-neutral-100 flex items-center justify-center mx-auto text-neutral-400">
            <ShoppingCart className="w-6 h-6" />
          </div>
          <h2 className="text-base font-bold text-neutral-900">Requisition Not Found</h2>
          <p className="text-xs text-neutral-500">
            Requisition ID &ldquo;<span className="font-mono font-semibold">{id}</span>&rdquo; does not exist.
          </p>
          <Link
            href="/requests"
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-neutral-900 hover:bg-neutral-800 rounded-xl transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Purchase Requests</span>
          </Link>
        </div>
      </div>
    );
  }

  // Scoping restriction: non-admins cannot edit if they don't manage the location or didn't submit it
  const isAuthorized = isPrimaryAdmin || canManageLocation(request.targetRoom) || request.requestedBy === user?.name;

  if (!isAuthorized) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-neutral-50/50">
        <div className="bg-white border border-rose-200 rounded-2xl p-8 max-w-lg w-full text-center space-y-4 shadow-xs">
          <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h2 className="text-base font-bold text-neutral-900">Restricted Laboratory Scope</h2>
          <p className="text-xs text-neutral-600 leading-relaxed">
            This purchase requisition is designated for <strong>{request.targetRoom}</strong>, which is stationed outside your assigned laboratory supervisory scope.
          </p>
          <Link
            href={`/requests/${request.id}`}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded-xl transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>View Requisition Read-Only</span>
          </Link>
        </div>
      </div>
    );
  }

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      showToast('Please enter an item name.', 'error');
      return;
    }
    if (!reason.trim()) {
      showToast('Please provide a justification.', 'error');
      return;
    }

    const updated: PurchaseRequest = {
      ...request,
      title: title.trim(),
      category,
      targetRoom,
      quantity: Number(quantity) || 1,
      unit,
      estimatedCost: estimatedCost.trim() ? (estimatedCost.startsWith('$') ? estimatedCost : `$${estimatedCost}`) : undefined,
      priority,
      status: isPrimaryAdmin ? status : request.status,
      reason: reason.trim(),
      imageUrl: imageUrl.trim() || undefined,
      notes: notes.trim() || undefined,
    };

    updatePurchaseRequest(updated);
    router.push(`/requests/${request.id}`);
  };

  return (
    <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-neutral-50/50">
      {/* Top Header with Back Navigation & Action Controls (matching Assets & Inventory style) */}
      <Header
        title={`Edit ${request.title}`}
        subtitle={`ID: ${request.id} • ${request.targetRoom}`}
        backHref={`/requests/${request.id}`}
        backLabel="Requisition Details"
        showExport={false}
        actions={
          <div className="flex items-center gap-2">
            <Link
              href={`/requests/${request.id}`}
              className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 bg-white border border-neutral-200 text-neutral-700 hover:bg-neutral-50 rounded text-xs font-medium transition-colors"
            >
              Cancel
            </Link>
            <button
              type="button"
              onClick={() => {
                const form = document.getElementById('edit-request-form') as HTMLFormElement;
                if (form) form.requestSubmit();
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-white rounded text-xs font-semibold transition-colors cursor-pointer shadow-xs"
            >
              <Save className="w-3.5 h-3.5 text-neutral-300" />
              <span>Save Changes</span>
            </button>
          </div>
        }
      />

      <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6 w-full">
        {/* Full-Width 12-Column Edit Grid (No Breadcrumbs) */}
        <form id="edit-request-form" onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Main Form Fields (8 Cols) */}
          <div className="lg:col-span-8 bg-white border border-neutral-200/90 rounded-2xl p-6 shadow-xs space-y-6">
            <div className="border-b border-neutral-100 pb-4 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-neutral-900">Update Procurement Requisition</h2>
                <p className="text-xs text-neutral-500 mt-0.5">
                  Modify item specifications, requested quantities, or academic justifications.
                </p>
              </div>
              <span className="font-mono text-xs font-bold text-neutral-500 bg-neutral-100 px-2 py-0.5 rounded">
                {request.id}
              </span>
            </div>

            <div className="space-y-4 text-xs">
              {/* Title */}
              <div>
                <label className="block font-bold text-neutral-700 mb-1.5">
                  Item Name / Specification <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:border-neutral-900 focus:bg-white text-xs"
                />
              </div>

              {/* Category & Room */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-neutral-700 mb-1.5">Category</label>
                  <Dropdown
                    value={category}
                    options={CATEGORY_OPTIONS}
                    onChange={(val) => setCategory(val)}
                    buttonClassName="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl hover:border-neutral-400 focus:border-neutral-900 focus:bg-white text-xs text-neutral-900 font-medium"
                  />
                </div>

                <div>
                  <label className="block font-bold text-neutral-700 mb-1.5">Destination Room</label>
                  <Dropdown
                    value={targetRoom}
                    options={availableRooms.map((room) => ({
                      label: `${room}${canManageLocation(room) ? ' (Under Your Management)' : ''}`,
                      value: room,
                    }))}
                    onChange={(val) => setTargetRoom(val)}
                    buttonClassName="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl hover:border-neutral-400 focus:border-neutral-900 focus:bg-white text-xs text-neutral-900 font-medium"
                  />
                </div>
              </div>

              {/* Quantity, Unit, Cost */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block font-bold text-neutral-700 mb-1.5">Quantity</label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={quantity}
                    onChange={(e) => setQuantity(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:border-neutral-900 focus:bg-white text-xs"
                  />
                </div>

                <div>
                  <label className="block font-bold text-neutral-700 mb-1.5">Packaging Unit</label>
                  <Dropdown
                    value={unit}
                    options={UNIT_OPTIONS}
                    onChange={(val) => setUnit(val)}
                    buttonClassName="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl hover:border-neutral-400 focus:border-neutral-900 focus:bg-white text-xs text-neutral-900 font-medium"
                  />
                </div>

                <div>
                  <label className="block font-bold text-neutral-700 mb-1.5">Estimated Cost ($)</label>
                  <div className="relative">
                    <DollarSign className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={estimatedCost}
                      onChange={(e) => setEstimatedCost(e.target.value)}
                      placeholder="150.00"
                      className="w-full pl-8 pr-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:border-neutral-900 focus:bg-white text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Priority & Status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-neutral-700 mb-1.5">Priority / Urgency</label>
                  <Dropdown
                    value={priority}
                    options={PRIORITY_OPTIONS}
                    onChange={(val) => setPriority(val as PurchaseRequest['priority'])}
                    buttonClassName="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl hover:border-neutral-400 focus:border-neutral-900 focus:bg-white text-xs text-neutral-900 font-medium"
                  />
                </div>

                {isPrimaryAdmin ? (
                  <div>
                    <label className="block font-bold text-neutral-700 mb-1.5">Procurement Status (Admin)</label>
                    <Dropdown
                      value={status}
                      options={STATUS_OPTIONS}
                      onChange={(val) => setStatus(val as PurchaseRequest['status'])}
                      buttonClassName="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl hover:border-neutral-400 focus:border-neutral-900 focus:bg-white text-xs text-neutral-900 font-semibold"
                    />
                  </div>
                ) : (
                  <div>
                    <label className="block font-bold text-neutral-700 mb-1.5">Current Status</label>
                    <div className="px-3.5 py-2.5 bg-neutral-100 text-neutral-700 rounded-xl font-semibold uppercase text-[11px]">
                      {request.status}
                    </div>
                  </div>
                )}
              </div>

              {/* Reason */}
              <div>
                <label className="block font-bold text-neutral-700 mb-1.5">
                  Academic Justification / Purpose <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows={4}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:border-neutral-900 focus:bg-white leading-relaxed text-xs"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block font-bold text-neutral-700 mb-1.5">Procurement & Review Notes</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Approved budget allocation, vendor contact details..."
                  className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:border-neutral-900 focus:bg-white text-xs"
                />
              </div>
            </div>

            {/* Form Actions */}
            <div className="pt-4 border-t border-neutral-100 flex items-center justify-end gap-3">
              <Link
                href={`/requests/${request.id}`}
                className="px-4 py-2 text-xs font-semibold text-neutral-600 hover:text-neutral-900 rounded-xl hover:bg-neutral-100 transition-colors"
              >
                Cancel
              </Link>
              <button
                type="submit"
                className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-white bg-neutral-900 hover:bg-neutral-800 rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                <Save className="w-4 h-4 text-emerald-400" />
                <span>Save Changes</span>
              </button>
            </div>
          </div>

          {/* Right Column (4 Cols): Image Upload & Live Visual Preview */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white border border-neutral-200/90 rounded-2xl p-5 shadow-xs space-y-4">
              <div className="flex items-center gap-2 border-b border-neutral-100 pb-3">
                <Layers className="w-4 h-4 text-neutral-700" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-900">
                  Update Item Photo
                </h3>
              </div>

              <ImageUpload
                value={imageUrl}
                onChange={setImageUrl}
                label="Upload New Photo or Paste URL"
              />
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
