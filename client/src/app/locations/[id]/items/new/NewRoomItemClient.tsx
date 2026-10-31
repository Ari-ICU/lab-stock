'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/Header';
import { Dropdown } from '@/components/Dropdown';
import { useStock } from '@/context/StockContext';
import { useAuth } from '@/context/AuthContext';
import { AssetGroup } from '@/types';
import { Boxes, Microscope, PenLine, Plus, ArrowLeft, Layers, ClipboardList } from 'lucide-react';
import { categoryGroupOptions, findLocation } from '../shared';

type Source = 'stock' | 'asset' | 'custom';

export default function NewRoomItemClient({ id }: { id: string }) {
  const router = useRouter();
  const { locations, stock, assets, addRoomInventoryItem, updateStockQuantity, showToast } = useStock();
  const { user, canManageLocation } = useAuth();

  const loc = findLocation(locations, id);

  const [source, setSource] = useState<Source>('stock');
  const [stockCode, setStockCode] = useState('');
  const [assetSerial, setAssetSerial] = useState('');
  const [name, setName] = useState('');
  const [group, setGroup] = useState<AssetGroup>('FURNITURE');
  const [brandSpec, setBrandSpec] = useState('');
  const [unit, setUnit] = useState('pcs');
  const [qtyWorking, setQtyWorking] = useState(1);
  const [qtyBroken, setQtyBroken] = useState(0);
  const [remarks, setRemarks] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const stockOptions = useMemo(
    () => stock.map((s) => ({ label: `${s.name} (${s.code}) — ${s.quantity} ${s.unit} available`, value: s.code })),
    [stock]
  );
  const assetOptions = useMemo(
    () => assets.map((a) => ({ label: `${a.name} (${a.serialNumber}) — ${a.totalUnits ?? 1} units`, value: a.serialNumber })),
    [assets]
  );

  const selectedStock = stock.find((s) => s.code === stockCode);
  const selectedAsset = assets.find((a) => a.serialNumber === assetSerial);

  if (!loc) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 text-neutral-400 text-xs">
        Loading classroom...
      </div>
    );
  }

  const isAdmin = user?.roleBadge === 'Admin' || user?.role === 'Primary Lab Administrator';
  const isAllowed = isAdmin || canManageLocation(loc.room) || canManageLocation(loc.name);
  const backHref = `/locations/${loc.id}`;

  const resetFields = () => {
    setName('');
    setBrandSpec('');
    setUnit('pcs');
    setQtyWorking(1);
    setQtyBroken(0);
    setRemarks('');
  };

  const handleSelectStock = (code: string) => {
    setStockCode(code);
    const item = stock.find((s) => s.code === code);
    if (!item) return;
    setName(item.name);
    setUnit(item.unit || 'pcs');
    setBrandSpec(item.description || item.rack || '');
    const text = `${item.category} ${item.name}`.toLowerCase();
    if (/(chair|table|desk|cabinet|fixture|bench|whiteboard|seating|locker)/.test(text)) setGroup('FURNITURE');
    else if (/(electrical|cable|power|hvac|light|socket)/.test(text)) setGroup('ELECTRICAL');
    else if (/(safety|fire|tool)/.test(text)) setGroup('SAFETY_MISC');
    else setGroup('IT_HARDWARE');
    setQtyWorking(Math.min(item.quantity || 1, 1));
    setQtyBroken(0);
    setRemarks('');
  };

  const handleSelectAsset = (serial: string) => {
    setAssetSerial(serial);
    const a = assets.find((x) => x.serialNumber === serial);
    if (!a) return;
    setName(a.name);
    setUnit(a.unitType || 'Units');
    setBrandSpec(`Model: ${a.model} • S/N: ${a.serialNumber}`);
    setGroup('IT_HARDWARE');
    setQtyWorking(a.totalUnits ?? 1);
    setQtyBroken(0);
    setRemarks('');
  };

  const totalAllocated = (Number(qtyWorking) || 0) + (Number(qtyBroken) || 0);
  const exceedsStock = source === 'stock' && selectedStock ? totalAllocated > selectedStock.quantity : false;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAllowed) {
      showToast('You do not have permission to manage this classroom', 'error');
      return;
    }
    if (source === 'stock' && !selectedStock) {
      showToast('Please select an item from Central Stock', 'warning');
      return;
    }
    if (source === 'asset' && !selectedAsset) {
      showToast('Please select a device from Central Assets', 'warning');
      return;
    }
    if (!name.trim()) {
      showToast('Please enter an item name', 'warning');
      return;
    }
    if (totalAllocated <= 0) {
      showToast('Quantity must be at least 1', 'warning');
      return;
    }
    if (exceedsStock) {
      showToast(`Only ${selectedStock?.quantity} ${selectedStock?.unit} available in Central Stock`, 'warning');
      return;
    }

    setSubmitting(true);
    addRoomInventoryItem(loc.id, {
      stockItemId: source === 'stock' ? selectedStock?.id : undefined,
      assetId: source === 'asset' ? selectedAsset?.id : undefined,
      name: name.trim(),
      group,
      brandSpec: brandSpec.trim() || undefined,
      unit: unit.trim() || 'pcs',
      qtyWorking: Number(qtyWorking) || 0,
      qtyBroken: Number(qtyBroken) || 0,
      qtyMaintenance: 0,
      remarks: remarks.trim() || undefined,
    });

    if (source === 'stock' && selectedStock) {
      updateStockQuantity(selectedStock.code, -totalAllocated);
      showToast(`Allocated ${totalAllocated} ${unit} of "${name}" from Central Stock to ${loc.room}`, 'success');
    } else {
      showToast(`Added "${name}" to ${loc.room}`, 'success');
    }

    setTimeout(() => router.push(backHref), 200);
  };

  const inputCls =
    'w-full bg-white border border-neutral-300 text-neutral-900 text-xs px-3 py-2 rounded focus:outline-none focus:border-neutral-900';
  const dropdownBtn = 'w-full justify-between bg-white border border-neutral-300 text-neutral-900 text-xs px-3 py-2 rounded';

  const sourceTabs: { key: Source; label: string; icon: React.ReactNode }[] = [
    { key: 'stock', label: 'Central Stock', icon: <Boxes className="w-3.5 h-3.5" /> },
    { key: 'asset', label: 'Central Assets', icon: <Microscope className="w-3.5 h-3.5" /> },
    { key: 'custom', label: 'Custom Item', icon: <PenLine className="w-3.5 h-3.5" /> },
  ];

  return (
    <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-neutral-50/50">
      <Header
        title={`Add Equipment to ${loc.room}`}
        subtitle={`${loc.name} • ${loc.building}`}
        backHref={backHref}
        backLabel={loc.room}
        showExport={false}
        actions={
          <div className="flex items-center gap-2">
            <Link
              href={backHref}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-neutral-200 text-neutral-700 hover:bg-neutral-50 rounded text-xs font-medium transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              form="new-room-item-form"
              disabled={submitting || !isAllowed}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-neutral-900 hover:bg-neutral-800 disabled:bg-neutral-400 text-white rounded text-xs font-semibold transition-colors cursor-pointer shadow-xs"
            >
              <Plus className="w-3.5 h-3.5 text-emerald-400" />
              <span>{submitting ? 'Saving...' : `Add to ${loc.room}`}</span>
            </button>
          </div>
        }
      />

      <div className="flex-1 overflow-y-auto p-4 sm:p-8 w-full">
        {!isAllowed && (
          <div className="mb-6 p-3 bg-amber-50 border border-amber-200 rounded text-xs text-amber-900">
            You have read-only access to {loc.room}. Only assigned operators or administrators can add equipment.
          </div>
        )}

        <form id="new-room-item-form" onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: form */}
          <div className="lg:col-span-8 space-y-6">
            {/* Source */}
            <div className="bg-white border border-neutral-200 rounded p-5 sm:p-6 space-y-4">
              <div className="flex items-center gap-2 border-b border-neutral-100 pb-3">
                <Layers className="w-4 h-4 text-neutral-700" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-900">Source</h3>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {sourceTabs.map((t) => (
                  <button
                    key={t.key}
                    type="button"
                    onClick={() => {
                      setSource(t.key);
                      setStockCode('');
                      setAssetSerial('');
                      resetFields();
                    }}
                    className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded border text-xs font-semibold transition-colors cursor-pointer ${
                      source === t.key
                        ? 'bg-neutral-900 text-white border-neutral-900'
                        : 'bg-white text-neutral-700 border-neutral-200 hover:bg-neutral-50'
                    }`}
                  >
                    {t.icon}
                    {t.label}
                  </button>
                ))}
              </div>

              {source === 'stock' && (
                <div>
                  <label className="block text-xs font-semibold text-neutral-800 mb-1">Select item from Central Stock *</label>
                  <Dropdown
                    value={stockCode}
                    options={stockOptions}
                    onChange={handleSelectStock}
                    placeholder="-- Choose item from /stock --"
                    searchable
                    searchPlaceholder="Search name or SKU..."
                    className="w-full"
                    buttonClassName={dropdownBtn}
                  />
                </div>
              )}

              {source === 'asset' && (
                <div>
                  <label className="block text-xs font-semibold text-neutral-800 mb-1">Select device from Central Assets *</label>
                  <Dropdown
                    value={assetSerial}
                    options={assetOptions}
                    onChange={handleSelectAsset}
                    placeholder="-- Choose device from /assets --"
                    searchable
                    searchPlaceholder="Search name or serial..."
                    className="w-full"
                    buttonClassName={dropdownBtn}
                  />
                </div>
              )}

              {source === 'custom' && (
                <p className="text-[11px] text-neutral-500">
                  Custom items are registered in this room only and are not deducted from Central Stock.
                </p>
              )}
            </div>

            {/* Details */}
            <div className="bg-white border border-neutral-200 rounded p-5 sm:p-6 space-y-4">
              <div className="flex items-center gap-2 border-b border-neutral-100 pb-3">
                <ClipboardList className="w-4 h-4 text-neutral-700" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-900">Equipment Details</h3>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-800 mb-1">Item / Equipment Name *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Student Chair"
                  className={inputCls}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-800 mb-1">Category Group</label>
                  <Dropdown
                    value={group}
                    options={categoryGroupOptions}
                    onChange={(v) => setGroup(v as AssetGroup)}
                    className="w-full"
                    buttonClassName={dropdownBtn}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-neutral-800 mb-1">Unit</label>
                  <input type="text" value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="pcs, sets, units" className={inputCls} />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-800 mb-1">Specification / Model</label>
                <input
                  type="text"
                  value={brandSpec}
                  onChange={(e) => setBrandSpec(e.target.value)}
                  placeholder="e.g. Heavy-duty Ergonomic Mesh Swivel"
                  className={inputCls}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-800 mb-1">Working Units</label>
                  <input
                    type="number"
                    min={0}
                    value={qtyWorking}
                    onChange={(e) => setQtyWorking(Math.max(0, parseInt(e.target.value) || 0))}
                    className={`${inputCls} font-mono font-bold`}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-neutral-800 mb-1">Broken Units</label>
                  <input
                    type="number"
                    min={0}
                    value={qtyBroken}
                    onChange={(e) => setQtyBroken(Math.max(0, parseInt(e.target.value) || 0))}
                    className={`${inputCls} font-mono`}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-800 mb-1">Placement / Remarks</label>
                <textarea
                  rows={3}
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="e.g. Student rows 1-4, instructor podium..."
                  className={inputCls}
                />
              </div>
            </div>
          </div>

          {/* Right: summary */}
          <div className="lg:col-span-4 space-y-4">
            <div className="bg-white border border-neutral-200 rounded p-5 space-y-3 text-xs lg:sticky lg:top-0">
              <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-900 border-b border-neutral-100 pb-3">
                Allocation Summary
              </h3>
              <div className="flex justify-between">
                <span className="text-neutral-500">Destination</span>
                <span className="font-semibold text-neutral-900">{loc.room}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Source</span>
                <span className="font-semibold text-neutral-900">
                  {source === 'stock' ? 'Central Stock' : source === 'asset' ? 'Central Assets' : 'Custom'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Total to allocate</span>
                <span className="font-mono font-bold text-neutral-900">
                  {totalAllocated} {unit}
                </span>
              </div>

              {source === 'stock' && selectedStock && (
                <div className={`p-3 rounded border ${exceedsStock ? 'bg-rose-50 border-rose-200' : 'bg-emerald-50 border-emerald-200'}`}>
                  <div className="flex justify-between">
                    <span className="text-neutral-600">Central stock now</span>
                    <span className="font-mono font-bold">{selectedStock.quantity}</span>
                  </div>
                  <div className="flex justify-between mt-1">
                    <span className="text-neutral-600">After allocation</span>
                    <span className={`font-mono font-bold ${exceedsStock ? 'text-rose-700' : 'text-emerald-700'}`}>
                      {selectedStock.quantity - totalAllocated}
                    </span>
                  </div>
                  {exceedsStock && (
                    <p className="text-[11px] text-rose-700 mt-2">Not enough units in Central Stock.</p>
                  )}
                </div>
              )}

              <Link
                href={backHref}
                className="flex items-center justify-center gap-1.5 w-full py-2 text-xs font-medium text-neutral-600 hover:text-neutral-900"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back to {loc.room}
              </Link>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

