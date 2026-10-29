'use client';

import React, { useState } from 'react';
import { useStock } from '@/context/StockContext';
import { X, Plus, QrCode } from 'lucide-react';
import { Dropdown } from '@/components/Dropdown';
import { ImageUpload } from '@/components/ImageUpload';
import { DatePicker } from '@/components/DatePicker';
import { ScanCodeModal } from '@/components/ScanCodeModal';

const stockCategoryOptions = [
  { label: 'Office Stationery & Paper', value: 'Office Stationery' },
  { label: 'Printer Ink & Toner Cartridges', value: 'Printer Ink & Toner' },
  { label: 'Hardware Tools & Equipment', value: 'Tools & Equipment' },
  { label: 'Monitors & Displays', value: 'Monitors' },
  { label: 'Mice, Keyboards & Peripherals', value: 'Mice & Keyboards' },
  { label: 'Cables & Accessories', value: 'Cables & Accessories' },
  { label: 'Power & Climate Spares', value: 'Power & Climate' },
  { label: 'Network Spares & Transceivers', value: 'Network Spares' },
];

const stockStatusOptions = [
  { label: 'In Stock', value: 'in_stock' },
  { label: 'Low Stock', value: 'low_stock' },
  { label: 'Out of Stock', value: 'out_of_stock' },
];

const assetStatusOptions = [
  { label: 'Operational', value: 'operational' },
  { label: 'In Use / Production', value: 'in_use' },
  { label: 'Maintenance', value: 'maintenance' },
];

const rackTypeOptions = [
  { label: '42U Server Rack', value: '42U Server Rack' },
  { label: '24U Wall Mount', value: '24U Wall Mount' },
  { label: 'IDF Distribution', value: 'IDF Distribution' },
  { label: 'Storage Shelf', value: 'Storage Shelf' },
];

const maintTypeOptions = [
  { label: 'Firmware Upgrade', value: 'Firmware Upgrade' },
  { label: 'Port Audit', value: 'Port Audit' },
  { label: 'Hardware RMA', value: 'Hardware RMA' },
  { label: 'Power Supply Replacement', value: 'Power Supply Replacement' },
];

export function AddEntityModal() {
  const {
    activeModal,
    closeModal,
    prefillData,
    addStockItem,
    addAsset,
    addRack,
    addMaintenance,
    addLocation,
    locations,
  } = useStock();

  const locationOptions = locations.map((loc) => ({
    label: `${loc.name} (${loc.room})`,
    value: `${loc.name} (${loc.room})`,
  }));

  // Stock Form State
  const [stockName, setStockName] = useState('');
  const [stockCode, setStockCode] = useState('');
  const [stockCategory, setStockCategory] = useState('Monitors');
  const [stockStatus, setStockStatus] = useState<'in_stock' | 'low_stock' | 'out_of_stock'>('in_stock');
  const [stockQuantity, setStockQuantity] = useState(1);
  const [stockUnit, setStockUnit] = useState('Units');
  const [stockLocation, setStockLocation] = useState(
    locations.length > 0
      ? `${locations[0].name} (${locations[0].room})`
      : 'Computer & Network Lab 102B (Rm 102B)'
  );
  const [stockImageUrl, setStockImageUrl] = useState('');
  const [stockDescription, setStockDescription] = useState('');
  const [stockExpiryDate, setStockExpiryDate] = useState('Active');

  // Asset Form State
  const [assetName, setAssetName] = useState('');
  const [assetModel, setAssetModel] = useState('');
  const [assetSerial, setAssetSerial] = useState('');
  const [assetLocation, setAssetLocation] = useState('Cisco Networking Lab Rm 301');
  const [assetStatus, setAssetStatus] = useState<'operational' | 'in_use' | 'maintenance'>('operational');
  const [assetImageUrl, setAssetImageUrl] = useState('');
  const [assetDescription, setAssetDescription] = useState('');

  // Sync prefillData when opening with barcode/serial prefilled
  const [scanTarget, setScanTarget] = useState<'stock_code' | 'asset_serial' | null>(null);

  React.useEffect(() => {
    if (prefillData) {
      if (prefillData.serial) setAssetSerial(prefillData.serial);
      if (prefillData.model) setAssetModel(prefillData.model);
      if (prefillData.code) setStockCode(prefillData.code);
    }
  }, [prefillData]);

  // Rack Form State
  const [rackName, setRackName] = useState('');
  const [rackCode, setRackCode] = useState('');
  const [rackType, setRackType] = useState<'42U Server Rack' | '24U Wall Mount' | 'IDF Distribution' | 'Storage Shelf'>('42U Server Rack');
  const [rackSlots, setRackSlots] = useState(42);
  const [rackLocation, setRackLocation] = useState('Computer Lab Rm 102B');

  // Maintenance Form State
  const [maintAsset, setMaintAsset] = useState('');
  const [maintSerial, setMaintSerial] = useState('');
  const [maintType, setMaintType] = useState<'Firmware Upgrade' | 'Port Audit' | 'Hardware RMA' | 'Power Supply Replacement'>('Firmware Upgrade');
  const [maintDate, setMaintDate] = useState('2026-11-01');
  const [maintTech, setMaintTech] = useState('Thoeurn Ratha');
  const [maintNotes, setMaintNotes] = useState('');

  // Location Form State
  const [locName, setLocName] = useState('');
  const [locBuilding, setLocBuilding] = useState('Engineering Block A');
  const [locRoom, setLocRoom] = useState('');

  if (activeModal === 'none') return null;

  const handleStockSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!stockName || !stockCode) return;
    addStockItem({
      name: stockName,
      code: stockCode,
      category: stockCategory,
      quantity: Number(stockQuantity) || 1,
      unit: stockUnit,
      location: stockLocation,
      rack: stockLocation,
      expiryDate: stockExpiryDate.trim() || 'Active',
      imageUrl: stockImageUrl || 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&w=400&q=80',
      description: stockDescription,
    });
    setStockName('');
    setStockCode('');
    setStockQuantity(1);
    setStockExpiryDate('Active');
    setStockImageUrl('');
    setStockDescription('');
    closeModal();
  };

  const handleAssetSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!assetName || !assetSerial) return;
    addAsset({
      name: assetName,
      model: assetModel || 'Standard Model',
      serialNumber: assetSerial,
      location: assetLocation,
      status: assetStatus,
      nextCalibration: '2027-04-01',
      imageUrl: assetImageUrl || 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&w=400&q=80',
      description: assetDescription,
    });
    setAssetName('');
    setAssetModel('');
    setAssetSerial('');
    setAssetImageUrl('');
    setAssetDescription('');
    closeModal();
  };

  const handleRackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rackName || !rackCode) return;
    addRack({
      name: rackName,
      code: rackCode,
      type: rackType,
      totalSlots: Number(rackSlots) || 42,
      usedSlots: 0,
      location: rackLocation,
    });
    setRackName('');
    setRackCode('');
    setRackSlots(42);
    closeModal();
  };

  const handleMaintenanceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!maintAsset) return;
    addMaintenance({
      assetName: maintAsset,
      serialNumber: maintSerial || 'SN-N/A',
      type: maintType,
      date: maintDate,
      technician: maintTech,
      status: 'Pending',
      notes: maintNotes || 'Routine schedule logged',
    });
    setMaintAsset('');
    setMaintSerial('');
    setMaintNotes('');
    closeModal();
  };

  const handleLocationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!locName || !locRoom) return;
    addLocation({
      name: locName,
      building: locBuilding,
      room: locRoom,
      totalAssets: 0,
      totalItems: 0,
    });
    setLocName('');
    setLocRoom('');
    closeModal();
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) closeModal();
      }}
    >
      <div className="bg-white border border-neutral-200 rounded-xl max-w-lg w-full flex flex-col shadow-2xl relative max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="h-14 px-5 border-b border-neutral-200 flex items-center justify-between shrink-0 rounded-t-xl bg-white">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded bg-neutral-900 text-white flex items-center justify-center">
              <Plus className="w-4 h-4 text-emerald-400" />
            </div>
            <h2 className="text-xs font-bold text-neutral-900">
              {activeModal === 'add_stock' && 'Add Inventory Item'}
              {activeModal === 'add_asset' && 'Register Network Device'}
              {activeModal === 'add_rack' && 'Add Server Rack'}
              {activeModal === 'add_maintenance' && 'Schedule Maintenance'}
              {activeModal === 'add_location' && 'Add Lab Location'}
            </h2>
          </div>
          <button
            onClick={closeModal}
            className="p-1 text-neutral-400 hover:text-neutral-900 rounded"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Stock Form */}
        {activeModal === 'add_stock' && (
          <form onSubmit={handleStockSubmit} className="p-5 space-y-3.5 text-xs overflow-y-auto flex-1">
            <div>
              <label className="block font-semibold text-neutral-800 mb-1">Item Name</label>
              <input
                type="text"
                required
                placeholder="e.g. 10G SFP+ Optical Transceiver"
                value={stockName}
                onChange={(e) => setStockName(e.target.value)}
                className="w-full bg-white border border-neutral-300 text-neutral-900 px-3 py-2 rounded focus:outline-none focus:border-neutral-900"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-semibold text-neutral-800">Part / SKU</label>
                  <button
                    type="button"
                    onClick={() => setScanTarget('stock_code')}
                    className="text-[10px] text-emerald-700 hover:text-emerald-900 font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <QrCode className="w-3 h-3" />
                    <span>Scan</span>
                  </button>
                </div>
                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder="e.g. SFP-10G-SR"
                    value={stockCode}
                    onChange={(e) => setStockCode(e.target.value)}
                    className="w-full bg-white border border-neutral-300 text-neutral-900 px-3 py-2 pr-8 rounded focus:outline-none focus:border-neutral-900 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setScanTarget('stock_code')}
                    title="Scan SKU Barcode"
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-900 p-0.5 rounded cursor-pointer"
                  >
                    <QrCode className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-neutral-800 mb-1">Category</label>
                <Dropdown
                  value={stockCategory}
                  options={stockCategoryOptions}
                  onChange={setStockCategory}
                  className="w-full"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-neutral-800 mb-1">Quantity</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={stockQuantity}
                  onChange={(e) => setStockQuantity(Number(e.target.value))}
                  className="w-full bg-white border border-neutral-300 text-neutral-900 px-3 py-2 rounded focus:outline-none focus:border-neutral-900"
                />
              </div>

              <div>
                <label className="block font-semibold text-neutral-800 mb-1">Unit</label>
                <input
                  type="text"
                  value={stockUnit}
                  onChange={(e) => setStockUnit(e.target.value)}
                  className="w-full bg-white border border-neutral-300 text-neutral-900 px-3 py-2 rounded focus:outline-none focus:border-neutral-900"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-neutral-800 mb-1">Assigned Location</label>
              <Dropdown
                value={stockLocation}
                options={locationOptions}
                onChange={setStockLocation}
                className="w-full"
              />
            </div>

            <div>
              <label className="block font-semibold text-neutral-800 mb-1">Warranty / Note</label>
              <input
                type="text"
                placeholder="e.g. Warranty 2027, Active, 3-Year Coverage"
                value={stockExpiryDate}
                onChange={(e) => setStockExpiryDate(e.target.value)}
                className="w-full bg-white border border-neutral-300 text-neutral-900 px-3 py-2 rounded focus:outline-none focus:border-neutral-900"
              />
            </div>


            <ImageUpload
              value={stockImageUrl}
              onChange={setStockImageUrl}
              label="Product Image (Optional)"
            />

            <div>
              <label className="block font-semibold text-neutral-800 mb-1">Description / Notes</label>
              <textarea
                rows={2}
                placeholder="Technical specifications, notes or model details..."
                value={stockDescription}
                onChange={(e) => setStockDescription(e.target.value)}
                className="w-full bg-white border border-neutral-300 text-neutral-900 px-3 py-2 rounded focus:outline-none focus:border-neutral-900 text-xs"
              />
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={closeModal}
                className="px-3.5 py-2 text-xs font-medium border border-neutral-300 rounded text-neutral-700 hover:bg-neutral-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-xs font-semibold bg-neutral-900 text-white rounded hover:bg-neutral-800"
              >
                Save Item
              </button>
            </div>
          </form>
        )}

        {/* Asset Form */}
        {activeModal === 'add_asset' && (
          <form onSubmit={handleAssetSubmit} className="p-5 space-y-3.5 text-xs overflow-y-auto flex-1">
            <div>
              <label className="block font-semibold text-neutral-800 mb-1">Equipment Name</label>
              <input
                type="text"
                required
                placeholder="e.g. Cisco Catalyst 9300 Switch"
                value={assetName}
                onChange={(e) => setAssetName(e.target.value)}
                className="w-full bg-white border border-neutral-300 text-neutral-900 px-3 py-2 rounded focus:outline-none focus:border-neutral-900"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-neutral-800 mb-1">Model Code</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. C9300-48P-A"
                  value={assetModel}
                  onChange={(e) => setAssetModel(e.target.value)}
                  className="w-full bg-white border border-neutral-300 text-neutral-900 px-3 py-2 rounded focus:outline-none focus:border-neutral-900 font-mono"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-semibold text-neutral-800">Serial Number</label>
                  <button
                    type="button"
                    onClick={() => setScanTarget('asset_serial')}
                    className="text-[10px] text-emerald-700 hover:text-emerald-900 font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <QrCode className="w-3 h-3" />
                    <span>Scan</span>
                  </button>
                </div>
                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder="e.g. FCW2348L09M"
                    value={assetSerial}
                    onChange={(e) => setAssetSerial(e.target.value)}
                    className="w-full bg-white border border-neutral-300 text-neutral-900 px-3 py-2 pr-8 rounded focus:outline-none focus:border-neutral-900 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setScanTarget('asset_serial')}
                    title="Scan Serial Barcode"
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-900 p-0.5 rounded cursor-pointer"
                  >
                    <QrCode className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-neutral-800 mb-1">Status</label>
                <Dropdown
                  value={assetStatus}
                  options={assetStatusOptions}
                  onChange={(val) => setAssetStatus(val as any)}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block font-semibold text-neutral-800 mb-1">Assigned Location</label>
                <Dropdown
                  value={assetLocation}
                  options={locationOptions}
                  onChange={setAssetLocation}
                  className="w-full"
                />
              </div>
            </div>

            <ImageUpload
              value={assetImageUrl}
              onChange={setAssetImageUrl}
              label="Equipment Image (Optional)"
            />

            <div>
              <label className="block font-semibold text-neutral-800 mb-1">Description / Notes</label>
              <textarea
                rows={2}
                placeholder="Hardware specs, firmware version, interface configuration..."
                value={assetDescription}
                onChange={(e) => setAssetDescription(e.target.value)}
                className="w-full bg-white border border-neutral-300 text-neutral-900 px-3 py-2 rounded focus:outline-none focus:border-neutral-900 text-xs"
              />
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={closeModal}
                className="px-3.5 py-2 text-xs font-medium border border-neutral-300 rounded text-neutral-700 hover:bg-neutral-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-xs font-semibold bg-neutral-900 text-white rounded hover:bg-neutral-800"
              >
                Register Asset
              </button>
            </div>
          </form>
        )}

        {/* Rack Form */}
        {activeModal === 'add_rack' && (
          <form onSubmit={handleRackSubmit} className="p-5 space-y-3.5 text-xs overflow-y-auto flex-1">
            <div>
              <label className="block font-semibold text-neutral-800 mb-1">Rack Name</label>
              <input
                type="text"
                required
                placeholder="e.g. Server Rack A3 (42U)"
                value={rackName}
                onChange={(e) => setRackName(e.target.value)}
                className="w-full bg-white border border-neutral-300 text-neutral-900 px-3 py-2 rounded focus:outline-none focus:border-neutral-900"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-neutral-800 mb-1">Rack Code</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. RCK-MDF-03"
                  value={rackCode}
                  onChange={(e) => setRackCode(e.target.value)}
                  className="w-full bg-white border border-neutral-300 text-neutral-900 px-3 py-2 rounded focus:outline-none focus:border-neutral-900 font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-neutral-800 mb-1">Total Units (U)</label>
                <input
                  type="number"
                  min="6"
                  max="48"
                  value={rackSlots}
                  onChange={(e) => setRackSlots(Number(e.target.value))}
                  className="w-full bg-white border border-neutral-300 text-neutral-900 px-3 py-2 rounded focus:outline-none focus:border-neutral-900"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-neutral-800 mb-1">Rack Type</label>
              <Dropdown
                value={rackType}
                options={rackTypeOptions}
                onChange={(val) => setRackType(val as any)}
                className="w-full"
              />
            </div>

            <div>
              <label className="block font-semibold text-neutral-800 mb-1">Room / Facility</label>
              <input
                type="text"
                value={rackLocation}
                onChange={(e) => setRackLocation(e.target.value)}
                className="w-full bg-white border border-neutral-300 text-neutral-900 px-3 py-2 rounded focus:outline-none focus:border-neutral-900"
              />
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={closeModal}
                className="px-3.5 py-2 text-xs font-medium border border-neutral-300 rounded text-neutral-700 hover:bg-neutral-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-xs font-semibold bg-neutral-900 text-white rounded hover:bg-neutral-800"
              >
                Add Rack
              </button>
            </div>
          </form>
        )}

        {/* Maintenance Form */}
        {activeModal === 'add_maintenance' && (
          <form onSubmit={handleMaintenanceSubmit} className="p-5 space-y-3.5 text-xs overflow-y-auto flex-1">
            <div>
              <label className="block font-semibold text-neutral-800 mb-1">Device Name</label>
              <input
                type="text"
                required
                placeholder="e.g. Cisco Catalyst 9300 Switch"
                value={maintAsset}
                onChange={(e) => setMaintAsset(e.target.value)}
                className="w-full bg-white border border-neutral-300 text-neutral-900 px-3 py-2 rounded focus:outline-none focus:border-neutral-900"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-neutral-800 mb-1">Service Type</label>
                <Dropdown
                  value={maintType}
                  options={maintTypeOptions}
                  onChange={(val) => setMaintType(val as any)}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block font-semibold text-neutral-800 mb-1">Scheduled Date</label>
                <DatePicker
                  value={maintDate}
                  onChange={setMaintDate}
                  placeholder="Select scheduled date"
                  align="right"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-neutral-800 mb-1">Assigned Technician</label>
              <input
                type="text"
                value={maintTech}
                onChange={(e) => setMaintTech(e.target.value)}
                className="w-full bg-white border border-neutral-300 text-neutral-900 px-3 py-2 rounded focus:outline-none focus:border-neutral-900"
              />
            </div>

            <div>
              <label className="block font-semibold text-neutral-800 mb-1">Notes & Scope</label>
              <textarea
                rows={2}
                value={maintNotes}
                onChange={(e) => setMaintNotes(e.target.value)}
                placeholder="Scope of upgrade or diagnosis notes..."
                className="w-full bg-white border border-neutral-300 text-neutral-900 px-3 py-2 rounded focus:outline-none focus:border-neutral-900"
              />
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={closeModal}
                className="px-3.5 py-2 text-xs font-medium border border-neutral-300 rounded text-neutral-700 hover:bg-neutral-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-xs font-semibold bg-neutral-900 text-white rounded hover:bg-neutral-800"
              >
                Schedule Task
              </button>
            </div>
          </form>
        )}

        {/* Location Form */}
        {activeModal === 'add_location' && (
          <form onSubmit={handleLocationSubmit} className="p-5 space-y-3.5 text-xs overflow-y-auto flex-1">
            <div>
              <label className="block font-semibold text-neutral-800 mb-1">Lab Name</label>
              <input
                type="text"
                required
                placeholder="e.g. Advanced Routing & Switching Lab"
                value={locName}
                onChange={(e) => setLocName(e.target.value)}
                className="w-full bg-white border border-neutral-300 text-neutral-900 px-3 py-2 rounded focus:outline-none focus:border-neutral-900"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-neutral-800 mb-1">Building</label>
                <input
                  type="text"
                  required
                  value={locBuilding}
                  onChange={(e) => setLocBuilding(e.target.value)}
                  className="w-full bg-white border border-neutral-300 text-neutral-900 px-3 py-2 rounded focus:outline-none focus:border-neutral-900"
                />
              </div>

              <div>
                <label className="block font-semibold text-neutral-800 mb-1">Room #</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rm 304"
                  value={locRoom}
                  onChange={(e) => setLocRoom(e.target.value)}
                  className="w-full bg-white border border-neutral-300 text-neutral-900 px-3 py-2 rounded focus:outline-none focus:border-neutral-900"
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={closeModal}
                className="px-3.5 py-2 text-xs font-medium border border-neutral-300 rounded text-neutral-700 hover:bg-neutral-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-xs font-semibold bg-neutral-900 text-white rounded hover:bg-neutral-800"
              >
                Add Location
              </button>
            </div>
          </form>
        )}
      </div>

      <ScanCodeModal
        isOpen={scanTarget !== null}
        onClose={() => setScanTarget(null)}
        title={scanTarget === 'stock_code' ? 'Scan Peripheral Part SKU' : 'Scan Equipment Serial Tag'}
        targetFieldLabel={scanTarget === 'stock_code' ? 'Stock SKU / Part' : 'Device Serial Number'}
        onScan={(scannedCode, meta) => {
          if (scanTarget === 'stock_code') {
            setStockCode(scannedCode);
            if (meta?.name && !stockName) setStockName(meta.name);
            if (meta?.category && !stockCategory) setStockCategory(meta.category);
          } else if (scanTarget === 'asset_serial') {
            setAssetSerial(scannedCode);
            if (meta?.model && !assetModel) setAssetModel(meta.model);
            if (meta?.name && !assetName) setAssetName(meta.name);
          }
          setScanTarget(null);
        }}
      />
    </div>
  );
}
