'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/Header';
import { Dropdown } from '@/components/Dropdown';
import { useStock } from '@/context/StockContext';
import { useAuth } from '@/context/AuthContext';
import { AssetGroup } from '@/types';
import { Boxes, Microscope, PenLine, Plus, Layers, ClipboardList, MapPin, CheckCircle2, AlertTriangle } from 'lucide-react';
import { categoryGroupOptions, findLocation } from '../shared';
import { LoadingScreen } from '@/components/LoadingScreen';
import { LabThumbnail } from '@/components/LabThumbnail';

type Source = 'stock' | 'asset' | 'custom';

export default function NewRoomItemClient({ id }: { id: string }) {
  const router = useRouter();
  const { locations, stock, assets, addRoomInventoryItem, addStockItem, updateStockQuantity, showToast, isLoading } = useStock();
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

  if (isLoading || !loc) {
    return <LoadingScreen message="Loading allocation workspace..." />;
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

    let linkedStockId: string | undefined = undefined;

    if (source === 'stock') {
      linkedStockId = selectedStock?.id;
    } else if (source === 'custom') {
      // Find if an item with the same name already exists in Central Stock
      const existingStock = stock.find(
        (s) => s.name.trim().toLowerCase() === name.trim().toLowerCase()
      );

      if (existingStock) {
        linkedStockId = existingStock.id;
        updateStockQuantity(existingStock.id, -totalAllocated);
      } else {
        // Automatically register new item in Central Stock (/stock)
        const prefix =
          group === 'FURNITURE'
            ? 'FURN'
            : group === 'ELECTRICAL'
            ? 'ELEC'
            : group === 'IT_HARDWARE'
            ? 'IT'
            : 'SAFE';
        const cleanName = name.replace(/[^a-zA-Z0-9]/g, '').slice(0, 4).toUpperCase();
        const randId = Math.floor(100 + Math.random() * 900);
        const generatedCode = `${prefix}-${cleanName || 'ITEM'}-${randId}`;

        const categoryLabel =
          group === 'FURNITURE'
            ? 'Department Furniture & Seating'
            : group === 'ELECTRICAL'
            ? 'Electrical & HVAC'
            : group === 'IT_HARDWARE'
            ? 'Lab & IT Hardware'
            : 'Safety & Miscellaneous';

        const createdStock = addStockItem({
          name: name.trim(),
          code: generatedCode,
          category: categoryLabel,
          quantity: totalAllocated,
          unit: unit.trim() || 'pcs',
          location: `${loc.name} (${loc.room})`,
          rack: `Room ${loc.room.replace(/^(rm|room)\s*/i, '')} Storage`,
          expiryDate: 'Active',
          description: brandSpec.trim() || remarks.trim() || `Allocated in ${loc.name} (${loc.room})`,
        });

        linkedStockId = createdStock.id;
      }
    }

    addRoomInventoryItem(loc.id, {
      stockItemId: linkedStockId,
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
      updateStockQuantity(selectedStock.id, -totalAllocated);
      showToast(`Allocated ${totalAllocated} ${unit} of "${name}" from Central Stock to ${loc.room}`, 'success');
    } else if (source === 'custom') {
      showToast(`Added "${name}" to ${loc.room} and registered in Central Stock`, 'success');
    } else {
      showToast(`Added "${name}" to ${loc.room}`, 'success');
    }

    setTimeout(() => router.push(backHref), 200);
  };

  const inputCls =
    'w-full bg-white border border-neutral-300 text-neutral-900 text-xs px-3 py-2 rounded-xl focus:outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 transition-colors placeholder:text-neutral-400';
  const dropdownBtn =
    'w-full justify-between bg-white border border-neutral-300 text-neutral-900 text-xs px-3 py-2 rounded-xl hover:border-neutral-400 transition-colors';

  const sourceTabs: { key: Source; label: string; hint: string; icon: React.ReactNode }[] = [
    { key: 'stock', label: 'Central Stock', hint: 'Allocate consumables & furniture', icon: <Boxes className="w-4 h-4" /> },
    { key: 'asset', label: 'Central Assets', hint: 'Assign serialized hardware', icon: <Microscope className="w-4 h-4" /> },
    { key: 'custom', label: 'Custom Item', hint: 'Create & register new stock', icon: <PenLine className="w-4 h-4" /> },
  ];

  return (
    <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-neutral-50/50">
      <Header
        title={`Allocate Equipment to ${loc.room}`}
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
              form="new-room-item-form"
              disabled={submitting || !isAllowed || exceedsStock}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-neutral-900 hover:bg-neutral-800 disabled:bg-neutral-400 text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer shadow-xs"
            >
              <Plus className="w-3.5 h-3.5 text-emerald-400" />
              <span>{submitting ? 'Allocating...' : `Allocate to ${loc.room}`}</span>
            </button>
          </div>
        }
      />

      <div className="flex-1 overflow-y-auto p-4 sm:p-8 w-full">
        {!isAllowed && (
          <div className="mb-6 p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>You have read-only access to {loc.room}. Only assigned operators or administrators can add equipment.</span>
          </div>
        )}

        <form id="new-room-item-form" onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left: form */}
          <div className="lg:col-span-8 space-y-6">
            {/* Source */}
            <div className="bg-white border border-neutral-200/80 rounded-2xl p-5 sm:p-6 shadow-2xs space-y-4">
              <div className="flex items-center gap-2 border-b border-neutral-100 pb-3">
                <Layers className="w-4 h-4 text-neutral-700" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-900">Equipment Source</h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {sourceTabs.map((t) => {
                  const active = source === t.key;
                  return (
                    <button
                      key={t.key}
                      type="button"
                      onClick={() => {
                        setSource(t.key);
                        setStockCode('');
                        setAssetSerial('');
                        resetFields();
                      }}
                      className={`flex flex-col items-start gap-1 p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        active
                          ? 'bg-neutral-900 text-white border-neutral-900 shadow-xs'
                          : 'bg-neutral-50/50 text-neutral-700 border-neutral-200 hover:bg-white hover:border-neutral-300'
                      }`}
                    >
                      <div className="flex items-center gap-2 text-xs font-bold">
                        <span className={active ? 'text-emerald-400' : 'text-neutral-500'}>{t.icon}</span>
                        <span>{t.label}</span>
                      </div>
                      <span className={`text-[10px] ${active ? 'text-neutral-300' : 'text-neutral-400'}`}>
                        {t.hint}
                      </span>
                    </button>
                  );
                })}
              </div>

              {source === 'stock' && (
                <div className="space-y-3 pt-1">
                  <div>
                    <label className="block text-xs font-semibold text-neutral-800 mb-1.5">
                      Select Item from Central Stock <span className="text-rose-500">*</span>
                    </label>
                    <Dropdown
                      value={stockCode}
                      options={stockOptions}
                      onChange={handleSelectStock}
                      placeholder="-- Choose item from Central Stock --"
                      searchable
                      searchPlaceholder="Search name or SKU..."
                      className="w-full"
                      buttonClassName={dropdownBtn}
                    />
                  </div>

                  {selectedStock && (
                    <div className="p-3 bg-neutral-50 border border-neutral-200/80 rounded-xl flex items-center gap-3">
                      <LabThumbnail
                        src={selectedStock.imageUrl}
                        alt={selectedStock.name}
                        size="thumb"
                        fallbackType="item"
                        className="w-10 h-10 rounded-lg border border-neutral-200 shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-bold text-neutral-900 truncate">{selectedStock.name}</div>
                        <div className="text-[11px] text-neutral-500 font-mono truncate">
                          SKU: {selectedStock.code} • {selectedStock.category}
                        </div>
                      </div>
                      <span className="px-2.5 py-1 rounded-md text-[11px] font-mono font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0 whitespace-nowrap">
                        {selectedStock.quantity} {selectedStock.unit} avail
                      </span>
                    </div>
                  )}
                </div>
              )}

              {source === 'asset' && (
                <div className="space-y-3 pt-1">
                  <div>
                    <label className="block text-xs font-semibold text-neutral-800 mb-1.5">
                      Select Device from Hardware Assets <span className="text-rose-500">*</span>
                    </label>
                    <Dropdown
                      value={assetSerial}
                      options={assetOptions}
                      onChange={handleSelectAsset}
                      placeholder="-- Choose device from Hardware Assets --"
                      searchable
                      searchPlaceholder="Search name or serial..."
                      className="w-full"
                      buttonClassName={dropdownBtn}
                    />
                  </div>

                  {selectedAsset && (
                    <div className="p-3 bg-neutral-50 border border-neutral-200/80 rounded-xl flex items-center gap-3">
                      <LabThumbnail
                        src={selectedAsset.imageUrl}
                        alt={selectedAsset.name}
                        size="thumb"
                        fallbackType="item"
                        className="w-10 h-10 rounded-lg border border-neutral-200 shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-bold text-neutral-900 truncate">{selectedAsset.name}</div>
                        <div className="text-[11px] text-neutral-500 font-mono truncate">
                          SN: {selectedAsset.serialNumber} • {selectedAsset.model}
                        </div>
                      </div>
                      <span className="px-2.5 py-1 rounded-md text-[11px] font-mono font-bold bg-neutral-900 text-white shrink-0 whitespace-nowrap">
                        {selectedAsset.totalUnits ?? 1} {selectedAsset.unitType || 'Units'}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {source === 'custom' && (
                <p className="text-[11px] text-emerald-800 bg-emerald-50 border border-emerald-200/80 rounded-lg px-3 py-2 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                  <span>
                    Custom items will be added to this room and automatically registered in Central Stock (<code className="font-mono font-semibold">/stock</code>).
                  </span>
                </p>
              )}
            </div>

            {/* Details */}
            <div className="bg-white border border-neutral-200/80 rounded-xl p-5 sm:p-6 shadow-2xs space-y-4">
              <div className="flex items-center gap-2 border-b border-neutral-100 pb-3">
                <ClipboardList className="w-4 h-4 text-neutral-700" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-900">Equipment Details &amp; Quantities</h3>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-800 mb-1.5">
                  Item / Equipment Name <span className="text-rose-500">*</span>
                </label>
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
                  <label className="block text-xs font-semibold text-neutral-800 mb-1.5">Category Group</label>
                  <Dropdown
                    value={group}
                    options={categoryGroupOptions}
                    onChange={(v) => setGroup(v as AssetGroup)}
                    className="w-full"
                    buttonClassName={dropdownBtn}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-neutral-800 mb-1.5">Unit</label>
                  <input type="text" value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="pcs, sets, units" className={inputCls} />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-800 mb-1.5">Specification / Model</label>
                <input
                  type="text"
                  value={brandSpec}
                  onChange={(e) => setBrandSpec(e.target.value)}
                  placeholder="e.g. Heavy-duty Ergonomic Mesh Swivel"
                  className={inputCls}
                />
              </div>

              <div className="p-3.5 bg-neutral-50/80 border border-neutral-200/70 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-600">Quantity &amp; Condition</span>
                  <span className="text-[11px] font-mono font-bold text-neutral-900 bg-white px-2 py-0.5 rounded border border-neutral-200">
                    Total: {totalAllocated} {unit || 'pcs'}
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
                      value={qtyWorking}
                      onChange={(e) => setQtyWorking(Math.max(0, parseInt(e.target.value) || 0))}
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
                      value={qtyBroken}
                      onChange={(e) => setQtyBroken(Math.max(0, parseInt(e.target.value) || 0))}
                      className={`${inputCls} font-mono`}
                    />
                  </div>
                </div>

                {exceedsStock && (
                  <p className="text-[11px] text-rose-700 font-medium flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    <span>Requested {totalAllocated} {unit} exceeds available Central Stock ({selectedStock?.quantity} {selectedStock?.unit}).</span>
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-800 mb-1.5">Placement / Remarks</label>
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
          <div className="lg:col-span-4 space-y-4 lg:sticky lg:top-0">
            <div className="bg-white border border-neutral-200/80 rounded-2xl p-5 sm:p-6 shadow-2xs space-y-4 text-xs">
              <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-900">
                  Allocation Summary
                </h3>
                <span className="font-mono text-[10px] font-bold bg-neutral-900 text-white px-2 py-0.5 rounded-lg">
                  {loc.room}
                </span>
              </div>

              <div className="p-3 bg-neutral-50 border border-neutral-200/70 rounded-xl space-y-1">
                <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase text-neutral-400">
                  <MapPin className="w-3 h-3 text-emerald-600" />
                  <span>Destination Room</span>
                </div>
                <div className="font-semibold text-neutral-900">{loc.name}</div>
                <div className="text-[11px] text-neutral-500">{loc.building} • Floor {loc.floor}</div>
              </div>

              <div className="space-y-2.5">
                <div className="flex justify-between items-center py-1 border-b border-neutral-100">
                  <span className="text-neutral-500">Source</span>
                  <span className="font-semibold text-neutral-900">
                    {source === 'stock' ? 'Central Stock' : source === 'asset' ? 'Central Assets' : 'Custom Item'}
                  </span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-neutral-100">
                  <span className="text-neutral-500">Working / Broken</span>
                  <span className="font-mono text-neutral-800">
                    <span className="text-emerald-700 font-bold">{qtyWorking}</span>
                    {' / '}
                    <span className={qtyBroken > 0 ? 'text-rose-600 font-bold' : 'text-neutral-400'}>{qtyBroken}</span>
                  </span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-neutral-500">Total to allocate</span>
                  <span className="font-mono font-bold text-neutral-900 text-sm">
                    {totalAllocated} {unit}
                  </span>
                </div>
              </div>

              {source === 'stock' && selectedStock && (
                <div className={`p-3 rounded-xl border ${exceedsStock ? 'bg-rose-50 border-rose-200' : 'bg-emerald-50/80 border-emerald-200'}`}>
                  <div className="flex justify-between">
                    <span className="text-neutral-600">Central stock now</span>
                    <span className="font-mono font-bold text-neutral-900">{selectedStock.quantity} {selectedStock.unit}</span>
                  </div>
                  <div className="flex justify-between mt-1">
                    <span className="text-neutral-600">After allocation</span>
                    <span className={`font-mono font-bold ${exceedsStock ? 'text-rose-700' : 'text-emerald-700'}`}>
                      {selectedStock.quantity - totalAllocated} {selectedStock.unit}
                    </span>
                  </div>
                  {exceedsStock && (
                    <p className="text-[11px] text-rose-700 mt-2 font-medium">Not enough units in Central Stock.</p>
                  )}
                </div>
              )}

              {source === 'custom' && (
                <div className="p-3 rounded-xl border bg-emerald-50/80 border-emerald-200 text-emerald-950">
                  <div className="font-semibold text-emerald-900 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Auto-register in Central Stock</span>
                  </div>
                  <p className="text-[11px] text-emerald-800 mt-1 leading-relaxed">
                    Will automatically create an inventory item in Central Stock (<span className="font-mono font-semibold">/stock</span>) and link it directly to {loc.room}.
                  </p>
                </div>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

