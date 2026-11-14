'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/Header';
import { PageBanner } from '@/components/PageBanner';
import { useStock } from '@/context/StockContext';
import { useAuth } from '@/context/AuthContext';
import { RowActionMenu } from '@/components/RowActionMenu';
import { Dropdown, DropdownOption } from '@/components/Dropdown';
import { exportToCsv } from '@/lib/exportCsv';
import { LabThumbnail } from '@/components/LabThumbnail';
import { MockAsset } from '@/types';
import { AssetAllocationSummary, doesLocationMatchRoom, getAssetAllocationSummary } from '@/lib/locationMatch';
import { Search, Router, ChevronDown, Check, X } from 'lucide-react';

type AssetStatusValue = MockAsset['status'];
type AssetStatusFilter = 'all' | AssetStatusValue | 'on_loan';

const ASSET_STATUS_ORDER: AssetStatusValue[] = ['operational', 'in_use', 'maintenance'];

const ASSET_STATUS_META: Record<
  AssetStatusValue,
  {
    label: string;
    hint: string;
    dotClass: string;
    badgeClass: string;
  }
> = {
  operational: {
    label: 'Operational',
    hint: 'Ready & functioning normally',
    dotClass: 'bg-emerald-500',
    badgeClass: 'bg-emerald-50/90 text-emerald-800 border-emerald-200 hover:bg-emerald-100/70',
  },
  in_use: {
    label: 'In Use',
    hint: 'Actively deployed in class or lab',
    dotClass: 'bg-blue-500',
    badgeClass: 'bg-blue-50/90 text-blue-800 border-blue-200 hover:bg-blue-100/70',
  },
  maintenance: {
    label: 'In Repair',
    hint: 'Under servicing or offline',
    dotClass: 'bg-amber-500',
    badgeClass: 'bg-amber-50/90 text-amber-800 border-amber-200 hover:bg-amber-100/70',
  },
};

function AssetStatusControl({
  asset,
  isAllowed,
  onStatusChange,
}: {
  asset: MockAsset;
  isAllowed: boolean;
  onStatusChange: (asset: MockAsset, nextStatus: AssetStatusValue) => void;
}) {
  const [open, setOpen] = useState(false);
  const [menuPos, setMenuPos] = useState<{ top: number; left: number } | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;

    function handleClickOutside(e: MouseEvent) {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
        setMenuPos(null);
      }
    }

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setOpen(false);
        setMenuPos(null);
      }
    }

    function handleScrollOrResize(e: Event) {
      if (menuRef.current && menuRef.current.contains(e.target as Node)) return;
      setOpen(false);
      setMenuPos(null);
    }

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    window.addEventListener('scroll', handleScrollOrResize, true);
    window.addEventListener('resize', handleScrollOrResize);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('scroll', handleScrollOrResize, true);
      window.removeEventListener('resize', handleScrollOrResize);
    };
  }, [open]);

  const currentMeta = ASSET_STATUS_META[asset.status] || ASSET_STATUS_META.operational;

  const toggleMenu = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (!isAllowed || !buttonRef.current) return;

    if (open) {
      setOpen(false);
      setMenuPos(null);
      return;
    }

    const rect = buttonRef.current.getBoundingClientRect();
    const menuWidth = 232;
    const menuHeight = 192;
    const spaceBelow = window.innerHeight - rect.bottom;
    const top =
      spaceBelow < menuHeight && rect.top > menuHeight
        ? Math.max(10, rect.top - menuHeight - 6)
        : rect.bottom + 6;
    const left = Math.max(10, Math.min(rect.left, window.innerWidth - menuWidth - 10));

    setMenuPos({ top, left });
    setOpen(true);
  };

  const statusMenu =
    open && menuPos && typeof document !== 'undefined'
      ? createPortal(
          <div
            ref={menuRef}
            role="menu"
            style={{
              position: 'fixed',
              top: `${menuPos.top}px`,
              left: `${menuPos.left}px`,
              width: '232px',
              zIndex: 99999,
            }}
            className="bg-white border border-neutral-200 rounded-xl shadow-2xl p-1.5 ring-1 ring-black/5 select-none"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-neutral-400">
              Update Equipment Status
            </div>
            <div className="space-y-0.5">
              {ASSET_STATUS_ORDER.map((statusKey) => {
                const optionMeta = ASSET_STATUS_META[statusKey];
                const isActive = asset.status === statusKey;
                return (
                  <button
                    key={statusKey}
                    type="button"
                    role="menuitem"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!isActive) {
                        onStatusChange(asset, statusKey);
                      }
                      setOpen(false);
                      setMenuPos(null);
                    }}
                    className={`w-full text-left px-2.5 py-2 rounded-lg flex items-start justify-between gap-2 transition-colors cursor-pointer ${
                      isActive ? 'bg-neutral-100/90' : 'hover:bg-neutral-50'
                    }`}
                  >
                    <div className="flex items-start gap-2 min-w-0">
                      <span className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${optionMeta.dotClass}`} />
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-neutral-900">{optionMeta.label}</div>
                        <div className="text-[11px] text-neutral-500 leading-tight mt-0.5">
                          {optionMeta.hint}
                        </div>
                      </div>
                    </div>
                    {isActive && <Check className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>,
          document.body
        )
      : null;

  return (
    <div className="flex flex-col items-start gap-1.5">
      {isAllowed ? (
        <button
          ref={buttonRef}
          type="button"
          onClick={toggleMenu}
          aria-expanded={open}
          aria-haspopup="menu"
          title="Click to change equipment status"
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border transition-colors cursor-pointer whitespace-nowrap ${currentMeta.badgeClass}`}
        >
          <span className={`w-2 h-2 rounded-full shrink-0 ${currentMeta.dotClass}`} />
          <span>{currentMeta.label}</span>
          <ChevronDown className={`w-3 h-3 opacity-60 transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>
      ) : (
        <span
          title="Read-only: stationed outside your assigned laboratory rooms"
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border whitespace-nowrap opacity-90 ${currentMeta.badgeClass.replace(/hover:[^\s]+/g, '')}`}
        >
          <span className={`w-2 h-2 rounded-full shrink-0 ${currentMeta.dotClass}`} />
          <span>{currentMeta.label}</span>
        </span>
      )}

      {asset.loanStatus === 'on_loan' && (
        <div
          title={
            asset.currentBorrower
              ? `Checked out to ${asset.currentBorrower}${asset.loanDueDate ? ` • Due ${asset.loanDueDate}` : ''}`
              : 'Currently checked out on loan'
          }
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-amber-50/80 text-amber-800 border border-amber-200/80 max-w-[200px]"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
          <span className="whitespace-nowrap">On Loan</span>
          {asset.currentBorrower && (
            <span className="text-amber-700/80 truncate">· {asset.currentBorrower}</span>
          )}
        </div>
      )}

      {statusMenu}
    </div>
  );
}

export default function AssetsPage() {
  const router = useRouter();
  const { assets, updateAsset, deleteAsset, locations } = useStock();
  const { canManageLocation } = useAuth();
  const [filterText, setFilterText] = useState('');
  const [labFilter, setLabFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<AssetStatusFilter>('all');

  const assetsStats = useMemo(() => {
    const totalUnits = assets.reduce((sum, a) => sum + (a.totalUnits ?? 1), 0);
    const operationalUnits = assets
      .filter((a) => a.status === 'operational')
      .reduce((sum, a) => sum + (a.totalUnits ?? 1), 0);
    const inUseUnits = assets
      .filter((a) => a.status === 'in_use')
      .reduce((sum, a) => sum + (a.totalUnits ?? 1), 0);
    const maintenanceUnits = assets
      .filter((a) => a.status === 'maintenance')
      .reduce((sum, a) => sum + (a.totalUnits ?? 1), 0);
    const onLoanUnits = assets
      .filter((a) => a.loanStatus === 'on_loan')
      .reduce((sum, a) => sum + (a.totalUnits ?? 1), 0);
    const workingUnits = operationalUnits + inUseUnits;
    const healthRate = totalUnits > 0 ? Math.round((workingUnits / totalUnits) * 100) : 100;

    return {
      totalUnits,
      operationalUnits,
      inUseUnits,
      maintenanceUnits,
      onLoanUnits,
      healthRate,
    };
  }, [assets]);

  const labOptions: DropdownOption[] = [
    { label: 'All Laboratories', value: 'all' },
    ...locations.map((loc) => ({
      label: `${loc.name} (${loc.room})`,
      value: loc.room,
    })),
  ];

  const assetSummaryMap = useMemo(() => {
    const map = new Map<string, AssetAllocationSummary>();
    assets.forEach((asset) => {
      map.set(asset.id, getAssetAllocationSummary(asset, locations));
    });
    return map;
  }, [assets, locations]);

  // Filter by search + lab first so status tab counts reflect current search & lab scope
  const searchAndLabAssets = useMemo(() => {
    const q = filterText.trim().toLowerCase();
    const selectedLoc =
      labFilter !== 'all' && labFilter !== 'my_assigned'
        ? locations.find((l) => l.room.toLowerCase() === labFilter.toLowerCase())
        : undefined;

    return assets.filter((asset) => {
      const summary = assetSummaryMap.get(asset.id);
      const matchesQuery =
        !q ||
        asset.name.toLowerCase().includes(q) ||
        asset.serialNumber.toLowerCase().includes(q) ||
        asset.model.toLowerCase().includes(q) ||
        asset.location.toLowerCase().includes(q) ||
        (summary?.allocations.some((a) => a.label.toLowerCase().includes(q)) ?? false) ||
        (asset.currentBorrower || '').toLowerCase().includes(q);

      const matchesLab =
        labFilter === 'all'
          ? true
          : labFilter === 'my_assigned'
          ? canManageLocation(asset.location) ||
            (summary?.allocations.some((a) => canManageLocation(a.label)) ?? false)
          : (selectedLoc
              ? doesLocationMatchRoom(asset.location, selectedLoc)
              : asset.location.toLowerCase().includes(labFilter.toLowerCase())) ||
            (summary?.allocations.some(
              (a) => a.location.room.toLowerCase() === labFilter.toLowerCase()
            ) ??
              false);

      return matchesQuery && matchesLab;
    });
  }, [assets, assetSummaryMap, locations, filterText, labFilter, canManageLocation]);

  const statusCounts = useMemo(
    () => ({
      all: searchAndLabAssets.length,
      operational: searchAndLabAssets.filter((a) => a.status === 'operational').length,
      in_use: searchAndLabAssets.filter((a) => a.status === 'in_use').length,
      maintenance: searchAndLabAssets.filter((a) => a.status === 'maintenance').length,
      on_loan: searchAndLabAssets.filter((a) => a.loanStatus === 'on_loan').length,
    }),
    [searchAndLabAssets]
  );

  const filteredAssets = useMemo(() => {
    return searchAndLabAssets
      .filter((asset) => {
        if (statusFilter === 'all') return true;
        if (statusFilter === 'on_loan') return asset.loanStatus === 'on_loan';
        return asset.status === statusFilter;
      })
      .sort((a, b) => {
        // Hardware in handled laboratories comes first; unhandled laboratories go to the bottom
        const aAllowed = canManageLocation(a.location);
        const bAllowed = canManageLocation(b.location);
        if (aAllowed && !bAllowed) return -1;
        if (!aAllowed && bAllowed) return 1;
        return 0;
      });
  }, [searchAndLabAssets, statusFilter, canManageLocation]);

  const hasActiveFilters = filterText.trim().length > 0 || labFilter !== 'all' || statusFilter !== 'all';

  const handleQuickStatusChange = (asset: MockAsset, nextStatus: AssetStatusValue) => {
    updateAsset({
      ...asset,
      status: nextStatus,
    });
  };

  const handleExport = () => {
    exportToCsv(
      'csd_stock_hardware_assets',
      filteredAssets.map((a) => ({
        'Asset ID': a.id,
        'Equipment Name': a.name,
        'Model / Specification': a.model,
        'Serial / Asset Tag': a.serialNumber,
        'Total Units': a.totalUnits ?? 1,
        'Unit Type': a.unitType ?? 'Units',
        'Laboratory Location': a.location,
        'Operational Status': a.status,
        'Loan Status': a.loanStatus === 'on_loan' ? 'Checked Out' : 'Available',
        'Current Borrower': a.currentBorrower || 'None',
        'Due Date': a.loanDueDate || '',
        'Next Calibration / Audit': a.nextCalibration || '',
        'Description / Notes': a.description || '',
      })),
      {
        sheetTitle: 'Hardware Assets',
        reportTitle: 'Serialized Hardware Assets Register',
        reportSubtitle: 'Workstations, Networking Equipment & Institutional Calibration Schedule',
      }
    );
  };

  return (
    <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
      <Header
        title="Serialized Hardware Assets"
        subtitle="Workstations, Cisco Switches, Routers, Projectors & Lab Equipment"
        actionLabel="Register Hardware Asset"
        onAction={() => router.push('/assets/create')}
        onExport={handleExport}
      />

      <div className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-6 w-full">
        {/* Hardware Assets Banner */}
        <PageBanner
          eyebrow="Department of Computer Science · Hardware Assets"
          icon={<Router className="w-3.5 h-3.5 text-emerald-600" />}
          title="Workstations, Networking & Lab Equipment"
          description="Serialized computers, network switches, routers, and projectors assigned to Computer Science labs and classrooms."
          stats={[
            { label: 'Total Units', value: assetsStats.totalUnits },
            { label: 'Operational', value: assetsStats.operationalUnits, tone: 'emerald' },
            { label: 'In Use', value: assetsStats.inUseUnits, tone: 'blue' },
            { label: 'In Repair', value: assetsStats.maintenanceUnits, tone: assetsStats.maintenanceUnits > 0 ? 'amber' : 'default' },
            { label: 'On Loan', value: assetsStats.onLoanUnits, tone: assetsStats.onLoanUnits > 0 ? 'amber' : 'default' },
            { label: 'Health', value: `${assetsStats.healthRate}%`, tone: assetsStats.healthRate >= 90 ? 'emerald' : 'amber' },
          ]}
        />

        <div className="bg-white border border-neutral-200/80 rounded-2xl shadow-2xs overflow-hidden">
          {/* Search, Lab Filter & Quick Status Tabs Toolbar */}
          <div className="p-4 border-b border-neutral-200 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 flex-wrap flex-1">
                <div className="relative w-full sm:w-80">
                  <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search equipment, serial, model or borrower..."
                    value={filterText}
                    onChange={(e) => setFilterText(e.target.value)}
                    className="w-full bg-white border border-neutral-300 text-neutral-900 text-xs pl-8 pr-7 py-1.5 rounded-xl focus:outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 transition-colors font-medium placeholder:text-neutral-400 shadow-2xs"
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

                <Dropdown
                  value={labFilter}
                  options={labOptions}
                  onChange={setLabFilter}
                  placeholder="Filter by Lab"
                  className="w-full sm:w-auto"
                  buttonClassName="rounded-xl py-1.5"
                />
              </div>

              <div className="flex items-center gap-3 text-xs text-neutral-500 shrink-0">
                {hasActiveFilters && (
                  <button
                    type="button"
                    onClick={() => {
                      setFilterText('');
                      setLabFilter('all');
                      setStatusFilter('all');
                    }}
                    className="text-xs font-medium text-neutral-600 hover:text-neutral-900 underline underline-offset-2 cursor-pointer"
                  >
                    Clear filters
                  </button>
                )}
                <span>
                  Showing <span className="font-semibold text-neutral-900">{filteredAssets.length}</span> devices
                </span>
              </div>
            </div>

            {/* 1-Click Status Filter Pills */}
            <div className="flex items-center gap-1.5 flex-wrap pt-2.5 border-t border-neutral-100">
              <span className="text-[11px] font-medium text-neutral-500 mr-1">Status:</span>
              {(
                [
                  { key: 'all', label: 'All Devices', count: statusCounts.all, dotClass: null },
                  { key: 'operational', label: ASSET_STATUS_META.operational.label, count: statusCounts.operational, dotClass: ASSET_STATUS_META.operational.dotClass },
                  { key: 'in_use', label: ASSET_STATUS_META.in_use.label, count: statusCounts.in_use, dotClass: ASSET_STATUS_META.in_use.dotClass },
                  { key: 'maintenance', label: ASSET_STATUS_META.maintenance.label, count: statusCounts.maintenance, dotClass: ASSET_STATUS_META.maintenance.dotClass },
                  { key: 'on_loan', label: 'On Loan', count: statusCounts.on_loan, dotClass: 'bg-amber-500 ring-2 ring-amber-200' },
                ] as const
              ).map((tab) => {
                const isActive = statusFilter === tab.key;
                return (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setStatusFilter(tab.key)}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors cursor-pointer ${
                      isActive
                        ? 'bg-neutral-900 text-white border-neutral-900 shadow-2xs'
                        : 'bg-neutral-50 text-neutral-700 border-neutral-200/80 hover:bg-neutral-100'
                    }`}
                  >
                    {tab.dotClass && <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${tab.dotClass}`} />}
                    <span>{tab.label}</span>
                    <span
                      className={`text-[10px] font-mono px-1.5 py-0.5 rounded-full leading-none ${
                        isActive ? 'bg-white/20 text-white' : 'bg-white text-neutral-500 border border-neutral-200/70'
                      }`}
                    >
                      {tab.count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Clean Responsive Table with Device Images */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs min-w-[760px]">
              <thead className="bg-neutral-50 border-b border-neutral-200 text-neutral-600 font-semibold">
                <tr>
                  <th className="py-3 px-4 w-12">Image</th>
                  <th className="py-3 px-4">Equipment Name</th>
                  <th className="py-3 px-4 text-center whitespace-nowrap">Total Units</th>
                  <th className="py-3 px-4 whitespace-nowrap">Serial / Tag</th>
                  <th className="py-3 px-4">Model & Specs</th>
                  <th className="py-3 px-4">Assigned Location</th>
                  <th className="py-3 px-4 whitespace-nowrap">Status</th>
                  <th className="py-3 px-4 text-right whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {filteredAssets.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-10 text-center text-neutral-500 space-y-2">
                      <div>No hardware assets found matching your filter criteria.</div>
                      {hasActiveFilters && (
                        <button
                          type="button"
                          onClick={() => {
                            setFilterText('');
                            setLabFilter('all');
                            setStatusFilter('all');
                          }}
                          className="text-xs font-semibold text-neutral-900 underline underline-offset-2 cursor-pointer"
                        >
                          Reset all filters
                        </button>
                      )}
                    </td>
                  </tr>
                ) : (
                  filteredAssets.map((asset) => {
                    const isAllowed = canManageLocation(asset.location);
                    return (
                      <tr key={asset.id} className="hover:bg-neutral-50/70 transition-colors group">
                        {/* Device Image Thumbnail with Direct Link */}
                        <td className="py-2.5 px-4">
                          <Link
                            href={`/assets/${asset.id}`}
                            className="w-10 h-10 rounded-lg border border-neutral-200 bg-neutral-100 overflow-hidden flex items-center justify-center shrink-0 cursor-pointer hover:border-neutral-400 transition-colors block"
                            title="Click to view full specifications"
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
                            className="font-semibold text-neutral-900 hover:text-emerald-700 text-left cursor-pointer transition-colors block"
                          >
                            {asset.name}
                          </Link>
                        </td>
                        <td className="py-3 px-4 text-center whitespace-nowrap">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-semibold bg-neutral-100 text-neutral-900 border border-neutral-200 whitespace-nowrap font-mono">
                            {asset.totalUnits ?? 1} {asset.unitType ?? 'Unit'}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono text-neutral-600 whitespace-nowrap">
                          <Link
                            href={`/assets/${asset.id}`}
                            className="hover:text-neutral-900 transition-colors"
                          >
                            {asset.serialNumber}
                          </Link>
                        </td>
                        <td className="py-3 px-4 text-neutral-600 font-mono text-[11px]">{asset.model}</td>
                        <td className="py-3 px-4 text-neutral-600">
                          {(() => {
                            const summary = assetSummaryMap.get(asset.id);
                            if (summary && summary.allocations.length > 0) {
                              return (
                                <div className="flex items-center gap-1 flex-wrap">
                                  {summary.allocations.map((alloc) => (
                                    <Link
                                      key={alloc.location.id}
                                      href={`/locations/${alloc.location.id}?tab=hardware`}
                                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-blue-50 text-blue-800 border border-blue-200/80 hover:bg-blue-100 transition-colors whitespace-nowrap"
                                    >
                                      <span>{alloc.location.room}</span>
                                      <span className="font-mono font-bold">({alloc.totalQty})</span>
                                    </Link>
                                  ))}
                                  {summary.unassignedUnits > 0 && (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-neutral-100 text-neutral-600 border border-neutral-200/80 whitespace-nowrap">
                                      +{summary.unassignedUnits} Unassigned
                                    </span>
                                  )}
                                </div>
                              );
                            }
                            return (
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span>{asset.location || 'Unassigned'}</span>
                              </div>
                            );
                          })()}
                        </td>
                        <td className="py-3 px-4">
                          <AssetStatusControl
                            asset={asset}
                            isAllowed={isAllowed}
                            onStatusChange={handleQuickStatusChange}
                          />
                        </td>
                        <td className="py-3 px-4 text-right">
                          <RowActionMenu
                            onViewDetails={() => router.push(`/assets/${asset.id}`)}
                            onEdit={isAllowed ? () => router.push(`/assets/${asset.id}/edit`) : undefined}
                            onDelete={isAllowed ? () => deleteAsset(asset.id) : undefined}
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
    </div>
  );
}
