'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Header } from '@/components/Header';
import { useStock } from '@/context/StockContext';
import { useAuth } from '@/context/AuthContext';
import { exportToCsv } from '@/lib/exportCsv';
import { getOptimizedImageUrl } from '@/lib/imageOptimization';
import { LabThumbnail } from '@/components/LabThumbnail';
import { Boxes, Microscope, Building, ArrowRight, Search, Plus, Shield } from 'lucide-react';
import { RowActionMenu } from '@/components/RowActionMenu';

export default function LocationsPage() {
  const router = useRouter();
  const { stock, assets, locations, openModal, showToast, openDetails, openEdit, deleteLocation } = useStock();
  const { user, canManageLocation } = useAuth();
  const [filterText, setFilterText] = useState('');
  const [scopeFilter, setScopeFilter] = useState<'all' | 'assigned'>('all');

  const isAdmin = user?.roleBadge === 'Admin' || user?.assignedLabs?.includes('all');

  const myAssignedCount = locations.filter(
    (l) => canManageLocation(l.room) || canManageLocation(l.name)
  ).length;

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
    .filter((loc) => {
      if (scopeFilter === 'assigned') {
        return canManageLocation(loc.room) || canManageLocation(loc.name);
      }
      return true;
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
        actionLabel={isAdmin ? "Add Location" : undefined}
        onAction={isAdmin ? () => openModal('add_location') : undefined}
        onExport={handleExport}
      />

      <div className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-6 max-w-8xl w-full mx-auto">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 flex-1 flex-wrap">
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by lab name, room or building..."
                value={filterText}
                onChange={(e) => setFilterText(e.target.value)}
                className="w-full bg-white border border-neutral-300 text-neutral-900 text-xs pl-9 pr-3 py-2 rounded-lg focus:outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 font-medium placeholder:text-neutral-400 shadow-2xs transition-all"
              />
            </div>

            <div className="flex items-center p-0.5 bg-neutral-100 rounded-lg border border-neutral-200 text-xs">
              <button
                type="button"
                onClick={() => setScopeFilter('all')}
                className={`px-3 py-1.5 rounded-md font-medium transition-all ${
                  scopeFilter === 'all'
                    ? 'bg-white text-neutral-900 font-semibold shadow-2xs'
                    : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                All Facilities ({locations.length})
              </button>
              <button
                type="button"
                onClick={() => setScopeFilter('assigned')}
                className={`px-3 py-1.5 rounded-md font-medium transition-all ${
                  scopeFilter === 'assigned'
                    ? 'bg-white text-neutral-900 font-semibold shadow-2xs'
                    : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                My Assigned Labs ({myAssignedCount})
              </button>
            </div>
          </div>

          <div className="text-xs text-neutral-500 font-medium shrink-0">
            Showing <span className="font-bold text-neutral-900">{filtered.length}</span> connected {filtered.length === 1 ? 'room' : 'rooms'}
          </div>
        </div>

        {/* Flat Location Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((loc) => {
            const isAllowed = canManageLocation(loc.room) || canManageLocation(loc.name);
            return (
              <div key={loc.id} className="bg-white border border-neutral-200 rounded-xl p-5 space-y-4 hover:border-neutral-300 transition-all shadow-2xs hover:shadow-xs">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <Link
                      href={`/locations/${loc.id}`}
                      className="w-12 h-12 bg-neutral-100 rounded-lg flex items-center justify-center text-neutral-700 cursor-pointer hover:border-neutral-400 transition-colors shrink-0 shadow-2xs overflow-hidden border border-neutral-200"
                      title="Click to view lab equipment and inventory"
                    >
                      <LabThumbnail
                        src={loc.imageUrl}
                        alt={loc.name}
                        size="thumb"
                        fallbackType="building"
                        className="w-full h-full object-cover"
                        iconClassName="w-5 h-5 text-neutral-500"
                      />
                    </Link>
                    <div>
                      <Link
                        href={`/locations/${loc.id}`}
                        className="text-sm font-bold text-neutral-900 hover:text-emerald-700 text-left cursor-pointer transition-colors block"
                      >
                        {loc.name}
                      </Link>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-xs text-neutral-500">
                          {loc.building} • <span className="font-semibold text-neutral-700 font-mono">{loc.room}</span>
                        </span>
                        {isAllowed ? (
                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Assigned
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[10px] font-semibold bg-neutral-100 text-neutral-500 border border-neutral-200" title="Read-only: Stationed outside your assigned lab rooms">
                            <Shield className="w-2.5 h-2.5 text-neutral-400" /> Read-only
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <RowActionMenu
                    onViewDetails={() => router.push(`/locations/${loc.id}`)}
                    onEdit={isAllowed ? () => openEdit(loc) : undefined}
                    onDelete={isAdmin ? () => deleteLocation(loc.id) : undefined}
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
          );
        })}
        </div>
      </div>
    </div>
  );
}
