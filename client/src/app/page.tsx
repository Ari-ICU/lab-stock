'use client';

import React from 'react';
import Link from 'next/link';
import { Header } from '@/components/Header';
import { useStock } from '@/context/StockContext';
import { exportToCsv } from '@/lib/exportCsv';
import { RowActionMenu } from '@/components/RowActionMenu';
import {
  Cable,
  Router,
  AlertTriangle,
  Clock,
  ArrowRight,
  Server,
  QrCode,
  Image as ImageIcon
} from 'lucide-react';

export default function DashboardPage() {
  const {
    stock,
    assets,
    openModal,
    openDetails,
    openEdit,
    deleteStockItem,
    deleteAsset,
    updateStockQuantity,
  } = useStock();
  const lowStockItems = stock.filter((i) => i.status !== 'in_stock');

  return (
    <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
      <Header
        title="Lab 102B - Network & Computer"
        subtitle="24 Desktops • Projector • Daikin ACs • Core Network Infrastructure"
        actionLabel="Add Stock Item"
        onAction={() => openModal('add_stock')}
        onExport={() =>
          exportToCsv(
            'lab102b_dashboard_summary',
            stock.map((i) => ({
              'Item Name': i.name,
              'Part Code': i.code,
              Quantity: i.quantity,
              Unit: i.unit,
              Rack: i.rack,
              Status: i.status,
            }))
          )
        }
      />

      <div className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-6 max-w-8xl w-full mx-auto">
        {/* Metric Cards Focused on Lab 102B Facilities */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white border border-neutral-200 rounded p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-neutral-500">Student Desktops</span>
              <Router className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-bold text-neutral-900 mt-2">24 Units</div>
            <div className="text-[11px] text-emerald-600 mt-1">Dell OptiPlex 7090 • 100% Online</div>
          </div>

          <div className="bg-white border border-neutral-200 rounded p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-neutral-500">Presentation System</span>
              <Server className="w-4 h-4 text-neutral-500" />
            </div>
            <div className="text-2xl font-bold text-neutral-900 mt-2">1 Projector</div>
            <div className="text-[11px] text-neutral-500 mt-1">Epson 4K Laser (Ceiling Mount)</div>
          </div>

          <div className="bg-white border border-neutral-200 rounded p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-neutral-500">Climate Cooling</span>
              <AlertTriangle className="w-4 h-4 text-blue-500" />
            </div>
            <div className="text-2xl font-bold text-neutral-900 mt-2">2 Daikin ACs</div>
            <div className="text-[11px] text-blue-600 mt-1">21.8°C Target Ambient Temp</div>
          </div>

          <div className="bg-white border border-neutral-200 rounded p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-neutral-500">Spares & Cables</span>
              <Cable className="w-4 h-4 text-neutral-400" />
            </div>
            <div className="text-2xl font-bold text-neutral-900 mt-2">{stock.length} SKUs</div>
            <div className="text-[11px] text-neutral-500 mt-1">Patch cords, remotes & HDMI</div>
          </div>
        </section>

        {/* 2-Column Split: Stock Alerts & Equipment Status */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Stock Alerts Card */}
          <section className="bg-white border border-neutral-200 rounded">
            <div className="p-4 border-b border-neutral-200 flex items-center justify-between">
              <div>
                <h2 className="text-xs font-bold text-neutral-900 uppercase tracking-wider">
                  Low Stock Spares & Cables
                </h2>
                <p className="text-[11px] text-neutral-500">Items that need replenishment</p>
              </div>
              <Link
                href="/stock"
                className="text-xs font-medium text-neutral-600 hover:text-neutral-900 flex items-center gap-1"
              >
                <span>View all</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            <div className="divide-y divide-neutral-100">
              {lowStockItems.map((item) => (
                <div key={item.id} className="p-3.5 sm:p-4 flex items-center justify-between gap-3 hover:bg-neutral-50/70 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
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
                    <div className="min-w-0">
                      <button
                        onClick={() => openDetails(item)}
                        className="text-xs font-semibold text-neutral-900 hover:text-emerald-700 text-left truncate block cursor-pointer transition-colors max-w-[200px] sm:max-w-xs"
                      >
                        {item.name}
                      </button>
                      <div className="text-[11px] text-neutral-400 font-mono mt-0.5 truncate">
                        {item.code} • {item.rack}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={`inline-flex px-2 py-0.5 rounded text-[11px] font-medium ${
                        item.status === 'low_stock'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}
                    >
                      {item.quantity} {item.unit}
                    </span>

                    <RowActionMenu
                      onViewDetails={() => openDetails(item)}
                      onEdit={() => openEdit(item)}
                      onDelete={() => deleteStockItem(item.id)}
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Network Devices Card */}
          <section className="bg-white border border-neutral-200 rounded">
            <div className="p-4 border-b border-neutral-200 flex items-center justify-between">
              <div>
                <h2 className="text-xs font-bold text-neutral-900 uppercase tracking-wider">
                  Active Network Devices
                </h2>
                <p className="text-[11px] text-neutral-500">Switches, routers & firewalls</p>
              </div>
              <Link
                href="/assets"
                className="text-xs font-medium text-neutral-600 hover:text-neutral-900 flex items-center gap-1"
              >
                <span>View all</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            <div className="divide-y divide-neutral-100">
              {assets.map((asset) => (
                <div key={asset.id} className="p-3.5 sm:p-4 flex items-center justify-between gap-3 hover:bg-neutral-50/70 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      onClick={() => openDetails(asset)}
                      className="w-10 h-10 rounded border border-neutral-200 bg-neutral-100 overflow-hidden flex items-center justify-center shrink-0 cursor-pointer hover:border-neutral-400 transition-colors"
                      title="Click to view details"
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
                    </div>
                    <div className="min-w-0">
                      <button
                        onClick={() => openDetails(asset)}
                        className="text-xs font-semibold text-neutral-900 hover:text-emerald-700 text-left truncate block cursor-pointer transition-colors max-w-[200px] sm:max-w-xs"
                      >
                        {asset.name}
                      </button>
                      <div className="text-[11px] text-neutral-400 font-mono mt-0.5 truncate">
                        SN: {asset.serialNumber} • {asset.location}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={`inline-flex px-2 py-0.5 rounded text-[11px] font-medium hidden sm:inline-flex ${
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
                        : 'Audit / RMA'}
                    </span>

                    <RowActionMenu
                      onViewDetails={() => openDetails(asset)}
                      onEdit={() => openEdit(asset)}
                      onDelete={() => deleteAsset(asset.id)}
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
