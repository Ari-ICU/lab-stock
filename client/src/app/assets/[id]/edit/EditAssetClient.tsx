'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Header } from '@/components/Header';
import { useStock } from '@/context/StockContext';
import { ImageUpload } from '@/components/ImageUpload';
import { Dropdown } from '@/components/Dropdown';
import { DatePicker } from '@/components/DatePicker';
import {
  ArrowLeft,
  Save,
  RotateCcw,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  MapPin,
  Tag,
  Hash,
  Layers,
  FileText,
  HelpCircle,
  Eye,
} from 'lucide-react';

const statusOptions = [
  { label: 'Operational (Ready for use)', value: 'operational' },
  { label: 'In Production (Active in lab)', value: 'in_use' },
  { label: 'Maintenance / Servicing', value: 'maintenance' },
];

export default function EditAssetClient({ id: propId }: { id?: string }) {
  const params = useParams();
  const router = useRouter();
  const id = propId || (params?.id as string);

  const { assets, updateAsset, deleteAsset, locations, showToast } = useStock();

  const asset = assets.find((a) => a.id === id);

  const [name, setName] = useState('');
  const [model, setModel] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  const [totalUnits, setTotalUnits] = useState(1);
  const [unitType, setUnitType] = useState('Units');
  const [location, setLocation] = useState('Computer Lab Rm 102B');
  const [status, setStatus] = useState<'operational' | 'in_use' | 'maintenance'>('operational');
  const [nextCalibration, setNextCalibration] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Initialize or re-sync form state when asset loads
  useEffect(() => {
    if (asset) {
      setName(asset.name || '');
      setModel(asset.model || '');
      setSerialNumber(asset.serialNumber || '');
      setTotalUnits(asset.totalUnits ?? 1);
      setUnitType(asset.unitType ?? 'Units');
      setLocation(asset.location || 'Computer Lab Rm 102B');
      setStatus(asset.status || 'operational');
      setNextCalibration(asset.nextCalibration || '2027-06-01');
      setImageUrl(asset.imageUrl || '');
      setDescription(asset.description || '');
    }
  }, [asset]);

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
              The equipment with ID <span className="font-mono font-semibold text-neutral-800">{id}</span> does not exist or has been removed.
            </p>
            <Link
              href="/assets"
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-neutral-900 rounded hover:bg-neutral-800 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Return to Assets Directory
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const locationOptions = locations.map((loc) => ({
    label: `${loc.name} (${loc.room})`,
    value: `${loc.name} (${loc.room})`,
  }));

  const handleReset = () => {
    setName(asset.name || '');
    setModel(asset.model || '');
    setSerialNumber(asset.serialNumber || '');
    setTotalUnits(asset.totalUnits ?? 1);
    setUnitType(asset.unitType ?? 'Units');
    setLocation(asset.location || 'Computer Lab Rm 102B');
    setStatus(asset.status || 'operational');
    setNextCalibration(asset.nextCalibration || '2027-06-01');
    setImageUrl(asset.imageUrl || '');
    setDescription(asset.description || '');
    showToast('Form reset to saved values');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      showToast('Please specify equipment name', 'warning');
      return;
    }
    if (!serialNumber.trim()) {
      showToast('Please specify a serial or asset tag number', 'warning');
      return;
    }

    setIsSubmitting(true);

    try {
      updateAsset({
        id: asset.id,
        name: name.trim(),
        model: model.trim() || 'Standard Specification',
        serialNumber: serialNumber.trim().toUpperCase(),
        totalUnits: Number(totalUnits) || 1,
        unitType: unitType.trim() || 'Units',
        location: location.trim(),
        status,
        nextCalibration: nextCalibration || '2027-06-01',
        imageUrl: imageUrl.trim() || undefined,
        description: description.trim() || undefined,
      });

      showToast(`Successfully updated ${name.trim()}`);
      router.push(`/assets/${asset.id}`);
    } catch {
      showToast('Failed to update asset specifications', 'error');
      setIsSubmitting(false);
    }
  };

  const handleDelete = () => {
    deleteAsset(asset.id);
    router.push('/assets');
  };

  return (
    <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-neutral-50/50">
      <Header
        title={`Edit: ${asset.name}`}
        subtitle={`Asset ID: ${asset.id} • Room 102B`}
        backHref={`/assets/${asset.id}`}
        backLabel="Details"
        showExport={false}
        actions={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 bg-white border border-neutral-200 text-neutral-700 hover:bg-neutral-50 rounded text-xs font-medium transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5 text-neutral-500" />
              <span className="hidden sm:inline">Reset</span>
            </button>

            <button
              type="button"
              onClick={() => {
                const form = document.getElementById('edit-asset-form') as HTMLFormElement;
                if (form) form.requestSubmit();
              }}
              disabled={isSubmitting}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-neutral-900 hover:bg-neutral-800 disabled:bg-neutral-400 text-white rounded text-xs font-semibold transition-colors cursor-pointer shadow-xs"
            >
              <Save className="w-3.5 h-3.5 text-neutral-300" />
              <span>{isSubmitting ? 'Saving...' : 'Save Changes'}</span>
            </button>

            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 rounded text-xs font-medium transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Delete</span>
            </button>
          </div>
        }
      />

      <div className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-6 max-w-8xl w-full mx-auto">

        {/* Delete Confirmation Alert Banner */}
        {showDeleteConfirm && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <div className="text-xs font-bold text-rose-900">Confirm Deletion</div>
                <div className="text-xs text-rose-700">
                  Are you sure you want to delete <span className="font-semibold">{asset.name}</span>? This will permanently remove it from inventory.
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

        {/* Two-Column Form Layout */}
        <form
          id="edit-asset-form"
          onSubmit={handleSubmit}
          className="grid grid-cols-1 lg:grid-cols-3 gap-6"
        >
          {/* Main 2 Cols: Form Fields */}
          <div className="lg:col-span-2 space-y-6">
            {/* Primary Details Card */}
            <div className="bg-white border border-neutral-200 rounded-lg p-5 sm:p-6 shadow-sm space-y-5">
              <div className="border-b border-neutral-100 pb-3 flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-bold text-neutral-900">Equipment Specifications</h2>
                  <p className="text-xs text-neutral-500">Edit hardware tags, model name, and configuration</p>
                </div>
                <span className="text-[11px] font-mono text-neutral-400">ID: {asset.id}</span>
              </div>

              {/* Equipment Name */}
              <div>
                <label className="block text-xs font-bold text-neutral-800 mb-1 flex items-center justify-between">
                  <span>Equipment / Device Name <span className="text-rose-500">*</span></span>
                  <span className="text-[10px] text-neutral-400 font-normal">e.g. Dell OptiPlex 7090 Desktop</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Cisco Catalyst 9300 48-Port Switch"
                  className="w-full bg-white border border-neutral-300 text-neutral-900 text-xs px-3 py-2 rounded focus:outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 transition-colors font-medium placeholder:text-neutral-400"
                />
              </div>

              {/* Model & Specs */}
              <div>
                <label className="block text-xs font-bold text-neutral-800 mb-1 flex items-center justify-between">
                  <span>Model & Hardware Specifications</span>
                  <span className="text-[10px] text-neutral-400 font-normal">e.g. Core i7 / 16GB RAM / 512GB SSD</span>
                </label>
                <input
                  type="text"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  placeholder="e.g. C9300-48P-A Gigabit L3 Managed"
                  className="w-full bg-white border border-neutral-300 text-neutral-900 text-xs px-3 py-2 rounded focus:outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 transition-colors font-mono placeholder:text-neutral-400"
                />
              </div>

              {/* Serial Number & Quantity */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-neutral-800 mb-1 flex items-center justify-between">
                    <span>Serial Tag / Asset Barcode <span className="text-rose-500">*</span></span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={serialNumber}
                      onChange={(e) => setSerialNumber(e.target.value)}
                      placeholder="e.g. TAG-102B-001"
                      className="w-full bg-white border border-neutral-300 text-neutral-900 text-xs px-3 py-2 rounded focus:outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 transition-colors font-mono uppercase placeholder:text-neutral-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-800 mb-1">
                    Units Quantity
                  </label>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min={1}
                      max={999}
                      value={totalUnits}
                      onChange={(e) => setTotalUnits(parseInt(e.target.value, 10) || 1)}
                      className="w-20 bg-white border border-neutral-300 text-neutral-900 text-xs px-2.5 py-2 rounded focus:outline-none focus:border-neutral-900 font-bold"
                    />
                    <input
                      type="text"
                      value={unitType}
                      onChange={(e) => setUnitType(e.target.value)}
                      placeholder="Units"
                      className="w-full bg-white border border-neutral-300 text-neutral-900 text-xs px-2 py-2 rounded focus:outline-none focus:border-neutral-900 text-center font-medium"
                    />
                  </div>
                </div>
              </div>

              {/* Location & Status using custom Dropdowns */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-neutral-800 mb-1 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-neutral-500" />
                    <span>Assigned Lab Placement</span>
                  </label>
                  <Dropdown
                    value={location}
                    options={locationOptions}
                    onChange={setLocation}
                    placeholder="Select room location"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-800 mb-1 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-neutral-500" />
                    <span>Operational State</span>
                  </label>
                  <Dropdown
                    value={status}
                    options={statusOptions}
                    onChange={(val) => setStatus(val as any)}
                  />
                </div>
              </div>

              {/* Next Audit Date */}
              <div>
                <label className="block text-xs font-bold text-neutral-800 mb-1 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-neutral-500" />
                  <span>Next Audit / Firmware Recertification Date</span>
                </label>
                <DatePicker
                  value={nextCalibration}
                  onChange={setNextCalibration}
                  placeholder="Select audit / calibration date"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-neutral-800 mb-1 flex items-center gap-1">
                  <FileText className="w-3.5 h-3.5 text-neutral-500" />
                  <span>Technical Description & Architecture Notes</span>
                </label>
                <textarea
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Document hardware roles, port mapping, IP ranges, or maintenance notes..."
                  className="w-full bg-white border border-neutral-300 text-neutral-900 text-xs p-3 rounded focus:outline-none focus:border-neutral-900 font-medium placeholder:text-neutral-400"
                />
              </div>
            </div>

            {/* Bottom Actions Bar */}
            <div className="flex items-center justify-between gap-3 bg-white border border-neutral-200 rounded-lg p-4 shadow-sm">
              <Link
                href={`/assets/${asset.id}`}
                className="px-4 py-2 border border-neutral-300 text-neutral-700 text-xs font-semibold rounded hover:bg-neutral-50 transition-colors"
              >
                Discard Changes
              </Link>

              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center gap-1.5 px-6 py-2 bg-neutral-900 hover:bg-neutral-800 disabled:bg-neutral-400 text-white text-xs font-semibold rounded transition-colors cursor-pointer shadow-sm"
              >
                <Save className="w-4 h-4" />
                <span>{isSubmitting ? 'Saving...' : 'Save Changes'}</span>
              </button>
            </div>
          </div>

          {/* Right Col: Image Upload & Live Preview Card */}
          <div className="space-y-6">
            {/* Equipment Photo Upload */}
            <div className="bg-white border border-neutral-200 rounded-lg p-5 shadow-sm space-y-4">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-900">
                  Equipment Photo
                </h3>
                <p className="text-[11px] text-neutral-500">
                  Upload an image or paste a high-resolution direct URL
                </p>
              </div>

              <ImageUpload
                value={imageUrl}
                onChange={setImageUrl}
                label="Asset Photo"
              />
            </div>

            {/* Live Preview Card */}
            <div className="bg-white border border-neutral-200 rounded-lg p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between border-b border-neutral-100 pb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-neutral-900 flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5 text-neutral-600" />
                  Live Preview
                </span>
                <span className="text-[10px] text-neutral-400 font-mono">Realtime</span>
              </div>

              <div className="border border-neutral-200 rounded-lg overflow-hidden bg-neutral-50/50">
                <div className="h-40 bg-neutral-100 relative">
                  {imageUrl ? (
                    <img
                      src={imageUrl}
                      alt={name || 'Hardware Preview'}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-neutral-400 text-xs">
                      <Layers className="w-8 h-8 mb-1" />
                      <span>No image selected</span>
                    </div>
                  )}
                  <span
                    className={`absolute top-2 left-2 text-[10px] font-bold px-2 py-0.5 rounded-full border shadow-sm ${
                      status === 'operational'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : status === 'in_use'
                        ? 'bg-blue-50 text-blue-700 border-blue-200'
                        : 'bg-amber-50 text-amber-700 border-amber-200'
                    }`}
                  >
                    {status === 'operational'
                      ? 'Operational'
                      : status === 'in_use'
                      ? 'In Production'
                      : 'Maintenance'}
                  </span>
                </div>

                <div className="p-3.5 space-y-2">
                  <div className="font-bold text-neutral-900 text-xs truncate">
                    {name || 'Equipment Name'}
                  </div>
                  <div className="text-[11px] text-neutral-600 font-mono truncate">
                    {model || 'Model specifications...'}
                  </div>

                  <div className="pt-2 border-t border-neutral-200/80 grid grid-cols-2 gap-2 text-[11px]">
                    <div>
                      <span className="text-neutral-400 block text-[10px] uppercase font-semibold">Units</span>
                      <span className="font-bold text-neutral-800">
                        {totalUnits} {unitType}
                      </span>
                    </div>
                    <div>
                      <span className="text-neutral-400 block text-[10px] uppercase font-semibold">Serial</span>
                      <span className="font-mono font-bold text-neutral-800 truncate block">
                        {serialNumber || '---'}
                      </span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-neutral-200/80 text-[11px] text-neutral-500 flex items-center gap-1 truncate">
                    <MapPin className="w-3 h-3 text-neutral-400 shrink-0" />
                    <span className="truncate">{location}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

