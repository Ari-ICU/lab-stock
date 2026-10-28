'use client';

import React, { useState } from 'react';
import { Header } from '@/components/Header';
import { useStock } from '@/context/StockContext';
import { exportToCsv } from '@/lib/exportCsv';
import { Wrench, CheckCircle2, Clock } from 'lucide-react';
import { RowActionMenu } from '@/components/RowActionMenu';

export default function MaintenancePage() {
  const { maintenance, openModal, showToast, openDetails, openEdit, deleteMaintenance } = useStock();
  const [filterText, setFilterText] = useState('');

  const filtered = maintenance.filter(
    (item) =>
      item.assetName.toLowerCase().includes(filterText.toLowerCase()) ||
      item.serialNumber.toLowerCase().includes(filterText.toLowerCase()) ||
      item.technician.toLowerCase().includes(filterText.toLowerCase())
  );

  const handleExport = () => {
    exportToCsv(
      'lab_maintenance_logs',
      filtered.map((m) => ({
        Instrument: m.assetName,
        'Serial Number': m.serialNumber,
        'Service Type': m.type,
        Date: m.date,
        Technician: m.technician,
        Status: m.status,
        Notes: m.notes,
      }))
    );
  };

  return (
    <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
      <Header
        title="Maintenance & Audits"
        subtitle="Firmware Upgrades & Calibration Logs"
        actionLabel="Schedule Service"
        onAction={() => openModal('add_maintenance')}
        onExport={handleExport}
      />

      <div className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-6">
        {/* KPI stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white border border-neutral-200 rounded p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-neutral-500">In Progress</span>
              <Clock className="w-4 h-4 text-blue-500" />
            </div>
            <div className="text-2xl font-bold text-neutral-900 mt-2">1 Active</div>
            <div className="text-[11px] text-neutral-500 mt-1">Cisco 4451 PSU diagnosis</div>
          </div>

          <div className="bg-white border border-neutral-200 rounded p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-neutral-500">Scheduled Firmware</span>
              <Wrench className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-2xl font-bold text-neutral-900 mt-2">1 Pending</div>
            <div className="text-[11px] text-neutral-500 mt-1">C9300 IOS-XE 17.9.4a release</div>
          </div>

          <div className="bg-white border border-neutral-200 rounded p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-neutral-500">Completed (Last 30d)</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="text-2xl font-bold text-neutral-900 mt-2">1 Verified</div>
            <div className="text-[11px] text-neutral-500 mt-1">Fluke DSX-8000 calibrated</div>
          </div>
        </div>

        {/* Flat Records Table */}
        <div className="bg-white border border-neutral-200 rounded">
          <div className="p-4 border-b border-neutral-200 flex items-center justify-between">
            <input
              type="text"
              placeholder="Search maintenance logs..."
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              className="w-72 bg-white border border-neutral-300 text-neutral-900 text-xs px-3 py-1.5 rounded focus:outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 font-medium placeholder:text-neutral-400"
            />
            <span className="text-xs text-neutral-500">
              Showing <span className="font-semibold text-neutral-900">{filtered.length}</span> records
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs min-w-[640px]">
              <thead className="bg-neutral-50 border-b border-neutral-200 text-neutral-600 font-semibold">
                <tr>
                  <th className="py-3 px-4">Instrument</th>
                  <th className="py-3 px-4">Serial Number</th>
                  <th className="py-3 px-4">Service Type</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Technician</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Notes</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {filtered.map((item) => (
                  <tr key={item.id} className="hover:bg-neutral-50/70 transition-colors">
                    <td className="py-3 px-4">
                      <button
                        onClick={() => openDetails(item)}
                        className="font-semibold text-neutral-900 hover:text-emerald-700 text-left cursor-pointer transition-colors"
                      >
                        {item.assetName}
                      </button>
                    </td>
                    <td className="py-3 px-4 font-mono text-neutral-600">{item.serialNumber}</td>
                    <td className="py-3 px-4">
                      <span className="bg-neutral-100 text-neutral-700 px-2 py-0.5 rounded text-[11px] font-medium">
                        {item.type}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-neutral-600">{item.date}</td>
                    <td className="py-3 px-4 text-neutral-600">{item.technician}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium ${
                          item.status === 'Completed'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : item.status === 'In Progress'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {item.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-neutral-500 max-w-xs truncate">{item.notes}</td>
                    <td className="py-3 px-4 text-right">
                      <RowActionMenu
                        onViewDetails={() => openDetails(item)}
                        onEdit={() => openEdit(item)}
                        onDelete={() => deleteMaintenance(item.id)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
