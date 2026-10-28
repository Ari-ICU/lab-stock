'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/Header';
import { useStock } from '@/context/StockContext';
import { exportToCsv } from '@/lib/exportCsv';
import { RowActionMenu } from '@/components/RowActionMenu';
import {
  Cable,
  Router,
  AlertTriangle,
  Clock,
  ArrowRight,
  Server,
  QrCode,
  Image as ImageIcon,
  Building,
  ArrowLeftRight,
  Laptop,
  CheckCircle2,
  Plus,
  ExternalLink,
  ShieldCheck,
  Wrench,
  Layers,
  MapPin
} from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();
  const {
    stock,
    assets,
    locations,
    loans,
    maintenance,
    openScanner,
    openModal,
    openDetails,
    openEdit,
    deleteStockItem,
    deleteAsset,
    returnAsset,
  } = useStock();

  const activeLoans = loans.filter((l) => l.status === 'active');
  const lowStockItems = stock.filter((i) => i.status !== 'in_stock');
  const totalHardwareUnits = assets.reduce((sum, a) => sum + (a.totalUnits || 1), 0);
  const totalStockUnits = stock.reduce((sum, i) => sum + i.quantity, 0);

  const handleExport = () => {
    const hardwareRows = assets.map((a) => ({
      'Record Category': 'Hardware Asset',
      'Item / Equipment Name': a.name,
      'Model / SKU': a.model,
      'Serial / Identifier': a.serialNumber,
      'Total Count': a.totalUnits ?? 1,
      'Unit Type': a.unitType ?? 'Units',
      'Assigned Location': a.location,
      'Operational Status': a.status,
      'Loan Status': a.loanStatus === 'on_loan' ? `Checked out (${a.currentBorrower || 'Borrower'})` : 'Available',
      'Audit / Warranty Date': a.nextCalibration || '',
    }));

    const stockRows = stock.map((s) => ({
      'Record Category': 'Inventory Peripheral',
      'Item / Equipment Name': s.name,
      'Model / SKU': s.code,
      'Serial / Identifier': s.code,
      'Total Count': s.quantity,
      'Unit Type': s.unit,
      'Assigned Location': s.location,
      'Operational Status': s.status,
      'Loan Status': 'In Shelf / Storage',
      'Audit / Warranty Date': s.expiryDate || 'Active',
    }));

    exportToCsv('csd_stock_department_fleet_overview', [...hardwareRows, ...stockRows]);
  };

  return (
    <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
      <Header
        title="Faculty Laboratories Overview"
        subtitle={`${locations.length} Connected Lab Classrooms • ${assets.length} Deployed Hardware Assets • Student & Staff Loans`}
        onExport={handleExport}
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={openScanner}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-neutral-300 hover:bg-neutral-50 text-neutral-800 rounded text-xs font-semibold transition-colors cursor-pointer shadow-xs"
            >
              <QrCode className="w-3.5 h-3.5 text-neutral-600" />
              <span className="hidden sm:inline">Scan Barcode</span>
            </button>
            <Link
              href="/loans"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-neutral-300 hover:bg-neutral-50 text-neutral-800 rounded text-xs font-semibold transition-colors cursor-pointer shadow-xs"
            >
              <Laptop className="w-3.5 h-3.5 text-amber-600" />
              <span>Lend Device</span>
            </Link>
            <Link
              href="/assets/create"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-white rounded text-xs font-semibold transition-colors cursor-pointer shadow-xs"
            >
              <Plus className="w-3.5 h-3.5 text-emerald-400" />
              <span>Create Asset</span>
            </Link>
          </div>
        }
      />

      <div className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-6 max-w-8xl w-full mx-auto">
        
        {/* ================= 4 EXECUTIVE KPI METRICS ================= */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Metric 1: Hardware Fleet */}
          <div className="bg-white border border-neutral-200 rounded p-4 hover:border-neutral-300 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                Hardware Fleet
              </span>
              <Router className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-bold text-neutral-900 mt-2">
              {assets.length} <span className="text-sm font-normal text-neutral-500">Models</span>
            </div>
            <div className="text-[11px] text-neutral-500 mt-1 flex items-center justify-between">
              <span>{totalHardwareUnits} Units Installed</span>
              <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold bg-emerald-50 px-1.5 py-0.2 rounded text-[10px]">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                100% Online
              </span>
            </div>
          </div>

          {/* Metric 2: Connected Classrooms */}
          <div className="bg-white border border-neutral-200 rounded p-4 hover:border-neutral-300 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                Laboratory Rooms
              </span>
              <Building className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-2xl font-bold text-neutral-900 mt-2">
              {locations.length} <span className="text-sm font-normal text-neutral-500">Classrooms</span>
            </div>
            <div className="text-[11px] text-neutral-500 mt-1 flex items-center justify-between">
              <span>Engineering Block A</span>
              <span className="text-blue-700 font-medium">All Monitored</span>
            </div>
          </div>

          {/* Metric 3: Device Loans */}
          <div className="bg-white border border-neutral-200 rounded p-4 hover:border-neutral-300 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                Equipment Loans
              </span>
              <Laptop className={`w-4 h-4 ${activeLoans.length > 0 ? 'text-amber-500' : 'text-neutral-400'}`} />
            </div>
            <div className="text-2xl font-bold text-neutral-900 mt-2">
              {activeLoans.length} <span className="text-sm font-normal text-neutral-500">Checked Out</span>
            </div>
            <div className="text-[11px] text-neutral-500 mt-1 flex items-center justify-between">
              <span>Student & Staff Loans</span>
              <span className="inline-flex items-center gap-1 text-amber-700 font-semibold bg-amber-50 px-1.5 py-0.2 rounded text-[10px]">
                0 Overdue
              </span>
            </div>
          </div>

          {/* Metric 4: Inventory & Consumables */}
          <div className="bg-white border border-neutral-200 rounded p-4 hover:border-neutral-300 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                Inventory & Spares
              </span>
              <Cable className="w-4 h-4 text-neutral-600" />
            </div>
            <div className="text-2xl font-bold text-neutral-900 mt-2">
              {stock.length} <span className="text-sm font-normal text-neutral-500">SKUs</span>
            </div>
            <div className="text-[11px] text-neutral-500 mt-1 flex items-center justify-between">
              <span>{totalStockUnits} Total Stock Items</span>
              <span className="text-emerald-700 font-semibold">Healthy</span>
            </div>
          </div>
        </section>

        {/* ================= QUICK WORKFLOW ACTION HUB ================= */}
        <section className="bg-white border border-neutral-200 rounded p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-neutral-900 uppercase tracking-wider">
              Quick Operations & Laboratory Workflows
            </span>
            <span className="text-[11px] text-neutral-400">Multi-Lab Control Hub</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Link
              href="/loans"
              className="flex items-center gap-3 p-3 rounded border border-neutral-200 hover:border-neutral-900 hover:bg-neutral-50/80 transition-colors text-left group"
            >
              <div className="w-9 h-9 rounded bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700 shrink-0 group-hover:bg-amber-100 transition-colors">
                <Laptop className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-neutral-900 truncate">Lend Device</div>
                <div className="text-[10px] text-neutral-500 truncate">Check-out to student</div>
              </div>
            </Link>

            <Link
              href="/loans"
              className="flex items-center gap-3 p-3 rounded border border-neutral-200 hover:border-neutral-900 hover:bg-neutral-50/80 transition-colors text-left group"
            >
              <div className="w-9 h-9 rounded bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-700 shrink-0 group-hover:bg-blue-100 transition-colors">
                <ArrowLeftRight className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-neutral-900 truncate">Relocate Hardware</div>
                <div className="text-[10px] text-neutral-500 truncate">Move PC to other lab</div>
              </div>
            </Link>

            <button
              onClick={openScanner}
              className="flex items-center gap-3 p-3 rounded border border-neutral-200 hover:border-neutral-900 hover:bg-neutral-50/80 transition-colors text-left group cursor-pointer"
            >
              <div className="w-9 h-9 rounded bg-neutral-100 border border-neutral-200 flex items-center justify-center text-neutral-800 shrink-0 group-hover:bg-neutral-200 transition-colors">
                <QrCode className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-neutral-900 truncate">Barcode Scan</div>
                <div className="text-[10px] text-neutral-500 truncate">Scan serial tag</div>
              </div>
            </button>

            <Link
              href="/assets/create"
              className="flex items-center gap-3 p-3 rounded border border-neutral-200 hover:border-neutral-900 hover:bg-neutral-50/80 transition-colors text-left group"
            >
              <div className="w-9 h-9 rounded bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700 shrink-0 group-hover:bg-emerald-100 transition-colors">
                <Plus className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-neutral-900 truncate">Add Asset</div>
                <div className="text-[10px] text-neutral-500 truncate">Register new device</div>
              </div>
            </Link>
          </div>
        </section>

        {/* ================= TWO-COLUMN CORE GRID ================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* ================= LEFT COLUMN (7 COLS): CLASSROOM MATRIX & ACTIVE LOANS ================= */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Active Device Loans Widget */}
            <section className="bg-white border border-neutral-200 rounded overflow-hidden">
              <div className="p-4 border-b border-neutral-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Laptop className="w-4 h-4 text-amber-600" />
                  <h2 className="text-xs font-bold text-neutral-900 uppercase tracking-wider">
                    Active Equipment Loans ({activeLoans.length})
                  </h2>
                </div>
                <Link
                  href="/loans"
                  className="text-xs font-semibold text-neutral-600 hover:text-neutral-900 flex items-center gap-1 transition-colors"
                >
                  <span>Manage all loans</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>

              {activeLoans.length === 0 ? (
                <div className="p-6 text-center text-neutral-500 bg-neutral-50/40">
                  <CheckCircle2 className="w-6 h-6 text-emerald-500 mx-auto mb-1.5" />
                  <div className="text-xs font-semibold text-neutral-800">All Equipment In Lab</div>
                  <div className="text-[11px] text-neutral-500 mt-0.5">
                    No active student or staff check-outs. All devices safely stationed in rooms.
                  </div>
                </div>
              ) : (
                <div className="divide-y divide-neutral-100">
                  {activeLoans.map((loan) => (
                    <div key={loan.id} className="p-4 flex items-center justify-between gap-3 hover:bg-neutral-50/70 transition-colors">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Link
                            href={`/assets/${loan.assetId}`}
                            className="text-xs font-bold text-neutral-900 hover:text-blue-600 transition-colors truncate"
                          >
                            {loan.assetName}
                          </Link>
                          <span className="px-1.5 py-0.2 rounded text-[10px] font-mono text-neutral-600 bg-neutral-100 border border-neutral-200">
                            SN: {loan.serialNumber}
                          </span>
                        </div>
                        <div className="text-[11px] text-neutral-600 mt-1">
                          Borrower: <span className="font-semibold text-neutral-900">{loan.borrowerName}</span> ({loan.borrowerRole}) • {loan.courseOrClass || 'Lab Capstone'}
                        </div>
                        <div className="text-[10px] text-neutral-400 mt-0.5 font-mono">
                          Borrowed: {loan.borrowDate} • Due: <span className="font-semibold text-amber-700">{loan.expectedReturnDate}</span>
                        </div>
                      </div>

                      <button
                        onClick={() => returnAsset(loan.id)}
                        className="px-2.5 py-1 text-xs font-semibold text-neutral-800 bg-white border border-neutral-300 hover:bg-neutral-100 rounded transition-colors cursor-pointer shrink-0"
                      >
                        Return
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Connected Laboratories & Fleet Matrix */}
            <section className="bg-white border border-neutral-200 rounded overflow-hidden">
              <div className="p-4 border-b border-neutral-200 flex items-center justify-between">
                <div>
                  <h2 className="text-xs font-bold text-neutral-900 uppercase tracking-wider">
                    Faculty Laboratories & Room Allocations
                  </h2>
                  <p className="text-[11px] text-neutral-500">Connected classrooms and staging depot</p>
                </div>
                <Link
                  href="/locations"
                  className="text-xs font-semibold text-neutral-600 hover:text-neutral-900 flex items-center gap-1 transition-colors"
                >
                  <span>View all {locations.length} rooms</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-neutral-100">
                <div className="p-3.5 space-y-2.5">
                  {locations.slice(0, 3).map((loc) => {
                    const roomAssets = assets.filter((a) => a.location.includes(loc.room));
                    return (
                      <Link
                        key={loc.id}
                        href="/locations"
                        className="p-3 rounded border border-neutral-200/80 hover:border-neutral-900 hover:bg-neutral-50/60 transition-colors block group"
                      >
                        <div className="flex items-start justify-between">
                          <div className="min-w-0">
                            <div className="text-xs font-bold text-neutral-900 group-hover:text-emerald-700 transition-colors truncate">
                              {loc.name}
                            </div>
                            <div className="text-[11px] text-neutral-500 mt-0.5">
                              {loc.building} • <span className="font-semibold text-neutral-700">{loc.room}</span>
                            </div>
                          </div>
                          <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0 mt-1" />
                        </div>
                        <div className="mt-2 pt-2 border-t border-neutral-100 flex items-center justify-between text-[10px] text-neutral-500">
                          <span>{roomAssets.length} Hardware Models</span>
                          <span className="font-semibold text-neutral-700">Online</span>
                        </div>
                      </Link>
                    );
                  })}
                </div>

                <div className="p-3 space-y-2.5">
                  {locations.slice(3).map((loc) => {
                    const roomAssets = assets.filter((a) => a.location.includes(loc.room));
                    return (
                      <Link
                        key={loc.id}
                        href="/locations"
                        className="p-3 rounded border border-neutral-200/80 hover:border-neutral-900 hover:bg-neutral-50/60 transition-colors block group"
                      >
                        <div className="flex items-start justify-between">
                          <div className="min-w-0">
                            <div className="text-xs font-bold text-neutral-900 group-hover:text-emerald-700 transition-colors truncate">
                              {loc.name}
                            </div>
                            <div className="text-[11px] text-neutral-500 mt-0.5">
                              {loc.building} • <span className="font-semibold text-neutral-700">{loc.room}</span>
                            </div>
                          </div>
                          <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0 mt-1" />
                        </div>
                        <div className="mt-2 pt-2 border-t border-neutral-100 flex items-center justify-between text-[10px] text-neutral-500">
                          <span>{roomAssets.length} Hardware Models</span>
                          <span className="font-semibold text-neutral-700">Online</span>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            </section>

            {/* Consumables & Inventory Health */}
            <section className="bg-white border border-neutral-200 rounded overflow-hidden">
              <div className="p-4 border-b border-neutral-200 flex items-center justify-between">
                <div>
                  <h2 className="text-xs font-bold text-neutral-900 uppercase tracking-wider">
                    Consumables & Peripheral Stock
                  </h2>
                  <p className="text-[11px] text-neutral-500">Monitors, keyboards, patch cables & climate kits</p>
                </div>
                <Link
                  href="/stock"
                  className="text-xs font-semibold text-neutral-600 hover:text-neutral-900 flex items-center gap-1 transition-colors"
                >
                  <span>View inventory</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>

              {lowStockItems.length > 0 ? (
                <div className="divide-y divide-neutral-100">
                  {lowStockItems.map((item) => (
                    <div key={item.id} className="p-3.5 flex items-center justify-between gap-3 hover:bg-neutral-50/70 transition-colors">
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-neutral-900">{item.name}</div>
                        <div className="text-[11px] text-neutral-400 font-mono mt-0.5">
                          {item.code} • {item.location}
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200 shrink-0">
                        {item.quantity} {item.unit}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 bg-emerald-50/40 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded bg-emerald-100 flex items-center justify-center shrink-0">
                      <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-emerald-950">
                        All {stock.length} Inventory Categories Fully Stocked
                      </div>
                      <div className="text-[11px] text-emerald-800">
                        Adequate spares for student benches, Ethernet cables, and replacement remotes.
                      </div>
                    </div>
                  </div>
                  <Link
                    href="/stock"
                    className="px-3 py-1 text-xs font-semibold text-neutral-900 bg-white border border-neutral-300 hover:bg-neutral-50 rounded transition-colors shrink-0"
                  >
                    Catalog
                  </Link>
                </div>
              )}
            </section>
          </div>

          {/* ================= RIGHT COLUMN (5 COLS): HARDWARE FLEET DIRECTORY ================= */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Faculty Hardware Directory */}
            <section className="bg-white border border-neutral-200 rounded overflow-hidden">
              <div className="p-4 border-b border-neutral-200 flex items-center justify-between">
                <div>
                  <h2 className="text-xs font-bold text-neutral-900 uppercase tracking-wider">
                    Faculty Hardware Assets
                  </h2>
                  <p className="text-[11px] text-neutral-500">Core compute & network devices</p>
                </div>
                <Link
                  href="/assets"
                  className="text-xs font-semibold text-neutral-600 hover:text-neutral-900 flex items-center gap-1 transition-colors"
                >
                  <span>View all ({assets.length})</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>

              <div className="divide-y divide-neutral-100">
                {assets.map((asset) => (
                  <div
                    key={asset.id}
                    className="p-3.5 flex items-center justify-between gap-3 hover:bg-neutral-50/70 transition-colors group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Link
                        href={`/assets/${asset.id}`}
                        className="w-10 h-10 rounded border border-neutral-200 bg-neutral-100 overflow-hidden flex items-center justify-center shrink-0 cursor-pointer hover:border-neutral-400 transition-colors"
                        title="View details"
                      >
                        {asset.imageUrl ? (
                          <img
                            src={asset.imageUrl}
                            alt={asset.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <ImageIcon className="w-4 h-4 text-neutral-400" />
                        )}
                      </Link>

                      <div className="min-w-0">
                        <Link
                          href={`/assets/${asset.id}`}
                          className="text-xs font-semibold text-neutral-900 hover:text-emerald-700 text-left truncate block transition-colors"
                        >
                          {asset.name}
                        </Link>
                        <div className="text-[11px] text-neutral-400 font-mono mt-0.5 truncate">
                          SN: {asset.serialNumber} • <span className="text-neutral-600">{asset.location}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {asset.loanStatus === 'on_loan' ? (
                        <span className="inline-flex px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-300">
                          On Loan
                        </span>
                      ) : (
                        <span
                          className={`inline-flex px-2 py-0.5 rounded text-[10px] font-medium ${
                            asset.status === 'operational'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : asset.status === 'in_use'
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}
                        >
                          {asset.status === 'operational'
                            ? 'Operational'
                            : asset.status === 'in_use'
                            ? 'In Production'
                            : 'Maintenance'}
                        </span>
                      )}

                      <RowActionMenu
                        onViewDetails={() => router.push(`/assets/${asset.id}`)}
                        onEdit={() => router.push(`/assets/${asset.id}/edit`)}
                        onDelete={() => deleteAsset(asset.id)}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Scheduled & Recent Maintenance */}
            <section className="bg-white border border-neutral-200 rounded overflow-hidden">
              <div className="p-4 border-b border-neutral-200 flex items-center justify-between">
                <div>
                  <h2 className="text-xs font-bold text-neutral-900 uppercase tracking-wider">
                    Service & Maintenance Log
                  </h2>
                  <p className="text-[11px] text-neutral-500">Recent audits, RMA & firmware upgrades</p>
                </div>
                <Link
                  href="/maintenance"
                  className="text-xs font-semibold text-neutral-600 hover:text-neutral-900 flex items-center gap-1 transition-colors"
                >
                  <span>Logs</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>

              <div className="divide-y divide-neutral-100">
                {maintenance.slice(0, 3).map((rec) => (
                  <div key={rec.id} className="p-3.5 space-y-1 hover:bg-neutral-50/70 transition-colors">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-neutral-900">{rec.assetName}</span>
                      <span
                        className={`text-[10px] font-semibold px-1.5 py-0.2 rounded border ${
                          rec.status === 'Completed'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-blue-50 text-blue-700 border-blue-200'
                        }`}
                      >
                        {rec.status}
                      </span>
                    </div>
                    <div className="text-[11px] text-neutral-600">{rec.type} • {rec.notes}</div>
                    <div className="text-[10px] text-neutral-400 font-mono">
                      {rec.date} • Tech: <span className="text-neutral-700">{rec.technician}</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
