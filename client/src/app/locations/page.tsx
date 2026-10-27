'use client';

import React, { useState } from 'react';
import { Header } from '@/components/Header';
import { useStock } from '@/context/StockContext';
import { exportToCsv } from '@/lib/exportCsv';
import { Boxes, Microscope, Building } from 'lucide-react';
import { RowActionMenu } from '@/components/RowActionMenu';

export default function LocationsPage() {
  const { stock, assets, locations, openModal, showToast, openDetails, openEdit, deleteLocation } = useStock();
  const [filterText, setFilterText] = useState('');

  const filtered = locations
    .map((loc) => {
      // Calculate total stock items assigned to this room
      const matchingStock = stock.filter(
        (s) =>
          s.location.toLowerCase().includes(loc.room.toLowerCase()) ||
          s.location.toLowerCase().includes(loc.name.toLowerCase())
      );
      const calculatedStock = matchingStock.reduce((acc, s) => acc + (s.quantity || 1), 0);

      // Calculate total hardware units assigned to this room
      const matchingAssets = assets.filter(
        (a) =>
          a.location.toLowerCase().includes(loc.room.toLowerCase()) ||
          a.location.toLowerCase().includes(loc.name.toLowerCase())
      );
      const calculatedHardware = matchingAssets.reduce(
        (acc, a) => acc + (a.totalUnits ?? 1),
        0
      );

      return {
        ...loc,
        displayStock: calculatedStock > 0 ? calculatedStock : loc.totalItems,
        displayHardware: calculatedHardware > 0 ? calculatedHardware : loc.totalAssets,
      };
    })
    .filter(
      (loc) =>
        loc.name.toLowerCase().includes(filterText.toLowerCase()) ||
        loc.room.toLowerCase().includes(filterText.toLowerCase()) ||
        loc.building.toLowerCase().includes(filterText.toLowerCase())
    );

  const handleExport = () => {
    exportToCsv(
      'netlab_locations',
      filtered.map((l) => ({
        'Facility Name': l.name,
        Building: l.building,
        'Room Number': l.room,
        'Associated Items': l.displayStock,
        'Hardware Units': l.displayHardware,
      }))
    );
  };

  return (
    <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
      <Header
        title="Laboratory Locations"
        subtitle="Facilities & Assigned Rooms"
        actionLabel="Add Location"
        onAction={() => openModal('add_location')}
        onExport={handleExport}
      />

      <div className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-6">
        <div className="flex items-center justify-between">
          <input
            type="text"
            placeholder="Search by lab name, room or building..."
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            className="w-72 bg-white border border-neutral-300 text-neutral-900 text-xs px-3 py-1.5 rounded focus:outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 font-medium placeholder:text-neutral-400"
          />
          <div className="text-xs text-neutral-500">
            Total <span className="font-semibold text-neutral-900">{locations.length}</span> lab zones
          </div>
        </div>

        {/* Flat Location Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((loc) => (
            <div key={loc.id} className="bg-white border border-neutral-200 rounded p-5 space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div
                    onClick={() => openDetails(loc)}
                    className="w-10 h-10 bg-neutral-100 rounded flex items-center justify-center text-neutral-700 cursor-pointer hover:bg-neutral-200 transition-colors"
                    title="Click to view details"
                  >
                    <Building className="w-5 h-5" />
                  </div>
                  <div>
                    <button
                      onClick={() => openDetails(loc)}
                      className="text-sm font-bold text-neutral-900 hover:text-emerald-700 text-left cursor-pointer transition-colors"
                    >
                      {loc.name}
                    </button>
                    <div className="text-xs text-neutral-500 mt-0.5">
                      {loc.building} • <span className="font-semibold text-neutral-700">{loc.room}</span>
                    </div>
                  </div>
                </div>

                <RowActionMenu
                  onViewDetails={() => openDetails(loc)}
                  onEdit={() => openEdit(loc)}
                  onDelete={() => deleteLocation(loc.id)}
                />
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-neutral-100">
                <div className="bg-neutral-50 border border-neutral-100 rounded p-2.5 flex items-center gap-2.5">
                  <Boxes className="w-4 h-4 text-neutral-400" />
                  <div>
                    <div className="text-[11px] text-neutral-500">Inventory Items</div>
                    <div className="text-xs font-bold text-neutral-900">{loc.displayStock} items</div>
                  </div>
                </div>

                <div className="bg-neutral-50 border border-neutral-100 rounded p-2.5 flex items-center gap-2.5">
                  <Microscope className="w-4 h-4 text-neutral-400" />
                  <div>
                    <div className="text-[11px] text-neutral-500">Lab Hardware</div>
                    <div className="text-xs font-bold text-neutral-900">{loc.displayHardware} units</div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
