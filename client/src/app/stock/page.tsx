'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/Header';
import { useStock } from '@/context/StockContext';
import { useAuth } from '@/context/AuthContext';
import { RowActionMenu } from '@/components/RowActionMenu';
import { Dropdown, DropdownOption } from '@/components/Dropdown';
import { exportToCsv } from '@/lib/exportCsv';
import { getOptimizedImageUrl } from '@/lib/imageOptimization';
import { LabThumbnail } from '@/components/LabThumbnail';
import { Image as ImageIcon, Search, Shield } from 'lucide-react';

export default function StockPage() {
  const router = useRouter();
  const {
    stock,
    locations,
    deleteStockItem,
  } = useStock();
  const { canManageLocation } = useAuth();
  const [filterText, setFilterText] = useState('');
  const [selectedLab, setSelectedLab] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  const labOptions: DropdownOption[] = [
    { label: 'All Laboratories', value: 'all' },
    ...locations.map((loc) => ({
      label: `${loc.name} (${loc.room})`,
      value: loc.room,
    })),
  ];

  const statusOptions: DropdownOption[] = [
    { label: 'All Statuses', value: 'all' },
    { label: 'In Stock', value: 'in_stock' },
    { label: 'Low Stock', value: 'low_stock' },
    { label: 'Out of Stock', value: 'out_of_stock' },
  ];

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
      'csd_stock_inventory_peripherals',
      filteredStock.map((i) => ({
        'Item Name': i.name,
        'Part / SKU Code': i.code,
        Category: i.category,
        'Quantity in Stock': i.quantity,
        'Unit Measure': i.unit,
        'Laboratory Location': i.location,
        'Storage Shelf / Rack': i.rack,
        'Stock Status': i.status,
        'Warranty / Note': i.expiryDate || 'Active',
        'Technical Description': i.description || '',
      }))
    );
  };

  return (
    <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
      <Header
        title="Laboratory Inventory"
        subtitle="Stationery, Printer Ink, Hardware Tools, Consumables & Peripherals"
        actionLabel="Add Inventory Item"
        onAction={() => router.push('/stock/create')}
        onExport={handleExport}
      />

      <div className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-6 w-full">
        <div className="bg-white border border-neutral-200 rounded w-full">
          {/* Filters Toolbar with Lab Dropdown */}
          <div className="p-4 border-b border-neutral-200 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 flex-wrap flex-1">
              <div className="relative w-full sm:w-72">
                <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search consumables, tools, cables, peripherals..."
                  value={filterText}
                  onChange={(e) => setFilterText(e.target.value)}
                  className="w-full bg-white border border-neutral-300 text-neutral-900 text-xs pl-8 pr-3 py-1.5 rounded-lg focus:outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 transition-colors placeholder:text-neutral-400 font-medium shadow-2xs"
                />
              </div>

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
                  <th className="py-3 px-4 text-center">Quantity</th>
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
                  filteredStock.map((item) => {
                    const isAllowed = canManageLocation(item.location);
                    return (
                      <tr key={item.id} className="hover:bg-neutral-50/70 transition-colors group">
                        {/* Product Image Thumbnail */}
                        <td className="py-2.5 px-4">
                          <Link
                            href={`/stock/${item.id}`}
                            className="w-10 h-10 rounded border border-neutral-200 bg-neutral-100 overflow-hidden flex items-center justify-center shrink-0 cursor-pointer hover:border-neutral-400 transition-colors block"
                            title="Click to view details"
                          >
                            <LabThumbnail
                              src={item.imageUrl}
                              alt={item.name}
                              size="thumb"
                              fallbackType="item"
                              className="w-full h-full object-cover"
                            />
                          </Link>
                        </td>

                        <td className="py-3 px-4">
                          <Link
                            href={`/stock/${item.id}`}
                            className="font-semibold text-neutral-900 hover:text-emerald-700 text-left cursor-pointer transition-colors block"
                          >
                            {item.name}
                          </Link>
                        </td>
                        <td className="py-3 px-4 font-mono text-neutral-600">
                          <Link
                            href={`/stock/${item.id}`}
                            className="hover:text-neutral-900 transition-colors"
                          >
                            {item.code}
                          </Link>
                        </td>
                        <td className="py-3 px-4">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-neutral-100 text-neutral-700">
                            {item.category}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-neutral-100 text-neutral-900 border border-neutral-200">
                            {item.quantity}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-neutral-600">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span>{item.location}</span>
                            {!isAllowed && (
                              <span
                                className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[10px] font-semibold bg-neutral-100 text-neutral-500 border border-neutral-200 shrink-0"
                                title="Outside your assigned lab room scope"
                              >
                                <Shield className="w-2.5 h-2.5 text-neutral-400" />
                                Read-only
                              </span>
                            )}
                          </div>
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
                            onViewDetails={() => router.push(`/stock/${item.id}`)}
                            onEdit={isAllowed ? () => router.push(`/stock/${item.id}/edit`) : undefined}
                            onDelete={isAllowed ? () => deleteStockItem(item.id) : undefined}
                          />
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
