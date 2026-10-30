'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Header } from '@/components/Header';
import { Dropdown } from '@/components/Dropdown';
import { usePersistentTab } from '@/hooks/usePersistentTab';
import { systemService } from '@/services';
import { useStock } from '@/context/StockContext';
import {
  useAuth,
  SessionDevice,
} from '@/context/AuthContext';
import {
  Shield,
  Bell,
  Server,
  Laptop,
  Monitor,
  Tablet,
  Smartphone,
  Terminal,
  RefreshCw,
  LogOut,
  CheckCircle2,
  AlertCircle,
  Sliders,
  UserCheck,
  Radio,
  Lock,
  ExternalLink,
  Database,
  Save,
  Activity,
  FileJson,
  RotateCcw,
  Users,
} from 'lucide-react';

export default function SettingsPage() {
  const {
    showToast,
    assets,
    stock,
    maintenance,
    locations,
    loans,
    transfers,
  } = useStock();
  const {
    user,
    sessionDevices,
    refreshSessionDevices,
    revokeSession,
    revokeAllOtherSessions,
  } = useAuth();

  type SettingsTab = 'sessions' | 'system' | 'profile';
  const VALID_TABS: SettingsTab[] = ['sessions', 'system', 'profile'];

  const [activeTab, handleTabChange] = usePersistentTab<SettingsTab>(
    'csd_settings_active_tab',
    VALID_TABS,
    'sessions'
  );

  const [telemetry, setTelemetry] = useState<{
    host: string;
    protocol: string;
    isOnline: boolean;
    timezone: string;
    screen: string;
  }>({
    host: 'localhost:3000',
    protocol: 'HTTP',
    isOnline: true,
    timezone: 'Asia/Phnom_Penh',
    screen: '1920 × 1080',
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const port = window.location.port ? `:${window.location.port}` : '';
      setTelemetry({
        host: `${window.location.hostname}${port}`,
        protocol: window.location.protocol.replace(':', '').toUpperCase(),
        isOnline: navigator.onLine,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Phnom_Penh',
        screen: `${window.screen.width} × ${window.screen.height} (${window.devicePixelRatio || 1}x)`,
      });
    }
  }, []);

  // System & API Configuration State
  const [apiBaseUrl, setApiBaseUrl] = useState(
    process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api/v1'
  );
  const [apiEnvironment, setApiEnvironment] = useState('Development (Local Faculty Fleet)');
  const [apiStatus, setApiStatus] = useState<'idle' | 'testing' | 'connected' | 'error'>('idle');
  const [apiLatency, setApiLatency] = useState<number | null>(null);

  // Stock & Maintenance Alert Rules State
  const [lowStockThreshold, setLowStockThreshold] = useState(10);
  const [calibrationDaysAhead, setCalibrationDaysAhead] = useState(14);
  const [enableLowStockRibbon, setEnableLowStockRibbon] = useState(true);
  const [enableLoanReminders, setEnableLoanReminders] = useState(true);
  const [enableAudioBeep, setEnableAudioBeep] = useState(true);
  const [enableDailyDigest, setEnableDailyDigest] = useState(false);

  useEffect(() => {
    try {
      const savedApi = localStorage.getItem('csd_api_config');
      if (savedApi) {
        const p = JSON.parse(savedApi);
        if (p.url) setApiBaseUrl(p.url);
        if (p.env) setApiEnvironment(p.env);
      }
      const savedAlerts = localStorage.getItem('csd_alert_rules');
      if (savedAlerts) {
        const a = JSON.parse(savedAlerts);
        if (a.threshold !== undefined) setLowStockThreshold(a.threshold);
        if (a.days !== undefined) setCalibrationDaysAhead(a.days);
        if (a.ribbon !== undefined) setEnableLowStockRibbon(a.ribbon);
        if (a.loans !== undefined) setEnableLoanReminders(a.loans);
        if (a.audio !== undefined) setEnableAudioBeep(a.audio);
        if (a.digest !== undefined) setEnableDailyDigest(a.digest);
      }
    } catch {
      // ignore
    }
  }, []);

  const [apiErrorMessage, setApiErrorMessage] = useState<string | null>(null);

  const handleTestApi = async () => {
    setApiStatus('testing');
    setApiErrorMessage(null);
    try {
      const result = await systemService.testConnection(apiBaseUrl);

      if (result.ok) {
        setApiLatency(result.latencyMs);
        setApiStatus('connected');
        showToast(`Gateway ping healthy: ${result.latencyMs}ms RTT (${result.message})`, 'success');
      } else {
        setApiStatus('error');
        setApiErrorMessage(result.message);
        showToast(`Gateway connection error: ${result.message}`, 'error');
      }
    } catch (err: any) {
      setApiStatus('error');
      const errorMsg = err.message || 'Failed to reach API gateway';
      setApiErrorMessage(errorMsg);
      showToast(`Gateway connection error: ${errorMsg}`, 'error');
    }
  };

  const isAdmin = user?.roleBadge === 'Admin' || user?.role === 'Primary Lab Administrator';

  const handleSaveApi = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) {
      showToast('Permission denied: Only Primary Administrators can modify backend API endpoints.', 'error');
      return;
    }
    try {
      localStorage.setItem('csd_api_config', JSON.stringify({ url: apiBaseUrl, env: apiEnvironment }));
      showToast('Backend API configuration saved successfully', 'success');
    } catch {
      showToast('Failed to save API configuration', 'error');
    }
  };

  const handleSaveAlerts = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) {
      showToast('Permission denied: Only Primary Administrators can modify alert threshold rules.', 'error');
      return;
    }
    try {
      localStorage.setItem(
        'csd_alert_rules',
        JSON.stringify({
          threshold: Number(lowStockThreshold),
          days: Number(calibrationDaysAhead),
          ribbon: enableLowStockRibbon,
          loans: enableLoanReminders,
          audio: enableAudioBeep,
          digest: enableDailyDigest,
        })
      );
      showToast('Stock and maintenance alert rules updated', 'success');
    } catch {
      showToast('Failed to save alert parameters', 'error');
    }
  };

  const handleResetAlerts = () => {
    if (!isAdmin) {
      showToast('Permission denied: Only Primary Administrators can reset alert parameters.', 'error');
      return;
    }
    setLowStockThreshold(10);
    setCalibrationDaysAhead(14);
    setEnableLowStockRibbon(true);
    setEnableLoanReminders(true);
    setEnableAudioBeep(true);
    setEnableDailyDigest(false);
    showToast('Alert parameters reset to university standards', 'info');
  };

  const handleExportSystemBackup = () => {
    const backupData = {
      system: 'CSD Stock - Faculty Laboratory Fleet',
      version: '2.4',
      exportTimestamp: new Date().toISOString(),
      counts: {
        hardwareAssets: assets.length,
        inventoryStock: stock.length,
        maintenanceLogs: maintenance.length,
        connectedLabs: locations.length,
        deviceLoans: loans.length,
        relocations: transfers.length,
      },
      data: {
        assets,
        stock,
        maintenance,
        locations,
        loans,
        transfers,
      },
    };

    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `csd_stock_system_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast('Complete system backup JSON downloaded', 'success');
  };

  const handleRefreshDevices = () => {
    refreshSessionDevices();
    showToast('Session devices updated with current terminal status', 'success');
  };

  const handleRevokeSession = (device: SessionDevice) => {
    revokeSession(device.id);
    showToast(`Revoked access for ${device.deviceName}`, 'info');
  };

  const handleRevokeAllOthers = () => {
    revokeAllOtherSessions();
    showToast('All other session devices have been logged out', 'info');
  };

  const renderDeviceIcon = (type: SessionDevice['deviceType']) => {
    switch (type) {
      case 'terminal':
        return <Terminal className="w-5 h-5 text-emerald-600" />;
      case 'tablet':
        return <Tablet className="w-5 h-5 text-indigo-600" />;
      case 'mobile':
        return <Smartphone className="w-5 h-5 text-amber-600" />;
      case 'laptop':
        return <Laptop className="w-5 h-5 text-blue-600" />;
      case 'desktop':
      default:
        return <Monitor className="w-5 h-5 text-slate-700" />;
    }
  };

  const getRoleBadgeStyle = (badge: string) => {
    switch (badge) {
      case 'Admin':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Lecturer':
      case 'Lecture':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Lab Assistant':
      case 'Lab Ass':
      default:
        return 'bg-amber-50 text-amber-700 border-amber-200';
    }
  };

  return (
    <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-neutral-50/50">
      <Header
        title="Settings & System Configuration"
        subtitle="Manage Active Session Devices, Network Proxy Gateways, and System Preferences"
        showExport={false}
        showAction={false}
      />

      <div className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-6 max-w-8xl w-full mx-auto">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-white border border-neutral-200 rounded-lg shadow-xs overflow-x-auto">
          <button
            type="button"
            onClick={() => handleTabChange('sessions')}
            className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-md transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'sessions'
                ? 'bg-neutral-900 text-white shadow-xs'
                : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            <span>Session Devices</span>
            <span
              suppressHydrationWarning
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                activeTab === 'sessions'
                  ? 'bg-neutral-800 text-neutral-200'
                  : 'bg-neutral-100 text-neutral-600'
              }`}
            >
              {sessionDevices.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleTabChange('system')}
            className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-md transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'system'
                ? 'bg-neutral-900 text-white shadow-xs'
                : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>System & Alerts</span>
          </button>

          <button
            type="button"
            onClick={() => handleTabChange('profile')}
            className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-md transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'profile'
                ? 'bg-neutral-900 text-white shadow-xs'
                : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>Active Operator</span>
          </button>
        </div>

        {/* Quick Link Card to Dedicated User Roles Page */}
        <div className="bg-gradient-to-r from-blue-50/70 to-indigo-50/70 border border-blue-200/80 rounded-lg p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-md bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-neutral-900">
                Looking for User & Role Management?
              </div>
              <p className="text-[11px] text-neutral-500">
                User roles, supervisory allocation, and laboratory assignments are now managed directly from the sidebar.
              </p>
            </div>
          </div>
          <Link
            href="/users"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-700 hover:text-blue-900 bg-white border border-blue-300 hover:bg-blue-50 px-3 py-1.5 rounded transition-colors shadow-2xs shrink-0 cursor-pointer"
          >
            <span>Open User Roles</span>
            <ExternalLink className="w-3 h-3" />
          </Link>
        </div>

        {/* ================= TAB 1: SESSION DEVICES ================= */}
        {activeTab === 'sessions' && (
          <div className="space-y-6">
            <div className="bg-white border border-neutral-200 rounded-lg p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded">
                    Active Sessions
                  </span>
                  <span className="text-xs text-neutral-400">Terminal Authentication</span>
                </div>
                <h2 className="text-base font-bold text-neutral-900">
                  Authorized Session Terminals
                </h2>
                <p className="text-xs text-neutral-500 mt-1 max-w-xl">
                  Real-time terminals and workstations currently authenticated to your laboratory stock account. Revoke access immediately if an unrecognized device is detected.
                </p>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={handleRefreshDevices}
                  className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-neutral-700 bg-white border border-neutral-200 hover:bg-neutral-50 rounded transition-colors cursor-pointer shadow-2xs"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-neutral-500" />
                  <span>Refresh Sessions</span>
                </button>
                {sessionDevices.length > 1 && (
                  <button
                    type="button"
                    onClick={handleRevokeAllOthers}
                    className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded transition-colors cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5 text-rose-600" />
                    <span>Revoke Other Devices</span>
                  </button>
                )}
              </div>
            </div>

            {/* Session Devices List */}
            <div className="bg-white border border-neutral-200 rounded-lg shadow-xs">
              <div className="px-5 py-3.5 border-b border-neutral-200 bg-neutral-50/70 rounded-t-lg flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Radio className="w-4 h-4 text-neutral-700" />
                  <span suppressHydrationWarning className="text-xs font-bold text-neutral-900">
                    Live Connections ({sessionDevices.length})
                  </span>
                </div>
                <span className="text-[11px] text-neutral-500 font-mono">
                  Current Session: {telemetry.host} ({telemetry.protocol})
                </span>
              </div>

              <div className="divide-y divide-neutral-200">
                {sessionDevices.map((device) => (
                  <div
                    key={device.id}
                    className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-neutral-50/60 transition-colors"
                  >
                    {/* Device Details */}
                    <div className="flex items-start gap-3.5 min-w-0">
                      <div
                        className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 border ${
                          device.isCurrent
                            ? 'bg-emerald-50 border-emerald-200'
                            : 'bg-neutral-100 border-neutral-200'
                        }`}
                      >
                        {renderDeviceIcon(device.deviceType)}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-bold text-neutral-900">
                            {device.deviceName}
                          </span>

                          {device.isCurrent ? (
                            <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-emerald-800 bg-emerald-100/70 border border-emerald-300 px-2 py-0.5 rounded-full">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                              <span>Current Device (This Session)</span>
                            </span>
                          ) : (
                            <span className="text-[10px] font-medium text-neutral-500 bg-neutral-100 border border-neutral-200 px-1.5 py-0.2 rounded">
                              Authorized
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-3 text-[11px] text-neutral-500 mt-1 flex-wrap font-mono">
                          <span>IP: {device.ip}</span>
                          <span>•</span>
                          <span>{device.os}</span>
                          <span>•</span>
                          <span>{device.browser}</span>
                        </div>

                        <div className="text-[10px] text-neutral-400 mt-1">
                          Location: <span className="text-neutral-600 font-medium">{device.location}</span> • Activity: {device.lastActive}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 w-full sm:w-auto justify-end shrink-0">
                      {device.isCurrent ? (
                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Active Terminal</span>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleRevokeSession(device)}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-rose-700 bg-white hover:bg-rose-50 border border-neutral-200 hover:border-rose-200 rounded transition-colors cursor-pointer"
                        >
                          <LogOut className="w-3.5 h-3.5 text-rose-500" />
                          <span>Revoke Access</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 2: SYSTEM PREFERENCES & API ================= */}
        {activeTab === 'system' && (
          <div className="space-y-6">
            {/* System Status Summary Ribbon */}
            <div className="bg-white border border-neutral-200 rounded-lg p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded">
                    Operational Engine
                  </span>
                  <span className="text-xs text-neutral-400">CSD Stock System v2.4</span>
                </div>
                <h2 className="text-base font-bold text-neutral-900">
                  System Preferences & Telemetry
                </h2>
                <p className="text-xs text-neutral-500 mt-1 max-w-xl">
                  Configure backend API communication, manage automated inventory reorder thresholds, and generate full fleet database diagnostic snapshots.
                </p>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={handleExportSystemBackup}
                  className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-neutral-800 bg-white border border-neutral-200 hover:bg-neutral-50 rounded transition-colors cursor-pointer shadow-2xs"
                  title="Download complete JSON snapshot of all inventory and assets"
                >
                  <FileJson className="w-3.5 h-3.5 text-neutral-600" />
                  <span>Export Backup (JSON)</span>
                </button>
              </div>
            </div>

            {/* Non-Admin Restriction Alert Banner for System & Alerts */}
            {!isAdmin && (
              <div className="p-3.5 bg-amber-50/90 border border-amber-200 rounded-lg flex items-start gap-3 shadow-2xs">
                <Shield className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <div className="text-xs text-amber-900 leading-relaxed">
                  <span className="font-bold">Read-Only System & Alert Configuration:</span> You are currently signed in as <span className="font-semibold text-neutral-900">{user?.name} ({user?.role})</span>. Modifying API gateway communication endpoints, deployment environment profiles, and fleet-wide alert thresholds is restricted exclusively to Primary Lab Administrators.
                </div>
              </div>
            )}

            {/* Backend API & Gateway Configuration */}
            <section className="bg-white border border-neutral-200 rounded-lg p-6 space-y-4 shadow-xs">
              <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <Server className="w-4 h-4 text-neutral-800" />
                  <h2 className="text-sm font-bold text-neutral-900">
                    Backend API & Faculty Gateway Daemon
                  </h2>
                </div>
                <div className="flex items-center gap-2">
                  {!isAdmin && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-neutral-100 text-neutral-600 border border-neutral-200 px-2 py-0.5 rounded">
                      <Lock className="w-2.5 h-2.5 opacity-60" />
                      <span>Read-Only</span>
                    </span>
                  )}
                  <span className="text-[10px] font-mono uppercase bg-neutral-100 text-neutral-700 px-2 py-0.5 rounded border border-neutral-200 font-bold">
                    REST v1 / WebSocket
                  </span>
                </div>
              </div>
              <p className="text-xs text-neutral-500">
                Configure network proxy endpoints connecting to your department laboratory telemetry daemon.
              </p>

              <form onSubmit={handleSaveApi} className="space-y-4 pt-1">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-neutral-800 mb-1.5">
                      API Gateway Endpoint URL
                    </label>
                    <input
                      type="text"
                      disabled={!isAdmin}
                      readOnly={!isAdmin}
                      value={apiBaseUrl}
                      onChange={(e) => setApiBaseUrl(e.target.value)}
                      placeholder="http://localhost:5001/api/v1"
                      className={`w-full border text-xs px-3.5 py-2.5 rounded font-mono transition-colors ${
                        !isAdmin
                          ? 'bg-neutral-100/80 border-neutral-200 text-neutral-500 cursor-not-allowed select-none'
                          : 'bg-white border-neutral-300 text-neutral-900 font-medium focus:outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900'
                      }`}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-neutral-800 mb-1.5">
                      Deployment Environment Profile
                    </label>
                    <Dropdown
                      disabled={!isAdmin}
                      value={apiEnvironment}
                      options={[
                        { label: 'Development (Local Faculty Fleet)', value: 'Development (Local Faculty Fleet)' },
                        { label: 'Campus Intranet (RUPP STEM Network)', value: 'Campus Intranet (RUPP STEM Network)' },
                        { label: 'Production Cloud (GitHub Pages / Standalone)', value: 'Production Cloud (GitHub Pages / Standalone)' },
                      ]}
                      onChange={(val) => setApiEnvironment(val)}
                      buttonClassName={`w-full text-xs px-3.5 py-2.5 rounded transition-colors ${
                        !isAdmin
                          ? 'bg-neutral-100/80 border-neutral-200 text-neutral-500 cursor-not-allowed select-none'
                          : 'bg-white border-neutral-300 text-neutral-900 font-medium hover:border-neutral-400 focus:outline-none focus:border-neutral-900 cursor-pointer'
                      }`}
                    />
                  </div>
                </div>

                {/* Gateway Diagnostic Health Readout */}
                <div className="p-3 bg-neutral-50 border border-neutral-200 rounded flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-neutral-700">Gateway Status:</span>
                    {apiStatus === 'connected' ? (
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-300">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span>Connected • {apiLatency}ms Latency</span>
                      </span>
                    ) : apiStatus === 'testing' ? (
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium bg-blue-50 text-blue-700 border border-blue-200">
                        <RefreshCw className="w-3 h-3 animate-spin" />
                        <span>Testing Gateway Response...</span>
                      </span>
                    ) : apiStatus === 'error' ? (
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium bg-rose-50 text-rose-700 border border-rose-200">
                        <AlertCircle className="w-3 h-3" />
                        <span>{apiErrorMessage || 'Connection Error'}</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-neutral-100 text-neutral-600 border border-neutral-200">
                        <span>Client Standalone Mode</span>
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleTestApi}
                      disabled={apiStatus === 'testing'}
                      className="px-3 py-1.5 rounded text-xs font-semibold bg-white border border-neutral-300 hover:bg-neutral-100 text-neutral-800 transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <Activity className="w-3.5 h-3.5 text-blue-600" />
                      <span>Test Connection</span>
                    </button>

                    {isAdmin ? (
                      <button
                        type="submit"
                        className="px-3.5 py-1.5 rounded text-xs font-semibold bg-neutral-900 hover:bg-neutral-800 text-white transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                      >
                        <Save className="w-3.5 h-3.5 text-neutral-300" />
                        <span>Save Config</span>
                      </button>
                    ) : (
                      <div
                        className="px-3 py-1.5 rounded text-xs font-semibold bg-neutral-100 text-neutral-500 border border-neutral-200 flex items-center gap-1.5 cursor-not-allowed"
                        title="Administrator privileges required to modify API endpoints"
                      >
                        <Lock className="w-3 h-3 opacity-60" />
                        <span>Read-Only API</span>
                      </div>
                    )}
                  </div>
                </div>
              </form>
            </section>

            {/* Inventory Alert Rules & Automated Thresholds */}
            <section className="bg-white border border-neutral-200 rounded-lg p-6 space-y-4 shadow-xs">
              <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <Bell className="w-4 h-4 text-neutral-800" />
                  <h2 className="text-sm font-bold text-neutral-900">
                    Stock & Maintenance Threshold Alerts
                  </h2>
                </div>
                <div className="flex items-center gap-2">
                  {!isAdmin && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-neutral-100 text-neutral-600 border border-neutral-200 px-2 py-0.5 rounded">
                      <Lock className="w-2.5 h-2.5 opacity-60" />
                      <span>Read-Only</span>
                    </span>
                  )}
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded">
                    Active Monitoring
                  </span>
                </div>
              </div>
              <p className="text-xs text-neutral-500">
                Set threshold parameters for low-stock warnings, reorder suggestions, and scheduled instrument servicing notices.
              </p>

              <form onSubmit={handleSaveAlerts} className="space-y-5 pt-1">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-neutral-50/70 border border-neutral-200 rounded-lg space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-neutral-900">
                        Default Low Stock Threshold
                      </label>
                      <span className="font-mono text-xs font-bold bg-neutral-900 text-white px-2 py-0.5 rounded">
                        {lowStockThreshold} Units
                      </span>
                    </div>
                    <p className="text-[11px] text-neutral-500">
                      When consumable items drop to or below this count, a warning pill is triggered across the inventory table.
                    </p>
                    <input
                      type="number"
                      min={1}
                      max={100}
                      disabled={!isAdmin}
                      readOnly={!isAdmin}
                      value={lowStockThreshold}
                      onChange={(e) => setLowStockThreshold(Number(e.target.value))}
                      className={`w-full border text-xs px-3.5 py-2 rounded font-mono transition-colors ${
                        !isAdmin
                          ? 'bg-neutral-100/80 border-neutral-200 text-neutral-500 cursor-not-allowed select-none'
                          : 'bg-white border-neutral-300 text-neutral-900 font-semibold focus:outline-none focus:border-neutral-900'
                      }`}
                    />
                  </div>

                  <div className="p-4 bg-neutral-50/70 border border-neutral-200 rounded-lg space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-neutral-900">
                        Calibration Due Notice Window
                      </label>
                      <span className="font-mono text-xs font-bold bg-neutral-900 text-white px-2 py-0.5 rounded">
                        {calibrationDaysAhead} Days
                      </span>
                    </div>
                    <p className="text-[11px] text-neutral-500">
                      Equipment scheduled for calibration or firmware servicing within this window will be flagged as pending.
                    </p>
                    <input
                      type="number"
                      min={1}
                      max={90}
                      disabled={!isAdmin}
                      readOnly={!isAdmin}
                      value={calibrationDaysAhead}
                      onChange={(e) => setCalibrationDaysAhead(Number(e.target.value))}
                      className={`w-full border text-xs px-3.5 py-2 rounded font-mono transition-colors ${
                        !isAdmin
                          ? 'bg-neutral-100/80 border-neutral-200 text-neutral-500 cursor-not-allowed select-none'
                          : 'bg-white border-neutral-300 text-neutral-900 font-semibold focus:outline-none focus:border-neutral-900'
                      }`}
                    />
                  </div>
                </div>

                {/* Automated Alert Policies */}
                <div className="space-y-3 pt-1">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-900">
                    Automated Alert Policies
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <label
                      className={`p-3 rounded-lg border bg-white flex items-start gap-3 transition-colors ${
                        !isAdmin
                          ? 'border-neutral-200 opacity-75 cursor-not-allowed'
                          : 'border-neutral-200 hover:border-neutral-300 cursor-pointer'
                      }`}
                    >
                      <input
                        type="checkbox"
                        disabled={!isAdmin}
                        checked={enableLowStockRibbon}
                        onChange={(e) => setEnableLowStockRibbon(e.target.checked)}
                        className={`mt-0.5 rounded border-neutral-300 text-neutral-900 focus:ring-0 ${
                          !isAdmin ? 'cursor-not-allowed' : 'cursor-pointer'
                        }`}
                      />
                      <div>
                        <div className="font-semibold text-neutral-900">Low Stock Warning Badges</div>
                        <div className="text-[11px] text-neutral-500">Display prominent amber warning pills on consumable items.</div>
                      </div>
                    </label>

                    <label
                      className={`p-3 rounded-lg border bg-white flex items-start gap-3 transition-colors ${
                        !isAdmin
                          ? 'border-neutral-200 opacity-75 cursor-not-allowed'
                          : 'border-neutral-200 hover:border-neutral-300 cursor-pointer'
                      }`}
                    >
                      <input
                        type="checkbox"
                        disabled={!isAdmin}
                        checked={enableLoanReminders}
                        onChange={(e) => setEnableLoanReminders(e.target.checked)}
                        className={`mt-0.5 rounded border-neutral-300 text-neutral-900 focus:ring-0 ${
                          !isAdmin ? 'cursor-not-allowed' : 'cursor-pointer'
                        }`}
                      />
                      <div>
                        <div className="font-semibold text-neutral-900">Overdue Device Loan Alerts</div>
                        <div className="text-[11px] text-neutral-500">Flag checked-out devices immediately upon passing expected return date.</div>
                      </div>
                    </label>

                    <label
                      className={`p-3 rounded-lg border bg-white flex items-start gap-3 transition-colors ${
                        !isAdmin
                          ? 'border-neutral-200 opacity-75 cursor-not-allowed'
                          : 'border-neutral-200 hover:border-neutral-300 cursor-pointer'
                      }`}
                    >
                      <input
                        type="checkbox"
                        disabled={!isAdmin}
                        checked={enableAudioBeep}
                        onChange={(e) => setEnableAudioBeep(e.target.checked)}
                        className={`mt-0.5 rounded border-neutral-300 text-neutral-900 focus:ring-0 ${
                          !isAdmin ? 'cursor-not-allowed' : 'cursor-pointer'
                        }`}
                      />
                      <div>
                        <div className="font-semibold text-neutral-900">Scanner Audio Feedback Tone</div>
                        <div className="text-[11px] text-neutral-500">Provide audio confirmation chime upon successful barcode/QR code scan.</div>
                      </div>
                    </label>

                    <label
                      className={`p-3 rounded-lg border bg-white flex items-start gap-3 transition-colors ${
                        !isAdmin
                          ? 'border-neutral-200 opacity-75 cursor-not-allowed'
                          : 'border-neutral-200 hover:border-neutral-300 cursor-pointer'
                      }`}
                    >
                      <input
                        type="checkbox"
                        disabled={!isAdmin}
                        checked={enableDailyDigest}
                        onChange={(e) => setEnableDailyDigest(e.target.checked)}
                        className={`mt-0.5 rounded border-neutral-300 text-neutral-900 focus:ring-0 ${
                          !isAdmin ? 'cursor-not-allowed' : 'cursor-pointer'
                        }`}
                      />
                      <div>
                        <div className="font-semibold text-neutral-900">Automated Daily Fleet Digest</div>
                        <div className="text-[11px] text-neutral-500">Compile audit records and stock movement summaries into notifications.</div>
                      </div>
                    </label>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-100">
                  {isAdmin && (
                    <button
                      type="button"
                      onClick={handleResetAlerts}
                      className="px-3 py-1.5 rounded text-xs font-medium text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Reset Defaults</span>
                    </button>
                  )}

                  {isAdmin ? (
                    <button
                      type="submit"
                      className="px-4 py-1.5 rounded text-xs font-semibold bg-neutral-900 hover:bg-neutral-800 text-white transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <Save className="w-3.5 h-3.5 text-neutral-300" />
                      <span>Save Alert Rules</span>
                    </button>
                  ) : (
                    <div
                      className="px-3.5 py-1.5 rounded text-xs font-semibold bg-neutral-100 text-neutral-500 border border-neutral-200 flex items-center gap-1.5 cursor-not-allowed"
                      title="Administrator privileges required to modify alert threshold policies"
                    >
                      <Lock className="w-3.5 h-3.5 opacity-60" />
                      <span>Alert Rules Locked (Read-Only)</span>
                    </div>
                  )}
                </div>
              </form>
            </section>

            {/* Database Engine & System Diagnostics */}
            <section className="bg-white border border-neutral-200 rounded-lg p-6 space-y-4 shadow-xs">
              <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <Database className="w-4 h-4 text-neutral-800" />
                  <h2 className="text-sm font-bold text-neutral-900">
                    System Cache & Fleet Storage Engine
                  </h2>
                </div>
                <span className="text-[11px] font-mono text-neutral-500">
                  Engine: Client Storage Cache
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3.5 rounded-lg bg-neutral-50 border border-neutral-200 space-y-1">
                  <span className="text-[10px] font-bold uppercase text-neutral-400">Total Hardware Devices</span>
                  <div className="text-lg font-black font-mono text-neutral-900">{assets.length} Units</div>
                  <div className="text-[10px] text-neutral-500">6 Connected Classrooms</div>
                </div>

                <div className="p-3.5 rounded-lg bg-neutral-50 border border-neutral-200 space-y-1">
                  <span className="text-[10px] font-bold uppercase text-neutral-400">Consumables & SKUs</span>
                  <div className="text-lg font-black font-mono text-neutral-900">{stock.length} Catalog Items</div>
                  <div className="text-[10px] text-neutral-500">Cables, mice, monitors</div>
                </div>

                <div className="p-3.5 rounded-lg bg-neutral-50 border border-neutral-200 space-y-1">
                  <span className="text-[10px] font-bold uppercase text-neutral-400">Service & Loan Logs</span>
                  <div className="text-lg font-black font-mono text-neutral-900">{maintenance.length + loans.length} Records</div>
                  <div className="text-[10px] text-neutral-500">{loans.length} active/returned loans</div>
                </div>
              </div>
            </section>
          </div>
        )}

        {/* ================= TAB 3: ACTIVE OPERATOR PROFILE ================= */}
        {activeTab === 'profile' && (
          <div className="space-y-6">
            <section className="bg-white border border-neutral-200 rounded-lg p-6 space-y-4">
              <div className="flex items-center gap-2.5">
                <Shield className="w-4 h-4 text-neutral-800" />
                <h2 className="text-sm font-bold text-neutral-900">
                  Active Laboratory Operator Session
                </h2>
              </div>

              <div className="flex items-start gap-4 pt-2">
                <div className="w-14 h-14 rounded-full bg-neutral-900 text-emerald-400 font-bold flex items-center justify-center text-sm border-2 border-neutral-800 shrink-0">
                  {user?.avatarText || 'TR'}
                </div>
                <div className="space-y-1">
                  <div className="text-sm font-bold text-neutral-900">
                    {user?.name || 'Thoeurn Ratha'}
                  </div>
                  <div className="text-xs text-neutral-500 font-mono">
                    {user?.email || 'thoeurn.ratha@rupp.edu.kh'}
                  </div>
                  <div className="flex items-center gap-2 pt-1">
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${getRoleBadgeStyle(
                        user?.roleBadge || 'Lecturer'
                      )}`}
                    >
                      {user?.roleBadge || 'Lecturer'}
                    </span>
                    <span className="text-xs text-neutral-600 font-medium">
                      {user?.role || 'Faculty Lecturer'}
                    </span>
                  </div>
                  <div className="text-[11px] text-emerald-700 font-semibold pt-1">
                    Permissions: {user?.permissions || 'Course Hardware Allocation & Catalog View'}
                  </div>
                  <div className="text-[10px] text-neutral-400 pt-0.5">
                    Terminal Workstation: {user?.department || 'Engineering Block A - Room 102B & Room 206'}
                  </div>
                </div>
              </div>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
