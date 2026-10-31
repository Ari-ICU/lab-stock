'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Header } from '@/components/Header';
import { LabThumbnail } from '@/components/LabThumbnail';
import { useStock } from '@/context/StockContext';
import { useAuth } from '@/context/AuthContext';
import { AlertTriangle, Boxes, Edit3, ExternalLink, Microscope, Trash2, ArrowLeft } from 'lucide-react';
import {
  findLocation,
  findLinkedAsset,
  findLinkedStock,
  getCategoryLabel,
  getOperationalPercent,
} from '../shared';

export default function RoomItemDetailsClient({ id }: { id: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const itemId = searchParams.get('item') || '';
  const { locations, stock, assets, deleteRoomInventoryItem } = useStock();
  const { user, canManageLocation } = useAuth();
  const [confirmDelete, setConfirmDelete] = useState(false);

  const loc = findLocation(locations, id);
  const item = loc?.inventories?.find((i) => i.id === itemId);

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

  const isAdmin = user?.roleBadge === 'Admin' || user?.role === 'Primary Lab Administrator';
  const isAllowed = isAdmin || canManageLocation(loc.room) || canManageLocation(loc.name);
  const linkedStock = findLinkedStock(item, stock);
  const linkedAsset = findLinkedAsset(item, assets);
  const imageUrl = linkedStock?.imageUrl || linkedAsset?.imageUrl;
  const total = item.qtyWorking + item.qtyBroken + (item.qtyMaintenance || 0);
  const percent = getOperationalPercent(item);
  const editHref = `/locations/${loc.id}/items/edit?item=${item.id}`;

  const statusBadge =
    percent === 100
      ? { text: '100% Operational', cls: 'bg-emerald-50 text-emerald-800 border-emerald-200', dot: 'bg-emerald-500' }
      : percent >= 70
      ? { text: `${percent}% Usable`, cls: 'bg-amber-50 text-amber-800 border-amber-200', dot: 'bg-amber-500' }
      : { text: `${percent}% Usable`, cls: 'bg-rose-50 text-rose-800 border-rose-200', dot: 'bg-rose-500' };

  const handleDelete = () => {
    deleteRoomInventoryItem(loc.id, item.id);
    router.push(backHref);
  };

  const Row = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <div className="px-4 py-3 flex items-center justify-between gap-4 text-xs">
      <span className="text-neutral-500">{label}</span>
      <span className="font-medium text-neutral-900 text-right">{children}</span>
    </div>
  );

  return (
    <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-neutral-50/50">
      <Header
        title={item.name}
        subtitle={`${loc.room} • ${loc.name}`}
        backHref={backHref}
        backLabel={loc.room}
        showExport={false}
        actions={
          isAllowed ? (
            <div className="flex items-center gap-2">
              <Link
                href={editHref}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-white rounded text-xs font-semibold transition-colors shadow-xs"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit</span>
              </Link>
              {isAdmin && (
                <button
                  type="button"
                  onClick={() => setConfirmDelete(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 rounded text-xs font-medium transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Delete</span>
                </button>
              )}
            </div>
          ) : undefined
        }
      />

      <div className="flex-1 overflow-y-auto p-4 sm:p-8 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: visual + summary */}
          <div className="lg:col-span-4 space-y-4">
            <div className="bg-white border border-neutral-200 rounded overflow-hidden">
              <div className="w-full h-56 bg-neutral-100 flex items-center justify-center">
                <LabThumbnail
                  src={imageUrl}
                  alt={item.name}
                  size="card"
                  className="w-full h-full object-cover"
                  iconClassName="w-10 h-10 text-neutral-300"
                />
              </div>
              <div className="p-4 space-y-2">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] font-mono font-semibold uppercase bg-neutral-100 text-neutral-700 px-1.5 py-0.5 rounded border border-neutral-200">
                    {item.unit}
                  </span>
                  <span className="text-[11px] font-medium bg-neutral-100 text-neutral-700 px-2 py-0.5 rounded border border-neutral-200">
                    {getCategoryLabel(item.group)}
                  </span>
                </div>
                <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-semibold border ${statusBadge.cls}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${statusBadge.dot}`} />
                  {statusBadge.text}
                </span>
              </div>
            </div>

            {/* Count cards */}
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-white border border-neutral-200 rounded p-3 text-center">
                <div className="text-[10px] uppercase font-bold text-neutral-500">Working</div>
                <div className="text-lg font-bold font-mono text-emerald-700">{item.qtyWorking}</div>
              </div>
              <div className="bg-white border border-neutral-200 rounded p-3 text-center">
                <div className="text-[10px] uppercase font-bold text-neutral-500">Broken</div>
                <div className={`text-lg font-bold font-mono ${item.qtyBroken > 0 ? 'text-rose-700' : 'text-neutral-400'}`}>
                  {item.qtyBroken}
                </div>
              </div>
              <div className="bg-white border border-neutral-200 rounded p-3 text-center">
                <div className="text-[10px] uppercase font-bold text-neutral-500">Repair</div>
                <div className={`text-lg font-bold font-mono ${(item.qtyMaintenance || 0) > 0 ? 'text-blue-700' : 'text-neutral-400'}`}>
                  {item.qtyMaintenance || 0}
                </div>
              </div>
            </div>
          </div>

          {/* Right: details */}
          <div className="lg:col-span-8 space-y-6">
            <div className="bg-white border border-neutral-200 rounded">
              <div className="px-4 py-3 border-b border-neutral-100">
                <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-900">Equipment Information</h3>
              </div>
              <div className="divide-y divide-neutral-100">
                <Row label="Item Name">{item.name}</Row>
                <Row label="Category">{getCategoryLabel(item.group)}</Row>
                <Row label="Specification / Model">{item.brandSpec || '—'}</Row>
                <Row label="Total in Room">
                  <span className="font-mono font-bold">
                    {total} {item.unit}
                  </span>
                </Row>
                <Row label="Classroom">
                  <Link href={backHref} className="text-emerald-700 hover:underline">
                    {loc.name} ({loc.room})
                  </Link>
                </Row>
                <Row label="Last Audited">
                  {item.lastAuditedAt ? new Date(item.lastAuditedAt).toLocaleDateString() : 'Pending'}
                </Row>
              </div>
            </div>

            {/* Central source */}
            <div className="bg-white border border-neutral-200 rounded">
              <div className="px-4 py-3 border-b border-neutral-100">
                <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-900">Central Source</h3>
              </div>
              <div className="p-4 text-xs">
                {linkedStock ? (
                  <Link
                    href={`/stock/${linkedStock.id}`}
                    className="flex items-center justify-between gap-3 p-3 rounded border border-emerald-200 bg-emerald-50/60 hover:bg-emerald-50 transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Boxes className="w-4 h-4 text-emerald-700 shrink-0" />
                      <div className="min-w-0">
                        <div className="font-semibold text-neutral-900 truncate">{linkedStock.name}</div>
                        <div className="font-mono text-[11px] text-emerald-800">{linkedStock.code}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="font-mono font-bold text-emerald-800">
                        {linkedStock.quantity} {linkedStock.unit} left
                      </span>
                      <ExternalLink className="w-3.5 h-3.5 text-emerald-700" />
                    </div>
                  </Link>
                ) : linkedAsset ? (
                  <Link
                    href={`/assets/${linkedAsset.id}`}
                    className="flex items-center justify-between gap-3 p-3 rounded border border-blue-200 bg-blue-50/60 hover:bg-blue-50 transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Microscope className="w-4 h-4 text-blue-700 shrink-0" />
                      <div className="min-w-0">
                        <div className="font-semibold text-neutral-900 truncate">{linkedAsset.name}</div>
                        <div className="font-mono text-[11px] text-blue-800">{linkedAsset.serialNumber}</div>
                      </div>
                    </div>
                    <ExternalLink className="w-3.5 h-3.5 text-blue-700 shrink-0" />
                  </Link>
                ) : (
                  <p className="text-neutral-500">Custom item — not linked to Central Stock or Assets.</p>
                )}
              </div>
            </div>

            {/* Remarks */}
            <div
              className={`rounded border p-4 text-xs ${
                item.qtyBroken > 0 || (item.qtyMaintenance || 0) > 0
                  ? 'bg-amber-50/70 border-amber-200 text-amber-950'
                  : 'bg-white border-neutral-200 text-neutral-700'
              }`}
            >
              <h3 className="text-[10px] uppercase font-bold tracking-wider text-neutral-500 mb-1.5 flex items-center gap-1.5">
                {item.qtyBroken > 0 && <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />}
                Condition Remarks
              </h3>
              <p className="leading-relaxed">{item.remarks || 'No remarks recorded.'}</p>
            </div>

            <Link href={backHref} className="inline-flex items-center gap-1.5 text-xs font-medium text-neutral-600 hover:text-neutral-900">
              <ArrowLeft className="w-3.5 h-3.5" /> Back to {loc.room}
            </Link>
          </div>
        </div>
      </div>

      {confirmDelete && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-neutral-200 rounded-xl max-w-sm w-full p-5 space-y-4 shadow-2xl">
            <h3 className="text-sm font-bold text-neutral-900">Remove {item.name}?</h3>
            <p className="text-xs text-neutral-500">This removes the record from {loc.room}.</p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmDelete(false)}
                className="px-3 py-1.5 text-xs font-semibold border border-neutral-200 rounded text-neutral-700 hover:bg-neutral-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="px-3 py-1.5 text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white rounded cursor-pointer"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

