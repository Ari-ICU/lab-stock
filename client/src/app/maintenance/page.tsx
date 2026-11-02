'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/Header';
import { useStock } from '@/context/StockContext';
import { exportToCsv } from '@/lib/exportCsv';
import {
  Wrench,
  CheckCircle2,
  Clock,
  Search,
  Layers,
  List,
  ChevronDown,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import { RowActionMenu } from '@/components/RowActionMenu';
import { LabThumbnail } from '@/components/LabThumbnail';
import { MockMaintenance } from '@/types/stock';
import { resolveMaintenanceImage } from './shared';

interface GroupedMaintenanceItem {
  key: string;
  assetName: string;
  serialNumber: string;
  location?: string;
  totalQuantity: number;
  unit: string;
  totalCost: number;
  imageUrl?: string;
  latestDate: string;
  distinctDates: string[];
  lastCompletedDate?: string;
  nextScheduledDate?: string;
  latestType: string;
  latestTechnician: string;
  primaryStatus: 'Completed' | 'Pending' | 'In Progress';
  statusCounts: {
    completed: number;
    pending: number;
    inProgress: number;
  };
  logs: MockMaintenance[];
  primaryId: string;
}

export default function MaintenancePage() {
  const router = useRouter();
  const { maintenance, assets, stock, deleteMaintenance } = useStock();
  const [filterText, setFilterText] = useState('');
  const [viewMode, setViewMode] = useState<'by_item' | 'all_logs'>('by_item');
  const [expandedKeys, setExpandedKeys] = useState<Record<string, boolean>>({});

  const toggleExpand = (key: string) => {
    setExpandedKeys((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const inProgressCount = maintenance.filter((m) => m.status === 'In Progress').length;
  const pendingCount = maintenance.filter((m) => m.status === 'Pending').length;
  const completedCount = maintenance.filter((m) => m.status === 'Completed').length;

  const filtered = maintenance.filter(
    (item) =>
      item.assetName.toLowerCase().includes(filterText.toLowerCase()) ||
      item.serialNumber.toLowerCase().includes(filterText.toLowerCase()) ||
      item.technician.toLowerCase().includes(filterText.toLowerCase()) ||
      (item.location && item.location.toLowerCase().includes(filterText.toLowerCase()))
  );

  const getDisplayImage = (item: Partial<MockMaintenance>) => {
    return resolveMaintenanceImage(item, assets, stock);
  };

  // Group maintenance items by unique equipment
  const groupedItems = useMemo<GroupedMaintenanceItem[]>(() => {
    const map = new Map<string, GroupedMaintenanceItem>();

    for (const item of filtered) {
      const key = `${(item.assetName || '').trim().toLowerCase()}__${(item.serialNumber || '').trim().toLowerCase()}`;
      const qty = item.quantity && item.quantity > 0 ? Number(item.quantity) : 1;
      const costVal = typeof item.cost === 'number' ? item.cost : Number(item.cost) || 0;

      if (!map.has(key)) {
        map.set(key, {
          key,
          assetName: item.assetName,
          serialNumber: item.serialNumber,
          location: item.location,
          totalQuantity: qty,
          unit: item.unit || 'Units',
          totalCost: costVal,
          imageUrl: item.imageUrl,
          latestDate: item.date,
          distinctDates: [item.date],
          lastCompletedDate: item.status === 'Completed' ? item.date : undefined,
          nextScheduledDate: item.status !== 'Completed' ? item.date : undefined,
          latestType: item.type,
          latestTechnician: item.technician,
          primaryStatus: item.status,
          statusCounts: {
            completed: item.status === 'Completed' ? qty : 0,
            pending: item.status === 'Pending' ? qty : 0,
            inProgress: item.status === 'In Progress' ? qty : 0,
          },
          logs: [item],
          primaryId: item.id,
        });
      } else {
        const group = map.get(key)!;
        // If the item had explicit quantity > 1, add it; otherwise increment by 1
        group.totalQuantity += (item.quantity && item.quantity > 1 ? Number(item.quantity) : 1);
        group.totalCost += costVal;
        group.logs.push(item);

        if (!group.distinctDates.includes(item.date)) {
          group.distinctDates.push(item.date);
        }

        if (item.status === 'Completed') {
          group.statusCounts.completed += qty;
          if (!group.lastCompletedDate || new Date(item.date).getTime() > new Date(group.lastCompletedDate).getTime()) {
            group.lastCompletedDate = item.date;
          }
        } else {
          if (item.status === 'Pending') group.statusCounts.pending += qty;
          else if (item.status === 'In Progress') group.statusCounts.inProgress += qty;

          if (!group.nextScheduledDate || new Date(item.date).getTime() > new Date(group.nextScheduledDate).getTime()) {
            group.nextScheduledDate = item.date;
          }
        }

        if (new Date(item.date).getTime() >= new Date(group.latestDate).getTime()) {
          group.latestDate = item.date;
          group.latestType = item.type;
          group.latestTechnician = item.technician;
          group.primaryStatus = item.status;
        }
      }
    }

    // Sort distinct dates descending for each item
    for (const group of map.values()) {
      group.distinctDates.sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
    }

    return Array.from(map.values());
  }, [filtered]);

  const handleExport = () => {
    exportToCsv(
      'csd_stock_maintenance_audits',
      filtered.map((m) => ({
        'Log ID': m.id,
        'Equipment Name': m.assetName,
        'Serial Number': m.serialNumber,
        'Quantity': m.quantity || 1,
        'Unit': m.unit || 'Units',
        'Location': m.location || 'Central Facility',
        'Service Type': m.type,
        'Service Date': m.date,
        'Assigned Technician': m.technician,
        'Service Cost ($)': m.cost || 0,
        'Service Status': m.status,
        'Diagnostic Notes & Findings': m.notes || 'Routine check completed',
      }))
    );
  };

  return (
    <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
      <Header
        title="Maintenance & Audits"
        subtitle="Firmware Upgrades & Calibration Logs"
        actionLabel="Schedule Service"
        onAction={() => router.push('/maintenance/create')}
        onExport={handleExport}
      />

      <div className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-6 max-w-8xl w-full mx-auto">
        {/* KPI stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white border border-neutral-200 rounded p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-neutral-500">In Progress</span>
              <Clock className="w-4 h-4 text-blue-500" />
            </div>
            <div className="text-2xl font-bold text-neutral-900 mt-2">
              {inProgressCount} <span className="text-xs font-normal text-neutral-500">Active</span>
            </div>
            <div className="text-[11px] text-neutral-500 mt-1">Active diagnostics & hardware work</div>
          </div>

          <div className="bg-white border border-neutral-200 rounded p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-neutral-500">Scheduled Firmware</span>
              <Wrench className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-2xl font-bold text-neutral-900 mt-2">
              {pendingCount} <span className="text-xs font-normal text-neutral-500">Pending</span>
            </div>
            <div className="text-[11px] text-neutral-500 mt-1">Scheduled calibrations & OS patches</div>
          </div>

          <div className="bg-white border border-neutral-200 rounded p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-neutral-500">Completed (Audited)</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="text-2xl font-bold text-neutral-900 mt-2">
              {completedCount} <span className="text-xs font-normal text-neutral-500">Verified</span>
            </div>
            <div className="text-[11px] text-neutral-500 mt-1">All service logs signed off</div>
          </div>
        </div>

        {/* Main Records Container */}
        <div className="bg-white border border-neutral-200 rounded shadow-2xs">
          {/* Top Bar with Search & View Mode Switcher */}
          <div className="p-4 border-b border-neutral-200 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-center gap-3 flex-1">
              <div className="relative w-full sm:w-80">
                <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search by equipment, serial, technician..."
                  value={filterText}
                  onChange={(e) => setFilterText(e.target.value)}
                  className="w-full bg-white border border-neutral-300 text-neutral-900 text-xs pl-8 pr-3 py-1.5 rounded-lg focus:outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 font-medium placeholder:text-neutral-400 shadow-2xs"
                />
              </div>

              {/* View Mode Segmented Controls */}
              <div className="inline-flex rounded-lg border border-neutral-200 bg-neutral-100 p-0.5 shrink-0">
                <button
                  type="button"
                  onClick={() => setViewMode('by_item')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-md transition-all cursor-pointer ${
                    viewMode === 'by_item'
                      ? 'bg-white text-neutral-900 shadow-2xs font-semibold'
                      : 'text-neutral-600 hover:text-neutral-900'
                  }`}
                  title="Grouped by equipment with item count"
                >
                  <Layers className="w-3.5 h-3.5" />
                  Count per Item ({groupedItems.length})
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('all_logs')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-md transition-all cursor-pointer ${
                    viewMode === 'all_logs'
                      ? 'bg-white text-neutral-900 shadow-2xs font-semibold'
                      : 'text-neutral-600 hover:text-neutral-900'
                  }`}
                  title="Show all individual service records"
                >
                  <List className="w-3.5 h-3.5" />
                  All Logs ({filtered.length})
                </button>
              </div>
            </div>

            <span className="text-xs text-neutral-500 font-medium shrink-0">
              Showing <span className="font-semibold text-neutral-900">{viewMode === 'by_item' ? groupedItems.length : filtered.length}</span> {viewMode === 'by_item' ? 'instruments' : 'records'}
            </span>
          </div>

          {/* TABLE VIEW: COUNT PER ITEM (DEFAULT) */}
          {viewMode === 'by_item' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs min-w-[760px]">
                <thead className="bg-neutral-50 border-b border-neutral-200 text-neutral-600 font-semibold">
                  <tr>
                    <th className="py-3 px-3 w-14 text-center">Visual</th>
                    <th className="py-3 px-4">Instrument</th>
                    <th className="py-3 px-4">Serial Number</th>
                    <th className="py-3 px-4 text-center">Count / Units</th>
                    <th className="py-3 px-4">Latest Service</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Technician</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-center">History</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {groupedItems.map((group) => {
                    const isExpanded = !!expandedKeys[group.key];
                    return (
                      <React.Fragment key={group.key}>
                        <tr className="hover:bg-neutral-50/70 transition-colors">
                          {/* Visual Thumbnail */}
                          <td className="py-3 px-3 w-14 text-center">
                            <Link
                              href={`/maintenance/${group.primaryId}`}
                              className="w-10 h-10 rounded border border-neutral-200 bg-neutral-100 overflow-hidden flex items-center justify-center shrink-0 cursor-pointer hover:border-neutral-400 transition-colors inline-block"
                              title="Click to view equipment maintenance details"
                            >
                              <LabThumbnail
                                src={getDisplayImage(group)}
                                alt={group.assetName}
                                size="thumb"
                                fallbackType="item"
                                className="w-full h-full object-cover"
                              />
                            </Link>
                          </td>

                          {/* Instrument Name */}
                          <td className="py-3 px-4">
                            <Link
                              href={`/maintenance/${group.primaryId}`}
                              className="font-semibold text-neutral-900 hover:text-emerald-700 text-left cursor-pointer transition-colors block"
                            >
                              {group.assetName}
                            </Link>
                            {group.location && (
                              <div className="text-[11px] text-neutral-400 mt-0.5">{group.location}</div>
                            )}
                          </td>

                          {/* Serial Number */}
                          <td className="py-3 px-4 font-mono text-neutral-600">{group.serialNumber}</td>

                          {/* COUNT BADGE: Exactly matching /stock black badge */}
                          <td className="py-3 px-4 text-center">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-bold bg-neutral-900 text-white shadow-2xs font-mono">
                              {group.totalQuantity} {group.unit}
                            </span>
                          </td>

                          {/* Latest Service Type */}
                          <td className="py-3 px-4">
                            <span className="bg-neutral-100 text-neutral-700 px-2 py-0.5 rounded text-[11px] font-medium">
                              {group.latestType}
                            </span>
                          </td>

                          {/* Maintenance Dates */}
                          <td className="py-3 px-4">
                            <div className="flex flex-col gap-0.5">
                              {group.nextScheduledDate && (
                                <div className="flex items-center gap-1.5 text-amber-700 font-semibold text-[11px]" title="Next scheduled service / maintenance date">
                                  <Clock className="w-3 h-3 text-amber-500 shrink-0" />
                                  <span>Next: {group.nextScheduledDate}</span>
                                </div>
                              )}
                              {group.lastCompletedDate && (
                                <div className="flex items-center gap-1.5 text-neutral-600 text-[11px]" title="Last completed service date">
                                  <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                                  <span>Last: {group.lastCompletedDate}</span>
                                </div>
                              )}
                              {!group.nextScheduledDate && !group.lastCompletedDate && (
                                <span className="text-neutral-600 font-mono text-[11px]">{group.latestDate}</span>
                              )}
                              {group.distinctDates.length > 1 && (
                                <div className="flex items-center gap-1 flex-wrap mt-0.5" title={`All ${group.distinctDates.length} service dates for this equipment`}>
                                  {group.distinctDates.slice(0, 2).map((d) => (
                                    <span key={d} className="px-1.5 py-0.2 rounded bg-neutral-100 text-neutral-600 text-[10px] font-mono">
                                      {d}
                                    </span>
                                  ))}
                                  {group.distinctDates.length > 2 && (
                                    <span className="text-[10px] text-neutral-400 font-medium">
                                      +{group.distinctDates.length - 2} more
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                          </td>

                          {/* Technician */}
                          <td className="py-3 px-4 text-neutral-600">{group.latestTechnician}</td>

                          {/* Status Badge */}
                          <td className="py-3 px-4">
                            <div className="flex flex-col gap-1 items-start">
                              <span
                                className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium ${
                                  group.primaryStatus === 'Completed'
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                    : group.primaryStatus === 'In Progress'
                                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                                }`}
                              >
                                {group.primaryStatus}
                              </span>
                              {group.logs.length > 1 && (
                                <span className="text-[10px] text-neutral-400">
                                  {group.statusCounts.pending > 0 && `${group.statusCounts.pending} Pending `}
                                  {group.statusCounts.inProgress > 0 && `${group.statusCounts.inProgress} Active `}
                                  {group.statusCounts.completed > 0 && `${group.statusCounts.completed} Done`}
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Expandable History Toggle Button */}
                          <td className="py-3 px-4 text-center">
                            <button
                              type="button"
                              onClick={() => toggleExpand(group.key)}
                              className="inline-flex items-center gap-1 px-2 py-1 rounded bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-[11px] font-medium transition-colors cursor-pointer"
                              title="Toggle service log entries"
                            >
                              {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                              <span>{group.logs.length} {group.logs.length === 1 ? 'Log' : 'Logs'}</span>
                            </button>
                          </td>

                          {/* Actions */}
                          <td className="py-3 px-4 text-right">
                            <RowActionMenu
                              onViewDetails={() => router.push(`/maintenance/${group.primaryId}`)}
                              onEdit={() => router.push(`/maintenance/${group.primaryId}/edit`)}
                              onDelete={() => deleteMaintenance(group.primaryId)}
                            />
                          </td>
                        </tr>

                        {/* Inline Nested Service History (when expanded) */}
                        {isExpanded && (
                          <tr className="bg-neutral-50/70 border-y border-neutral-200">
                            <td colSpan={10} className="p-3 pl-16">
                              <div className="bg-white border border-neutral-200 rounded p-3 shadow-2xs space-y-2">
                                <div className="text-[11px] font-bold text-neutral-700 flex items-center justify-between">
                                  <span>Service & Audit Log History ({group.logs.length} entries for {group.assetName})</span>
                                  <Link
                                    href={`/maintenance/${group.primaryId}`}
                                    className="text-emerald-700 hover:text-emerald-800 text-[11px] font-semibold inline-flex items-center gap-1"
                                  >
                                    View Full Detail Page <ExternalLink className="w-3 h-3" />
                                  </Link>
                                </div>
                                <div className="divide-y divide-neutral-100 text-xs">
                                  {group.logs.map((log) => (
                                    <div key={log.id} className="py-2 flex items-center justify-between gap-4">
                                      <div className="flex items-center gap-3">
                                        <span className="font-mono text-neutral-500 text-[11px]">{log.date}</span>
                                        <span className="bg-neutral-100 text-neutral-800 px-2 py-0.5 rounded text-[11px] font-medium">
                                          {log.type}
                                        </span>
                                        <span className="text-neutral-700 font-medium">
                                          Technician: <span className="text-neutral-900">{log.technician}</span>
                                        </span>
                                        <span className="text-neutral-500 text-[11px] italic max-w-sm truncate">
                                          {log.notes || 'Routine service'}
                                        </span>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <span
                                          className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold ${
                                            log.status === 'Completed'
                                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                              : log.status === 'In Progress'
                                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                                          }`}
                                        >
                                          {log.status}
                                        </span>
                                        <Link
                                          href={`/maintenance/${log.id}`}
                                          className="text-neutral-600 hover:text-neutral-900 text-[11px] font-medium px-2 py-1 rounded hover:bg-neutral-100"
                                        >
                                          Inspect
                                        </Link>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* TABLE VIEW: ALL INDIVIDUAL RAW LOGS */}
          {viewMode === 'all_logs' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs min-w-[760px]">
                <thead className="bg-neutral-50 border-b border-neutral-200 text-neutral-600 font-semibold">
                  <tr>
                    <th className="py-3 px-3 w-14 text-center">Visual</th>
                    <th className="py-3 px-4">Instrument</th>
                    <th className="py-3 px-4">Serial Number</th>
                    <th className="py-3 px-4 text-center">Count</th>
                    <th className="py-3 px-4">Service Type</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Technician</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Notes</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {filtered.map((item) => (
                    <tr key={item.id} className="hover:bg-neutral-50/70 transition-colors">
                      <td className="py-3 px-3 w-14 text-center">
                        <Link
                          href={`/maintenance/${item.id}`}
                          className="w-10 h-10 rounded border border-neutral-200 bg-neutral-100 overflow-hidden flex items-center justify-center shrink-0 cursor-pointer hover:border-neutral-400 transition-colors inline-block"
                          title="Click to view maintenance details"
                        >
                          <LabThumbnail
                            src={getDisplayImage(item)}
                            alt={item.assetName}
                            size="thumb"
                            fallbackType="item"
                            className="w-full h-full object-cover"
                          />
                        </Link>
                      </td>
                      <td className="py-3 px-4">
                        <Link
                          href={`/maintenance/${item.id}`}
                          className="font-semibold text-neutral-900 hover:text-emerald-700 text-left cursor-pointer transition-colors block"
                        >
                          {item.assetName}
                        </Link>
                        {item.location && (
                          <div className="text-[11px] text-neutral-400 mt-0.5">{item.location}</div>
                        )}
                      </td>
                      <td className="py-3 px-4 font-mono text-neutral-600">{item.serialNumber}</td>
                      <td className="py-3 px-4 text-center">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-neutral-900 text-white shadow-2xs font-mono">
                          {item.quantity || 1} {item.unit || 'Units'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="bg-neutral-100 text-neutral-700 px-2 py-0.5 rounded text-[11px] font-medium">
                          {item.type}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-neutral-600">{item.date}</td>
                      <td className="py-3 px-4 text-neutral-600">{item.technician}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium ${
                            item.status === 'Completed'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : item.status === 'In Progress'
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}
                        >
                          {item.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-neutral-500 max-w-xs truncate">{item.notes}</td>
                      <td className="py-3 px-4 text-right">
                        <RowActionMenu
                          onViewDetails={() => router.push(`/maintenance/${item.id}`)}
                          onEdit={() => router.push(`/maintenance/${item.id}/edit`)}
                          onDelete={() => deleteMaintenance(item.id)}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
