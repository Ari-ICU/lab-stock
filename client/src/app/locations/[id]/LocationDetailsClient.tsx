'use client';

import { useState, useMemo } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
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
  Boxes,
  Microscope,
} from 'lucide-react';
import {  AssetGroup } from '@/types';
import { getRoomItemImage } from './items/shared';
import { LoadingScreen } from '@/components/LoadingScreen';

const ASSET_STATUS_META: Record<
  'operational' | 'in_use' | 'maintenance',
  { label: string; dotClass: string; badgeClass: string }
> = {
  operational: {
    label: 'Operational',
    dotClass: 'bg-emerald-500',
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
  },
  in_use: {
    label: 'In Use',
    dotClass: 'bg-blue-500',
    badgeClass: 'bg-blue-50 text-blue-700 border-blue-200/80',
  },
  maintenance: {
    label: 'In Repair',
    dotClass: 'bg-amber-500',
    badgeClass: 'bg-amber-50 text-amber-700 border-amber-200/80',
  },
};

const ASSET_STATUS_FILTER_OPTIONS: DropdownOption[] = [
  { value: 'all', label: 'All Statuses' },
  { value: 'operational', label: 'Operational' },
  { value: 'in_use', label: 'In Use' },
  { value: 'maintenance', label: 'In Repair' },
  { value: 'on_loan', label: 'On Loan' },
];

export default function LocationDetailsClient({ id: propId }: { id?: string }) {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = propId || (params?.id as string);
  const activeTab: 'inventory' | 'hardware' =
    searchParams.get('tab') === 'hardware' ? 'hardware' : 'inventory';

  const handleTabChange = (tab: 'inventory' | 'hardware') => {
    const nextParams = new URLSearchParams(searchParams.toString());
    nextParams.set('tab', tab === 'hardware' ? 'hardware' : 'stock');
    router.replace(`/locations/${id}?${nextParams.toString()}`, { scroll: false });
  };

  const {
    locations,
    assets,
    stock,
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
  const [selectedAssetStatus, setSelectedAssetStatus] = useState<string>('all');
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
        (l as { serverId?: string }).serverId === id ||
        (l as { code?: string }).code === id ||
        l.room.toLowerCase().replace(/[^a-z0-9]/g, '') === (id || '').toLowerCase().replace(/[^a-z0-9]/g, '')
    ) ||
    (locations.length > 0 ? locations[0] : undefined);
  const isAdmin = user?.roleBadge === 'Admin' || user?.role === 'Primary Lab Administrator';
  const isAllowed = isAdmin || (loc ? canManageLocation(loc.room) || canManageLocation(loc.name) : false);

  // Match hardware assets belonging to this lab location using word-boundary room matching
  const { matchingAssets, matchedHardwareUnits } = useMemo(() => {
    if (!loc) {
      return {
        matchingAssets: [],
        matchedHardwareUnits: 0,
      };
    }

    const roomKey = loc.room.replace(/^(rm|room)\s*/i, '').trim().toLowerCase();
    const escapedRoomKey = roomKey.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const roomRegex = escapedRoomKey ? new RegExp(`\\b${escapedRoomKey}\\b`, 'i') : null;
    const roomLower = loc.room.trim().toLowerCase();
    const escapedRoomLower = roomLower.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const fullRoomRegex = escapedRoomLower ? new RegExp(`\\b${escapedRoomLower}\\b`, 'i') : null;
    const nameLower = loc.name.trim().toLowerCase();

    const mAssets = assets.filter((a) => {
      const l = a.location.trim().toLowerCase();
      return (
        (roomRegex ? roomRegex.test(l) : false) ||
        (fullRoomRegex ? fullRoomRegex.test(l) : false) ||
        (nameLower ? l.includes(nameLower) : false)
      );
    });

    const hUnits = mAssets.reduce((sum, a) => sum + (a.totalUnits ?? 1), 0);

    return {
      matchingAssets: mAssets,
      matchedHardwareUnits: hUnits,
    };
  }, [loc, assets]);

  const filteredHardwareAssets = useMemo(() => {
    const q = filterText.trim().toLowerCase();
    return matchingAssets.filter((asset) => {
      const matchesQuery =
        !q ||
        asset.name.toLowerCase().includes(q) ||
        asset.serialNumber.toLowerCase().includes(q) ||
        asset.model.toLowerCase().includes(q) ||
        (asset.currentBorrower && asset.currentBorrower.toLowerCase().includes(q)) ||
        (asset.description && asset.description.toLowerCase().includes(q));

      if (!matchesQuery) return false;
      if (selectedAssetStatus === 'all') return true;
      if (selectedAssetStatus === 'on_loan') return asset.loanStatus === 'on_loan';
      return asset.status === selectedAssetStatus;
    });
  }, [matchingAssets, filterText, selectedAssetStatus]);

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

  if (!loc && isLoading) {
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
    const ok = exportToCsv(filename, [...facilityRows, ...hardwareRows], {
      sheetTitle: loc.room || 'Room Audit',
      reportTitle: 'Laboratory Room Condition & Equipment Audit',
      reportSubtitle: `${loc.name} (${loc.building} • ${loc.room} • Capacity: ${loc.capacity || 0} seats)`,
    });
    if (ok) {
      showToast(`Exported room condition inventory for ${loc.name} to Excel (.xlsx)`);
    }
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
              title="Download room condition report as Excel (.xlsx)"
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

      <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-5 w-full">
        {/* 2. Laboratory Overview Card */}
        <div className="bg-white border border-neutral-200/80 rounded-2xl p-4 sm:p-5 shadow-2xs space-y-4">
          {/* Top Badges */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono text-xs font-bold bg-neutral-900 text-white px-2.5 py-0.5 rounded-md">
              {loc.room}
            </span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-600 bg-neutral-100 px-2 py-0.5 rounded-md border border-neutral-200">
              {loc.type?.replace('_', ' ') || 'LAB'}
            </span>
          </div>

          {/* Content: Lab Name & Details + Quick Stats */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pt-0.5">
            <div className="min-w-0">
              <h2 className="text-lg sm:text-xl font-bold tracking-tight text-neutral-900 truncate">
                {loc.name}
              </h2>
              <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm text-neutral-600 mt-1.5 flex-wrap font-medium">
                <span className="text-neutral-900 font-semibold">{loc.building}</span>
                <span className="text-neutral-300">·</span>
                <span>Floor {loc.floor ?? 1}</span>
                {loc.type !== 'STORAGE' && (
                  <>
                    <span className="text-neutral-300">·</span>
                    <span>{loc.capacity || 30} Student Workstations</span>
                  </>
                )}
                {loc.lastAuditedAt && (
                  <>
                    <span className="text-neutral-300 hidden sm:inline">·</span>
                    <span className="text-neutral-500 text-xs hidden sm:inline">
                      Audited:{' '}
                      {Number.isNaN(new Date(loc.lastAuditedAt).getTime())
                        ? loc.lastAuditedAt
                        : new Date(loc.lastAuditedAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Quick Fleet Health Badge */}
            <div className="flex items-center gap-2.5 shrink-0 bg-neutral-50 border border-neutral-200 px-3.5 py-2 rounded-lg text-xs">
              <div className="flex items-center gap-1.5">
                <span className="text-neutral-500">Condition:</span>
                <span className={`font-mono font-bold ${
                  inventorySummary.healthRate >= 90
                    ? 'text-emerald-700'
                    : inventorySummary.healthRate >= 75
                    ? 'text-amber-700'
                    : 'text-rose-700'
                }`}>
                  {inventorySummary.healthRate}% Healthy
                </span>
              </div>
              <span className="text-neutral-300">|</span>
              <div className="flex items-center gap-2 text-[11px] font-mono">
                <span className="text-emerald-700 font-semibold">{inventorySummary.totalWorking} OK</span>
                {inventorySummary.totalMaintenance > 0 && (
                  <>
                    <span className="text-neutral-300">·</span>
                    <span className="text-blue-700 font-semibold">{inventorySummary.totalMaintenance} Repair</span>
                  </>
                )}
                {inventorySummary.totalBroken > 0 && (
                  <>
                    <span className="text-neutral-300">·</span>
                    <span className="text-rose-700 font-semibold">{inventorySummary.totalBroken} Defect</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 4. Room Inventory & Hardware Devices Tabs */}
        <div className="bg-white border border-neutral-200/80 rounded-2xl w-full shadow-2xs">
            {/* Tab Switcher Header */}
            <div className="px-4 pt-3 border-b border-neutral-200 flex flex-wrap items-center justify-between gap-3 bg-neutral-50/60 rounded-t-2xl">
              <div className="flex items-center gap-1.5 overflow-x-auto">
                <button
                  type="button"
                  onClick={() => handleTabChange('inventory')}
                  className={`inline-flex items-center gap-2 px-3.5 py-2.5 text-xs font-semibold border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
                    activeTab === 'inventory'
                      ? 'border-neutral-900 text-neutral-900'
                      : 'border-transparent text-neutral-500 hover:text-neutral-800'
                  }`}
                >
                  <Boxes className={`w-3.5 h-3.5 ${activeTab === 'inventory' ? 'text-emerald-600' : 'text-neutral-400'}`} />
                  <span>Room Inventory</span>
                  <span
                    className={`px-1.5 py-0.5 rounded-full text-[11px] font-semibold tabular-nums ${
                      activeTab === 'inventory'
                        ? 'bg-neutral-900 text-white'
                        : 'bg-neutral-200/80 text-neutral-600'
                    }`}
                  >
                    {loc.inventories?.length ?? 0}
                  </span>
                  <span className="hidden sm:inline text-[11px] font-normal text-neutral-400">
                    · {inventorySummary.totalUnits} {inventorySummary.totalUnits === 1 ? 'unit' : 'units'}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => handleTabChange('hardware')}
                  className={`inline-flex items-center gap-2 px-3.5 py-2.5 text-xs font-semibold border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
                    activeTab === 'hardware'
                      ? 'border-neutral-900 text-neutral-900'
                      : 'border-transparent text-neutral-500 hover:text-neutral-800'
                  }`}
                >
                  <Microscope className={`w-3.5 h-3.5 ${activeTab === 'hardware' ? 'text-blue-600' : 'text-neutral-400'}`} />
                  <span>Hardware Devices</span>
                  <span
                    className={`px-1.5 py-0.5 rounded-full text-[11px] font-semibold tabular-nums ${
                      activeTab === 'hardware'
                        ? 'bg-neutral-900 text-white'
                        : 'bg-neutral-200/80 text-neutral-600'
                    }`}
                  >
                    {matchingAssets.length}
                  </span>
                  <span className="hidden sm:inline text-[11px] font-normal text-neutral-400">
                    · {matchedHardwareUnits} {matchedHardwareUnits === 1 ? 'unit' : 'units'}
                  </span>
                </button>
              </div>

              <p className="hidden lg:block text-[11px] text-neutral-400 pb-2">
                {activeTab === 'inventory'
                  ? 'Room-level fixtures, workstations, AC & supplies audited per room'
                  : 'Individually serialized lab equipment tracked under Hardware Assets'}
              </p>
            </div>

            {/* Filters Toolbar with Tab-Specific Filters */}
            <div className="p-4 border-b border-neutral-200 flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 flex-wrap flex-1">
                <div className="relative w-full sm:w-72">
                  <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder={
                      activeTab === 'inventory'
                        ? 'Search equipment, specs, or remarks...'
                        : 'Search hardware name, serial, model, or borrower...'
                    }
                    value={filterText}
                    onChange={(e) => setFilterText(e.target.value)}
                    className="w-full bg-white border border-neutral-300 text-neutral-900 text-xs pl-8 pr-7 py-1.5 rounded-xl focus:outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 transition-colors placeholder:text-neutral-400 font-medium shadow-2xs"
                  />
                  {filterText && (
                    <button
                      type="button"
                      onClick={() => setFilterText('')}
                      aria-label="Clear search"
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {activeTab === 'inventory' ? (
                  <>
                    <Dropdown
                      value={selectedCategory}
                      options={categoryOptions}
                      onChange={setSelectedCategory}
                      placeholder="Category"
                      className="w-full sm:w-auto"
                      buttonClassName="rounded-xl py-1.5"
                    />

                    <Dropdown
                      value={selectedCondition}
                      options={conditionOptions}
                      onChange={setSelectedCondition}
                      placeholder="Condition"
                      className="w-full sm:w-auto"
                      buttonClassName="rounded-xl py-1.5"
                    />
                  </>
                ) : (
                  <Dropdown
                    value={selectedAssetStatus}
                    options={ASSET_STATUS_FILTER_OPTIONS}
                    onChange={setSelectedAssetStatus}
                    placeholder="Status"
                    className="w-full sm:w-auto"
                    buttonClassName="rounded-xl py-1.5"
                  />
                )}
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <div className="text-xs text-neutral-500">
                  Showing{' '}
                  <span className="font-semibold text-neutral-900">
                    {activeTab === 'inventory' ? filteredRoomInventories.length : filteredHardwareAssets.length}
                  </span>{' '}
                  {activeTab === 'inventory'
                    ? 'items'
                    : filteredHardwareAssets.length === 1
                    ? 'device'
                    : 'devices'}
                </div>
                {isAllowed && (
                  <Link
                    href={activeTab === 'inventory' ? `/locations/${loc.id}/items/new` : '/assets/create'}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-neutral-900 hover:bg-neutral-800 rounded-xl transition-colors shadow-2xs cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5 text-emerald-400" />
                    <span>
                      {activeTab === 'inventory' ? 'Allocate from Central Stock' : 'Register Hardware Asset'}
                    </span>
                  </Link>
                )}
              </div>
            </div>

            {activeTab === 'inventory' ? (
            <div className="overflow-x-auto rounded-b-2xl">
              <table className="w-full text-left text-xs min-w-[900px]">
                <thead className="bg-neutral-50 border-b border-neutral-200 text-neutral-600 font-semibold">
                  <tr>
                    <th className="py-3 px-3 w-14 text-center whitespace-nowrap">Visual</th>
                    <th className="py-3 px-4 min-w-[220px]">Item & Equipment Name</th>
                    <th className="py-3 px-4 w-36 whitespace-nowrap">Category</th>
                    <th className="py-3 px-4 min-w-[180px]">Specification / Model</th>
                    <th className="py-3 px-3 w-16 text-center whitespace-nowrap">Total</th>
                    <th className="py-3 px-3 w-16 text-center whitespace-nowrap">Working</th>
                    <th className="py-3 px-3 w-20 text-center whitespace-nowrap">Repair</th>
                    <th className="py-3 px-3 w-16 text-center whitespace-nowrap">Broken</th>
                    <th className="py-3 px-4 w-12 text-right whitespace-nowrap">Actions</th>
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
                              className="w-10 h-10 rounded-lg border border-neutral-200 bg-neutral-100 overflow-hidden flex items-center justify-center shrink-0 shadow-2xs mx-auto hover:opacity-85 transition-opacity block"
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
            ) : (
            <div className="overflow-x-auto rounded-b-2xl">
              {matchingAssets.length === 0 ? (
                <div className="px-6 py-14 text-center">
                  <div className="w-11 h-11 rounded-2xl bg-neutral-100 border border-neutral-200/80 flex items-center justify-center mx-auto mb-3">
                    <Microscope className="w-5 h-5 text-neutral-400" />
                  </div>
                  <h3 className="text-sm font-semibold text-neutral-900">
                    No serialized hardware devices assigned to {loc.room}
                  </h3>
                  <p className="text-xs text-neutral-500 max-w-md mx-auto mt-1 leading-relaxed">
                    Serialized hardware devices (such as firewalls, switches, routers, projectors, and lab workstations tracked individually) appear here when their location includes {loc.room}.
                  </p>
                  <div className="mt-4 flex flex-wrap items-center justify-center gap-2.5">
                    <button
                      type="button"
                      onClick={() => handleTabChange('inventory')}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-neutral-700 bg-white border border-neutral-300 hover:bg-neutral-50 rounded-xl transition-colors cursor-pointer"
                    >
                      <Boxes className="w-3.5 h-3.5 text-emerald-600" />
                      <span>View Room Inventory ({loc.inventories?.length ?? 0})</span>
                    </button>
                    {isAllowed && (
                      <Link
                        href="/assets/create"
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-neutral-900 hover:bg-neutral-800 rounded-xl transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Register Hardware Asset</span>
                      </Link>
                    )}
                  </div>
                </div>
              ) : filteredHardwareAssets.length === 0 ? (
                <div className="px-6 py-12 text-center">
                  <p className="text-sm font-semibold text-neutral-800">
                    No hardware devices match your search or status filter
                  </p>
                  <p className="text-xs text-neutral-500 mt-1">
                    Showing 0 of {matchingAssets.length}{' '}
                    {matchingAssets.length === 1 ? 'device' : 'devices'} in {loc.room}.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setFilterText('');
                      setSelectedAssetStatus('all');
                    }}
                    className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded-lg transition-colors cursor-pointer"
                  >
                    Reset Filters
                  </button>
                </div>
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-neutral-50/70 border-b border-neutral-200 text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
                      <th className="py-3 pl-4 pr-3 w-16">Visual</th>
                      <th className="py-3 px-3">Equipment Name</th>
                      <th className="py-3 px-3 text-center">Units</th>
                      <th className="py-3 px-3">Serial / Tag</th>
                      <th className="py-3 px-3">Model &amp; Specs</th>
                      <th className="py-3 px-3">Status</th>
                      <th className="py-3 pl-3 pr-4 text-right w-16">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100 text-xs">
                    {filteredHardwareAssets.map((asset) => {
                      const statusMeta = ASSET_STATUS_META[asset.status] || ASSET_STATUS_META.operational;
                      const unitCount = asset.totalUnits ?? 1;
                      const unitLabel = asset.unitType || (unitCount === 1 ? 'Unit' : 'Units');
                      return (
                        <tr key={asset.id} className="hover:bg-neutral-50/70 transition-colors">
                          <td className="py-3 pl-4 pr-3">
                            <Link
                              href={`/assets/${asset.id}`}
                              className="block w-10 h-10 rounded-lg border border-neutral-200 overflow-hidden bg-neutral-50 shrink-0"
                            >
                              <LabThumbnail src={asset.imageUrl} alt={asset.name} size="thumb" />
                            </Link>
                          </td>
                          <td className="py-3 px-3 max-w-xs">
                            <Link
                              href={`/assets/${asset.id}`}
                              className="text-xs font-semibold text-neutral-900 hover:text-emerald-700 hover:underline transition-colors block"
                            >
                              {asset.name}
                            </Link>
                            {asset.description && (
                              <p className="text-[11px] text-neutral-500 italic line-clamp-1 mt-0.5">
                                {asset.description}
                              </p>
                            )}
                          </td>
                          <td className="py-3 px-3 text-center">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-neutral-100 text-neutral-700 text-xs font-medium whitespace-nowrap tabular-nums">
                              {unitCount} {unitLabel}
                            </span>
                          </td>
                          <td className="py-3 px-3">
                            <span className="font-mono text-xs bg-neutral-50 border border-neutral-200/80 px-2 py-0.5 rounded-md text-neutral-700 whitespace-nowrap">
                              {asset.serialNumber || '—'}
                            </span>
                          </td>
                          <td className="py-3 px-3">
                            <div className="text-xs font-medium text-neutral-800">{asset.model || '—'}</div>
                            {asset.nextCalibration && (
                              <div className="text-[11px] text-neutral-400 mt-0.5">
                                Next check: {asset.nextCalibration}
                              </div>
                            )}
                          </td>
                          <td className="py-3 px-3">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span
                                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border whitespace-nowrap ${statusMeta.badgeClass}`}
                              >
                                <span className={`w-1.5 h-1.5 rounded-full ${statusMeta.dotClass}`} />
                                <span>{statusMeta.label}</span>
                              </span>
                              {asset.loanStatus === 'on_loan' && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-violet-50 text-violet-700 border border-violet-200/80 whitespace-nowrap">
                                  On Loan
                                </span>
                              )}
                            </div>
                            {asset.loanStatus === 'on_loan' && asset.currentBorrower && (
                              <div className="text-[11px] text-neutral-500 mt-1">
                                To: <span className="font-medium text-neutral-700">{asset.currentBorrower}</span>
                              </div>
                            )}
                          </td>
                          <td className="py-3 pl-3 pr-4 text-right">
                            <RowActionMenu
                              onViewDetails={() => router.push(`/assets/${asset.id}`)}
                              onEdit={isAllowed ? () => router.push(`/assets/${asset.id}/edit`) : undefined}
                              onDelete={isAllowed ? () => deleteAsset(asset.id) : undefined}
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
            )}
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
                className="px-3.5 py-2 text-xs font-semibold border border-neutral-200 rounded-xl text-neutral-700 hover:bg-neutral-50 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="px-4 py-2 text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white rounded-xl transition-colors shadow-2xs cursor-pointer"
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
