'use client';

import React from 'react';
import { useStock } from '@/context/StockContext';
import {
  X,
  Server,
  MapPin,
  Edit3,
  Trash2,
  Image as ImageIcon,
  Thermometer,
} from 'lucide-react';
import { MockItem, MockAsset, MockRack, MockMaintenance, MockLocation } from '@/data/mockData';

export function ItemDetailsModal() {
  const {
    detailsItem,
    closeDetails,
    openEdit,
    deleteStockItem,
    deleteAsset,
    deleteRack,
    deleteMaintenance,
    deleteLocation,
  } = useStock();

  if (!detailsItem) return null;

  const isStock = 'quantity' in detailsItem;
  const isAsset = 'serialNumber' in detailsItem && 'model' in detailsItem;
  const isRack = 'totalSlots' in detailsItem && 'usedSlots' in detailsItem;
  const isMaintenance = 'technician' in detailsItem && 'notes' in detailsItem;
  const isLocation = 'building' in detailsItem && 'room' in detailsItem;

  const stockItem = isStock ? (detailsItem as MockItem) : null;
  const assetItem = isAsset ? (detailsItem as MockAsset) : null;
  const rackItem = isRack ? (detailsItem as MockRack) : null;
  const maintItem = isMaintenance ? (detailsItem as MockMaintenance) : null;
  const locItem = isLocation ? (detailsItem as MockLocation) : null;

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this record?')) {
      if (isStock && stockItem) deleteStockItem(stockItem.id);
      else if (isAsset && assetItem) deleteAsset(assetItem.id);
      else if (isRack && rackItem) deleteRack(rackItem.id);
      else if (isMaintenance && maintItem) deleteMaintenance(maintItem.id);
      else if (isLocation && locItem) deleteLocation(locItem.id);
      closeDetails();
    }
  };

  const getHeaderTitle = () => {
    if (isStock) return 'Stock Item Specification';
    if (isAsset) return 'Hardware Asset Specification';
    if (isLocation) return 'Laboratory Zone Details';
    if (isRack) return 'Server Rack Enclosure Details';
    if (isMaintenance) return 'Maintenance & Audit Log';
    return 'Details';
  };

  const imageUrl = stockItem?.imageUrl || assetItem?.imageUrl;
  const title = stockItem?.name || assetItem?.name || rackItem?.name || locItem?.name || maintItem?.assetName;

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
          {/* For Stock & Asset: Image banner */}
          {(isStock || isAsset) && (
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

            {locItem && (
              <>
                <div className="p-3 flex justify-between items-center">
                  <span className="text-neutral-500">Campus Building:</span>
                  <span className="font-medium text-neutral-800">{locItem.building}</span>
                </div>
                <div className="p-3 flex justify-between items-center">
                  <span className="text-neutral-500">Room Designation:</span>
                  <span className="font-bold text-neutral-900">{locItem.room}</span>
                </div>
                <div className="p-3 flex justify-between items-center">
                  <span className="text-neutral-500">Associated Stock SKUs:</span>
                  <span className="font-medium text-neutral-800">{locItem.totalItems} items</span>
                </div>
                <div className="p-3 flex justify-between items-center">
                  <span className="text-neutral-500">Mounted Hardware Units:</span>
                  <span className="font-medium text-neutral-800">{locItem.totalAssets} units</span>
                </div>
              </>
            )}

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
          {(stockItem?.description || assetItem?.description || maintItem?.notes) && (
            <div className="bg-neutral-50/70 border border-neutral-200 rounded p-3 text-xs space-y-1.5">
              <span className="text-[10px] uppercase font-bold text-neutral-500 tracking-wider block">
                Technical Specifications & Setup Details
              </span>
              <p className="text-neutral-700 leading-relaxed font-normal">
                {stockItem?.description || assetItem?.description || maintItem?.notes}
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
