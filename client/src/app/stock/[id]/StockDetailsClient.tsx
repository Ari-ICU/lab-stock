'use client';

import React, { useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Header } from '@/components/Header';
import { useStock } from '@/context/StockContext';
import { useAuth } from '@/context/AuthContext';
import { getOptimizedImageUrl } from '@/lib/imageOptimization';
import {
  ArrowLeft,
  Edit3,
  Trash2,
  Copy,
  Check,
  Cable,
  MapPin,
  Tag,
  Hash,
  Layers,
  CheckCircle2,
  AlertTriangle,
  QrCode,
  ShieldCheck,
  Shield,
  Plus,
  Minus,
  X,
  Package,
  Calendar,
  ExternalLink,
} from 'lucide-react';

export default function StockDetailsClient({ id: propId }: { id?: string }) {
  const params = useParams();
  const router = useRouter();
  const id = propId || (params?.id as string);

  const {
    stock,
    locations,
    updateStockItem,
    updateStockQuantity,
    deleteStockItem,
    showToast,
  } = useStock();
  const { user, canManageLocation } = useAuth();

  const [copied, setCopied] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const item =
    stock.find(
      (s) =>
        s.id === id ||
        s.serverId === id ||
        s.code.toLowerCase() === (id || '').toLowerCase() ||
        s.name.toLowerCase().replace(/[^a-z0-9]/g, '') === (id || '').toLowerCase().replace(/[^a-z0-9]/g, '')
    ) ||
    (id && (id.includes('-') || id.length > 15) ? stock[0] : undefined);
  const isAllowed = item ? canManageLocation(item.location) : false;

  // Active classroom & laboratory allocations
  const allocations = useMemo(() => {
    if (!item || !locations) return [];
    const list: Array<{
      inventoryId: string;
      locationId: string;
      room: string;
      building: string;
      locationName: string;
      total: number;
      qtyWorking: number;
      qtyBroken: number;
      qtyMaintenance: number;
      unit: string;
      remarks?: string;
      lastAuditedAt?: string;
    }> = [];

    const itemNameLower = item.name.toLowerCase();

    locations.forEach((loc) => {
      (loc.inventories || []).forEach((inv) => {
        const invNameLower = inv.name.toLowerCase();
        const isMatch =
          (inv.stockItemId && (inv.stockItemId === item.id || inv.stockItemId === item.code)) ||
          invNameLower === itemNameLower ||
          itemNameLower.includes(invNameLower) ||
          invNameLower.includes(itemNameLower);

        if (isMatch) {
          const total = (inv.qtyWorking || 0) + (inv.qtyBroken || 0) + (inv.qtyMaintenance || 0);
          if (total > 0) {
            list.push({
              inventoryId: inv.id,
              locationId: loc.id,
              room: loc.room,
              building: loc.building,
              locationName: loc.name,
              total,
              qtyWorking: inv.qtyWorking || 0,
              qtyBroken: inv.qtyBroken || 0,
              qtyMaintenance: inv.qtyMaintenance || 0,
              unit: inv.unit || item.unit || 'Units',
              remarks: inv.remarks,
              lastAuditedAt: inv.lastAuditedAt,
            });
          }
        }
      });
    });

    return list;
  }, [item, locations]);

  const totalAllocated = useMemo(() => {
    return allocations.reduce((sum, a) => sum + a.total, 0);
  }, [allocations]);

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
              The inventory item with ID <span className="font-mono font-semibold text-neutral-800">{id}</span> does not exist or has been removed.
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

  const handleCopyCode = () => {
    navigator.clipboard.writeText(item.code);
    setCopied(true);
    showToast(`Copied SKU ${item.code} to clipboard`);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDelete = () => {
    if (!isAllowed) {
      showToast('Action restricted: item is stored outside your assigned laboratory room.', 'error');
      return;
    }
    deleteStockItem(item.id);
    router.push('/stock');
  };

  const statusBadge = {
    in_stock: {
      text: 'In Stock',
      badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      dotClass: 'bg-emerald-500',
    },
    low_stock: {
      text: 'Low Stock',
      badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
      dotClass: 'bg-amber-500',
    },
    out_of_stock: {
      text: 'Out of Stock',
      badgeClass: 'bg-rose-50 text-rose-700 border-rose-200',
      dotClass: 'bg-rose-500',
    },
  }[item.status];

  return (
    <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-neutral-50/50">
      {/* Top Header with Back Navigation & Action Controls */}
      <Header
        title={item.name}
        subtitle={`SKU: ${item.code} • ${item.location}`}
        backHref="/stock"
        backLabel="Inventory"
        showExport={false}
        actions={
          !isAllowed ? (
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-100 text-neutral-600 rounded text-xs font-semibold border border-neutral-200">
              <Shield className="w-3.5 h-3.5 text-neutral-500" />
              <span>Read-Only Lab Access</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href={`/stock/${item.id}/edit`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-neutral-200 hover:bg-neutral-50 text-neutral-800 rounded text-xs font-semibold transition-colors shadow-xs"
              >
                <Edit3 className="w-3.5 h-3.5 text-neutral-600" />
                <span>Edit Item</span>
              </Link>

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
          )
        }
      />

      {/* Main Content Body */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-6 w-full">

        {/* Lab Scope Restriction Banner */}
        {!isAllowed && (
          <div className="p-4 bg-amber-50/80 border border-amber-300/80 rounded-lg flex items-start gap-3 shadow-xs">
            <Shield className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <div className="text-xs font-bold text-amber-950">
                Restricted Laboratory Inventory
              </div>
              <div className="text-xs text-amber-800 leading-relaxed">
                This item is stored in <span className="font-semibold text-neutral-900">{item.location}</span>. Your account is assigned to manage: <span className="font-semibold text-neutral-900">{user?.assignedLabs?.includes('all') ? 'All Laboratories' : user?.assignedLabs?.join(', ') || 'No Assigned Labs'}</span>. Quantity adjustments, editing, and deletion are disabled.
              </div>
            </div>
          </div>
        )}
        
        {/* Top Summary / Status Banner */}
        <div className="bg-white border border-neutral-200 rounded p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded border border-neutral-200 bg-neutral-100 overflow-hidden shrink-0 flex items-center justify-center">
              {item.imageUrl ? (
                <img
                  src={getOptimizedImageUrl(item.imageUrl, 'thumb')}
                  alt={item.name}
                  decoding="async"
                  className="w-full h-full object-cover"
                />
              ) : (
                <Cable className="w-8 h-8 text-neutral-400" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-xs font-medium border ${statusBadge.badgeClass}`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${statusBadge.dotClass}`} />
                  {statusBadge.text}
                </span>

                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-neutral-100 text-neutral-700">
                  <Tag className="w-3 h-3 text-neutral-400" />
                  {item.category}
                </span>

                {item.expiryDate && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-neutral-100 text-neutral-600 border border-neutral-200">
                    <ShieldCheck className="w-3 h-3 text-neutral-500" />
                    {item.expiryDate}
                  </span>
                )}
              </div>

              <h1 className="text-lg sm:text-xl font-bold text-neutral-900 mt-1.5">
                {item.name}
              </h1>

              <div className="flex items-center gap-2 text-xs text-neutral-500 font-mono mt-1">
                <span>SKU: {item.code}</span>
                <button
                  onClick={handleCopyCode}
                  className="text-neutral-400 hover:text-neutral-900 transition-colors p-0.5"
                  title="Copy SKU code"
                >
                  {copied ? (
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
                <span>•</span>
                <span className="font-sans text-neutral-600 flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-neutral-400" />
                  {item.location}
                </span>
                {allocations.length > 0 && (
                  <>
                    <span>•</span>
                    <span className="font-sans text-emerald-700 font-semibold flex items-center gap-1">
                      {totalAllocated} Allocated ({allocations.length} {allocations.length === 1 ? 'Room' : 'Rooms'})
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Quick Real-Time Quantity Adjuster */}
          <div className="bg-neutral-50 border border-neutral-200 rounded p-3 flex sm:flex-col items-center justify-between sm:justify-center gap-3 shrink-0">
            <div className="text-center">
              <div className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider">
                Current Stock
              </div>
              <div className="text-2xl font-black text-neutral-900 font-mono">
                {item.quantity}
                <span className="text-xs font-medium text-neutral-500 ml-1.5 font-sans">
                  {item.unit}
                </span>
              </div>
              {totalAllocated > 0 && (
                <div className="text-[10px] text-neutral-500 font-medium mt-0.5">
                  +{totalAllocated} in rooms
                </div>
              )}
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                disabled={!isAllowed || item.quantity <= 0}
                onClick={() => {
                  if (!isAllowed) {
                    showToast('Action restricted: item is stored outside your assigned laboratory room.', 'error');
                    return;
                  }
                  updateStockQuantity(item.id, -1);
                }}
                className="w-7 h-7 flex items-center justify-center rounded bg-white border border-neutral-300 text-neutral-700 hover:bg-neutral-100 disabled:opacity-40 transition-colors cursor-pointer text-xs"
                title={isAllowed ? "Decrease 1" : "Read-only laboratory scope"}
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                disabled={!isAllowed}
                onClick={() => {
                  if (!isAllowed) {
                    showToast('Action restricted: item is stored outside your assigned laboratory room.', 'error');
                    return;
                  }
                  updateStockQuantity(item.id, 1);
                }}
                className="w-7 h-7 flex items-center justify-center rounded bg-white border border-neutral-300 text-neutral-700 hover:bg-neutral-100 disabled:opacity-40 transition-colors cursor-pointer text-xs"
                title={isAllowed ? "Increase 1" : "Read-only laboratory scope"}
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                disabled={!isAllowed}
                onClick={() => {
                  if (!isAllowed) {
                    showToast('Action restricted: item is stored outside your assigned laboratory room.', 'error');
                    return;
                  }
                  updateStockQuantity(item.id, 5);
                }}
                className="px-2 h-7 flex items-center justify-center rounded bg-neutral-900 text-white hover:bg-neutral-800 disabled:opacity-40 transition-colors cursor-pointer text-[11px] font-bold font-mono"
                title={isAllowed ? "Add batch +5" : "Read-only laboratory scope"}
              >
                +5
              </button>
            </div>
          </div>
        </div>

        {/* Full-width Responsive Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left Column: Visual & Storage Location */}
          <div className="lg:col-span-4 xl:col-span-4 2xl:col-span-3 space-y-6">
            {/* Visual Card */}
            <div className="bg-white border border-neutral-200 rounded p-5 space-y-4">
              <div className="flex items-center gap-2 border-b border-neutral-100 pb-3">
                <Package className="w-4 h-4 text-neutral-700" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-900">
                  Item Visual & Barcode
                </h3>
              </div>

              <div className="w-full aspect-video rounded border border-neutral-200 bg-neutral-50 overflow-hidden flex items-center justify-center">
                {item.imageUrl ? (
                  <img
                    src={getOptimizedImageUrl(item.imageUrl, 'card')}
                    alt={item.name}
                    decoding="async"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex flex-col items-center gap-2 text-neutral-400">
                    <Cable className="w-10 h-10" />
                    <span className="text-xs">No image provided</span>
                  </div>
                )}
              </div>

              {/* Barcode Tag Box */}
              <div className="p-3 bg-neutral-50 border border-neutral-200 rounded flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <QrCode className="w-6 h-6 text-neutral-700" />
                  <div>
                    <div className="text-[10px] uppercase font-bold text-neutral-400">Barcode / SKU</div>
                    <div className="font-mono text-xs font-bold text-neutral-900">{item.code}</div>
                  </div>
                </div>
                <button
                  onClick={handleCopyCode}
                  className="px-2 py-1 text-[11px] font-medium bg-white border border-neutral-200 rounded hover:bg-neutral-50 text-neutral-700 transition-colors"
                >
                  {copied ? 'Copied' : 'Copy'}
                </button>
              </div>
            </div>

            {/* Quick Actions Card */}
            <div className="bg-white border border-neutral-200 rounded p-5 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-900">
                Inventory Quick Operations
              </h4>
              <div className="space-y-2 pt-1">
                <button
                  type="button"
                  onClick={() => updateStockQuantity(item.id, 10)}
                  className="w-full py-2 px-3 text-xs font-medium text-neutral-800 bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 rounded flex items-center justify-between transition-colors"
                >
                  <span>Restock Shipment (+10 units)</span>
                  <span className="font-mono font-bold text-emerald-700">+10</span>
                </button>
                <button
                  type="button"
                  onClick={() => updateStockQuantity(item.id, -5)}
                  disabled={item.quantity < 5}
                  className="w-full py-2 px-3 text-xs font-medium text-neutral-800 bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 rounded flex items-center justify-between transition-colors disabled:opacity-40"
                >
                  <span>Deploy to Class / Lab Bench (-5 units)</span>
                  <span className="font-mono font-bold text-rose-700">-5</span>
                </button>
                <Link
                  href={`/stock/${item.id}/edit`}
                  className="w-full py-2 px-3 text-xs font-medium text-neutral-900 bg-white hover:bg-neutral-50 border border-neutral-300 rounded flex items-center justify-between transition-colors"
                >
                  <span>Edit Specifications or Location</span>
                  <Edit3 className="w-3.5 h-3.5 text-neutral-500" />
                </Link>
              </div>
            </div>
          </div>

          {/* Right Column: Specifications & Technical Description */}
          <div className="lg:col-span-8 xl:col-span-8 2xl:col-span-9 space-y-6">
            
            {/* Specifications Card */}
            <div className="bg-white border border-neutral-200 rounded p-5 sm:p-6 space-y-4">
              <div className="flex items-center gap-2 border-b border-neutral-100 pb-3">
                <Layers className="w-4 h-4 text-neutral-700" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-900">
                  Item Specifications & Storage
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 text-xs pt-1">
                <div className="p-3 bg-neutral-50/70 border border-neutral-100 rounded space-y-1">
                  <div className="text-neutral-400 text-[11px] font-medium">Item Name</div>
                  <div className="font-semibold text-neutral-900">{item.name}</div>
                </div>

                <div className="p-3 bg-neutral-50/70 border border-neutral-100 rounded space-y-1">
                  <div className="text-neutral-400 text-[11px] font-medium">Part Code / SKU</div>
                  <div className="font-mono font-bold text-neutral-900">{item.code}</div>
                </div>

                <div className="p-3 bg-neutral-50/70 border border-neutral-100 rounded space-y-1">
                  <div className="text-neutral-400 text-[11px] font-medium">Category</div>
                  <div className="font-medium text-neutral-900">{item.category}</div>
                </div>

                <div className="p-3 bg-neutral-50/70 border border-neutral-100 rounded space-y-1">
                  <div className="text-neutral-400 text-[11px] font-medium">Quantity in Inventory</div>
                  <div className="font-mono font-bold text-neutral-900">
                    {item.quantity} {item.unit}
                  </div>
                </div>

                <div className="p-3 bg-neutral-50/70 border border-neutral-100 rounded space-y-1">
                  <div className="text-neutral-400 text-[11px] font-medium">Assigned Laboratory Room</div>
                  <div className="font-medium text-neutral-900 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-neutral-500" />
                    {item.location}
                  </div>
                </div>

                <div className="p-3 bg-neutral-50/70 border border-neutral-100 rounded space-y-1">
                  <div className="text-neutral-400 text-[11px] font-medium">Shelf / Bin / Cabinet</div>
                  <div className="font-mono text-neutral-800">{item.rack || 'Standard Storage'}</div>
                </div>

                <div className="p-3 bg-neutral-50/70 border border-neutral-100 rounded space-y-1">
                  <div className="text-neutral-400 text-[11px] font-medium">Warranty / Inspection Note</div>
                  <div className="font-medium text-neutral-900">{item.expiryDate || 'Active'}</div>
                </div>

                <div className="p-3 bg-neutral-50/70 border border-neutral-100 rounded space-y-1">
                  <div className="text-neutral-400 text-[11px] font-medium">Availability Status</div>
                  <div className="font-semibold">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] border ${statusBadge.badgeClass}`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${statusBadge.dotClass}`} />
                      {statusBadge.text}
                    </span>
                  </div>
                </div>

                <div className="p-3 bg-neutral-50/70 border border-neutral-100 rounded space-y-1 sm:col-span-2 xl:col-span-4">
                  <div className="text-neutral-400 text-[11px] font-medium flex items-center justify-between">
                    <span>Active Classroom Allocations</span>
                    {allocations.length > 0 && (
                      <span className="text-emerald-700 font-semibold font-mono text-[10px]">
                        {totalAllocated} {item.unit || 'units'} deployed
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                    {allocations.length > 0 ? (
                      allocations.map((alloc) => (
                        <Link
                          key={alloc.inventoryId}
                          href={`/locations/${alloc.locationId}`}
                          className="inline-flex items-center gap-1 text-[11px] font-mono font-medium bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200/80 px-2 py-0.5 rounded transition-colors"
                          title={`Allocated to ${alloc.room}: ${alloc.total} ${alloc.unit}`}
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          <span>{alloc.room} ({alloc.total})</span>
                        </Link>
                      ))
                    ) : (
                      <span className="text-neutral-400 text-[11px] italic">
                        Not currently assigned to any classroom or laboratory inventory.
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Classroom & Laboratory Allocations Card */}
            <div className="bg-white border border-neutral-200 rounded p-5 sm:p-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-neutral-100 pb-3">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-emerald-600" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-900">
                    Classroom & Laboratory Allocations
                  </h3>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="font-semibold text-neutral-900 font-mono">
                    {totalAllocated} {item.unit || 'units'}
                  </span>
                  <span className="text-neutral-400">assigned in</span>
                  <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-neutral-100 text-neutral-700">
                    {allocations.length} {allocations.length === 1 ? 'room' : 'rooms'}
                  </span>
                </div>
              </div>

              {allocations.length === 0 ? (
                <div className="py-6 text-center space-y-1.5">
                  <p className="text-xs text-neutral-500 font-medium">
                    No active classroom or laboratory allocations for this stock item.
                  </p>
                  <p className="text-[11px] text-neutral-400">
                    All {item.quantity} {item.unit || 'units'} are currently stored in central stock at {item.location}.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs min-w-[550px]">
                    <thead className="bg-neutral-50/70 border-b border-neutral-200 text-neutral-600 font-semibold">
                      <tr>
                        <th className="py-2.5 px-3">Room / Facility</th>
                        <th className="py-2.5 px-3">Location Details</th>
                        <th className="py-2.5 px-3 text-center">Allocated</th>
                        <th className="py-2.5 px-3 text-center">Working</th>
                        <th className="py-2.5 px-3 text-center">Broken</th>
                        <th className="py-2.5 px-3">Condition Remarks</th>
                        <th className="py-2.5 px-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100">
                      {allocations.map((alloc) => (
                        <tr key={alloc.inventoryId} className="hover:bg-neutral-50/70 transition-colors">
                          <td className="py-2.5 px-3">
                            <Link
                              href={`/locations/${alloc.locationId}`}
                              className="font-bold text-neutral-900 hover:text-emerald-700 transition-colors inline-flex items-center gap-1.5"
                            >
                              <span className="font-mono bg-neutral-900 text-white px-1.5 py-0.5 rounded text-[10px]">
                                {alloc.room}
                              </span>
                              <span>{alloc.locationName}</span>
                            </Link>
                          </td>
                          <td className="py-2.5 px-3 text-neutral-500">
                            {alloc.building}
                          </td>
                          <td className="py-2.5 px-3 text-center font-mono font-bold text-neutral-900">
                            {alloc.total} {alloc.unit}
                          </td>
                          <td className="py-2.5 px-3 text-center font-mono">
                            <span className="inline-flex items-center gap-1 font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded text-[11px]">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                              {alloc.qtyWorking}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-center font-mono">
                            {alloc.qtyBroken > 0 ? (
                              <span className="inline-flex items-center gap-1 font-bold text-rose-700 bg-rose-50 border border-rose-200 px-1.5 py-0.5 rounded text-[11px]">
                                <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                                {alloc.qtyBroken}
                              </span>
                            ) : (
                              <span className="text-neutral-300">—</span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-neutral-500 italic max-w-xs truncate">
                            {alloc.remarks || 'Standard condition'}
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            <Link
                              href={`/locations/${alloc.locationId}`}
                              className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 hover:text-emerald-800 hover:underline"
                            >
                              <span>View Room</span>
                              <ExternalLink className="w-3 h-3" />
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Description & Deployment Information */}
            <div className="bg-white border border-neutral-200 rounded p-5 sm:p-6 space-y-3">
              <div className="flex items-center gap-2 border-b border-neutral-100 pb-3">
                <CheckCircle2 className="w-4 h-4 text-neutral-700" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-900">
                  Technical Description & Lab Notes
                </h3>
              </div>

              <div className="text-xs text-neutral-700 leading-relaxed pt-1">
                {item.description ? (
                  <p className="whitespace-pre-line">{item.description}</p>
                ) : (
                  <p className="text-neutral-400 italic">
                    No additional description recorded for this inventory item. Click &quot;Edit Item&quot; to add technical notes or compatibility details.
                  </p>
                )}
              </div>
            </div>

          </div>
        </div>

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

