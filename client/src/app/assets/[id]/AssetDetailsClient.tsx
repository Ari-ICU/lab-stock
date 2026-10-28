'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Header } from '@/components/Header';
import { useStock } from '@/context/StockContext';
import { Dropdown } from '@/components/Dropdown';
import {
  ArrowLeft,
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
  Cpu,
  Share2,
  ExternalLink,
  Plus,
  X,
} from 'lucide-react';

export default function AssetDetailsClient({ id: propId }: { id?: string }) {
  const params = useParams();
  const router = useRouter();
  const id = propId || (params?.id as string);

  const { assets, updateAsset, deleteAsset, maintenance, addMaintenance, showToast } = useStock();
  const [copied, setCopied] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showAddLogModal, setShowAddLogModal] = useState(false);

  // Maintenance form state
  const [logType, setLogType] = useState<'Firmware Upgrade' | 'Port Audit' | 'Hardware RMA' | 'Power Supply Replacement'>('Port Audit');
  const [logTechnician, setLogTechnician] = useState('Thoeurn Ratha');
  const [logStatus, setLogStatus] = useState<'Completed' | 'Pending' | 'In Progress'>('Completed');
  const [logNotes, setLogNotes] = useState('');

  const asset = assets.find((a) => a.id === id);

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
    if (newStatus === 'operational' || newStatus === 'in_use' || newStatus === 'maintenance') {
      updateAsset({
        ...asset,
        status: newStatus,
      });
    }
  };

  const handleDelete = () => {
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
      text: 'Maintenance / Servicing',
      badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
      dotClass: 'bg-amber-500',
    },
  }[asset.status];

  return (
    <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-neutral-50/50">
      {/* Top Header */}
      <Header
        title={asset.name}
        subtitle={`Serial: ${asset.serialNumber} • ${asset.location}`}
        actionLabel="Edit Asset"
        onAction={() => router.push(`/assets/${asset.id}/edit`)}
        showExport={false}
      />

      <div className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-6 max-w-6xl w-full mx-auto">
        {/* Navigation Breadcrumb bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
          <Link
            href="/assets"
            className="inline-flex items-center gap-1.5 text-neutral-600 hover:text-neutral-900 font-medium transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Hardware Directory</span>
          </Link>

          <div className="flex items-center gap-2">
            <Link
              href={`/assets/${asset.id}/edit`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-neutral-300 text-neutral-800 rounded font-semibold hover:bg-neutral-50 hover:border-neutral-400 transition-colors cursor-pointer shadow-sm"
            >
              <Edit3 className="w-3.5 h-3.5 text-neutral-600" />
              <span>Edit Equipment</span>
            </Link>

            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-rose-200 text-rose-600 rounded font-semibold hover:bg-rose-50 transition-colors cursor-pointer shadow-sm"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Delete</span>
            </button>
          </div>
        </div>

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

        {/* Hero Card */}
        <div className="bg-white border border-neutral-200 rounded-lg p-5 sm:p-6 shadow-sm">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Asset Photo */}
            <div className="w-full md:w-72 h-56 rounded-lg border border-neutral-200 bg-neutral-100 overflow-hidden shrink-0 relative group">
              {asset.imageUrl ? (
                <img
                  src={asset.imageUrl}
                  alt={asset.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-neutral-400 gap-2">
                  <Cpu className="w-10 h-10" />
                  <span className="text-[11px] font-mono">No Image Uploaded</span>
                </div>
              )}
              <div className="absolute top-2.5 left-2.5">
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border shadow-sm backdrop-blur-md ${statusBadge.badgeClass} bg-white/95`}
                >
                  <span className={`w-2 h-2 rounded-full ${statusBadge.dotClass}`} />
                  {statusBadge.text}
                </span>
              </div>
            </div>

            {/* Main Info */}
            <div className="flex-1 flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2 py-0.5 text-[11px] font-bold font-mono uppercase tracking-wide bg-neutral-900 text-white rounded">
                    Room 102B Asset
                  </span>
                  <span className="px-2 py-0.5 text-[11px] font-mono text-neutral-600 bg-neutral-100 border border-neutral-200 rounded">
                    ID: {asset.id}
                  </span>
                </div>

                <h1 className="text-xl sm:text-2xl font-bold text-neutral-900 tracking-tight">
                  {asset.name}
                </h1>
                <p className="text-xs sm:text-sm text-neutral-600 font-mono">
                  {asset.model}
                </p>
              </div>

              {/* Quick Specs Chips */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2 border-t border-neutral-100">
                <div className="p-2.5 bg-neutral-50 rounded border border-neutral-200/80">
                  <div className="text-[10px] uppercase font-bold text-neutral-400 flex items-center gap-1">
                    <Layers className="w-3 h-3 text-neutral-500" /> Total Deployed
                  </div>
                  <div className="text-sm font-bold text-neutral-900 mt-0.5">
                    {asset.totalUnits ?? 1} <span className="text-xs font-medium text-neutral-600">{asset.unitType ?? 'Units'}</span>
                  </div>
                </div>

                <div className="p-2.5 bg-neutral-50 rounded border border-neutral-200/80">
                  <div className="text-[10px] uppercase font-bold text-neutral-400 flex items-center gap-1">
                    <Tag className="w-3 h-3 text-neutral-500" /> Serial Tag
                  </div>
                  <div className="flex items-center justify-between gap-1 mt-0.5">
                    <span className="text-xs font-mono font-semibold text-neutral-900 truncate">
                      {asset.serialNumber}
                    </span>
                    <button
                      onClick={handleCopySerial}
                      className="p-1 text-neutral-400 hover:text-neutral-900 rounded transition-colors"
                      title="Copy serial tag"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div className="p-2.5 bg-neutral-50 rounded border border-neutral-200/80">
                  <div className="text-[10px] uppercase font-bold text-neutral-400 flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-neutral-500" /> Placement
                  </div>
                  <div className="text-xs font-medium text-neutral-900 mt-0.5 truncate" title={asset.location}>
                    {asset.location}
                  </div>
                </div>

                <div className="p-2.5 bg-neutral-50 rounded border border-neutral-200/80">
                  <div className="text-[10px] uppercase font-bold text-neutral-400 flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-neutral-500" /> Next Audit
                  </div>
                  <div className="text-xs font-mono font-semibold text-neutral-900 mt-0.5">
                    {asset.nextCalibration}
                  </div>
                </div>
              </div>

              {/* Status Quick-Switch Bar */}
              <div className="pt-2 flex flex-wrap items-center gap-2 text-xs">
                <span className="text-neutral-500 font-medium">Quick Status:</span>
                <button
                  type="button"
                  onClick={() => handleStatusChange('operational')}
                  className={`px-2.5 py-1 rounded text-xs font-medium transition-all ${
                    asset.status === 'operational'
                      ? 'bg-emerald-600 text-white font-semibold shadow-sm'
                      : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                  }`}
                >
                  Operational
                </button>
                <button
                  type="button"
                  onClick={() => handleStatusChange('in_use')}
                  className={`px-2.5 py-1 rounded text-xs font-medium transition-all ${
                    asset.status === 'in_use'
                      ? 'bg-blue-600 text-white font-semibold shadow-sm'
                      : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                  }`}
                >
                  In Production
                </button>
                <button
                  type="button"
                  onClick={() => handleStatusChange('maintenance')}
                  className={`px-2.5 py-1 rounded text-xs font-medium transition-all ${
                    asset.status === 'maintenance'
                      ? 'bg-amber-600 text-white font-semibold shadow-sm'
                      : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                  }`}
                >
                  Under Maintenance
                </button>
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
                    <strong className="text-neutral-900">{asset.totalUnits ?? 1}</strong> {asset.unitType ?? 'Unit(s)'} installed in Room 102B
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
                <Link
                  href={`/assets/${asset.id}/edit`}
                  className="w-full flex items-center justify-between p-2.5 rounded border border-neutral-200 hover:border-neutral-900 hover:bg-neutral-50 transition-colors text-xs font-medium text-neutral-800"
                >
                  <span className="flex items-center gap-2">
                    <Edit3 className="w-3.5 h-3.5 text-neutral-600" />
                    Modify Specs & Location
                  </span>
                  <ExternalLink className="w-3 h-3 text-neutral-400" />
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

