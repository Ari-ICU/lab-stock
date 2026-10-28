'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/Header';
import { useStock } from '@/context/StockContext';
import { RowActionMenu } from '@/components/RowActionMenu';
import { Dropdown, DropdownOption } from '@/components/Dropdown';
import { exportToCsv } from '@/lib/exportCsv';
import { Image as ImageIcon, Plus } from 'lucide-react';

const statusOptions: DropdownOption[] = [
  { label: 'All Operational Statuses', value: 'all' },
  { label: 'Operational', value: 'operational' },
  { label: 'In Production', value: 'in_use' },
  { label: 'Maintenance / RMA', value: 'maintenance' },
];

export default function AssetsPage() {
  const router = useRouter();
  const { assets, deleteAsset, locations } = useStock();
  const [filterText, setFilterText] = useState('');
  const [labFilter, setLabFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const labOptions: DropdownOption[] = [
    { label: 'All Laboratories', value: 'all' },
    ...locations.map((loc) => ({
      label: `${loc.name} (${loc.room})`,
      value: loc.room,
    })),
  ];

  const filteredAssets = assets.filter((asset) => {
    const matchesQuery =
      asset.name.toLowerCase().includes(filterText.toLowerCase()) ||
      asset.serialNumber.toLowerCase().includes(filterText.toLowerCase()) ||
      asset.model.toLowerCase().includes(filterText.toLowerCase()) ||
      asset.location.toLowerCase().includes(filterText.toLowerCase());

    const matchesLab =
      labFilter === 'all' ||
      asset.location.toLowerCase().includes(labFilter.toLowerCase());

    const matchesStatus =
      statusFilter === 'all' || asset.status === statusFilter;

    return matchesQuery && matchesLab && matchesStatus;
  });

  const handleExport = () => {
    exportToCsv(
      'csd_stock_hardware_assets',
      filteredAssets.map((a) => ({
        'Asset ID': a.id,
        'Equipment Name': a.name,
        'Model / Specification': a.model,
        'Serial / Asset Tag': a.serialNumber,
        'Total Units': a.totalUnits ?? 1,
        'Unit Type': a.unitType ?? 'Units',
        'Laboratory Location': a.location,
        'Operational Status': a.status,
        'Loan Status': a.loanStatus === 'on_loan' ? 'Checked Out' : 'Available',
        'Current Borrower': a.currentBorrower || 'None',
        'Due Date': a.loanDueDate || '',
        'Next Calibration / Audit': a.nextCalibration || '',
        'Description / Notes': a.description || '',
      }))
    );
  };

  return (
    <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
      <Header
        title="Faculty Lab Hardware & Assets"
        subtitle="Workstations, Network Switches, Projectors & Infrastructure Across All Labs"
        actionLabel="Create Asset"
        onAction={() => router.push('/assets/create')}
        onExport={handleExport}
      />

      <div className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-6 max-w-8xl w-full mx-auto">
        <div className="bg-white border border-neutral-200 rounded">
          {/* Filters Toolbar with Dropdown */}
          <div className="p-4 border-b border-neutral-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 flex-wrap flex-1">
              <input
                type="text"
                placeholder="Search equipment, serial number or model..."
                value={filterText}
                onChange={(e) => setFilterText(e.target.value)}
                className="w-full sm:w-72 bg-white border border-neutral-300 text-neutral-900 text-xs px-3 py-1.5 rounded focus:outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 transition-colors font-medium placeholder:text-neutral-400"
              />

              <Dropdown
                value={labFilter}
                options={labOptions}
                onChange={setLabFilter}
                placeholder="Filter by Lab"
                className="w-full sm:w-auto"
              />

              <Dropdown
                value={statusFilter}
                options={statusOptions}
                onChange={setStatusFilter}
                placeholder="Filter by Status"
                className="w-full sm:w-auto"
              />
            </div>

            <div className="text-xs text-neutral-500 shrink-0">
              Showing <span className="font-semibold text-neutral-900">{filteredAssets.length}</span> devices
            </div>
          </div>

          {/* Clean Responsive Table with Device Images */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs min-w-[700px]">
              <thead className="bg-neutral-50 border-b border-neutral-200 text-neutral-600 font-semibold">
                <tr>
                  <th className="py-3 px-4 w-12">Image</th>
                  <th className="py-3 px-4">Equipment Name</th>
                  <th className="py-3 px-4 text-center">Total Units</th>
                  <th className="py-3 px-4">Serial / Tag</th>
                  <th className="py-3 px-4">Model & Specs</th>
                  <th className="py-3 px-4">Assigned Location</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {filteredAssets.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-neutral-500">
                      No hardware assets found matching your filter criteria.
                    </td>
                  </tr>
                ) : (
                  filteredAssets.map((asset) => (
                    <tr key={asset.id} className="hover:bg-neutral-50/70 transition-colors group">
                      {/* Device Image Thumbnail with Direct Link */}
                      <td className="py-2.5 px-4">
                        <Link
                          href={`/assets/${asset.id}`}
                          className="w-10 h-10 rounded border border-neutral-200 bg-neutral-100 overflow-hidden flex items-center justify-center shrink-0 cursor-pointer hover:border-neutral-400 transition-colors block"
                          title="Click to view full specifications"
                        >
                          {asset.imageUrl ? (
                            <img
                              src={asset.imageUrl}
                              alt={asset.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <ImageIcon className="w-4 h-4 text-neutral-400" />
                          )}
                        </Link>
                      </td>
                      <td className="py-3 px-4">
                        <Link
                          href={`/assets/${asset.id}`}
                          className="font-semibold text-neutral-900 hover:text-emerald-700 text-left cursor-pointer transition-colors block"
                        >
                          {asset.name}
                        </Link>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-neutral-100 text-neutral-900 border border-neutral-200">
                          {asset.totalUnits ?? 1} {asset.unitType ?? 'Unit'}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-neutral-600">
                        <Link
                          href={`/assets/${asset.id}`}
                          className="hover:text-neutral-900 transition-colors"
                        >
                          {asset.serialNumber}
                        </Link>
                      </td>
                      <td className="py-3 px-4 text-neutral-600 font-mono text-[11px]">{asset.model}</td>
                      <td className="py-3 px-4 text-neutral-600">{asset.location}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium ${
                              asset.status === 'operational'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : asset.status === 'in_use'
                                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                : 'bg-amber-50 text-amber-700 border border-amber-200'
                            }`}
                          >
                            {asset.status === 'operational'
                              ? 'Operational'
                              : asset.status === 'in_use'
                              ? 'In Production'
                              : 'Maintenance'}
                          </span>
                          {asset.loanStatus === 'on_loan' && (
                            <span
                              title={`Checked out to ${asset.currentBorrower || 'Borrower'}`}
                              className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-800 border border-amber-300"
                            >
                              On Loan
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <RowActionMenu
                          onViewDetails={() => router.push(`/assets/${asset.id}`)}
                          onEdit={() => router.push(`/assets/${asset.id}/edit`)}
                          onDelete={() => deleteAsset(asset.id)}
                        />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
