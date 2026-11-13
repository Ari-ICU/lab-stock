'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Header } from '@/components/Header';
import { useStock } from '@/context/StockContext';
import { useAuth } from '@/context/AuthContext';
import { ImageUpload } from '@/components/ImageUpload';
import { Dropdown } from '@/components/Dropdown';
import { DatePicker } from '@/components/DatePicker';
import { LoadingScreen } from '@/components/LoadingScreen';
import {
  ArrowLeft,
  Save,
  RotateCcw,
  Trash2,
  AlertTriangle,
  MapPin,
  Layers,
  Cpu,
  Shield,
} from 'lucide-react';

const statusOptions = [
  { label: 'Operational', value: 'operational' },
  { label: 'In Use', value: 'in_use' },
  { label: 'In Repair', value: 'maintenance' },
];

export default function EditAssetClient({ id: propId }: { id?: string }) {
  const params = useParams();
  const router = useRouter();
  const id = propId || (params?.id as string);

  const { assets, updateAsset, deleteAsset, locations, showToast, isLoading } = useStock();
  const { user, canManageLocation } = useAuth();

  const asset = assets.find((a) => a.id === id);
  const isAllowed = asset ? canManageLocation(asset.location) : false;

  const [name, setName] = useState('');
  const [model, setModel] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  const [totalUnits, setTotalUnits] = useState(1);
  const [unitType, setUnitType] = useState('Units');
  const [location, setLocation] = useState('Computer Lab Room 102B');
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
      setLocation(asset.location || 'Computer Lab Room 102B');
      setStatus(asset.status || 'operational');
      setNextCalibration(asset.nextCalibration || '2027-06-01');
      setImageUrl(asset.imageUrl || '');
      setDescription(asset.description || '');
    }
  }, [asset]);

  if (!asset && isLoading) {
    return <LoadingScreen message="Loading hardware asset editor..." />;
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

  // Enforce laboratory room management scope
  if (!isAllowed) {
    return (
      <div className="flex-1 flex flex-col min-w-0">
        <Header
          title={`Restricted Scope: ${asset.name}`}
          subtitle={`Stationed in ${asset.location}`}
          showExport={false}
          backHref={`/assets/${asset.id}`}
          backLabel="Back to Asset"
        />
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="bg-white border border-neutral-200 rounded-lg p-8 max-w-lg w-full text-center space-y-4 shadow-sm">
            <div className="w-12 h-12 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center mx-auto text-amber-600">
              <Shield className="w-6 h-6" />
            </div>
            <h2 className="text-base font-bold text-neutral-900">Restricted Laboratory Scope</h2>
            <p className="text-xs text-neutral-600 leading-relaxed">
              This hardware asset is stationed in <span className="font-semibold text-neutral-800">{asset.location}</span>. Your account ({user?.role}) is assigned to manage: <span className="font-semibold text-neutral-800">{user?.assignedLabs?.join(', ') || 'Room 102B, Room 206'}</span>.
            </p>
            <p className="text-xs text-neutral-500">
              Modification and deletion rights are restricted to operators assigned to this laboratory. Universal access is strictly reserved for Primary Lab Administrators.
            </p>
            <div className="pt-2 flex justify-center gap-3">
              <Link
                href={`/assets/${asset.id}`}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded transition-colors"
              >
                View Asset Details
              </Link>
              <Link
                href="/assets"
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-neutral-900 hover:bg-neutral-800 rounded transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Return to Assets
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Only allow selecting locations the user is authorized to manage (unless administrator)
  const managedLocations = locations.filter((loc) => canManageLocation(`${loc.name} (${loc.room})`));
  const locationOptions = (managedLocations.length > 0 ? managedLocations : locations).map((loc) => ({
    label: `${loc.name} (${loc.room})`,
    value: `${loc.name} (${loc.room})`,
  }));

  const handleReset = () => {
    setName(asset.name || '');
    setModel(asset.model || '');
    setSerialNumber(asset.serialNumber || '');
    setTotalUnits(asset.totalUnits ?? 1);
    setUnitType(asset.unitType ?? 'Units');
    setLocation(asset.location || 'Computer Lab Room 102B');
    setStatus(asset.status || 'operational');
    setNextCalibration(asset.nextCalibration || '2027-06-01');
    setImageUrl(asset.imageUrl || '');
    setDescription(asset.description || '');
    showToast('Form reset to saved values');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!isAllowed) {
      showToast('You do not have permission to modify assets stationed in this lab', 'error');
      return;
    }

    if (!canManageLocation(location)) {
      showToast(`You cannot move this asset to "${location}". Your assigned labs: ${user?.assignedLabs?.join(', ') || 'Room 102B, Room 206'}`, 'warning');
      return;
    }

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
      router.push('/assets');
    } catch {
      showToast('Failed to update asset specifications', 'error');
      setIsSubmitting(false);
    }
  };

  const handleDelete = () => {
    if (!isAllowed) {
      showToast('You do not have permission to delete assets stationed in this lab', 'error');
      return;
    }
    deleteAsset(asset.id);
    router.push('/assets');
  };

  return (
    <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-neutral-50/50">
      <Header
        title={`Edit ${asset.name}`}
        subtitle={`SN: ${asset.serialNumber} • ${asset.location}`}
        backHref={`/assets/${asset.id}`}
        backLabel="Asset Details"
        showExport={false}
        actions={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 bg-white border border-neutral-200 text-neutral-700 hover:bg-neutral-50 rounded text-xs font-medium transition-colors cursor-pointer"
              title="Reset to saved values"
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
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-white border border-neutral-200 hover:border-rose-300 hover:bg-rose-50 text-rose-700 rounded text-xs font-medium transition-colors cursor-pointer"
              title="Delete asset"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Delete</span>
            </button>
          </div>
        }
      />

      <div className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-6 w-full">
        <form id="edit-asset-form" onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Column: Form Fields */}
            <div className="lg:col-span-8 xl:col-span-8 2xl:col-span-9 space-y-6">
              {/* Equipment Specifications */}
              <div className="bg-white border border-neutral-200/80 rounded-2xl p-5 sm:p-6 shadow-2xs space-y-5">
                <div className="flex items-center gap-2 border-b border-neutral-100 pb-3">
                  <Cpu className="w-4 h-4 text-neutral-700" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-900">
                    Equipment Specifications
                  </h3>
                </div>

                <div className="space-y-4">
                  {/* Equipment Name */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-neutral-900">
                      Equipment Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Cisco Catalyst 9300 48-Port Switch"
                      className="w-full bg-white border border-neutral-300 text-neutral-900 text-xs px-3 py-2 rounded-xl focus:outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 transition-colors placeholder:text-neutral-400"
                    />
                  </div>

                  {/* Model & Serial Number */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold text-neutral-900">
                        Model / Hardware Build
                      </label>
                      <input
                        type="text"
                        value={model}
                        onChange={(e) => setModel(e.target.value)}
                        placeholder="e.g. C9300-48P-A Gigabit L3 Managed"
                        className="w-full bg-white border border-neutral-300 text-neutral-900 text-xs font-mono px-3 py-2 rounded-xl focus:outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 transition-colors placeholder:text-neutral-400"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold text-neutral-900">
                        Serial Tag / Asset ID <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={serialNumber}
                        onChange={(e) => setSerialNumber(e.target.value)}
                        placeholder="e.g. TAG-102B-001"
                        className="w-full bg-white border border-neutral-300 text-neutral-900 text-xs font-mono uppercase px-3 py-2 rounded-xl focus:outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 transition-colors placeholder:text-neutral-400"
                      />
                    </div>
                  </div>

                  {/* Units, Unit Type & Operational Status */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold text-neutral-900">
                        Total Units
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={999}
                        value={totalUnits}
                        onChange={(e) => setTotalUnits(parseInt(e.target.value, 10) || 1)}
                        className="w-full bg-white border border-neutral-300 text-neutral-900 text-xs font-mono px-3 py-2 rounded-xl focus:outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 transition-colors"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold text-neutral-900">
                        Unit Type
                      </label>
                      <input
                        type="text"
                        value={unitType}
                        onChange={(e) => setUnitType(e.target.value)}
                        placeholder="e.g. Units, Benches"
                        className="w-full bg-white border border-neutral-300 text-neutral-900 text-xs px-3 py-2 rounded-xl focus:outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 transition-colors placeholder:text-neutral-400"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold text-neutral-900">
                        Operational Status
                      </label>
                      <Dropdown
                        value={status}
                        options={statusOptions}
                        onChange={(val) => setStatus(val as 'operational' | 'in_use' | 'maintenance')}
                        buttonClassName="rounded-xl py-2"
                      />
                    </div>
                  </div>

                  {/* Next Audit Date */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-neutral-900">
                      Next Audit / Recertification Date
                    </label>
                    <DatePicker
                      value={nextCalibration}
                      onChange={setNextCalibration}
                      placeholder="Select audit / calibration date"
                    />
                  </div>

                  {/* Description */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-neutral-900">
                      Equipment Description &amp; Lab Notes
                    </label>
                    <textarea
                      rows={4}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Document hardware specifications, port mapping, or inspection notes..."
                      className="w-full bg-white border border-neutral-300 text-neutral-900 text-xs px-3 py-2.5 rounded-xl focus:outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 transition-colors leading-relaxed placeholder:text-neutral-400"
                    />
                  </div>
                </div>
              </div>

              {/* Location Assignment */}
              <div className="bg-white border border-neutral-200/80 rounded-2xl p-5 sm:p-6 shadow-2xs space-y-4">
                <div className="flex items-center gap-2 border-b border-neutral-100 pb-3">
                  <MapPin className="w-4 h-4 text-neutral-700" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-900">
                    Location Assignment
                  </h3>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-neutral-900">
                    Assigned Laboratory Room
                  </label>
                  <Dropdown
                    value={location}
                    options={locationOptions}
                    onChange={setLocation}
                    placeholder="Select room location"
                    buttonClassName="rounded-xl py-2"
                  />
                </div>
              </div>

              {/* Bottom Form Footer */}
              <div className="flex items-center justify-end gap-2.5">
                <Link
                  href={`/assets/${asset.id}`}
                  className="px-4 py-2 bg-white hover:bg-neutral-50 border border-neutral-200 text-neutral-700 text-xs font-medium rounded-lg transition-colors"
                >
                  Cancel
                </Link>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-1.5 px-5 py-2 bg-neutral-900 hover:bg-neutral-800 disabled:bg-neutral-400 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer shadow-xs"
                >
                  <Save className="w-3.5 h-3.5 text-neutral-300" />
                  <span>{isSubmitting ? 'Saving...' : 'Save Changes'}</span>
                </button>
              </div>
            </div>

            {/* Right Column: Asset Photo */}
            <div className="lg:col-span-4 xl:col-span-4 2xl:col-span-3 space-y-6">
              <div className="bg-white border border-neutral-200/80 rounded-2xl p-5 shadow-2xs space-y-4">
                <div className="flex items-center gap-2 border-b border-neutral-100 pb-3">
                  <Layers className="w-4 h-4 text-neutral-700" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-900">
                    Asset Photo
                  </h3>
                </div>

                <ImageUpload
                  value={imageUrl}
                  onChange={setImageUrl}
                  label="Upload or Paste Photo URL"
                />
              </div>
            </div>
          </div>
        </form>
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

