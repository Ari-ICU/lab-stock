'use client';

import React, { useState } from 'react';
import { Header } from '@/components/Header';
import { useStock } from '@/context/StockContext';
import { RowActionMenu } from '@/components/RowActionMenu';
import { Dropdown, DropdownOption } from '@/components/Dropdown';
import { exportToCsv } from '@/lib/exportCsv';
import { Image as ImageIcon } from 'lucide-react';

const labOptions: DropdownOption[] = [
  { label: 'All Laboratories', value: 'all' },
  { label: 'Lab 102B (Rm 102B)', value: '102B' },
  { label: 'Lab 206 (Rm 206)', value: '206' },
];

const statusOptions: DropdownOption[] = [
  { label: 'All Statuses', value: 'all' },
  { label: 'In Stock', value: 'in_stock' },
  { label: 'Low Stock', value: 'low_stock' },
  { label: 'Out of Stock', value: 'out_of_stock' },
];

export default function StockPage() {
  const {
    stock,
    openModal,
    updateStockQuantity,
    deleteStockItem,
    openDetails,
    openEdit,
  } = useStock();
  const [filterText, setFilterText] = useState('');
  const [selectedLab, setSelectedLab] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  const filteredStock = stock.filter((item) => {
    const matchesQuery =
      item.name.toLowerCase().includes(filterText.toLowerCase()) ||
      item.code.toLowerCase().includes(filterText.toLowerCase()) ||
      item.location.toLowerCase().includes(filterText.toLowerCase()) ||
      item.rack.toLowerCase().includes(filterText.toLowerCase());

    const matchesLab =
      selectedLab === 'all' ||
      item.location.toLowerCase().includes(selectedLab.toLowerCase());

    const matchesStatus =
      selectedStatus === 'all' || item.status === selectedStatus;

    return matchesQuery && matchesLab && matchesStatus;
  });

  const handleExport = () => {
    exportToCsv(
      'lab_stock_inventory',
      filteredStock.map((i) => ({
        'Item Name': i.name,
        'Part Code': i.code,
        Category: i.category,
        Quantity: i.quantity,
        Unit: i.unit,
        Location: i.location,
        Rack: i.rack,
        Status: i.status,
      }))
    );
  };

  return (
    <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
      <Header
        title="Laboratory Inventory & Peripherals"
        subtitle="Lab 102B & Lab 206 • Peripherals, Cables & Equipment"
        actionLabel="Add Inventory Item"
        onAction={() => openModal('add_stock')}
        onExport={handleExport}
      />

      <div className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-6 max-w-8xl w-full mx-auto">
        <div className="bg-white border border-neutral-200 rounded">
          {/* Filters Toolbar with Lab Dropdown */}
          <div className="p-4 border-b border-neutral-200 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 flex-wrap flex-1">
              <input
                type="text"
                placeholder="Search cables, transceivers, racks..."
                value={filterText}
                onChange={(e) => setFilterText(e.target.value)}
                className="w-full sm:w-64 bg-white border border-neutral-300 text-neutral-900 text-xs px-3 py-1.5 rounded focus:outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 transition-colors placeholder:text-neutral-400 font-medium"
              />

              {/* Lab Filter Dropdown */}
              <Dropdown
                value={selectedLab}
                options={labOptions}
                onChange={setSelectedLab}
                placeholder="Filter by Lab"
                className="w-full sm:w-auto"
              />

              {/* Status Dropdown */}
              <Dropdown
                value={selectedStatus}
                options={statusOptions}
                onChange={setSelectedStatus}
                placeholder="Status"
                className="w-full sm:w-auto"
              />
            </div>

            <div className="text-xs text-neutral-500 shrink-0">
              Showing <span className="font-semibold text-neutral-900">{filteredStock.length}</span> items
            </div>
          </div>

          {/* Clean Responsive Table with Product Images */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs min-w-[750px]">
              <thead className="bg-neutral-50 border-b border-neutral-200 text-neutral-600 font-semibold">
                <tr>
                  <th className="py-3 px-4 w-12">Image</th>
                  <th className="py-3 px-4">Item Name</th>
                  <th className="py-3 px-4">Part / SKU</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Quantity</th>
                  <th className="py-3 px-4">Assigned Location</th>
                  <th className="py-3 px-4">Warranty / Note</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {filteredStock.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-neutral-500">
                      No stock items found matching your criteria.
                    </td>
                  </tr>
                ) : (
                  filteredStock.map((item) => (
                    <tr key={item.id} className="hover:bg-neutral-50/70 transition-colors group">
                      {/* Product Image Thumbnail */}
                      <td className="py-2.5 px-4">
                        <div
                          onClick={() => openDetails(item)}
                          className="w-10 h-10 rounded border border-neutral-200 bg-neutral-100 overflow-hidden flex items-center justify-center shrink-0 cursor-pointer hover:border-neutral-400 transition-colors"
                          title="Click to view details"
                        >
                          {item.imageUrl ? (
                            <img
                              src={item.imageUrl}
                              alt={item.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <ImageIcon className="w-4 h-4 text-neutral-400" />
                          )}
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <button
                          onClick={() => openDetails(item)}
                          className="font-semibold text-neutral-900 hover:text-emerald-700 text-left cursor-pointer transition-colors"
                        >
                          {item.name}
                        </button>
                      </td>
                      <td className="py-3 px-4 font-mono text-neutral-600">{item.code}</td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-neutral-100 text-neutral-700">
                          {item.category}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-bold text-neutral-900">
                        <div className="flex items-center gap-1.5">
                          <span>
                            {item.quantity} {item.unit}
                          </span>
                          <div className="opacity-0 group-hover:opacity-100 flex items-center gap-0.5 transition-opacity">
                            <button
                              onClick={() => updateStockQuantity(item.id, 1)}
                              className="w-4 h-4 flex items-center justify-center bg-neutral-200 hover:bg-neutral-300 text-neutral-700 rounded text-[10px] font-bold"
                              title="Increase quantity (+1)"
                            >
                              +
                            </button>
                            <button
                              onClick={() => updateStockQuantity(item.id, -1)}
                              className="w-4 h-4 flex items-center justify-center bg-neutral-200 hover:bg-neutral-300 text-neutral-700 rounded text-[10px] font-bold"
                              title="Decrease quantity (-1)"
                            >
                              -
                            </button>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-neutral-600">
                        <div>{item.location}</div>
                        <div className="text-[11px] text-neutral-400 font-mono">{item.rack}</div>
                      </td>
                      <td className="py-3 px-4 text-neutral-500 text-[11px]">{item.expiryDate}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium ${
                            item.status === 'in_stock'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : item.status === 'low_stock'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          {item.status === 'in_stock'
                            ? 'In Stock'
                            : item.status === 'low_stock'
                            ? 'Low Stock'
                            : 'Out of Stock'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <RowActionMenu
                          onViewDetails={() => openDetails(item)}
                          onEdit={() => openEdit(item)}
                          onDelete={() => deleteStockItem(item.id)}
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
