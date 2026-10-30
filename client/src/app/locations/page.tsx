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

  return (
    <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-neutral-50/50">
      <Header
        title="Laboratory & Classroom Facilities"
        subtitle="Location-Centric Room Matrix, Bulk Furniture & Condition Auditing"
        actionLabel={isAdmin ? "Add Location" : undefined}
        onAction={isAdmin ? () => openModal('add_location') : undefined}
        onExport={handleExport}
      />

      <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6 max-w-8xl w-full mx-auto">
        {/* 1. Department Telemetry Matrix Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white border border-neutral-200 rounded-xl p-4 shadow-2xs">
            <div className="flex items-center justify-between text-neutral-500 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">CS Facilities</span>
              <span className="text-[10px] bg-neutral-100 text-neutral-700 px-2 py-0.5 rounded font-mono font-bold">
                {departmentStats.totalCapacity} Seats
              </span>
            </div>
            <div className="text-2xl font-bold text-neutral-900 font-mono">
              {departmentStats.totalRooms} <span className="text-sm font-sans font-normal text-neutral-500">Rooms</span>
            </div>
            <div className="text-xs text-neutral-500 mt-1">
              Classrooms, computer labs, server rooms & depots
            </div>
          </div>

          <div className="bg-white border border-neutral-200 rounded-xl p-4 shadow-2xs">
            <div className="flex items-center justify-between text-emerald-700 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">All Operational</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-bold text-emerald-700 font-mono">
              {departmentStats.goodRooms} <span className="text-sm font-sans font-normal text-neutral-500">Rooms</span>
            </div>
            <div className="text-xs text-emerald-600 mt-1">
              100% of chairs, tables, ACs & PCs working
            </div>
          </div>

          <div className="bg-white border border-neutral-200 rounded-xl p-4 shadow-2xs">
            <div className="flex items-center justify-between text-amber-700 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Needs Attention</span>
              <AlertTriangle className="w-4 h-4 text-amber-600" />
            </div>
            <div className="text-2xl font-bold text-amber-700 font-mono">
              {departmentStats.warningRooms + departmentStats.criticalRooms} <span className="text-sm font-sans font-normal text-neutral-500">Rooms</span>
            </div>
            <div className="text-xs text-amber-700 mt-1">
              {departmentStats.criticalRooms > 0 ? `${departmentStats.criticalRooms} critical (AC/Projector repair)` : 'Minor defects reported'}
            </div>
          </div>

          <div className="bg-white border border-neutral-200 rounded-xl p-4 shadow-2xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-rose-700 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider">Repairs Needed</span>
                <Wrench className="w-4 h-4 text-rose-600" />
              </div>
              <div className="text-2xl font-bold text-rose-700 font-mono">
                {departmentStats.totalBrokenUnits} <span className="text-sm font-sans font-normal text-neutral-500">Defective Items</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowBrokenReportModal(true)}
              className="mt-2 inline-flex items-center justify-between text-xs font-bold text-rose-800 bg-rose-50 hover:bg-rose-100 border border-rose-200 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
            >
              <span>View Repair Report</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* 2. Controls & Search Filter Bar */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 flex-1 flex-wrap">
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search room name, code, building..."
                value={filterText}
                onChange={(e) => setFilterText(e.target.value)}
                className="w-full bg-white border border-neutral-300 text-neutral-900 text-xs pl-9 pr-3 py-2 rounded-lg focus:outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 font-medium placeholder:text-neutral-400 shadow-2xs transition-all"
              />
            </div>

            {/* Health Status Filter Pills */}
            <div className="flex items-center p-0.5 bg-neutral-100 rounded-lg border border-neutral-200 text-xs">
              <button
                type="button"
                onClick={() => setStatusFilter('all')}
                className={`px-2.5 py-1.5 rounded-md font-medium transition-all ${
                  statusFilter === 'all'
                    ? 'bg-white text-neutral-900 font-semibold shadow-2xs'
                    : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                All Status ({locations.length})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('good')}
                className={`px-2.5 py-1.5 rounded-md font-medium transition-all flex items-center gap-1 ${
                  statusFilter === 'good'
                    ? 'bg-white text-emerald-800 font-semibold shadow-2xs'
                    : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span>Good ({departmentStats.goodRooms})</span>
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('warning')}
                className={`px-2.5 py-1.5 rounded-md font-medium transition-all flex items-center gap-1 ${
                  statusFilter === 'warning'
                    ? 'bg-white text-amber-800 font-semibold shadow-2xs'
                    : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                <span>Attention ({departmentStats.warningRooms})</span>
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('critical')}
                className={`px-2.5 py-1.5 rounded-md font-medium transition-all flex items-center gap-1 ${
                  statusFilter === 'critical'
                    ? 'bg-white text-rose-800 font-semibold shadow-2xs'
                    : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                <span>Critical ({departmentStats.criticalRooms})</span>
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setShowBrokenReportModal(true)}
              className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-2 bg-white hover:bg-neutral-50 text-neutral-800 border border-neutral-300 rounded-lg shadow-2xs transition-colors cursor-pointer"
            >
              <Wrench className="w-3.5 h-3.5 text-rose-600" />
              <span>Department Broken Items ({departmentBrokenItems.length})</span>
            </button>
          </div>
        </div>

        {/* 3. Location-Centric Room Matrix Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((loc) => {
            const isAllowed = canManageLocation(loc.room) || canManageLocation(loc.name);

            // Badge styling
            let statusBadge = (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                100% Operational
              </span>
            );
            if (loc.healthStatus === 'critical') {
              statusBadge = (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-800 border border-rose-200 animate-pulse">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                  Critical Issue ({loc.totalBrokenCount} broken)
                </span>
              );
            } else if (loc.healthStatus === 'warning') {
              statusBadge = (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                  Minor Attention ({loc.totalBrokenCount} broken)
                </span>
              );
            }

            return (
              <div
                key={loc.id}
                className="bg-white border border-neutral-200 rounded-2xl p-5 space-y-4 hover:border-neutral-300 transition-all shadow-2xs hover:shadow-xs flex flex-col justify-between"
              >
                <div className="space-y-4">
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <Link
                        href={`/locations/${loc.id}`}
                        className="w-12 h-12 bg-neutral-100 rounded-xl flex items-center justify-center text-neutral-700 cursor-pointer hover:border-neutral-400 transition-colors shrink-0 shadow-2xs overflow-hidden border border-neutral-200"
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

                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-mono text-[10px] font-bold bg-neutral-900 text-white px-2 py-0.5 rounded">
                            {loc.room}
                          </span>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 bg-neutral-100 px-1.5 py-0.5 rounded">
                            {loc.type?.replace('_', ' ') || 'LAB'}
                          </span>
                        </div>
                        <Link
                          href={`/locations/${loc.id}`}
                          className="text-sm font-bold text-neutral-900 hover:text-emerald-700 text-left cursor-pointer transition-colors block truncate mt-1"
                        >
                          {loc.name}
                        </Link>
                        <div className="text-[11px] text-neutral-500 truncate mt-0.5">
                          {loc.building} • Floor {loc.floor ?? 1}
                        </div>
                      </div>
                    </div>

                    <RowActionMenu
                      onViewDetails={() => router.push(`/locations/${loc.id}`)}
                      onEdit={isAllowed ? () => openEdit(loc) : undefined}
                      onDelete={isAdmin ? () => deleteLocation(loc.id) : undefined}
                    />
                  </div>

                  {/* Room Health & Status Pill */}
                  <div className="flex items-center justify-between gap-2 pt-1 border-t border-neutral-100">
                    <div>{statusBadge}</div>
                    <div className="text-[11px] font-semibold text-neutral-500 flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-neutral-400" />
                      <span>{loc.capacity || 30} seats</span>
                    </div>
                  </div>

                  {/* Room Health Matrix Tags (Chairs, Tables, AC, PCs) */}
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    {loc.chairItem && (
                      <div className={`p-2 rounded-lg border flex flex-col justify-between ${
                        loc.chairItem.qtyBroken > 0
                          ? 'bg-amber-50/70 border-amber-200 text-amber-900'
                          : 'bg-neutral-50 border-neutral-200/80 text-neutral-700'
                      }`}>
                        <div className="text-[10px] font-semibold text-neutral-500">Student Chairs</div>
                        <div className="font-bold flex items-center justify-between mt-0.5">
                          <span>{loc.chairItem.qtyWorking}/{loc.chairItem.qtyWorking + loc.chairItem.qtyBroken} OK</span>
                          {loc.chairItem.qtyBroken > 0 && (
                            <span className="text-[9px] font-bold bg-amber-200 text-amber-900 px-1 py-0.2 rounded">
                              {loc.chairItem.qtyBroken} Broken
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {loc.tableItem && (
                      <div className="p-2 rounded-lg border bg-neutral-50 border-neutral-200/80 text-neutral-700 flex flex-col justify-between">
                        <div className="text-[10px] font-semibold text-neutral-500">Desks / Tables</div>
                        <div className="font-bold flex items-center justify-between mt-0.5">
                          <span>{loc.tableItem.qtyWorking}/{loc.tableItem.qtyWorking + loc.tableItem.qtyBroken} OK</span>
                          <span className="text-[9px] text-emerald-700 font-semibold">100%</span>
                        </div>
                      </div>
                    )}

                    {loc.acItem && (
                      <div className={`p-2 rounded-lg border flex flex-col justify-between ${
                        loc.acItem.qtyBroken > 0
                          ? 'bg-rose-50/70 border-rose-200 text-rose-900'
                          : 'bg-neutral-50 border-neutral-200/80 text-neutral-700'
                      }`}>
                        <div className="text-[10px] font-semibold text-neutral-500">Air Conditioning</div>
                        <div className="font-bold flex items-center justify-between mt-0.5">
                          <span>{loc.acItem.qtyWorking}/{loc.acItem.qtyWorking + loc.acItem.qtyBroken} OK</span>
                          {loc.acItem.qtyBroken > 0 && (
                            <span className="text-[9px] font-bold bg-rose-200 text-rose-900 px-1 py-0.2 rounded">
                              {loc.acItem.qtyBroken} Broken
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {loc.pcItem && (
                      <div className={`p-2 rounded-lg border flex flex-col justify-between ${
                        (loc.pcItem.qtyBroken > 0 || loc.pcItem.qtyMaintenance > 0)
                          ? 'bg-amber-50/70 border-amber-200 text-amber-900'
                          : 'bg-neutral-50 border-neutral-200/80 text-neutral-700'
                      }`}>
                        <div className="text-[10px] font-semibold text-neutral-500">Desktop PCs</div>
                        <div className="font-bold flex items-center justify-between mt-0.5">
                          <span>{loc.pcItem.qtyWorking}/{loc.pcItem.qtyWorking + loc.pcItem.qtyBroken + loc.pcItem.qtyMaintenance} OK</span>
                          {(loc.pcItem.qtyBroken > 0 || loc.pcItem.qtyMaintenance > 0) && (
                            <span className="text-[9px] font-bold bg-amber-200 text-amber-900 px-1 py-0.2 rounded">
                              {loc.pcItem.qtyBroken + loc.pcItem.qtyMaintenance} Issue
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Footer: Audit Stamp & Action Buttons */}
                <div className="pt-3 border-t border-neutral-100 space-y-2.5">
                  <div className="flex items-center justify-between text-[11px] text-neutral-400">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-neutral-400" />
                      <span>Audited: {loc.lastAuditedAt || 'Pending'}</span>
                    </span>
                    <span className="truncate max-w-[120px] font-medium text-neutral-500">
                      {loc.auditedBy || 'Faculty'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Link
                      href={`/locations/${loc.id}?tab=audit`}
                      className="flex-1 text-center py-1.5 px-2 bg-neutral-100 hover:bg-neutral-200/80 text-neutral-800 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                    >
                      Quick Audit
                    </Link>
                    <Link
                      href={`/locations/${loc.id}`}
                      className="flex-1 text-center py-1.5 px-2 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1"
                    >
                      <span>Room View</span>
                      <ArrowRight className="w-3 h-3" />
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
