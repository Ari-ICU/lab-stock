'use client';

import React, { useState, useEffect } from 'react';
import { useStock } from '@/context/StockContext';
import { X } from 'lucide-react';
import { MockItem, MockAsset, MockRack, MockMaintenance, MockLocation } from '@/data/mockData';
import { Dropdown } from '@/components/Dropdown';
import { ImageUpload } from '@/components/ImageUpload';
import { DatePicker } from '@/components/DatePicker';

export function EditEntityModal() {
  const {
    editingItem,
    closeEdit,
    updateStockItem,
    updateAsset,
    updateRack,
    updateMaintenance,
    updateLocation,
    locations,
  } = useStock();

  const locationOptions = locations.map((loc) => ({
    label: `${loc.name} (${loc.room})`,
    value: `${loc.name} (${loc.room})`,
  }));

  const isStock = editingItem ? 'quantity' in editingItem : false;
  const isAsset = editingItem ? 'serialNumber' in editingItem && 'model' in editingItem : false;
  const isRack = editingItem ? 'totalSlots' in editingItem && 'usedSlots' in editingItem : false;
  const isMaintenance = editingItem ? 'technician' in editingItem && 'notes' in editingItem : false;
  const isLocation = editingItem ? 'building' in editingItem && 'room' in editingItem : false;

  // General fields
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [unit, setUnit] = useState('Units');
  const [category, setCategory] = useState('');
  const [rack, setRack] = useState('');
  const [location, setLocation] = useState('');
  const [status, setStatus] = useState<any>('in_stock');
  const [imageUrl, setImageUrl] = useState('');
  const [description, setDescription] = useState('');

  // Location fields
  const [building, setBuilding] = useState('Engineering Block A');
  const [room, setRoom] = useState('');

  // Rack fields
  const [rackType, setRackType] = useState<any>('42U Server Rack');
  const [totalSlots, setTotalSlots] = useState(42);
  const [usedSlots, setUsedSlots] = useState(0);
  const [temperature, setTemperature] = useState('21.4°C');

  // Maintenance fields
  const [maintType, setMaintType] = useState<any>('Firmware Upgrade');
  const [maintDate, setMaintDate] = useState('2026-11-01');
  const [maintTech, setMaintTech] = useState('');
  const [maintNotes, setMaintNotes] = useState('');
  const [serialNumber, setSerialNumber] = useState('');

  const stockStatusOptions = [
    { label: 'In Stock', value: 'in_stock' },
    { label: 'Low Stock', value: 'low_stock' },
    { label: 'Out of Stock', value: 'out_of_stock' },
  ];

  const assetStatusOptions = [
    { label: 'Operational', value: 'operational' },
    { label: 'In Production', value: 'in_use' },
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

  const maintStatusOptions = [
    { label: 'Pending', value: 'Pending' },
    { label: 'In Progress', value: 'In Progress' },
    { label: 'Completed', value: 'Completed' },
  ];

  useEffect(() => {
    if (!editingItem) return;

    if (isStock) {
      const item = editingItem as MockItem;
      setName(item.name);
      setCode(item.code);
      setQuantity(item.quantity);
      setUnit(item.unit);
      setCategory(item.category);
      setRack(item.rack);
      setLocation(item.location);
      setStatus(item.status);
      setImageUrl(item.imageUrl || '');
      setDescription(item.description || '');
    } else if (isAsset) {
      const asset = editingItem as MockAsset;
      setName(asset.name);
      setCode(asset.model);
      setSerialNumber(asset.serialNumber);
      setLocation(asset.location);
      setStatus(asset.status);
      setImageUrl(asset.imageUrl || '');
      setDescription(asset.description || '');
    } else if (isLocation) {
      const loc = editingItem as MockLocation;
      setName(loc.name);
      setBuilding(loc.building);
      setRoom(loc.room);
    } else if (isRack) {
      const r = editingItem as MockRack;
      setName(r.name);
      setCode(r.code);
      setRackType(r.type);
      setTotalSlots(r.totalSlots);
      setUsedSlots(r.usedSlots);
      setLocation(r.location);
      setTemperature(r.temperature || '21.4°C');
    } else if (isMaintenance) {
      const m = editingItem as MockMaintenance;
      setName(m.assetName);
      setSerialNumber(m.serialNumber);
      setMaintType(m.type);
      setMaintDate(m.date);
      setMaintTech(m.technician);
      setStatus(m.status);
      setMaintNotes(m.notes);
    }
  }, [editingItem]);

  if (!editingItem) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (isStock) {
      const item = editingItem as MockItem;
      updateStockItem({
        ...item,
        name,
        code,
        quantity: Number(quantity),
        unit,
        category: category || item.category,
        rack,
        location,
        status,
        imageUrl,
        description,
      });
    } else if (isAsset) {
      const asset = editingItem as MockAsset;
      updateAsset({
        ...asset,
        name,
        model: code,
        serialNumber,
        location,
        status,
        imageUrl,
        description,
      });
    } else if (isLocation) {
      const loc = editingItem as MockLocation;
      updateLocation({
        ...loc,
        name,
        building,
        room,
      });
    } else if (isRack) {
      const r = editingItem as MockRack;
      updateRack({
        ...r,
        name,
        code,
        type: rackType,
        totalSlots: Number(totalSlots),
        usedSlots: Number(usedSlots),
        location,
        temperature,
      });
    } else if (isMaintenance) {
      const m = editingItem as MockMaintenance;
      updateMaintenance({
        ...m,
        assetName: name,
        serialNumber,
        type: maintType,
        date: maintDate,
        technician: maintTech,
        status,
        notes: maintNotes,
      });
    }

    closeEdit();
  };

  const getModalTitle = () => {
    if (isStock) return 'Edit Stock Item';
    if (isAsset) return 'Edit Network Device';
    if (isLocation) return 'Edit Laboratory Location';
    if (isRack) return 'Edit Server Rack';
    if (isMaintenance) return 'Edit Maintenance Record';
    return 'Edit Record';
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) closeEdit();
      }}
    >
      <div className="bg-white border border-neutral-200 rounded-md max-w-md w-full overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="h-14 px-5 border-b border-neutral-200 flex items-center justify-between shrink-0 bg-white">
          <h2 className="text-xs font-bold text-neutral-900">
            {getModalTitle()}
          </h2>
          <button
            type="button"
            onClick={closeEdit}
            className="p-1 text-neutral-400 hover:text-neutral-900 rounded cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-3.5 text-xs">
          {/* LOCATION FORM */}
          {isLocation && (
            <>
              <div>
                <label className="block font-semibold text-neutral-800 mb-1">Laboratory / Facility Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-white border border-neutral-300 text-neutral-900 px-3 py-2 rounded focus:outline-none focus:border-neutral-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-neutral-800 mb-1">Building</label>
                  <input
                    type="text"
                    required
                    value={building}
                    onChange={(e) => setBuilding(e.target.value)}
                    className="w-full bg-white border border-neutral-300 text-neutral-900 px-3 py-2 rounded focus:outline-none focus:border-neutral-900"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-neutral-800 mb-1">Room #</label>
                  <input
                    type="text"
                    required
                    value={room}
                    onChange={(e) => setRoom(e.target.value)}
                    className="w-full bg-white border border-neutral-300 text-neutral-900 px-3 py-2 rounded focus:outline-none focus:border-neutral-900"
                  />
                </div>
              </div>
            </>
          )}

          {/* RACK FORM */}
          {isRack && (
            <>
              <div>
                <label className="block font-semibold text-neutral-800 mb-1">Rack Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-white border border-neutral-300 text-neutral-900 px-3 py-2 rounded focus:outline-none focus:border-neutral-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-neutral-800 mb-1">Rack Code</label>
                  <input
                    type="text"
                    required
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="w-full bg-white border border-neutral-300 text-neutral-900 px-3 py-2 rounded focus:outline-none focus:border-neutral-900 font-mono"
                  />
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
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-neutral-800 mb-1">Total Units (U)</label>
                  <input
                    type="number"
                    min="1"
                    value={totalSlots}
                    onChange={(e) => setTotalSlots(Number(e.target.value))}
                    className="w-full bg-white border border-neutral-300 text-neutral-900 px-3 py-2 rounded focus:outline-none focus:border-neutral-900"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-neutral-800 mb-1">Occupied Units (U)</label>
                  <input
                    type="number"
                    min="0"
                    max={totalSlots}
                    value={usedSlots}
                    onChange={(e) => setUsedSlots(Number(e.target.value))}
                    className="w-full bg-white border border-neutral-300 text-neutral-900 px-3 py-2 rounded focus:outline-none focus:border-neutral-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-neutral-800 mb-1">Facility Location</label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full bg-white border border-neutral-300 text-neutral-900 px-3 py-2 rounded focus:outline-none focus:border-neutral-900"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-neutral-800 mb-1">Operating Temp</label>
                  <input
                    type="text"
                    value={temperature}
                    onChange={(e) => setTemperature(e.target.value)}
                    className="w-full bg-white border border-neutral-300 text-neutral-900 px-3 py-2 rounded focus:outline-none focus:border-neutral-900"
                  />
                </div>
              </div>
            </>
          )}

          {/* MAINTENANCE FORM */}
          {isMaintenance && (
            <>
              <div>
                <label className="block font-semibold text-neutral-800 mb-1">Instrument / Device</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-white border border-neutral-300 text-neutral-900 px-3 py-2 rounded focus:outline-none focus:border-neutral-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-neutral-800 mb-1">Serial Number</label>
                  <input
                    type="text"
                    value={serialNumber}
                    onChange={(e) => setSerialNumber(e.target.value)}
                    className="w-full bg-white border border-neutral-300 text-neutral-900 px-3 py-2 rounded focus:outline-none focus:border-neutral-900 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-neutral-800 mb-1">Service Type</label>
                  <Dropdown
                    value={maintType}
                    options={maintTypeOptions}
                    onChange={(val) => setMaintType(val as any)}
                    className="w-full"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-neutral-800 mb-1">Date</label>
                  <DatePicker
                    value={maintDate}
                    onChange={setMaintDate}
                    placeholder="Select date"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-neutral-800 mb-1">Status</label>
                  <Dropdown
                    value={status}
                    options={maintStatusOptions}
                    onChange={(val) => setStatus(val as any)}
                    className="w-full"
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
                  className="w-full bg-white border border-neutral-300 text-neutral-900 px-3 py-2 rounded focus:outline-none focus:border-neutral-900 text-xs"
                />
              </div>
            </>
          )}

          {/* STOCK OR ASSET FORM */}
          {(isStock || isAsset) && (
            <>
              <div>
                <label className="block font-semibold text-neutral-800 mb-1">
                  {isStock ? 'Item Name' : 'Device Name'}
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-white border border-neutral-300 text-neutral-900 px-3 py-2 rounded focus:outline-none focus:border-neutral-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-neutral-800 mb-1">
                    {isStock ? 'Part / SKU' : 'Model Code'}
                  </label>
                  <input
                    type="text"
                    required
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="w-full bg-white border border-neutral-300 text-neutral-900 px-3 py-2 rounded focus:outline-none focus:border-neutral-900 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-neutral-800 mb-1">Status</label>
                  <Dropdown
                    value={status}
                    options={isStock ? stockStatusOptions : assetStatusOptions}
                    onChange={(val) => setStatus(val)}
                    className="w-full"
                  />
                </div>
              </div>

              {isAsset && (
                <div>
                  <label className="block font-semibold text-neutral-800 mb-1">Serial Number</label>
                  <input
                    type="text"
                    value={serialNumber}
                    onChange={(e) => setSerialNumber(e.target.value)}
                    className="w-full bg-white border border-neutral-300 text-neutral-900 px-3 py-2 rounded focus:outline-none focus:border-neutral-900 font-mono"
                  />
                </div>
              )}

              {isStock && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-neutral-800 mb-1">Quantity</label>
                    <input
                      type="number"
                      min="0"
                      value={quantity}
                      onChange={(e) => setQuantity(Number(e.target.value))}
                      className="w-full bg-white border border-neutral-300 text-neutral-900 px-3 py-2 rounded focus:outline-none focus:border-neutral-900"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-neutral-800 mb-1">Unit</label>
                    <input
                      type="text"
                      value={unit}
                      onChange={(e) => setUnit(e.target.value)}
                      className="w-full bg-white border border-neutral-300 text-neutral-900 px-3 py-2 rounded focus:outline-none focus:border-neutral-900"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block font-semibold text-neutral-800 mb-1">Assigned Location</label>
                <Dropdown
                  value={
                    locationOptions.some((o) => o.value === location)
                      ? location
                      : locationOptions[0]?.value || location
                  }
                  options={locationOptions}
                  onChange={(val) => setLocation(val)}
                  className="w-full"
                />
              </div>

              <ImageUpload
                value={imageUrl}
                onChange={setImageUrl}
                label={isStock ? 'Product Image' : 'Equipment Image'}
              />

              <div>
                <label className="block font-semibold text-neutral-800 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-white border border-neutral-300 text-neutral-900 px-3 py-2 rounded focus:outline-none focus:border-neutral-900 text-xs"
                />
              </div>
            </>
          )}

          <div className="pt-2 flex justify-end gap-2 border-t border-neutral-100">
            <button
              type="button"
              onClick={closeEdit}
              className="px-3.5 py-2 text-xs font-medium border border-neutral-300 rounded text-neutral-700 hover:bg-neutral-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold bg-neutral-900 text-white rounded hover:bg-neutral-800 cursor-pointer"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
