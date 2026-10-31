'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Header } from '@/components/Header';
import { useStock } from '@/context/StockContext';
import { useAuth } from '@/context/AuthContext';
import { exportToCsv } from '@/lib/exportCsv';
import { LabThumbnail } from '@/components/LabThumbnail';
import {
  Boxes,
  Microscope,
  ArrowRight,
  Search,
  Plus,
  Shield,
  AlertTriangle,
  CheckCircle2,
  Wrench,
  FileSpreadsheet,
  Calendar,
  X,
  Users,
  Eye,
  SlidersHorizontal,
  Building,
} from 'lucide-react';
import { RowActionMenu } from '@/components/RowActionMenu';
import { RoomInventoryItem } from '@/types';

export default function LocationsPage() {
  const router = useRouter();
  const { stock, assets, locations, openModal, openEdit, deleteLocation, showToast } = useStock();
  const { user, canManageLocation } = useAuth();
  const [filterText, setFilterText] = useState('');
  const [scopeFilter, setScopeFilter] = useState<'all' | 'assigned'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'good' | 'warning' | 'critical'>('all');
  const [showBrokenReportModal, setShowBrokenReportModal] = useState(false);

  const isAdmin = user?.roleBadge === 'Admin' || user?.assignedLabs?.includes('all');

  const myAssignedCount = locations.filter(
    (l) => canManageLocation(l.room) || canManageLocation(l.name)
  ).length;

  // Compute room statistics and condition health
  const enhancedLocations = useMemo(() => {
    return locations.map((loc) => {
      const roomKey = loc.room.replace(/^Rm\s*/i, '').trim().toLowerCase();

      // Legacy matching for stock & assets
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

      // Facility Inventory Condition Aggregates
      const invs = loc.inventories || [];
      const totalBrokenCount = invs.reduce((sum, item) => sum + (item.qtyBroken || 0), 0);
      const totalMaintenanceCount = invs.reduce((sum, item) => sum + (item.qtyMaintenance || 0), 0);
      const totalWorkingCount = invs.reduce((sum, item) => sum + (item.qtyWorking || 0), 0);

      const hasCriticalBroken = invs.some(
        (item) =>
          item.qtyBroken > 0 &&
          (item.name.toLowerCase().includes('air conditioner') ||
            item.name.toLowerCase().includes('projector'))
      );

      let healthStatus: 'good' | 'warning' | 'critical' = 'good';
      if (hasCriticalBroken || totalBrokenCount >= 4) {
        healthStatus = 'critical';
      } else if (totalBrokenCount > 0 || totalMaintenanceCount > 0) {
        healthStatus = 'warning';
      }

      // Quick matrix snippets
      const chairItem = invs.find((i) => i.name.toLowerCase().includes('chair') || i.name.toLowerCase().includes('stool'));
      const tableItem = invs.find((i) => i.name.toLowerCase().includes('desk') || i.name.toLowerCase().includes('table') || i.name.toLowerCase().includes('bench'));
      const acItem = invs.find((i) => i.name.toLowerCase().includes('air conditioner'));
      const pcItem = invs.find((i) => i.name.toLowerCase().includes('desktop') || i.name.toLowerCase().includes('pc'));

      return {
        ...loc,
        stockItemsCount,
        totalStockUnits: totalStockUnits > 0 ? totalStockUnits : loc.totalItems,
        hardwareAssetsCount,
        totalHardwareUnits: totalHardwareUnits > 0 ? totalHardwareUnits : loc.totalAssets,
        totalBrokenCount,
        totalMaintenanceCount,
        totalWorkingCount,
        healthStatus,
        chairItem,
        tableItem,
        acItem,
        pcItem,
      };
    });
  }, [locations, stock, assets]);

  // Department-wide broken & maintenance report
  const departmentBrokenItems = useMemo(() => {
    const list: Array<{
      roomId: string;
      roomName: string;
      roomCode: string;
      item: RoomInventoryItem;
    }> = [];

    locations.forEach((loc) => {
      (loc.inventories || []).forEach((inv) => {
        if (inv.qtyBroken > 0 || inv.qtyMaintenance > 0) {
          list.push({
            roomId: loc.id,
            roomName: loc.name,
            roomCode: loc.room,
            item: inv,
          });
        }
      });
    });

    return list;
  }, [locations]);

  // Overall Department KPIs
  const departmentStats = useMemo(() => {
    const totalCapacity = locations.reduce((sum, l) => sum + (l.capacity || 0), 0);
    const goodRooms = enhancedLocations.filter((l) => l.healthStatus === 'good').length;
    const warningRooms = enhancedLocations.filter((l) => l.healthStatus === 'warning').length;
    const criticalRooms = enhancedLocations.filter((l) => l.healthStatus === 'critical').length;
    const totalBrokenUnits = departmentBrokenItems.reduce((sum, d) => sum + d.item.qtyBroken, 0);
    const totalMaintUnits = departmentBrokenItems.reduce((sum, d) => sum + d.item.qtyMaintenance, 0);

    return {
      totalRooms: locations.length,
      totalCapacity,
      goodRooms,
      warningRooms,
      criticalRooms,
      totalBrokenUnits,
      totalMaintUnits,
    };
  }, [locations, enhancedLocations, departmentBrokenItems]);

  const filtered = enhancedLocations
    .filter((loc) => {
      if (scopeFilter === 'assigned') {
        return canManageLocation(loc.room) || canManageLocation(loc.name);
      }
      return true;
    })
    .filter((loc) => {
      if (statusFilter === 'all') return true;
      return loc.healthStatus === statusFilter;
    })
    .filter(
      (loc) =>
        loc.name.toLowerCase().includes(filterText.toLowerCase()) ||
        loc.room.toLowerCase().includes(filterText.toLowerCase()) ||
        loc.building.toLowerCase().includes(filterText.toLowerCase())
    )
    .sort((a, b) => {
      const aAllowed = canManageLocation(a.room) || canManageLocation(a.name);
      const bAllowed = canManageLocation(b.room) || canManageLocation(b.name);
      if (aAllowed && !bAllowed) return -1;
      if (!aAllowed && bAllowed) return 1;
      return 0;
    });

  const handleExport = () => {
    exportToCsv(
      'csd_location_centric_matrix_report',
      filtered.map((l) => ({
        'Facility Name': l.name,
        Building: l.building,
        'Room Number': l.room,
        'Room Type': l.type || 'COMPUTER_LAB',
        'Capacity (Seats)': l.capacity || 0,
        'Condition Status': l.healthStatus.toUpperCase(),
        'Broken Items (Units)': l.totalBrokenCount,
        'Under Repair (Units)': l.totalMaintenanceCount,
        'Working Equipment (Units)': l.totalWorkingCount,
        'Last Audited': l.lastAuditedAt || 'Pending Audit',
        'Audited By': l.auditedBy || 'N/A',
      }))
    );
    showToast('Exported Location-Centric Matrix Report as CSV');
  };

  const handleExportBrokenItems = () => {
    exportToCsv(
      'csd_department_maintenance_procurement_report',
      departmentBrokenItems.map((d) => ({
        'Room Number': d.roomCode,
        'Room Name': d.roomName,
        'Item Category': d.item.group,
        'Equipment / Item Name': d.item.name,
        'Brand / Specification': d.item.brandSpec || 'Standard',
        Unit: d.item.unit,
        'Working Units': d.item.qtyWorking,
        'Broken / Defective Units': d.item.qtyBroken,
        'Under Repair Units': d.item.qtyMaintenance,
        'Defect Remarks & Notes': d.item.remarks || '',
        'Last Checked Date': d.item.lastAuditedAt || '',
      }))
    );
    showToast(`Exported ${departmentBrokenItems.length} repair records for administration/procurement.`);
  };

  const totalHardwareDevicesCount = assets.reduce((sum, a) => sum + (a.totalUnits ?? 1), 0);

  return (
    <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-neutral-50/50">
      <Header
        title="Classrooms & Laboratories"
        subtitle={`${locations.length} Connected Learning Spaces • Engineering & Science Facilities`}
        actionLabel={isAdmin ? "Add Classroom" : undefined}
        onAction={isAdmin ? () => openModal('add_location') : undefined}
        onExport={handleExport}
      />

      <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6 max-w-8xl w-full mx-auto">
        {/* 1. Classroom & Campus Telemetry Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white border border-neutral-200 rounded-xl p-4 shadow-2xs">
            <div className="flex items-center justify-between text-neutral-500 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Campus Facilities</span>
              <Building className="w-4 h-4 text-neutral-500" />
            </div>
            <div className="text-2xl font-bold text-neutral-900 font-mono">
              {departmentStats.totalRooms} <span className="text-sm font-sans font-normal text-neutral-500">Rooms</span>
            </div>
            <div className="text-xs text-neutral-500 mt-1">
              Computer labs, seminar rooms & server depots
            </div>
          </div>

          <div className="bg-white border border-neutral-200 rounded-xl p-4 shadow-2xs">
            <div className="flex items-center justify-between text-neutral-500 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Student Seating</span>
              <Users className="w-4 h-4 text-neutral-500" />
            </div>
            <div className="text-2xl font-bold text-neutral-900 font-mono">
              {departmentStats.totalCapacity} <span className="text-sm font-sans font-normal text-neutral-500">Seats</span>
            </div>
            <div className="text-xs text-neutral-500 mt-1">
              Active workstation seats & lecture benches
            </div>
          </div>

          <div className="bg-white border border-neutral-200 rounded-xl p-4 shadow-2xs">
            <div className="flex items-center justify-between text-emerald-700 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Central Inventory</span>
              <Boxes className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-bold text-emerald-700 font-mono">
              {stock.length} <span className="text-sm font-sans font-normal text-neutral-500">SKUs</span>
            </div>
            <div className="text-xs text-emerald-600 mt-1">
              Network cables, peripherals & lab supplies
            </div>
          </div>

          <div className="bg-white border border-neutral-200 rounded-xl p-4 shadow-2xs">
            <div className="flex items-center justify-between text-blue-700 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Hardware Devices</span>
              <Microscope className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-2xl font-bold text-blue-700 font-mono">
              {totalHardwareDevicesCount} <span className="text-sm font-sans font-normal text-neutral-500">Units</span>
            </div>
            <div className="text-xs text-blue-600 mt-1">
              {assets.length} equipment models deployed campus-wide
            </div>
          </div>
        </div>

        {/* 2. Controls & Search Filter Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 flex-1 flex-wrap">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search classroom name, room code, building..."
                value={filterText}
                onChange={(e) => setFilterText(e.target.value)}
                className="w-full bg-white border border-neutral-300 text-neutral-900 text-xs pl-9 pr-3 py-2 rounded-lg focus:outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 font-medium placeholder:text-neutral-400 shadow-2xs transition-all"
              />
            </div>

            {/* Scope Filter: All vs Assigned */}
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
                All Classrooms ({locations.length})
              </button>
              <button
                type="button"
                onClick={() => setScopeFilter('assigned')}
                className={`px-3 py-1.5 rounded-md font-medium transition-all flex items-center gap-1 ${
                  scopeFilter === 'assigned'
                    ? 'bg-white text-emerald-800 font-semibold shadow-2xs'
                    : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                <span>My Assigned ({myAssignedCount})</span>
              </button>
            </div>
          </div>

          <div className="text-xs text-neutral-500 font-medium">
            Showing <span className="font-semibold text-neutral-900">{filtered.length}</span> classrooms
          </div>
        </div>

        {/* 3. Clean Classroom & Laboratory Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((loc) => {
            const isAllowed = canManageLocation(loc.room) || canManageLocation(loc.name);

            return (
              <div
                key={loc.id}
                className="bg-white border border-neutral-200 rounded-2xl overflow-hidden hover:border-neutral-300 transition-all shadow-2xs hover:shadow-md flex flex-col justify-between group"
              >
                {/* 1. Classroom Visual Image Banner */}
                <div className="relative w-full h-44 bg-neutral-100 overflow-hidden border-b border-neutral-200">
                  <Link href={`/locations/${loc.id}`} className="block w-full h-full cursor-pointer">
                    <LabThumbnail
                      src={loc.imageUrl}
                      alt={loc.name}
                      size="card"
                      fallbackType="building"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      iconClassName="w-10 h-10 text-neutral-400"
                    />
                  </Link>

                  {/* Overlaid Badges: Room Code & Type */}
                  <div className="absolute top-3 left-3 flex items-center gap-1.5 flex-wrap pointer-events-none">
                    <span className="font-mono text-xs font-bold bg-neutral-900/90 text-white backdrop-blur-xs px-2.5 py-1 rounded-md shadow-xs">
                      {loc.room}
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-800 bg-white/95 backdrop-blur-xs px-2 py-1 rounded-md shadow-xs border border-neutral-200/60">
                      {loc.type?.replace('_', ' ') || 'LAB'}
                    </span>
                  </div>

                  {/* Top Right Actions Menu */}
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                    }}
                    className="absolute top-3 right-3 z-20 bg-white/95 backdrop-blur-xs rounded-lg shadow-xs border border-neutral-200/80 hover:bg-white transition-colors"
                  >
                    <RowActionMenu
                      onViewDetails={() => router.push(`/locations/${loc.id}`)}
                      onEdit={isAllowed ? () => openEdit(loc) : undefined}
                      onDelete={isAdmin ? () => deleteLocation(loc.id) : undefined}
                    />
                  </div>

                  {/* Bottom Overlay Pill: Seats / Capacity */}
                  <div className="absolute bottom-2.5 right-3 bg-neutral-900/80 text-white backdrop-blur-xs px-2.5 py-0.5 rounded-md text-[11px] font-semibold flex items-center gap-1.5 shadow-xs pointer-events-none">
                    <Users className="w-3.5 h-3.5 text-neutral-300" />
                    <span>{loc.capacity || 30} Seats</span>
                  </div>
                </div>

                {/* 2. Classroom Details Body */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div>
                    <Link
                      href={`/locations/${loc.id}`}
                      className="text-base font-bold text-neutral-900 hover:text-emerald-700 transition-colors block line-clamp-1"
                    >
                      {loc.name}
                    </Link>
                    <div className="text-xs text-neutral-500 mt-1 flex items-center gap-1.5 flex-wrap">
                      <span>{loc.building}</span>
                      <span>•</span>
                      <span>Floor {loc.floor ?? 1}</span>
                      {isAllowed ? (
                        <>
                          <span>•</span>
                          <span className="text-emerald-700 font-semibold bg-emerald-50 border border-emerald-200/60 px-1.5 py-0.2 rounded text-[10px]">
                            Assigned Lab
                          </span>
                        </>
                      ) : (
                        <>
                          <span>•</span>
                          <span className="text-neutral-500 bg-neutral-100 border border-neutral-200 px-1.5 py-0.2 rounded text-[10px] flex items-center gap-0.5">
                            <Shield className="w-2.5 h-2.5 text-neutral-400" /> Read-only
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Clean Equipment Count Badges (Stock & Assets) */}
                  <div className="grid grid-cols-2 gap-2.5 pt-1">
                    <Link
                      href={`/locations/${loc.id}?tab=stock`}
                      className="p-2.5 rounded-xl bg-neutral-50 hover:bg-neutral-100/80 border border-neutral-200/80 transition-colors flex items-center gap-2.5 group/btn"
                    >
                      <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center shrink-0 group-hover/btn:scale-105 transition-transform">
                        <Boxes className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-[10px] uppercase font-bold text-neutral-500 tracking-wider">Inventory</div>
                        <div className="text-xs font-bold text-neutral-900 truncate">
                          {loc.stockItemsCount} {loc.stockItemsCount === 1 ? 'item' : 'items'}
                        </div>
                        <div className="text-[10px] text-neutral-500">{loc.totalStockUnits} units</div>
                      </div>
                    </Link>

                    <Link
                      href={`/locations/${loc.id}?tab=hardware`}
                      className="p-2.5 rounded-xl bg-neutral-50 hover:bg-neutral-100/80 border border-neutral-200/80 transition-colors flex items-center gap-2.5 group/btn"
                    >
                      <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 flex items-center justify-center shrink-0 group-hover/btn:scale-105 transition-transform">
                        <Microscope className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-[10px] uppercase font-bold text-neutral-500 tracking-wider">Hardware</div>
                        <div className="text-xs font-bold text-neutral-900 truncate">
                          {loc.hardwareAssetsCount} {loc.hardwareAssetsCount === 1 ? 'device' : 'devices'}
                        </div>
                        <div className="text-[10px] text-neutral-500">{loc.totalHardwareUnits} units</div>
                      </div>
                    </Link>
                  </div>

                  {/* Card Footer: Action Link */}
                  <div className="pt-3 border-t border-neutral-100 flex items-center justify-between gap-2">
                    <span className="text-[11px] text-neutral-400 font-mono">
                      Room: {loc.room}
                    </span>
                    <Link
                      href={`/locations/${loc.id}`}
                      className="inline-flex items-center gap-1.5 py-1.5 px-3 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer shadow-2xs"
                    >
                      <span>View Room Fleet</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. Department-Wide Maintenance & Procurement Report Modal */}
      {showBrokenReportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-neutral-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-5 border-b border-neutral-200 flex items-start justify-between bg-neutral-50/50">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-rose-50 text-rose-700 border border-rose-200 px-2 py-0.5 rounded">
                    Department Procurement & Repair
                  </span>
                  <span className="text-xs text-neutral-500 font-medium">Computer Science Faculty</span>
                </div>
                <h2 className="text-lg font-bold text-neutral-900">
                  Defective Facilities & Equipment Report ({departmentBrokenItems.length} Issues)
                </h2>
                <p className="text-xs text-neutral-500">
                  Aggregated across all classrooms, computer labs, and facilities requiring physical maintenance or replacement.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowBrokenReportModal(false)}
                className="p-1 text-neutral-400 hover:text-neutral-700 rounded-lg hover:bg-neutral-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Table Body */}
            <div className="flex-1 overflow-y-auto p-5">
              {departmentBrokenItems.length === 0 ? (
                <div className="text-center py-12 space-y-2">
                  <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
                  <h3 className="text-sm font-bold text-neutral-900">Zero Broken Items Reported!</h3>
                  <p className="text-xs text-neutral-500">All furniture, electrical appliances, and equipment are operational.</p>
                </div>
              ) : (
                <div className="border border-neutral-200 rounded-xl overflow-hidden shadow-2xs">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-neutral-50 border-b border-neutral-200 text-neutral-600 font-semibold">
                      <tr>
                        <th className="py-2.5 px-3">Room / Facility</th>
                        <th className="py-2.5 px-3">Item / Specification</th>
                        <th className="py-2.5 px-3">Category</th>
                        <th className="py-2.5 px-3 text-center">Working</th>
                        <th className="py-2.5 px-3 text-center">Broken</th>
                        <th className="py-2.5 px-3 text-center">In Repair</th>
                        <th className="py-2.5 px-3">Defect Remarks & Notes</th>
                        <th className="py-2.5 px-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-200 font-medium text-neutral-800">
                      {departmentBrokenItems.map((d, idx) => (
                        <tr key={idx} className="hover:bg-neutral-50/70 transition-colors">
                          <td className="py-3 px-3">
                            <span className="font-mono font-bold text-neutral-900">{d.roomCode}</span>
                            <div className="text-[11px] text-neutral-500 truncate max-w-[140px]">{d.roomName}</div>
                          </td>
                          <td className="py-3 px-3">
                            <div className="font-bold text-neutral-900">{d.item.name}</div>
                            <div className="text-[11px] text-neutral-500">{d.item.brandSpec || 'Standard'}</div>
                          </td>
                          <td className="py-3 px-3">
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-neutral-100 text-neutral-700 border border-neutral-200">
                              {d.item.group}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-center font-mono text-emerald-700 font-bold">
                            {d.item.qtyWorking}
                          </td>
                          <td className="py-3 px-3 text-center font-mono text-rose-700 font-bold bg-rose-50/50">
                            {d.item.qtyBroken}
                          </td>
                          <td className="py-3 px-3 text-center font-mono text-amber-700 font-bold">
                            {d.item.qtyMaintenance}
                          </td>
                          <td className="py-3 px-3 text-neutral-600 text-[11px] max-w-xs">
                            {d.item.remarks || <span className="text-neutral-400 italic">No notes</span>}
                          </td>
                          <td className="py-3 px-3 text-right">
                            <button
                              type="button"
                              onClick={() => {
                                setShowBrokenReportModal(false);
                                router.push(`/locations/${d.roomId}?tab=audit`);
                              }}
                              className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 underline cursor-pointer"
                            >
                              Audit Room
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Modal Footer with CSV Export */}
            <div className="p-4 border-t border-neutral-200 bg-neutral-50 flex items-center justify-between">
              <span className="text-xs text-neutral-500">
                Ready to submit to Dean Office & Facilities Department
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleExportBrokenItems}
                  className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-white bg-neutral-900 hover:bg-neutral-800 rounded-lg transition-colors cursor-pointer shadow-xs"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Export Repair Requisition (CSV)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowBrokenReportModal(false)}
                  className="px-3.5 py-2 text-xs font-semibold text-neutral-700 bg-white border border-neutral-300 hover:bg-neutral-100 rounded-lg transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
