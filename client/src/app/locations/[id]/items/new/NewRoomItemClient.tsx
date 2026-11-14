'use client';

import React, { Suspense, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Header } from '@/components/Header';
import { useStock } from '@/context/StockContext';
import { useAuth } from '@/context/AuthContext';
import {
  Boxes,
  Microscope,
  ArrowRight,
  Layers,
  ClipboardList,
  MapPin,
  AlertTriangle,
  ExternalLink,
  Search,
  Check,
  X,
} from 'lucide-react';
import { findLocation, getCategoryLabel } from '../shared';
import {
  AssetAllocationSummary,
  doesLocationMatchRoom,
  findLinkedStockItem,
  getAssetAllocationSummary,
  inferAssetGroup,
} from '@/lib/locationMatch';
import { MockAsset } from '@/types';
import { LoadingScreen } from '@/components/LoadingScreen';
import { LabThumbnail } from '@/components/LabThumbnail';
import { NumberInput } from '@/components/NumberInput';

type Source = 'stock' | 'asset';

interface StockAllocationInput {
  working: number;
  broken: number;
}

interface AssignableAssetEntry {
  asset: MockAsset;
  summary: AssetAllocationSummary;
  availableUnits: number;
  existingInRoom: number;
  sourceKind: 'pool' | 'direct-transfer';
  locationLabel: string;
}

function NewRoomItemInner({ id }: { id: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const {
    locations,
    stock,
    assets,
    addRoomInventoryItem,
    updateStockQuantity,
    updateAsset,
    transferAsset,
    showToast,
    isLoading,
  } = useStock();
  const { user, canManageLocation } = useAuth();
  const isAdmin = user?.roleBadge === 'Admin' || user?.role === 'Primary Lab Administrator';

  const loc = findLocation(locations, id);

  const initialSource: Source = searchParams.get('source') === 'asset' ? 'asset' : 'stock';
  const [manualSource, setManualSource] = useState<Source | null>(null);
  const source: Source = manualSource ?? initialSource;

  const [itemSearch, setItemSearch] = useState('');
  const [selectedStockQty, setSelectedStockQty] = useState<Record<string, StockAllocationInput>>({});
  const [selectedAssetQty, setSelectedAssetQty] = useState<Record<string, number>>({});
  const [remarks, setRemarks] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const assignableStock = useMemo(
    () => (loc ? stock.filter((s) => s.quantity > 0 && !doesLocationMatchRoom(s.location, loc)) : []),
    [stock, loc]
  );

  const assignableAssets = useMemo<AssignableAssetEntry[]>(() => {
    if (!loc) return [];
    return assets.flatMap<AssignableAssetEntry>((asset) => {
      const summary = getAssetAllocationSummary(asset, locations);
      const allocInCurrent = summary.allocations.find((a) => a.location.id === loc.id)?.totalQty || 0;

      if (summary.unassignedUnits > 0) {
        const locationLabel =
          summary.allocations.length > 0
            ? `Unassigned pool · ${summary.allocations.map((a) => `${a.location.room} (${a.totalQty})`).join(', ')}`
            : 'Unassigned';
        return [
          {
            asset,
            summary,
            availableUnits: summary.unassignedUnits,
            existingInRoom: allocInCurrent,
            sourceKind: 'pool',
            locationLabel,
          },
        ];
      }

      if (summary.mode === 'direct' && summary.directRoom && summary.directRoom.id !== loc.id) {
        const sourceRoom = summary.directRoom;
        const canManageSource =
          isAdmin ||
          canManageLocation(`${sourceRoom.name} (${sourceRoom.room})`) ||
          canManageLocation(sourceRoom.room);
        if (!canManageSource) return [];

        return [
          {
            asset,
            summary,
            availableUnits: summary.totalUnits,
            existingInRoom: 0,
            sourceKind: 'direct-transfer',
            locationLabel: `${sourceRoom.name} (${sourceRoom.room})`,
          },
        ];
      }

      return [];
    });
  }, [assets, locations, loc, isAdmin, canManageLocation]);

  const filteredStock = useMemo(() => {
    const q = itemSearch.trim().toLowerCase();
    if (!q) return assignableStock;
    return assignableStock.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.code.toLowerCase().includes(q) ||
        (s.category && s.category.toLowerCase().includes(q)) ||
        (s.location && s.location.toLowerCase().includes(q))
    );
  }, [assignableStock, itemSearch]);

  const filteredAssets = useMemo(() => {
    const q = itemSearch.trim().toLowerCase();
    if (!q) return assignableAssets;
    return assignableAssets.filter(
      ({ asset, locationLabel }) =>
        asset.name.toLowerCase().includes(q) ||
        asset.serialNumber.toLowerCase().includes(q) ||
        (asset.model && asset.model.toLowerCase().includes(q)) ||
        locationLabel.toLowerCase().includes(q)
    );
  }, [assignableAssets, itemSearch]);

  const existingRoomStockQty = useMemo(() => {
    const map = new Map<string, number>();
    if (!loc) return map;
    (loc.inventories || []).forEach((inv) => {
      const linked = findLinkedStockItem(inv, stock);
      if (!linked) return;
      const units = (inv.qtyWorking || 0) + (inv.qtyBroken || 0) + (inv.qtyMaintenance || 0);
      map.set(linked.id, (map.get(linked.id) || 0) + units);
    });
    return map;
  }, [loc, stock]);

  const totalSourceCount = source === 'stock' ? assignableStock.length : assignableAssets.length;
  const pickerRows = useMemo(
    () =>
      source === 'stock'
        ? filteredStock.map((item) => ({
            id: item.id,
            name: item.name,
            badge: item.code,
            subtitle: item.category || 'General Inventory',
            locationLabel: item.location || 'Unassigned',
            imageUrl: item.imageUrl,
            quantityLabel: `${item.quantity} ${item.unit}`,
            existingQty: existingRoomStockQty.get(item.id) || 0,
          }))
        : filteredAssets.map((entry) => ({
            id: entry.asset.id,
            name: entry.asset.name,
            badge: entry.asset.serialNumber,
            subtitle: entry.asset.model || 'Standard Model',
            locationLabel: entry.locationLabel,
            imageUrl: entry.asset.imageUrl,
            quantityLabel: `${entry.availableUnits} ${entry.asset.unitType || 'Units'} avail`,
            existingQty: entry.existingInRoom,
          })),
    [source, filteredStock, filteredAssets, existingRoomStockQty]
  );

  const selectedStockList = useMemo(
    () =>
      assignableStock
        .filter((s) => Boolean(selectedStockQty[s.id]))
        .map((item) => {
          const counts = selectedStockQty[item.id];
          const total = counts.working + counts.broken;
          const invalid = total <= 0 || total > item.quantity;
          return { item, counts, total, invalid };
        }),
    [assignableStock, selectedStockQty]
  );

  const selectedAssetList = useMemo(
    () =>
      assignableAssets
        .filter((entry) => selectedAssetQty[entry.asset.id] !== undefined)
        .map((entry) => {
          const qty = selectedAssetQty[entry.asset.id];
          const invalid = qty <= 0 || qty > entry.availableUnits;
          return { entry, qty, invalid };
        }),
    [assignableAssets, selectedAssetQty]
  );

  if (isLoading || !loc) {
    return <LoadingScreen message="Loading classroom assignment workspace..." />;
  }

  const isAllowed = isAdmin || canManageLocation(loc.room) || canManageLocation(loc.name);
  const backHref = `/locations/${loc.id}?tab=${source === 'asset' ? 'hardware' : 'stock'}`;

  const isRowSelected = (rowId: string) =>
    source === 'stock' ? Boolean(selectedStockQty[rowId]) : selectedAssetQty[rowId] !== undefined;

  const visibleSelectedCount = pickerRows.filter((row) => isRowSelected(row.id)).length;
  const allVisibleSelected = pickerRows.length > 0 && visibleSelectedCount === pickerRows.length;

  const toggleStockItem = (stockId: string) => {
    setSelectedStockQty((prev) => {
      if (prev[stockId]) {
        const next = { ...prev };
        delete next[stockId];
        return next;
      }
      const target = assignableStock.find((s) => s.id === stockId);
      if (!target) return prev;
      return {
        ...prev,
        [stockId]: { working: Math.min(target.quantity || 1, 1), broken: 0 },
      };
    });
  };

  const updateStockQty = (stockId: string, field: 'working' | 'broken', value: number) => {
    setSelectedStockQty((prev) => {
      const current = prev[stockId];
      if (!current) return prev;
      return {
        ...prev,
        [stockId]: { ...current, [field]: Math.max(0, value) },
      };
    });
  };

  const toggleAssetItem = (assetId: string) => {
    setSelectedAssetQty((prev) => {
      if (prev[assetId] !== undefined) {
        const next = { ...prev };
        delete next[assetId];
        return next;
      }
      const target = assignableAssets.find((e) => e.asset.id === assetId);
      if (!target) return prev;
      return {
        ...prev,
        [assetId]: Math.min(target.availableUnits || 1, 1),
      };
    });
  };

  const updateAssetQty = (assetId: string, value: number) => {
    setSelectedAssetQty((prev) => {
      if (prev[assetId] === undefined) return prev;
      return {
        ...prev,
        [assetId]: Math.max(0, value),
      };
    });
  };

  const handleToggleSelectAllVisible = () => {
    if (source === 'stock') {
      setSelectedStockQty((prev) => {
        const next = { ...prev };
        if (allVisibleSelected) {
          pickerRows.forEach((row) => delete next[row.id]);
        } else {
          filteredStock.forEach((item) => {
            if (!next[item.id]) {
              next[item.id] = { working: Math.min(item.quantity || 1, 1), broken: 0 };
            }
          });
        }
        return next;
      });
      return;
    }

    setSelectedAssetQty((prev) => {
      const next = { ...prev };
      if (allVisibleSelected) {
        pickerRows.forEach((row) => delete next[row.id]);
      } else {
        filteredAssets.forEach((entry) => {
          if (next[entry.asset.id] === undefined) {
            next[entry.asset.id] = Math.min(entry.availableUnits || 1, 1);
          }
        });
      }
      return next;
    });
  };

  const handleClearSelection = () => {
    setSelectedStockQty({});
    setSelectedAssetQty({});
  };

  const totalSelectedCount = selectedStockList.length + selectedAssetList.length;
  const totalStockUnitsToAssign = selectedStockList.reduce((sum, entry) => sum + entry.total, 0);
  const totalHardwareUnitsToAssign = selectedAssetList.reduce((sum, item) => sum + item.qty, 0);
  const hasInvalidAllocation =
    selectedStockList.some((entry) => entry.invalid) ||
    selectedAssetList.some((entry) => entry.invalid);
  const canSubmit = isAllowed && !submitting && totalSelectedCount > 0 && !hasInvalidAllocation;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAllowed) {
      showToast('You do not have permission to manage this classroom', 'error');
      return;
    }
    if (totalSelectedCount === 0) {
      showToast('Please select at least one inventory item or hardware device', 'warning');
      return;
    }
    if (hasInvalidAllocation) {
      showToast('Check assigned quantities — each item must be between 1 and available units', 'warning');
      return;
    }

    setSubmitting(true);
    const noteText = remarks.trim();

    selectedStockList.forEach(({ item, counts, total }) => {
      const inferredGroup = inferAssetGroup(item.category || '', item.name);
      addRoomInventoryItem(
        loc.id,
        {
          stockItemId: item.serverId || item.id,
          name: item.name,
          group: inferredGroup,
          brandSpec: item.description || item.rack || undefined,
          unit: item.unit || 'pcs',
          qtyWorking: counts.working,
          qtyBroken: counts.broken,
          qtyMaintenance: 0,
          remarks: noteText || undefined,
        },
        { silent: true }
      );
      updateStockQuantity(item.id, -total, { silent: true });
    });

    selectedAssetList.forEach(({ entry, qty }) => {
      const { asset, availableUnits, sourceKind, summary } = entry;
      const assetRef = asset.serverId || asset.id;
      const isMaintAsset = asset.status === 'maintenance';

      if (sourceKind === 'direct-transfer' && summary.directRoom) {
        if (qty === availableUnits) {
          transferAsset(
            asset.id,
            `${loc.name} (${loc.room})`,
            noteText || `Assigned to ${loc.room}`,
            user?.name || 'Admin',
            undefined,
            undefined,
            { silent: true }
          );
          return;
        }

        // Splitting a direct single-room asset across multiple classrooms via room_inventory
        const remainder = availableUnits - qty;
        addRoomInventoryItem(
          summary.directRoom.id,
          {
            assetId: assetRef,
            name: asset.name,
            group: 'IT_HARDWARE',
            brandSpec: asset.model || undefined,
            unit: asset.unitType || 'Units',
            qtyWorking: isMaintAsset ? 0 : remainder,
            qtyBroken: 0,
            qtyMaintenance: isMaintAsset ? remainder : 0,
            remarks: asset.description || undefined,
          },
          { silent: true }
        );
        updateAsset({ ...asset, location: 'Unassigned' }, { silent: true });
      }

      addRoomInventoryItem(
        loc.id,
        {
          assetId: assetRef,
          name: asset.name,
          group: 'IT_HARDWARE',
          brandSpec: asset.model || undefined,
          unit: asset.unitType || 'Units',
          qtyWorking: isMaintAsset ? 0 : qty,
          qtyBroken: 0,
          qtyMaintenance: isMaintAsset ? qty : 0,
          remarks: noteText || undefined,
        },
        { silent: true }
      );
    });

    const parts: string[] = [];
    if (selectedStockList.length > 0) {
      parts.push(
        `${selectedStockList.length} inventory ${selectedStockList.length === 1 ? 'item' : 'items'}`
      );
    }
    if (selectedAssetList.length > 0) {
      parts.push(
        `${selectedAssetList.length} hardware ${selectedAssetList.length === 1 ? 'device' : 'devices'}`
      );
    }
    showToast(`Assigned ${parts.join(' and ')} to ${loc.room}`, 'success');

    const destTab =
      selectedAssetList.length > 0 && (selectedStockList.length === 0 || source === 'asset')
        ? 'hardware'
        : 'stock';
    setTimeout(() => router.push(`/locations/${loc.id}?tab=${destTab}`), 200);
  };

  const sourceTabs: {
    key: Source;
    label: string;
    hint: string;
    availableCount: number;
    selectedCount: number;
    icon: React.ReactNode;
  }[] = [
    {
      key: 'stock',
      label: 'From Inventory (/stock)',
      hint: 'Check one or more inventory items to allocate',
      availableCount: assignableStock.length,
      selectedCount: selectedStockList.length,
      icon: <Boxes className="w-4 h-4" />,
    },
    {
      key: 'asset',
      label: 'From Hardware Assets (/assets)',
      hint: 'Check one or more hardware devices to assign',
      availableCount: assignableAssets.length,
      selectedCount: selectedAssetList.length,
      icon: <Microscope className="w-4 h-4" />,
    },
  ];

  const numInputCls =
    'w-20 bg-white border border-neutral-300 text-neutral-900 text-xs px-2.5 py-1.5 rounded-lg font-mono font-bold text-center focus:outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900';

  return (
    <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-neutral-50/50">
      <Header
        title={`Assign to ${loc.room}`}
        subtitle={`${loc.name} • ${loc.building}`}
        backHref={backHref}
        backLabel={loc.room}
        showExport={false}
        actions={
          <div className="flex items-center gap-2">
            <Link
              href={backHref}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-neutral-200 text-neutral-700 hover:bg-neutral-50 rounded-xl text-xs font-medium transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              form="assign-room-item-form"
              disabled={!canSubmit}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-neutral-900 hover:bg-neutral-800 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer shadow-xs"
            >
              <ArrowRight className="w-3.5 h-3.5 text-emerald-400" />
              <span>
                {submitting
                  ? 'Assigning...'
                  : totalSelectedCount > 0
                  ? `Assign ${totalSelectedCount} to ${loc.room}`
                  : `Assign to ${loc.room}`}
              </span>
            </button>
          </div>
        }
      />

      <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 w-full">
        {!isAllowed && (
          <div className="mb-5 p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              You have read-only access to {loc.room}. Only assigned operators or administrators can assign equipment.
            </span>
          </div>
        )}

        <form
          id="assign-room-item-form"
          onSubmit={handleSubmit}
          className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start"
        >
          {/* Left: inline multi-select catalog + selected configuration */}
          <div className="lg:col-span-8 space-y-5">
            <div className="bg-white border border-neutral-200/80 rounded-2xl p-5 sm:p-6 shadow-2xs space-y-4">
              <div className="flex items-center justify-between gap-2 flex-wrap border-b border-neutral-100 pb-3">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-neutral-700" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-900">
                    Choose Existing Equipment (Multi-Select)
                  </h3>
                </div>
                <span className="text-[11px] text-neutral-500">
                  {pickerRows.length} of {totalSourceCount}{' '}
                  {source === 'stock' ? 'inventory items' : 'devices'}
                </span>
              </div>

              {/* Source Switcher */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {sourceTabs.map((t) => {
                  const active = source === t.key;
                  return (
                    <button
                      key={t.key}
                      type="button"
                      onClick={() => {
                        setManualSource(t.key);
                        setItemSearch('');
                      }}
                      className={`flex flex-col items-start gap-1 p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                        active
                          ? 'bg-neutral-900 text-white border-neutral-900 shadow-xs'
                          : 'bg-neutral-50/50 text-neutral-700 border-neutral-200 hover:bg-white hover:border-neutral-300'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full gap-2">
                        <div className="flex items-center gap-2 text-xs font-bold">
                          <span className={active ? 'text-emerald-400' : 'text-neutral-500'}>{t.icon}</span>
                          <span>{t.label}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          {t.selectedCount > 0 && (
                            <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-md bg-emerald-500 text-white">
                              {t.selectedCount} checked
                            </span>
                          )}
                          <span
                            className={`text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded-md ${
                              active ? 'bg-white/15 text-white' : 'bg-neutral-200/80 text-neutral-600'
                            }`}
                          >
                            {t.availableCount}
                          </span>
                        </div>
                      </div>
                      <span className={`text-[11px] ${active ? 'text-neutral-300' : 'text-neutral-500'}`}>
                        {t.hint}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Search Bar + Select-All Controls */}
              {totalSourceCount === 0 ? (
                <div className="p-4 bg-neutral-50 border border-neutral-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="text-xs text-neutral-600">
                    <div className="font-semibold text-neutral-900">
                      {source === 'stock'
                        ? 'No allocatable inventory items available'
                        : 'No hardware devices available to assign'}
                    </div>
                    <p className="text-[11px] text-neutral-500 mt-0.5">
                      {source === 'stock'
                        ? `Rooms only receive items already created in Inventory (/stock). Add items in Inventory first, then assign them to ${loc.room}.`
                        : `Rooms only receive devices already registered in Hardware Assets (/assets). Add devices there first, then assign them to ${loc.room}.`}
                    </p>
                  </div>
                  <Link
                    href={source === 'stock' ? '/stock' : '/assets'}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-neutral-300 hover:bg-neutral-100 rounded-xl text-xs font-semibold text-neutral-800 shrink-0"
                  >
                    <span>{source === 'stock' ? 'Open Inventory' : 'Open Hardware Assets'}</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                </div>
              ) : (
                <div className="space-y-2.5">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                    <div className="relative flex-1">
                      <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={itemSearch}
                        onChange={(e) => setItemSearch(e.target.value)}
                        placeholder={
                          source === 'stock'
                            ? 'Filter inventory by name, SKU, category, or current room...'
                            : 'Filter devices by name, serial/tag, model, or current room...'
                        }
                        className="w-full bg-neutral-50/70 border border-neutral-200 text-neutral-900 text-xs pl-8 pr-8 py-2 rounded-xl focus:outline-none focus:bg-white focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 transition-colors placeholder:text-neutral-400"
                      />
                      {itemSearch && (
                        <button
                          type="button"
                          onClick={() => setItemSearch('')}
                          aria-label="Clear search"
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700 cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={handleToggleSelectAllVisible}
                        disabled={pickerRows.length === 0}
                        className="px-3 py-2 text-xs font-semibold bg-neutral-100 hover:bg-neutral-200 disabled:opacity-40 text-neutral-800 rounded-xl transition-colors cursor-pointer whitespace-nowrap"
                      >
                        {allVisibleSelected ? 'Unselect All' : `Select All (${pickerRows.length})`}
                      </button>
                      {totalSelectedCount > 0 && (
                        <button
                          type="button"
                          onClick={handleClearSelection}
                          className="px-3 py-2 text-xs font-semibold text-neutral-600 hover:text-neutral-900 bg-white border border-neutral-200 hover:bg-neutral-50 rounded-xl transition-colors cursor-pointer whitespace-nowrap"
                        >
                          Clear ({totalSelectedCount})
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="border border-neutral-200/90 rounded-xl overflow-hidden bg-white">
                    {pickerRows.length === 0 ? (
                      <div className="py-8 px-4 text-center text-xs text-neutral-500">
                        No matching {source === 'stock' ? 'inventory items' : 'hardware devices'} found for &ldquo;
                        {itemSearch}&rdquo;.
                      </div>
                    ) : (
                      <div className="max-h-[320px] overflow-y-auto divide-y divide-neutral-100">
                        {pickerRows.map((row) => {
                          const isSelected = isRowSelected(row.id);
                          return (
                            <button
                              key={row.id}
                              type="button"
                              onClick={() =>
                                source === 'stock' ? toggleStockItem(row.id) : toggleAssetItem(row.id)
                              }
                              className={`w-full px-3.5 py-3 flex items-center gap-3 text-left transition-colors cursor-pointer ${
                                isSelected
                                  ? source === 'stock'
                                    ? 'bg-emerald-50/70'
                                    : 'bg-blue-50/70'
                                  : 'hover:bg-neutral-50/80'
                              }`}
                            >
                              <span
                                className={`w-4 h-4 rounded flex items-center justify-center border shrink-0 transition-colors ${
                                  isSelected
                                    ? source === 'stock'
                                      ? 'bg-emerald-600 border-emerald-600 text-white'
                                      : 'bg-neutral-900 border-neutral-900 text-white'
                                    : 'border-neutral-300 bg-white'
                                }`}
                              >
                                {isSelected && <Check className="w-3 h-3" />}
                              </span>
                              <LabThumbnail
                                src={row.imageUrl}
                                alt={row.name}
                                size="thumb"
                                fallbackType="item"
                                className="w-10 h-10 rounded-lg border border-neutral-200 shrink-0"
                              />
                              <div className="min-w-0 flex-1 space-y-0.5">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-xs font-semibold text-neutral-900">{row.name}</span>
                                  <span className="text-[10px] font-mono bg-neutral-100 text-neutral-600 px-1.5 py-0.5 rounded border border-neutral-200/70">
                                    {row.badge}
                                  </span>
                                  {row.existingQty > 0 && (
                                    <span className="text-[10px] font-medium bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded border border-emerald-200/80">
                                      {row.existingQty} in {loc.room}
                                    </span>
                                  )}
                                </div>
                                <div className="text-[11px] text-neutral-500 flex items-center gap-1.5 flex-wrap">
                                  <span>{row.subtitle}</span>
                                  <span className="text-neutral-300">·</span>
                                  <span className="text-neutral-600 font-medium">{row.locationLabel}</span>
                                </div>
                              </div>
                              <span className="px-2 py-0.5 rounded-md text-[11px] font-mono font-semibold bg-neutral-100 text-neutral-800 border border-neutral-200/80 whitespace-nowrap shrink-0">
                                {row.quantityLabel}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Selected Items & Quantities Configuration */}
            {totalSelectedCount > 0 && (
              <div className="bg-white border border-neutral-200/80 rounded-2xl p-5 sm:p-6 shadow-2xs space-y-4">
                <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
                  <div className="flex items-center gap-2">
                    <ClipboardList className="w-4 h-4 text-neutral-700" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-900">
                      Selected Items ({totalSelectedCount}) &amp; Quantities
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={handleClearSelection}
                    className="text-[11px] font-semibold text-neutral-500 hover:text-neutral-900 cursor-pointer"
                  >
                    Clear all
                  </button>
                </div>

                {selectedStockList.length > 0 && (
                  <div className="space-y-2.5">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-neutral-500">
                      Inventory Quantities ({selectedStockList.length})
                    </div>
                    <div className="divide-y divide-neutral-100 border border-neutral-200/80 rounded-xl overflow-hidden bg-neutral-50/40">
                      {selectedStockList.map(({ item, counts, total, invalid }) => {
                        const group = inferAssetGroup(item.category || '', item.name);
                        return (
                          <div key={item.id} className="p-3.5 space-y-2 bg-white">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                              <div className="flex items-center gap-3 min-w-0">
                                <LabThumbnail
                                  src={item.imageUrl}
                                  alt={item.name}
                                  size="thumb"
                                  fallbackType="item"
                                  className="w-9 h-9 rounded-lg border border-neutral-200 shrink-0"
                                />
                                <div className="min-w-0">
                                  <div className="text-xs font-semibold text-neutral-900 truncate">
                                    {item.name}
                                  </div>
                                  <div className="text-[11px] text-neutral-500 truncate">
                                    {item.code} · {getCategoryLabel(group)} · Avail:{' '}
                                    <span className="font-mono font-semibold text-neutral-800">
                                      {item.quantity} {item.unit}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
                                <label className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-800">
                                  <span>OK</span>
                                  <NumberInput
                                    min={0}
                                    value={counts.working}
                                    onChange={(val) => updateStockQty(item.id, 'working', val)}
                                    className={numInputCls}
                                  />
                                </label>
                                <label className="flex items-center gap-1.5 text-[11px] font-semibold text-rose-700">
                                  <span>Broken</span>
                                  <NumberInput
                                    min={0}
                                    value={counts.broken}
                                    onChange={(val) => updateStockQty(item.id, 'broken', val)}
                                    className={numInputCls}
                                  />
                                </label>
                                <button
                                  type="button"
                                  onClick={() => toggleStockItem(item.id)}
                                  aria-label={`Remove ${item.name}`}
                                  className="p-1.5 text-neutral-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>

                            {invalid && (
                              <p className="text-[11px] text-rose-700 font-medium flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3 shrink-0" />
                                <span>
                                  {total <= 0
                                    ? 'Assign at least 1 unit or remove this item.'
                                    : `Requested ${total} exceeds available ${item.quantity} ${item.unit}.`}
                                </span>
                              </p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {selectedAssetList.length > 0 && (
                  <div className="space-y-2.5">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-neutral-500">
                      Hardware Device Quantities ({selectedAssetList.length})
                    </div>
                    <div className="divide-y divide-neutral-100 border border-neutral-200/80 rounded-xl overflow-hidden bg-white">
                      {selectedAssetList.map(({ entry, qty, invalid }) => {
                        const { asset, availableUnits, locationLabel } = entry;
                        return (
                          <div key={asset.id} className="p-3.5 space-y-2">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                              <div className="flex items-center gap-3 min-w-0">
                                <LabThumbnail
                                  src={asset.imageUrl}
                                  alt={asset.name}
                                  size="thumb"
                                  fallbackType="item"
                                  className="w-9 h-9 rounded-lg border border-neutral-200 shrink-0"
                                />
                                <div className="min-w-0">
                                  <div className="text-xs font-semibold text-neutral-900 truncate">
                                    {asset.name}
                                  </div>
                                  <div className="text-[11px] text-neutral-500 truncate">
                                    {asset.serialNumber} · {locationLabel} →{' '}
                                    <span className="font-semibold text-emerald-700">{loc.room}</span> · Avail:{' '}
                                    <span className="font-mono font-semibold text-neutral-800">
                                      {availableUnits} {asset.unitType || 'Units'}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
                                <label className="flex items-center gap-1.5 text-[11px] font-semibold text-neutral-700">
                                  <span>Assign</span>
                                  <NumberInput
                                    min={1}
                                    max={availableUnits}
                                    value={qty}
                                    onChange={(val) => updateAssetQty(asset.id, val)}
                                    className={numInputCls}
                                  />
                                  <span className="text-neutral-500 font-normal">
                                    / {availableUnits} {asset.unitType || 'Units'}
                                  </span>
                                </label>
                                <button
                                  type="button"
                                  onClick={() => toggleAssetItem(asset.id)}
                                  aria-label={`Remove ${asset.name}`}
                                  className="p-1.5 text-neutral-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>

                            {invalid && (
                              <p className="text-[11px] text-rose-700 font-medium flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3 shrink-0" />
                                <span>
                                  {qty <= 0
                                    ? 'Assign at least 1 unit or remove this device.'
                                    : `Requested ${qty} exceeds available ${availableUnits} ${asset.unitType || 'Units'}.`}
                                </span>
                              </p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-neutral-800 mb-1.5">
                    Classroom Placement / Transfer Notes (Applied to Selection)
                  </label>
                  <textarea
                    rows={2}
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    placeholder={`e.g. Stationed in ${loc.room} benches or network rack...`}
                    className="w-full bg-white border border-neutral-300 text-neutral-900 text-xs px-3 py-2 rounded-xl focus:outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 transition-colors placeholder:text-neutral-400"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Right: summary */}
          <div className="lg:col-span-4 space-y-4 lg:sticky lg:top-0">
            <div className="bg-white border border-neutral-200/80 rounded-2xl p-5 sm:p-6 shadow-2xs space-y-4 text-xs">
              <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-900">Assignment Summary</h3>
                <span className="font-mono text-[10px] font-bold bg-neutral-900 text-white px-2 py-0.5 rounded-lg">
                  {loc.room}
                </span>
              </div>

              <div className="p-3 bg-neutral-50 border border-neutral-200/70 rounded-xl space-y-1">
                <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase text-neutral-400">
                  <MapPin className="w-3 h-3 text-emerald-600" />
                  <span>Destination Classroom</span>
                </div>
                <div className="font-semibold text-neutral-900">{loc.name}</div>
                <div className="text-[11px] text-neutral-500">
                  {loc.building}
                </div>
              </div>

              <div className="space-y-2.5">
                <div className="flex justify-between items-center py-1 border-b border-neutral-100">
                  <span className="text-neutral-500">Inventory Items</span>
                  <span className="font-mono font-semibold text-neutral-900">
                    {selectedStockList.length} ({totalStockUnitsToAssign} units)
                  </span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-neutral-100">
                  <span className="text-neutral-500">Hardware Devices</span>
                  <span className="font-mono font-semibold text-neutral-900">
                    {selectedAssetList.length} ({totalHardwareUnitsToAssign} units)
                  </span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-neutral-500">Total Selected</span>
                  <span className="font-mono font-bold text-neutral-900 text-sm">
                    {totalSelectedCount} {totalSelectedCount === 1 ? 'record' : 'records'}
                  </span>
                </div>
              </div>

              {totalSelectedCount > 0 ? (
                <div className="p-3 rounded-xl bg-neutral-50 border border-neutral-200/80 space-y-1.5 max-h-48 overflow-y-auto">
                  {selectedStockList.map(({ item, total }) => (
                    <div key={item.id} className="flex items-center justify-between gap-2 text-[11px]">
                      <span className="truncate text-neutral-800 font-medium">{item.name}</span>
                      <span className="font-mono font-semibold text-emerald-700 shrink-0">
                        {total} {item.unit}
                      </span>
                    </div>
                  ))}
                  {selectedAssetList.map(({ entry, qty }) => (
                    <div key={entry.asset.id} className="flex items-center justify-between gap-2 text-[11px]">
                      <span className="truncate text-neutral-800 font-medium">{entry.asset.name}</span>
                      <span className="font-mono font-semibold text-blue-700 shrink-0">
                        {qty} {entry.asset.unitType || 'Units'}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[11px] text-neutral-500 bg-neutral-50 border border-neutral-200/70 rounded-xl p-3 leading-relaxed">
                  Check one or more items on the left (across Inventory or Hardware Assets) to assign them to{' '}
                  {loc.room} at once.
                </p>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function NewRoomItemClient({ id }: { id: string }) {
  return (
    <Suspense fallback={<LoadingScreen message="Loading classroom assignment workspace..." />}>
      <NewRoomItemInner id={id} />
    </Suspense>
  );
}
