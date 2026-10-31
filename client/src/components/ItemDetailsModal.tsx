'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useStock } from '@/context/StockContext';
import {
  X,
  Server,
  MapPin,
  Edit3,
  Trash2,
  Image as ImageIcon,
  Thermometer,
  Microscope,
  Boxes,
  ExternalLink,
  ArrowRight,
  AlertTriangle,
} from 'lucide-react';
import { MockItem, MockAsset, MockRack, MockMaintenance, MockLocation } from '@/types';

export function ItemDetailsModal() {
  const router = useRouter();
  const {
    detailsItem,
    closeDetails,
    openEdit,
    deleteStockItem,
    deleteAsset,
    deleteRack,
    deleteMaintenance,
    deleteLocation,
    deleteRoomInventoryItem,
    assets,
    stock,
  } = useStock();

  if (!detailsItem) return null;

  const isStock = 'quantity' in detailsItem;
  const isAsset = 'serialNumber' in detailsItem && 'model' in detailsItem;
  const isRack = 'totalSlots' in detailsItem && 'usedSlots' in detailsItem;
  const isMaintenance = 'technician' in detailsItem && 'notes' in detailsItem;
  const isLocation = 'building' in detailsItem && 'room' in detailsItem;
  const isRoomInventory = 'qtyWorking' in detailsItem && 'qtyBroken' in detailsItem;

  const stockItem = isStock ? (detailsItem as MockItem) : null;
  const assetItem = isAsset ? (detailsItem as MockAsset) : null;
  const rackItem = isRack ? (detailsItem as MockRack) : null;
  const maintItem = isMaintenance ? (detailsItem as MockMaintenance) : null;
  const locItem = isLocation ? (detailsItem as MockLocation) : null;
  const roomInvItem = isRoomInventory ? (detailsItem as any) : null;

  const roomLinkedStock = roomInvItem
    ? roomInvItem.stockItemId
      ? stock.find((s) => s.id === roomInvItem.stockItemId || s.code === roomInvItem.stockItemId)
      : stock.find((s) => s.name.toLowerCase() === roomInvItem.name?.toLowerCase())
    : null;

  const roomLinkedAsset = roomInvItem
    ? roomInvItem.assetId
      ? assets.find((a) => a.id === roomInvItem.assetId || a.serialNumber === roomInvItem.assetId)
      : assets.find((a) => a.name.toLowerCase() === roomInvItem.name?.toLowerCase())
    : null;

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this record?')) {
      if (isStock && stockItem) deleteStockItem(stockItem.id);
      else if (isAsset && assetItem) deleteAsset(assetItem.id);
      else if (isRack && rackItem) deleteRack(rackItem.id);
      else if (isMaintenance && maintItem) deleteMaintenance(maintItem.id);
      else if (isLocation && locItem) deleteLocation(locItem.id);
      else if (isRoomInventory && roomInvItem) deleteRoomInventoryItem(roomInvItem.roomId, roomInvItem.id);
      closeDetails();
    }
  };

  const getHeaderTitle = () => {
    if (isRoomInventory) return 'Room Facility & Equipment Details';
    if (isStock) return 'Stock Item Specification';
    if (isAsset) return 'Hardware Asset Specification';
    if (isLocation) return 'Laboratory Zone Details';
    if (isRack) return 'Server Rack Enclosure Details';
    if (isMaintenance) return 'Maintenance & Audit Log';
    return 'Details';
  };

  const imageUrl = stockItem?.imageUrl || assetItem?.imageUrl || roomLinkedStock?.imageUrl || roomLinkedAsset?.imageUrl;
  const title = roomInvItem?.name || stockItem?.name || assetItem?.name || rackItem?.name || locItem?.name || maintItem?.assetName;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) closeDetails();
      }}
    >
      <div className="bg-white border border-neutral-200 rounded-md max-w-lg w-full overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="h-14 px-5 border-b border-neutral-200 flex items-center justify-between shrink-0 bg-white">
          <span className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider">
            {getHeaderTitle()}
          </span>
          <button
            onClick={closeDetails}
            className="p-1 text-neutral-400 hover:text-neutral-900 rounded cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs">
          {/* For Stock & Asset & Room Inventory: Image banner */}
          {(isStock || isAsset || (isRoomInventory && imageUrl)) && (
            <div className="relative w-full h-44 bg-neutral-100 rounded border border-neutral-200 overflow-hidden flex items-center justify-center">
              {imageUrl ? (
                <img
                  src={imageUrl}
                  alt={title || ''}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="text-neutral-400 flex flex-col items-center gap-1.5">
                  <ImageIcon className="w-8 h-8" />
                  <span className="text-xs">No image uploaded</span>
                </div>
              )}
            </div>
          )}

          {/* Title Header */}
          <div>
            <div className="text-base font-bold text-neutral-900 leading-snug">
              {title}
            </div>
            {roomInvItem && (
              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                <span className="font-mono text-neutral-700 bg-neutral-100 border border-neutral-200 px-2 py-0.5 rounded text-[11px] font-semibold">
                  {roomInvItem.unit?.toUpperCase() || 'PCS'}
                </span>
                <span className="text-neutral-600 bg-neutral-100 border border-neutral-200 px-2 py-0.5 rounded text-[11px] font-medium">
                  {roomInvItem.group?.replace('_', ' ')}
                </span>
                {roomLinkedStock && (
                  <button
                    type="button"
                    onClick={() => {
                      closeDetails();
                      router.push(`/stock/${roomLinkedStock.id}`);
                    }}
                    className="inline-flex items-center gap-1.5 text-[10px] font-mono text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-2 py-0.5 rounded cursor-pointer transition-colors"
                  >
                    <Boxes className="w-3 h-3 text-emerald-600" />
                    <span>Central Stock: {roomLinkedStock.code} ({roomLinkedStock.quantity} in Dept)</span>
                    <ExternalLink className="w-2.5 h-2.5 text-emerald-600" />
                  </button>
                )}
                {roomLinkedAsset && (
                  <button
                    type="button"
                    onClick={() => {
                      closeDetails();
                      router.push(`/assets/${roomLinkedAsset.id}`);
                    }}
                    className="inline-flex items-center gap-1.5 text-[10px] font-mono text-blue-800 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-2 py-0.5 rounded cursor-pointer transition-colors"
                  >
                    <Boxes className="w-3 h-3 text-blue-600" />
                    <span>Central Asset: {roomLinkedAsset.serialNumber} ({roomLinkedAsset.totalUnits ?? 1} units)</span>
                    <ExternalLink className="w-2.5 h-2.5 text-blue-600" />
                  </button>
                )}
              </div>
            )}
            {stockItem && (
              <div className="flex items-center gap-2 mt-1">
                <span className="font-mono text-neutral-600 bg-neutral-100 px-2 py-0.5 rounded">
                  SKU: {stockItem.code}
                </span>
                <span className="text-neutral-500 font-medium">
                  {stockItem.category}
                </span>
              </div>
            )}
            {assetItem && (
              <div className="flex items-center gap-2 mt-1">
                <span className="font-mono text-neutral-600 bg-neutral-100 px-2 py-0.5 rounded">
                  Model: {assetItem.model}
                </span>
                <span className="font-mono text-neutral-600 bg-neutral-100 px-2 py-0.5 rounded">
                  S/N: {assetItem.serialNumber}
                </span>
              </div>
            )}
            {locItem && (
              <div className="text-neutral-500 mt-1">
                {locItem.building} • <span className="font-semibold text-neutral-800">{locItem.room}</span>
              </div>
            )}
            {rackItem && (
              <div className="flex items-center gap-2 mt-1">
                <span className="font-mono text-neutral-600 bg-neutral-100 px-2 py-0.5 rounded">
                  {rackItem.code}
                </span>
                <span className="text-neutral-500">{rackItem.type}</span>
              </div>
            )}
          </div>

          {/* Details Table */}
          <div className="bg-neutral-50/50 border border-neutral-200 rounded divide-y divide-neutral-200 text-xs">
            {roomInvItem && (() => {
              const total = Number(roomInvItem.qtyWorking || 0) + Number(roomInvItem.qtyBroken || 0) + Number(roomInvItem.qtyMaintenance || 0);
              const percent = total > 0 ? Math.round((Number(roomInvItem.qtyWorking || 0) / total) * 100) : 100;

              return (
                <>
                  <div className="p-3 flex justify-between items-center bg-white">
                    <span className="text-neutral-600 font-semibold">Total Allocated Quantity:</span>
                    <span className="font-bold text-neutral-900 text-sm font-mono bg-neutral-100 px-2.5 py-0.5 rounded border border-neutral-200">
                      {total} {roomInvItem.unit || 'PCS'}
                    </span>
                  </div>
                  <div className="p-3 flex justify-between items-center">
                    <span className="text-neutral-500">Condition Status:</span>
                    {percent === 100 ? (
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        100% Operational
                      </span>
                    ) : (
                      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-semibold ${
                        percent >= 70
                          ? 'bg-amber-50 text-amber-800 border border-amber-200'
                          : 'bg-rose-50 text-rose-800 border border-rose-200'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${percent >= 70 ? 'bg-amber-500' : 'bg-rose-500'}`} />
                        {percent}% Usable ({roomInvItem.qtyBroken} Defective)
                      </span>
                    )}
                  </div>
                  <div className="p-3 flex justify-between items-center">
                    <span className="text-neutral-500">Operational Breakdown:</span>
                    <div className="flex items-center gap-2 font-mono text-xs">
                      <span className="text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded font-bold">
                        {roomInvItem.qtyWorking || 0} Working
                      </span>
                      <span className={`px-2 py-0.5 rounded font-bold ${
                        (roomInvItem.qtyBroken || 0) > 0
                          ? 'text-rose-700 bg-rose-50 border border-rose-200'
                          : 'text-neutral-400 bg-neutral-100 border border-neutral-200'
                      }`}>
                        {roomInvItem.qtyBroken || 0} Broken
                      </span>
                      {(roomInvItem.qtyMaintenance || 0) > 0 && (
                        <span className="text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded font-bold">
                          {roomInvItem.qtyMaintenance} In Repair
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="p-3 flex justify-between items-center">
                    <span className="text-neutral-500">Specification & Model:</span>
                    <span className="font-medium text-neutral-800 text-right">
                      {roomInvItem.brandSpec || 'Standard University Facility'}
                    </span>
                  </div>
                  {roomInvItem.lastAuditedAt && (
                    <div className="p-3 flex justify-between items-center">
                      <span className="text-neutral-500">Last Audited / Verified:</span>
                      <span className="font-mono text-neutral-700">
                        {new Date(roomInvItem.lastAuditedAt).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </>
              );
            })()}

            {stockItem && (
              <>
                <div className="p-3 flex justify-between items-center">
                  <span className="text-neutral-500">Stock Count:</span>
                  <span className="font-bold text-neutral-900 text-sm">
                    {stockItem.quantity} {stockItem.unit}
                  </span>
                </div>
                <div className="p-3 flex justify-between items-center">
                  <span className="text-neutral-500">Facility Location:</span>
                  <span className="font-medium text-neutral-800 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-neutral-400" />
                    {stockItem.location}
                  </span>
                </div>
                <div className="p-3 flex justify-between items-center">
                  <span className="text-neutral-500">Warranty / Note:</span>
                  <span className="font-semibold text-neutral-900 bg-neutral-100 border border-neutral-200 px-2 py-0.5 rounded text-[11px]">
                    {stockItem.expiryDate || 'Active'}
                  </span>
                </div>
                <div className="p-3 flex justify-between items-center">
                  <span className="text-neutral-500">Status:</span>
                  <span className="font-semibold text-neutral-800 uppercase">
                    {stockItem.status.replace('_', ' ')}
                  </span>
                </div>
              </>
            )}

            {assetItem && (
              <>
                <div className="p-3 flex justify-between items-center bg-white">
                  <span className="text-neutral-600 font-semibold">Total Hardware Count:</span>
                  <span className="font-bold text-neutral-900 text-sm px-2.5 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                    {assetItem.totalUnits ?? 1} {assetItem.unitType ?? 'Units'}
                  </span>
                </div>
                <div className="p-3 flex justify-between items-center">
                  <span className="text-neutral-500">Assigned Location:</span>
                  <span className="font-medium text-neutral-800 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-neutral-400" />
                    {assetItem.location}
                  </span>
                </div>
                <div className="p-3 flex justify-between items-center">
                  <span className="text-neutral-500">Operational Status:</span>
                  <span className="font-semibold text-neutral-800 uppercase">
                    {assetItem.status.replace('_', ' ')}
                  </span>
                </div>
                <div className="p-3 flex justify-between items-center">
                  <span className="text-neutral-500">Next Audit / Calibration:</span>
                  <span className="font-medium text-neutral-800 font-mono">
                    {assetItem.nextCalibration}
                  </span>
                </div>
              </>
            )}

            {locItem && (() => {
              const roomKey = locItem.room.replace(/^Rm\s*/i, '').trim().toLowerCase();
              const locAssets = assets.filter((a) => {
                const l = a.location.toLowerCase();
                return (
                  l.includes(roomKey) ||
                  l.includes(locItem.room.toLowerCase()) ||
                  l.includes(locItem.name.toLowerCase())
                );
              });
              const locStock = stock.filter((s) => {
                const l = s.location.toLowerCase();
                return (
                  l.includes(roomKey) ||
                  l.includes(locItem.room.toLowerCase()) ||
                  l.includes(locItem.name.toLowerCase())
                );
              });
              const totalHUnits = locAssets.reduce((s, a) => s + (a.totalUnits ?? 1), 0);
              const totalSUnits = locStock.reduce((s, st) => s + (st.quantity || 1), 0);

              return (
                <>
                  <div className="p-3 flex justify-between items-center">
                    <span className="text-neutral-500">Campus Facility:</span>
                    <span className="font-medium text-neutral-800">{locItem.building}</span>
                  </div>
                  <div className="p-3 flex justify-between items-center">
                    <span className="text-neutral-500">Room Designation:</span>
                    <span className="font-bold text-neutral-900 font-mono">{locItem.room}</span>
                  </div>
                  <div className="p-3 flex justify-between items-center">
                    <span className="text-neutral-500">Hardware Devices:</span>
                    <span className="font-bold text-blue-700">
                      {locAssets.length} models ({totalHUnits} units)
                    </span>
                  </div>
                  <div className="p-3 flex justify-between items-center">
                    <span className="text-neutral-500">Inventory Consumables:</span>
                    <span className="font-bold text-emerald-700">
                      {locStock.length} SKUs ({totalSUnits} units)
                    </span>
                  </div>

                  {/* Quick Preview List */}
                  <div className="p-3 bg-neutral-50 border-t border-neutral-100 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-neutral-700 uppercase tracking-wider flex items-center gap-1.5">
                        <Microscope className="w-3.5 h-3.5 text-blue-600" />
                        Hardware Equipment in {locItem.room} ({locAssets.length})
                      </span>
                    </div>
                    <div className="space-y-1.5 max-h-36 overflow-y-auto">
                      {locAssets.length === 0 ? (
                        <div className="text-[11px] text-neutral-400 italic">No hardware models assigned to this room yet.</div>
                      ) : (
                        locAssets.map((a) => (
                          <div
                            key={a.id}
                            onClick={() => {
                              closeDetails();
                              router.push(`/assets/${a.id}`);
                            }}
                            className="flex items-center justify-between p-1.5 bg-white border border-neutral-200 rounded text-[11px] hover:border-neutral-400 cursor-pointer transition-colors"
                          >
                            <span className="font-semibold text-neutral-900 truncate max-w-[220px]">
                              {a.name}
                            </span>
                            <span className="font-mono text-neutral-500 text-[10px]">
                              {a.totalUnits ?? 1} units
                            </span>
                          </div>
                        ))
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[11px] font-bold text-neutral-700 uppercase tracking-wider flex items-center gap-1.5">
                        <Boxes className="w-3.5 h-3.5 text-emerald-600" />
                        Peripherals & Stock in {locItem.room} ({locStock.length})
                      </span>
                    </div>
                    <div className="space-y-1.5 max-h-36 overflow-y-auto">
                      {locStock.length === 0 ? (
                        <div className="text-[11px] text-neutral-400 italic">No peripherals assigned to this room yet.</div>
                      ) : (
                        locStock.map((s) => (
                          <div
                            key={s.id}
                            onClick={() => {
                              closeDetails();
                              router.push(`/stock/${s.id}`);
                            }}
                            className="flex items-center justify-between p-1.5 bg-white border border-neutral-200 rounded text-[11px] hover:border-neutral-400 cursor-pointer transition-colors"
                          >
                            <span className="font-semibold text-neutral-900 truncate max-w-[220px]">
                              {s.name}
                            </span>
                            <span className="font-mono text-neutral-500 text-[10px]">
                              {s.quantity} {s.unit}
                            </span>
                          </div>
                        ))
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        const targetId = locItem.id;
                        closeDetails();
                        router.push(`/locations/${targetId}`);
                      }}
                      className="w-full py-2 px-3 text-xs font-semibold bg-emerald-700 hover:bg-emerald-800 text-white rounded transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs mt-2"
                    >
                      <span>Open Full Room Fleet Specification Page</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </>
              );
            })()}

            {rackItem && (
              <>
                <div className="p-3 flex justify-between items-center">
                  <span className="text-neutral-500">Total Enclosure Capacity:</span>
                  <span className="font-bold text-neutral-900">{rackItem.totalSlots} U</span>
                </div>
                <div className="p-3 flex justify-between items-center">
                  <span className="text-neutral-500">Mounted Equipment:</span>
                  <span className="font-medium text-neutral-800">
                    {rackItem.usedSlots} U utilized ({Math.round((rackItem.usedSlots / rackItem.totalSlots) * 100)}%)
                  </span>
                </div>
                <div className="p-3 flex justify-between items-center">
                  <span className="text-neutral-500">Location:</span>
                  <span className="font-medium text-neutral-800">{rackItem.location}</span>
                </div>
                {rackItem.temperature && (
                  <div className="p-3 flex justify-between items-center">
                    <span className="text-neutral-500">Thermal Telemetry:</span>
                    <span className="font-medium text-blue-700 flex items-center gap-1">
                      <Thermometer className="w-3.5 h-3.5" />
                      {rackItem.temperature}
                    </span>
                  </div>
                )}
              </>
            )}

            {maintItem && (
              <>
                <div className="p-3 flex justify-between items-center">
                  <span className="text-neutral-500">Serial Number:</span>
                  <span className="font-mono text-neutral-800">{maintItem.serialNumber}</span>
                </div>
                <div className="p-3 flex justify-between items-center">
                  <span className="text-neutral-500">Service Type:</span>
                  <span className="font-medium text-neutral-800">{maintItem.type}</span>
                </div>
                <div className="p-3 flex justify-between items-center">
                  <span className="text-neutral-500">Scheduled Date:</span>
                  <span className="font-mono text-neutral-800">{maintItem.date}</span>
                </div>
                <div className="p-3 flex justify-between items-center">
                  <span className="text-neutral-500">Technician:</span>
                  <span className="font-medium text-neutral-800">{maintItem.technician}</span>
                </div>
                <div className="p-3 flex justify-between items-center">
                  <span className="text-neutral-500">Status:</span>
                  <span className="font-semibold text-neutral-900">{maintItem.status}</span>
                </div>
              </>
            )}
          </div>

          {/* Technical Specifications / Notes Box */}
          {(stockItem?.description || assetItem?.description || maintItem?.notes || roomInvItem?.remarks) && (
            <div className={`p-3 text-xs space-y-1.5 rounded border ${
              roomInvItem && (roomInvItem.qtyBroken > 0 || roomInvItem.qtyMaintenance > 0)
                ? 'bg-amber-50/70 border-amber-200 text-amber-950'
                : 'bg-neutral-50/70 border-neutral-200 text-neutral-700'
            }`}>
              <span className="text-[10px] uppercase font-bold text-neutral-500 tracking-wider flex items-center gap-1.5">
                {roomInvItem && roomInvItem.qtyBroken > 0 && <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />}
                {roomInvItem ? 'Facility Condition & Defect Notes' : 'Technical Specifications & Setup Details'}
              </span>
              <p className="leading-relaxed font-normal">
                {stockItem?.description || assetItem?.description || maintItem?.notes || roomInvItem?.remarks}
              </p>
            </div>
          )}

          {/* Action buttons: Edit, Delete, Close */}
          <div className="flex items-center gap-2 pt-2 border-t border-neutral-100">
            <button
              onClick={() => {
                const item = detailsItem;
                closeDetails();
                openEdit(item);
              }}
              className="flex-1 py-2 px-3 text-xs font-semibold bg-neutral-900 text-white rounded hover:bg-neutral-800 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Edit Record</span>
            </button>
            <button
              onClick={handleDelete}
              className="py-2 px-3 text-xs font-semibold text-rose-600 border border-rose-200 bg-rose-50/50 hover:bg-rose-100 rounded transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-500" />
              <span>Delete</span>
            </button>
            <button
              onClick={closeDetails}
              className="py-2 px-4 text-xs font-medium border border-neutral-300 bg-white text-neutral-700 rounded hover:bg-neutral-50 transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
