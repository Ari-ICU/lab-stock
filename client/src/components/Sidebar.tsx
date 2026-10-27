'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useStock } from '@/context/StockContext';
import {
  Network,
  LayoutDashboard,
  Cable,
  Router,
  Wrench,
  MapPin,
  Settings,
  LogOut,
  Search,
  Barcode,
  X
} from 'lucide-react';

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string | number;
}

const navItems: NavItem[] = [
  { href: '/', label: 'Overview', icon: LayoutDashboard },
  { href: '/assets', label: 'Lab Hardware (PCs, ACs, Switch)', icon: Router, badge: '5' },
  { href: '/stock', label: 'Inventory (Monitors, Mice, Cables)', icon: Cable, badge: '7' },
  { href: '/maintenance', label: 'Service & Maintenance', icon: Wrench, badge: '3' },
  { href: '/locations', label: 'Lab Locations', icon: MapPin },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const { openScanner, stock, isMobileSidebarOpen, closeMobileSidebar } = useStock();

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
        {/* Brand Header with Network Icon */}
        <div className="h-16 border-b border-neutral-200 px-5 flex items-center justify-between">
          <Link
            href="/"
            onClick={closeMobileSidebar}
            className="flex items-center gap-2.5"
          >
            <div className="w-9 h-9 bg-neutral-900 text-white rounded flex items-center justify-center font-bold">
              <Network className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <div className="font-semibold text-sm tracking-tight text-neutral-900 leading-none">
                NetLab 102B
              </div>
              <span className="text-[11px] text-neutral-500 font-medium">Room 102B Inventory</span>
            </div>
          </Link>

          <div className="flex items-center gap-1.5">
            <span className="text-[10px] uppercase tracking-wider font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded">
              102B
            </span>
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

        {/* Quick Search */}
        <div className="px-3 py-2 border-b border-neutral-100">
          <div className="relative">
            <Search className="w-4 h-4 text-neutral-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search IP, MAC, switch..."
              className="w-full bg-white text-xs text-neutral-900 placeholder:text-neutral-400 pl-8 pr-3 py-1.5 border border-neutral-300 rounded focus:outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 transition-colors"
            />
          </div>
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

            const badgeDisplay = item.href === '/stock' ? stock.length : item.badge;

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
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-400' : 'text-neutral-400'}`} />
                  <span>{item.label}</span>
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
              <span className="text-[11px] font-semibold text-neutral-700">Lab Status</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            </div>
            <p className="text-[11px] text-neutral-700 font-medium">Computer Lab 102B</p>
            <div className="mt-1 text-[10px] text-neutral-500">24 Desktops • Projector • 2 ACs</div>
            <div className="mt-2 text-[10px] text-neutral-400 flex items-center justify-between">
              <span>Gateway 192.168.102.1</span>
              <span className="text-emerald-700 font-medium">Online</span>
            </div>
          </div>
        </div>

        {/* User Footer */}
        <div className="p-3 border-t border-neutral-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded bg-neutral-200 text-neutral-700 font-bold flex items-center justify-center text-xs shrink-0">
              TR
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-neutral-900 truncate">Thoeurn Ratha</p>
              <p className="text-[11px] text-neutral-500 truncate">Network Lab Admin</p>
            </div>
          </div>
          <button
            title="Sign out"
            className="p-1.5 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 rounded transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </aside>
    </>
  );
}
