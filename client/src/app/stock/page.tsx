'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/Header';
import { useStock } from '@/context/StockContext';
import { useAuth } from '@/context/AuthContext';
import { RowActionMenu } from '@/components/RowActionMenu';
import { Dropdown, DropdownOption } from '@/components/Dropdown';
import { exportToCsv } from '@/lib/exportCsv';
import { LabThumbnail } from '@/components/LabThumbnail';
import { Search, Shield, Layers, Eye } from 'lucide-react';

export default function StockPage() {
  const router = useRouter();
  const { stock, locations, deleteStockItem } = useStock();
  const { user, canManageLocation } = useAuth();
  const [filterText, setFilterText] = useState('');
  const [selectedLab, setSelectedLab] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const isSuperAdmin = user?.roleBadge === 'Admin' || user?.assignedLabs?.includes('all');
  const myAssignedRooms = user?.assignedLabs || [];

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

  // Dynamic category options extracted from current inventory
  const categoryOptions: DropdownOption[] = useMemo(() => {
    const categoriesSet = new Set<string>();
    stock.forEach((item) => {
      if (item.category) categoriesSet.add(item.category);
    });
    const sortedCats = Array.from(categoriesSet).sort();
    return [
      { label: 'All Categories', value: 'all' },
      ...sortedCats.map((cat) => ({ label: cat, value: cat })),
    ];
  }, [stock]);

  // Aggregate Department Furniture & Equipment Counts
  const departmentCounts = useMemo(() => {
    let totalUnits = 0;
    let tablesCount = 0;
    let chairsCount = 0;
    let storageCount = 0;

    stock.forEach((item) => {
      const qty = Number(item.quantity) || 0;
      totalUnits += qty;

      const catLower = (item.category || '').toLowerCase();
      const nameLower = (item.name || '').toLowerCase();

      if (catLower.includes('table') || catLower.includes('desk') || nameLower.includes('table') || nameLower.includes('desk') || nameLower.includes('workbench')) {
        tablesCount += qty;
      } else if (catLower.includes('chair') || catLower.includes('seating') || nameLower.includes('chair') || nameLower.includes('swivel')) {
        chairsCount += qty;
      } else if (catLower.includes('cabinet') || catLower.includes('storage') || catLower.includes('fixture') || nameLower.includes('cabinet') || nameLower.includes('whiteboard')) {
        storageCount += qty;
      }
    });

    return { totalUnits, tablesCount, chairsCount, storageCount };
  }, [stock]);

  const filteredStock = stock
    .filter((item) => {
      const matchesQuery =
        item.name.toLowerCase().includes(filterText.toLowerCase()) ||
        item.code.toLowerCase().includes(filterText.toLowerCase()) ||
        item.location.toLowerCase().includes(filterText.toLowerCase()) ||
        item.rack.toLowerCase().includes(filterText.toLowerCase());

      const matchesLab =
        selectedLab === 'all'
          ? true
          : selectedLab === 'my_assigned'
          ? canManageLocation(item.location)
          : item.location.toLowerCase().includes(selectedLab.toLowerCase());

      const matchesStatus =
        selectedStatus === 'all' || item.status === selectedStatus;

      const matchesCategory =
        selectedCategory === 'all' || item.category === selectedCategory;

      return matchesQuery && matchesLab && matchesStatus && matchesCategory;
    })
    .sort((a, b) => {
      // Items in handled laboratories come first; unhandled laboratories go to the bottom
      const aAllowed = canManageLocation(a.location);
      const bAllowed = canManageLocation(b.location);
      if (aAllowed && !bAllowed) return -1;
      if (!aAllowed && bAllowed) return 1;
      return 0;
    });

  const handleExport = () => {
    exportToCsv(
      'department_inventory_count_audit',
      filteredStock.map((i) => ({
        'Item Name': i.name,
        'Part / SKU Code': i.code,
        Category: i.category,
        'Count / Quantity': i.quantity,
        'Unit Measure': i.unit,
        'Department Location': i.location,
        'Storage Shelf / Bay': i.rack,
        'Stock Status': i.status,
        'Warranty / Condition': i.expiryDate || 'Active',
        'Technical Description': i.description || '',
      }))
    );
  };

  return (
    <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
      <Header
        title="Consumables & Peripheral Stock"
        subtitle="Department Inventory: Network Cables, Sockets, Connectors, Toner, Consumables & Lab Supplies"
        actionLabel="Add Consumable Stock"
        onAction={() => router.push('/stock/create')}
        onExport={handleExport}
      />

      <div className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-6 w-full">

        {/* Real-time Department Item & Furniture Count KPI Metric Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-white border border-neutral-200 rounded-lg p-4 shadow-2xs">
            <div className="flex items-center justify-between text-neutral-500 mb-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider">Total Counted Items</span>
              <Layers className="w-4 h-4 text-neutral-400" />
            </div>
            <div className="text-2xl font-bold text-neutral-900 font-mono">
              {departmentCounts.totalUnits.toLocaleString()}
            </div>
            <div className="text-[11px] text-neutral-500 mt-1">Across all department labs & rooms</div>
          </div>

          <div className="bg-white border border-neutral-200 rounded-lg p-4 shadow-2xs">
            <div className="flex items-center justify-between text-neutral-500 mb-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider">Tables & Desks</span>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">Furniture</span>
            </div>
            <div className="text-2xl font-bold text-emerald-800 font-mono">
              {departmentCounts.tablesCount} <span className="text-xs font-normal text-neutral-500">Units</span>
            </div>
            <div className="text-[11px] text-neutral-500 mt-1">Workstations, lecturer & modular tables</div>
          </div>

          <div className="bg-white border border-neutral-200 rounded-lg p-4 shadow-2xs">
            <div className="flex items-center justify-between text-neutral-500 mb-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider">Chairs & Seating</span>
              <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">Seating</span>
            </div>
            <div className="text-2xl font-bold text-blue-800 font-mono">
              {departmentCounts.chairsCount} <span className="text-xs font-normal text-neutral-500">Units</span>
            </div>
            <div className="text-[11px] text-neutral-500 mt-1">Ergonomic swivel, faculty & stacking chairs</div>
          </div>

          <div className="bg-white border border-neutral-200 rounded-lg p-4 shadow-2xs">
            <div className="flex items-center justify-between text-neutral-500 mb-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider">Cabinets & Fixtures</span>
              <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">Storage</span>
            </div>
            <div className="text-2xl font-bold text-amber-800 font-mono">
              {departmentCounts.storageCount} <span className="text-xs font-normal text-neutral-500">Units</span>
            </div>
            <div className="text-[11px] text-neutral-500 mt-1">Steel cabinets, whiteboards & lockers</div>
          </div>
        </div>

        <div className="bg-white border border-neutral-200 rounded-lg w-full shadow-2xs">
          {/* Filters Toolbar with Category, Lab & Status Dropdowns */}
          <div className="p-4 border-b border-neutral-200 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 flex-wrap flex-1">
              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search tables, chairs, cabinets, tools..."
                  value={filterText}
                  onChange={(e) => setFilterText(e.target.value)}
                  className="w-full bg-white border border-neutral-300 text-neutral-900 text-xs pl-8 pr-3 py-1.5 rounded-lg focus:outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 transition-colors placeholder:text-neutral-400 font-medium shadow-2xs"
                />
              </div>

              {/* Category Dropdown */}
              <Dropdown
                value={selectedCategory}
                options={categoryOptions}
                onChange={setSelectedCategory}
                placeholder="Category"
                className="w-full sm:w-auto"
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

          {/* Clean Responsive Table with Product Images & Department Counts */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs min-w-[750px]">
              <thead className="bg-neutral-50 border-b border-neutral-200 text-neutral-600 font-semibold">
                <tr>
                  <th className="py-3 px-4 w-12">Visual</th>
                  <th className="py-3 px-4">Item & Equipment Name</th>
                  <th className="py-3 px-4">Part / SKU</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4 text-center">Count / Qty</th>
                  <th className="py-3 px-4">Department Location</th>
                  <th className="py-3 px-4">Warranty / Note</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {filteredStock.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-neutral-500">
                      No department inventory items found matching your filter criteria.
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
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-neutral-100 text-neutral-700 border border-neutral-200/60">
                            {item.category}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-bold bg-neutral-900 text-white shadow-2xs font-mono">
                            {item.quantity} {item.unit || 'Units'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-neutral-600">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-medium text-neutral-900">{item.location}</span>
                          </div>
                          <div className="text-[11px] text-neutral-400 font-mono mt-0.5">{item.rack}</div>
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
