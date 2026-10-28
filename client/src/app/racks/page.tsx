'use client';

import React, { useState } from 'react';
import { Header } from '@/components/Header';
import { useStock } from '@/context/StockContext';
import { exportToCsv } from '@/lib/exportCsv';
import { Server, Thermometer, MapPin } from 'lucide-react';
import { RowActionMenu } from '@/components/RowActionMenu';

export default function RacksPage() {
  const { racks, openModal, showToast, openDetails, openEdit, deleteRack } = useStock();
  const [filterText, setFilterText] = useState('');

  const filteredRacks = racks.filter(
    (rack) =>
      rack.name.toLowerCase().includes(filterText.toLowerCase()) ||
      rack.code.toLowerCase().includes(filterText.toLowerCase()) ||
      rack.location.toLowerCase().includes(filterText.toLowerCase())
  );

  const handleExport = () => {
    exportToCsv(
      'lab_server_racks',
      filteredRacks.map((r) => ({
        'Rack Name': r.name,
        Code: r.code,
        Type: r.type,
        Temperature: r.temperature || 'N/A',
        Location: r.location,
        'Total Slots (U)': r.totalSlots,
        'Occupied Slots': r.usedSlots,
      }))
    );
  };

  const totalCapacity = racks.reduce((acc, r) => acc + r.totalSlots, 0);
  const totalUsed = racks.reduce((acc, r) => acc + r.usedSlots, 0);

  return (
    <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
      <Header
        title="Server Racks & Cabinets"
        subtitle="42U Core Racks & Distribution Frames"
        actionLabel="Add Server Rack"
        onAction={() => openModal('add_rack')}
        onExport={handleExport}
      />

      <div className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-6">
        {/* Overview cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white border border-neutral-200 rounded p-4">
            <span className="text-xs font-medium text-neutral-500">Rack Enclosures</span>
            <div className="text-2xl font-bold text-neutral-900 mt-2">{racks.length}</div>
            <div className="text-[11px] text-neutral-500 mt-1">42U, 24U & distribution frames</div>
          </div>

          <div className="bg-white border border-neutral-200 rounded p-4">
            <span className="text-xs font-medium text-neutral-500">Total Rack Capacity</span>
            <div className="text-2xl font-bold text-neutral-900 mt-2">{totalCapacity} U</div>
            <div className="text-[11px] text-neutral-500 mt-1">
              {totalUsed} U utilized ({Math.round((totalUsed / totalCapacity) * 100)}%)
            </div>
          </div>

          <div className="bg-white border border-neutral-200 rounded p-4">
            <span className="text-xs font-medium text-neutral-500">Datacenter Ambient</span>
            <div className="text-2xl font-bold text-neutral-900 mt-2">21.4°C</div>
            <div className="text-[11px] text-emerald-600 mt-1">ASHRAE compliant</div>
          </div>

          <div className="bg-white border border-neutral-200 rounded p-4">
            <span className="text-xs font-medium text-neutral-500">Available Space</span>
            <div className="text-2xl font-bold text-neutral-900 mt-2">{totalCapacity - totalUsed} U</div>
            <div className="text-[11px] text-neutral-500 mt-1">Ready for server mounting</div>
          </div>
        </div>

        {/* Flat Racks Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredRacks.map((rack) => {
            const percentage = Math.round((rack.usedSlots / rack.totalSlots) * 100);

            return (
              <div key={rack.id} className="bg-white border border-neutral-200 rounded p-5 space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      onClick={() => openDetails(rack)}
                      className="w-10 h-10 bg-neutral-100 rounded flex items-center justify-center text-neutral-700 cursor-pointer hover:bg-neutral-200 transition-colors"
                      title="Click to view details"
                    >
                      <Server className="w-5 h-5" />
                    </div>
                    <div>
                      <button
                        onClick={() => openDetails(rack)}
                        className="text-sm font-bold text-neutral-900 hover:text-emerald-700 text-left cursor-pointer transition-colors"
                      >
                        {rack.name}
                      </button>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[11px] font-mono text-neutral-500">{rack.code}</span>
                        {rack.temperature && (
                          <span className="inline-flex items-center gap-1 text-[11px] text-blue-700 bg-blue-50 border border-blue-200 px-1.5 py-0.2 rounded font-medium">
                            <Thermometer className="w-3 h-3" />
                            {rack.temperature}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium bg-neutral-100 text-neutral-700 px-2 py-0.5 rounded">
                      {rack.type}
                    </span>
                    <RowActionMenu
                      onViewDetails={() => openDetails(rack)}
                      onEdit={() => openEdit(rack)}
                      onDelete={() => deleteRack(rack.id)}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-neutral-500 font-medium">Slot Utilization</span>
                    <span className="font-semibold text-neutral-900">
                      {rack.usedSlots} / {rack.totalSlots} U ({percentage}%)
                    </span>
                  </div>
                  <div className="w-full bg-neutral-100 h-2 rounded overflow-hidden">
                    <div
                      className={`h-full ${
                        percentage > 85 ? 'bg-amber-500' : 'bg-neutral-900'
                      }`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>

                <div className="pt-2 border-t border-neutral-100 flex items-center justify-between text-xs text-neutral-500">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-neutral-400" />
                    <span>{rack.location}</span>
                  </div>
                  <button
                    onClick={() => showToast(`Opening rack plan for ${rack.code}`)}
                    className="text-neutral-900 hover:underline font-semibold text-xs cursor-pointer"
                  >
                    View Slot Plan →
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
