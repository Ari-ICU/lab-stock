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
import { Search, Shield, Layers, Eye, Package, Laptop, X, Plus } from 'lucide-react';
import { MockItem } from '@/types/stock';

export default function StockPage() {
  const router = useRouter();
  const { stock, locations, loans, deleteStockItem, lendStockItem, showToast } = useStock();
  const { user, canManageLocation } = useAuth();
  const [filterText, setFilterText] = useState('');
  const [selectedLab, setSelectedLab] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Lend modal states
  const [selectedLendItem, setSelectedLendItem] = useState<MockItem | null>(null);
  const [showLendModal, setShowLendModal] = useState(false);
  const [borrowQuantity, setBorrowQuantity] = useState(1);
  const [borrowerName, setBorrowerName] = useState('');
  const [borrowerRole, setBorrowerRole] = useState<'Student' | 'Lecturer' | 'Lab Assistant' | 'Technician'>('Student');
  const [borrowerContact, setBorrowerContact] = useState('');
  const [courseOrClass, setCourseOrClass] = useState('');
  const [borrowDate, setBorrowDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [expectedReturnDate, setExpectedReturnDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().split('T')[0];
  });
  const [loanNotes, setLoanNotes] = useState('');

  const handleLend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLendItem) return;
    if (!borrowerName.trim()) {
      showToast('Please enter borrower name', 'error');
      return;
    }
    const result = lendStockItem(selectedLendItem.id, borrowQuantity, {
      borrowerName: borrowerName.trim(),
      borrowerRole,
      borrowerContact: borrowerContact.trim() || 'No contact provided',
      courseOrClass: courseOrClass.trim() || undefined,
      borrowDate,
      expectedReturnDate,
      notes: loanNotes.trim() || undefined,
    });
    if (result) {
      setShowLendModal(false);
      setSelectedLendItem(null);
      setBorrowerName('');
      setBorrowerContact('');
      setCourseOrClass('');
      setLoanNotes('');
    }
  };

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

  // Aggregate Department Furniture & Equipment Counts across Central Stock & All Classroom/Lab Locations
  const departmentCounts = useMemo(() => {
    let totalUnits = 0;
    let tablesCount = 0;
    let chairsCount = 0;
    let storageCount = 0;

    const countItem = (name: string, category: string, qty: number) => {
      totalUnits += qty;
      const catLower = (category || '').toLowerCase();
      const nameLower = (name || '').toLowerCase();

      if (
        catLower.includes('table') ||
        catLower.includes('desk') ||
        nameLower.includes('table') ||
        nameLower.includes('desk') ||
        nameLower.includes('workbench')
      ) {
        tablesCount += qty;
      } else if (
        catLower.includes('chair') ||
        catLower.includes('seating') ||
        nameLower.includes('chair') ||
        nameLower.includes('swivel')
      ) {
        chairsCount += qty;
      } else if (
        catLower.includes('cabinet') ||
        catLower.includes('storage') ||
        catLower.includes('fixture') ||
        nameLower.includes('cabinet') ||
        nameLower.includes('whiteboard') ||
        nameLower.includes('shelf')
      ) {
        storageCount += qty;
      }
    };

    // 1. Central Stock Items
    stock.forEach((item) => {
      countItem(item.name, item.category || '', Number(item.quantity) || 0);
    });

    // 2. Classroom & Laboratory Facility Equipment
    (locations || []).forEach((loc) => {
      (loc.inventories || []).forEach((inv) => {
        const qty = (inv.qtyWorking || 0) + (inv.qtyBroken || 0) + (inv.qtyMaintenance || 0);
        countItem(inv.name, inv.group || '', qty);
      });
    });

    return { totalUnits, tablesCount, chairsCount, storageCount };
  }, [stock, locations]);

  // Map each stock item to its active room allocations
  const allocatedMap = useMemo(() => {
    const map: Record<string, { total: number; roomBreakdown: Array<{ room: string; qty: number }> }> = {};
    stock.forEach((s) => {
      const sNameLower = s.name.toLowerCase();
      let total = 0;
      const breakdown: Array<{ room: string; qty: number }> = [];

      (locations || []).forEach((loc) => {
        let roomTotal = 0;
        (loc.inventories || []).forEach((inv) => {
          const invNameLower = inv.name.toLowerCase();
          const isMatch =
            (inv.stockItemId && (inv.stockItemId === s.id || inv.stockItemId === s.code)) ||
            invNameLower === sNameLower ||
            sNameLower.includes(invNameLower) ||
            invNameLower.includes(sNameLower);
          if (isMatch) {
            const count = (inv.qtyWorking || 0) + (inv.qtyBroken || 0) + (inv.qtyMaintenance || 0);
            roomTotal += count;
          }
        });
        if (roomTotal > 0) {
          total += roomTotal;
          breakdown.push({ room: loc.room, qty: roomTotal });
        }
      });
      map[s.id] = { total, roomBreakdown: breakdown };
    });
    return map;
  }, [stock, locations]);

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
      filteredStock.map((i) => {
        const alloc = allocatedMap[i.id] || { total: 0, roomBreakdown: [] };
        return {
          'Item Name': i.name,
          'Part / SKU Code': i.code,
          Category: i.category,
          'Total Counted Units': i.quantity + alloc.total,
          'Central Depot Quantity': i.quantity,
          'Deployed Room Allocations': alloc.total,
          'Room Breakdown': alloc.roomBreakdown.map((r) => `${r.room}: ${r.qty}`).join('; '),
          'Unit Measure': i.unit,
          'Department Location': i.location,
          'Storage Shelf / Bay': i.rack,
          'Stock Status': i.status,
          'Warranty / Condition': i.expiryDate || 'Active',
          'Technical Description': i.description || '',
        };
      })
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
        {/* Consumables & Inventory Banner (Clean without background image) */}
        <div className="relative w-full rounded-2xl bg-neutral-900 text-white border border-neutral-800 p-5 sm:p-6 shadow-xs overflow-hidden">
          {/* Subtle ambient accent glow */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-blue-500/5 rounded-full blur-2xl pointer-events-none" />

          <div className="relative z-10 space-y-4">
            {/* Top Badges */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-xs sm:text-sm font-bold bg-white text-neutral-900 px-2.5 py-1 rounded-md shadow-xs flex items-center gap-1.5">
                <Package className="w-3.5 h-3.5 text-neutral-900" />
                <span>CENTRAL REPOSITORY</span>
              </span>
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-neutral-300 bg-neutral-800/90 px-2.5 py-1 rounded-md border border-neutral-700">
                {stock.length} CATALOGED SKUS
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] sm:text-xs font-bold bg-emerald-500/90 text-white shadow-xs">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                {departmentCounts.totalUnits.toLocaleString()} Total Items Counted
              </span>
              {stock.filter((i) => i.status !== 'in_stock').length > 0 ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] sm:text-xs font-bold bg-amber-500/90 text-white shadow-xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-white" />
                  {stock.filter((i) => i.status !== 'in_stock').length} Low / Out of Stock
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] sm:text-xs font-bold bg-emerald-500/90 text-white shadow-xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-white" />
                  All Stock Healthy
                </span>
              )}
            </div>

            {/* Banner Main Content */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pt-1">
              <div className="min-w-0">
                <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight truncate">
                  Consumables, Peripherals & Furniture Stock
                </h2>
                <p className="text-xs sm:text-sm text-neutral-300 mt-1.5 font-medium leading-relaxed max-w-2xl">
                  Central depot inventory tracking network patch cords, electrical sockets, switches, toolsets, student desks, and swivel chairs across university labs.
                </p>
              </div>

              {/* Quick Summary Panel */}
              <div className="flex items-center gap-2.5 shrink-0 bg-neutral-800/90 border border-neutral-700/80 px-3.5 py-2 rounded-xl text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="text-neutral-400">Depot Stock:</span>
                  <span className="font-mono font-bold text-emerald-400">
                    {stock.reduce((sum, i) => sum + i.quantity, 0).toLocaleString()}
                  </span>
                </div>
                <span className="text-neutral-600">|</span>
                <div className="flex items-center gap-2 text-[11px] font-mono">
                  <span className="text-neutral-200 font-bold">{departmentCounts.tablesCount} Desks</span>
                  <span className="text-neutral-600">·</span>
                  <span className="text-neutral-200 font-bold">{departmentCounts.chairsCount} Chairs</span>
                  <span className="text-neutral-600">·</span>
                  <span className="text-neutral-200 font-bold">{stock.length} SKUs</span>
                </div>
              </div>
            </div>
          </div>
        </div>

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
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {filteredStock.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-neutral-500">
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
                          {item.rack && (
                            <div className="text-[11px] text-neutral-400 font-normal truncate max-w-sm mt-0.5" title={item.rack}>
                              {item.rack}
                            </div>
                          )}
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
                          {(() => {
                            const alloc = allocatedMap[item.id] || { total: 0, roomBreakdown: [] };
                            const loanedCount = loans
                              .filter(
                                (l) =>
                                  (l.stockId === item.id || l.serialNumber === item.code || l.assetName === item.name) &&
                                  l.status === 'active'
                              )
                              .reduce((sum, l) => sum + (l.quantity || 1), 0);

                            return (
                              <div>
                                <span
                                  className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-bold bg-neutral-900 text-white shadow-2xs font-mono"
                                  title={alloc.total > 0 ? `${item.quantity} in stock + ${alloc.total} deployed across ${alloc.roomBreakdown.length} rooms` : undefined}
                                >
                                  {item.quantity} {item.unit || 'Units'}
                                </span>
                                {loanedCount > 0 && (
                                  <div className="text-[10px] text-blue-700 font-mono font-semibold mt-0.5">
                                    {loanedCount} on loan
                                  </div>
                                )}
                              </div>
                            );
                          })()}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[11px] font-semibold border ${
                              item.status === 'in_stock'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : item.status === 'low_stock'
                                ? 'bg-amber-50 text-amber-700 border-amber-200'
                                : 'bg-rose-50 text-rose-700 border-rose-200'
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                item.status === 'in_stock'
                                  ? 'bg-emerald-500'
                                  : item.status === 'low_stock'
                                  ? 'bg-amber-500'
                                  : 'bg-rose-500'
                              }`}
                            />
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
                            actions={[
                              {
                                label: 'Lend Item',
                                icon: <Laptop className="w-3.5 h-3.5 text-blue-600" />,
                                onClick: () => {
                                  setSelectedLendItem(item);
                                  setBorrowQuantity(1);
                                  setShowLendModal(true);
                                },
                                disabled: item.quantity === 0 || !isAllowed,
                              },
                            ]}
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

      {/* Lend Stock Item Modal */}
      {showLendModal && selectedLendItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-neutral-200 shadow-2xl max-w-lg w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="h-14 px-5 border-b border-neutral-200 flex items-center justify-between shrink-0 bg-neutral-50/80">
              <div className="flex items-center gap-2">
                <Laptop className="w-4 h-4 text-emerald-600" />
                <h3 className="font-semibold text-sm text-neutral-900">
                  Lend {selectedLendItem.name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowLendModal(false);
                  setSelectedLendItem(null);
                }}
                className="p-1 text-neutral-400 hover:text-neutral-700 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleLend} className="flex-1 overflow-y-auto p-5 pb-8 space-y-4 text-xs">
              {/* Item Info Box */}
              <div className="p-3 bg-neutral-50 border border-neutral-200 rounded-xl space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-neutral-900">{selectedLendItem.name}</span>
                  <span className="font-mono text-[11px] text-neutral-500">SKU: {selectedLendItem.code}</span>
                </div>
                <div className="text-[11px] text-neutral-500 flex items-center gap-3">
                  <span>Available in Stock: <strong className="text-emerald-700">{selectedLendItem.quantity} {selectedLendItem.unit || 'units'}</strong></span>
                  <span>•</span>
                  <span>Location: <strong className="text-neutral-800">{selectedLendItem.location}</strong></span>
                </div>
              </div>

              {/* Quantity to Borrow */}
              <div>
                <label className="block font-semibold text-neutral-700 mb-1 flex items-center justify-between">
                  <span>Quantity to Check Out</span>
                  <span className="text-[10px] font-mono text-neutral-400">Max available: {selectedLendItem.quantity}</span>
                </label>
                <input
                  type="number"
                  min={1}
                  max={selectedLendItem.quantity}
                  value={borrowQuantity}
                  onChange={(e) => setBorrowQuantity(Math.max(1, Math.min(selectedLendItem.quantity, parseInt(e.target.value) || 1)))}
                  className="w-full bg-white border border-neutral-300 rounded-lg px-3 py-2 text-neutral-900 font-mono font-bold focus:outline-none focus:border-neutral-900"
                />
              </div>

              {/* Borrower Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">
                    Borrower Full Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Chan Vutha"
                    value={borrowerName}
                    onChange={(e) => setBorrowerName(e.target.value)}
                    className="w-full bg-white border border-neutral-300 rounded-lg px-3 py-2 text-neutral-900 focus:outline-none focus:border-neutral-900"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">
                    Borrower Role
                  </label>
                  <select
                    value={borrowerRole}
                    onChange={(e) => setBorrowerRole(e.target.value as any)}
                    className="w-full bg-white border border-neutral-300 rounded-lg px-3 py-2 text-neutral-900 focus:outline-none focus:border-neutral-900"
                  >
                    <option value="Student">Student</option>
                    <option value="Lecturer">Lecturer</option>
                    <option value="Lab Assistant">Lab Assistant</option>
                    <option value="Technician">Technician</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">
                    Contact / Student ID
                  </label>
                  <input
                    type="text"
                    placeholder="ID: e20230012 / Tel: 012 999 888"
                    value={borrowerContact}
                    onChange={(e) => setBorrowerContact(e.target.value)}
                    className="w-full bg-white border border-neutral-300 rounded-lg px-3 py-2 text-neutral-900 focus:outline-none focus:border-neutral-900"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">
                    Class / Course / Bench
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. CS Networking Lab"
                    value={courseOrClass}
                    onChange={(e) => setCourseOrClass(e.target.value)}
                    className="w-full bg-white border border-neutral-300 rounded-lg px-3 py-2 text-neutral-900 focus:outline-none focus:border-neutral-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">
                    Check-Out Date
                  </label>
                  <input
                    type="date"
                    value={borrowDate}
                    onChange={(e) => setBorrowDate(e.target.value)}
                    className="w-full bg-white border border-neutral-300 rounded-lg px-3 py-2 text-neutral-900 font-mono focus:outline-none focus:border-neutral-900"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">
                    Expected Return Date
                  </label>
                  <input
                    type="date"
                    value={expectedReturnDate}
                    onChange={(e) => setExpectedReturnDate(e.target.value)}
                    className="w-full bg-white border border-neutral-300 rounded-lg px-3 py-2 text-neutral-900 font-mono focus:outline-none focus:border-neutral-900"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-neutral-700 mb-1">
                  Purpose / Loan Notes
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Borrowed for graduation capstone project demonstration"
                  value={loanNotes}
                  onChange={(e) => setLoanNotes(e.target.value)}
                  className="w-full bg-white border border-neutral-300 rounded-lg p-2.5 text-neutral-900 focus:outline-none focus:border-neutral-900"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowLendModal(false);
                    setSelectedLendItem(null);
                  }}
                  className="px-3.5 py-2 text-xs font-semibold text-neutral-700 bg-white border border-neutral-300 hover:bg-neutral-50 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-neutral-900 hover:bg-neutral-800 rounded-lg cursor-pointer shadow-xs"
                >
                  Confirm Check-Out
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
