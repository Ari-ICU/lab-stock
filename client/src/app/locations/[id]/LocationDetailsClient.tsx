'use client';

import { useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Header } from '@/components/Header';
import { useStock } from '@/context/StockContext';
import { useAuth } from '@/context/AuthContext';
import { Dropdown, DropdownOption } from '@/components/Dropdown';
import { exportToCsv } from '@/lib/exportCsv';
import { LabThumbnail } from '@/components/LabThumbnail';
import { RowActionMenu } from '@/components/RowActionMenu';
import {
  ArrowLeft,
  Search,
  Plus,
  AlertTriangle,
  Edit3,
  Trash2,
  FileSpreadsheet,
  X,
} from 'lucide-react';
import {  AssetGroup } from '@/types';
import { getRoomItemImage } from './items/shared';
import { LoadingScreen } from '@/components/LoadingScreen';

export default function LocationDetailsClient({ id: propId }: { id?: string }) {
  const params = useParams();
  const router = useRouter();
  const id = propId || (params?.id as string);

  const {
    locations,
    assets,
    stock,
    loans,
    maintenance,
    openEdit,
    deleteLocation,
    updateRoomInventoryCount,
    deleteRoomInventoryItem,
    deleteAsset,
    deleteStockItem,
    showToast,
    isLoading,
  } = useStock();
  const { user, canManageLocation } = useAuth();

  const [filterText, setFilterText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedCondition, setSelectedCondition] = useState<string>('all');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Dropdown Options
  const categoryOptions: DropdownOption[] = [
    { label: 'All Categories', value: 'all' },
    { label: 'Furniture & Fixtures', value: 'FURNITURE' },
    { label: 'Electrical & HVAC', value: 'ELECTRICAL' },
    { label: 'Lab & IT Hardware', value: 'IT_HARDWARE' },
    { label: 'Safety & Misc', value: 'SAFETY_MISC' },
  ];

  const conditionOptions: DropdownOption[] = [
    { label: 'All Equipment', value: 'all' },
    { label: 'Operational', value: 'operational' },
    { label: 'Broken', value: 'defective' },
    { label: 'In Repair', value: 'maintenance' },
  ];

  const getCategoryIcon = (group: AssetGroup) => {
    switch (group) {
      case 'FURNITURE':
        return '🪑';
      case 'ELECTRICAL':
        return '⚡';
      case 'IT_HARDWARE':
        return '🖥️';
      case 'SAFETY_MISC':
        return '🧯';
      default:
        return '📦';
    }
  };

  const getCategoryLabel = (group: AssetGroup) => {
    switch (group) {
      case 'FURNITURE':
        return 'Furniture & Fixtures';
      case 'ELECTRICAL':
        return 'Electrical & HVAC';
      case 'IT_HARDWARE':
        return 'Lab & IT Hardware';
      case 'SAFETY_MISC':
        return 'Safety & Misc';
      default:
        return group;
    }
  };

  const loc =
    locations.find(
      (l) =>
        l.id === id ||
        (l as any).serverId === id ||
        (l as any).code === id ||
        l.room.toLowerCase().replace(/[^a-z0-9]/g, '') === (id || '').toLowerCase().replace(/[^a-z0-9]/g, '')
    ) ||
    (locations.length > 0 ? locations[0] : undefined);
  const isAdmin = user?.roleBadge === 'Admin' || user?.role === 'Primary Lab Administrator';
  const isAllowed = isAdmin || (loc ? canManageLocation(loc.room) || canManageLocation(loc.name) : false);

  // Match legacy items belonging to this lab location
  const { matchingAssets, matchingStock, totalHardwareUnits, totalStockUnits, activeLoansCount, maintenanceCount } = useMemo(() => {
    if (!loc) {
      return {
        matchingAssets: [],
        matchingStock: [],
        totalHardwareUnits: 0,
        totalStockUnits: 0,
        activeLoansCount: 0,
        maintenanceCount: 0,
      };
    }

    const roomKey = loc.room.replace(/^(rm|room)\s*/i, '').trim().toLowerCase();

    const mAssets = assets.filter((a) => {
      const l = a.location.toLowerCase();
      return (
        l.includes(roomKey) ||
        l.includes(loc.room.toLowerCase()) ||
        l.includes(loc.name.toLowerCase())
      );
    });

    const mStock = stock.filter((s) => {
      const l = s.location.toLowerCase();
      return (
        l.includes(roomKey) ||
        l.includes(loc.room.toLowerCase()) ||
        l.includes(loc.name.toLowerCase())
      );
    });

    const hUnits = mAssets.reduce((sum, a) => sum + (a.totalUnits ?? 1), 0);
    const sUnits = mStock.reduce((sum, s) => sum + (s.quantity || 1), 0);

    const loansInLab = loans.filter((loan) =>
      mAssets.some((a) => a.id === loan.assetId && loan.status === 'active')
    ).length;

    const maintInLab = maintenance.filter((m) =>
      mAssets.some((a) => a.serialNumber === m.serialNumber)
    ).length;

    return {
      matchingAssets: mAssets,
      matchingStock: mStock,
      totalHardwareUnits: hUnits > 0 ? hUnits : loc.totalAssets,
      totalStockUnits: sUnits > 0 ? sUnits : loc.totalItems,
      activeLoansCount: loansInLab,
      maintenanceCount: maintInLab,
    };
  }, [loc, assets, stock, loans, maintenance]);

  // Filtered room inventories based on search, category and condition
  const filteredRoomInventories = useMemo(() => {
    if (!loc || !loc.inventories) return [];
    const q = filterText.toLowerCase().trim();
    return loc.inventories.filter((item) => {
      const matchesSearch =
        !q ||
        item.name.toLowerCase().includes(q) ||
        item.brandSpec?.toLowerCase().includes(q) ||
        item.group.toLowerCase().includes(q) ||
        item.remarks?.toLowerCase().includes(q);

      const matchesCategory =
        selectedCategory === 'all' || item.group === selectedCategory;

      const matchesCondition =
        selectedCondition === 'all'
          ? true
          : selectedCondition === 'operational'
            ? item.qtyBroken === 0 && (item.qtyMaintenance || 0) === 0
            : selectedCondition === 'maintenance'
              ? (item.qtyMaintenance || 0) > 0
              : item.qtyBroken > 0;

      return matchesSearch && matchesCategory && matchesCondition;
    });
  }, [loc, filterText, selectedCategory, selectedCondition]);

  const inventorySummary = useMemo(() => {
    const invs = loc?.inventories || [];
    const totalWorking = invs.reduce((sum, i) => sum + (i.qtyWorking || 0), 0);
    const totalBroken = invs.reduce((sum, i) => sum + (i.qtyBroken || 0), 0);
    const totalMaintenance = invs.reduce((sum, i) => sum + (i.qtyMaintenance || 0), 0);
    const totalUnits = totalWorking + totalBroken + totalMaintenance;
    const healthRate = totalUnits > 0 ? Math.round((totalWorking / totalUnits) * 100) : 100;

    return {
      totalWorking,
      totalBroken,
      totalMaintenance,
      totalUnits,
      healthRate,
    };
  }, [loc]);


  const copyToClipboard = (text: string, label: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    showToast(`Copied ${label} to clipboard`);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  if (locations.length === 0) {
    return (
      <div className="flex-1 flex flex-col min-w-0">
        <Header
          title="Loading Laboratory..."
          subtitle="Location Directory"
          showExport={false}
        />
        <div className="flex-1 flex items-center justify-center p-12 text-neutral-400 text-xs">
          <div className="flex flex-col items-center gap-3">
            <div className="w-6 h-6 border-2 border-neutral-300 border-t-emerald-500 rounded-full animate-spin" />
            <span className="font-medium text-neutral-600">Connecting to Department Central Stock & Assets...</span>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return <LoadingScreen message="Loading laboratory facility..." />;
  }

  if (!loc) {
    return (
      <div className="flex-1 flex flex-col min-w-0">
        <Header
          title="Laboratory Not Found"
          subtitle="Location Directory"
          showExport={false}
          actionLabel="All Locations"
          onAction={() => router.push('/locations')}
        />
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="bg-white border border-neutral-200 rounded-xl p-8 max-w-md w-full text-center space-y-4 shadow-sm">
            <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h2 className="text-base font-bold text-neutral-900">Laboratory Room Not Found</h2>
            <p className="text-xs text-neutral-500 leading-relaxed">
              The laboratory record with ID <span className="font-mono font-semibold text-neutral-800">{id}</span> does not exist or has been relocated.
            </p>
            <Link
              href="/locations"
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-neutral-900 rounded-lg hover:bg-neutral-800 transition-colors shadow-2xs"
            >
              <ArrowLeft className="w-4 h-4" />
              Return to Locations Directory
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const handleExportRoomFleet = () => {
    const facilityRows = (loc.inventories || []).map((inv) => ({
      'Record Type': 'Room Facility Inventory',
      'Room Number': loc.room,
      'Facility Name': loc.name,
      'Category Group': inv.group,
      'Item Name': inv.name,
      'Brand / Specification': inv.brandSpec || 'Standard',
      'Working Units': inv.qtyWorking,
      'Broken Units': inv.qtyBroken,
      'In Repair Units': inv.qtyMaintenance,
      Unit: inv.unit,
      'Defect Notes & Remarks': inv.remarks || '',
      'Last Audited Date': inv.lastAuditedAt || '',
    }));

    const hardwareRows = matchingAssets.map((a) => ({
      'Record Type': 'Hardware Device',
      'Room Number': loc.room,
      'Facility Name': loc.name,
      'Category Group': 'IT_HARDWARE',
      'Item Name': a.name,
      'Brand / Specification': a.model,
      'Working Units': a.status === 'operational' ? a.totalUnits ?? 1 : 0,
      'Broken Units': a.status === 'maintenance' ? a.totalUnits ?? 1 : 0,
      'In Repair Units': 0,
      Unit: a.unitType || 'Units',
      'Defect Notes & Remarks': `Serial: ${a.serialNumber}`,
      'Last Audited Date': a.nextCalibration || '',
    }));

    const filename = `${loc.name.toLowerCase().replace(/[^a-z0-9]+/g, '_')}_condition_audit`;
    exportToCsv(filename, [...facilityRows, ...hardwareRows]);
    showToast(`Exported complete room condition inventory for ${loc.name}`);
  };

  const handleDelete = () => {
    if (!isAdmin) {
      showToast('Permission denied: Only Primary Administrators can remove laboratory facilities.', 'error');
      return;
    }
    deleteLocation(loc.id);
    showToast(`Laboratory location ${loc.name} removed`);
    router.push('/locations');
  };

  return (
    <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-neutral-50/50">
      {/* 1. Unified Navigation Header */}
      <Header
        title={loc.name}
        subtitle={`${loc.building} • Room ${loc.room.replace(/^(rm|room)\s*/i, '')} • Floor ${loc.floor ?? 1}`}
        backHref="/locations"
        backLabel="Laboratory Facilities"
        showAction={false}
        showExport={false}
        actions={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExportRoomFleet}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-neutral-700 bg-white border border-neutral-200 hover:border-neutral-300 rounded-lg hover:bg-neutral-50 transition-colors shadow-2xs cursor-pointer"
              title="Download room condition report as CSV"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span className="hidden sm:inline">Export</span>
            </button>

            {isAllowed && (
              <>
                <button
                  type="button"
                  onClick={() => openEdit(loc)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-neutral-700 bg-white border border-neutral-200 hover:border-neutral-300 rounded-lg hover:bg-neutral-50 transition-colors shadow-2xs cursor-pointer"
                  title="Edit laboratory parameters"
                >
                  <Edit3 className="w-3.5 h-3.5 text-neutral-500" />
                  <span className="hidden sm:inline">Edit Room</span>
                </button>

                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(true)}
                    className="p-1.5 text-rose-600 hover:text-rose-700 hover:bg-rose-50 border border-transparent hover:border-rose-200 rounded-lg transition-colors cursor-pointer"
                    title="Delete laboratory"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </>
            )}
          </div>
        }
      />

      <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-5 max-w-8xl w-full mx-auto">
        {/* 2. Laboratory Overview Banner (Clean without background image) */}
        <div className="relative w-full rounded-2xl bg-neutral-900 text-white border border-neutral-800 p-5 sm:p-6 shadow-xs overflow-hidden">
          {/* Subtle ambient accent glow */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-blue-500/5 rounded-full blur-2xl pointer-events-none" />

          <div className="relative z-10 space-y-4">
            {/* Top Badges */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-xs sm:text-sm font-bold bg-white text-neutral-900 px-2.5 py-1 rounded-md shadow-xs">
                {loc.room}
              </span>
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-neutral-300 bg-neutral-800/90 px-2.5 py-1 rounded-md border border-neutral-700">
                {loc.type?.replace('_', ' ') || 'LAB'}
              </span>
              {inventorySummary.totalBroken > 0 && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] sm:text-xs font-bold bg-amber-500/90 text-white shadow-xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-white" />
                  {inventorySummary.totalBroken} Broken
                </span>
              )}
              {inventorySummary.totalMaintenance > 0 && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] sm:text-xs font-bold bg-blue-500/90 text-white shadow-xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-white" />
                  {inventorySummary.totalMaintenance} In Repair
                </span>
              )}
              {inventorySummary.totalBroken === 0 && inventorySummary.totalMaintenance === 0 && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] sm:text-xs font-bold bg-emerald-500/90 text-white shadow-xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                  All Operational
                </span>
              )}
            </div>

            {/* Content: Lab Name & Details + Quick Stats */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pt-1">
              <div className="min-w-0">
                <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight truncate">
                  {loc.name}
                </h2>
                <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm text-neutral-300 mt-1.5 flex-wrap font-medium">
                  <span className="text-white font-semibold">{loc.building}</span>
                  <span className="text-neutral-500">·</span>
                  <span>Floor {loc.floor ?? 1}</span>
                  <span className="text-neutral-500">·</span>
                  <span>{loc.capacity || 30} Student Workstations</span>
                  {loc.lastAuditedAt && (
                    <>
                      <span className="text-neutral-500 hidden sm:inline">·</span>
                      <span className="text-neutral-400 text-xs hidden sm:inline">
                        Audited: {loc.lastAuditedAt}
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* Quick Fleet Health Badge */}
              <div className="flex items-center gap-2.5 shrink-0 bg-neutral-800/90 border border-neutral-700/80 px-3.5 py-2 rounded-xl text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="text-neutral-400">Condition:</span>
                  <span className={`font-mono font-bold ${
                    inventorySummary.healthRate >= 90
                      ? 'text-emerald-400'
                      : inventorySummary.healthRate >= 75
                      ? 'text-amber-400'
                      : 'text-rose-400'
                  }`}>
                    {inventorySummary.healthRate}% Healthy
                  </span>
                </div>
                <span className="text-neutral-600">|</span>
                <div className="flex items-center gap-2 text-[11px] font-mono">
                  <span className="text-emerald-400 font-bold">{inventorySummary.totalWorking} OK</span>
                  <span className="text-neutral-600">·</span>
                  <span className="text-blue-400 font-bold">{inventorySummary.totalMaintenance} Repair</span>
                  <span className="text-neutral-600">·</span>
                  <span className="text-rose-400 font-bold">{inventorySummary.totalBroken} Defect</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 4. Facility & Condition Table */}
        <div className="bg-white border border-neutral-200 rounded-lg w-full shadow-2xs">
            {/* Filters Toolbar with Category & Condition Dropdowns */}
            <div className="p-4 border-b border-neutral-200 flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 flex-wrap flex-1">
                <div className="relative w-full sm:w-64">
                  <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search chairs, tables, AC, projectors, PCs..."
                    value={filterText}
                    onChange={(e) => setFilterText(e.target.value)}
                    className="w-full bg-white border border-neutral-300 text-neutral-900 text-xs pl-8 pr-3 py-1.5 rounded-lg focus:outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 transition-colors placeholder:text-neutral-400 font-medium shadow-2xs"
                  />
                </div>

                <Dropdown
                  value={selectedCategory}
                  options={categoryOptions}
                  onChange={setSelectedCategory}
                  placeholder="Category"
                  className="w-full sm:w-auto"
                />

                <Dropdown
                  value={selectedCondition}
                  options={conditionOptions}
                  onChange={setSelectedCondition}
                  placeholder="Condition"
                  className="w-full sm:w-auto"
                />
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <div className="text-xs text-neutral-500">
                  Showing <span className="font-semibold text-neutral-900">{filteredRoomInventories.length}</span> items
                </div>
                {isAllowed && (
                  <Link
                    href={`/locations/${loc.id}/items/new`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-neutral-900 hover:bg-neutral-800 rounded-lg transition-colors shadow-2xs cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Allocate from Center Stock</span>
                  </Link>
                )}
              </div>
            </div>

            {/* Clean Responsive Table matching /stock and /assets */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs min-w-[900px]">
                <thead className="bg-neutral-50 border-b border-neutral-200 text-neutral-600 font-semibold">
                  <tr>
                    <th className="py-3 px-3 w-14 text-center">Visual</th>
                    <th className="py-3 px-4 min-w-[220px]">Item & Equipment Name</th>
                    <th className="py-3 px-4 w-36">Category</th>
                    <th className="py-3 px-4 min-w-[180px]">Specification / Model</th>
                    <th className="py-3 px-3 w-16 text-center">Total</th>
                    <th className="py-3 px-3 w-16 text-center">Working</th>
                    <th className="py-3 px-3 w-20 text-center">Repair</th>
                    <th className="py-3 px-3 w-16 text-center">Broken</th>
                    <th className="py-3 px-4 w-12 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {filteredRoomInventories.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-8 text-center text-neutral-500">
                        No facility or equipment records found matching your filter criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredRoomInventories.map((item) => {
                      const total = item.qtyWorking + item.qtyBroken + (item.qtyMaintenance || 0);

                      const linkedStock = stock.find(
                        (s) =>
                          (item.stockItemId && (s.id === item.stockItemId || s.code === item.stockItemId)) ||
                          s.name.toLowerCase() === item.name.toLowerCase() ||
                          item.name.toLowerCase().includes(s.name.toLowerCase()) ||
                          s.name.toLowerCase().includes(item.name.toLowerCase())
                      );
                      const linkedAsset = assets.find(
                        (a) =>
                          (item.assetId && (a.id === item.assetId || a.serialNumber === item.assetId)) ||
                          a.name.toLowerCase() === item.name.toLowerCase() ||
                          item.name.toLowerCase().includes(a.name.toLowerCase()) ||
                          a.name.toLowerCase().includes(item.name.toLowerCase())
                      );
                      const itemThumbnail = getRoomItemImage(item, stock, assets);

                      return (
                        <tr key={item.id} className="hover:bg-neutral-50/70 transition-colors group">
                          {/* Visual Product Thumbnail matching /stock & /assets */}
                          <td className="py-2.5 px-3 text-center">
                            <Link
                              href={`/locations/${loc.id}/items/view?item=${item.id}`}
                              className="w-10 h-10 rounded border border-neutral-200 bg-neutral-100 overflow-hidden flex items-center justify-center shrink-0 shadow-2xs mx-auto hover:opacity-85 transition-opacity block"
                              title="View equipment details"
                            >
                              {itemThumbnail ? (
                                <LabThumbnail
                                  src={itemThumbnail}
                                  alt={item.name}
                                  size="thumb"
                                  fallbackType="item"
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <span className="text-base select-none">
                                  {getCategoryIcon(item.group)}
                                </span>
                              )}
                            </Link>
                          </td>

                          {/* Item & Equipment Name */}
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <Link
                                href={`/locations/${loc.id}/items/view?item=${item.id}`}
                                className="font-semibold text-neutral-900 hover:text-emerald-700 text-left cursor-pointer transition-colors"
                                title="Click to view full equipment details"
                              >
                                {item.name}
                              </Link>
                              <span className="text-[10px] font-mono font-medium uppercase bg-neutral-100 text-neutral-500 px-1.5 py-0.5 rounded border border-neutral-200/70">
                                {item.unit}
                              </span>
                            </div>

                            {item.remarks && (
                              <p className="mt-0.5 text-[11px] text-neutral-400 italic line-clamp-1">
                                {item.remarks}
                              </p>
                            )}
                          </td>

                          {/* Category */}
                          <td className="py-3 px-4">
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-neutral-100 text-neutral-700 border border-neutral-200/60 whitespace-nowrap">
                              {getCategoryLabel(item.group)}
                            </span>
                          </td>

                          {/* Specification */}
                          <td className="py-3 px-4 text-neutral-600 font-medium">
                            {item.brandSpec || 'Standard Specification'}
                          </td>

                          {/* Total Count */}
                          <td className="py-3 px-3 text-center font-mono font-semibold text-neutral-700">
                            {total}
                          </td>

                          {/* Working */}
                          <td className="py-3 px-3 text-center font-mono font-bold text-emerald-700">
                            {item.qtyWorking}
                          </td>

                          {/* Maintenance */}
                          <td className="py-3 px-3 text-center font-mono font-bold">
                            {(item.qtyMaintenance || 0) > 0 ? (
                              <span className="inline-flex items-center justify-center px-1.5 py-0.5 rounded text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                                {item.qtyMaintenance}
                              </span>
                            ) : (
                              <span className="text-neutral-300 font-normal">—</span>
                            )}
                          </td>

                          {/* Broken */}
                          <td className="py-3 px-3 text-center font-mono font-bold">
                            {item.qtyBroken > 0 ? (
                              <span className="inline-flex items-center justify-center px-1.5 py-0.5 rounded text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                                {item.qtyBroken}
                              </span>
                            ) : (
                              <span className="text-neutral-300 font-normal">—</span>
                            )}
                          </td>

                          {/* Actions (Three-Dots Menu: View Details & Edit dedicated webpages) */}
                          <td className="py-3 px-4 text-right">
                            <RowActionMenu
                              onViewDetails={() => router.push(`/locations/${loc.id}/items/view?item=${item.id}`)}
                              onEdit={isAllowed ? () => router.push(`/locations/${loc.id}/items/edit?item=${item.id}`) : undefined}
                              onDelete={isAdmin ? () => deleteRoomInventoryItem(loc.id, item.id) : undefined}
                            />
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
        </div>
      </div>

      {/* 9. Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-neutral-200 rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 border border-rose-100">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-neutral-900">
                  Delete Laboratory Record?
                </h3>
                <p className="text-xs text-neutral-500 mt-1">
                  This will remove <span className="font-semibold text-neutral-800">{loc.name}</span> ({loc.room}) from active faculty operations.
                </p>
              </div>
            </div>

            <div className="text-xs text-neutral-600 bg-neutral-50 p-3.5 rounded-xl border border-neutral-200/80 leading-relaxed">
              <strong>Notice:</strong> Hardware assets and consumable inventory registered to this room will remain preserved in the database, but may need to be reallocated.
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="px-3.5 py-2 text-xs font-semibold border border-neutral-200 rounded-lg text-neutral-700 hover:bg-neutral-50 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="px-4 py-2 text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white rounded-lg transition-colors shadow-2xs cursor-pointer"
              >
                Delete Laboratory
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
