'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useStock } from '@/context/StockContext';
import { useAuth } from '@/context/AuthContext';
import { getAssetPath } from '@/lib/basePath';
import {
  LayoutDashboard,
  Package,
  Router,
  MapPin,
  Settings,
  LogOut,
  Search,
  X,
  ArrowLeftRight,
  Users
} from 'lucide-react';

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string | number;
}

const navItems: NavItem[] = [
  { href: '/', label: 'Overview', icon: LayoutDashboard },
  { href: '/locations', label: 'Classrooms & Labs', icon: MapPin },
  { href: '/assets', label: 'Hardware Assets', icon: Router },
  { href: '/stock', label: 'Inventory', icon: Package },
  { href: '/loans', label: 'Device Loans', icon: ArrowLeftRight },
  { href: '/users', label: 'Personnel & Roles', icon: Users },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const {
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
  const { user, managedUsers, logout } = useAuth();

  const activeLoansCount = loans ? loans.filter((l) => l.status === 'active').length : 0;
  const uniqueMaintenanceCount = React.useMemo(() => {
    const keys = new Set(
      maintenance.map(
        (m) => `${(m.assetName || '').trim().toLowerCase()}__${(m.serialNumber || '').trim().toLowerCase()}`
      )
    );
    return keys.size;
  }, [maintenance]);

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
        suppressHydrationWarning
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-neutral-200 flex flex-col h-screen select-none shrink-0 transition-transform duration-200 ease-in-out lg:static lg:translate-x-0 print:hidden ${
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
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-[15px] text-neutral-900 tracking-tight leading-tight truncate">
                  CSD Stock
                </span>
                <span className="text-[10px] font-bold font-mono px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200/80 shadow-2xs leading-none shrink-0">
                  v1.0 Beta
                </span>
              </div>
              <span className="text-[11px] text-neutral-500 font-medium truncate block mt-0.5">
                Dept. of Computer Science
              </span>
            </div>
          </Link>

          <button
            onClick={closeMobileSidebar}
            className="lg:hidden p-1 text-neutral-400 hover:text-neutral-900 rounded"
            title="Close menu"
          >
            <X className="w-4 h-4" />
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
            className="w-full bg-white hover:bg-neutral-50 active:bg-neutral-100 text-xs text-neutral-400 pl-8 pr-2 py-1.5 border border-neutral-200 hover:border-neutral-300 rounded-lg focus:outline-none focus:border-neutral-900 transition-all flex items-center justify-between cursor-pointer relative group text-left shadow-2xs"
            title="Global search across assets, stock, rooms, and loans (⌘K)"
          >
            <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-2.5 top-1/2 -translate-y-1/2 group-hover:text-neutral-700 transition-colors" />
            <span className="truncate group-hover:text-neutral-600 transition-colors">Search stock, assets, rooms...</span>
            <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono font-semibold text-neutral-400 bg-neutral-100 border border-neutral-200 rounded shrink-0">
              ⌘K
            </kbd>
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto" suppressHydrationWarning>
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
                : item.href === '/locations'
                ? locations.length
                : item.href === '/users'
                ? managedUsers.length
                : item.badge;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={closeMobileSidebar}
                className={`group relative w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded-lg transition-all text-left border ${
                  isActive
                    ? 'bg-emerald-50 text-emerald-900 font-semibold border-emerald-200/80 shadow-2xs'
                    : 'text-neutral-600 hover:bg-neutral-100/80 hover:text-neutral-900 border-transparent'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Icon
                    className={`w-4 h-4 shrink-0 transition-colors ${
                      isActive ? 'text-emerald-700' : 'text-neutral-400 group-hover:text-neutral-600'
                    }`}
                  />
                  <span className="truncate whitespace-nowrap">{item.label}</span>
                </div>
                {mounted && badgeDisplay !== undefined && (
                  <span
                    suppressHydrationWarning
                    className={`text-[10px] font-semibold px-1.5 py-0.5 rounded transition-colors ${
                      isActive
                        ? 'bg-emerald-100/90 text-emerald-800 border border-emerald-200/70'
                        : 'bg-neutral-100 text-neutral-500 border border-neutral-200/60 group-hover:bg-neutral-200/60 group-hover:text-neutral-700'
                    }`}
                  >
                    {badgeDisplay}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* User Footer */}
        <div className="p-3 border-t border-neutral-200 flex items-center justify-between" suppressHydrationWarning>
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 border border-emerald-200/80 font-bold flex items-center justify-center text-xs shrink-0">
              {mounted ? (user?.avatarText || 'TR') : 'HS'}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-neutral-900 truncate">
                {mounted ? (user?.name || 'Dr. Heng Sovannarith') : 'Dr. Heng Sovannarith'}
              </p>
              <p className="text-[11px] text-neutral-500 truncate">
                {mounted ? (user?.role || 'Primary Lab Administrator') : 'Primary Lab Administrator'}
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

