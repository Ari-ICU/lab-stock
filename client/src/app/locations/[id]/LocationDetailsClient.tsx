'use client';

import { useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Header } from '@/components/Header';
import { useStock } from '@/context/StockContext';
import { useAuth } from '@/context/AuthContext';
import { exportToCsv } from '@/lib/exportCsv';
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
  ArrowLeftRight,
  ShieldCheck,
  Shield,
  FileSpreadsheet,
  Copy,
  Check,
  ChevronRight,
  X,
  Server,
  Radio,
} from 'lucide-react';

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
    showToast,
  } = useStock();
  const { user, canManageLocation } = useAuth();

  const [activeTab, setActiveTab] = useState<'all' | 'hardware' | 'stock'>('all');
  const [filterText, setFilterText] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const loc = locations.find((l) => l.id === id);
  const isAdmin = user?.roleBadge === 'Admin' || user?.role === 'Primary Lab Administrator';
  const isAllowed = isAdmin || (loc ? canManageLocation(loc.room) || canManageLocation(loc.name) : false);

  // Match items belonging to this lab location
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

    const roomKey = loc.room.replace(/^Rm\s*/i, '').trim().toLowerCase();

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
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-neutral-900 rounded-lg hover:bg-neutral-800 transition-colors"
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
    const hardwareRows = matchingAssets.map((a) => ({
      'Record Category': 'Hardware Asset',
      'Lab Facility': loc.name,
      'Room Number': loc.room,
      'Building': loc.building,
      'Item Name': a.name,
      'Model / SKU': a.model,
      'Serial / Identifier': a.serialNumber,
      'Quantity Units': a.totalUnits ?? 1,
      'Unit Type': a.unitType ?? 'Units',
      'Operational Status': a.status,
      'Loan Status': a.loanStatus === 'on_loan' ? `Checked Out (${a.currentBorrower || 'Borrower'})` : 'Available in Lab',
      'Audit / Warranty Date': a.nextCalibration || '',
    }));

    const stockRows = matchingStock.map((s) => ({
      'Record Category': 'Inventory Peripheral',
      'Lab Facility': loc.name,
      'Room Number': loc.room,
      'Building': loc.building,
      'Item Name': s.name,
      'Model / SKU': s.code,
      'Serial / Identifier': s.code,
      'Quantity Units': s.quantity,
      'Unit Type': s.unit,
      'Operational Status': s.status,
      'Loan Status': 'Stored in Bench / Rack',
      'Audit / Warranty Date': s.expiryDate || 'Active',
    }));

    const filename = `${loc.name.toLowerCase().replace(/[^a-z0-9]+/g, '_')}_fleet_audit`;
    exportToCsv(filename, [...hardwareRows, ...stockRows]);
    showToast(`Exported ${hardwareRows.length + stockRows.length} equipment records for ${loc.name}`);
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
      {/* 1. Unified Clean Navigation Header (No duplication!) */}
      <Header
        title={loc.name}
        subtitle={`${loc.building} • Rm ${loc.room.replace(/^Rm\s*/i, '')}`}
        backHref="/locations"
        backLabel="Laboratory Locations"
        showAction={false}
        showExport={false}
        actions={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExportRoomFleet}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-neutral-700 bg-white border border-neutral-200 hover:border-neutral-300 rounded-lg hover:bg-neutral-50 active:bg-neutral-100 transition-colors shadow-2xs cursor-pointer"
              title="Download room inventory dataset as CSV"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span className="hidden sm:inline">Export</span>
              <span className="font-mono text-[9px] uppercase font-bold text-emerald-700 bg-emerald-50 px-1 py-0.5 rounded border border-emerald-200">
                CSV
              </span>
            </button>

            {!isAllowed ? (
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-100 text-neutral-600 rounded-lg text-xs font-semibold border border-neutral-200">
                <Shield className="w-3.5 h-3.5 text-neutral-500" />
                <span>Read-Only Lab Scope</span>
              </div>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => openEdit(loc)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-neutral-700 bg-white border border-neutral-200 hover:border-neutral-300 rounded-lg hover:bg-neutral-50 active:bg-neutral-100 transition-colors shadow-2xs cursor-pointer"
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
                  onClick={() =>
                    router.push(`/assets/create?location=${encodeURIComponent(`${loc.name} (${loc.room})`)}`)
                  }
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-neutral-900 hover:bg-neutral-800 rounded-lg transition-colors shadow-xs cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Register Device</span>
                </button>
              </>
            )}
          </div>
        }
      />

      <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6 max-w-8xl w-full mx-auto">

        {/* Lab Scope Restriction Banner */}
        {!isAllowed && (
          <div className="p-4 bg-amber-50/80 border border-amber-300/80 rounded-xl flex items-start gap-3 shadow-xs">
            <Shield className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <div className="text-xs font-bold text-amber-950">
                Restricted Laboratory Scope
              </div>
              <div className="text-xs text-amber-800 leading-relaxed">
                You are viewing <span className="font-semibold text-neutral-900">{loc.name} ({loc.room})</span> in read-only mode. Your account is assigned to manage: <span className="font-semibold text-neutral-900">{user?.assignedLabs?.includes('all') ? 'All Laboratories' : user?.assignedLabs?.join(', ') || 'No Assigned Labs'}</span>. Room configuration, device registration, and inventory additions are restricted to operators assigned to this laboratory.
              </div>
            </div>
          </div>
        )}
        {/* 2. Hero Telemetry & Status Overview */}
        <div className="bg-white border border-neutral-200/90 rounded-2xl p-5 sm:p-6 shadow-xs space-y-5">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200/70 flex items-center justify-center shrink-0 shadow-2xs">
                <Building className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200/80">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Operational Fleet
                  </span>
                  <span className="text-xs font-mono text-neutral-400 font-medium">ID: {loc.id}</span>
                </div>
                <h1 className="text-xl sm:text-2xl font-bold text-neutral-900 tracking-tight">
                  {loc.name}
                </h1>
                <div className="flex items-center gap-3 text-xs text-neutral-500 flex-wrap pt-0.5">
                  <span className="inline-flex items-center gap-1 text-neutral-700 font-medium">
                    <MapPin className="w-3.5 h-3.5 text-neutral-400" />
                    {loc.building} • Room <span className="font-bold text-neutral-900">{loc.room}</span>
                  </span>
                  <span className="text-neutral-300">•</span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard('192.168.102.0/24', 'Lab Subnet', 'subnet')}
                    className="inline-flex items-center gap-1 font-mono text-neutral-600 hover:text-neutral-900 bg-neutral-100 hover:bg-neutral-200/80 px-2 py-0.5 rounded text-[11px] font-medium transition-colors cursor-pointer group"
                    title="Click to copy IP subnet"
                  >
                    <span>Subnet: 192.168.102.0/24</span>
                    {copiedKey === 'subnet' ? (
                      <Check className="w-3 h-3 text-emerald-600" />
                    ) : (
                      <Copy className="w-3 h-3 text-neutral-400 group-hover:text-neutral-600" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Add Buttons */}
            {isAllowed ? (
              <div className="flex items-center gap-2 self-start lg:self-center shrink-0">
                <button
                  type="button"
                  onClick={() =>
                    router.push(`/stock/create?location=${encodeURIComponent(`${loc.name} (${loc.room})`)}`)
                  }
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-neutral-700 bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 rounded-lg transition-colors shadow-2xs cursor-pointer"
                >
                  <Boxes className="w-3.5 h-3.5 text-emerald-600" />
                  <span>+ Add Inventory Item</span>
                </button>
                <button
                  type="button"
                  onClick={() =>
                    router.push(`/assets/create?location=${encodeURIComponent(`${loc.name} (${loc.room})`)}`)
                  }
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-neutral-900 hover:bg-neutral-800 rounded-lg transition-colors shadow-2xs cursor-pointer"
                >
                  <Microscope className="w-3.5 h-3.5 text-emerald-400" />
                  <span>+ Add Hardware</span>
                </button>
              </div>
            ) : (
              <div className="inline-flex items-center gap-1.5 px-3 py-2 bg-neutral-100 text-neutral-600 text-xs font-semibold rounded-lg border border-neutral-200 self-start lg:self-center shrink-0">
                <Shield className="w-3.5 h-3.5 text-neutral-500" />
                <span>Read-Only Laboratory Scope</span>
              </div>
            )}
          </div>

          {/* 4 Micro KPI Metric Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 pt-3 border-t border-neutral-100">
            <div className="bg-neutral-50/70 border border-neutral-200/70 rounded-xl p-3.5">
              <div className="flex items-center justify-between text-neutral-500 mb-1">
                <span className="text-[11px] font-medium">Hardware Fleet</span>
                <div className="w-6 h-6 rounded-md bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Microscope className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="text-xl font-bold text-neutral-900">
                {totalHardwareUnits} <span className="text-xs font-normal text-neutral-500">units</span>
              </div>
              <p className="text-[10px] text-neutral-400 mt-0.5">{matchingAssets.length} device models</p>
            </div>

            <div className="bg-neutral-50/70 border border-neutral-200/70 rounded-xl p-3.5">
              <div className="flex items-center justify-between text-neutral-500 mb-1">
                <span className="text-[11px] font-medium">Inventory Stock</span>
                <div className="w-6 h-6 rounded-md bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <Boxes className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="text-xl font-bold text-neutral-900">
                {totalStockUnits} <span className="text-xs font-normal text-neutral-500">units</span>
              </div>
              <p className="text-[10px] text-neutral-400 mt-0.5">{matchingStock.length} consumable SKUs</p>
            </div>

            <div className="bg-neutral-50/70 border border-neutral-200/70 rounded-xl p-3.5">
              <div className="flex items-center justify-between text-neutral-500 mb-1">
                <span className="text-[11px] font-medium">Active Loans</span>
                <div className="w-6 h-6 rounded-md bg-amber-50 text-amber-600 flex items-center justify-center">
                  <Laptop className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="text-xl font-bold text-neutral-900">
                {activeLoansCount} <span className="text-xs font-normal text-neutral-500">active</span>
              </div>
              <p className="text-[10px] text-neutral-400 mt-0.5">Checked out to students</p>
            </div>

            <div className="bg-neutral-50/70 border border-neutral-200/70 rounded-xl p-3.5">
              <div className="flex items-center justify-between text-neutral-500 mb-1">
                <span className="text-[11px] font-medium">Room Health</span>
                <div className="w-6 h-6 rounded-md bg-purple-50 text-purple-600 flex items-center justify-center">
                  <ShieldCheck className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="text-xl font-bold text-neutral-900">
                {maintenanceCount > 0 ? `${maintenanceCount} Pending` : '100%'}
              </div>
              <p className="text-[10px] text-neutral-400 mt-0.5">
                {maintenanceCount > 0 ? 'Maintenance service required' : 'All equipment operational'}
              </p>
            </div>
          </div>
        </div>

        {/* 3. Integrated Search & Segmented Filter Bar */}
        <div className="bg-white border border-neutral-200/90 rounded-xl p-3.5 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Filter by name, serial number, SKU, or model..."
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              className="w-full bg-neutral-50/70 border border-neutral-200 text-neutral-900 text-xs pl-9 pr-8 py-2 rounded-lg focus:outline-none focus:border-neutral-900 focus:bg-white focus:ring-1 focus:ring-neutral-900 font-medium transition-all placeholder:text-neutral-400"
            />
            {filterText && (
              <button
                type="button"
                onClick={() => setFilterText('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700 p-0.5"
                title="Clear filter"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Segmented Control Tabs */}
          <div className="flex items-center gap-1 bg-neutral-100 p-1 rounded-lg border border-neutral-200/80 text-xs font-semibold shrink-0">
            <button
              type="button"
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1.5 rounded-md cursor-pointer transition-all ${
                activeTab === 'all'
                  ? 'bg-white text-neutral-900 shadow-2xs font-bold'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              All Fleet ({matchingAssets.length + matchingStock.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('hardware')}
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
              onClick={() => setActiveTab('stock')}
              className={`px-3 py-1.5 rounded-md cursor-pointer transition-all flex items-center gap-1.5 ${
                activeTab === 'stock'
                  ? 'bg-white text-neutral-900 shadow-2xs font-bold'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              <Boxes className="w-3.5 h-3.5 text-emerald-600" />
              <span>Peripherals ({matchingStock.length})</span>
            </button>
          </div>
        </div>

        {/* 4. Hardware Fleet Table */}
        {(activeTab === 'all' || activeTab === 'hardware') && (
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
                <table className="w-full text-left text-xs min-w-[800px]">
                  <thead>
                    <tr className="border-b border-neutral-200 bg-neutral-50/70 text-neutral-600 font-semibold uppercase tracking-wider text-[10px]">
                      <th className="py-3 px-4">Equipment / Device</th>
                      <th className="py-3 px-4">Model & Specification</th>
                      <th className="py-3 px-4">Serial Number</th>
                      <th className="py-3 px-4">Total Units</th>
                      <th className="py-3 px-4">Placement / Rack</th>
                      <th className="py-3 px-4">Operational Status</th>
                      <th className="py-3 px-4">Lending State</th>
                      <th className="py-3 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {filteredAssets.map((asset) => (
                      <tr key={asset.id} className="hover:bg-neutral-50/80 transition-colors group">
                        <td className="py-3.5 px-4">
                          <Link
                            href={`/assets/${asset.id}`}
                            className="font-bold text-neutral-900 group-hover:text-emerald-700 transition-colors flex items-center gap-1.5"
                          >
                            <span>{asset.name}</span>
                            <ExternalLink className="w-3 h-3 text-neutral-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </Link>
                        </td>
                        <td className="py-3.5 px-4 text-neutral-600 font-medium">{asset.model}</td>
                        <td className="py-3.5 px-4">
                          <button
                            type="button"
                            onClick={() => copyToClipboard(asset.serialNumber, 'Serial Number', asset.id)}
                            className="inline-flex items-center gap-1 font-mono text-[11px] font-semibold text-neutral-700 bg-neutral-100 hover:bg-neutral-200/80 px-2 py-0.5 rounded transition-colors cursor-pointer"
                            title="Click to copy serial number"
                          >
                            <span>{asset.serialNumber}</span>
                            {copiedKey === asset.id ? (
                              <Check className="w-3 h-3 text-emerald-600" />
                            ) : (
                              <Copy className="w-3 h-3 text-neutral-400" />
                            )}
                          </button>
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-neutral-900">
                          {asset.totalUnits ?? 1}{' '}
                          <span className="text-[11px] font-normal text-neutral-500">{asset.unitType ?? 'Units'}</span>
                        </td>
                        <td className="py-3.5 px-4 text-neutral-600 max-w-xs truncate">
                          {asset.location}
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium border ${
                              asset.status === 'operational'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : asset.status === 'maintenance'
                                ? 'bg-amber-50 text-amber-700 border-amber-200'
                                : 'bg-blue-50 text-blue-700 border-blue-200'
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                asset.status === 'operational'
                                  ? 'bg-emerald-500'
                                  : asset.status === 'maintenance'
                                  ? 'bg-amber-500'
                                  : 'bg-blue-500'
                              }`}
                            />
                            {asset.status === 'operational'
                              ? 'Operational'
                              : asset.status === 'maintenance'
                              ? 'Maintenance'
                              : 'In Use'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          {asset.loanStatus === 'on_loan' ? (
                            <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                              <Laptop className="w-3 h-3 text-amber-600" />
                              Lent to {asset.currentBorrower || 'Student'}
                            </span>
                          ) : (
                            <span className="text-[11px] text-neutral-500 font-medium">In Room Bench</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <Link
                            href={`/assets/${asset.id}`}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-neutral-700 hover:text-neutral-900 bg-white border border-neutral-200 hover:border-neutral-300 px-2.5 py-1 rounded-lg hover:bg-neutral-50 shadow-2xs transition-all"
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

        {/* 5. Inventory & Peripherals Table */}
        {(activeTab === 'all' || activeTab === 'stock') && (
          <div className="bg-white border border-neutral-200/90 rounded-2xl overflow-hidden shadow-xs space-y-0">
            <div className="p-4 border-b border-neutral-100 bg-neutral-50/50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <Boxes className="w-3.5 h-3.5" />
                </div>
                <h2 className="text-xs font-bold text-neutral-900 uppercase tracking-wider">
                  Peripherals, Monitors & Accessories ({filteredStock.length})
                </h2>
              </div>
              <span className="text-[11px] font-medium text-neutral-500">
                {filteredStock.reduce((sum, s) => sum + (s.quantity || 1), 0)} consumable units in {loc.room}
              </span>
            </div>

            {filteredStock.length === 0 ? (
              <div className="py-12 px-4 text-center space-y-3">
                <div className="w-10 h-10 rounded-full bg-neutral-100 text-neutral-400 flex items-center justify-center mx-auto">
                  <Boxes className="w-5 h-5" />
                </div>
                <p className="text-xs text-neutral-500">
                  {filterText
                    ? `No inventory items matching "${filterText}" in this room.`
                    : 'No inventory peripherals currently assigned to this room.'}
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
                    Add First Consumable
                  </button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs min-w-[800px]">
                  <thead>
                    <tr className="border-b border-neutral-200 bg-neutral-50/70 text-neutral-600 font-semibold uppercase tracking-wider text-[10px]">
                      <th className="py-3 px-4">Item Name</th>
                      <th className="py-3 px-4">Part / SKU</th>
                      <th className="py-3 px-4">Category</th>
                      <th className="py-3 px-4">In-Room Count</th>
                      <th className="py-3 px-4">Shelf / Bench</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Warranty</th>
                      <th className="py-3 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {filteredStock.map((item) => (
                      <tr key={item.id} className="hover:bg-neutral-50/80 transition-colors group">
                        <td className="py-3.5 px-4">
                          <Link
                            href={`/stock/${item.id}`}
                            className="font-bold text-neutral-900 group-hover:text-emerald-700 transition-colors flex items-center gap-1.5"
                          >
                            <span>{item.name}</span>
                            <ExternalLink className="w-3 h-3 text-neutral-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </Link>
                        </td>
                        <td className="py-3.5 px-4">
                          <button
                            type="button"
                            onClick={() => copyToClipboard(item.code, 'Part SKU', item.id)}
                            className="inline-flex items-center gap-1 font-mono text-[11px] font-semibold text-neutral-700 bg-neutral-100 hover:bg-neutral-200/80 px-2 py-0.5 rounded transition-colors cursor-pointer"
                            title="Click to copy SKU"
                          >
                            <span>{item.code}</span>
                            {copiedKey === item.id ? (
                              <Check className="w-3 h-3 text-emerald-600" />
                            ) : (
                              <Copy className="w-3 h-3 text-neutral-400" />
                            )}
                          </button>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="bg-neutral-100 text-neutral-700 px-2 py-0.5 rounded text-[11px] font-medium border border-neutral-200">
                            {item.category}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="font-bold text-neutral-900 text-sm">{item.quantity}</span>{' '}
                          <span className="text-[11px] text-neutral-500 font-normal">{item.unit}</span>
                        </td>
                        <td className="py-3.5 px-4 text-neutral-600 max-w-xs truncate">
                          {item.rack || item.location}
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium border ${
                              item.status === 'in_stock'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : item.status === 'low_stock'
                                ? 'bg-amber-50 text-amber-700 border-amber-200'
                                : 'bg-rose-50 text-rose-700 border-rose-200'
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                item.status === 'in_stock'
                                  ? 'bg-emerald-500'
                                  : item.status === 'low_stock'
                                  ? 'bg-amber-500'
                                  : 'bg-rose-500'
                              }`}
                            />
                            {item.status === 'in_stock'
                              ? 'In Stock'
                              : item.status === 'low_stock'
                              ? 'Low Stock'
                              : 'Out of Stock'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-neutral-500">{item.expiryDate || 'Active'}</td>
                        <td className="py-3.5 px-4 text-right">
                          <Link
                            href={`/stock/${item.id}`}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-neutral-700 hover:text-neutral-900 bg-white border border-neutral-200 hover:border-neutral-300 px-2.5 py-1 rounded-lg hover:bg-neutral-50 shadow-2xs transition-all"
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

      {/* 6. Delete Confirmation Modal */}
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
