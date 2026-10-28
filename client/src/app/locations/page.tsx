'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Header } from '@/components/Header';
import { useStock } from '@/context/StockContext';
import { exportToCsv } from '@/lib/exportCsv';
import { Boxes, Microscope, Building, ArrowRight } from 'lucide-react';
import { RowActionMenu } from '@/components/RowActionMenu';

export default function LocationsPage() {
  const router = useRouter();
  const { stock, assets, locations, openModal, showToast, openDetails, openEdit, deleteLocation } = useStock();
  const [filterText, setFilterText] = useState('');

  const filtered = locations
    .map((loc) => {
      const roomKey = loc.room.replace(/^Rm\s*/i, '').trim().toLowerCase();

      // Calculate total stock items assigned to this room
      const matchingStock = stock.filter((s) => {
        const l = s.location.toLowerCase();
        return (
          l.includes(roomKey) ||
          l.includes(loc.room.toLowerCase()) ||
          l.includes(loc.name.toLowerCase())
        );
      });
      const stockItemsCount = matchingStock.length > 0 ? matchingStock.length : loc.totalItems;
      const totalStockUnits = matchingStock.reduce((acc, s) => acc + (s.quantity || 1), 0);

      // Calculate total hardware units assigned to this room
      const matchingAssets = assets.filter((a) => {
        const l = a.location.toLowerCase();
        return (
          l.includes(roomKey) ||
          l.includes(loc.room.toLowerCase()) ||
          l.includes(loc.name.toLowerCase())
        );
      });
      const hardwareAssetsCount = matchingAssets.length > 0 ? matchingAssets.length : loc.totalAssets;
      const totalHardwareUnits = matchingAssets.reduce(
        (acc, a) => acc + (a.totalUnits ?? 1),
        0
      );

      return {
        ...loc,
        stockItemsCount,
        totalStockUnits: totalStockUnits > 0 ? totalStockUnits : loc.totalItems,
        hardwareAssetsCount,
        totalHardwareUnits: totalHardwareUnits > 0 ? totalHardwareUnits : loc.totalAssets,
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
      'csd_stock_connected_laboratories',
      filtered.map((l) => ({
        'Facility Name': l.name,
        Building: l.building,
        'Room Number': l.room,
        'Inventory Types (SKUs)': l.stockItemsCount,
        'Total Inventory Consumables': l.totalStockUnits,
        'Hardware Device Models': l.hardwareAssetsCount,
        'Total Hardware Units': l.totalHardwareUnits,
        Status: 'Operational Faculty Fleet Lab',
      }))
    );
  };

  return (
    <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
      <Header
        title="Laboratory Locations"
        subtitle={`${locations.length} Connected Laboratories • Engineering & Science Classrooms`}
        actionLabel="Add Location"
        onAction={() => openModal('add_location')}
        onExport={handleExport}
      />

      <div className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-6 max-w-8xl w-full mx-auto">
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
            <div key={loc.id} className="bg-white border border-neutral-200 rounded-xl p-5 space-y-4 hover:border-neutral-300 transition-all shadow-2xs hover:shadow-xs">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <Link
                    href={`/locations/${loc.id}`}
                    className="w-10 h-10 bg-neutral-100 rounded-lg flex items-center justify-center text-neutral-700 cursor-pointer hover:bg-neutral-900 hover:text-white transition-colors shrink-0 shadow-2xs"
                    title="Click to view lab equipment and inventory"
                  >
                    <Building className="w-5 h-5" />
                  </Link>
                  <div>
                    <Link
                      href={`/locations/${loc.id}`}
                      className="text-sm font-bold text-neutral-900 hover:text-emerald-700 text-left cursor-pointer transition-colors block"
                    >
                      {loc.name}
                    </Link>
                    <div className="text-xs text-neutral-500 mt-0.5">
                      {loc.building} • <span className="font-semibold text-neutral-700 font-mono">{loc.room}</span>
                    </div>
                  </div>
                </div>

                <RowActionMenu
                  onViewDetails={() => router.push(`/locations/${loc.id}`)}
                  onEdit={() => openEdit(loc)}
                  onDelete={() => deleteLocation(loc.id)}
                />
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-neutral-100">
                <Link
                  href={`/locations/${loc.id}`}
                  className="bg-neutral-50 hover:bg-neutral-100/80 border border-neutral-200/70 rounded-lg p-2.5 flex items-center gap-2.5 transition-colors cursor-pointer group"
                >
                  <Boxes className="w-4 h-4 text-emerald-600 shrink-0 group-hover:scale-110 transition-transform" />
                  <div className="min-w-0">
                    <div className="text-[11px] text-neutral-500 font-medium">Inventory Items</div>
                    <div className="text-xs font-bold text-neutral-900 truncate">
                      {loc.stockItemsCount} {loc.stockItemsCount === 1 ? 'item' : 'items'}
                      <span className="text-[10px] text-neutral-500 font-normal ml-1">
                        ({loc.totalStockUnits} units)
                      </span>
                    </div>
                  </div>
                </Link>

                <Link
                  href={`/locations/${loc.id}`}
                  className="bg-neutral-50 hover:bg-neutral-100/80 border border-neutral-200/70 rounded-lg p-2.5 flex items-center gap-2.5 transition-colors cursor-pointer group"
                >
                  <Microscope className="w-4 h-4 text-blue-600 shrink-0 group-hover:scale-110 transition-transform" />
                  <div className="min-w-0">
                    <div className="text-[11px] text-neutral-500 font-medium">Lab Hardware</div>
                    <div className="text-xs font-bold text-neutral-900 truncate">
                      {loc.hardwareAssetsCount} {loc.hardwareAssetsCount === 1 ? 'device' : 'devices'}
                      <span className="text-[10px] text-neutral-500 font-normal ml-1">
                        ({loc.totalHardwareUnits} units)
                      </span>
                    </div>
                  </div>
                </Link>
              </div>

              <div className="pt-2 border-t border-neutral-100 flex items-center justify-between text-xs">
                <span className="text-[11px] text-neutral-400 font-mono">
                  Room Key: {loc.room}
                </span>
                <Link
                  href={`/locations/${loc.id}`}
                  className="inline-flex items-center gap-1 font-semibold text-emerald-700 hover:text-emerald-800 transition-colors"
                >
                  <span>View Lab Equipment</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
