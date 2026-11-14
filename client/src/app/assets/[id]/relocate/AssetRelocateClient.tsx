'use client';

import React, { useState, useMemo, useEffect, Suspense } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Header } from '@/components/Header';
import { useStock } from '@/context/StockContext';
import { useAuth } from '@/context/AuthContext';
import { Dropdown } from '@/components/Dropdown';
import { DatePicker } from '@/components/DatePicker';
import { NumberInput } from '@/components/NumberInput';
import { LoadingScreen } from '@/components/LoadingScreen';
import { LabThumbnail } from '@/components/LabThumbnail';
import { findMatchingRoom } from '@/lib/locationMatch';
import {
  ArrowLeft,
  ArrowRight,
  ArrowLeftRight,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  Check,
  Copy,
  Shield,
  Cpu,
  History,
} from 'lucide-react';

interface AssetRelocateClientProps {
  id?: string;
  returnTo?: string;
}

function RelocateContent({ id: propId, returnTo: propReturnTo }: AssetRelocateClientProps) {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();

  const { assets, locations, transfers, transferAsset, showToast, isLoading } = useStock();
  const { user, canManageLocation } = useAuth();

  const initialId = propId || (params?.id as string) || searchParams.get('assetId') || '';
  const [selectedAssetId, setSelectedAssetId] = useState<string>(initialId);

  // Initialize selected asset when assets load
  useEffect(() => {
    if (!selectedAssetId && assets.length > 0) {
      setSelectedAssetId(initialId || assets[0].id);
    }
  }, [assets, selectedAssetId, initialId]);

  const asset = assets.find((a) => a.id === selectedAssetId) || (assets.length > 0 ? assets[0] : undefined);
  const isAllowed = asset ? canManageLocation(asset.location) : false;

  const returnTo = propReturnTo || searchParams.get('returnTo') || (propId || params?.id ? `/assets/${asset?.id}` : '/loans');
  const isFromLoans = returnTo.includes('/loans') || searchParams.get('fromLoans') === 'true';

  const [copied, setCopied] = useState(false);
  const [sourceLocation, setSourceLocation] = useState('');
  const [targetLocation, setTargetLocation] = useState('');
  const [transferQuantity, setTransferQuantity] = useState(1);
  const [transferReason, setTransferReason] = useState('');
  const [transferDate, setTransferDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [transferredBy, setTransferredBy] = useState(() => user?.name || 'Dr. Heng Sovannarith');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Classroom Allocations for this asset
  const allocations = useMemo(() => {
    if (!asset || !locations) return [];
    const list: Array<{
      inventoryId: string;
      locationId: string;
      room: string;
      building: string;
      locationName: string;
      total: number;
      qtyWorking: number;
      qtyBroken: number;
      qtyMaintenance: number;
      unit: string;
    }> = [];

    locations.forEach((loc) => {
      (loc.inventories || []).forEach((inv) => {
        const isMatch = Boolean(
          inv.assetId && (inv.assetId === asset.id || inv.assetId === asset.serialNumber)
        );

        if (isMatch) {
          const total = (inv.qtyWorking || 0) + (inv.qtyBroken || 0) + (inv.qtyMaintenance || 0);
          if (total > 0) {
            list.push({
              inventoryId: inv.id,
              locationId: loc.id,
              room: loc.room,
              building: loc.building,
              locationName: loc.name,
              total,
              qtyWorking: inv.qtyWorking || 0,
              qtyBroken: inv.qtyBroken || 0,
              qtyMaintenance: inv.qtyMaintenance || 0,
              unit: inv.unit || asset.unitType || 'Units',
            });
          }
        }
      });
    });

    const matchedLocation = findMatchingRoom(asset.location, locations);

    if (list.length === 0 && matchedLocation) {
      list.push({
        inventoryId: `primary-${matchedLocation.id}`,
        locationId: matchedLocation.id,
        room: matchedLocation.room,
        building: matchedLocation.building,
        locationName: matchedLocation.name,
        total: asset.totalUnits ?? 1,
        qtyWorking: asset.status === 'operational' ? (asset.totalUnits ?? 1) : 0,
        qtyBroken: asset.status === 'maintenance' ? (asset.totalUnits ?? 1) : 0,
        qtyMaintenance: asset.status === 'maintenance' ? (asset.totalUnits ?? 1) : 0,
        unit: asset.unitType ?? 'Unit',
      });
    }

    return list;
  }, [asset, locations]);

  // Pre-fill source location when asset changes or from query params
  useEffect(() => {
    if (!asset || locations.length === 0) return;

    const fromQuery = searchParams.get('from');
    let initialFrom = '';

    if (fromQuery) {
      const cleanFrom = decodeURIComponent(fromQuery).trim();
      const cleanFromLower = cleanFrom.toLowerCase();
      const match = locations.find((l) => {
        const fullCombo = `${l.name} (${l.room})`.toLowerCase();
        const roomLower = l.room.toLowerCase();
        const roomCode = roomLower.replace(/^(rm|room)\s*/i, '').trim();
        const nameLower = l.name.toLowerCase();
        return (
          fullCombo === cleanFromLower ||
          cleanFromLower.includes(fullCombo) ||
          cleanFromLower.includes(roomLower) ||
          cleanFromLower.includes(nameLower) ||
          (roomCode.length > 0 && cleanFromLower.includes(roomCode)) ||
          nameLower.includes(cleanFromLower) ||
          roomLower === cleanFromLower
        );
      });
      if (match) {
        initialFrom = `${match.name} (${match.room})`;
      } else {
        initialFrom = cleanFrom;
      }
    }

    if (!initialFrom) {
      // Prefer the first allocation room if exists, else asset location
      if (allocations.length > 0) {
        initialFrom = `${allocations[0].locationName} (${allocations[0].room})`;
      } else {
        initialFrom = asset.location;
      }
    }

    setSourceLocation(initialFrom);

    // Pick a default destination different from source
    const otherLoc = locations.find((l) => `${l.name} (${l.room})` !== initialFrom);
    if (otherLoc) {
      setTargetLocation(`${otherLoc.name} (${otherLoc.room})`);
    } else {
      setTargetLocation('');
    }

    setTransferQuantity(asset.totalUnits ?? 1);
  }, [asset, locations, searchParams, allocations]);

  useEffect(() => {
    if (user?.name) {
      setTransferredBy(user.name);
    }
  }, [user]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    showToast('Copied serial tag to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  if (!asset && isLoading) {
    return <LoadingScreen message="Loading asset relocation terminal..." />;
  }

  if (!asset) {
    return (
      <div className="flex-1 flex flex-col min-w-0 bg-neutral-50/50">
        <Header
          title="Hardware Asset Not Found"
          subtitle="Relocation Terminal"
          showExport={false}
          backHref={returnTo}
          backLabel={isFromLoans ? 'Device Loans' : 'Hardware Fleet'}
        />
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="bg-white border border-neutral-200 rounded-2xl p-8 max-w-md w-full text-center space-y-4 shadow-sm">
            <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h2 className="text-base font-bold text-neutral-900">Equipment Record Not Found</h2>
            <p className="text-xs text-neutral-500 leading-relaxed">
              No hardware equipment could be loaded for relocation.
            </p>
            <Link
              href={returnTo}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-neutral-900 rounded-lg hover:bg-neutral-800 transition-colors shadow-2xs"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Return Back</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Related transfer history
  const assetTransfers = transfers.filter(
    (t) =>
      t.assetId === asset.id ||
      t.serialNumber.toLowerCase() === asset.serialNumber.toLowerCase()
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sourceLocation) {
      showToast('Please select a source lab room to transfer from', 'error');
      return;
    }
    if (!targetLocation) {
      showToast('Please select a destination lab room to transfer to', 'error');
      return;
    }
    if (sourceLocation === targetLocation) {
      showToast('Source and destination rooms cannot be the same', 'error');
      return;
    }

    if (!isAllowed) {
      showToast('Action restricted: equipment belongs to a room outside your assigned laboratory scope.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      transferAsset(
        asset.id,
        targetLocation,
        transferReason.trim() || 'Laboratory equipment relocation',
        transferredBy.trim(),
        sourceLocation,
        transferQuantity
      );
      showToast(`Successfully relocated ${asset.name} to ${targetLocation}`);
      router.push(returnTo);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-neutral-50/40">
      {/* Top Header */}
      <Header
        title={isFromLoans ? 'Relocate Device to Another Lab' : 'Relocate Hardware Equipment'}
        subtitle={`${asset.name} (SN: ${asset.serialNumber}) • ${asset.location}`}
        backHref={returnTo}
        backLabel={isFromLoans ? 'Device Loans & Relocations' : 'Asset Details'}
        showExport={false}
      />

      <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6 w-full">
        {/* ================= 1. CLEAN RELOCATION HEADER ================= */}
        <div className="w-full rounded-2xl bg-white border border-neutral-200/80 p-4 sm:p-5 shadow-2xs">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="min-w-0 space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
                  <ArrowLeftRight className="w-3.5 h-3.5 text-blue-600" />
                  <span>Equipment Relocation</span>
                </span>
                <button
                  type="button"
                  onClick={() => copyToClipboard(asset.serialNumber)}
                  className="inline-flex items-center gap-1 font-mono text-[10px] text-neutral-600 bg-neutral-100 hover:bg-neutral-200 px-2 py-0.5 rounded border border-neutral-200 transition-colors cursor-pointer"
                  title="Click to copy serial tag"
                >
                  <span>SN: {asset.serialNumber}</span>
                  {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3 text-neutral-400" />}
                </button>
                <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-neutral-100 text-neutral-600 font-mono">
                  {asset.location}
                </span>
              </div>

              <h1 className="text-lg sm:text-xl font-bold text-neutral-900 tracking-tight truncate">
                Relocate {asset.name}
              </h1>

              <p className="text-neutral-500 text-xs sm:text-sm flex items-center gap-2 flex-wrap">
                <span>Model: <strong className="text-neutral-800 font-medium">{asset.model}</strong></span>
                <span>·</span>
                <span>Fleet: <strong className="text-neutral-800 font-medium font-mono">{asset.totalUnits ?? 1} {asset.unitType ?? 'units'}</strong></span>
              </p>
            </div>

            {/* Clean Route Indicator */}
            <div className="px-3.5 py-2 bg-neutral-50 rounded-xl border border-neutral-200 flex items-center gap-2.5 shrink-0 self-start md:self-auto font-mono text-xs">
              <span className="font-semibold text-neutral-800">
                {sourceLocation ? sourceLocation.split('(')[1]?.replace(')', '') || sourceLocation : asset.location}
              </span>
              <ArrowRight className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
              <span className="font-bold text-emerald-700">
                {targetLocation ? targetLocation.split('(')[1]?.replace(')', '') || targetLocation : 'Select Destination'}
              </span>
            </div>
          </div>
        </div>

        {/* Access Warning if user lacks permission */}
        {!isAllowed && (
          <div className="p-4 bg-amber-50/80 border border-amber-300/80 rounded-2xl flex items-start gap-3 shadow-xs">
            <Shield className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <div className="text-xs font-bold text-amber-950">
                Restricted Laboratory Equipment
              </div>
              <div className="text-xs text-amber-800 leading-relaxed">
                This equipment is assigned to <span className="font-semibold text-neutral-900">{asset.location}</span>. Your account is restricted from relocating units outside your designated facility room.
              </div>
            </div>
          </div>
        )}

        {/* ================= 2. MAIN RELOCATION WORKSPACE ================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column (7 Cols): Relocation Form */}
          <div className="lg:col-span-7 space-y-6">
            <form onSubmit={handleSubmit} className="bg-white border border-neutral-200/80 rounded-2xl p-5 sm:p-6 shadow-2xs space-y-5">
              <div className="border-b border-neutral-100 pb-3">
                <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-900 flex items-center gap-2">
                  <ArrowLeftRight className="w-4 h-4 text-blue-600" />
                  <span>Relocation Configuration</span>
                </h2>
              </div>

              {/* Form Fields */}
              <div className="space-y-4">
                {/* 0. Equipment Selector */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-neutral-800 flex items-center gap-1.5">
                      <Cpu className="w-3.5 h-3.5 text-blue-600" />
                      <span>Select Equipment to Relocate</span> <span className="text-rose-500">*</span>
                    </label>
                    <span className="text-[10px] font-mono text-neutral-400">
                      {assets.length} items
                    </span>
                  </div>
                  <Dropdown
                    value={asset.id}
                    options={assets.map((a) => ({
                      value: a.id,
                      label: `${a.name} (SN: ${a.serialNumber}) — ${a.location}`,
                    }))}
                    onChange={(val) => {
                      setSelectedAssetId(val);
                      const newAsset = assets.find((a) => a.id === val);
                      if (newAsset) {
                        setSourceLocation(newAsset.location);
                        const otherLoc = locations.find((l) => `${l.name} (${l.room})` !== newAsset.location);
                        if (otherLoc) {
                          setTargetLocation(`${otherLoc.name} (${otherLoc.room})`);
                        }
                        setTransferQuantity(newAsset.totalUnits ?? 1);
                      }
                    }}
                    placeholder="Select hardware equipment"
                    searchable={true}
                    searchPlaceholder="Search by equipment name, model, serial..."
                    buttonClassName="rounded-xl py-2"
                  />
                </div>

                {/* 1 & 2. Source & Destination Rooms */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-bold text-neutral-800 mb-1.5 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-amber-600" />
                      <span>Transfer From (Source)</span> <span className="text-rose-500">*</span>
                    </label>
                    <Dropdown
                      value={sourceLocation}
                      options={locations.map((l) => ({
                        value: `${l.name} (${l.room})`,
                        label: `${l.room} — ${l.name}`,
                      }))}
                      onChange={(val) => {
                        setSourceLocation(val);
                        if (val === targetLocation) {
                          setTargetLocation('');
                        }
                      }}
                      placeholder="Select source lab room"
                      buttonClassName="rounded-xl py-2"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-neutral-800 mb-1.5 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Transfer To (Destination)</span> <span className="text-rose-500">*</span>
                    </label>
                    <Dropdown
                      value={targetLocation}
                      options={locations
                        .filter((l) => `${l.name} (${l.room})` !== sourceLocation)
                        .map((l) => ({
                          value: `${l.name} (${l.room})`,
                          label: `${l.room} — ${l.name}`,
                        }))}
                      onChange={(val) => setTargetLocation(val)}
                      placeholder="Select destination lab room"
                      buttonClassName="rounded-xl py-2"
                    />
                  </div>
                </div>

                {/* 3. Quantity to Relocate */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-neutral-800">
                      Units to Relocate
                    </label>
                    <span className="text-[10px] font-mono text-neutral-500">
                      Available: <strong className="text-neutral-800">{asset.totalUnits ?? 1} {asset.unitType ?? 'units'}</strong>
                    </span>
                  </div>
                  <NumberInput
                    min={1}
                    max={asset.totalUnits ?? 1}
                    value={transferQuantity}
                    onChange={(val) =>
                      setTransferQuantity(
                        Math.max(1, Math.min(asset.totalUnits ?? 1, val))
                      )
                    }
                    className="w-full bg-white border border-neutral-300 text-neutral-900 px-3 py-2 rounded-xl focus:outline-none focus:border-neutral-900 text-sm font-mono font-bold shadow-2xs"
                  />
                </div>

                {/* 4. Transferred By & Date */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-bold text-neutral-800 mb-1.5">
                      Transferred By (Operator) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={transferredBy}
                      onChange={(e) => setTransferredBy(e.target.value)}
                      required
                      placeholder="Operator Name"
                      className="w-full bg-white border border-neutral-300 text-neutral-900 px-3 py-2 rounded-xl focus:outline-none focus:border-neutral-900 text-xs shadow-2xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-neutral-800 mb-1.5">
                      Effective Date
                    </label>
                    <DatePicker
                      value={transferDate}
                      onChange={setTransferDate}
                      placeholder="Select effective date"
                    />
                  </div>
                </div>

                {/* 5. Reason for Movement */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-neutral-800">
                    Reason for Movement & Notes
                  </label>
                  <textarea
                    rows={3}
                    value={transferReason}
                    onChange={(e) => setTransferReason(e.target.value)}
                    placeholder="e.g. Relocated to Room 206 for practical server administration laboratory exercises."
                    className="w-full bg-white border border-neutral-300 text-neutral-900 p-3 rounded-xl focus:outline-none focus:border-neutral-900 text-xs placeholder:text-neutral-400 shadow-2xs"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-neutral-100 flex items-center justify-between gap-3">
                <Link
                  href={returnTo}
                  className="px-4 py-2 border border-neutral-300 text-neutral-700 hover:text-neutral-900 font-semibold text-xs rounded-xl hover:bg-neutral-50 transition-colors shadow-2xs"
                >
                  Cancel
                </Link>

                <button
                  type="submit"
                  disabled={isSubmitting || !isAllowed || !sourceLocation || !targetLocation}
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-neutral-900 hover:bg-neutral-800 disabled:opacity-40 text-white font-semibold text-xs rounded-xl transition-all shadow-xs cursor-pointer active:scale-98"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>{isSubmitting ? 'Processing Relocation...' : 'Confirm Movement'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Right Column (5 Cols): Equipment Dossier and History */}
          <div className="lg:col-span-5 space-y-6">
            {/* Equipment Dossier Card */}
            <div className="bg-white border border-neutral-200/80 rounded-2xl p-5 shadow-2xs space-y-4">
              <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-900 flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-neutral-700" />
                  <span>Selected Equipment Dossier</span>
                </h3>
                <span className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full border ${
                  asset.status === 'maintenance'
                    ? 'bg-amber-50 text-amber-700 border-amber-200'
                    : asset.status === 'in_use'
                    ? 'bg-blue-50 text-blue-700 border-blue-200'
                    : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                }`}>
                  {asset.status === 'maintenance' ? 'IN REPAIR' : asset.status === 'in_use' ? 'IN USE' : 'OPERATIONAL'}
                </span>
              </div>

              {/* Photo & Identity */}
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-xl overflow-hidden bg-neutral-100 border border-neutral-200 shrink-0">
                  <LabThumbnail
                    src={asset.imageUrl}
                    alt={asset.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="min-w-0 space-y-1">
                  <h4 className="font-bold text-sm text-neutral-900 truncate">
                    {asset.name}
                  </h4>
                  <div className="text-xs text-neutral-500 font-mono">
                    Model: <span className="font-semibold text-neutral-800">{asset.model}</span>
                  </div>
                  <div className="text-xs text-neutral-500 font-mono">
                    Serial: <span className="font-semibold text-neutral-800">{asset.serialNumber}</span>
                  </div>
                  <div className="text-xs text-neutral-500">
                    Fleet: <span className="font-semibold text-neutral-800 font-mono">{asset.totalUnits ?? 1} {asset.unitType ?? 'units'}</span>
                  </div>
                </div>
              </div>

              {/* Specs Table */}
              <div className="border-t border-neutral-100 pt-3 space-y-2 text-xs">
                <div className="flex items-center justify-between py-1 border-b border-neutral-50">
                  <span className="text-neutral-500">Deployment Status</span>
                  <span className="font-medium text-neutral-900">
                    {asset.status === 'maintenance' ? 'In Repair' : asset.status === 'in_use' ? 'In Use' : 'Operational'}
                  </span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-neutral-50">
                  <span className="text-neutral-500">Current Station</span>
                  <span className="font-medium text-neutral-900 font-mono">{asset.location}</span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-neutral-50">
                  <span className="text-neutral-500">Loan Status</span>
                  <span className="font-medium text-neutral-900 font-mono capitalize">{asset.loanStatus || 'Available'}</span>
                </div>
                <div className="flex items-center justify-between py-1">
                  <span className="text-neutral-500">Next Scheduled Audit</span>
                  <span className="font-medium text-neutral-900 font-mono text-[11px]">
                    {asset.nextCalibration}
                  </span>
                </div>
              </div>
            </div>

            {/* Past Relocation Logs */}
            <div className="bg-white border border-neutral-200/80 rounded-2xl p-5 shadow-2xs space-y-3">
              <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-900 flex items-center gap-2">
                  <History className="w-4 h-4 text-neutral-700" />
                  <span>Recent Relocations</span>
                </h3>
                <span className="text-[10px] font-mono text-neutral-500">
                  {assetTransfers.length} {assetTransfers.length === 1 ? 'Record' : 'Records'}
                </span>
              </div>

              {assetTransfers.length === 0 ? (
                <div className="py-6 text-center text-xs text-neutral-400">
                  No previous relocations recorded for this device.
                </div>
              ) : (
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {assetTransfers.map((t) => (
                    <div key={t.id} className="p-3 rounded-xl bg-neutral-50/60 border border-neutral-100 space-y-1.5 text-xs">
                      <div className="flex items-center justify-between font-mono text-[11px]">
                        <span className="text-neutral-500">{t.transferDate}</span>
                        <span className="font-semibold text-neutral-800">{t.transferredBy}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-neutral-700 text-[11px]">
                        <span className="font-semibold">{t.fromLocation.split('(')[0].trim()}</span>
                        <ArrowRight className="w-3 h-3 text-neutral-400" />
                        <span className="font-semibold text-emerald-700">{t.toLocation.split('(')[0].trim()}</span>
                      </div>
                      {t.reason && <p className="text-[10px] text-neutral-400 italic">{t.reason}</p>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AssetRelocateClient({ id, returnTo }: AssetRelocateClientProps) {
  return (
    <Suspense
      fallback={
        <div className="flex-1 flex items-center justify-center p-12 text-xs text-neutral-500">
          <div className="flex flex-col items-center gap-3">
            <div className="w-6 h-6 border-2 border-neutral-300 border-t-blue-500 rounded-full animate-spin" />
            <span>Loading Relocation Workspace...</span>
          </div>
        </div>
      }
    >
      <RelocateContent id={id} returnTo={returnTo} />
    </Suspense>
  );
}
