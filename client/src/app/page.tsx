'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/Header';
import { PageBanner } from '@/components/PageBanner';
import { useStock } from '@/context/StockContext';
import { LabThumbnail } from '@/components/LabThumbnail';
import { RowActionMenu } from '@/components/RowActionMenu';
import { exportToCsv } from '@/lib/exportCsv';
import { getRoomInventoryStats } from '@/lib/locationMatch';
import {
  Package,
  Router,
  ArrowRight,
  Building,
  ArrowLeftRight,
  Laptop,
  CheckCircle2,
  Plus,
  ShieldCheck,
  Copy,
  Check,
  Sparkles,
} from 'lucide-react';

function formatOverviewDate(val?: string) {
  if (!val) return '—';
  const d = new Date(val);
  if (Number.isNaN(d.getTime())) return val;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function DashboardPage() {
  const router = useRouter();
  const {
    stock,
    assets,
    locations,
    loans,
    deleteAsset,
    returnAsset,
    showToast,
  } = useStock();

  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const copyToClipboard = (text: string, label: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    showToast(`Copied ${label} to clipboard`);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const activeLoans = useMemo(() => loans.filter((l) => l.status === 'active'), [loans]);
  const lowStockItems = useMemo(() => stock.filter((i) => i.status !== 'in_stock'), [stock]);
  
  const totalHardwareUnits = useMemo(() => assets.reduce((sum, a) => sum + (a.totalUnits || 1), 0), [assets]);
  const totalStockUnits = useMemo(() => stock.reduce((sum, i) => sum + i.quantity, 0), [stock]);
  
  const {
    perRoomStats,
    totalRoomUnits,
    totalWorkingUnits,
    totalBrokenUnits,
    totalMaintenanceUnits,
  } = useMemo(() => {
    const mapped = locations.map((loc) => ({
      loc,
      stats: getRoomInventoryStats(loc, stock, assets),
    }));
    const allRoom = mapped.reduce((sum, entry) => sum + entry.stats.totalAllUnits, 0);
    const working = mapped.reduce((sum, entry) => sum + entry.stats.totalWorkingUnits, 0);
    const broken = mapped.reduce((sum, entry) => sum + entry.stats.totalBrokenCount, 0);
    const maint = mapped.reduce((sum, entry) => sum + entry.stats.totalMaintenanceCount, 0);
    return {
      perRoomStats: mapped,
      totalRoomUnits: allRoom,
      totalWorkingUnits: working,
      totalBrokenUnits: broken,
      totalMaintenanceUnits: maint,
    };
  }, [locations, stock, assets]);

  const totalDepartmentUnits = totalStockUnits + totalHardwareUnits;
  const operationalFleetRate = totalRoomUnits > 0 ? Math.round((totalWorkingUnits / totalRoomUnits) * 100) : 100;

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const overdueLoansCount = useMemo(
    () => activeLoans.filter((l) => l.expectedReturnDate && l.expectedReturnDate < todayStr).length,
    [activeLoans, todayStr]
  );

  const handleExportExecutiveSummary = () => {
    const summaryRows = [
      {
        'Metric Category': 'General System Fleet',
        'Parameter': 'Total Active Laboratories',
        'Value': locations.length,
        'Notes': 'Engineering Block A Classrooms & Specialized Labs',
      },
      {
        'Metric Category': 'General System Fleet',
        'Parameter': 'Total Managed Units',
        'Value': totalDepartmentUnits,
        'Notes': `${totalStockUnits} Depot Stock + ${totalRoomUnits} Classroom Stationed Items`,
      },
      {
        'Metric Category': 'General System Fleet',
        'Parameter': 'Classroom Fleet Health Rate',
        'Value': `${operationalFleetRate}%`,
        'Notes': `${totalWorkingUnits} Operational, ${totalBrokenUnits} Broken, ${totalMaintenanceUnits} In Repair`,
      },
      {
        'Metric Category': 'Hardware Fleet',
        'Parameter': 'Serialized Hardware Models',
        'Value': assets.length,
        'Notes': `${totalHardwareUnits} total device units deployed across campus`,
      },
      {
        'Metric Category': 'Custody & Loans',
        'Parameter': 'Active Checkouts',
        'Value': activeLoans.length,
        'Notes': `${overdueLoansCount} overdue items currently flagged`,
      },
      {
        'Metric Category': 'Central Inventory',
        'Parameter': 'Inventory SKUs',
        'Value': stock.length,
        'Notes': `${lowStockItems.length} items flagged as low or out of stock`,
      },
    ];

    if (
      exportToCsv('faculty_executive_operations_summary', summaryRows, {
        sheetTitle: 'Executive Summary',
        reportTitle: 'Executive Laboratory Fleet & Operations Summary',
        reportSubtitle: 'Department KPIs, Facility Readiness & Loan Oversight',
      })
    ) {
      showToast('Executive operations workbook exported to Excel (.xlsx)');
    }
  };

  const handleQuickReturn = (loanId: string, assetName: string) => {
    returnAsset(loanId);
    showToast(`Checked in "${assetName}" successfully`);
  };

  return (
    <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-neutral-50/40">
      {/* Top Header with Quick Actions & Export */}
      <Header
        title="Department Overview"
        subtitle="Department of Computer Science"
        actionLabel="Register Equipment"
        onAction={() => router.push('/assets/create')}
        onExport={handleExportExecutiveSummary}
      />

      <div className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-6 w-full">
        {/* ================= 1. DEPARTMENT SUMMARY BANNER ================= */}
        <PageBanner
          eyebrow="Department of Computer Science · Education & Lab Stock"
          icon={<ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />}
          title="CS Laboratories & Teaching Equipment Inventory"
          description="Track classroom computers, networking hardware, teaching consumables, and student/faculty checkouts across Computer Science labs."
          stats={[
            { label: 'CS Labs', value: locations.length },
            { label: 'Managed Units', value: totalDepartmentUnits.toLocaleString(), tone: 'emerald' },
            { label: 'Lab Health', value: `${operationalFleetRate}%`, tone: operationalFleetRate >= 90 ? 'emerald' : 'amber' },
            {
              label: 'Active Loans',
              value: overdueLoansCount > 0 ? `${activeLoans.length} (${overdueLoansCount} Late)` : activeLoans.length,
              tone: overdueLoansCount > 0 ? 'rose' : activeLoans.length > 0 ? 'amber' : 'default',
            },
          ]}
        />

        {/* ================= 2. FOUR EXECUTIVE KPI CARDS ================= */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Hardware Fleet */}
          <Link
            href="/assets"
            className="group bg-white border border-neutral-200/80 hover:border-neutral-300 rounded-2xl p-4.5 sm:p-5 shadow-2xs hover:shadow-xs transition-all block relative overflow-hidden"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider">
                Hardware Fleet
              </span>
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-100 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Router className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-extrabold text-neutral-900 mt-2.5 font-mono">
              {assets.length} <span className="text-xs font-semibold text-neutral-500 font-sans">Models</span>
            </div>
            <div className="text-[11px] text-neutral-500 mt-2 flex items-center justify-between pt-2 border-t border-neutral-100 font-medium">
              <span>{totalHardwareUnits} Units Installed</span>
              <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-md text-[10px]">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                {assets.length > 0
                  ? Math.round((assets.filter((a) => a.status !== 'maintenance').length / assets.length) * 100)
                  : 100}% Active
              </span>
            </div>
          </Link>

          {/* Card 2: Laboratory Facilities */}
          <Link
            href="/locations"
            className="group bg-white border border-neutral-200/80 hover:border-neutral-300 rounded-2xl p-4.5 sm:p-5 shadow-2xs hover:shadow-xs transition-all block relative overflow-hidden"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider">
                Classrooms & Labs
              </span>
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 border border-blue-100 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Building className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-extrabold text-neutral-900 mt-2.5 font-mono">
              {locations.length} <span className="text-xs font-semibold text-neutral-500 font-sans">Facilities</span>
            </div>
            <div className="text-[11px] text-neutral-500 mt-2 flex items-center justify-between pt-2 border-t border-neutral-100 font-medium">
              <span>{locations.filter((l) => l.type !== 'STORAGE').length} Labs · {locations.filter((l) => l.type === 'STORAGE').length} Depot</span>
              <span className="text-blue-700 font-semibold">
                {totalRoomUnits} Equipment Units
              </span>
            </div>
          </Link>

          {/* Card 3: Custody & Loans */}
          <Link
            href="/loans"
            className="group bg-white border border-neutral-200/80 hover:border-neutral-300 rounded-2xl p-4.5 sm:p-5 shadow-2xs hover:shadow-xs transition-all block relative overflow-hidden"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider">
                Device Loans
              </span>
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center border group-hover:scale-105 transition-transform ${
                activeLoans.length > 0
                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                  : 'bg-neutral-100 text-neutral-600 border-neutral-200'
              }`}>
                <Laptop className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-extrabold text-neutral-900 mt-2.5 font-mono">
              {activeLoans.length} <span className="text-xs font-semibold text-neutral-500 font-sans">Checked Out</span>
            </div>
            <div className="text-[11px] text-neutral-500 mt-2 flex items-center justify-between pt-2 border-t border-neutral-100 font-medium">
              <span>Student & Staff Custody</span>
              <span className={`inline-flex items-center gap-1 font-semibold px-2 py-0.5 rounded-md text-[10px] ${
                overdueLoansCount > 0
                  ? 'text-rose-700 bg-rose-50'
                  : 'text-emerald-700 bg-emerald-50'
              }`}>
                {overdueLoansCount > 0 ? `${overdueLoansCount} Overdue` : 'All On Time'}
              </span>
            </div>
          </Link>

          {/* Card 4: Inventory & Supplies */}
          <Link
            href="/stock"
            className="group bg-white border border-neutral-200/80 hover:border-neutral-300 rounded-2xl p-4.5 sm:p-5 shadow-2xs hover:shadow-xs transition-all block relative overflow-hidden"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider">
                Central Inventory
              </span>
              <div className="w-8 h-8 rounded-lg bg-neutral-100 text-neutral-700 border border-neutral-200 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Package className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-extrabold text-neutral-900 mt-2.5 font-mono">
              {stock.length} <span className="text-xs font-semibold text-neutral-500 font-sans">Catalog SKUs</span>
            </div>
            <div className="text-[11px] text-neutral-500 mt-2 flex items-center justify-between pt-2 border-t border-neutral-100 font-medium">
              <span>{totalStockUnits.toLocaleString()} Depot Units</span>
              <span className={`font-semibold ${
                lowStockItems.length > 0 ? 'text-amber-700' : 'text-emerald-700'
              }`}>
                {lowStockItems.length > 0 ? `${lowStockItems.length} Low Stock` : 'Stock Optimal'}
              </span>
            </div>
          </Link>
        </section>

        {/* ================= 3. QUICK OPERATIONS STRIP ================= */}
        <section className="bg-white border border-neutral-200/80 rounded-2xl p-4 sm:p-5 shadow-2xs">
          <div className="flex items-center justify-between mb-3.5">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              <h3 className="text-xs font-bold text-neutral-900 uppercase tracking-wider">
                Quick Operations & Workflows
              </h3>
            </div>
            <span className="text-[11px] font-medium text-neutral-400">Department Control Hub</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {/* Tile 1: Lend Device */}
            <Link
              href="/loans/checkout"
              className="flex items-center gap-3 p-3 rounded-xl border border-neutral-200/80 hover:border-neutral-900 hover:bg-neutral-50 transition-all text-left group shadow-2xs"
            >
              <div className="w-9 h-9 rounded-lg bg-amber-50 border border-amber-200/80 flex items-center justify-center text-amber-700 shrink-0 group-hover:bg-amber-100 transition-colors">
                <Laptop className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-neutral-900 truncate">Lend Device</div>
                <div className="text-[11px] text-neutral-500 truncate">Check-out equipment</div>
              </div>
            </Link>

            {/* Tile 2: Relocate Asset */}
            <Link
              href="/loans/relocate"
              className="flex items-center gap-3 p-3 rounded-xl border border-neutral-200/80 hover:border-neutral-900 hover:bg-neutral-50 transition-all text-left group shadow-2xs"
            >
              <div className="w-9 h-9 rounded-lg bg-blue-50 border border-blue-200/80 flex items-center justify-center text-blue-700 shrink-0 group-hover:bg-blue-100 transition-colors">
                <ArrowLeftRight className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-neutral-900 truncate">Relocate Asset</div>
                <div className="text-[11px] text-neutral-500 truncate">Transfer between labs</div>
              </div>
            </Link>

            {/* Tile 3: Add Stock */}
            <Link
              href="/stock/create"
              className="flex items-center gap-3 p-3 rounded-xl border border-neutral-200/80 hover:border-neutral-900 hover:bg-neutral-50 transition-all text-left group shadow-2xs"
            >
              <div className="w-9 h-9 rounded-lg bg-neutral-100 border border-neutral-200 flex items-center justify-center text-neutral-800 shrink-0 group-hover:bg-neutral-200 transition-colors">
                <Package className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-neutral-900 truncate">Add Inventory</div>
                <div className="text-[11px] text-neutral-500 truncate">New stock SKU</div>
              </div>
            </Link>

            {/* Tile 4: Add Asset */}
            <Link
              href="/assets/create"
              className="flex items-center gap-3 p-3 rounded-xl border border-neutral-200/80 hover:border-neutral-900 hover:bg-neutral-50 transition-all text-left group shadow-2xs"
            >
              <div className="w-9 h-9 rounded-lg bg-emerald-50 border border-emerald-200/80 flex items-center justify-center text-emerald-700 shrink-0 group-hover:bg-emerald-100 transition-colors">
                <Plus className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-neutral-900 truncate">Register Asset</div>
                <div className="text-[11px] text-neutral-500 truncate">New serialized unit</div>
              </div>
            </Link>
          </div>
        </section>

        {/* ================= 4. TWO-COLUMN CORE GRID ================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* ================= LEFT COLUMN (7 COLS): ACTIVE LOANS & LABS ================= */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Active Device Loans Widget */}
            <section className="bg-white border border-neutral-200/80 rounded-2xl overflow-hidden shadow-2xs">
              <div className="p-4 sm:p-5 border-b border-neutral-200/80 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Laptop className="w-4 h-4 text-amber-600" />
                  <h2 className="text-xs font-bold text-neutral-900 uppercase tracking-wider">
                    Active Equipment Loans
                  </h2>
                  <span className="font-mono text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200/70 px-2 py-0.5 rounded-md">
                    {activeLoans.length}
                  </span>
                </div>
                <Link
                  href="/loans"
                  className="text-xs font-semibold text-neutral-600 hover:text-neutral-900 flex items-center gap-1 transition-colors"
                >
                  <span>Manage loans</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {activeLoans.length === 0 ? (
                <div className="p-8 text-center bg-neutral-50/40 space-y-2">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
                  <div className="text-xs font-bold text-neutral-900">All Equipment In Lab Custody</div>
                  <p className="text-[11px] text-neutral-500 max-w-sm mx-auto">
                    There are currently no active student or faculty device checkouts. All assets are safely stored in their designated laboratory facilities.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-neutral-100">
                  {activeLoans.map((loan) => {
                    const isOverdue = loan.expectedReturnDate && loan.expectedReturnDate < todayStr;
                    const linkedStock =
                      loan.itemType === 'stock' || loan.stockId
                        ? stock.find(
                            (s) =>
                              s.id === loan.stockId ||
                              s.code === loan.serialNumber ||
                              s.name === loan.assetName
                          )
                        : null;
                    const loanTargetHref = linkedStock
                      ? `/stock/${linkedStock.id}`
                      : `/assets/${loan.assetId}`;
                    return (
                      <div
                        key={loan.id}
                        className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-neutral-50/70 transition-colors"
                      >
                        <div className="min-w-0 flex-1 space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Link
                              href={loanTargetHref}
                              className="text-xs font-bold text-neutral-900 hover:text-emerald-700 transition-colors truncate"
                            >
                              {loan.assetName}
                            </Link>

                            <button
                              type="button"
                              onClick={() => copyToClipboard(loan.serialNumber, 'Serial Number', `loan-sn-${loan.id}`)}
                              className="inline-flex items-center gap-1 font-mono text-[10px] text-neutral-600 bg-neutral-100 hover:bg-neutral-200/80 px-2 py-0.5 rounded border border-neutral-200 transition-colors cursor-pointer"
                              title="Click to copy serial number"
                            >
                              <span>SN: {loan.serialNumber}</span>
                              {copiedKey === `loan-sn-${loan.id}` ? (
                                <Check className="w-3 h-3 text-emerald-600" />
                              ) : (
                                <Copy className="w-3 h-3 text-neutral-400" />
                              )}
                            </button>

                            {isOverdue && (
                              <span className="text-[10px] font-bold uppercase tracking-wider bg-rose-50 text-rose-700 border border-rose-200 px-1.5 py-0.2 rounded">
                                Overdue
                              </span>
                            )}
                          </div>

                          <div className="text-xs text-neutral-600 flex items-center gap-1.5 flex-wrap">
                            <span>Borrower:</span>
                            <span className="font-semibold text-neutral-900">{loan.borrowerName}</span>
                            <span className="text-neutral-400">({loan.borrowerRole})</span>
                            {loan.courseOrClass && (
                              <>
                                <span className="text-neutral-300">·</span>
                                <span className="text-neutral-500">{loan.courseOrClass}</span>
                              </>
                            )}
                          </div>

                          <div className="text-[10px] text-neutral-400 font-mono flex items-center gap-2">
                            <span>Out: {formatOverviewDate(loan.borrowDate)}</span>
                            <span>·</span>
                            <span>Due: <strong className={isOverdue ? 'text-rose-600' : 'text-neutral-700'}>{formatOverviewDate(loan.expectedReturnDate)}</strong></span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                          <button
                            type="button"
                            onClick={() => handleQuickReturn(loan.id, loan.assetName)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg transition-colors cursor-pointer shadow-xs"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Check-In</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            {/* Connected Laboratories & Room Allocations */}
            <section className="bg-white border border-neutral-200/80 rounded-2xl overflow-hidden shadow-2xs">
              <div className="p-4 sm:p-5 border-b border-neutral-200/80 flex items-center justify-between">
                <div>
                  <h2 className="text-xs font-bold text-neutral-900 uppercase tracking-wider">
                    Classrooms & Specialized Laboratories
                  </h2>
                  <p className="text-[11px] text-neutral-500 mt-0.5">Facility status and workstation readiness across CS labs &amp; classrooms</p>
                </div>
                <Link
                  href="/locations"
                  className="text-xs font-semibold text-neutral-600 hover:text-neutral-900 flex items-center gap-1 transition-colors"
                >
                  <span>View all {locations.length} rooms</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="p-4 sm:p-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
                {perRoomStats.map(({ loc, stats }) => {
                  const totalCount = stats.totalAllUnits;

                  return (
                    <Link
                      key={loc.id}
                      href={`/locations/${loc.id}`}
                      className="p-3.5 rounded-xl border border-neutral-200/80 hover:border-neutral-900 hover:bg-neutral-50/70 transition-all block group relative shadow-2xs"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono text-xs font-bold text-neutral-900 bg-neutral-100 px-1.5 py-0.5 rounded border border-neutral-200/80">
                              {loc.room}
                            </span>
                            <span className="text-[10px] font-bold uppercase text-neutral-500 tracking-wider">
                              {loc.type?.replace('_', ' ') || 'LAB'}
                            </span>
                          </div>
                          <div className="text-xs font-bold text-neutral-900 group-hover:text-emerald-700 transition-colors mt-1.5 truncate">
                            {loc.name}
                          </div>
                        </div>

                        {stats.totalBrokenCount > 0 ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200/80 shrink-0">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                            {stats.totalBrokenCount} Broken
                          </span>
                        ) : stats.totalMaintenanceCount > 0 ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200/80 shrink-0">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                            {stats.totalMaintenanceCount} In Repair
                          </span>
                        ) : stats.lowStockCount > 0 ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200/80 shrink-0">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                            {stats.lowStockCount} Low Stock
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200/80 shrink-0">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            All Operational
                          </span>
                        )}
                      </div>

                      <div className="mt-3 pt-2.5 border-t border-neutral-100 flex items-center justify-between text-[11px] text-neutral-500 font-medium">
                        <span>{loc.building}</span>
                        <span className="font-mono text-neutral-700">{totalCount} units</span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </section>
          </div>

          {/* ================= RIGHT COLUMN (5 COLS): HARDWARE FLEET & INVENTORY ================= */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Faculty Hardware Directory */}
            <section className="bg-white border border-neutral-200/80 rounded-2xl overflow-hidden shadow-2xs">
              <div className="p-4 sm:p-5 border-b border-neutral-200/80 flex items-center justify-between">
                <div>
                  <h2 className="text-xs font-bold text-neutral-900 uppercase tracking-wider">
                    Serialized Hardware Fleet
                  </h2>
                  <p className="text-[11px] text-neutral-500 mt-0.5">High-value compute &amp; infrastructure units</p>
                </div>
                <Link
                  href="/assets"
                  className="text-xs font-semibold text-neutral-600 hover:text-neutral-900 flex items-center gap-1 transition-colors"
                >
                  <span>View all ({assets.length})</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="divide-y divide-neutral-100">
                {assets.slice(0, 5).map((asset) => (
                  <div
                    key={asset.id}
                    className="p-3.5 sm:p-4 flex items-center justify-between gap-3 hover:bg-neutral-50/70 transition-colors group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Link
                        href={`/assets/${asset.id}`}
                        className="w-10 h-10 rounded-lg border border-neutral-200 bg-neutral-100 overflow-hidden flex items-center justify-center shrink-0 cursor-pointer hover:border-neutral-400 transition-colors shadow-2xs"
                        title="View details"
                      >
                        <LabThumbnail
                          src={asset.imageUrl}
                          alt={asset.name}
                          size="thumb"
                          fallbackType="item"
                          className="w-full h-full object-cover"
                        />
                      </Link>

                      <div className="min-w-0">
                        <Link
                          href={`/assets/${asset.id}`}
                          className="text-xs font-semibold text-neutral-900 hover:text-emerald-700 text-left truncate block transition-colors"
                        >
                          {asset.name}
                        </Link>
                        <div className="text-[11px] text-neutral-400 font-mono mt-0.5 truncate">
                          SN: {asset.serialNumber} · <span className="text-neutral-600 font-sans">{asset.location}</span>
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
                          className={`inline-flex px-2 py-0.5 rounded text-[10px] font-semibold border ${
                            asset.status === 'operational'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              : asset.status === 'in_use'
                              ? 'bg-blue-50 text-blue-800 border-blue-200'
                              : 'bg-amber-50 text-amber-800 border-amber-200'
                          }`}
                        >
                          {asset.status === 'operational'
                            ? 'Operational'
                            : asset.status === 'in_use'
                            ? 'In Use'
                            : 'In Repair'}
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

            {/* Consumables & Inventory Health */}
            <section className="bg-white border border-neutral-200/80 rounded-2xl overflow-hidden shadow-2xs">
              <div className="p-4 sm:p-5 border-b border-neutral-200/80 flex items-center justify-between">
                <div>
                  <h2 className="text-xs font-bold text-neutral-900 uppercase tracking-wider">
                    Central Inventory &amp; Consumables
                  </h2>
                  <p className="text-[11px] text-neutral-500 mt-0.5">Replacement cables, connectors, tools and bench supplies</p>
                </div>
                <Link
                  href="/stock"
                  className="text-xs font-semibold text-neutral-600 hover:text-neutral-900 flex items-center gap-1 transition-colors shrink-0"
                >
                  <span>View stock</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {lowStockItems.length > 0 ? (
                <div className="divide-y divide-neutral-100">
                  {lowStockItems.map((item) => (
                    <Link
                      key={item.id}
                      href={`/stock/${item.id}`}
                      className="p-3.5 sm:p-4 flex items-center justify-between gap-3 hover:bg-neutral-50/70 transition-colors"
                    >
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-neutral-900 truncate">{item.name}</div>
                        <div className="text-[11px] text-neutral-400 font-mono mt-0.5 truncate">
                          SKU: {item.code} · <span className="text-neutral-600">{item.location}</span>
                        </div>
                      </div>
                      <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200 shrink-0 font-mono">
                        {item.quantity} {item.unit}
                      </span>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="p-5 bg-emerald-50/40 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-emerald-100 border border-emerald-200 flex items-center justify-center shrink-0">
                      <CheckCircle2 className="w-5 h-5 text-emerald-700" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-emerald-950">
                        All {stock.length} Inventory Categories Stocked
                      </div>
                      <div className="text-[11px] text-emerald-800 mt-0.5">
                        Adequate replacement stock for student benches, patch cables, and lab tools.
                      </div>
                    </div>
                  </div>
                  <Link
                    href="/stock"
                    className="px-3 py-1.5 text-xs font-semibold text-neutral-900 bg-white border border-neutral-300 hover:bg-neutral-50 rounded-lg transition-colors shrink-0 shadow-2xs"
                  >
                    Catalog
                  </Link>
                </div>
              )}
            </section>

          </div>
        </div>
      </div>
    </div>
  );
}
