'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Header } from '@/components/Header';
import { Dropdown } from '@/components/Dropdown';
import { useStock } from '@/context/StockContext';
import { useAuth } from '@/context/AuthContext';
import { AssetGroup } from '@/types';
import { Boxes, ClipboardList, Microscope, Save, Activity, RotateCcw } from 'lucide-react';
import {
  categoryGroupOptions,
  conditionStatusOptions,
  findLocation,
  findLinkedAsset,
  findLinkedStock,
  getConditionStatus,
} from '../shared';

export default function EditRoomItemClient({ id }: { id: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const itemId = searchParams.get('item') || '';
  const { locations, stock, assets, updateRoomInventoryItem, showToast } = useStock();
  const { user, canManageLocation } = useAuth();

  const loc = findLocation(locations, id);
  const item = loc?.inventories?.find((i) => i.id === itemId);

  const [name, setName] = useState('');
  const [group, setGroup] = useState<AssetGroup>('FURNITURE');
  const [unit, setUnit] = useState('pcs');
  const [brandSpec, setBrandSpec] = useState('');
  const [qtyWorking, setQtyWorking] = useState(0);
  const [qtyBroken, setQtyBroken] = useState(0);
  const [qtyMaintenance, setQtyMaintenance] = useState(0);
  const [remarks, setRemarks] = useState('');
  const [status, setStatus] = useState('operational');
  const [loaded, setLoaded] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const loadFromItem = () => {
    if (!item) return;
    setName(item.name);
    setGroup(item.group);
    setUnit(item.unit || 'pcs');
    setBrandSpec(item.brandSpec || '');
    setQtyWorking(item.qtyWorking || 0);
    setQtyBroken(item.qtyBroken || 0);
    setQtyMaintenance(item.qtyMaintenance || 0);
    setRemarks(item.remarks || '');
    setStatus(getConditionStatus(item));
  };

  useEffect(() => {
    if (item && !loaded) {
      loadFromItem();
      setLoaded(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item, loaded]);

  if (!loc) {
    return <div className="flex-1 flex items-center justify-center p-8 text-neutral-400 text-xs">Loading classroom...</div>;
  }

  const backHref = `/locations/${loc.id}`;

  if (!item) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 gap-3 text-xs text-neutral-500">
        <span>Equipment record not found in {loc.room}.</span>
        <Link href={backHref} className="px-3 py-1.5 bg-neutral-900 text-white rounded font-semibold">
          Back to {loc.room}
        </Link>
      </div>
    );
  }

  const viewHref = `/locations/${loc.id}/items/view?item=${item.id}`;
  const isAdmin = user?.roleBadge === 'Admin' || user?.role === 'Primary Lab Administrator';
  const isAllowed = isAdmin || canManageLocation(loc.room) || canManageLocation(loc.name);
  const linkedStock = findLinkedStock(item, stock);
  const linkedAsset = findLinkedAsset(item, assets);

  const total = qtyWorking + qtyBroken + qtyMaintenance;
  const percent = total > 0 ? Math.round((qtyWorking / total) * 100) : 100;

  // Status dropdown keeps the total constant and moves units between buckets
  const handleStatusChange = (val: string) => {
    setStatus(val);
    if (val === 'operational') {
      setQtyWorking(total);
      setQtyBroken(0);
      setQtyMaintenance(0);
    } else if (val === 'defective' && qtyBroken === 0 && qtyWorking > 0) {
      setQtyWorking(qtyWorking - 1);
      setQtyBroken(1);
    } else if (val === 'maintenance' && qtyMaintenance === 0 && qtyWorking > 0) {
      setQtyWorking(qtyWorking - 1);
      setQtyMaintenance(1);
    }
  };

  const syncStatus = (b: number, m: number) => {
    setStatus(getConditionStatus({ qtyBroken: b, qtyMaintenance: m }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAllowed) {
      showToast('You do not have permission to edit equipment in this classroom', 'error');
      return;
    }
    if (!name.trim()) {
      showToast('Please enter an item name', 'warning');
      return;
    }
    setSubmitting(true);
    updateRoomInventoryItem(loc.id, item.id, {
      name: name.trim(),
      group,
      unit: unit.trim() || 'pcs',
      brandSpec: brandSpec.trim(),
      qtyWorking,
      qtyBroken,
      qtyMaintenance,
      remarks: remarks.trim(),
    });
    setTimeout(() => router.push(viewHref), 200);
  };

  const inputCls =
    'w-full bg-white border border-neutral-300 text-neutral-900 text-xs px-3 py-2 rounded focus:outline-none focus:border-neutral-900';
  const dropdownBtn = 'w-full justify-between bg-white border border-neutral-300 text-neutral-900 text-xs px-3 py-2 rounded';
  const numInput = (value: number, onChange: (n: number) => void, color: string) => (
    <input
      type="number"
      min={0}
      value={value}
      onChange={(e) => onChange(Math.max(0, parseInt(e.target.value) || 0))}
      className={`w-full bg-white border text-xs px-3 py-2 rounded focus:outline-none font-mono font-bold text-center ${color}`}
    />
  );

  return (
    <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-neutral-50/50">
      <Header
        title={`Edit ${item.name}`}
        subtitle={`${loc.room} • ${loc.name}`}
        backHref={viewHref}
        backLabel="Details"
        showExport={false}
        actions={
          <div className="flex items-center gap-2">
            <Link
              href={viewHref}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-neutral-200 text-neutral-700 hover:bg-neutral-50 rounded text-xs font-medium transition-colors"
            >
              Cancel
            </Link>
            <button
              type="button"
              onClick={() => {
                loadFromItem();
                showToast('Form reset to saved values', 'info');
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-neutral-200 text-neutral-700 hover:bg-neutral-50 rounded text-xs font-medium transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5 text-neutral-500" />
              <span className="hidden sm:inline">Reset</span>
            </button>
            <button
              type="submit"
              form="edit-room-item-form"
              disabled={submitting || !isAllowed}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-neutral-900 hover:bg-neutral-800 disabled:bg-neutral-400 text-white rounded text-xs font-semibold transition-colors cursor-pointer shadow-xs"
            >
              <Save className="w-3.5 h-3.5 text-neutral-300" />
              <span>{submitting ? 'Saving...' : 'Save Changes'}</span>
            </button>
          </div>
        }
      />

      <div className="flex-1 overflow-y-auto p-4 sm:p-8 w-full">
        {!isAllowed && (
          <div className="mb-6 p-3 bg-amber-50 border border-amber-200 rounded text-xs text-amber-900">
            You have read-only access to {loc.room}.
          </div>
        )}

        <form id="edit-room-item-form" onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 space-y-6">
            {/* Equipment details */}
            <div className="bg-white border border-neutral-200 rounded p-5 sm:p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
                <div className="flex items-center gap-2">
                  <ClipboardList className="w-4 h-4 text-neutral-700" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-900">Equipment Details</h3>
                </div>
                <span className="text-[11px] font-mono text-neutral-400 truncate max-w-[180px]">ID: {item.id}</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-800 mb-1">Item / Equipment Name *</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} className={`${inputCls} font-semibold`} />
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
                  <input type="text" value={unit} onChange={(e) => setUnit(e.target.value)} className={inputCls} />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-800 mb-1">Specification / Model</label>
                <input type="text" value={brandSpec} onChange={(e) => setBrandSpec(e.target.value)} className={inputCls} />
              </div>
            </div>

            {/* Condition & status */}
            <div className="bg-white border border-neutral-200 rounded p-5 sm:p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-neutral-700" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-900">Condition & Status</h3>
                </div>
                <span
                  className={`text-[11px] font-bold px-2 py-0.5 rounded ${
                    percent === 100
                      ? 'bg-emerald-100 text-emerald-800'
                      : percent >= 70
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-rose-100 text-rose-800'
                  }`}
                >
                  {percent}% Usable
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-800 mb-1">Status</label>
                <Dropdown
                  value={status}
                  options={conditionStatusOptions}
                  onChange={handleStatusChange}
                  className="w-full"
                  buttonClassName={dropdownBtn}
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-emerald-800 mb-1">Working</label>
                  {numInput(qtyWorking, (n) => { setQtyWorking(n); syncStatus(qtyBroken, qtyMaintenance); }, 'border-emerald-300 text-emerald-900 focus:border-emerald-600')}
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-rose-800 mb-1">Broken</label>
                  {numInput(qtyBroken, (n) => { setQtyBroken(n); syncStatus(n, qtyMaintenance); }, 'border-rose-300 text-rose-900 focus:border-rose-600')}
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-blue-800 mb-1">In Maintenance</label>
                  {numInput(qtyMaintenance, (n) => { setQtyMaintenance(n); syncStatus(qtyBroken, n); }, 'border-blue-300 text-blue-900 focus:border-blue-600')}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-800 mb-1">Condition Remarks</label>
                <textarea
                  rows={3}
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="e.g. 2 chairs have broken castor wheels in back row"
                  className={inputCls}
                />
              </div>
            </div>
          </div>

          {/* Right: summary */}
          <div className="lg:col-span-4 space-y-4">
            <div className="bg-white border border-neutral-200 rounded p-5 space-y-3 text-xs">
              <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-900 border-b border-neutral-100 pb-3">Summary</h3>
              <div className="flex justify-between">
                <span className="text-neutral-500">Classroom</span>
                <span className="font-semibold text-neutral-900">{loc.room}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Total units</span>
                <span className="font-mono font-bold text-neutral-900">
                  {total} {unit}
                </span>
              </div>
              {total !== item.qtyWorking + item.qtyBroken + (item.qtyMaintenance || 0) && (
                <p className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded p-2">
                  Total changed from {item.qtyWorking + item.qtyBroken + (item.qtyMaintenance || 0)} to {total}. Central Stock is not adjusted automatically.
                </p>
              )}
            </div>

            {(linkedStock || linkedAsset) && (
              <div className="bg-white border border-neutral-200 rounded p-5 space-y-2 text-xs">
                <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-900 border-b border-neutral-100 pb-3">Central Source</h3>
                {linkedStock && (
                  <Link href={`/stock/${linkedStock.id}`} className="flex items-center gap-2 text-emerald-800 hover:underline">
                    <Boxes className="w-3.5 h-3.5" />
                    <span className="font-mono">{linkedStock.code}</span>
                    <span className="text-neutral-500">• {linkedStock.quantity} left</span>
                  </Link>
                )}
                {linkedAsset && (
                  <Link href={`/assets/${linkedAsset.id}`} className="flex items-center gap-2 text-blue-800 hover:underline">
                    <Microscope className="w-3.5 h-3.5" />
                    <span className="font-mono">{linkedAsset.serialNumber}</span>
                  </Link>
                )}
              </div>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
