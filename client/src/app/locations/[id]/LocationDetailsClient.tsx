'use client';

import { useState, useMemo, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Header } from '@/components/Header';
import { usePersistentTab } from '@/hooks/usePersistentTab';
import { useStock } from '@/context/StockContext';
import { useAuth } from '@/context/AuthContext';
import { Dropdown, DropdownOption } from '@/components/Dropdown';
import { exportToCsv } from '@/lib/exportCsv';
import { LabThumbnail } from '@/components/LabThumbnail';
import {
  ArrowLeft,
  Boxes,
  Microscope,
  Search,
  Plus,
  CheckCircle2,
  Wrench,
  AlertTriangle,
  Edit3,
  Trash2,
  MapPin,
  Layers,
  FileSpreadsheet,
  Check,
  ChevronRight,
  X,
  QrCode,
  Printer,
  Calendar,
  Users,
  CheckCircle,
  Sparkles,
} from 'lucide-react';
import {  AssetGroup } from '@/types';

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
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedCondition, setSelectedCondition] = useState<string>('all');
  const [hardwareStatusFilter, setHardwareStatusFilter] = useState<string>('all');
  const [stockStatusFilter, setStockStatusFilter] = useState<string>('all');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showDoorQrModal, setShowDoorQrModal] = useState(false);
  const [showAddItemModal, setShowAddItemModal] = useState(false);
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
    { label: 'All Conditions', value: 'all' },
    { label: '100% Operational', value: 'operational' },
    { label: 'Defective / Needs Repair', value: 'defective' },
  ];

  const hardwareStatusOptions: DropdownOption[] = [
    { label: 'All Operational Statuses', value: 'all' },
    { label: 'Operational', value: 'operational' },
    { label: 'In Production', value: 'in_use' },
    { label: 'Maintenance / RMA', value: 'maintenance' },
  ];

  const stockStatusOptions: DropdownOption[] = [
    { label: 'All Statuses', value: 'all' },
    { label: 'In Stock', value: 'in_stock' },
    { label: 'Low Stock', value: 'low_stock' },
    { label: 'Out of Stock', value: 'out_of_stock' },
  ];

  const categoryGroupOptions: DropdownOption[] = [
    { label: 'Furniture & Fixtures', value: 'FURNITURE' },
    { label: 'Electrical & HVAC', value: 'ELECTRICAL' },
    { label: 'Lab & IT Hardware', value: 'IT_HARDWARE' },
    { label: 'Safety & Misc', value: 'SAFETY_MISC' },
  ];

  const stockDropdownOptions: DropdownOption[] = useMemo(() => {
    return stock.map((s) => ({
      label: `${s.name} (${s.code}) — ${s.quantity} ${s.unit} in Dept`,
      value: s.code,
    }));
  }, [stock]);

  const assetDropdownOptions: DropdownOption[] = useMemo(() => {
    return assets.map((a) => ({
      label: `${a.name} (${a.serialNumber}) — ${a.totalUnits ?? 1} units`,
      value: a.serialNumber,
    }));
  }, [assets]);

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

  // New Item Form State & Central Stock Integration
  const [itemSource, setItemSource] = useState<'stock' | 'asset' | 'custom'>('stock');
  const [selectedStockCode, setSelectedStockCode] = useState<string>('');
  const [selectedAssetSerial, setSelectedAssetSerial] = useState<string>('');
  const [newItemName, setNewItemName] = useState('');
  const [newItemGroup, setNewItemGroup] = useState<AssetGroup>('FURNITURE');
  const [newItemBrandSpec, setNewItemBrandSpec] = useState('');
  const [newItemUnit, setNewItemUnit] = useState('pcs');
  const [newItemQtyWorking, setNewItemQtyWorking] = useState(1);
  const [newItemQtyBroken, setNewItemQtyBroken] = useState(0);
  const [newItemRemarks, setNewItemRemarks] = useState('');

  const handleSelectCentralStock = (code: string) => {
    setSelectedStockCode(code);
    const item = stock.find((s) => s.code === code || s.id === code);
    if (item) {
      setNewItemName(item.name);
      setNewItemUnit(item.unit || 'pcs');
      setNewItemBrandSpec(item.description || item.rack || 'Sourced from Central Stock');
      const cat = (item.category || '').toLowerCase();
      const n = item.name.toLowerCase();
      if (
        cat.includes('chair') ||
        cat.includes('table') ||
        cat.includes('desk') ||
        cat.includes('cabinet') ||
        cat.includes('fixture') ||
        n.includes('chair') ||
        n.includes('desk') ||
        n.includes('table') ||
        n.includes('bench') ||
        n.includes('whiteboard')
      ) {
        setNewItemGroup('FURNITURE');
      } else if (cat.includes('electrical') || cat.includes('cable') || cat.includes('power')) {
        setNewItemGroup('ELECTRICAL');
      } else if (cat.includes('tool') || cat.includes('safety')) {
        setNewItemGroup('SAFETY_MISC');
      } else {
        setNewItemGroup('FURNITURE');
      }
      setNewItemQtyWorking(Math.min(item.quantity || 1, 24));
      setNewItemQtyBroken(0);
      setNewItemRemarks(`Central Stock SKU: ${item.code}`);
    }
  };

  const handleSelectCentralAsset = (serial: string) => {
    setSelectedAssetSerial(serial);
    const asset = assets.find((a) => a.serialNumber === serial || a.id === serial);
    if (asset) {
      setNewItemName(asset.name);
      setNewItemUnit(asset.unitType || 'Units');
      setNewItemBrandSpec(`Model: ${asset.model} • S/N: ${asset.serialNumber}`);
      setNewItemGroup('IT_HARDWARE');
      setNewItemQtyWorking(asset.totalUnits ?? 1);
      setNewItemQtyBroken(0);
      setNewItemRemarks(`Central Asset Tag: ${asset.serialNumber}`);
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
    (id && id.includes('-') && id.length > 20 ? locations[0] : undefined);
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
            ? item.qtyBroken === 0
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

  // Filtered hardware assets
  const filteredAssets = useMemo(() => {
    const q = filterText.toLowerCase().trim();
    return matchingAssets.filter((a) => {
      const matchesQuery =
        !q ||
        a.name.toLowerCase().includes(q) ||
        a.model.toLowerCase().includes(q) ||
        a.serialNumber.toLowerCase().includes(q) ||
        a.status.toLowerCase().includes(q);

      const matchesStatus =
        hardwareStatusFilter === 'all' || a.status === hardwareStatusFilter;

      return matchesQuery && matchesStatus;
    });
  }, [matchingAssets, filterText, hardwareStatusFilter]);

  // Filtered consumables & stock items
  const filteredStock = useMemo(() => {
    const q = filterText.toLowerCase().trim();
    return matchingStock.filter((s) => {
      const matchesQuery =
        !q ||
        s.name.toLowerCase().includes(q) ||
        s.code.toLowerCase().includes(q) ||
        s.category.toLowerCase().includes(q) ||
        s.status.toLowerCase().includes(q);

      const matchesStatus =
        stockStatusFilter === 'all' || s.status === stockStatusFilter;

      return matchesQuery && matchesStatus;
    });
  }, [matchingStock, filterText, stockStatusFilter]);

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
      showToast('Please enter or select an equipment item', 'warning');
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

    if (itemSource === 'stock' && selectedStockCode) {
      showToast(`Allocated ${newItemQtyWorking + newItemQtyBroken} ${newItemUnit} of "${newItemName}" from Central Stock to ${loc.room}`);
    } else if (itemSource === 'asset' && selectedAssetSerial) {
      showToast(`Allocated "${newItemName}" from Central Assets to ${loc.room}`);
    } else {
      showToast(`Registered "${newItemName}" in ${loc.room}`);
    }

    setNewItemName('');
    setNewItemBrandSpec('');
    setNewItemUnit('pcs');
    setNewItemQtyWorking(1);
    setNewItemQtyBroken(0);
    setNewItemRemarks('');
    setSelectedStockCode('');
    setSelectedAssetSerial('');
    setItemSource('stock');
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
              </>
            )}
          </div>
        }
      />

      <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6 max-w-8xl w-full mx-auto">
        {/* 2. Room Overview Hero Card */}
        <div className="bg-white border border-neutral-200 rounded-lg p-5 shadow-2xs">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 overflow-hidden flex items-center justify-center shrink-0 shadow-2xs relative group">
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
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${inventorySummary.totalBroken > 0
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

            {/* Action Buttons */}
            <div className="flex items-center gap-2 self-start lg:self-center shrink-0">
              <button
                type="button"
                onClick={handleMarkAudited}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors shadow-2xs cursor-pointer"
                title="Stamp room with today's audit date"
              >
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                <span>Mark Audited Today</span>
              </button>

              {isAllowed && (
                <button
                  type="button"
                  onClick={() => setShowAddItemModal(true)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-neutral-900 hover:bg-neutral-800 rounded-lg transition-colors shadow-2xs cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Add Room Item</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* 3. Condition KPI Metric Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-white border border-neutral-200 rounded-lg p-4 shadow-2xs">
            <div className="flex items-center justify-between text-neutral-500 mb-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider">Operational Units</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-bold text-neutral-900 font-mono">
              {inventorySummary.totalWorking} <span className="text-xs font-sans font-normal text-neutral-500">Units OK</span>
            </div>
            <div className="text-[11px] text-emerald-700 font-medium mt-1">
              {inventorySummary.healthRate}% Operational Usability
            </div>
          </div>

          <div className="bg-white border border-neutral-200 rounded-lg p-4 shadow-2xs">
            <div className="flex items-center justify-between text-neutral-500 mb-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider">Defective / Repair</span>
              <Wrench className="w-4 h-4 text-rose-600" />
            </div>
            <div className="text-2xl font-bold text-rose-700 font-mono">
              {inventorySummary.totalBroken} <span className="text-xs font-sans font-normal text-neutral-500">Defective</span>
            </div>
            <div className="text-[11px] text-neutral-500 mt-1">
              {inventorySummary.totalBroken > 0 ? 'Reported on repair roster' : 'Zero broken equipment'}
            </div>
          </div>

          <div className="bg-white border border-neutral-200 rounded-lg p-4 shadow-2xs">
            <div className="flex items-center justify-between text-neutral-500 mb-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider">Serialized Assets</span>
              <Microscope className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-2xl font-bold text-neutral-900 font-mono">
              {totalHardwareUnits} <span className="text-xs font-sans font-normal text-neutral-500">Devices</span>
            </div>
            <div className="text-[11px] text-neutral-500 mt-1">{matchingAssets.length} model classes registered</div>
          </div>

          <div className="bg-white border border-neutral-200 rounded-lg p-4 shadow-2xs">
            <div className="flex items-center justify-between text-neutral-500 mb-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider">Student Capacity</span>
              <Users className="w-4 h-4 text-neutral-400" />
            </div>
            <div className="text-2xl font-bold text-neutral-900 font-mono">
              {loc.capacity || 30} <span className="text-xs font-sans font-normal text-neutral-500">Stations</span>
            </div>
            <div className="text-[11px] text-neutral-500 mt-1">Assigned student seating capacity</div>
          </div>
        </div>

        {/* 4. Tab Navigation */}
        <div className="flex items-center gap-2 border-b border-neutral-200 overflow-x-auto">
          <button
            type="button"
            onClick={() => handleTabChange('matrix')}
            className={`pb-3 px-3 text-xs font-semibold flex items-center gap-2 border-b-2 whitespace-nowrap transition-all cursor-pointer ${activeTab === 'matrix'
                ? 'border-neutral-900 text-neutral-900 font-bold'
                : 'border-transparent text-neutral-500 hover:text-neutral-800'
              }`}
          >
            <Layers className="w-4 h-4 text-neutral-600" />
            <span>Facility & Condition ({loc.inventories?.length || 0})</span>
          </button>
          <button
            type="button"
            onClick={() => handleTabChange('hardware')}
            className={`pb-3 px-3 text-xs font-semibold flex items-center gap-2 border-b-2 whitespace-nowrap transition-all cursor-pointer ${activeTab === 'hardware'
                ? 'border-neutral-900 text-neutral-900 font-bold'
                : 'border-transparent text-neutral-500 hover:text-neutral-800'
              }`}
          >
            <Microscope className="w-4 h-4 text-blue-600" />
            <span>Hardware Assets ({matchingAssets.length})</span>
          </button>
          <button
            type="button"
            onClick={() => handleTabChange('stock')}
            className={`pb-3 px-3 text-xs font-semibold flex items-center gap-2 border-b-2 whitespace-nowrap transition-all cursor-pointer ${activeTab === 'stock'
                ? 'border-neutral-900 text-neutral-900 font-bold'
                : 'border-transparent text-neutral-500 hover:text-neutral-800'
              }`}
          >
            <Boxes className="w-4 h-4 text-emerald-600" />
            <span>Consumables & Stock ({matchingStock.length})</span>
          </button>
          <button
            type="button"
            onClick={() => handleTabChange('audit')}
            className={`pb-3 px-3 text-xs font-semibold flex items-center gap-2 border-b-2 whitespace-nowrap transition-all cursor-pointer ${activeTab === 'audit'
                ? 'border-emerald-600 text-emerald-800 font-bold'
                : 'border-transparent text-neutral-500 hover:text-neutral-800'
              }`}
          >
            <Sparkles className="w-4 h-4 text-emerald-600" />
            <span>Quick Audit Mode</span>
          </button>
        </div>

        {/* 5. Tab Content: Facility & Condition Table (matches /stock & /assets) */}
        {activeTab === 'matrix' && (
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
                  <button
                    type="button"
                    onClick={() => setShowAddItemModal(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-neutral-900 hover:bg-neutral-800 rounded-lg transition-colors shadow-2xs cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Allocate from Center Stock</span>
                  </button>
                )}
              </div>
            </div>

            {/* Clean Responsive Table matching /stock and /assets */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs min-w-[780px]">
                <thead className="bg-neutral-50 border-b border-neutral-200 text-neutral-600 font-semibold">
                  <tr>
                    <th className="py-3 px-4 w-12 text-center">Visual</th>
                    <th className="py-3 px-4">Item & Equipment Name</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Specification / Model</th>
                    <th className="py-3 px-4 text-center">Total Count</th>
                    <th className="py-3 px-4 text-center">Working</th>
                    <th className="py-3 px-4 text-center">Broken</th>
                    <th className="py-3 px-4">Operational Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
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
                      const operationalPercent = total > 0 ? Math.round((item.qtyWorking / total) * 100) : 100;
                      const isDefectRemark =
                        item.qtyBroken > 0 ||
                        /broken|defect|damage|fault|repair|cracked|stuck|replace/i.test(item.remarks || '');

                      return (
                        <tr key={item.id} className="hover:bg-neutral-50/70 transition-colors group">
                          {/* Visual */}
                          <td className="py-3 px-4 text-center">
                            <div className="w-10 h-10 rounded border border-neutral-200 bg-neutral-100 flex items-center justify-center text-lg shrink-0 shadow-2xs mx-auto">
                              {getCategoryIcon(item.group)}
                            </div>
                          </td>

                          {/* Item & Equipment Name */}
                          <td className="py-3 px-4">
                            <div className="font-semibold text-neutral-900 flex items-center gap-1.5 flex-wrap">
                              <span>{item.name}</span>
                              <span className="text-[10px] font-mono font-medium uppercase bg-neutral-100 text-neutral-600 px-1.5 py-0.5 rounded border border-neutral-200/70">
                                {item.unit}
                              </span>
                            </div>
                            {item.remarks && (
                              <div className="mt-1">
                                {isDefectRemark ? (
                                  <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-900 bg-amber-50/90 border border-amber-200/80 px-2 py-0.5 rounded-md">
                                    <AlertTriangle className="w-3 h-3 text-amber-600 shrink-0" />
                                    <span>{item.remarks}</span>
                                  </span>
                                ) : (
                                  <span className="text-[11px] text-neutral-500 line-clamp-1">
                                    {item.remarks}
                                  </span>
                                )}
                              </div>
                            )}
                          </td>

                          {/* Category */}
                          <td className="py-3 px-4">
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-neutral-100 text-neutral-700 border border-neutral-200/60">
                              {getCategoryLabel(item.group)}
                            </span>
                          </td>

                          {/* Specification */}
                          <td className="py-3 px-4 text-neutral-600 font-medium">
                            {item.brandSpec || 'Standard Specification'}
                          </td>

                          {/* Total Count */}
                          <td className="py-3 px-4 text-center font-mono font-bold text-neutral-900">
                            <span className="bg-neutral-100 px-2 py-0.5 rounded border border-neutral-200">
                              {total}
                            </span>
                          </td>

                          {/* Working */}
                          <td className="py-3 px-4 text-center font-mono">
                            <span className="inline-flex items-center gap-1 font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded text-xs">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                              {item.qtyWorking}
                            </span>
                          </td>

                          {/* Broken */}
                          <td className="py-3 px-4 text-center font-mono">
                            {item.qtyBroken > 0 ? (
                              <span className="inline-flex items-center gap-1 font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded text-xs">
                                <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                                {item.qtyBroken}
                              </span>
                            ) : (
                              <span className="text-neutral-400 text-xs font-normal">0</span>
                            )}
                          </td>

                          {/* Operational Status */}
                          <td className="py-3 px-4">
                            {operationalPercent === 100 ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                100% Operational
                              </span>
                            ) : (
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold ${operationalPercent >= 70
                                  ? 'bg-amber-50 text-amber-800 border border-amber-200'
                                  : 'bg-rose-50 text-rose-800 border border-rose-200'
                                }`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${operationalPercent >= 70 ? 'bg-amber-500' : 'bg-rose-500'}`} />
                                {operationalPercent}% Usable
                              </span>
                            )}
                          </td>

                          {/* Actions */}
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* + Defect */}
                              <button
                                type="button"
                                onClick={() => {
                                  if (item.qtyWorking > 0) {
                                    updateRoomInventoryCount(loc.id, item.id, 'qtyWorking', -1);
                                    updateRoomInventoryCount(loc.id, item.id, 'qtyBroken', 1);
                                  } else {
                                    updateRoomInventoryCount(loc.id, item.id, 'qtyBroken', 1);
                                  }
                                }}
                                className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold text-neutral-700 hover:text-rose-700 bg-white hover:bg-rose-50 border border-neutral-200 hover:border-rose-200 rounded-md transition-all shadow-2xs cursor-pointer"
                                title="Report 1 unit broken / defective"
                              >
                                <AlertTriangle className="w-3 h-3 text-rose-500" />
                                <span>+ Defect</span>
                              </button>

                              {/* ✓ Fixed */}
                              <button
                                type="button"
                                onClick={() => {
                                  if (item.qtyBroken > 0) {
                                    updateRoomInventoryCount(loc.id, item.id, 'qtyBroken', -1);
                                    updateRoomInventoryCount(loc.id, item.id, 'qtyWorking', 1);
                                  }
                                }}
                                disabled={item.qtyBroken === 0}
                                className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 disabled:opacity-30 rounded-md transition-all shadow-2xs cursor-pointer"
                                title="Mark 1 unit repaired"
                              >
                                <Check className="w-3 h-3 text-emerald-600" />
                                <span>✓ Fixed</span>
                              </button>

                              {/* Admin Delete */}
                              {isAdmin && (
                                <button
                                  type="button"
                                  onClick={() => deleteRoomInventoryItem(loc.id, item.id)}
                                  className="p-1 text-neutral-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer ml-1"
                                  title="Delete from roster"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
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
              {(loc.inventories || []).map((item) => (
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

        {/* 6. Hardware Fleet Table matching /assets */}
        {activeTab === 'hardware' && (
          <div className="bg-white border border-neutral-200 rounded-lg w-full shadow-2xs">
            {/* Toolbar */}
            <div className="p-4 border-b border-neutral-200 flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 flex-wrap flex-1">
                <div className="relative w-full sm:w-64">
                  <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search equipment, serial number or model..."
                    value={filterText}
                    onChange={(e) => setFilterText(e.target.value)}
                    className="w-full bg-white border border-neutral-300 text-neutral-900 text-xs pl-8 pr-3 py-1.5 rounded-lg focus:outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 transition-colors placeholder:text-neutral-400 font-medium shadow-2xs"
                  />
                </div>

                <Dropdown
                  value={hardwareStatusFilter}
                  options={hardwareStatusOptions}
                  onChange={setHardwareStatusFilter}
                  placeholder="Filter by Status"
                  className="w-full sm:w-auto"
                />
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <div className="text-xs text-neutral-500">
                  Showing <span className="font-semibold text-neutral-900">{filteredAssets.length}</span> devices
                </div>
                {isAllowed && (
                  <button
                    type="button"
                    onClick={() =>
                      router.push(`/assets/create?location=${encodeURIComponent(`${loc.name} (${loc.room})`)}`)
                    }
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-neutral-900 hover:bg-neutral-800 rounded-lg transition-colors shadow-2xs cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Register Device</span>
                  </button>
                )}
              </div>
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
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs min-w-[700px]">
                  <thead className="bg-neutral-50 border-b border-neutral-200 text-neutral-600 font-semibold">
                    <tr>
                      <th className="py-3 px-4 w-12">Visual</th>
                      <th className="py-3 px-4">Equipment Name</th>
                      <th className="py-3 px-4 text-center">Total Units</th>
                      <th className="py-3 px-4">Serial / Tag</th>
                      <th className="py-3 px-4">Model & Specs</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Loan Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {filteredAssets.map((asset) => (
                      <tr key={asset.id} className="hover:bg-neutral-50/70 transition-colors group">
                        <td className="py-2.5 px-4">
                          <Link
                            href={`/assets/${asset.id}`}
                            className="w-10 h-10 rounded border border-neutral-200 bg-neutral-100 overflow-hidden flex items-center justify-center shrink-0 cursor-pointer hover:border-neutral-400 transition-colors block"
                            title="Click to view details"
                          >
                            <LabThumbnail
                              src={asset.imageUrl}
                              alt={asset.name}
                              size="thumb"
                              fallbackType="item"
                              className="w-full h-full object-cover"
                            />
                          </Link>
                        </td>
                        <td className="py-3 px-4">
                          <Link
                            href={`/assets/${asset.id}`}
                            className="font-semibold text-neutral-900 hover:text-emerald-700 transition-colors block"
                          >
                            {asset.name}
                          </Link>
                        </td>
                        <td className="py-3 px-4 text-center font-mono font-bold text-neutral-900">
                          {asset.totalUnits ?? 1}
                        </td>
                        <td className="py-3 px-4 font-mono text-neutral-600">
                          <Link href={`/assets/${asset.id}`} className="hover:text-neutral-900 transition-colors">
                            {asset.serialNumber}
                          </Link>
                        </td>
                        <td className="py-3 px-4 text-neutral-600">
                          {asset.model}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${asset.status === 'operational'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                            }`}>
                            {asset.status.toUpperCase()}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-neutral-600">
                          {asset.loanStatus === 'on_loan' ? (
                            <span className="text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded text-[11px] font-medium">
                              Checked Out ({asset.currentBorrower})
                            </span>
                          ) : (
                            <span className="text-neutral-600">Available</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <Link
                            href={`/assets/${asset.id}`}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-neutral-700 hover:text-neutral-900 bg-white border border-neutral-200 px-2.5 py-1 rounded-md hover:bg-neutral-50 shadow-2xs transition-all"
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

        {/* 7. Peripherals & Stock Table matching /stock */}
        {activeTab === 'stock' && (
          <div className="bg-white border border-neutral-200 rounded-lg w-full shadow-2xs">
            {/* Toolbar */}
            <div className="p-4 border-b border-neutral-200 flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 flex-wrap flex-1">
                <div className="relative w-full sm:w-64">
                  <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search consumables, SKU, category..."
                    value={filterText}
                    onChange={(e) => setFilterText(e.target.value)}
                    className="w-full bg-white border border-neutral-300 text-neutral-900 text-xs pl-8 pr-3 py-1.5 rounded-lg focus:outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 transition-colors placeholder:text-neutral-400 font-medium shadow-2xs"
                  />
                </div>

                <Dropdown
                  value={stockStatusFilter}
                  options={stockStatusOptions}
                  onChange={setStockStatusFilter}
                  placeholder="Filter by Status"
                  className="w-full sm:w-auto"
                />
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <div className="text-xs text-neutral-500">
                  Showing <span className="font-semibold text-neutral-900">{filteredStock.length}</span> items
                </div>
                {isAllowed && (
                  <button
                    type="button"
                    onClick={() =>
                      router.push(`/stock/create?location=${encodeURIComponent(`${loc.name} (${loc.room})`)}`)
                    }
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-neutral-900 hover:bg-neutral-800 rounded-lg transition-colors shadow-2xs cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Add Stock</span>
                  </button>
                )}
              </div>
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
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs min-w-[700px]">
                  <thead className="bg-neutral-50 border-b border-neutral-200 text-neutral-600 font-semibold">
                    <tr>
                      <th className="py-3 px-4 w-12">Visual</th>
                      <th className="py-3 px-4">Item & Equipment Name</th>
                      <th className="py-3 px-4">Part / SKU</th>
                      <th className="py-3 px-4">Category</th>
                      <th className="py-3 px-4 text-center">Count / Qty</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {filteredStock.map((item) => (
                      <tr key={item.id} className="hover:bg-neutral-50/70 transition-colors group">
                        <td className="py-2.5 px-4">
                          <Link
                            href={`/stock/${item.id}`}
                            className="w-10 h-10 rounded border border-neutral-200 bg-neutral-100 overflow-hidden flex items-center justify-center shrink-0 cursor-pointer hover:border-neutral-400 transition-colors block"
                            title="Click to view details"
                          >
                            <LabThumbnail
                              src={item.imageUrl}
                              alt={item.name}
                              size="thumb"
                              fallbackType="item"
                              className="w-full h-full object-cover"
                            />
                          </Link>
                        </td>
                        <td className="py-3 px-4">
                          <Link
                            href={`/stock/${item.id}`}
                            className="font-semibold text-neutral-900 hover:text-emerald-700 transition-colors block"
                          >
                            {item.name}
                          </Link>
                        </td>
                        <td className="py-3 px-4 font-mono text-neutral-600">
                          <Link href={`/stock/${item.id}`} className="hover:text-neutral-900 transition-colors">
                            {item.code}
                          </Link>
                        </td>
                        <td className="py-3 px-4">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-neutral-100 text-neutral-700 border border-neutral-200/60">
                            {item.category}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center font-mono font-bold text-neutral-900">
                          {item.quantity} {item.unit}
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-[10px] font-bold uppercase text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                            {item.status.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <Link
                            href={`/stock/${item.id}`}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-neutral-700 hover:text-neutral-900 bg-white border border-neutral-200 px-2.5 py-1 rounded-md hover:bg-neutral-50 shadow-2xs transition-all"
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

      {/* 9. Allocate from Center Stock / Assets Modal */}
      {showAddItemModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-neutral-200 space-y-5 max-h-[92vh] overflow-y-auto">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded">
                  Center Stock Allocation
                </span>
                <h3 className="text-base font-bold text-neutral-900 mt-1">
                  Allocate Equipment to {loc.room}
                </h3>
                <p className="text-xs text-neutral-500 mt-0.5">
                  Draw furniture, chairs, or hardware directly from Central Stock (/stock) or Assets (/assets).
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowAddItemModal(false)}
                className="p-1 text-neutral-400 hover:text-neutral-700 rounded-lg hover:bg-neutral-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Source Segmented Selector */}
            <div className="flex items-center gap-1 bg-neutral-100 p-1 rounded-lg border border-neutral-200 text-xs font-semibold">
              <button
                type="button"
                onClick={() => {
                  setItemSource('stock');
                  if (stock.length > 0) {
                    handleSelectCentralStock(stock[0].code);
                  }
                }}
                className={`flex-1 py-1.5 px-2 rounded-md transition-all text-center cursor-pointer ${itemSource === 'stock'
                    ? 'bg-white text-neutral-900 shadow-2xs font-bold'
                    : 'text-neutral-600 hover:text-neutral-900'
                  }`}
              >
                📦 Center Stock (/stock)
              </button>
              <button
                type="button"
                onClick={() => {
                  setItemSource('asset');
                  if (assets.length > 0) {
                    handleSelectCentralAsset(assets[0].serialNumber);
                  }
                }}
                className={`flex-1 py-1.5 px-2 rounded-md transition-all text-center cursor-pointer ${itemSource === 'asset'
                    ? 'bg-white text-neutral-900 shadow-2xs font-bold'
                    : 'text-neutral-600 hover:text-neutral-900'
                  }`}
              >
                🖥️ Center Assets (/assets)
              </button>
              <button
                type="button"
                onClick={() => {
                  setItemSource('custom');
                  setNewItemName('');
                  setNewItemBrandSpec('');
                  setNewItemUnit('pcs');
                  setNewItemRemarks('');
                  setSelectedStockCode('');
                  setSelectedAssetSerial('');
                }}
                className={`py-1.5 px-3 rounded-md transition-all text-center cursor-pointer ${itemSource === 'custom'
                    ? 'bg-white text-neutral-900 shadow-2xs font-bold'
                    : 'text-neutral-600 hover:text-neutral-900'
                  }`}
              >
                ✏️ Custom
              </button>
            </div>

            <form onSubmit={handleCreateFacilityItem} className="space-y-4">
              {/* Option A: Pick from Central Stock */}
              {itemSource === 'stock' && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 mb-1">
                      Select Item from Central Stock (/stock) *
                    </label>
                    <Dropdown
                      value={selectedStockCode}
                      options={stockDropdownOptions}
                      onChange={handleSelectCentralStock}
                      placeholder="-- Choose Item from /stock --"
                      searchable
                      searchPlaceholder="Search Central Stock items or SKUs..."
                      className="w-full"
                      buttonClassName="w-full justify-between bg-white border border-neutral-300 text-neutral-900 text-xs px-3 py-2 rounded-lg"
                    />
                  </div>

                  {selectedStockCode && (
                    <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-3 text-xs text-neutral-600 space-y-1">
                      <div className="font-semibold text-neutral-900 flex items-center justify-between">
                        <span>{newItemName}</span>
                        <span className="font-mono text-[10px] bg-neutral-200 text-neutral-800 px-1.5 py-0.5 rounded">
                          {selectedStockCode}
                        </span>
                      </div>
                      <div className="text-[11px] text-neutral-500">
                        {newItemBrandSpec}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Option B: Pick from Central Assets */}
              {itemSource === 'asset' && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 mb-1">
                      Select Device from Central Hardware Assets (/assets) *
                    </label>
                    <Dropdown
                      value={selectedAssetSerial}
                      options={assetDropdownOptions}
                      onChange={handleSelectCentralAsset}
                      placeholder="-- Choose Hardware from /assets --"
                      searchable
                      searchPlaceholder="Search hardware assets or serials..."
                      className="w-full"
                      buttonClassName="w-full justify-between bg-white border border-neutral-300 text-neutral-900 text-xs px-3 py-2 rounded-lg"
                    />
                  </div>

                  {selectedAssetSerial && (
                    <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-3 text-xs text-neutral-600 space-y-1">
                      <div className="font-semibold text-neutral-900 flex items-center justify-between">
                        <span>{newItemName}</span>
                        <span className="font-mono text-[10px] bg-neutral-200 text-neutral-800 px-1.5 py-0.5 rounded">
                          {selectedAssetSerial}
                        </span>
                      </div>
                      <div className="text-[11px] text-neutral-500">
                        {newItemBrandSpec}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Option C: Custom Item Name */}
              {itemSource === 'custom' && (
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
                    className="w-full bg-white border border-neutral-300 text-neutral-900 text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-neutral-900 font-medium"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">
                    Category Group
                  </label>
                  <Dropdown
                    value={newItemGroup}
                    options={categoryGroupOptions}
                    onChange={(val) => setNewItemGroup(val as AssetGroup)}
                    placeholder="Select Category Group"
                    className="w-full"
                    buttonClassName="w-full justify-between bg-white border border-neutral-300 text-neutral-900 text-xs px-3 py-2 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">
                    Counting Unit
                  </label>
                  <input
                    type="text"
                    value={newItemUnit}
                    onChange={(e) => setNewItemUnit(e.target.value)}
                    placeholder="pcs, chairs, tables, sets..."
                    className="w-full bg-white border border-neutral-300 text-neutral-900 text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-neutral-900"
                  />
                </div>
              </div>

              {itemSource === 'custom' && (
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
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">
                    Working Units (Allocated to {loc.room})
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={newItemQtyWorking}
                    onChange={(e) => setNewItemQtyWorking(parseInt(e.target.value) || 0)}
                    className="w-full bg-white border border-neutral-300 text-neutral-900 text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-neutral-900 font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">
                    Defective / Broken Units
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
                  Placement Details / Defect Remarks (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Student Rows 1-4, Instructor podium..."
                  value={newItemRemarks}
                  onChange={(e) => setNewItemRemarks(e.target.value)}
                  className="w-full bg-white border border-neutral-300 text-neutral-900 text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-neutral-900"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => setShowAddItemModal(false)}
                  className="px-3.5 py-2 text-xs font-semibold text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-neutral-900 hover:bg-neutral-800 rounded-lg shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Allocate to {loc.room}</span>
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
