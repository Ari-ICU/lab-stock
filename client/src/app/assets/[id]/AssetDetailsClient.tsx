'use client';

import React, { useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Header } from '@/components/Header';
import { useStock } from '@/context/StockContext';
import { useAuth } from '@/context/AuthContext';
import { LabThumbnail } from '@/components/LabThumbnail';
import { LoadingScreen } from '@/components/LoadingScreen';
import {
  ArrowLeft,
  ArrowUpRight,
  Edit3,
  Trash2,
  Copy,
  Check,
  MapPin,
  Layers,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  Shield,
  Cpu,
  Package,
  ArrowLeftRight,
  Laptop,
} from 'lucide-react';

export default function AssetDetailsClient({ id: propId }: { id?: string }) {
  const params = useParams();
  const router = useRouter();
  const id = propId || (params?.id as string);

  const {
    assets,
    updateAsset,
    deleteAsset,
    locations,
    loans,
    returnAsset,
    showToast,
    isLoading,
  } = useStock();
  const { user, canManageLocation } = useAuth();
  const [copied, setCopied] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const asset =
    assets.find(
      (a) =>
        a.id === id ||
        a.serverId === id ||
        a.serialNumber.toLowerCase() === (id || '').toLowerCase() ||
        a.name.toLowerCase().replace(/[^a-z0-9]/g, '') === (id || '').toLowerCase().replace(/[^a-z0-9]/g, '')
    ) ||
    (id && (id.includes('-') || id.length > 15) ? assets[0] : undefined);
  const isAllowed = asset ? canManageLocation(asset.location) : false;

  // Active classroom & laboratory allocations
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
      remarks?: string;
      lastAuditedAt?: string;
    }> = [];

    const assetNameLower = asset.name.toLowerCase();

    locations.forEach((loc) => {
      (loc.inventories || []).forEach((inv) => {
        const invNameLower = inv.name.toLowerCase();
        const isMatch =
          (inv.assetId && (inv.assetId === asset.id || inv.assetId === asset.serialNumber)) ||
          invNameLower === assetNameLower ||
          assetNameLower.includes(invNameLower) ||
          invNameLower.includes(assetNameLower);

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
              remarks: inv.remarks,
              lastAuditedAt: inv.lastAuditedAt,
            });
          }
        }
      });
    });

    // Also check if the asset has a primary assigned location that didn't match via inventories item
    const matchedLocation = locations.find((l) => {
      const locKey = l.room.toLowerCase().replace(/^(rm|room)\s*/i, '').trim();
      const assetLocLower = asset.location.toLowerCase();
      return (
        assetLocLower.includes(locKey) ||
        assetLocLower.includes(l.room.toLowerCase()) ||
        assetLocLower.includes(l.name.toLowerCase())
      );
    });

    // If no inventory item explicitly matched but the asset is placed in a room
    if (list.length === 0 && matchedLocation) {
      list.push({
        inventoryId: `primary-${matchedLocation.id}`,
        locationId: matchedLocation.id,
        room: matchedLocation.room,
        building: matchedLocation.building,
        locationName: matchedLocation.name,
        total: asset.totalUnits ?? 1,
        qtyWorking: asset.status !== 'maintenance' ? (asset.totalUnits ?? 1) : 0,
        qtyBroken: 0,
        qtyMaintenance: asset.status === 'maintenance' ? (asset.totalUnits ?? 1) : 0,
        unit: asset.unitType ?? 'Unit',
        remarks: `Primary placement (${asset.location})`,
        lastAuditedAt: asset.nextCalibration,
      });
    }

    return list;
  }, [asset, locations]);

  const totalAllocated = useMemo(() => {
    return allocations.reduce((sum, a) => sum + a.total, 0);
  }, [allocations]);

  const allocationSummary = useMemo(() => {
    const totalWorking = allocations.reduce((sum, a) => sum + (a.qtyWorking || 0), 0);
    const totalMaintenance = allocations.reduce((sum, a) => sum + (a.qtyMaintenance || 0), 0);
    const totalBroken = allocations.reduce((sum, a) => sum + (a.qtyBroken || 0), 0);
    const totalDeployed = totalWorking + totalMaintenance + totalBroken;
    const operationalRate = totalDeployed > 0 ? Math.round((totalWorking / totalDeployed) * 100) : 100;

    return {
      totalWorking,
      totalMaintenance,
      totalBroken,
      totalDeployed,
      operationalRate,
    };
  }, [allocations]);

  if (!asset && isLoading) {
    return <LoadingScreen message="Loading hardware asset details..." />;
  }

  if (!asset) {
    return (
      <div className="flex-1 flex flex-col min-w-0">
        <Header
          title="Hardware Asset Not Found"
          subtitle="Lab 102B Hardware"
          showExport={false}
          actionLabel="All Assets"
          onAction={() => router.push('/assets')}
        />
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="bg-white border border-neutral-200 rounded-lg p-8 max-w-md w-full text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-neutral-100 flex items-center justify-center mx-auto text-neutral-500">
              <AlertTriangle className="w-6 h-6 text-amber-600" />
            </div>
            <h2 className="text-base font-bold text-neutral-900">Asset Not Found</h2>
            <p className="text-xs text-neutral-500">
              The hardware asset with ID <span className="font-mono font-semibold text-neutral-800">{id}</span> does not exist or has been removed.
            </p>
            <Link
              href="/assets"
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-neutral-900 rounded hover:bg-neutral-800 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Return to Hardware Directory
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const handleCopySerial = () => {
    navigator.clipboard.writeText(asset.serialNumber);
    setCopied(true);
    showToast(`Copied serial tag ${asset.serialNumber} to clipboard`);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleStatusChange = (newStatus: string) => {
    if (!isAllowed) {
      showToast('Action restricted: equipment is stationed outside your assigned laboratory room.', 'error');
      return;
    }
    if (newStatus === 'operational' || newStatus === 'in_use' || newStatus === 'maintenance') {
      updateAsset({
        ...asset,
        status: newStatus,
      });
    }
  };

  const handleDelete = () => {
    if (!isAllowed) {
      showToast('Action restricted: equipment is stationed outside your assigned laboratory room.', 'error');
      return;
    }
    deleteAsset(asset.id);
    router.push('/assets');
  };

  const handleReturnFromDetails = () => {
    const activeLoan = loans.find((l) => l.assetId === asset.id && l.status === 'active');
    if (activeLoan) {
      returnAsset(activeLoan.id, 'Returned directly via asset control panel');
    } else {
      updateAsset({
        ...asset,
        loanStatus: 'available',
        currentBorrower: undefined,
        loanDueDate: undefined,
      });
      showToast(`${asset.name} marked as available`);
    }
  };

  const statusBadge = {
    operational: {
      text: 'Operational',
      badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      dotClass: 'bg-emerald-500',
    },
    in_use: {
      text: 'In Use',
      badgeClass: 'bg-blue-50 text-blue-700 border-blue-200',
      dotClass: 'bg-blue-500',
    },
    maintenance: {
      text: 'In Repair',
      badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
      dotClass: 'bg-amber-500',
    },
  }[asset.status];

  return (
    <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-neutral-50/50">
      {/* Top Header with Integrated Back Navigation & Action Controls */}
      <Header
        title={asset.name}
        subtitle={`Serial: ${asset.serialNumber} • ${asset.location}`}
        backHref="/assets"
        backLabel="Assets"
        showExport={false}
        actions={
          !isAllowed ? (
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-100 text-neutral-600 rounded text-xs font-semibold border border-neutral-200">
              <Shield className="w-3.5 h-3.5 text-neutral-500" />
              <span>Read-Only Lab Access</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href={`/assets/${asset.id}/relocate`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-neutral-200 hover:bg-neutral-50 text-neutral-800 rounded text-xs font-semibold transition-colors cursor-pointer shadow-xs"
              >
                <ArrowLeftRight className="w-3.5 h-3.5 text-neutral-500" />
                <span className="hidden sm:inline">Relocate</span>
              </Link>

              {asset.loanStatus === 'on_loan' ? (
                <button
                  type="button"
                  onClick={handleReturnFromDetails}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-semibold transition-colors cursor-pointer shadow-xs"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Return to Lab</span>
                </button>
              ) : (
                <Link
                  href={`/assets/${asset.id}/lend`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-white rounded text-xs font-semibold transition-colors cursor-pointer shadow-xs"
                >
                  <Laptop className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Lend / Check-Out</span>
                </Link>
              )}

              <Link
                href={`/assets/${asset.id}/edit`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-neutral-200 hover:bg-neutral-50 text-neutral-800 rounded text-xs font-semibold transition-colors cursor-pointer shadow-xs"
              >
                <Edit3 className="w-3.5 h-3.5 text-neutral-600" />
                <span>Edit</span>
              </Link>

              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-white border border-neutral-200 hover:border-rose-300 hover:bg-rose-50 text-rose-700 rounded text-xs font-medium transition-colors cursor-pointer"
                title="Delete asset"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Delete</span>
              </button>
            </div>
          )
        }
      />

      <div className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-6 w-full">

        {/* Lab Scope Restriction Banner */}
        {!isAllowed && (
          <div className="p-4 bg-amber-50/80 border border-amber-300/80 rounded-2xl flex items-start gap-3 shadow-2xs">
            <Shield className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <div className="text-xs font-bold text-amber-950">
                Restricted Laboratory Equipment
              </div>
              <div className="text-xs text-amber-800 leading-relaxed">
                This equipment is stationed in <span className="font-semibold text-neutral-900">{asset.location}</span>. Your account is assigned to manage: <span className="font-semibold text-neutral-900">{user?.assignedLabs?.includes('all') ? 'All Laboratories' : user?.assignedLabs?.join(', ') || 'No Assigned Labs'}</span>. You have read-only visibility; relocation, status toggling, loans, editing, and deletion are reserved for assigned lab operators.
              </div>
            </div>
          </div>
        )}

        {/* On-Loan / Checked-Out Status Alert Banner */}
        {asset.loanStatus === 'on_loan' && (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 border border-amber-200 flex items-center justify-center shrink-0">
                <Laptop className="w-5 h-5 text-amber-700" />
              </div>
              <div>
                <div className="text-xs font-bold text-amber-900 flex items-center gap-2 flex-wrap">
                  <span>Currently On Loan / Checked Out</span>
                  <span className="text-[11px] font-mono bg-amber-100 border border-amber-200 text-amber-900 px-2 py-0.5 rounded-md font-semibold">
                    Due: {asset.loanDueDate || 'Scheduled'}
                  </span>
                </div>
                <div className="text-xs text-amber-800 mt-0.5">
                  Checked out to <span className="font-semibold text-neutral-900">{asset.currentBorrower || 'Active Borrower'}</span>.
                </div>
              </div>
            </div>
            {isAllowed && (
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleReturnFromDetails}
                  className="px-3.5 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-semibold rounded-lg cursor-pointer transition-colors shadow-xs"
                >
                  Return to Lab
                </button>
              </div>
            )}
          </div>
        )}

        {/* Top Summary / Status Card */}
        <div className="bg-white border border-neutral-200/80 rounded-2xl p-4 sm:p-5 shadow-2xs space-y-4">
          {/* Top Badges */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold border ${statusBadge.badgeClass}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${statusBadge.dotClass}`} />
              {statusBadge.text}
            </span>

            <span className="font-mono text-[11px] font-semibold text-neutral-700 bg-neutral-50 px-2.5 py-1 rounded-md border border-neutral-200">
              {asset.model}
            </span>

            <button
              type="button"
              onClick={handleCopySerial}
              className="inline-flex items-center gap-1.5 font-mono text-[11px] text-neutral-700 bg-neutral-50 hover:bg-neutral-100 px-2.5 py-1 rounded-md border border-neutral-200 transition-colors cursor-pointer"
              title="Click to copy serial tag"
            >
              <span>SN: {asset.serialNumber}</span>
              {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3 text-neutral-400" />}
            </button>

            {asset.nextCalibration && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium bg-neutral-50 text-neutral-600 border border-neutral-200">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Audit: {asset.nextCalibration}</span>
              </span>
            )}
          </div>

          {/* Title, Metadata & Status Control */}
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 pt-1">
            <div className="min-w-0">
              <h1 className="text-lg sm:text-xl font-bold tracking-tight text-neutral-900 truncate">
                {asset.name}
              </h1>
              <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm text-neutral-600 mt-1.5 flex-wrap font-medium">
                <span className="text-neutral-900 font-semibold flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                  {asset.location}
                </span>
                <span className="text-neutral-300">·</span>
                <span className="font-mono text-neutral-700 font-semibold">
                  {asset.totalUnits ?? 1} {asset.unitType ?? 'Units'}
                </span>
                {allocations.length > 0 && (
                  <>
                    <span className="text-neutral-300">·</span>
                    <span className="text-emerald-700 font-semibold">
                      {totalAllocated} Allocated across {allocations.length} {allocations.length === 1 ? 'room' : 'rooms'}
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Operational Status Switcher */}
            <div className="flex items-center gap-2.5 shrink-0 bg-neutral-50 border border-neutral-200/80 px-3 py-2 rounded-xl self-start lg:self-auto">
              <span className="text-[10px] uppercase font-semibold text-neutral-500 tracking-wider px-1">
                Status
              </span>
              <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-neutral-200/80">
                <button
                  type="button"
                  disabled={!isAllowed}
                  onClick={() => handleStatusChange('operational')}
                  className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer disabled:cursor-not-allowed ${
                    asset.status === 'operational'
                      ? 'bg-emerald-600 text-white shadow-2xs'
                      : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50'
                  }`}
                >
                  Operational
                </button>
                <button
                  type="button"
                  disabled={!isAllowed}
                  onClick={() => handleStatusChange('in_use')}
                  className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer disabled:cursor-not-allowed ${
                    asset.status === 'in_use'
                      ? 'bg-blue-600 text-white shadow-2xs'
                      : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50'
                  }`}
                >
                  In Use
                </button>
                <button
                  type="button"
                  disabled={!isAllowed}
                  onClick={() => handleStatusChange('maintenance')}
                  className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer disabled:cursor-not-allowed ${
                    asset.status === 'maintenance'
                      ? 'bg-amber-600 text-white shadow-2xs'
                      : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50'
                  }`}
                >
                  In Repair
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Full-Width Responsive Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Asset Photo */}
          <div className="lg:col-span-4 xl:col-span-4 2xl:col-span-3 flex flex-col gap-6">
            <div className="bg-white border border-neutral-200/80 rounded-2xl p-5 shadow-2xs space-y-4">
              <div className="flex items-center gap-2 border-b border-neutral-100 pb-3">
                <Cpu className="w-4 h-4 text-neutral-700" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-900">
                  Asset Photo
                </h3>
              </div>

              <div className="w-full aspect-video rounded-xl border border-neutral-200/80 bg-neutral-50 overflow-hidden flex items-center justify-center">
                <LabThumbnail
                  src={asset.imageUrl}
                  alt={asset.name}
                  size="card"
                  fallbackType="item"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>

          {/* Right Column: Specifications & Lab Notes */}
          <div className="lg:col-span-8 xl:col-span-8 2xl:col-span-9 flex flex-col gap-6">
            {/* Technical Specifications */}
            <div className="bg-white border border-neutral-200/80 rounded-2xl overflow-hidden shadow-2xs">
              <div className="px-5 py-3.5 border-b border-neutral-100 flex items-center gap-2">
                <Layers className="w-4 h-4 text-neutral-700" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-900">
                  Technical Specifications
                </h3>
              </div>

              <div className="divide-y divide-neutral-100 text-xs">
                <div className="grid grid-cols-3 px-5 py-3 items-center gap-4">
                  <span className="font-medium text-neutral-500">Model</span>
                  <span className="col-span-2 font-mono font-semibold text-neutral-900">{asset.model}</span>
                </div>

                <div className="grid grid-cols-3 px-5 py-3 items-center gap-4">
                  <span className="font-medium text-neutral-500">Serial Number</span>
                  <span className="col-span-2 font-mono text-neutral-800">{asset.serialNumber}</span>
                </div>

                <div className="grid grid-cols-3 px-5 py-3 items-center gap-4">
                  <span className="font-medium text-neutral-500">Total Units</span>
                  <span className="col-span-2 font-mono font-bold text-neutral-900">
                    {asset.totalUnits ?? 1} {asset.unitType ?? 'Units'}
                  </span>
                </div>

                <div className="grid grid-cols-3 px-5 py-3 items-center gap-4">
                  <span className="font-medium text-neutral-500">Assigned Laboratory</span>
                  <span className="col-span-2 font-medium text-neutral-900 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                    <span>{asset.location}</span>
                  </span>
                </div>

                <div className="grid grid-cols-3 px-5 py-3 items-center gap-4">
                  <span className="font-medium text-neutral-500">Operational Status</span>
                  <div className="col-span-2">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-semibold border ${statusBadge.badgeClass}`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${statusBadge.dotClass}`} />
                      <span>{statusBadge.text}</span>
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-3 px-5 py-3 items-center gap-4">
                  <span className="font-medium text-neutral-500">Next Audit</span>
                  <span className="col-span-2 font-mono text-neutral-800">
                    {asset.nextCalibration || 'Not Scheduled'}
                  </span>
                </div>
              </div>
            </div>

            {/* Equipment Description & Lab Notes */}
            <div className="bg-white border border-neutral-200/80 rounded-2xl p-5 sm:p-6 space-y-3 shadow-2xs">
              <div className="flex items-center gap-2 border-b border-neutral-100 pb-3">
                <ShieldCheck className="w-4 h-4 text-neutral-700" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-900">
                  Equipment Description &amp; Lab Notes
                </h3>
              </div>

              <div className="text-xs text-neutral-700 leading-relaxed pt-1">
                {asset.description ? (
                  <p className="whitespace-pre-line">{asset.description}</p>
                ) : (
                  <p className="text-neutral-400 italic">No technical notes recorded.</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Full-Width Classroom & Laboratory Allocations Card */}
        <div className="bg-white border border-neutral-200/80 rounded-2xl p-5 sm:p-6 shadow-2xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-100 pb-4">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-emerald-600" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-900">
                Classroom &amp; Laboratory Allocations
              </h3>
            </div>
            <div className="flex items-center gap-2 text-xs flex-wrap">
              <span className="font-mono font-bold text-neutral-900 bg-neutral-100 px-2.5 py-1 rounded-md border border-neutral-200/80 whitespace-nowrap">
                {totalAllocated} {asset.unitType ?? 'Units'} Deployed
              </span>
              <span className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-neutral-100 text-neutral-700 border border-neutral-200 font-mono whitespace-nowrap">
                {allocations.length} {allocations.length === 1 ? 'room' : 'rooms'}
              </span>
            </div>
          </div>

          {/* Telemetry Status Strip */}
          {allocations.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-neutral-50/80 p-3.5 rounded-xl border border-neutral-200/60 text-xs">
              <div className="space-y-0.5">
                <div className="text-[10px] uppercase font-bold text-neutral-500">Working Fleet</div>
                <div className="font-mono font-bold text-emerald-700 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  {allocationSummary.totalWorking} {asset.unitType ?? 'Units'}
                </div>
              </div>
              <div className="space-y-0.5">
                <div className="text-[10px] uppercase font-bold text-neutral-500">In Repair</div>
                <div className="font-mono font-bold text-blue-700 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-blue-500" />
                  {allocationSummary.totalMaintenance} {asset.unitType ?? 'Units'}
                </div>
              </div>
              <div className="space-y-0.5">
                <div className="text-[10px] uppercase font-bold text-neutral-500">Defect / Broken</div>
                <div className="font-mono font-bold text-rose-700 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-rose-500" />
                  {allocationSummary.totalBroken} {asset.unitType ?? 'Units'}
                </div>
              </div>
              <div className="space-y-0.5">
                <div className="text-[10px] uppercase font-bold text-neutral-500">Readiness Rate</div>
                <div className="font-mono font-bold text-neutral-900">
                  {allocationSummary.operationalRate}% Operational
                </div>
              </div>
            </div>
          )}

          {allocations.length === 0 ? (
            <div className="py-8 text-center space-y-1.5 bg-neutral-50/50 rounded-xl border border-dashed border-neutral-200">
              <Package className="w-6 h-6 text-neutral-400 mx-auto mb-1 stroke-1" />
              <p className="text-xs text-neutral-600 font-semibold">
                No classroom or laboratory allocations recorded.
              </p>
              <p className="text-[11px] text-neutral-400">
                Stationed in central inventory at {asset.location}.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-neutral-200/80">
              <table className="w-full text-left text-xs min-w-[820px]">
                <thead className="bg-neutral-50 border-b border-neutral-200 text-neutral-600 font-semibold">
                  <tr>
                    <th className="py-3 px-4 whitespace-nowrap">Room &amp; Facility</th>
                    <th className="py-3 px-3.5 whitespace-nowrap">Building &amp; Floor</th>
                    <th className="py-3 px-3.5 text-center whitespace-nowrap">Allocated</th>
                    <th className="py-3 px-3.5 text-center whitespace-nowrap">Working</th>
                    <th className="py-3 px-3.5 text-center whitespace-nowrap">Repair</th>
                    <th className="py-3 px-3.5 text-center whitespace-nowrap">Broken</th>
                    <th className="py-3 px-3.5 whitespace-nowrap">Condition Remarks</th>
                    <th className="py-3 px-4 text-right whitespace-nowrap">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {allocations.map((alloc) => {
                    const formattedAuditDate = alloc.lastAuditedAt
                      ? (() => {
                          const parsed = new Date(alloc.lastAuditedAt);
                          return Number.isNaN(parsed.getTime())
                            ? alloc.lastAuditedAt
                            : parsed.toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                              });
                        })()
                      : null;

                    return (
                      <tr key={alloc.inventoryId} className="hover:bg-neutral-50/70 transition-colors group">
                        <td className="py-3.5 px-4">
                          <Link
                            href={`/locations/${alloc.locationId}`}
                            className="font-bold text-neutral-900 group-hover:text-emerald-700 transition-colors inline-flex items-center gap-2.5"
                          >
                            <span className="font-mono bg-neutral-900 text-white px-2 py-0.5 rounded text-[10px] font-bold shadow-2xs shrink-0 whitespace-nowrap">
                              {alloc.room}
                            </span>
                            <span className="whitespace-nowrap">{alloc.locationName}</span>
                          </Link>
                        </td>
                        <td className="py-3.5 px-3.5 text-neutral-500 font-medium whitespace-nowrap">
                          {alloc.building || 'Engineering Block A'}
                        </td>
                        <td className="py-3.5 px-3.5 text-center font-mono font-bold text-neutral-900 whitespace-nowrap">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-bold bg-neutral-900 text-white shadow-2xs whitespace-nowrap">
                            {alloc.total} {alloc.unit}
                          </span>
                        </td>
                        <td className="py-3.5 px-3.5 text-center font-mono whitespace-nowrap">
                          <span className="inline-flex items-center gap-1 font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md text-[11px] whitespace-nowrap">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            {alloc.qtyWorking}
                          </span>
                        </td>
                        <td className="py-3.5 px-3.5 text-center font-mono whitespace-nowrap">
                          {alloc.qtyMaintenance > 0 ? (
                            <span className="inline-flex items-center gap-1 font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-md text-[11px] whitespace-nowrap">
                              <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                              {alloc.qtyMaintenance}
                            </span>
                          ) : (
                            <span className="text-neutral-300 font-normal">—</span>
                          )}
                        </td>
                        <td className="py-3.5 px-3.5 text-center font-mono whitespace-nowrap">
                          {alloc.qtyBroken > 0 ? (
                            <span className="inline-flex items-center gap-1 font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-md text-[11px] whitespace-nowrap">
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                              {alloc.qtyBroken}
                            </span>
                          ) : (
                            <span className="text-neutral-300 font-normal">—</span>
                          )}
                        </td>
                        <td className="py-3.5 px-3.5 text-neutral-500 text-[11px] min-w-[200px] max-w-sm">
                          <div className="truncate" title={alloc.remarks || 'Standard condition'}>
                            {alloc.remarks || (
                              <span className="text-neutral-400 italic">Standard condition</span>
                            )}
                          </div>
                          {formattedAuditDate && (
                            <div className="text-[10px] text-neutral-400 font-mono mt-0.5 whitespace-nowrap">
                              Audited: {formattedAuditDate}
                            </div>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            {isAllowed && (
                              <Link
                                href={`/assets/${asset.id}/relocate?from=${encodeURIComponent(`${alloc.locationName} (${alloc.room})`)}`}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-neutral-700 bg-white hover:bg-neutral-50 border border-neutral-200 hover:border-neutral-300 rounded-lg transition-colors shadow-2xs hover:text-neutral-900 cursor-pointer whitespace-nowrap"
                                title={`Relocate units stationed in ${alloc.room}`}
                              >
                                <ArrowLeftRight className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                                <span>Relocate</span>
                              </Link>
                            )}

                            <Link
                              href={`/locations/${alloc.locationId}`}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-neutral-700 bg-white border border-neutral-200 rounded-lg hover:bg-neutral-50 hover:border-neutral-300 hover:text-neutral-900 transition-all shadow-2xs group-hover:text-emerald-700 whitespace-nowrap"
                            >
                              <span>View Room</span>
                              <ArrowUpRight className="w-3.5 h-3.5 text-neutral-400 group-hover:text-emerald-600 shrink-0" />
                            </Link>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-neutral-200 max-w-md w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center gap-3 text-rose-700">
              <div className="w-10 h-10 rounded-full bg-rose-50 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-neutral-900">Delete Hardware Asset</h3>
                <p className="text-xs text-neutral-500">This action cannot be undone.</p>
              </div>
            </div>

            <p className="text-xs text-neutral-600">
              Are you sure you want to permanently delete{' '}
              <span className="font-semibold text-neutral-900">{asset.name}</span> ({asset.serialNumber}) from the asset directory?
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium border border-neutral-200 text-neutral-700 hover:bg-neutral-50 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white transition-colors cursor-pointer"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

