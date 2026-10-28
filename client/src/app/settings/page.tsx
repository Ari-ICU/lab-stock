'use client';

import React from 'react';
import { Header } from '@/components/Header';
import { useStock } from '@/context/StockContext';
import { useAuth } from '@/context/AuthContext';
import { Shield, Bell, Server } from 'lucide-react';

export default function SettingsPage() {
  const { showToast } = useStock();
  const { user } = useAuth();

  return (
    <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
      <Header
        title="Settings & Configuration"
        subtitle="Laboratory Preferences"
        showExport={false}
        actionLabel="Save Changes"
        onAction={() => showToast('Configuration changes saved successfully')}
      />

      <div className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-6 max-w-4xl">
        {/* Backend & API Connection */}
        <section className="bg-white border border-neutral-200 rounded p-6 space-y-4">
          <div className="flex items-center gap-2.5">
            <Server className="w-4 h-4 text-neutral-800" />
            <h2 className="text-sm font-bold text-neutral-900">Backend API Configuration</h2>
          </div>
          <p className="text-xs text-neutral-500">
            Configure the proxy address connecting to your LabStock server.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-xs font-semibold text-neutral-800 mb-1.5">
                API Base URL
              </label>
              <input
                type="text"
                defaultValue="http://localhost:5001/api/v1"
                className="w-full bg-white border border-neutral-300 text-neutral-900 font-medium text-xs px-3.5 py-2.5 rounded focus:outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 font-mono transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-800 mb-1.5">
                Environment
              </label>
              <input
                type="text"
                disabled
                value="Development (Local Lab Instance)"
                className="w-full bg-neutral-100 border border-neutral-300 text-neutral-700 font-medium text-xs px-3.5 py-2.5 rounded cursor-not-allowed"
              />
            </div>
          </div>
        </section>

        {/* Inventory Alert Rules */}
        <section className="bg-white border border-neutral-200 rounded p-6 space-y-4">
          <div className="flex items-center gap-2.5">
            <Bell className="w-4 h-4 text-neutral-800" />
            <h2 className="text-sm font-bold text-neutral-900">Stock & Maintenance Alerts</h2>
          </div>
          <p className="text-xs text-neutral-500">
            Set default threshold parameters for low-stock warnings and instrument service due dates.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-xs font-semibold text-neutral-800 mb-1.5">
                Default Low Stock Reorder Threshold
              </label>
              <input
                type="number"
                defaultValue={10}
                className="w-full bg-white border border-neutral-300 text-neutral-900 font-medium text-xs px-3.5 py-2.5 rounded focus:outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-800 mb-1.5">
                Calibration Due Notice (Days Ahead)
              </label>
              <input
                type="number"
                defaultValue={14}
                className="w-full bg-white border border-neutral-300 text-neutral-900 font-medium text-xs px-3.5 py-2.5 rounded focus:outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 transition-colors"
              />
            </div>
          </div>
        </section>

        {/* Profile & Lab Admin */}
        <section className="bg-white border border-neutral-200 rounded p-6 space-y-4">
          <div className="flex items-center gap-2.5">
            <Shield className="w-4 h-4 text-neutral-800" />
            <h2 className="text-sm font-bold text-neutral-900">Active Laboratory Operator</h2>
          </div>

          <div className="flex items-center gap-4 pt-2">
            <div className="w-11 h-11 rounded bg-neutral-900 text-emerald-400 font-bold flex items-center justify-center text-xs">
              {user?.avatarText || 'TR'}
            </div>
            <div>
              <div className="text-xs font-bold text-neutral-900">{user?.name || 'Thoeurn Ratha'}</div>
              <div className="text-[11px] text-neutral-500 mt-0.5">Role: {user?.role || 'Primary Lab Administrator'}</div>
              <div className="text-[11px] text-emerald-700 font-semibold mt-0.5">Permissions: {user?.permissions || 'Full Read/Write Access'}</div>
              <div className="text-[10px] text-neutral-400 mt-0.5">Workstation: {user?.department || 'Engineering Block A - Room 102B'}</div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
