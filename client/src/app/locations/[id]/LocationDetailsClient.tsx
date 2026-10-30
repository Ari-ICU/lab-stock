'use client';

import { useState, useMemo, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Header } from '@/components/Header';
import { usePersistentTab } from '@/hooks/usePersistentTab';
import { useStock } from '@/context/StockContext';
import { useAuth } from '@/context/AuthContext';
import { exportToCsv } from '@/lib/exportCsv';
import { LabThumbnail } from '@/components/LabThumbnail';
import {
  Building,
  ArrowLeft,
  Boxes,
  Microscope,
  Search,
  Plus,
  Laptop,
  CheckCircle2,
  Clock,
  Wrench,
  AlertTriangle,
  ExternalLink,
  Edit3,
  Trash2,
  MapPin,
  Layers,
  Shield,
  FileSpreadsheet,
  Copy,
  Check,
  ChevronRight,
  X,
  QrCode,
  Printer,
  Calendar,
  Users,
  CheckCircle,
  Minus,
  Sparkles,
} from 'lucide-react';
import { RoomInventoryItem, AssetGroup } from '@/types';

export default function LocationDetailsClient({ id: propId }: { id?: string }) {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
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
    markRoomAudited,
    addRoomInventoryItem,
    deleteRoomInventoryItem,
    showToast,
  } = useStock();
  const { user, canManageLocation } = useAuth();

  type LocationTab = 'matrix' | 'audit' | 'hardware' | 'stock';
  const LOCATION_TABS: readonly LocationTab[] = ['matrix', 'audit', 'hardware', 'stock'] as const;

  const initialTab = searchParams.get('tab') === 'audit' ? 'audit' : 'matrix';
  const [activeTab, handleTabChange] = usePersistentTab<LocationTab>(
    'csd_location_details_tab',
    LOCATION_TABS,
    initialTab
  );

  const [filterText, setFilterText] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showDoorQrModal, setShowDoorQrModal] = useState(false);
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // New Item Form State
  const [newItemName, setNewItemName] = useState('');
  const [newItemGroup, setNewItemGroup] = useState<AssetGroup>('FURNITURE');
  const [newItemBrandSpec, setNewItemBrandSpec] = useState('');
  const [newItemUnit, setNewItemUnit] = useState('pcs');
  const [newItemQtyWorking, setNewItemQtyWorking] = useState(1);
  const [newItemQtyBroken, setNewItemQtyBroken] = useState(0);
  const [newItemRemarks, setNewItemRemarks] = useState('');

  const loc = locations.find((l) => l.id === id);
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

  // Inventory Groups Breakdown
  const roomInventories = useMemo(() => {
    if (!loc || !loc.inventories) return [];
    if (!filterText.trim()) return loc.inventories;
    const q = filterText.toLowerCase();
    return loc.inventories.filter(
      (item) =>
        item.name.toLowerCase().includes(q) ||
        item.brandSpec?.toLowerCase().includes(q) ||
        item.group.toLowerCase().includes(q) ||
        item.remarks?.toLowerCase().includes(q)
    );
  }, [loc, filterText]);

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

  // Filtered lists based on search query
  const filteredAssets = useMemo(() => {
    if (!filterText.trim()) return matchingAssets;
    const q = filterText.toLowerCase();
    return matchingAssets.filter(
      (a) =>
        a.name.toLowerCase().includes(q) ||
        a.model.toLowerCase().includes(q) ||
        a.serialNumber.toLowerCase().includes(q) ||
        a.status.toLowerCase().includes(q)
    );
  }, [matchingAssets, filterText]);

  const filteredStock = useMemo(() => {
    if (!filterText.trim()) return matchingStock;
    const q = filterText.toLowerCase();
    return matchingStock.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.code.toLowerCase().includes(q) ||
        s.category.toLowerCase().includes(q) ||
        s.status.toLowerCase().includes(q)
    );
  }, [matchingStock, filterText]);

  const copyToClipboard = (text: string, label: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    showToast(`Copied ${label} to clipboard`);
    setTimeout(() => setCopiedKey(null), 2000);
  };

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

  const handleMarkAudited = () => {
    const auditorName = user?.name || 'Faculty Lecturer';
    markRoomAudited(loc.id, auditorName);
  };

  const handleCreateFacilityItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim()) {
      showToast('Please enter an item name', 'warning');
      return;
    }

    addRoomInventoryItem(loc.id, {
      name: newItemName.trim(),
      group: newItemGroup,
      brandSpec: newItemBrandSpec.trim() || undefined,
      unit: newItemUnit.trim() || 'pcs',
      qtyWorking: Number(newItemQtyWorking) || 0,
      qtyBroken: Number(newItemQtyBroken) || 0,
      qtyMaintenance: 0,
      remarks: newItemRemarks.trim() || undefined,
    });

    setNewItemName('');
    setNewItemBrandSpec('');
    setNewItemUnit('pcs');
    setNewItemQtyWorking(1);
    setNewItemQtyBroken(0);
    setNewItemRemarks('');
    setShowAddItemModal(false);
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

  // Group items by standard categories
  const furnitureItems = roomInventories.filter((i) => i.group === 'FURNITURE');
  const electricalItems = roomInventories.filter((i) => i.group === 'ELECTRICAL');
  const itItems = roomInventories.filter((i) => i.group === 'IT_HARDWARE');
  const safetyItems = roomInventories.filter((i) => i.group === 'SAFETY_MISC');

  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(
    typeof window !== 'undefined' ? window.location.href : `https://labstock.edu/locations/${loc.id}`
  )}`;

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
              onClick={handleMarkAudited}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors shadow-2xs cursor-pointer"
              title="Stamp room with today's audit date"
            >
              <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
              <span>Mark Audited Today</span>
            </button>

            <button
              type="button"
              onClick={() => setShowDoorQrModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-neutral-700 bg-white border border-neutral-200 hover:border-neutral-300 rounded-lg hover:bg-neutral-50 transition-colors shadow-2xs cursor-pointer"
              title="Generate printable QR placard for room door"
            >
              <QrCode className="w-3.5 h-3.5 text-neutral-600" />
              <span className="hidden sm:inline">Door QR</span>
            </button>

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

                <div className="h-4 w-px bg-neutral-200 mx-1 hidden sm:block" />

                <button
                  type="button"
                  onClick={() => setShowAddItemModal(true)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-neutral-900 hover:bg-neutral-800 rounded-lg transition-colors shadow-xs cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Room Item</span>
                </button>
              </>
            )}
          </div>
        }
      />

      <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6 max-w-8xl w-full mx-auto">
        {/* 2. Hero Telemetry & Location Matrix Overview */}
        <div className="bg-white border border-neutral-200/90 rounded-2xl p-5 sm:p-6 shadow-xs space-y-5">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200/70 overflow-hidden flex items-center justify-center shrink-0 shadow-2xs relative group">
                <LabThumbnail
                  src={loc.imageUrl}
                  alt={loc.name}
                  size="card"
                  fallbackType="building"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  iconClassName="w-7 h-7 text-emerald-700"
                />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-xs font-bold bg-neutral-900 text-white px-2 py-0.5 rounded">
                    {loc.room}
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-600 bg-neutral-100 border border-neutral-200 px-2 py-0.5 rounded">
                    {loc.type?.replace('_', ' ') || 'LAB'}
                  </span>
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                    inventorySummary.totalBroken > 0
                      ? 'bg-amber-50 text-amber-800 border border-amber-200'
                      : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${inventorySummary.totalBroken > 0 ? 'bg-amber-500' : 'bg-emerald-500 animate-pulse'}`} />
                    {inventorySummary.totalBroken > 0 ? `${inventorySummary.totalBroken} Defective Items` : '100% Operational'}
                  </span>
                </div>

                <h1 className="text-xl sm:text-2xl font-bold text-neutral-900 tracking-tight">
                  {loc.name}
                </h1>

                <div className="flex items-center gap-3 text-xs text-neutral-500 flex-wrap pt-0.5">
                  <span className="inline-flex items-center gap-1 text-neutral-700 font-medium">
                    <MapPin className="w-3.5 h-3.5 text-neutral-400" />
                    {loc.building} • Floor {loc.floor ?? 1}
                  </span>
                  <span className="text-neutral-300">•</span>
                  <span className="inline-flex items-center gap-1 text-neutral-700 font-medium">
                    <Users className="w-3.5 h-3.5 text-neutral-400" />
                    Student Capacity: <span className="font-bold text-neutral-900">{loc.capacity || 30} seats</span>
                  </span>
                  <span className="text-neutral-300">•</span>
                  <span className="inline-flex items-center gap-1 text-neutral-600">
                    <Calendar className="w-3.5 h-3.5 text-neutral-400" />
                    Last Audited: <span className="font-semibold text-neutral-800">{loc.lastAuditedAt || 'Pending Audit'}</span>
                    {loc.auditedBy && <span className="text-neutral-400">by {loc.auditedBy}</span>}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Action Button Box */}
            <div className="flex items-center gap-2 self-start lg:self-center shrink-0">
              <button
                type="button"
                onClick={() => handleTabChange('audit')}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors shadow-2xs cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                <span>Quick Room Audit Mode</span>
              </button>
              <button
                type="button"
                onClick={() => setShowAddItemModal(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-neutral-900 hover:bg-neutral-800 rounded-lg transition-colors shadow-2xs cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 text-emerald-400" />
                <span>Add Item</span>
              </button>
            </div>
          </div>

          {/* 4 Condition KPI Metric Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 pt-3 border-t border-neutral-100">
            <div className="bg-neutral-50/70 border border-neutral-200/70 rounded-xl p-3.5">
              <div className="flex items-center justify-between text-neutral-500 mb-1">
                <span className="text-[11px] font-medium">Usable Operational Units</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-xl font-bold text-neutral-900 font-mono">
                {inventorySummary.totalWorking} <span className="text-xs font-sans font-normal text-neutral-500">units OK</span>
              </div>
              <p className="text-[10px] text-emerald-700 font-semibold mt-0.5">
                {inventorySummary.healthRate}% Operational Usability
              </p>
            </div>

            <div className="bg-neutral-50/70 border border-neutral-200/70 rounded-xl p-3.5">
              <div className="flex items-center justify-between text-neutral-500 mb-1">
                <span className="text-[11px] font-medium">Broken / Need Repair</span>
                <Wrench className="w-4 h-4 text-rose-600" />
              </div>
              <div className="text-xl font-bold text-rose-700 font-mono">
                {inventorySummary.totalBroken} <span className="text-xs font-sans font-normal text-neutral-500">defective</span>
              </div>
              <p className="text-[10px] text-neutral-400 mt-0.5">
                {inventorySummary.totalBroken > 0 ? 'Reported on repair roster' : 'Zero broken equipment'}
              </p>
            </div>

            <div className="bg-neutral-50/70 border border-neutral-200/70 rounded-xl p-3.5">
              <div className="flex items-center justify-between text-neutral-500 mb-1">
                <span className="text-[11px] font-medium">Serialized Assets</span>
                <Microscope className="w-4 h-4 text-blue-600" />
              </div>
              <div className="text-xl font-bold text-neutral-900 font-mono">
                {totalHardwareUnits} <span className="text-xs font-sans font-normal text-neutral-500">devices</span>
              </div>
              <p className="text-[10px] text-neutral-400 mt-0.5">{matchingAssets.length} model classes</p>
            </div>

            <div className="bg-neutral-50/70 border border-neutral-200/70 rounded-xl p-3.5">
              <div className="flex items-center justify-between text-neutral-500 mb-1">
                <span className="text-[11px] font-medium">Student Seating</span>
                <Users className="w-4 h-4 text-neutral-500" />
              </div>
              <div className="text-xl font-bold text-neutral-900 font-mono">
                {loc.capacity || 30} <span className="text-xs font-sans font-normal text-neutral-500">stations</span>
              </div>
              <p className="text-[10px] text-neutral-400 mt-0.5">Assigned student capacity</p>
            </div>
          </div>
        </div>

        {/* 3. Search & Tabs Bar */}
        <div className="bg-white border border-neutral-200/90 rounded-xl p-3.5 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search chairs, tables, AC, projectors, PCs..."
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              className="w-full bg-neutral-50/70 border border-neutral-200 text-neutral-900 text-xs pl-9 pr-8 py-2 rounded-lg focus:outline-none focus:border-neutral-900 focus:bg-white focus:ring-1 focus:ring-neutral-900 font-medium transition-all placeholder:text-neutral-400"
            />
            {filterText && (
              <button
                type="button"
                onClick={() => setFilterText('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700 p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Segmented Control Tabs */}
          <div className="flex items-center gap-1 bg-neutral-100 p-1 rounded-lg border border-neutral-200/80 text-xs font-semibold shrink-0">
            <button
              type="button"
              onClick={() => handleTabChange('matrix')}
              className={`px-3 py-1.5 rounded-md cursor-pointer transition-all ${
                activeTab === 'matrix'
                  ? 'bg-white text-neutral-900 shadow-2xs font-bold'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              Facility & Condition ({roomInventories.length})
            </button>
            <button
              type="button"
              onClick={() => handleTabChange('audit')}
              className={`px-3 py-1.5 rounded-md cursor-pointer transition-all flex items-center gap-1.5 ${
                activeTab === 'audit'
                  ? 'bg-white text-emerald-800 shadow-2xs font-bold'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>Quick Audit Mode</span>
            </button>
            <button
              type="button"
              onClick={() => handleTabChange('hardware')}
              className={`px-3 py-1.5 rounded-md cursor-pointer transition-all flex items-center gap-1.5 ${
                activeTab === 'hardware'
                  ? 'bg-white text-neutral-900 shadow-2xs font-bold'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              <Microscope className="w-3.5 h-3.5 text-blue-600" />
              <span>Hardware ({matchingAssets.length})</span>
            </button>
            <button
              type="button"
              onClick={() => handleTabChange('stock')}
              className={`px-3 py-1.5 rounded-md cursor-pointer transition-all flex items-center gap-1.5 ${
                activeTab === 'stock'
                  ? 'bg-white text-neutral-900 shadow-2xs font-bold'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              <Boxes className="w-3.5 h-3.5 text-emerald-600" />
              <span>Consumables ({matchingStock.length})</span>
            </button>
          </div>
        </div>

        {/* 4. Tab Content: Facility & Condition Matrix */}
        {activeTab === 'matrix' && (
          <div className="space-y-6">
            {/* Helper Banner */}
            <div className="bg-emerald-50/60 border border-emerald-200/80 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
              <div className="space-y-0.5">
                <span className="font-bold text-emerald-950">
                  Location-Centric Inventory & Condition Roster
                </span>
                <p className="text-emerald-800">
                  Every table, chair, air conditioner, and desktop is tracked specifically to <strong className="text-neutral-900">{loc.room}</strong> with working vs broken count breakdowns.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowAddItemModal(true)}
                className="shrink-0 inline-flex items-center gap-1 text-xs font-bold bg-white text-emerald-900 border border-emerald-300 hover:bg-emerald-50 px-3 py-1.5 rounded-lg shadow-2xs transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Item to Room</span>
              </button>
            </div>

            {/* Inventory Category Sections */}
            {[
              { title: 'Furniture & Fixtures', items: furnitureItems, icon: '🪑', desc: 'Student chairs, teacher desks, computer benches & whiteboards' },
              { title: 'Electrical & HVAC', items: electricalItems, icon: '⚡', desc: 'Air conditioners, wall fans, tube lights & power strips' },
              { title: 'Lab & IT Hardware Equipment', items: itItems, icon: '🖥️', desc: 'Desktop PCs, monitors, projectors, screens & network switches' },
              { title: 'Safety & Miscellaneous', items: safetyItems, icon: '🧯', desc: 'Fire extinguishers, trash receptacles & access controls' },
            ].map((section, sIdx) => {
              if (section.items.length === 0) return null;
              return (
                <div key={sIdx} className="bg-white border border-neutral-200/90 rounded-2xl overflow-hidden shadow-xs">
                  <div className="p-4 border-b border-neutral-100 bg-neutral-50/60 flex items-center justify-between">
                    <div>
                      <h3 className="text-xs font-bold text-neutral-900 uppercase tracking-wider flex items-center gap-1.5">
                        <span className="text-sm">{section.icon}</span>
                        <span>{section.title}</span>
                      </h3>
                      <p className="text-[11px] text-neutral-500 mt-0.5">{section.desc}</p>
                    </div>
                    <span className="text-xs font-bold font-mono text-neutral-500 bg-white border border-neutral-200 px-2.5 py-1 rounded-md">
                      {section.items.length} item types
                    </span>
                  </div>

                  <div className="divide-y divide-neutral-100">
                    {section.items.map((item) => {
                      const total = item.qtyWorking + item.qtyBroken + item.qtyMaintenance;
                      return (
                        <div key={item.id} className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-neutral-50/50 transition-colors">
                          <div className="space-y-1 min-w-0 max-w-md">
                            <div className="flex items-center gap-2">
                              <h4 className="text-sm font-bold text-neutral-900">{item.name}</h4>
                              <span className="text-[10px] font-mono uppercase bg-neutral-100 text-neutral-600 px-1.5 py-0.2 rounded border border-neutral-200">
                                {item.unit}
                              </span>
                            </div>
                            <div className="text-xs text-neutral-600 font-medium">
                              {item.brandSpec || 'Standard Department Specification'}
                            </div>
                            {item.remarks && (
                              <div className="text-[11px] text-rose-700 bg-rose-50/80 border border-rose-200/80 px-2 py-0.5 rounded-md inline-block">
                                <strong>Defect Note:</strong> {item.remarks}
                              </div>
                            )}
                          </div>

                          {/* Condition Counts & Quick Counter Buttons */}
                          <div className="flex items-center gap-4 flex-wrap">
                            <div className="flex items-center gap-3">
                              {/* Working Count */}
                              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-2 text-center min-w-[70px]">
                                <div className="text-[9px] uppercase font-bold text-emerald-800">Working</div>
                                <div className="text-base font-bold text-emerald-800 font-mono">{item.qtyWorking}</div>
                              </div>

                              {/* Broken Count */}
                              <div className={`rounded-lg p-2 text-center min-w-[70px] border ${
                                item.qtyBroken > 0
                                  ? 'bg-rose-50 border-rose-200 text-rose-800'
                                  : 'bg-neutral-50 border-neutral-200 text-neutral-500'
                              }`}>
                                <div className="text-[9px] uppercase font-bold">Broken</div>
                                <div className="text-base font-bold font-mono">{item.qtyBroken}</div>
                              </div>

                              {/* Under Maintenance Count */}
                              {item.qtyMaintenance > 0 && (
                                <div className="bg-amber-50 border border-amber-200 rounded-lg p-2 text-center min-w-[70px]">
                                  <div className="text-[9px] uppercase font-bold text-amber-800">Repair</div>
                                  <div className="text-base font-bold text-amber-800 font-mono">{item.qtyMaintenance}</div>
                                </div>
                              )}
                            </div>

                            {/* Quick Adjust Buttons */}
                            <div className="flex items-center gap-1 bg-neutral-100 p-1 rounded-lg border border-neutral-200">
                              <button
                                type="button"
                                onClick={() => updateRoomInventoryCount(loc.id, item.id, 'qtyBroken', 1)}
                                className="px-2 py-1 text-[11px] font-bold text-rose-700 hover:bg-rose-100 rounded transition-colors"
                                title="Add 1 to Broken count"
                              >
                                +1 Broken
                              </button>
                              <div className="h-3 w-px bg-neutral-300" />
                              <button
                                type="button"
                                onClick={() => {
                                  if (item.qtyBroken > 0) {
                                    updateRoomInventoryCount(loc.id, item.id, 'qtyBroken', -1);
                                    updateRoomInventoryCount(loc.id, item.id, 'qtyWorking', 1);
                                  }
                                }}
                                disabled={item.qtyBroken === 0}
                                className="px-2 py-1 text-[11px] font-bold text-emerald-700 hover:bg-emerald-100 disabled:opacity-40 rounded transition-colors"
                                title="Mark 1 repaired (move broken to working)"
                              >
                                Mark 1 Repaired
                              </button>
                            </div>

                            {isAdmin && (
                              <button
                                type="button"
                                onClick={() => deleteRoomInventoryItem(loc.id, item.id)}
                                className="p-1.5 text-neutral-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                title="Delete item from room"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* 5. Tab Content: Quick Audit / Semester Check Mode */}
        {activeTab === 'audit' && (
          <div className="bg-white border border-neutral-200 rounded-2xl p-6 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-emerald-50/80 border border-emerald-200 rounded-xl">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-600 text-white px-2 py-0.5 rounded">
                    Audit Mode Active
                  </span>
                  <span className="text-xs text-emerald-900 font-bold">{loc.name} ({loc.room})</span>
                </div>
                <h3 className="text-sm font-bold text-emerald-950 mt-1">
                  Mobile Semester Stock & Condition Walkthrough
                </h3>
                <p className="text-xs text-emerald-800">
                  Tap <span className="font-bold">+</span> or <span className="font-bold">-</span> to update working and broken counts as you inspect the room.
                </p>
              </div>

              <button
                type="button"
                onClick={handleMarkAudited}
                className="shrink-0 inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-white bg-emerald-800 hover:bg-emerald-900 rounded-lg shadow-sm transition-colors cursor-pointer"
              >
                <CheckCircle className="w-4 h-4 text-emerald-300" />
                <span>Mark Room Audited Today</span>
              </button>
            </div>

            <div className="space-y-4">
              {roomInventories.map((item) => (
                <div key={item.id} className="p-4 border border-neutral-200 rounded-xl space-y-3 bg-neutral-50/40">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="text-xs font-bold text-neutral-900">{item.name}</div>
                      <div className="text-[11px] text-neutral-500">{item.brandSpec || 'Standard Specification'} • {item.group}</div>
                    </div>
                    <span className="text-xs font-mono font-bold bg-white border border-neutral-200 px-2 py-0.5 rounded">
                      {item.qtyWorking + item.qtyBroken} Total {item.unit}
                    </span>
                  </div>

                  {/* Big Touch-Friendly Increment Buttons */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Working Counter */}
                    <div className="bg-white border border-emerald-200 rounded-lg p-3 flex items-center justify-between">
                      <div className="text-xs font-bold text-emerald-900">
                        Working Count
                        <div className="text-[10px] text-neutral-400 font-normal">Operational in room</div>
                      </div>
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => updateRoomInventoryCount(loc.id, item.id, 'qtyWorking', -1)}
                          className="w-8 h-8 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-800 flex items-center justify-center font-bold text-base cursor-pointer"
                        >
                          -
                        </button>
                        <span className="font-mono text-lg font-bold text-emerald-800 min-w-[28px] text-center">
                          {item.qtyWorking}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateRoomInventoryCount(loc.id, item.id, 'qtyWorking', 1)}
                          className="w-8 h-8 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-900 flex items-center justify-center font-bold text-base cursor-pointer"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    {/* Broken Counter */}
                    <div className="bg-white border border-rose-200 rounded-lg p-3 flex items-center justify-between">
                      <div className="text-xs font-bold text-rose-900">
                        Broken / Defective
                        <div className="text-[10px] text-neutral-400 font-normal">Needs repair/replacement</div>
                      </div>
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => updateRoomInventoryCount(loc.id, item.id, 'qtyBroken', -1)}
                          className="w-8 h-8 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-800 flex items-center justify-center font-bold text-base cursor-pointer"
                        >
                          -
                        </button>
                        <span className="font-mono text-lg font-bold text-rose-800 min-w-[28px] text-center">
                          {item.qtyBroken}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateRoomInventoryCount(loc.id, item.id, 'qtyBroken', 1)}
                          className="w-8 h-8 rounded-lg bg-rose-100 hover:bg-rose-200 text-rose-900 flex items-center justify-center font-bold text-base cursor-pointer"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>

                  {item.remarks && (
                    <div className="text-[11px] text-neutral-600 bg-white border border-neutral-200 p-2 rounded-md">
                      <strong>Remarks:</strong> {item.remarks}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="text-center pt-4">
              <button
                type="button"
                onClick={handleMarkAudited}
                className="inline-flex items-center gap-2 px-6 py-3 text-sm font-bold text-white bg-neutral-900 hover:bg-neutral-800 rounded-xl shadow-md transition-colors cursor-pointer"
              >
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                <span>Complete Room Audit & Save Timestamp</span>
              </button>
            </div>
          </div>
        )}

        {/* 6. Hardware Fleet Table */}
        {activeTab === 'hardware' && (
          <div className="bg-white border border-neutral-200/90 rounded-2xl overflow-hidden shadow-xs space-y-0">
            <div className="p-4 border-b border-neutral-100 bg-neutral-50/50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Microscope className="w-3.5 h-3.5" />
                </div>
                <h2 className="text-xs font-bold text-neutral-900 uppercase tracking-wider">
                  Hardware Assets & Network Infrastructure ({filteredAssets.length})
                </h2>
              </div>
              <span className="text-[11px] font-medium text-neutral-500">
                {filteredAssets.reduce((sum, a) => sum + (a.totalUnits ?? 1), 0)} deployed units in {loc.room}
              </span>
            </div>

            {filteredAssets.length === 0 ? (
              <div className="py-12 px-4 text-center space-y-3">
                <div className="w-10 h-10 rounded-full bg-neutral-100 text-neutral-400 flex items-center justify-center mx-auto">
                  <Microscope className="w-5 h-5" />
                </div>
                <p className="text-xs text-neutral-500">
                  {filterText
                    ? `No hardware devices matching "${filterText}" in this room.`
                    : 'No hardware devices currently registered in this room.'}
                </p>
                {isAllowed && (
                  <button
                    type="button"
                    onClick={() =>
                      router.push(`/assets/create?location=${encodeURIComponent(`${loc.name} (${loc.room})`)}`)
                    }
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Register First Device
                  </button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-neutral-50/70 border-b border-neutral-100 text-neutral-500 font-semibold">
                    <tr>
                      <th className="py-3 px-4">Device Model / Name</th>
                      <th className="py-3 px-4">Serial Number</th>
                      <th className="py-3 px-4">Units</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Loan Status</th>
                      <th className="py-3 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100 font-medium">
                    {filteredAssets.map((asset) => (
                      <tr key={asset.id} className="hover:bg-neutral-50/60 transition-colors">
                        <td className="py-3.5 px-4 font-bold text-neutral-900">{asset.name}</td>
                        <td className="py-3.5 px-4 font-mono text-neutral-500">{asset.serialNumber}</td>
                        <td className="py-3.5 px-4 font-mono font-bold text-neutral-800">{asset.totalUnits ?? 1}</td>
                        <td className="py-3.5 px-4">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                            asset.status === 'operational'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}>
                            {asset.status.toUpperCase()}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-neutral-600">
                          {asset.loanStatus === 'on_loan' ? `Checked Out (${asset.currentBorrower})` : 'Available in Room'}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <Link
                            href={`/assets/${asset.id}`}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-neutral-700 hover:text-neutral-900 bg-white border border-neutral-200 px-2.5 py-1 rounded-lg hover:bg-neutral-50 shadow-2xs transition-all"
                          >
                            <span>Inspect</span>
                            <ChevronRight className="w-3 h-3 text-neutral-400" />
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* 7. Peripherals & Stock Table */}
        {activeTab === 'stock' && (
          <div className="bg-white border border-neutral-200/90 rounded-2xl overflow-hidden shadow-xs space-y-0">
            <div className="p-4 border-b border-neutral-100 bg-neutral-50/50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <Boxes className="w-3.5 h-3.5" />
                </div>
                <h2 className="text-xs font-bold text-neutral-900 uppercase tracking-wider">
                  Consumables, Parts & Peripherals ({filteredStock.length})
                </h2>
              </div>
              <span className="text-[11px] font-medium text-neutral-500">
                {totalStockUnits} stored units in {loc.room}
              </span>
            </div>

            {filteredStock.length === 0 ? (
              <div className="py-12 px-4 text-center space-y-3">
                <div className="w-10 h-10 rounded-full bg-neutral-100 text-neutral-400 flex items-center justify-center mx-auto">
                  <Boxes className="w-5 h-5" />
                </div>
                <p className="text-xs text-neutral-500">
                  {filterText
                    ? `No stock consumables matching "${filterText}" in this room.`
                    : 'No consumables or components currently stationed in this room.'}
                </p>
                {isAllowed && (
                  <button
                    type="button"
                    onClick={() =>
                      router.push(`/stock/create?location=${encodeURIComponent(`${loc.name} (${loc.room})`)}`)
                    }
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add Consumable Stock
                  </button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-neutral-50/70 border-b border-neutral-100 text-neutral-500 font-semibold">
                    <tr>
                      <th className="py-3 px-4">Item Name</th>
                      <th className="py-3 px-4">SKU / Code</th>
                      <th className="py-3 px-4">Quantity</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100 font-medium">
                    {filteredStock.map((item) => (
                      <tr key={item.id} className="hover:bg-neutral-50/60 transition-colors">
                        <td className="py-3.5 px-4 font-bold text-neutral-900">{item.name}</td>
                        <td className="py-3.5 px-4 font-mono text-neutral-500">{item.code}</td>
                        <td className="py-3.5 px-4 font-mono font-bold text-neutral-800">
                          {item.quantity} {item.unit}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="text-[10px] font-bold uppercase text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                            {item.status.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <Link
                            href={`/stock/${item.id}`}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-neutral-700 hover:text-neutral-900 bg-white border border-neutral-200 px-2.5 py-1 rounded-lg hover:bg-neutral-50 shadow-2xs transition-all"
                          >
                            <span>Inspect</span>
                            <ChevronRight className="w-3 h-3 text-neutral-400" />
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 8. Printable Room Door QR Placard Modal */}
      {showDoorQrModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-neutral-200 space-y-6">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-neutral-900 text-white px-2 py-0.5 rounded">
                  Printable Door Placard
                </span>
                <h3 className="text-base font-bold text-neutral-900 mt-1">
                  Classroom & Lab Door QR Sticker
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowDoorQrModal(false)}
                className="p-1 text-neutral-400 hover:text-neutral-700 rounded-lg hover:bg-neutral-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Placard Preview Card for Door */}
            <div className="border-2 border-neutral-900 rounded-2xl p-6 text-center space-y-4 bg-white shadow-md">
              <div className="text-[10px] uppercase font-bold tracking-widest text-neutral-500">
                Department of Computer Science & Engineering
              </div>

              <div className="space-y-1">
                <div className="text-3xl font-extrabold text-neutral-900 font-mono tracking-tight">
                  {loc.room}
                </div>
                <div className="text-sm font-bold text-neutral-800">
                  {loc.name}
                </div>
                <div className="text-xs text-neutral-500 font-medium">
                  {loc.building} • Floor {loc.floor ?? 1} • Capacity: {loc.capacity || 30} Seats
                </div>
              </div>

              {/* QR Image */}
              <div className="w-48 h-48 mx-auto bg-neutral-50 p-3 rounded-xl border border-neutral-300 flex items-center justify-center">
                <img
                  src={qrImageUrl}
                  alt={`QR Code for ${loc.room}`}
                  className="w-full h-full object-contain"
                />
              </div>

              <div className="space-y-1 text-xs text-neutral-600">
                <p className="font-semibold text-neutral-900">
                  Scan to View Room Condition & Report Broken Equipment
                </p>
                <p className="text-[11px] text-neutral-400">
                  Students & Faculty can view available chairs, tables, and submit immediate repair tickets.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 pt-2">
              <span className="text-xs text-neutral-400">Tape this QR placard directly on the room entrance door.</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-neutral-900 hover:bg-neutral-800 rounded-lg shadow-xs cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Print Placard</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowDoorQrModal(false)}
                  className="px-3.5 py-2 text-xs font-semibold text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded-lg cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 9. Add Room Item Modal */}
      {showAddItemModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-neutral-200 space-y-5">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded">
                  Facility Record
                </span>
                <h3 className="text-base font-bold text-neutral-900 mt-1">
                  Add Item to {loc.room}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAddItemModal(false)}
                className="p-1 text-neutral-400 hover:text-neutral-700 rounded-lg hover:bg-neutral-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateFacilityItem} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Item / Equipment Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Student Chair, Air Conditioner, Whiteboard..."
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  className="w-full bg-white border border-neutral-300 text-neutral-900 text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">
                    Category Group
                  </label>
                  <select
                    value={newItemGroup}
                    onChange={(e) => setNewItemGroup(e.target.value as AssetGroup)}
                    className="w-full bg-white border border-neutral-300 text-neutral-900 text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-neutral-900"
                  >
                    <option value="FURNITURE">Furniture & Fixtures</option>
                    <option value="ELECTRICAL">Electrical & HVAC</option>
                    <option value="IT_HARDWARE">Lab & IT Hardware</option>
                    <option value="SAFETY_MISC">Safety & Misc</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">
                    Counting Unit
                  </label>
                  <input
                    type="text"
                    value={newItemUnit}
                    onChange={(e) => setNewItemUnit(e.target.value)}
                    placeholder="pcs, sets, units..."
                    className="w-full bg-white border border-neutral-300 text-neutral-900 text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-neutral-900"
                  >
                  </input>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Brand & Specification
                </label>
                <input
                  type="text"
                  placeholder="e.g. Panasonic 2.5HP Inverter, Wooden 2-Seater Desk..."
                  value={newItemBrandSpec}
                  onChange={(e) => setNewItemBrandSpec(e.target.value)}
                  className="w-full bg-white border border-neutral-300 text-neutral-900 text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-neutral-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">
                    Working Count
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={newItemQtyWorking}
                    onChange={(e) => setNewItemQtyWorking(parseInt(e.target.value) || 0)}
                    className="w-full bg-white border border-neutral-300 text-neutral-900 text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-neutral-900 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">
                    Broken / Defective Count
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={newItemQtyBroken}
                    onChange={(e) => setNewItemQtyBroken(parseInt(e.target.value) || 0)}
                    className="w-full bg-white border border-neutral-300 text-neutral-900 text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-neutral-900 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Defect Remarks / Notes (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. 1 wheel broken, light flickering..."
                  value={newItemRemarks}
                  onChange={(e) => setNewItemRemarks(e.target.value)}
                  className="w-full bg-white border border-neutral-300 text-neutral-900 text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-neutral-900"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddItemModal(false)}
                  className="px-3.5 py-2 text-xs font-semibold text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-neutral-900 hover:bg-neutral-800 rounded-lg shadow-xs cursor-pointer"
                >
                  Add to Room Roster
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 10. Delete Confirmation Modal */}
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
