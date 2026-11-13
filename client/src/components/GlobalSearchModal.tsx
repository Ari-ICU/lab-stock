'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useStock } from '@/context/StockContext';
import { useAuth } from '@/context/AuthContext';
import {
  Search,
  X,
  Microscope,
  Boxes,
  Building,
  Laptop,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

type SearchResultType = 'asset' | 'stock' | 'location' | 'loan';
type FilterTab = 'all' | SearchResultType;

interface SearchResultItem {
  id: string;
  type: SearchResultType;
  title: string;
  subtitle: string;
  tag: string;
  badge: string;
  badgeColor: string;
  href: string;
}

function formatSearchDate(val?: string) {
  if (!val) return 'N/A';
  const d = new Date(val);
  if (Number.isNaN(d.getTime())) return val;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function GlobalSearchModal() {
  const router = useRouter();
  const {
    isSearchOpen,
    closeSearch,
    assets,
    stock,
    locations,
    loans,
  } = useStock();
  const { canManageLocation } = useAuth();

  const [query, setQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterTab>('all');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (isSearchOpen) {
      setQuery('');
      setActiveFilter('all');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isSearchOpen]);

  // Dynamically compute suggestions from live database / context state
  const dynamicSuggestions = useMemo(() => {
    const suggestions: Array<{ label: string; q: string; type: string }> = [];

    // 1. User's Handled Laboratories or Primary Lab Rooms
    const handledLocs = locations.filter((loc) => canManageLocation(loc.room) || canManageLocation(loc.name));
    const targetLocs = handledLocs.length > 0 ? handledLocs : locations.slice(0, 2);
    for (const loc of targetLocs.slice(0, 2)) {
      suggestions.push({
        label: `${loc.name} (${loc.room})`,
        q: loc.room,
        type: 'My Handled Lab',
      });
    }

    // 2. Hardware Assets (from live database)
    for (const a of assets.slice(0, 2)) {
      suggestions.push({
        label: a.name,
        q: a.model || a.name.split(' ')[0],
        type: 'Hardware',
      });
    }

    // 3. Inventory Consumables (from live database)
    for (const s of stock.slice(0, 2)) {
      suggestions.push({
        label: s.name,
        q: s.code || s.name.split(' ')[0],
        type: s.category || 'Stock',
      });
    }

    // Return first 6 suggestions
    return suggestions.slice(0, 6);
  }, [locations, assets, stock, canManageLocation]);

  // Aggregate and filter results
  const results = useMemo<SearchResultItem[]>(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];

    const items: SearchResultItem[] = [];

    // 1. Hardware Assets
    for (const a of assets) {
      const match =
        a.name.toLowerCase().includes(q) ||
        a.model.toLowerCase().includes(q) ||
        a.serialNumber.toLowerCase().includes(q) ||
        a.location.toLowerCase().includes(q) ||
        a.status.toLowerCase().includes(q) ||
        (a.description && a.description.toLowerCase().includes(q)) ||
        (a.currentBorrower && a.currentBorrower.toLowerCase().includes(q));

      if (match) {
        items.push({
          id: `asset-${a.id}`,
          type: 'asset',
          title: a.name,
          subtitle: `${a.model} • SN: ${a.serialNumber} • ${a.location}`,
          tag: 'Hardware Asset',
          badge: a.status === 'operational' ? 'Operational' : a.status === 'maintenance' ? 'In Repair' : 'In Use',
          badgeColor: a.status === 'operational' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-blue-50 text-blue-700 border-blue-200',
          href: `/assets/${a.id}`,
        });
      }
    }

    // 2. Inventory Items / Consumables
    for (const s of stock) {
      const match =
        s.name.toLowerCase().includes(q) ||
        s.code.toLowerCase().includes(q) ||
        s.category.toLowerCase().includes(q) ||
        s.location.toLowerCase().includes(q) ||
        (s.rack && s.rack.toLowerCase().includes(q)) ||
        (s.description && s.description.toLowerCase().includes(q));

      if (match) {
        items.push({
          id: `stock-${s.id}`,
          type: 'stock',
          title: s.name,
          subtitle: `SKU: ${s.code} • ${s.category} • ${s.quantity} ${s.unit} in ${s.location}`,
          tag: 'Peripheral / Stock',
          badge: `${s.quantity} ${s.unit}`,
          badgeColor: s.status === 'in_stock' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200',
          href: `/stock/${s.id}`,
        });
      }
    }

    // 3. Lab Locations
    for (const l of locations) {
      const match =
        l.name.toLowerCase().includes(q) ||
        l.room.toLowerCase().includes(q) ||
        l.building.toLowerCase().includes(q);

      if (match) {
        items.push({
          id: `loc-${l.id}`,
          type: 'location',
          title: l.name,
          subtitle: `${l.building} • Room ${l.room} • ${l.totalAssets || 0} Assets • ${l.totalItems || 0} Stock Items`,
          tag: 'Lab Classroom',
          badge: l.room,
          badgeColor: 'bg-neutral-100 text-neutral-800 border-neutral-300 font-mono',
          href: `/locations/${l.id}`,
        });
      }
    }

    // 4. Device Loans
    for (const loan of loans) {
      const match =
        loan.borrowerName.toLowerCase().includes(q) ||
        loan.assetName.toLowerCase().includes(q) ||
        loan.serialNumber.toLowerCase().includes(q) ||
        (loan.courseOrClass && loan.courseOrClass.toLowerCase().includes(q)) ||
        (loan.notes && loan.notes.toLowerCase().includes(q));

      if (match) {
        items.push({
          id: `loan-${loan.id}`,
          type: 'loan',
          title: `${loan.assetName} (Lent to ${loan.borrowerName})`,
          subtitle: `Contact: ${loan.borrowerContact || 'N/A'} • Due: ${formatSearchDate(loan.expectedReturnDate)}`,
          tag: 'Device Loan',
          badge: loan.status === 'active' ? 'Active Checkout' : 'Returned',
          badgeColor: loan.status === 'active' ? 'bg-amber-50 text-amber-800 border-amber-200' : 'bg-neutral-100 text-neutral-700 border-neutral-200',
          href: `/loans/${loan.id}`,
        });
      }
    }

    return items;
  }, [query, assets, stock, locations, loans]);

  const filterCounts = useMemo(
    () => ({
      all: results.length,
      asset: results.filter((r) => r.type === 'asset').length,
      stock: results.filter((r) => r.type === 'stock').length,
      location: results.filter((r) => r.type === 'location').length,
      loan: results.filter((r) => r.type === 'loan').length,
    }),
    [results]
  );

  const filteredResults = useMemo(
    () => (activeFilter === 'all' ? results : results.filter((r) => r.type === activeFilter)),
    [results, activeFilter]
  );

  // Keep selected index in bounds
  useEffect(() => {
    setSelectedIndex(0);
  }, [query, activeFilter]);

  useEffect(() => {
    const activeEl = listRef.current?.querySelector(`[data-search-idx="${selectedIndex}"]`);
    if (activeEl instanceof HTMLElement) {
      activeEl.scrollIntoView({ block: 'nearest' });
    }
  }, [selectedIndex]);

  // Keyboard navigation
  useEffect(() => {
    if (!isSearchOpen) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.preventDefault();
        closeSearch();
        return;
      }

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev < filteredResults.length - 1 ? prev + 1 : 0));
        return;
      }

      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : Math.max(0, filteredResults.length - 1)));
        return;
      }

      if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredResults[selectedIndex]) {
          handleSelect(filteredResults[selectedIndex]);
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSearchOpen, filteredResults, selectedIndex]);

  const handleSelect = (item: SearchResultItem) => {
    closeSearch();
    router.push(item.href);
  };

  if (!isSearchOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-neutral-900/60 backdrop-blur-xs transition-opacity"
        onClick={closeSearch}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-neutral-200/90 overflow-hidden flex flex-col max-h-[80vh] z-10 animate-in fade-in-0 zoom-in-95 duration-150">
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3.5 border-b border-neutral-200 bg-white shrink-0">
          <Search className="w-5 h-5 text-neutral-400 mr-3 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search assets, stock, SKU, serial number, room, or borrower..."
            className="w-full text-sm font-medium text-neutral-900 placeholder:text-neutral-400 focus:outline-none bg-transparent"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 text-neutral-400 hover:text-neutral-600 rounded mr-1.5 cursor-pointer"
              title="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono text-neutral-400 bg-neutral-100 border border-neutral-200 rounded shrink-0">
            ESC
          </kbd>
        </div>

        {/* Category Filter Tabs */}
        {query.trim() !== '' && results.length > 0 && (
          <div className="px-4 py-2 border-b border-neutral-100 bg-neutral-50/70 flex items-center gap-1.5 overflow-x-auto shrink-0">
            {(
              [
                { key: 'all', label: 'All', count: filterCounts.all },
                { key: 'asset', label: 'Hardware', count: filterCounts.asset },
                { key: 'stock', label: 'Inventory', count: filterCounts.stock },
                { key: 'location', label: 'Rooms', count: filterCounts.location },
                { key: 'loan', label: 'Loans', count: filterCounts.loan },
              ] as { key: FilterTab; label: string; count: number }[]
            )
              .filter((tab) => tab.key === 'all' || tab.count > 0)
              .map((tab) => {
                const active = activeFilter === tab.key;
                return (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setActiveFilter(tab.key)}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer shrink-0 ${
                      active
                        ? 'bg-neutral-900 text-white'
                        : 'bg-white text-neutral-600 border border-neutral-200 hover:bg-neutral-100'
                    }`}
                  >
                    <span>{tab.label}</span>
                    <span
                      className={`font-mono text-[10px] px-1 rounded ${
                        active ? 'bg-white/15 text-neutral-200' : 'text-neutral-400'
                      }`}
                    >
                      {tab.count}
                    </span>
                  </button>
                );
              })}
          </div>
        )}

        {/* Results Container */}
        <div
          ref={listRef}
          className="flex-1 overflow-y-auto divide-y divide-neutral-100 bg-neutral-50/40 text-xs"
        >
          {query.trim() === '' ? (
            /* Empty Query / Quick Suggestions */
            <div className="p-5 sm:p-6 text-neutral-500 space-y-3.5">
              <div className="flex items-center gap-2 text-neutral-500 text-[11px] font-bold uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                <span>Quick Suggestions</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {dynamicSuggestions.map((s) => (
                  <button
                    key={s.label}
                    onClick={() => setQuery(s.q)}
                    className="p-3 bg-white border border-neutral-200/80 hover:border-neutral-400 rounded-xl flex items-center justify-between text-left transition-all cursor-pointer group shadow-2xs"
                  >
                    <span className="font-semibold text-neutral-800 group-hover:text-emerald-700 transition-colors truncate mr-2">
                      {s.label}
                    </span>
                    <span className="text-[10px] font-medium text-neutral-500 bg-neutral-100 px-2 py-0.5 rounded-md shrink-0">
                      {s.type}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ) : filteredResults.length === 0 ? (
            /* No Results */
            <div className="p-12 text-center text-neutral-400 space-y-2">
              <Search className="w-8 h-8 mx-auto text-neutral-300" />
              <div className="font-bold text-neutral-700 text-sm">
                No matching equipment or records found
              </div>
              <p className="text-xs text-neutral-400 max-w-sm mx-auto">
                No asset, consumable, room, or borrower matched &ldquo;<span className="font-mono text-neutral-700 font-semibold">{query}</span>&rdquo;.
              </p>
            </div>
          ) : (
            /* Results List */
            <div className="p-2.5 space-y-1.5">
              <div className="px-2.5 py-1 text-[10px] uppercase font-bold text-neutral-400 tracking-wider">
                Showing {filteredResults.length} matching {filteredResults.length === 1 ? 'record' : 'records'}
              </div>
              {filteredResults.map((item, idx) => {
                const isSelected = idx === selectedIndex;
                return (
                  <div
                    key={item.id}
                    data-search-idx={idx}
                    onClick={() => handleSelect(item)}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    className={`p-3 rounded-xl flex items-center justify-between gap-3 cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-neutral-900 text-white shadow-xs'
                        : 'bg-white hover:bg-neutral-100/70 border border-neutral-200/70'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                          isSelected
                            ? 'bg-neutral-800 text-emerald-400'
                            : 'bg-neutral-100 text-neutral-600'
                        }`}
                      >
                        {item.type === 'asset' && <Microscope className="w-4 h-4" />}
                        {item.type === 'stock' && <Boxes className="w-4 h-4" />}
                        {item.type === 'location' && <Building className="w-4 h-4" />}
                        {item.type === 'loan' && <Laptop className="w-4 h-4" />}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className={`font-bold text-xs truncate ${
                              isSelected ? 'text-white' : 'text-neutral-900'
                            }`}
                          >
                            {item.title}
                          </span>
                          <span
                            className={`text-[9px] uppercase font-bold px-1.5 py-0.5 rounded border ${
                              isSelected
                                ? 'bg-neutral-800 text-neutral-300 border-neutral-700'
                                : item.badgeColor
                            }`}
                          >
                            {item.badge}
                          </span>
                        </div>
                        <div
                          className={`text-[11px] truncate mt-0.5 ${
                            isSelected ? 'text-neutral-300' : 'text-neutral-500'
                          }`}
                        >
                          {item.subtitle}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[10px] uppercase font-semibold hidden sm:inline text-neutral-400">
                        {item.tag}
                      </span>
                      <ArrowRight
                        className={`w-3.5 h-3.5 ${
                          isSelected ? 'text-emerald-400' : 'text-neutral-400'
                        }`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal Footer Keyboard Guide */}
        <div className="h-10 px-4 bg-neutral-50 border-t border-neutral-200 flex items-center justify-between text-[11px] text-neutral-500 shrink-0">
          <div className="flex items-center gap-3">
            <span>
              <kbd className="px-1.5 py-0.5 font-mono text-[10px] bg-white border border-neutral-300 rounded shadow-2xs">
                ↑
              </kbd>{' '}
              <kbd className="px-1.5 py-0.5 font-mono text-[10px] bg-white border border-neutral-300 rounded shadow-2xs">
                ↓
              </kbd>{' '}
              to navigate
            </span>
            <span>
              <kbd className="px-1.5 py-0.5 font-mono text-[10px] bg-white border border-neutral-300 rounded shadow-2xs">
                ↵
              </kbd>{' '}
              to open
            </span>
          </div>
          <span className="text-[10px] font-medium text-neutral-400">CSD Stock Search</span>
        </div>
      </div>
    </div>
  );
}
