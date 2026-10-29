'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Header } from '@/components/Header';
import { useStock } from '@/context/StockContext';
import { ImageUpload } from '@/components/ImageUpload';
import { Dropdown } from '@/components/Dropdown';
import { DatePicker } from '@/components/DatePicker';
import { ScanCodeModal } from '@/components/ScanCodeModal';
import {
  ArrowLeft,
  Router,
  Save,
  Sparkles,
  CheckCircle2,
  Calendar,
  MapPin,
  Tag,
  Hash,
  Layers,
  FileText,
  AlertCircle,
  HelpCircle,
  QrCode,
} from 'lucide-react';

const statusOptions = [
  { label: 'Operational (Ready for use)', value: 'operational' },
  { label: 'In Production (Active in lab)', value: 'in_use' },
  { label: 'Maintenance / Servicing', value: 'maintenance' },
];

const PRESETS = [
  {
    name: 'Dell OptiPlex 7090 Desktop Workstation',
    model: 'OptiPlex 7090 MT / Core i7 / 16GB / 512GB SSD',
    unitType: 'Desktops',
    defaultUnits: 24,
    location: 'Computer Lab Room 102B (Student Benches 1-24)',
    imageUrl: 'https://images.unsplash.com/photo-1593640408182-31c70c8268f5?auto=format&fit=crop&w=600&q=80',
    description: 'Student Desktop Workstation featuring Dell 24-inch FHD monitor, dual-boot Ubuntu & Windows 11 Pro, configured for network simulation.',
  },
  {
    name: 'Cisco Catalyst 9300 48-Port PoE+ Managed Switch',
    model: 'C9300-48P-A Gigabit L3 Enterprise Managed',
    unitType: 'Switch',
    defaultUnits: 1,
    location: 'Computer Lab Room 102B (Wall Cabinet CAB-102B)',
    imageUrl: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&w=600&q=80',
    description: 'Core 48-port Gigabit PoE+ switch directly patched to student desks 1-24, instructor podium, Wi-Fi AP, and fiber optic uplink.',
  },
  {
    name: 'Epson PowerLite 4K Laser Ceiling Projector',
    model: 'PowerLite L630U 6200-Lumen WUXGA Laser',
    unitType: 'Unit',
    defaultUnits: 1,
    location: 'Computer Lab Room 102B (Ceiling Center Mount)',
    imageUrl: 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?auto=format&fit=crop&w=600&q=80',
    description: 'High-lumens laser projector mounted to ceiling with motorized 120-inch projection screen, HDMI 2.1 input, and Miracast wireless mirroring.',
  },
  {
    name: 'Daikin 2.5 HP Inverter Air Conditioner',
    model: 'FTKC60UVM4 Inverter R32 Eco Cooling',
    unitType: 'AC Units',
    defaultUnits: 2,
    location: 'Computer Lab Room 102B (North & South Walls)',
    imageUrl: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=600&q=80',
    description: 'Split inverter climate control unit maintaining constant 21°C - 23°C temperature and moisture protection for room 102B hardware.',
  },
];

function CreateAssetForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { addAsset, locations, showToast } = useStock();

  const [name, setName] = useState('');
  const [model, setModel] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  const [totalUnits, setTotalUnits] = useState(1);
  const [unitType, setUnitType] = useState('Units');
  const [location, setLocation] = useState(
    locations.length > 0 ? `${locations[0].name} (${locations[0].room})` : 'Computer Lab Room 102B'
  );
  const [status, setStatus] = useState<'operational' | 'in_use' | 'maintenance'>('operational');
  const [nextCalibration, setNextCalibration] = useState('2027-06-01');
  const [imageUrl, setImageUrl] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isScanModalOpen, setIsScanModalOpen] = useState(false);

  // Sync incoming search query parameters (e.g. from Barcode/QR Scanner modal or Location details)
  useEffect(() => {
    const paramSerial = searchParams.get('serial');
    const paramModel = searchParams.get('model');
    const paramName = searchParams.get('name');
    const paramLocation = searchParams.get('location');
    if (paramSerial) setSerialNumber(paramSerial);
    if (paramModel) setModel(paramModel);
    if (paramName) setName(paramName);
    if (paramLocation) setLocation(paramLocation);
  }, [searchParams]);

  const locationOptions = locations.map((loc) => ({
    label: `${loc.name} (${loc.room})`,
    value: `${loc.name} (${loc.room})`,
  }));

  const handleApplyPreset = (preset: typeof PRESETS[0]) => {
    setName(preset.name);
    setModel(preset.model);
    setUnitType(preset.unitType);
    setTotalUnits(preset.defaultUnits);
    setLocation(preset.location);
    setImageUrl(preset.imageUrl);
    setDescription(preset.description);
    if (!serialNumber) {
      setSerialNumber(`LAB-102B-${Math.floor(1000 + Math.random() * 9000)}`);
    }
    showToast(`Applied preset for ${preset.name}`, 'info');
  };

  const handleGenerateTag = () => {
    const randomNum = Math.floor(10000 + Math.random() * 90000);
    setSerialNumber(`TAG-102B-${randomNum}`);
    showToast('Generated laboratory asset tag', 'success');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

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
        location: location.trim(),
        status,
        nextCalibration: nextCalibration || '2027-01-01',
        imageUrl: imageUrl.trim() || 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&w=600&q=80',
        description: description.trim(),
      });

      setTimeout(() => {
        router.push(`/assets/${created.id}`);
      }, 250);
    } catch {
      showToast('Failed to register asset', 'error');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-neutral-50/50">
      <Header
        title="Create Lab Hardware Asset"
        subtitle="Lab 102B Equipment Registry"
        backHref="/assets"
        backLabel="Assets"
        showExport={false}
        actions={
          <div className="flex items-center gap-2">
            <Link
              href="/assets"
              className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 bg-white border border-neutral-200 text-neutral-700 hover:bg-neutral-50 rounded text-xs font-medium transition-colors"
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
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-neutral-900 hover:bg-neutral-800 disabled:bg-neutral-400 text-white rounded text-xs font-semibold transition-colors cursor-pointer shadow-xs"
            >
              <Save className="w-3.5 h-3.5 text-neutral-300" />
              <span>{isSubmitting ? 'Creating...' : 'Create Asset'}</span>
            </button>
          </div>
        }
      />

      <div className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-6 max-w-8xl w-full mx-auto">

        {/* Quick Autofill Presets Bar */}
        <div className="bg-white border border-neutral-200 rounded-lg p-4 shadow-xs">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-4 h-4 text-emerald-600" />
            <span className="text-xs font-bold text-neutral-900">
              Quick Autofill From Lab 102B Standards
            </span>
          </div>
          <p className="text-[11px] text-neutral-500 mb-3">
            Click any standard equipment profile to instantly pre-fill specs, models, and locations:
          </p>
          <div className="flex items-center gap-2 flex-wrap">
            {PRESETS.map((preset) => (
              <button
                key={preset.name}
                type="button"
                onClick={() => handleApplyPreset(preset)}
                className="px-2.5 py-1.5 text-xs font-medium bg-neutral-50 hover:bg-neutral-900 hover:text-white border border-neutral-200 hover:border-neutral-900 rounded transition-all cursor-pointer text-neutral-700"
              >
                + {preset.name.split(' ')[0]} {preset.name.split(' ')[1]}
              </button>
            ))}
          </div>
        </div>

        {/* Form Container */}
        <form
          id="new-asset-form"
          onSubmit={handleSubmit}
          className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start"
        >
          {/* Left Column: Form Fields */}
          <div className="lg:col-span-8 bg-white border border-neutral-200 rounded-lg p-6 space-y-5 shadow-xs">
            <div className="border-b border-neutral-100 pb-3">
              <h2 className="text-sm font-bold text-neutral-900">
                General Hardware Information
              </h2>
              <p className="text-xs text-neutral-500 mt-0.5">
                Primary identifiers for auditing and stock tracking in Room 102B.
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
                className="w-full bg-white border border-neutral-300 text-neutral-900 text-xs px-3.5 py-2.5 rounded focus:outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 transition-colors"
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
                  className="w-full bg-white border border-neutral-300 text-neutral-900 text-xs px-3.5 py-2.5 rounded focus:outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 font-mono transition-colors"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-neutral-800">
                    Serial Number / Tag <span className="text-rose-500">*</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsScanModalOpen(true)}
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-2 py-0.5 rounded cursor-pointer transition-colors shadow-2xs"
                    >
                      <QrCode className="w-3.5 h-3.5 text-emerald-700" />
                      <span>Scan Barcode / QR</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleGenerateTag}
                      className="text-[11px] text-neutral-600 hover:text-neutral-900 hover:underline font-medium cursor-pointer"
                    >
                      Generate Tag
                    </button>
                  </div>
                </div>
                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder="e.g. FCW2348L09M or OPT-102B-01"
                    value={serialNumber}
                    onChange={(e) => setSerialNumber(e.target.value)}
                    className="w-full bg-white border border-neutral-300 text-neutral-900 text-xs px-3.5 py-2.5 pr-10 rounded focus:outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 font-mono uppercase transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setIsScanModalOpen(true)}
                    title="Scan Tag with Camera or Barcode"
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-900 p-1 rounded cursor-pointer transition-colors"
                  >
                    <QrCode className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Units count & Unit Type */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-800 mb-1.5">
                  Total Active Units Count
                </label>
                <input
                  type="number"
                  min={1}
                  value={totalUnits}
                  onChange={(e) => setTotalUnits(Number(e.target.value) || 1)}
                  className="w-full bg-white border border-neutral-300 text-neutral-900 text-xs px-3.5 py-2.5 rounded focus:outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 font-mono transition-colors"
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
                  className="w-full bg-white border border-neutral-300 text-neutral-900 text-xs px-3.5 py-2.5 rounded focus:outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 transition-colors"
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
                  value={location}
                  options={locationOptions}
                  onChange={(val) => setLocation(val)}
                  className="w-full"
                  buttonClassName="py-2.5 text-xs font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-800 mb-1.5">
                  Operational Status
                </label>
                <Dropdown
                  value={status}
                  options={statusOptions}
                  onChange={(val) => setStatus(val as any)}
                  className="w-full"
                  buttonClassName="py-2.5 text-xs font-medium"
                />
              </div>
            </div>

            {/* Next Calibration Audit Date */}
            <div>
              <label className="block text-xs font-semibold text-neutral-800 mb-1.5 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-neutral-500" />
                <span>Next Calibration / Firmware Audit Due Date</span>
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
                className="w-full bg-white border border-neutral-300 text-neutral-900 text-xs p-3 rounded focus:outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 transition-colors"
              />
            </div>

            {/* Buttons */}
            <div className="pt-4 border-t border-neutral-100 flex items-center justify-end gap-3">
              <Link
                href="/assets"
                className="px-4 py-2 text-xs font-medium text-neutral-600 hover:text-neutral-900 bg-white border border-neutral-200 hover:bg-neutral-50 rounded transition-colors"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center gap-2 px-5 py-2 text-xs font-semibold text-white bg-neutral-900 hover:bg-neutral-800 rounded transition-colors cursor-pointer disabled:opacity-50"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{isSubmitting ? 'Creating...' : 'Create Asset'}</span>
              </button>
            </div>
          </div>

          {/* Right Column: Preview & Image Upload */}
          <div className="lg:col-span-4 space-y-5">
            {/* Image Upload Box */}
            <div className="bg-white border border-neutral-200 rounded-lg p-5 shadow-xs">
              <ImageUpload
                value={imageUrl}
                onChange={setImageUrl}
                label="Hardware Photograph / Model Image"
              />
            </div>

            {/* Live Preview Card */}
            <div className="bg-white border border-neutral-200 rounded-lg p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between border-b border-neutral-100 pb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                  Live Preview
                </span>
                <span
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${
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

              {/* Preview image */}
              <div className="h-36 rounded-md bg-neutral-100 border border-neutral-200 overflow-hidden flex items-center justify-center">
                {imageUrl ? (
                  <img
                    src={imageUrl}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-center p-4 text-neutral-400">
                    <Router className="w-8 h-8 mx-auto mb-1 stroke-1" />
                    <span className="text-[11px]">No image selected</span>
                  </div>
                )}
              </div>

              <div>
                <h3 className="text-xs font-bold text-neutral-900 leading-tight">
                  {name || 'Equipment Name'}
                </h3>
                <p className="text-[11px] text-neutral-500 font-mono mt-0.5">
                  {model || 'Model specifications'}
                </p>
              </div>

              <div className="pt-2 border-t border-neutral-100 space-y-1.5 text-[11px]">
                <div className="flex items-center justify-between text-neutral-600">
                  <span>Serial Tag:</span>
                  <span className="font-mono font-semibold text-neutral-900">
                    {serialNumber || 'PENDING-TAG'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-neutral-600">
                  <span>Units:</span>
                  <span className="font-bold text-neutral-900">
                    {totalUnits} {unitType}
                  </span>
                </div>
                <div className="flex items-center justify-between text-neutral-600">
                  <span>Location:</span>
                  <span className="truncate max-w-[150px] text-neutral-700">
                    {location}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>

      <ScanCodeModal
        isOpen={isScanModalOpen}
        onClose={() => setIsScanModalOpen(false)}
        title="Scan Hardware Serial / Asset Tag"
        targetFieldLabel="Asset Serial Number / Tag"
        onScan={(scannedCode, meta) => {
          setSerialNumber(scannedCode);
          if (meta?.model && !model) setModel(meta.model);
          if (meta?.name && !name) setName(meta.name);
          showToast(`Scanned tag inserted: ${scannedCode}`, 'success');
        }}
      />
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

