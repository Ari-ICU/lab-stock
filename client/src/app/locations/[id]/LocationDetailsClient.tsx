'use client';

import React, { useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Header } from '@/components/Header';
import { useStock } from '@/context/StockContext';
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
  FileSpreadsheet,
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
    openModal,
    openEdit,
    deleteLocation,
    showToast,
  } = useStock();

  const [activeTab, setActiveTab] = useState<'all' | 'hardware' | 'stock'>('all');
  const [filterText, setFilterText] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const loc = locations.find((l) => l.id === id);

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
          <div className="bg-white border border-neutral-200 rounded-lg p-8 max-w-md w-full text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-neutral-100 flex items-center justify-center mx-auto text-neutral-500">
              <AlertTriangle className="w-6 h-6 text-amber-600" />
            </div>
            <h2 className="text-base font-bold text-neutral-900">Laboratory Room Not Found</h2>
            <p className="text-xs text-neutral-500">
              The laboratory record with ID <span className="font-mono font-semibold text-neutral-800">{id}</span> does not exist or has been relocated.
            </p>
            <Link
              href="/locations"
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-neutral-900 rounded hover:bg-neutral-800 transition-colors"
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
    deleteLocation(loc.id);
    showToast(`Laboratory location ${loc.name} removed`);
    router.push('/locations');
  };

  return (
    <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-neutral-50/40">
      {/* Top Header */}
      <Header
        title={loc.name}
        subtitle={`${loc.building} • ${loc.room} • Complete Lab Equipment & Inventory Specification`}
        actionLabel="Register Device"
        onAction={() =>
          router.push(`/assets/create?location=${encodeURIComponent(`${loc.name} (${loc.room})`)}`)
        }
        onExport={handleExportRoomFleet}
      />

      <div className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-6 max-w-8xl w-full mx-auto">
        {/* Breadcrumb Navigation Bar */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-2 text-xs">
            <Link
              href="/locations"
              className="inline-flex items-center gap-1.5 font-semibold text-neutral-600 hover:text-neutral-900 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Laboratory Locations</span>
            </Link>
            <span className="text-neutral-300">/</span>
            <span className="font-bold text-neutral-900">{loc.name}</span>
            <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-neutral-200 text-neutral-700 font-bold ml-1">
              {loc.room}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() =>
                router.push(`/stock/create?location=${encodeURIComponent(`${loc.name} (${loc.room})`)}`)
              }
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-white border border-neutral-300 rounded hover:bg-neutral-50 text-neutral-800 transition-colors shadow-2xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-blue-600" />
              <span>Add Inventory Item</span>
            </button>
            <button
              type="button"
              onClick={() => openEdit(loc)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-white border border-neutral-300 rounded hover:bg-neutral-50 text-neutral-800 transition-colors shadow-2xs cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5 text-neutral-600" />
              <span>Edit Lab</span>
            </button>
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 hover:bg-rose-100 rounded transition-colors shadow-2xs cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-600" />
              <span>Delete</span>
            </button>
          </div>
        </div>

        {/* Hero Telemetry Card */}
        <div className="bg-white border border-neutral-200 rounded-xl p-5 sm:p-6 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-xl bg-neutral-900 text-white flex items-center justify-center shrink-0 shadow-sm">
              <Building className="w-7 h-7 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded">
                  Connected Laboratory Classroom
                </span>
                <span className="text-xs text-neutral-400 font-mono">ID: {loc.id}</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-neutral-900 tracking-tight">
                {loc.name}
              </h1>
              <div className="flex items-center gap-4 text-xs text-neutral-500 mt-1 flex-wrap">
                <span className="flex items-center gap-1 font-medium text-neutral-700">
                  <MapPin className="w-3.5 h-3.5 text-neutral-400" />
                  {loc.building} • Room <span className="font-bold text-neutral-900">{loc.room}</span>
                </span>
                <span>•</span>
                <span>Subnet: <code className="font-mono text-neutral-800 font-semibold">192.168.102.0/24</code></span>
                <span>•</span>
                <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Operational Fleet
                </span>
              </div>
            </div>
          </div>

          {/* Quick Stat Highlights */}
          <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
            <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-3 min-w-[130px]">
              <div className="text-[11px] text-neutral-500 font-medium flex items-center gap-1.5">
                <Microscope className="w-3.5 h-3.5 text-blue-500" />
                Hardware Fleet
              </div>
              <div className="text-xl font-bold text-neutral-900 mt-1">
                {totalHardwareUnits} <span className="text-xs font-normal text-neutral-500">units</span>
              </div>
              <div className="text-[10px] text-neutral-400 mt-0.5">
                {matchingAssets.length} device models
              </div>
            </div>

            <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-3 min-w-[130px]">
              <div className="text-[11px] text-neutral-500 font-medium flex items-center gap-1.5">
                <Boxes className="w-3.5 h-3.5 text-emerald-500" />
                Inventory Stock
              </div>
              <div className="text-xl font-bold text-neutral-900 mt-1">
                {totalStockUnits} <span className="text-xs font-normal text-neutral-500">units</span>
              </div>
              <div className="text-[10px] text-neutral-400 mt-0.5">
                {matchingStock.length} peripheral SKUs
              </div>
            </div>

            <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-3 min-w-[130px]">
              <div className="text-[11px] text-neutral-500 font-medium flex items-center gap-1.5">
                <Laptop className="w-3.5 h-3.5 text-amber-500" />
                Checked Out
              </div>
              <div className="text-xl font-bold text-neutral-900 mt-1">
                {activeLoansCount} <span className="text-xs font-normal text-neutral-500">active</span>
              </div>
              <div className="text-[10px] text-neutral-400 mt-0.5">
                Student lending
              </div>
            </div>
          </div>
        </div>

        {/* Search & Tabs Filter Section */}
        <div className="bg-white border border-neutral-200 rounded-xl p-4 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search equipment, serial numbers, SKUs, or models in this room..."
                value={filterText}
                onChange={(e) => setFilterText(e.target.value)}
                className="w-full bg-neutral-50 border border-neutral-300 text-neutral-900 text-xs pl-9 pr-3 py-2 rounded focus:outline-none focus:border-neutral-900 focus:bg-white focus:ring-1 focus:ring-neutral-900 font-medium transition-colors placeholder:text-neutral-400"
              />
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1 bg-neutral-100 p-1 rounded-lg border border-neutral-200 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setActiveTab('all')}
                className={`px-3 py-1.5 rounded cursor-pointer transition-colors ${
                  activeTab === 'all'
                    ? 'bg-white text-neutral-900 shadow-2xs'
                    : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                All Room Fleet ({matchingAssets.length + matchingStock.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('hardware')}
                className={`px-3 py-1.5 rounded cursor-pointer transition-colors flex items-center gap-1.5 ${
                  activeTab === 'hardware'
                    ? 'bg-white text-neutral-900 shadow-2xs'
                    : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                <Microscope className="w-3.5 h-3.5 text-blue-600" />
                Hardware ({matchingAssets.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('stock')}
                className={`px-3 py-1.5 rounded cursor-pointer transition-colors flex items-center gap-1.5 ${
                  activeTab === 'stock'
                    ? 'bg-white text-neutral-900 shadow-2xs'
                    : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                <Boxes className="w-3.5 h-3.5 text-emerald-600" />
                Peripherals ({matchingStock.length})
              </button>
            </div>
          </div>
        </div>

        {/* 1. Lab Hardware Section */}
        {(activeTab === 'all' || activeTab === 'hardware') && (
          <div className="bg-white border border-neutral-200 rounded-xl overflow-hidden shadow-xs space-y-0">
            <div className="p-4 border-b border-neutral-200 bg-neutral-50/70 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Microscope className="w-4 h-4 text-blue-600" />
                <h2 className="text-xs font-bold text-neutral-900 uppercase tracking-wide">
                  Lab Hardware Assets & Network Infrastructure ({filteredAssets.length})
                </h2>
              </div>
              <span className="text-[11px] text-neutral-500">
                {filteredAssets.reduce((sum, a) => sum + (a.totalUnits ?? 1), 0)} deployed units in {loc.room}
              </span>
            </div>

            {filteredAssets.length === 0 ? (
              <div className="p-8 text-center text-xs text-neutral-500 space-y-2">
                <p>No hardware devices matching current query in this room.</p>
                <button
                  type="button"
                  onClick={() =>
                    router.push(`/assets/create?location=${encodeURIComponent(`${loc.name} (${loc.room})`)}`)
                  }
                  className="inline-flex items-center gap-1 text-emerald-700 font-semibold hover:underline"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Register a device to {loc.room}
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs min-w-[760px]">
                  <thead className="bg-neutral-50 border-b border-neutral-200 text-neutral-600 font-semibold">
                    <tr>
                      <th className="py-3 px-4">Equipment / Host</th>
                      <th className="py-3 px-4">Model & SKU</th>
                      <th className="py-3 px-4">Serial Number</th>
                      <th className="py-3 px-4">Total Units</th>
                      <th className="py-3 px-4">Placement / Rack</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Lending State</th>
                      <th className="py-3 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {filteredAssets.map((asset) => (
                      <tr key={asset.id} className="hover:bg-neutral-50/70 transition-colors">
                        <td className="py-3 px-4">
                          <Link
                            href={`/assets/${asset.id}`}
                            className="font-bold text-neutral-900 hover:text-emerald-700 transition-colors flex items-center gap-2"
                          >
                            <span>{asset.name}</span>
                            <ExternalLink className="w-3 h-3 text-neutral-400" />
                          </Link>
                        </td>
                        <td className="py-3 px-4 text-neutral-600 font-medium">{asset.model}</td>
                        <td className="py-3 px-4 font-mono text-neutral-800 text-[11px]">
                          {asset.serialNumber}
                        </td>
                        <td className="py-3 px-4 font-semibold text-neutral-900">
                          {asset.totalUnits ?? 1} <span className="text-[11px] font-normal text-neutral-500">{asset.unitType ?? 'Units'}</span>
                        </td>
                        <td className="py-3 px-4 text-neutral-600 max-w-xs truncate">
                          {asset.location}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium ${
                              asset.status === 'operational'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : asset.status === 'maintenance'
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : 'bg-blue-50 text-blue-700 border border-blue-200'
                            }`}
                          >
                            {asset.status === 'operational'
                              ? 'Operational'
                              : asset.status === 'maintenance'
                              ? 'Maintenance'
                              : 'In Use'}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          {asset.loanStatus === 'on_loan' ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                              <Laptop className="w-3 h-3" />
                              Lent to {asset.currentBorrower || 'Student'}
                            </span>
                          ) : (
                            <span className="text-[11px] text-neutral-500 font-medium">
                              In Room Bench
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <Link
                            href={`/assets/${asset.id}`}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-neutral-800 hover:text-emerald-700 bg-white border border-neutral-200 px-2.5 py-1 rounded hover:bg-neutral-50 shadow-2xs transition-colors"
                          >
                            <span>Inspect</span>
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

        {/* 2. Inventory & Peripherals Section */}
        {(activeTab === 'all' || activeTab === 'stock') && (
          <div className="bg-white border border-neutral-200 rounded-xl overflow-hidden shadow-xs space-y-0">
            <div className="p-4 border-b border-neutral-200 bg-neutral-50/70 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Boxes className="w-4 h-4 text-emerald-600" />
                <h2 className="text-xs font-bold text-neutral-900 uppercase tracking-wide">
                  Peripherals, Monitors & Accessories ({filteredStock.length})
                </h2>
              </div>
              <span className="text-[11px] text-neutral-500">
                {filteredStock.reduce((sum, s) => sum + (s.quantity || 1), 0)} total consumable/peripheral items in {loc.room}
              </span>
            </div>

            {filteredStock.length === 0 ? (
              <div className="p-8 text-center text-xs text-neutral-500 space-y-2">
                <p>No inventory peripherals matching current query in this room.</p>
                <button
                  type="button"
                  onClick={() =>
                    router.push(`/stock/create?location=${encodeURIComponent(`${loc.name} (${loc.room})`)}`)
                  }
                  className="inline-flex items-center gap-1 text-emerald-700 font-semibold hover:underline"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add inventory items to {loc.room}
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs min-w-[760px]">
                  <thead className="bg-neutral-50 border-b border-neutral-200 text-neutral-600 font-semibold">
                    <tr>
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
                      <tr key={item.id} className="hover:bg-neutral-50/70 transition-colors">
                        <td className="py-3 px-4">
                          <Link
                            href={`/stock/${item.id}`}
                            className="font-bold text-neutral-900 hover:text-emerald-700 transition-colors flex items-center gap-2"
                          >
                            <span>{item.name}</span>
                            <ExternalLink className="w-3 h-3 text-neutral-400" />
                          </Link>
                        </td>
                        <td className="py-3 px-4 font-mono text-neutral-700 text-[11px]">
                          {item.code}
                        </td>
                        <td className="py-3 px-4">
                          <span className="bg-neutral-100 text-neutral-700 px-2 py-0.5 rounded text-[11px] font-medium">
                            {item.category}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-bold text-neutral-900 text-sm">{item.quantity}</span>{' '}
                          <span className="text-[11px] text-neutral-500 font-normal">{item.unit}</span>
                        </td>
                        <td className="py-3 px-4 text-neutral-600 max-w-xs truncate">
                          {item.rack || item.location}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium ${
                              item.status === 'in_stock'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : item.status === 'low_stock'
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : 'bg-rose-50 text-rose-700 border border-rose-200'
                            }`}
                          >
                            {item.status === 'in_stock'
                              ? 'In Stock'
                              : item.status === 'low_stock'
                              ? 'Low Stock'
                              : 'Out of Stock'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-neutral-500">{item.expiryDate || 'Active'}</td>
                        <td className="py-3 px-4 text-right">
                          <Link
                            href={`/stock/${item.id}`}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-neutral-800 hover:text-emerald-700 bg-white border border-neutral-200 px-2.5 py-1 rounded hover:bg-neutral-50 shadow-2xs transition-colors"
                          >
                            <span>Inspect</span>
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

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-neutral-200 rounded-xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-neutral-900">
                  Delete Laboratory Record?
                </h3>
                <p className="text-xs text-neutral-500 mt-0.5">
                  This will remove <span className="font-semibold text-neutral-800">{loc.name}</span> ({loc.room}) from your active fleet.
                </p>
              </div>
            </div>

            <p className="text-xs text-neutral-600 bg-neutral-50 p-3 rounded border border-neutral-200">
              Note: Assets and inventory previously assigned to this room will remain in the database, but may need to be reallocated to another room.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="px-3.5 py-2 text-xs font-semibold border border-neutral-300 rounded text-neutral-700 hover:bg-neutral-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="px-4 py-2 text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white rounded cursor-pointer transition-colors shadow-2xs"
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

