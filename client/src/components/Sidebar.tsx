'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useStock } from '@/context/StockContext';
import { useAuth } from '@/context/AuthContext';
import { getAssetPath } from '@/lib/basePath';
import {
  Network,
  LayoutDashboard,
  Package,
  Cable,
  Router,
  Wrench,
  MapPin,
  Settings,
  LogOut,
  Search,
  Barcode,
  X,
  ArrowLeftRight
} from 'lucide-react';

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string | number;
}

const navItems: NavItem[] = [
  { href: '/', label: 'Overview', icon: LayoutDashboard },
  { href: '/assets', label: 'Hardware Assets', icon: Router },
  { href: '/stock', label: 'Inventory', icon: Package },
  { href: '/loans', label: 'Device Loans', icon: ArrowLeftRight },
  { href: '/maintenance', label: 'Maintenance', icon: Wrench },
  { href: '/locations', label: 'Lab Locations', icon: MapPin },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const {
    openScanner,
    openSearch,
    stock,
    assets,
    maintenance,
    locations,
    loans,
    isMobileSidebarOpen,
    closeMobileSidebar,
    showToast,
  } = useStock();
  const { user, logout } = useAuth();

  const activeLoansCount = loans.filter((l) => l.status === 'active').length;

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isMobileSidebarOpen && (
        <div
          onClick={closeMobileSidebar}
          className="fixed inset-0 bg-black/40 z-40 lg:hidden backdrop-blur-xs transition-opacity"
        />
      )}

      {/* Responsive Aside Navigation */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-neutral-200 flex flex-col h-screen select-none shrink-0 transition-transform duration-200 ease-in-out lg:static lg:translate-x-0 ${
          isMobileSidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
        }`}
      >
        {/* Brand Header with University Seal Logo */}
        <div className="h-16 border-b border-neutral-200 px-4 flex items-center justify-between">
          <Link
            href="/"
            onClick={closeMobileSidebar}
            className="flex items-center gap-2.5 min-w-0"
          >
            <div className="w-10 h-10 rounded-md bg-neutral-50 border border-neutral-200 flex items-center justify-center p-1 shrink-0">
              <img
                src={getAssetPath('/logo.png')}
                alt="CSD Stock Emblem"
                className="w-full h-full object-contain"
                onError={(e) => {
                  const img = e.currentTarget;
                  if (!img.dataset.tried) {
                    img.dataset.tried = 'true';
                    if (typeof window !== 'undefined' && window.location.pathname.startsWith('/lab-stock')) {
                      img.src = '/lab-stock/logo.png';
                    }
                  }
                }}
              />
            </div>
            <div className="min-w-0">
              <div className="font-extrabold text-[15px] text-neutral-900 tracking-tight leading-tight truncate">
                CSD Stock
              </div>
              <span className="text-[11px] text-neutral-500 font-medium truncate block mt-0.5">
                Faculty Laboratories
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-1.5 shrink-0">
            {user?.roleBadge === 'Admin' || user?.role === 'Primary Lab Administrator' || user?.assignedLabs?.includes('all') ? (
              <span className="text-[10px] uppercase tracking-wider font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 px-1.5 py-0.5 rounded">
                ALL LABS
              </span>
            ) : (
              <span className="text-[10px] uppercase tracking-wider font-semibold bg-blue-50 text-blue-700 border border-blue-200 px-1.5 py-0.5 rounded font-mono">
                {user?.assignedLabs && user.assignedLabs.length === 1
                  ? user.assignedLabs[0]
                  : `${user?.assignedLabs?.length || 0} LABS`}
              </span>
            )}
            {/* Mobile close button */}
            <button
              onClick={closeMobileSidebar}
              className="lg:hidden p-1 text-neutral-400 hover:text-neutral-900 rounded"
              title="Close menu"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Barcode / Model Quick Scan Action */}
        <div className="p-3 border-b border-neutral-100">
          <button
            onClick={() => {
              openScanner();
              closeMobileSidebar();
            }}
            className="w-full flex items-center justify-center gap-2 bg-neutral-900 hover:bg-neutral-800 text-white px-3 py-2.5 rounded text-xs font-semibold transition-colors cursor-pointer"
          >
            <Barcode className="w-4 h-4 text-emerald-400" />
            <span>Scan Barcode / Model</span>
          </button>
        </div>

        {/* Global Fleet Quick Search (Cmd+K) */}
        <div className="px-3 py-2 border-b border-neutral-100">
          <button
            type="button"
            onClick={() => {
              openSearch();
              closeMobileSidebar();
            }}
            className="w-full bg-white hover:bg-neutral-50 active:bg-neutral-100 text-xs text-neutral-400 pl-8 pr-2 py-1.5 border border-neutral-300 hover:border-neutral-400 rounded focus:outline-none focus:border-neutral-900 transition-all flex items-center justify-between cursor-pointer relative group text-left shadow-2xs"
            title="Global search across devices, serials, IPs, and rooms (⌘K)"
          >
            <Search className="w-4 h-4 text-neutral-400 absolute left-2.5 top-1/2 -translate-y-1/2 group-hover:text-neutral-700 transition-colors" />
            <span className="truncate group-hover:text-neutral-600 transition-colors">Search IP, MAC, switch...</span>
            <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono font-semibold text-neutral-400 bg-neutral-100 border border-neutral-200 rounded shrink-0">
              ⌘K
            </kbd>
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          <div className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider px-2 py-1">
            Menu
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.href === '/'
                ? pathname === '/'
                : pathname.startsWith(item.href);

            const badgeDisplay =
              item.href === '/assets'
                ? assets.length
                : item.href === '/stock'
                ? stock.length
                : item.href === '/loans'
                ? (activeLoansCount > 0 ? activeLoansCount : undefined)
                : item.href === '/maintenance'
                ? maintenance.length
                : item.href === '/locations'
                ? locations.length
                : item.badge;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={closeMobileSidebar}
                className={`w-full flex items-center justify-between px-3 py-2.5 text-xs font-medium rounded transition-colors text-left ${
                  isActive
                    ? 'bg-neutral-900 text-white font-semibold'
                    : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-emerald-400' : 'text-neutral-400'}`} />
                  <span className="truncate whitespace-nowrap">{item.label}</span>
                </div>
                {badgeDisplay !== undefined && (
                  <span
                    className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                      isActive
                        ? 'bg-neutral-800 text-neutral-200'
                        : 'bg-neutral-100 text-neutral-600'
                    }`}
                  >
                    {badgeDisplay}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Network Lab Status Notice */}
        <div className="p-3 border-t border-neutral-100">
          <div className="bg-neutral-50 border border-neutral-200 rounded p-2.5">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-semibold text-neutral-700">Faculty Lab Fleet</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            </div>
            <p className="text-[11px] text-neutral-800 font-semibold">{locations.length} Connected Labs</p>
            <div className="mt-1 text-[10px] text-neutral-500">
              {assets.length} Hardware Assets • {stock.length} Peripheral Items
            </div>
            <div className="mt-2 text-[10px] text-neutral-400 flex items-center justify-between">
              <span>Campus Backbone</span>
              <span className="text-emerald-700 font-medium">All Online</span>
            </div>
          </div>
        </div>

        {/* User Footer */}
        <div className="p-3 border-t border-neutral-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded bg-neutral-900 text-emerald-400 font-bold flex items-center justify-center text-xs shrink-0">
              {user?.avatarText || 'TR'}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-neutral-900 truncate">
                {user?.name || 'Thoeurn Ratha'}
              </p>
              <p className="text-[11px] text-neutral-500 truncate">
                {user?.role || 'Network Lab Admin'}
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              logout();
              showToast('Signed out of Lab');
            }}
            title="Sign out"
            className="p-1.5 text-neutral-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </aside>
    </>
  );
}
