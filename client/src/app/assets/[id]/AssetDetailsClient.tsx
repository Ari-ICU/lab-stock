'use client';

import React, { useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Header } from '@/components/Header';
import { useStock } from '@/context/StockContext';
import { useAuth } from '@/context/AuthContext';
import { Dropdown } from '@/components/Dropdown';
import { DatePicker } from '@/components/DatePicker';
import { getOptimizedImageUrl } from '@/lib/imageOptimization';
import { LoadingScreen } from '@/components/LoadingScreen';
import {
  ArrowLeft,
  ArrowRight,
  Edit3,
  Trash2,
  Copy,
  Check,
  Calendar,
  MapPin,
  Tag,
  Hash,
  Layers,
  Wrench,
  CheckCircle2,
  Clock,
  AlertTriangle,
  QrCode,
  ShieldCheck,
  Shield,
  Cpu,
  Share2,
  ExternalLink,
  Plus,
  X,
  ArrowLeftRight,
  Laptop,
  Router,
} from 'lucide-react';

export default function AssetDetailsClient({ id: propId }: { id?: string }) {
  const params = useParams();
  const router = useRouter();
  const id = propId || (params?.id as string);

  const {
    assets,
    updateAsset,
    deleteAsset,
    maintenance,
    addMaintenance,
    locations,
    loans,
    transfers,
    lendAsset,
    returnAsset,
    showToast,
    isLoading,
  } = useStock();
  const { user, canManageLocation } = useAuth();
  const [copied, setCopied] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showAddLogModal, setShowAddLogModal] = useState(false);

  // Maintenance form state
  const [logType, setLogType] = useState<'Firmware Upgrade' | 'Port Audit' | 'Hardware RMA' | 'Power Supply Replacement'>('Port Audit');
  const [logTechnician, setLogTechnician] = useState('Thoeurn Ratha');
  const [logStatus, setLogStatus] = useState<'Completed' | 'Pending' | 'In Progress'>('Completed');
  const [logNotes, setLogNotes] = useState('');

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
        qtyWorking: asset.status === 'operational' ? (asset.totalUnits ?? 1) : 0,
        qtyBroken: asset.status === 'maintenance' ? (asset.totalUnits ?? 1) : 0,
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

  const handleAddMaintenanceLog = (e: React.FormEvent) => {
    e.preventDefault();
    addMaintenance({
      assetName: asset.name,
      serialNumber: asset.serialNumber,
      type: logType,
      date: new Date().toISOString().split('T')[0],
      technician: logTechnician,
      status: logStatus,
      notes: logNotes || 'Routine inspection completed.',
    });
    setShowAddLogModal(false);
    setLogNotes('');
    showToast(`Added service log for ${asset.name}`);
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

  // Find related maintenance logs
  const assetLogs = maintenance.filter(
    (m) =>
      m.serialNumber.toLowerCase() === asset.serialNumber.toLowerCase() ||
      asset.name.toLowerCase().includes(m.assetName.toLowerCase()) ||
      m.assetName.toLowerCase().includes(asset.name.toLowerCase())
  );

  const statusBadge = {
    operational: {
      text: 'Operational',
      badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      dotClass: 'bg-emerald-500',
    },
    in_use: {
      text: 'In Production',
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
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-neutral-300 hover:bg-neutral-50 text-neutral-800 rounded text-xs font-semibold transition-colors cursor-pointer shadow-xs"
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
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-neutral-100 hover:bg-neutral-200 border border-neutral-300 text-neutral-800 rounded text-xs font-semibold transition-colors cursor-pointer shadow-xs"
                >
                  <Laptop className="w-3.5 h-3.5 text-neutral-600" />
                  <span>Lend Out</span>
                </Link>
              )}

              <Link
                href={`/assets/${asset.id}/edit`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-white rounded text-xs font-semibold transition-colors cursor-pointer shadow-xs"
              >
                <Edit3 className="w-3.5 h-3.5 text-neutral-300" />
                <span>Edit</span>
              </Link>

              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 rounded text-xs font-semibold transition-colors cursor-pointer shadow-xs"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Delete</span>
              </button>
            </div>
          )
        }
      />

      <div className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-6 max-w-8xl w-full mx-auto">

        {/* Lab Scope Restriction Banner */}
        {!isAllowed && (
          <div className="p-4 bg-amber-50/80 border border-amber-300/80 rounded-lg flex items-start gap-3 shadow-xs">
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

        {/* Delete Confirmation Alert Banner */}
        {showDeleteConfirm && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <div className="text-xs font-bold text-rose-900">Confirm Deletion</div>
                <div className="text-xs text-rose-700">
                  Are you sure you want to delete <span className="font-semibold">{asset.name}</span>? This action cannot be undone.
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="px-3 py-1 text-xs font-medium text-neutral-600 hover:text-neutral-900 bg-white border border-neutral-300 rounded cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="px-3 py-1 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded transition-colors cursor-pointer"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        )}

        {/* On-Loan / Checked-Out Status Alert Banner */}
        {asset.loanStatus === 'on_loan' && (
          <div className="p-4 bg-amber-50 border border-amber-300 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded bg-amber-100 border border-amber-200 flex items-center justify-center shrink-0">
                <Laptop className="w-5 h-5 text-amber-700" />
              </div>
              <div>
                <div className="text-xs font-bold text-amber-900 flex items-center gap-2">
                  <span>CURRENTLY ON LOAN / CHECKED OUT</span>
                  <span className="text-[10px] font-mono bg-amber-200/80 text-amber-900 px-1.5 py-0.5 rounded font-semibold">
                    Due: {asset.loanDueDate || 'Scheduled'}
                  </span>
                </div>
                <div className="text-xs text-amber-800 mt-0.5">
                  Checked out to <span className="font-semibold text-neutral-900">{asset.currentBorrower || 'Active Borrower'}</span>.
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={handleReturnFromDetails}
                className="px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-semibold rounded cursor-pointer transition-colors shadow-xs"
              >
                Return to Lab Stock
              </button>
            </div>
          </div>
        )}

        {/* Asset Header Banner (Clean without background image) */}
        <div className="relative w-full rounded-2xl bg-neutral-900 text-white border border-neutral-800 p-5 sm:p-6 shadow-xs overflow-hidden">
          {/* Subtle ambient accent glow */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-blue-500/5 rounded-full blur-2xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row gap-5 items-start">
            {/* Asset Photo Frame */}
            <div className="w-full md:w-56 h-44 rounded-xl border border-neutral-700 bg-neutral-800 overflow-hidden shrink-0 relative group shadow-sm">
              {asset.imageUrl ? (
                <img
                  src={getOptimizedImageUrl(asset.imageUrl, 'card')}
                  alt={asset.name}
                  decoding="async"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-neutral-500 gap-2">
                  <Cpu className="w-8 h-8" />
                  <span className="text-[10px] font-mono">No Image Uploaded</span>
                </div>
              )}
              <div className="absolute top-2 left-2">
                <span
                  className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-bold shadow-xs ${
                    asset.status === 'operational'
                      ? 'bg-emerald-500 text-white'
                      : asset.status === 'in_use'
                      ? 'bg-blue-500 text-white'
                      : 'bg-amber-500 text-white'
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-white" />
                  {statusBadge.text}
                </span>
              </div>
            </div>

            {/* Asset Info & Quick Controls */}
            <div className="flex-1 min-w-0 space-y-4">
              {/* Badges */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono text-xs sm:text-sm font-bold bg-white text-neutral-900 px-2.5 py-1 rounded-md shadow-xs flex items-center gap-1.5">
                  <Router className="w-3.5 h-3.5 text-neutral-900" />
                  <span>HARDWARE ASSET</span>
                </span>

                {asset.loanStatus === 'on_loan' && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] sm:text-xs font-bold bg-amber-500 text-white shadow-xs">
                    <span className="w-1.5 h-1.5 rounded-full bg-white" />
                    On Loan ({asset.currentBorrower || 'Active'})
                  </span>
                )}

                <button
                  type="button"
                  onClick={handleCopySerial}
                  className="inline-flex items-center gap-1.5 font-mono text-[10px] sm:text-xs text-neutral-300 bg-neutral-800/90 hover:bg-neutral-700/90 px-2.5 py-1 rounded-md border border-neutral-700 transition-colors cursor-pointer"
                  title="Click to copy serial tag"
                >
                  <span>SN: {asset.serialNumber}</span>
                  {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-neutral-400" />}
                </button>

                <span className="font-mono text-[10px] sm:text-xs text-neutral-400 bg-neutral-800/90 px-2.5 py-1 rounded-md border border-neutral-700">
                  ID: {asset.id}
                </span>
              </div>

              {/* Title & Specs */}
              <div>
                <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight truncate">
                  {asset.name}
                </h1>
                <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm text-neutral-300 mt-1.5 flex-wrap font-medium">
                  <span className="text-white font-mono font-semibold">{asset.model}</span>
                  <span className="text-neutral-500">·</span>
                  <span className="flex items-center gap-1 text-neutral-300">
                    <MapPin className="w-3.5 h-3.5 text-neutral-400" />
                    {asset.location}
                  </span>
                  <span className="text-neutral-500">·</span>
                  <span className="text-emerald-400 font-bold font-mono">
                    {asset.totalUnits ?? 1} {asset.unitType ?? 'Units'} Deployed
                  </span>
                  {asset.nextCalibration && (
                    <>
                      <span className="text-neutral-500 hidden sm:inline">·</span>
                      <span className="text-neutral-400 font-mono text-xs hidden sm:inline">
                        Next Audit: {asset.nextCalibration}
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* Status Switcher & Quick Actions */}
              <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-neutral-800/80">
                <div className="flex items-center gap-2">
                  <span className="text-neutral-400 text-xs">Status:</span>
                  <div className="flex items-center gap-1 bg-neutral-800/90 p-1 rounded-lg border border-neutral-700/80">
                    <button
                      type="button"
                      disabled={!isAllowed}
                      onClick={() => handleStatusChange('operational')}
                      className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                        asset.status === 'operational'
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'text-neutral-300 hover:text-white hover:bg-neutral-700/60'
                      }`}
                    >
                      Operational
                    </button>
                    <button
                      type="button"
                      disabled={!isAllowed}
                      onClick={() => handleStatusChange('in_use')}
                      className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                        asset.status === 'in_use'
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'text-neutral-300 hover:text-white hover:bg-neutral-700/60'
                      }`}
                    >
                      In Use
                    </button>
                    <button
                      type="button"
                      disabled={!isAllowed}
                      onClick={() => handleStatusChange('maintenance')}
                      className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                        asset.status === 'maintenance'
                          ? 'bg-amber-600 text-white shadow-xs'
                          : 'text-neutral-300 hover:text-white hover:bg-neutral-700/60'
                      }`}
                    >
                      Repair
                    </button>
                  </div>
                </div>

                {allocations.length > 0 && (
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-neutral-400 text-xs">Allocations:</span>
                    {allocations.map((a) => (
                      <Link
                        key={a.inventoryId}
                        href={`/locations/${a.locationId}`}
                        className="inline-flex items-center gap-1 text-[11px] font-mono font-bold bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700 px-2 py-0.5 rounded transition-colors"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                        <span>{a.room} ({a.total})</span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Two-Column Grid: Specifications & Identity */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main 2 Cols: Description & Technical Specifications */}
          <div className="lg:col-span-2 space-y-6">
            {/* Description & Operating Purpose */}
            <div className="bg-white border border-neutral-200 rounded-lg p-5 shadow-sm space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-700 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-neutral-900" />
                Equipment Description & Lab Architecture
              </h3>
              <p className="text-xs text-neutral-600 leading-relaxed">
                {asset.description ||
                  `${asset.name} is permanently allocated to Computer Lab Room 102B. This equipment supports academic networking simulations, student laboratory exercises, and departmental compute infrastructure.`}
              </p>
            </div>

            {/* Technical Specifications Matrix */}
            <div className="bg-white border border-neutral-200 rounded-lg overflow-hidden shadow-sm">
              <div className="p-4 border-b border-neutral-200 bg-neutral-50/70 flex items-center justify-between">
                <h3 className="text-xs font-bold text-neutral-900 uppercase tracking-wide">
                  Technical Specifications
                </h3>
                <span className="text-[11px] font-mono text-neutral-500">Specs Sheet v1.4</span>
              </div>
              <div className="divide-y divide-neutral-100 text-xs">
                <div className="grid grid-cols-3 p-3">
                  <span className="font-medium text-neutral-500">Official Nomenclature</span>
                  <span className="col-span-2 font-semibold text-neutral-900">{asset.name}</span>
                </div>
                <div className="grid grid-cols-3 p-3">
                  <span className="font-medium text-neutral-500">Model / Hardware Build</span>
                  <span className="col-span-2 font-mono text-neutral-800">{asset.model}</span>
                </div>
                <div className="grid grid-cols-3 p-3">
                  <span className="font-medium text-neutral-500">Serial Tag / Asset ID</span>
                  <span className="col-span-2 font-mono text-neutral-800">{asset.serialNumber}</span>
                </div>
                <div className="grid grid-cols-3 p-3">
                  <span className="font-medium text-neutral-500">Laboratory Unit Count</span>
                  <span className="col-span-2 text-neutral-800">
                    <strong className="text-neutral-900">{asset.totalUnits ?? 1}</strong> {asset.unitType ?? 'Unit(s)'}
                    {allocations.length > 0 ? ` (${allocations.map((a) => `${a.room}: ${a.total}`).join(', ')})` : ''}
                  </span>
                </div>
                <div className="grid grid-cols-3 p-3">
                  <span className="font-medium text-neutral-500">Assigned Classroom(s)</span>
                  <span className="col-span-2 flex items-center gap-1.5 flex-wrap">
                    {allocations.length > 0 ? (
                      allocations.map((alloc) => (
                        <Link
                          key={alloc.inventoryId}
                          href={`/locations/${alloc.locationId}`}
                          className="inline-flex items-center gap-1 text-[11px] font-mono font-bold bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded transition-colors"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          <span>{alloc.room} ({alloc.total} {alloc.unit})</span>
                        </Link>
                      ))
                    ) : (
                      <span className="text-neutral-500">{asset.location}</span>
                    )}
                  </span>
                </div>
                <div className="grid grid-cols-3 p-3">
                  <span className="font-medium text-neutral-500">Physical Location</span>
                  <span className="col-span-2 text-neutral-800">{asset.location}</span>
                </div>
                <div className="grid grid-cols-3 p-3">
                  <span className="font-medium text-neutral-500">Operational Status</span>
                  <span className="col-span-2">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold border ${statusBadge.badgeClass}`}
                    >
                      {statusBadge.text}
                    </span>
                  </span>
                </div>
                <div className="grid grid-cols-3 p-3">
                  <span className="font-medium text-neutral-500">Next Audit / Recertification</span>
                  <span className="col-span-2 font-mono text-neutral-800">{asset.nextCalibration}</span>
                </div>
              </div>
            </div>

            {/* Classroom & Laboratory Allocations Card */}
            <div className="bg-white border border-neutral-200/80 rounded-2xl p-5 sm:p-6 shadow-2xs space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-100 pb-4">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-900 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-emerald-600" />
                    <span>Classroom & Laboratory Allocations</span>
                  </h3>
                  <p className="text-[11px] text-neutral-500 mt-0.5">
                    Active deployments, room readiness, and physical audit distribution across campus
                  </p>
                </div>
                <div className="flex items-center gap-2 text-xs flex-wrap">
                  <span className="font-mono font-bold text-neutral-900 bg-neutral-100 px-2.5 py-1 rounded-md border border-neutral-200/80">
                    {totalAllocated} {asset.unitType ?? 'Units'} Deployed
                  </span>
                  <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-neutral-900 text-white shadow-2xs">
                    {allocations.length} {allocations.length === 1 ? 'Classroom' : 'Classrooms'}
                  </span>
                </div>
              </div>

              {/* Telemetry Status Strip */}
              {allocations.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 bg-neutral-50/80 p-3 rounded-xl border border-neutral-200/60 text-xs">
                  <div className="space-y-0.5">
                    <div className="text-[10px] uppercase font-bold text-neutral-500">Working Fleet</div>
                    <div className="font-mono font-bold text-emerald-700 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      {allocationSummary.totalWorking} Units
                    </div>
                  </div>
                  <div className="space-y-0.5">
                    <div className="text-[10px] uppercase font-bold text-neutral-500">In Repair</div>
                    <div className="font-mono font-bold text-blue-700 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-blue-500" />
                      {allocationSummary.totalMaintenance} Units
                    </div>
                  </div>
                  <div className="space-y-0.5">
                    <div className="text-[10px] uppercase font-bold text-neutral-500">Defect / Broken</div>
                    <div className="font-mono font-bold text-rose-700 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-rose-500" />
                      {allocationSummary.totalBroken} Units
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
                <div className="p-8 text-center border border-dashed border-neutral-200 rounded-xl bg-neutral-50/50 space-y-2">
                  <div className="w-10 h-10 rounded-full bg-neutral-100 flex items-center justify-center mx-auto text-neutral-400">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div className="text-xs font-bold text-neutral-800">No Classroom Allocations</div>
                  <p className="text-[11px] text-neutral-500 max-w-sm mx-auto">
                    This hardware asset is not currently allocated to any specific room roster. It is held in central reserve or unassigned depot.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-neutral-200/80">
                  <table className="w-full text-left text-xs min-w-[680px]">
                    <thead className="bg-neutral-50 border-b border-neutral-200 text-neutral-600 font-semibold">
                      <tr>
                        <th className="py-3 px-3.5">Room & Facility</th>
                        <th className="py-3 px-3">Building & Floor</th>
                        <th className="py-3 px-3 text-center">Allocated</th>
                        <th className="py-3 px-3 text-center">Working</th>
                        <th className="py-3 px-3 text-center">Repair</th>
                        <th className="py-3 px-3 text-center">Broken</th>
                        <th className="py-3 px-3">Condition Remarks</th>
                        <th className="py-3 px-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100">
                      {allocations.map((alloc) => (
                        <tr key={alloc.inventoryId} className="hover:bg-neutral-50/70 transition-colors group">
                          <td className="py-3 px-3.5">
                            <Link
                              href={`/locations/${alloc.locationId}`}
                              className="font-bold text-neutral-900 group-hover:text-emerald-700 transition-colors inline-flex items-center gap-2"
                            >
                              <span className="font-mono bg-neutral-900 text-white px-2 py-0.5 rounded text-[10px] font-bold shadow-2xs">
                                {alloc.room}
                              </span>
                              <span className="truncate">{alloc.locationName}</span>
                            </Link>
                          </td>
                          <td className="py-3 px-3 text-neutral-500 font-medium">
                            {alloc.building}
                          </td>
                          <td className="py-3 px-3 text-center font-mono font-bold text-neutral-900">
                            <span className="bg-neutral-100 text-neutral-800 px-2 py-0.5 rounded text-[11px] border border-neutral-200/80">
                              {alloc.total} {alloc.unit}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-center font-mono">
                            <span className="inline-flex items-center gap-1 font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md text-[11px]">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                              {alloc.qtyWorking}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-center font-mono">
                            {alloc.qtyMaintenance > 0 ? (
                              <span className="inline-flex items-center gap-1 font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-md text-[11px]">
                                <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                                {alloc.qtyMaintenance}
                              </span>
                            ) : (
                              <span className="text-neutral-300 font-normal">—</span>
                            )}
                          </td>
                          <td className="py-3 px-3 text-center font-mono">
                            {alloc.qtyBroken > 0 ? (
                              <span className="inline-flex items-center gap-1 font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-md text-[11px]">
                                <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                                {alloc.qtyBroken}
                              </span>
                            ) : (
                              <span className="text-neutral-300 font-normal">—</span>
                            )}
                          </td>
                          <td className="py-3 px-3 text-neutral-500 text-[11px] max-w-xs truncate">
                            {alloc.remarks || (
                              <span className="text-neutral-400 italic">Standard condition</span>
                            )}
                          </td>
                          <td className="py-3 px-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <Link
                                href={`/assets/${asset.id}/relocate?from=${encodeURIComponent(`${alloc.locationName} (${alloc.room})`)}`}
                                className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-neutral-700 bg-white hover:bg-neutral-50 border border-neutral-200 hover:border-neutral-300 rounded-lg transition-colors shadow-2xs hover:text-blue-600 cursor-pointer"
                                title={`Relocate units stationed in ${alloc.room}`}
                              >
                                <ArrowLeftRight className="w-3 h-3 text-neutral-400 hover:text-blue-600" />
                                <span>Relocate</span>
                              </Link>

                              <Link
                                href={`/locations/${alloc.locationId}`}
                                className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-neutral-700 bg-white hover:bg-neutral-50 border border-neutral-200 hover:border-neutral-300 rounded-lg transition-colors shadow-2xs group-hover:text-emerald-700"
                              >
                                <span>View Room</span>
                                <ExternalLink className="w-3 h-3 text-neutral-400 group-hover:text-emerald-600" />
                              </Link>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Service & Maintenance History */}
            <div className="bg-white border border-neutral-200 rounded-lg p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-900 flex items-center gap-2">
                    <Wrench className="w-4 h-4 text-neutral-800" />
                    Service & Maintenance Log
                  </h3>
                  <p className="text-[11px] text-neutral-500">
                    Inspection, firmware updates, and calibration history
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddLogModal(true)}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-neutral-900 bg-neutral-100 hover:bg-neutral-200 border border-neutral-200 rounded transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Log Service</span>
                </button>
              </div>

              {assetLogs.length === 0 ? (
                <div className="p-6 text-center border border-dashed border-neutral-200 rounded-lg bg-neutral-50/50">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                  <div className="text-xs font-semibold text-neutral-800">No Pending Service Issues</div>
                  <div className="text-[11px] text-neutral-500 mt-0.5">
                    This equipment is operating normally with no recorded maintenance interventions.
                  </div>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {assetLogs.map((log) => (
                    <div
                      key={log.id}
                      className="p-3.5 border border-neutral-200 rounded-lg bg-neutral-50/60 hover:bg-neutral-50 transition-colors space-y-1.5"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-neutral-900">{log.type}</span>
                          <span className="text-[11px] text-neutral-500 font-mono">({log.date})</span>
                        </div>
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${
                            log.status === 'Completed'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : log.status === 'In Progress'
                              ? 'bg-blue-50 text-blue-700 border-blue-200'
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}
                        >
                          {log.status}
                        </span>
                      </div>
                      <p className="text-xs text-neutral-600">{log.notes}</p>
                      <div className="text-[11px] text-neutral-400">
                        Technician in charge: <span className="font-medium text-neutral-700">{log.technician}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Col: Identity & Tagging Sidebar */}
          <div className="space-y-6">
            {/* Barcode & Physical Tag Card */}
            <div className="bg-white border border-neutral-200 rounded-lg p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-neutral-900 flex items-center gap-1.5">
                  <QrCode className="w-4 h-4 text-neutral-800" />
                  Asset Tag & Barcode
                </span>
                <span className="text-[10px] font-mono text-neutral-400">Code128</span>
              </div>

              {/* Simulated Code128 Barcode */}
              <div className="p-4 bg-white border border-neutral-300 rounded flex flex-col items-center justify-center space-y-2">
                <div className="flex items-stretch h-14 gap-[2px] w-full max-w-[220px] justify-center py-1">
                  <div className="w-[3px] bg-neutral-900" />
                  <div className="w-[1px] bg-neutral-900" />
                  <div className="w-[2px] bg-transparent" />
                  <div className="w-[4px] bg-neutral-900" />
                  <div className="w-[1px] bg-transparent" />
                  <div className="w-[2px] bg-neutral-900" />
                  <div className="w-[3px] bg-neutral-900" />
                  <div className="w-[1px] bg-transparent" />
                  <div className="w-[4px] bg-neutral-900" />
                  <div className="w-[2px] bg-transparent" />
                  <div className="w-[3px] bg-neutral-900" />
                  <div className="w-[1px] bg-neutral-900" />
                  <div className="w-[2px] bg-transparent" />
                  <div className="w-[2px] bg-neutral-900" />
                  <div className="w-[3px] bg-neutral-900" />
                  <div className="w-[1px] bg-neutral-900" />
                  <div className="w-[4px] bg-neutral-900" />
                  <div className="w-[2px] bg-transparent" />
                  <div className="w-[3px] bg-neutral-900" />
                  <div className="w-[1px] bg-neutral-900" />
                </div>
                <div className="text-[11px] font-mono font-bold tracking-widest text-neutral-800">
                  *{asset.serialNumber}*
                </div>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-neutral-100">
                  <span className="text-neutral-500">Lab Custodian:</span>
                  <span className="font-semibold text-neutral-900">Dr. Heng Sovannarith</span>
                </div>
                <div className="flex justify-between py-1 border-b border-neutral-100">
                  <span className="text-neutral-500">Primary Technician:</span>
                  <span className="font-medium text-neutral-800">Thoeurn Ratha</span>
                </div>
                <div className="flex justify-between py-1 border-b border-neutral-100">
                  <span className="text-neutral-500">Security Group:</span>
                  <span className="font-medium text-neutral-800">Engineering Block A</span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleCopySerial}
                className="w-full py-2 bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 text-neutral-800 rounded text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-neutral-500" />}
                <span>{copied ? 'Serial Copied!' : 'Copy Barcode Tag'}</span>
              </button>
            </div>

            {/* Quick Actions Panel */}
            <div className="bg-white border border-neutral-200 rounded-lg p-5 shadow-sm space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-900">
                Hardware Actions
              </h3>
              <div className="space-y-2">
                {asset.loanStatus === 'on_loan' ? (
                  <button
                    type="button"
                    onClick={handleReturnFromDetails}
                    className="w-full flex items-center justify-between p-2.5 rounded border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 transition-colors text-xs font-medium text-emerald-900 cursor-pointer"
                  >
                    <span className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      Return Device to Lab Stock
                    </span>
                  </button>
                ) : (
                  <Link
                    href={`/assets/${asset.id}/lend`}
                    className="w-full flex items-center justify-between p-2.5 rounded border border-neutral-200 hover:border-neutral-900 hover:bg-neutral-50 transition-colors text-xs font-medium text-neutral-800 cursor-pointer"
                  >
                    <span className="flex items-center gap-2">
                      <Laptop className="w-3.5 h-3.5 text-neutral-600" />
                      Lend Device / Student Check-Out
                    </span>
                    <Plus className="w-3 h-3 text-neutral-400" />
                  </Link>
                )}

                <Link
                  href={`/assets/${asset.id}/relocate`}
                  className="w-full flex items-center justify-between p-2.5 rounded border border-neutral-200 hover:border-neutral-900 hover:bg-neutral-50 transition-colors text-xs font-medium text-neutral-800 cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <ArrowLeftRight className="w-3.5 h-3.5 text-neutral-600" />
                    Move / Relocate to Another Lab
                  </span>
                  <Plus className="w-3 h-3 text-neutral-400" />
                </Link>

                <button
                  type="button"
                  onClick={() => setShowAddLogModal(true)}
                  className="w-full flex items-center justify-between p-2.5 rounded border border-neutral-200 hover:border-neutral-900 hover:bg-neutral-50 transition-colors text-xs font-medium text-neutral-800 cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <Wrench className="w-3.5 h-3.5 text-neutral-600" />
                    Schedule Calibration / RMA
                  </span>
                  <Plus className="w-3 h-3 text-neutral-400" />
                </button>

                <Link
                  href="/assets/create"
                  className="w-full flex items-center justify-between p-2.5 rounded border border-neutral-200 hover:border-neutral-900 hover:bg-neutral-50 transition-colors text-xs font-medium text-neutral-800"
                >
                  <span className="flex items-center gap-2">
                    <Plus className="w-3.5 h-3.5 text-neutral-600" />
                    Create Another Asset
                  </span>
                  <ExternalLink className="w-3 h-3 text-neutral-400" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add Maintenance Log Modal */}
      {showAddLogModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg border border-neutral-300 shadow-xl max-w-md w-full p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-200 pb-3">
              <h3 className="text-sm font-bold text-neutral-900 flex items-center gap-2">
                <Wrench className="w-4 h-4 text-neutral-800" />
                Log Maintenance for {asset.name}
              </h3>
              <button
                type="button"
                onClick={() => setShowAddLogModal(false)}
                className="text-neutral-400 hover:text-neutral-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddMaintenanceLog} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-neutral-700 mb-1">
                  Service / Intervention Type
                </label>
                <Dropdown
                  value={logType}
                  options={[
                    { label: 'Port Audit', value: 'Port Audit' },
                    { label: 'Firmware Upgrade', value: 'Firmware Upgrade' },
                    { label: 'Hardware RMA', value: 'Hardware RMA' },
                    { label: 'Power Supply Replacement', value: 'Power Supply Replacement' },
                  ]}
                  onChange={(val) => setLogType(val as any)}
                />
              </div>

              <div>
                <label className="block font-semibold text-neutral-700 mb-1">
                  Technician
                </label>
                <input
                  type="text"
                  value={logTechnician}
                  onChange={(e) => setLogTechnician(e.target.value)}
                  className="w-full bg-white border border-neutral-300 text-neutral-900 px-3 py-1.5 rounded focus:outline-none focus:border-neutral-900"
                />
              </div>

              <div>
                <label className="block font-semibold text-neutral-700 mb-1">
                  Status
                </label>
                <Dropdown
                  value={logStatus}
                  options={[
                    { label: 'Completed', value: 'Completed' },
                    { label: 'In Progress', value: 'In Progress' },
                    { label: 'Pending', value: 'Pending' },
                  ]}
                  onChange={(val) => setLogStatus(val as any)}
                />
              </div>

              <div>
                <label className="block font-semibold text-neutral-700 mb-1">
                  Inspection Notes & Details
                </label>
                <textarea
                  rows={3}
                  value={logNotes}
                  onChange={(e) => setLogNotes(e.target.value)}
                  placeholder="e.g. Cleaned fan filters, upgraded BIOS/firmware to version 2.4, port loop verification passed."
                  className="w-full bg-white border border-neutral-300 text-neutral-900 p-2.5 rounded focus:outline-none focus:border-neutral-900 placeholder:text-neutral-400"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-neutral-200">
                <button
                  type="button"
                  onClick={() => setShowAddLogModal(false)}
                  className="px-3 py-1.5 border border-neutral-300 text-neutral-700 font-medium rounded hover:bg-neutral-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-white font-semibold rounded"
                >
                  Save Service Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

