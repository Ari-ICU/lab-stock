'use client';

import React, { Suspense, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Header } from '@/components/Header';
import { Dropdown } from '@/components/Dropdown';
import { useStock } from '@/context/StockContext';
import { useAuth } from '@/context/AuthContext';
import {
  Boxes,
  Microscope,
  ArrowRight,
  Layers,
  ClipboardList,
  MapPin,
  AlertTriangle,
  ExternalLink,
} from 'lucide-react';
import { findLocation, getCategoryLabel } from '../shared';
import { doesLocationMatchRoom, inferAssetGroup } from '@/lib/locationMatch';
import { LoadingScreen } from '@/components/LoadingScreen';
import { LabThumbnail } from '@/components/LabThumbnail';

type Source = 'stock' | 'asset';

function NewRoomItemInner({ id }: { id: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const {
    locations,
    stock,
    assets,
    addRoomInventoryItem,
    updateStockQuantity,
    transferAsset,
    showToast,
    isLoading,
  } = useStock();
  const { user, canManageLocation } = useAuth();

  const loc = findLocation(locations, id);

  const initialSource: Source = searchParams.get('source') === 'asset' ? 'asset' : 'stock';
  const [manualSource, setManualSource] = useState<Source | null>(null);
  const source: Source = manualSource ?? initialSource;

  const [selectedStockId, setSelectedStockId] = useState('');
  const [selectedAssetId, setSelectedAssetId] = useState('');
  const [qtyWorking, setQtyWorking] = useState(1);
  const [qtyBroken, setQtyBroken] = useState(0);
  const [remarks, setRemarks] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const assignableStock = useMemo(
    () => (loc ? stock.filter((s) => s.quantity > 0 && !doesLocationMatchRoom(s.location, loc)) : []),
    [stock, loc]
  );

  const assignableAssets = useMemo(
    () => (loc ? assets.filter((a) => !doesLocationMatchRoom(a.location, loc)) : []),
    [assets, loc]
  );

  const stockOptions = useMemo(
    () =>
      assignableStock.map((s) => ({
        label: `${s.name} (${s.code}) — ${s.quantity} ${s.unit} avail (${s.location || 'Unassigned'})`,
        value: s.id,
      })),
    [assignableStock]
  );

  const assetOptions = useMemo(
    () =>
      assignableAssets.map((a) => ({
        label: `${a.name} (${a.serialNumber}) — ${a.totalUnits ?? 1} ${a.unitType || 'Units'} (${a.location || 'Unassigned'})`,
        value: a.id,
      })),
    [assignableAssets]
  );

  const selectedStock = assignableStock.find((s) => s.id === selectedStockId);
  const selectedAsset = assignableAssets.find((a) => a.id === selectedAssetId);

  if (isLoading || !loc) {
    return <LoadingScreen message="Loading classroom assignment workspace..." />;
  }

  const isAdmin = user?.roleBadge === 'Admin' || user?.role === 'Primary Lab Administrator';
  const isAllowed = isAdmin || canManageLocation(loc.room) || canManageLocation(loc.name);
  const backHref = `/locations/${loc.id}?tab=${source === 'asset' ? 'hardware' : 'stock'}`;

  const handleSelectStock = (stockId: string) => {
    setSelectedStockId(stockId);
    const item = assignableStock.find((s) => s.id === stockId);
    if (!item) return;
    setQtyWorking(Math.min(item.quantity || 1, 1));
    setQtyBroken(0);
    setRemarks('');
  };

  const handleSelectAsset = (assetId: string) => {
    setSelectedAssetId(assetId);
    setRemarks('');
  };

  const totalAllocated = (Number(qtyWorking) || 0) + (Number(qtyBroken) || 0);
  const exceedsStock = source === 'stock' && selectedStock ? totalAllocated > selectedStock.quantity : false;

  const canSubmit =
    isAllowed &&
    !submitting &&
    (source === 'stock' ? Boolean(selectedStock) && totalAllocated > 0 && !exceedsStock : Boolean(selectedAsset));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAllowed) {
      showToast('You do not have permission to manage this classroom', 'error');
      return;
    }

    if (source === 'asset') {
      if (!selectedAsset) {
        showToast('Please select a device from Hardware Assets', 'warning');
        return;
      }
      setSubmitting(true);
      transferAsset(
        selectedAsset.id,
        `${loc.name} (${loc.room})`,
        remarks.trim() || `Assigned to ${loc.room}`,
        user?.name || 'Admin'
      );
      showToast(`Assigned ${selectedAsset.name} to ${loc.room}`, 'success');
      setTimeout(() => router.push(`/locations/${loc.id}?tab=hardware`), 200);
      return;
    }

    if (!selectedStock) {
      showToast('Please select an item from Inventory', 'warning');
      return;
    }
    if (totalAllocated <= 0) {
      showToast('Quantity must be at least 1', 'warning');
      return;
    }
    if (exceedsStock) {
      showToast(`Only ${selectedStock.quantity} ${selectedStock.unit} available in Inventory`, 'warning');
      return;
    }

    setSubmitting(true);
    const inferredGroup = inferAssetGroup(selectedStock.category || '', selectedStock.name);
    addRoomInventoryItem(loc.id, {
      stockItemId: selectedStock.id,
      name: selectedStock.name,
      group: inferredGroup,
      brandSpec: selectedStock.description || selectedStock.rack || undefined,
      unit: selectedStock.unit || 'pcs',
      qtyWorking: Number(qtyWorking) || 0,
      qtyBroken: Number(qtyBroken) || 0,
      qtyMaintenance: 0,
      remarks: remarks.trim() || undefined,
    });
    updateStockQuantity(selectedStock.id, -totalAllocated);
    showToast(
      `Assigned ${totalAllocated} ${selectedStock.unit || 'Units'} of "${selectedStock.name}" to ${loc.room}`,
      'success'
    );
    setTimeout(() => router.push(`/locations/${loc.id}?tab=stock`), 200);
  };

  const inputCls =
    'w-full bg-white border border-neutral-300 text-neutral-900 text-xs px-3 py-2 rounded-xl focus:outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 transition-colors placeholder:text-neutral-400';
  const dropdownBtn =
    'w-full justify-between bg-white border border-neutral-300 text-neutral-900 text-xs px-3 py-2 rounded-xl hover:border-neutral-400 transition-colors';

  const sourceTabs: { key: Source; label: string; hint: string; icon: React.ReactNode }[] = [
    {
      key: 'stock',
      label: 'From Inventory (/stock)',
      hint: 'Assign quantity from confirmed inventory items',
      icon: <Boxes className="w-4 h-4" />,
    },
    {
      key: 'asset',
      label: 'From Hardware Assets (/assets)',
      hint: 'Assign serialized lab device or fleet',
      icon: <Microscope className="w-4 h-4" />,
    },
  ];

  const derivedGroup = selectedStock ? inferAssetGroup(selectedStock.category || '', selectedStock.name) : null;

  return (
    <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-neutral-50/50">
      <Header
        title={`Assign to ${loc.room}`}
        subtitle={`${loc.name} • ${loc.building}`}
        backHref={backHref}
        backLabel={loc.room}
        showExport={false}
        actions={
          <div className="flex items-center gap-2">
            <Link
              href={backHref}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-neutral-200 text-neutral-700 hover:bg-neutral-50 rounded-xl text-xs font-medium transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              form="assign-room-item-form"
              disabled={!canSubmit}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-neutral-900 hover:bg-neutral-800 disabled:bg-neutral-400 text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer shadow-xs"
            >
              <ArrowRight className="w-3.5 h-3.5 text-emerald-400" />
              <span>{submitting ? 'Assigning...' : `Assign to ${loc.room}`}</span>
            </button>
          </div>
        }
      />

      <div className="flex-1 overflow-y-auto p-4 sm:p-8 w-full">
        {!isAllowed && (
          <div className="mb-6 p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>You have read-only access to {loc.room}. Only assigned operators or administrators can assign equipment.</span>
          </div>
        )}

        <form id="assign-room-item-form" onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left: selection & assignment */}
          <div className="lg:col-span-8 space-y-6">
            <div className="bg-white border border-neutral-200/80 rounded-2xl p-5 sm:p-6 shadow-2xs space-y-4">
              <div className="flex items-center gap-2 border-b border-neutral-100 pb-3">
                <Layers className="w-4 h-4 text-neutral-700" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-900">
                  Select Source (Inventory or Hardware Assets)
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {sourceTabs.map((t) => {
                  const active = source === t.key;
                  return (
                    <button
                      key={t.key}
                      type="button"
                      onClick={() => {
                        setManualSource(t.key);
                        setSelectedStockId('');
                        setSelectedAssetId('');
                        setQtyWorking(1);
                        setQtyBroken(0);
                        setRemarks('');
                      }}
                      className={`flex flex-col items-start gap-1 p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                        active
                          ? 'bg-neutral-900 text-white border-neutral-900 shadow-xs'
                          : 'bg-neutral-50/50 text-neutral-700 border-neutral-200 hover:bg-white hover:border-neutral-300'
                      }`}
                    >
                      <div className="flex items-center gap-2 text-xs font-bold">
                        <span className={active ? 'text-emerald-400' : 'text-neutral-500'}>{t.icon}</span>
                        <span>{t.label}</span>
                      </div>
                      <span className={`text-[11px] ${active ? 'text-neutral-300' : 'text-neutral-500'}`}>
                        {t.hint}
                      </span>
                    </button>
                  );
                })}
              </div>

              {source === 'stock' ? (
                <div className="space-y-3 pt-1">
                  {stockOptions.length === 0 ? (
                    <div className="p-4 bg-neutral-50 border border-neutral-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="text-xs text-neutral-600">
                        <div className="font-semibold text-neutral-900">No allocatable inventory items available</div>
                        <p className="text-[11px] text-neutral-500 mt-0.5">
                          Items with available quantity outside {loc.room} can be assigned here, or register new stock in Inventory.
                        </p>
                      </div>
                      <Link
                        href="/stock"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-neutral-300 hover:bg-neutral-100 rounded-xl text-xs font-semibold text-neutral-800 shrink-0"
                      >
                        <span>Open Inventory</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  ) : (
                    <>
                      <div>
                        <label className="block text-xs font-semibold text-neutral-800 mb-1.5">
                          Select Existing Item from Inventory <span className="text-rose-500">*</span>
                        </label>
                        <Dropdown
                          value={selectedStockId}
                          options={stockOptions}
                          onChange={handleSelectStock}
                          placeholder="-- Choose item from Inventory (/stock) --"
                          searchable
                          searchPlaceholder="Search name, SKU, or current location..."
                          className="w-full"
                          buttonClassName={dropdownBtn}
                        />
                      </div>

                      {selectedStock && (
                        <div className="p-3.5 bg-neutral-50 border border-neutral-200/80 rounded-xl flex items-start gap-3">
                          <LabThumbnail
                            src={selectedStock.imageUrl}
                            alt={selectedStock.name}
                            size="thumb"
                            fallbackType="item"
                            className="w-12 h-12 rounded-lg border border-neutral-200 shrink-0"
                          />
                          <div className="min-w-0 flex-1 space-y-1">
                            <div className="text-xs font-bold text-neutral-900 truncate">{selectedStock.name}</div>
                            <div className="text-[11px] text-neutral-500 font-mono truncate">
                              SKU: {selectedStock.code} • {selectedStock.category}
                              {derivedGroup ? ` (${getCategoryLabel(derivedGroup)})` : ''}
                            </div>
                            <div className="text-[11px] text-neutral-500 truncate">
                              Currently stationed: <span className="font-medium text-neutral-700">{selectedStock.location}</span>
                              {selectedStock.rack && selectedStock.rack !== 'Unassigned' ? ` • ${selectedStock.rack}` : ''}
                            </div>
                          </div>
                          <span className="px-2.5 py-1 rounded-md text-[11px] font-mono font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0 whitespace-nowrap">
                            {selectedStock.quantity} {selectedStock.unit} avail
                          </span>
                        </div>
                      )}
                    </>
                  )}
                </div>
              ) : (
                <div className="space-y-3 pt-1">
                  {assetOptions.length === 0 ? (
                    <div className="p-4 bg-neutral-50 border border-neutral-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="text-xs text-neutral-600">
                        <div className="font-semibold text-neutral-900">No hardware devices available to assign</div>
                        <p className="text-[11px] text-neutral-500 mt-0.5">
                          Every registered hardware asset is already in {loc.room}. Manage fleet devices in Hardware Assets.
                        </p>
                      </div>
                      <Link
                        href="/assets"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-neutral-300 hover:bg-neutral-100 rounded-xl text-xs font-semibold text-neutral-800 shrink-0"
                      >
                        <span>Open Hardware Assets</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  ) : (
                    <>
                      <div>
                        <label className="block text-xs font-semibold text-neutral-800 mb-1.5">
                          Select Existing Device from Hardware Assets <span className="text-rose-500">*</span>
                        </label>
                        <Dropdown
                          value={selectedAssetId}
                          options={assetOptions}
                          onChange={handleSelectAsset}
                          placeholder="-- Choose device from Hardware Assets (/assets) --"
                          searchable
                          searchPlaceholder="Search device name, serial, or current room..."
                          className="w-full"
                          buttonClassName={dropdownBtn}
                        />
                      </div>

                      {selectedAsset && (
                        <div className="p-3.5 bg-neutral-50 border border-neutral-200/80 rounded-xl flex items-start gap-3">
                          <LabThumbnail
                            src={selectedAsset.imageUrl}
                            alt={selectedAsset.name}
                            size="thumb"
                            fallbackType="item"
                            className="w-12 h-12 rounded-lg border border-neutral-200 shrink-0"
                          />
                          <div className="min-w-0 flex-1 space-y-1">
                            <div className="text-xs font-bold text-neutral-900 truncate">{selectedAsset.name}</div>
                            <div className="text-[11px] text-neutral-500 font-mono truncate">
                              SN: {selectedAsset.serialNumber} • {selectedAsset.model}
                            </div>
                            <div className="text-[11px] text-neutral-500 truncate">
                              Current room:{' '}
                              <span className="font-medium text-neutral-700">
                                {selectedAsset.location || 'Unassigned'}
                              </span>{' '}
                              → <span className="font-semibold text-emerald-700">{loc.room}</span>
                            </div>
                          </div>
                          <span className="px-2.5 py-1 rounded-md text-[11px] font-mono font-bold bg-neutral-900 text-white shrink-0 whitespace-nowrap">
                            {selectedAsset.totalUnits ?? 1} {selectedAsset.unitType || 'Units'}
                          </span>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Assignment Quantities / Notes (only editable fields — metadata synced from /stock or /assets) */}
            {(selectedStock || selectedAsset) && (
              <div className="bg-white border border-neutral-200/80 rounded-2xl p-5 sm:p-6 shadow-2xs space-y-4">
                <div className="flex items-center gap-2 border-b border-neutral-100 pb-3">
                  <ClipboardList className="w-4 h-4 text-neutral-700" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-900">
                    {source === 'stock' ? 'Allocation Quantities & Placement' : 'Assignment Notes'}
                  </h3>
                </div>

                {source === 'stock' && selectedStock && (
                  <div className="p-3.5 bg-neutral-50/80 border border-neutral-200/70 rounded-xl space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-600">
                        Units to Assign
                      </span>
                      <span className="text-[11px] font-mono font-bold text-neutral-900 bg-white px-2 py-0.5 rounded border border-neutral-200">
                        Total: {totalAllocated} {selectedStock.unit || 'Units'}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="flex items-center gap-1.5 text-xs font-semibold text-neutral-800 mb-1.5">
                          <span className="w-2 h-2 rounded-full bg-emerald-500" />
                          <span>Working Units</span>
                        </label>
                        <input
                          type="number"
                          min={0}
                          max={selectedStock.quantity}
                          value={qtyWorking}
                          onChange={(e) => setQtyWorking(Math.max(0, parseInt(e.target.value, 10) || 0))}
                          className={`${inputCls} font-mono font-bold`}
                        />
                      </div>
                      <div>
                        <label className="flex items-center gap-1.5 text-xs font-semibold text-neutral-800 mb-1.5">
                          <span className="w-2 h-2 rounded-full bg-rose-500" />
                          <span>Broken Units</span>
                        </label>
                        <input
                          type="number"
                          min={0}
                          max={selectedStock.quantity}
                          value={qtyBroken}
                          onChange={(e) => setQtyBroken(Math.max(0, parseInt(e.target.value, 10) || 0))}
                          className={`${inputCls} font-mono`}
                        />
                      </div>
                    </div>

                    {exceedsStock && (
                      <p className="text-[11px] text-rose-700 font-medium flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                        <span>
                          Requested {totalAllocated} {selectedStock.unit} exceeds available stock (
                          {selectedStock.quantity} {selectedStock.unit}).
                        </span>
                      </p>
                    )}
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-neutral-800 mb-1.5">
                    {source === 'stock' ? 'Classroom Placement / Remarks' : 'Transfer / Placement Notes'}
                  </label>
                  <textarea
                    rows={3}
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    placeholder={
                      source === 'stock'
                        ? 'e.g. Student benches 1-4, instructor cabinet...'
                        : `e.g. Deployed in ${loc.room} rack or lab stations...`
                    }
                    className={inputCls}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Right: summary */}
          <div className="lg:col-span-4 space-y-4 lg:sticky lg:top-0">
            <div className="bg-white border border-neutral-200/80 rounded-2xl p-5 sm:p-6 shadow-2xs space-y-4 text-xs">
              <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-900">Assignment Summary</h3>
                <span className="font-mono text-[10px] font-bold bg-neutral-900 text-white px-2 py-0.5 rounded-lg">
                  {loc.room}
                </span>
              </div>

              <div className="p-3 bg-neutral-50 border border-neutral-200/70 rounded-xl space-y-1">
                <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase text-neutral-400">
                  <MapPin className="w-3 h-3 text-emerald-600" />
                  <span>Destination Classroom</span>
                </div>
                <div className="font-semibold text-neutral-900">{loc.name}</div>
                <div className="text-[11px] text-neutral-500">
                  {loc.building} • Floor {loc.floor ?? 1}
                </div>
              </div>

              <div className="space-y-2.5">
                <div className="flex justify-between items-center py-1 border-b border-neutral-100">
                  <span className="text-neutral-500">Source Registry</span>
                  <span className="font-semibold text-neutral-900">
                    {source === 'stock' ? 'Inventory (/stock)' : 'Hardware Assets (/assets)'}
                  </span>
                </div>

                {source === 'stock' ? (
                  <>
                    <div className="flex justify-between items-center py-1 border-b border-neutral-100">
                      <span className="text-neutral-500">Selected Item</span>
                      <span className="font-semibold text-neutral-900 truncate max-w-[160px]">
                        {selectedStock ? selectedStock.name : 'None'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-1 border-b border-neutral-100">
                      <span className="text-neutral-500">Working / Broken</span>
                      <span className="font-mono text-neutral-800">
                        <span className="text-emerald-700 font-bold">{qtyWorking}</span>
                        {' / '}
                        <span className={qtyBroken > 0 ? 'text-rose-600 font-bold' : 'text-neutral-400'}>
                          {qtyBroken}
                        </span>
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-1">
                      <span className="text-neutral-500">Total to assign</span>
                      <span className="font-mono font-bold text-neutral-900 text-sm">
                        {totalAllocated} {selectedStock?.unit || 'Units'}
                      </span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex justify-between items-center py-1 border-b border-neutral-100">
                      <span className="text-neutral-500">Selected Device</span>
                      <span className="font-semibold text-neutral-900 truncate max-w-[160px]">
                        {selectedAsset ? selectedAsset.name : 'None'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-1">
                      <span className="text-neutral-500">Units</span>
                      <span className="font-mono font-bold text-neutral-900 text-sm">
                        {selectedAsset
                          ? `${selectedAsset.totalUnits ?? 1} ${selectedAsset.unitType || 'Units'}`
                          : '—'}
                      </span>
                    </div>
                  </>
                )}
              </div>

              {source === 'stock' && selectedStock && (
                <div
                  className={`p-3 rounded-xl border ${
                    exceedsStock ? 'bg-rose-50 border-rose-200' : 'bg-emerald-50/80 border-emerald-200'
                  }`}
                >
                  <div className="flex justify-between">
                    <span className="text-neutral-600">Stock available now</span>
                    <span className="font-mono font-bold text-neutral-900">
                      {selectedStock.quantity} {selectedStock.unit}
                    </span>
                  </div>
                  <div className="flex justify-between mt-1">
                    <span className="text-neutral-600">Remaining after assign</span>
                    <span className={`font-mono font-bold ${exceedsStock ? 'text-rose-700' : 'text-emerald-700'}`}>
                      {selectedStock.quantity - totalAllocated} {selectedStock.unit}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function NewRoomItemClient({ id }: { id: string }) {
  return (
    <Suspense fallback={<LoadingScreen message="Loading classroom assignment workspace..." />}>
      <NewRoomItemInner id={id} />
    </Suspense>
  );
}
