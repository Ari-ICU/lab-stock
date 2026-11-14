'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Header } from '@/components/Header';
import { useStock } from '@/context/StockContext';
import { useAuth } from '@/context/AuthContext';
import { ImageUpload } from '@/components/ImageUpload';
import { Dropdown } from '@/components/Dropdown';
import { DatePicker } from '@/components/DatePicker';
import { NumberInput } from '@/components/NumberInput';
import {
  Save,
  Calendar,
} from 'lucide-react';

const statusOptions = [
  { label: 'Operational', value: 'operational' },
  { label: 'In Use', value: 'in_use' },
  { label: 'In Repair', value: 'maintenance' },
];

function CreateAssetForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { addAsset, locations, showToast } = useStock();
  const { user, canManageLocation } = useAuth();

  // Find first manageable location for default
  const managedLocations = locations.filter((loc) => canManageLocation(`${loc.name} (${loc.room})`));
  const defaultLocation = managedLocations.length > 0
    ? `${managedLocations[0].name} (${managedLocations[0].room})`
    : 'Unassigned';

  const [name, setName] = useState('');
  const [model, setModel] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  const [totalUnits, setTotalUnits] = useState(1);
  const [unitType, setUnitType] = useState('Units');
  const [location, setLocation] = useState('');
  const [status, setStatus] = useState<'operational' | 'in_use' | 'maintenance'>('operational');
  const [nextCalibration, setNextCalibration] = useState('2027-06-01');
  const [imageUrl, setImageUrl] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const paramLocation = searchParams.get('location') || '';
  const activeLocation = location || paramLocation || defaultLocation;

  // Sync incoming search query parameters (e.g. from Barcode/QR Scanner modal or Location details)
  useEffect(() => {
    const paramSerial = searchParams.get('serial');
    const paramModel = searchParams.get('model');
    const paramName = searchParams.get('name');
    if (paramSerial) setSerialNumber(paramSerial);
    if (paramModel) setModel(paramModel);
    if (paramName) setName(paramName);
  }, [searchParams]);

  const locationOptions = [
    ...(managedLocations.length > 0 ? managedLocations : locations).map((loc) => ({
      label: `${loc.name} (${loc.room})`,
      value: `${loc.name} (${loc.room})`,
    })),
    ...(canManageLocation('Unassigned') ? [{ label: 'Unassigned / No Classroom', value: 'Unassigned' }] : []),
  ];

  const handleGenerateTag = () => {
    const randomNum = Math.floor(10000 + Math.random() * 90000);
    setSerialNumber(`TAG-102B-${randomNum}`);
    showToast('Generated laboratory asset tag', 'success');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!canManageLocation(activeLocation)) {
      showToast(`You can only register items within your assigned laboratories (${user?.assignedLabs?.join(', ') || 'Room 102B, Room 206'})`, 'warning');
      return;
    }

    if (!name.trim()) {
      showToast('Please enter an equipment name', 'warning');
      return;
    }
    if (!serialNumber.trim()) {
      showToast('Please enter a serial number or tag', 'warning');
      return;
    }

    setIsSubmitting(true);

    try {
      const created = addAsset({
        name: name.trim(),
        model: model.trim() || 'Standard Model',
        serialNumber: serialNumber.trim().toUpperCase(),
        totalUnits: Number(totalUnits) || 1,
        unitType: unitType.trim() || 'Units',
        location: activeLocation.trim(),
        status,
        nextCalibration: nextCalibration || '2027-01-01',
        imageUrl: imageUrl.trim() || 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&w=600&q=80',
        description: description.trim(),
      });

      setTimeout(() => {
        router.push('/assets');
      }, 250);
    } catch {
      showToast('Failed to register asset', 'error');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-neutral-50/50">
      <Header
        title="Add Hardware Asset"
        subtitle="Register serial-tracked lab equipment and computers"
        backHref="/assets"
        backLabel="Assets"
        showExport={false}
        actions={
          <div className="flex items-center gap-2">
            <Link
              href="/assets"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-neutral-200 text-neutral-700 hover:bg-neutral-50 rounded-xl text-xs font-medium transition-colors"
            >
              Cancel
            </Link>

            <button
              type="button"
              onClick={() => {
                const form = document.getElementById('new-asset-form') as HTMLFormElement;
                if (form) form.requestSubmit();
              }}
              disabled={isSubmitting}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-neutral-900 hover:bg-neutral-800 disabled:bg-neutral-400 text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer shadow-xs"
            >
              <Save className="w-3.5 h-3.5 text-neutral-300" />
              <span>{isSubmitting ? 'Creating...' : 'Create Asset'}</span>
            </button>
          </div>
        }
      />

      <div className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-6 w-full">
        {/* Form Container */}
        <form
          id="new-asset-form"
          onSubmit={handleSubmit}
          className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start"
        >
          {/* Left Column: Form Fields */}
          <div className="lg:col-span-8 bg-white border border-neutral-200/80 rounded-2xl p-5 sm:p-6 space-y-5 shadow-2xs">
            <div className="border-b border-neutral-100 pb-3">
              <h2 className="text-sm font-bold text-neutral-900">
                General Hardware Information
              </h2>
              <p className="text-xs text-neutral-500 mt-0.5">
                Primary identifiers, serial tracking, and laboratory assignment details.
              </p>
            </div>

            {/* Equipment Name */}
            <div>
              <label className="block text-xs font-semibold text-neutral-800 mb-1.5">
                Equipment / Device Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Dell OptiPlex 7090 Desktop Workstations"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-white border border-neutral-300 text-neutral-900 text-xs px-3 py-2 rounded-xl focus:outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 transition-colors"
              />
            </div>

            {/* Model & Serial in 2 cols */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-800 mb-1.5">
                  Model & Hardware Variant
                </label>
                <input
                  type="text"
                  placeholder="e.g. C9300-48P-A / PoE+ 715W"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  className="w-full bg-white border border-neutral-300 text-neutral-900 text-xs px-3 py-2 rounded-xl focus:outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 font-mono transition-colors"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-neutral-800">
                    Serial Number / Tag <span className="text-rose-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleGenerateTag}
                    className="text-[11px] text-neutral-600 hover:text-neutral-900 hover:underline font-medium cursor-pointer"
                  >
                    Generate Tag
                  </button>
                </div>
                <input
                  type="text"
                  required
                  placeholder="e.g. FCW2348L09M or OPT-102B-01"
                  value={serialNumber}
                  onChange={(e) => setSerialNumber(e.target.value)}
                  className="w-full bg-white border border-neutral-300 text-neutral-900 text-xs px-3 py-2 rounded-xl focus:outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 font-mono uppercase transition-colors"
                />
              </div>
            </div>

            {/* Units count & Unit Type */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-800 mb-1.5">
                  Total Active Units Count
                </label>
                <NumberInput
                  min={1}
                  value={totalUnits}
                  onChange={(val) => setTotalUnits(Math.max(1, val))}
                  className="w-full bg-white border border-neutral-300 text-neutral-900 text-xs px-3 py-2 rounded-xl focus:outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 font-mono transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-800 mb-1.5">
                  Unit Label / Type
                </label>
                <input
                  type="text"
                  placeholder="e.g. Desktops, Units, AC Units, Switch"
                  value={unitType}
                  onChange={(e) => setUnitType(e.target.value)}
                  className="w-full bg-white border border-neutral-300 text-neutral-900 text-xs px-3 py-2 rounded-xl focus:outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 transition-colors"
                />
              </div>
            </div>

            {/* Location & Status */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-800 mb-1.5">
                  Assigned Lab Location
                </label>
                <Dropdown
                  value={activeLocation}
                  options={locationOptions}
                  onChange={(val) => setLocation(val)}
                  className="w-full"
                  buttonClassName="rounded-xl py-2 text-xs font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-800 mb-1.5">
                  Operational Status
                </label>
                <Dropdown
                  value={status}
                  options={statusOptions}
                  onChange={(val) => setStatus(val as 'operational' | 'in_use' | 'maintenance')}
                  className="w-full"
                  buttonClassName="rounded-xl py-2 text-xs font-medium"
                />
              </div>
            </div>

            {/* Next Calibration Audit Date */}
            <div>
              <label className="block text-xs font-semibold text-neutral-800 mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-neutral-500" />
                <span>Next Calibration / Audit Due Date</span>
              </label>
              <DatePicker
                value={nextCalibration}
                onChange={setNextCalibration}
                placeholder="Select calibration / audit date"
              />
            </div>

            {/* Detailed Description */}
            <div>
              <label className="block text-xs font-semibold text-neutral-800 mb-1.5">
                Technical Specifications & Operating Description
              </label>
              <textarea
                rows={4}
                placeholder="Include port mapping, firmware version, dual-boot config, network topology details, etc."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-white border border-neutral-300 text-neutral-900 text-xs p-3 rounded-xl focus:outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 transition-colors leading-relaxed"
              />
            </div>
          </div>

          {/* Right Column: Image Upload */}
          <div className="lg:col-span-4 space-y-5">
            <div className="bg-white border border-neutral-200/80 rounded-2xl p-5 sm:p-6 shadow-2xs">
              <ImageUpload
                value={imageUrl}
                onChange={setImageUrl}
                label="Hardware Photograph / Model Image"
              />
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function CreateAssetPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-8 text-neutral-500 text-xs">
          Loading equipment form...
        </div>
      }
    >
      <CreateAssetForm />
    </Suspense>
  );
}

