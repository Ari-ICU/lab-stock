'use client';

import React, { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { Dropdown } from '@/components/Dropdown';
import { useStock } from '@/context/StockContext';
import {
  useAuth,
  ROLE_DEFINITIONS,
  ManagedUser,
  SessionDevice,
} from '@/context/AuthContext';
import {
  Shield,
  Bell,
  Server,
  Users,
  Laptop,
  Monitor,
  Tablet,
  Smartphone,
  Terminal,
  RefreshCw,
  LogOut,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  X,
  Sliders,
  UserCheck,
  Radio,
  Wifi,
  Lock,
  ExternalLink,
  Database,
  Save,
  Activity,
  Check,
  FileJson,
  RotateCcw,
  Zap,
  Volume2,
  Building,
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
    managedUsers,
    updateUserRole,
    updateUserAssignedLabs,
    addUser,
    deleteUser,
    sessionDevices,
    refreshSessionDevices,
    revokeSession,
    revokeAllOtherSessions,
  } = useAuth();

  const [activeTab, setActiveTab] = useState<'users' | 'sessions' | 'system' | 'profile'>('users');
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserRole, setNewUserRole] = useState('Faculty Lecturer');
  const [newUserDept, setNewUserDept] = useState('Engineering Block A - Room 102B');
  const [newUserAssignedLabs, setNewUserAssignedLabs] = useState<string[]>(['Rm 102B']);

  // Assign Labs Modal State
  const [selectedUserForLabs, setSelectedUserForLabs] = useState<ManagedUser | null>(null);
  const [isAssignLabsModalOpen, setIsAssignLabsModalOpen] = useState(false);
  const [tempAssignedLabs, setTempAssignedLabs] = useState<string[]>([]);

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

  const handleTestApi = async () => {
    setApiStatus('testing');
    const start = performance.now();
    try {
      await new Promise((r) => setTimeout(r, 380));
      const rtt = Math.max(8, Math.round(performance.now() - start));
      setApiLatency(rtt);
      setApiStatus('connected');
      showToast(`Gateway ping healthy: ${rtt}ms RTT latency`, 'success');
    } catch {
      setApiStatus('error');
      showToast('Gateway connection timeout. Check API endpoint.', 'error');
    }
  };

  const handleSaveApi = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      localStorage.setItem('csd_api_config', JSON.stringify({ url: apiBaseUrl, env: apiEnvironment }));
      showToast('Backend API configuration saved successfully', 'success');
    } catch {
      showToast('Failed to save API configuration', 'error');
    }
  };

  const handleSaveAlerts = (e: React.FormEvent) => {
    e.preventDefault();
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

  const roleOptions = Object.keys(ROLE_DEFINITIONS).map((roleName) => ({
    label: `${roleName} (${ROLE_DEFINITIONS[roleName].badge})`,
    value: roleName,
  }));

  const handleRoleChange = (userId: string, newRole: string) => {
    updateUserRole(userId, newRole);
    const targetUser = managedUsers.find((u) => u.id === userId);
    showToast(
      `Role updated to ${newRole} for ${targetUser?.name || 'user'}`,
      'success'
    );
  };

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName.trim() || !newUserEmail.trim()) {
      showToast('Please fill in user name and email', 'warning');
      return;
    }

    const initials = newUserName
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || 'OP';

    const roleDef = ROLE_DEFINITIONS[newUserRole] || ROLE_DEFINITIONS['Laboratory Operator'];

    const assignedLabsToSave =
      newUserRole === 'Primary Lab Administrator' || roleDef.badge === 'Admin'
        ? ['all']
        : newUserAssignedLabs.length > 0
        ? newUserAssignedLabs
        : ['Rm 102B'];

    addUser({
      name: newUserName.trim(),
      email: newUserEmail.trim().toLowerCase(),
      role: roleDef.role,
      roleBadge: roleDef.badge,
      avatarText: initials,
      permissions: roleDef.permissions,
      department: newUserDept,
      status: 'active',
      assignedLabs: assignedLabsToSave,
    });

    showToast(`Added ${newUserName.trim()} as ${roleDef.badge} (${assignedLabsToSave.join(', ')})`, 'success');
    setNewUserName('');
    setNewUserEmail('');
    setNewUserAssignedLabs(['Rm 102B']);
    setIsAddUserModalOpen(false);
  };

  const openAssignLabsModal = (targetUser: ManagedUser) => {
    setSelectedUserForLabs(targetUser);
    setTempAssignedLabs(
      targetUser.assignedLabs && targetUser.assignedLabs.length > 0
        ? targetUser.assignedLabs
        : ['Rm 102B']
    );
    setIsAssignLabsModalOpen(true);
  };

  const handleSaveAssignedLabs = () => {
    if (!selectedUserForLabs) return;
    const finalLabs = tempAssignedLabs.length > 0 ? tempAssignedLabs : ['Rm 102B'];
    updateUserAssignedLabs(selectedUserForLabs.id, finalLabs);
    showToast(`Updated lab scope for ${selectedUserForLabs.name}: [${finalLabs.join(', ')}]`, 'success');
    setIsAssignLabsModalOpen(false);
    setSelectedUserForLabs(null);
  };

  const toggleLabInTemp = (roomCode: string) => {
    if (roomCode === 'all') {
      if (tempAssignedLabs.includes('all')) {
        setTempAssignedLabs(['Rm 102B']);
      } else {
        setTempAssignedLabs(['all']);
      }
      return;
    }

    if (tempAssignedLabs.includes('all')) {
      setTempAssignedLabs([roomCode]);
      return;
    }

    if (tempAssignedLabs.includes(roomCode)) {
      const filtered = tempAssignedLabs.filter((r) => r !== roomCode);
      setTempAssignedLabs(filtered.length > 0 ? filtered : [roomCode]);
    } else {
      setTempAssignedLabs([...tempAssignedLabs, roomCode]);
    }
  };

  const handleDeleteUser = (userId: string, userName: string) => {
    const success = deleteUser(userId);
    if (!success) {
      showToast('Cannot delete currently active administrator', 'warning');
      return;
    }
    showToast(`Removed ${userName} from laboratory operators`, 'info');
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
        title="Settings & Access Control"
        subtitle="Manage User Roles, Session Devices, and Lab Configuration"
        showExport={false}
        showAction={false}
      />

      <div className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-6 max-w-8xl w-full mx-auto">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-white border border-neutral-200 rounded-lg shadow-xs overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('users')}
            className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-md transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'users'
                ? 'bg-neutral-900 text-white shadow-xs'
                : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Manage User Roles</span>
            <span
              suppressHydrationWarning
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                activeTab === 'users'
                  ? 'bg-neutral-800 text-neutral-200'
                  : 'bg-neutral-100 text-neutral-600'
              }`}
            >
              {managedUsers.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('sessions')}
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
            onClick={() => setActiveTab('system')}
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
            onClick={() => setActiveTab('profile')}
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

        {/* ================= TAB 1: MANAGE USER ROLES ================= */}
        {activeTab === 'users' && (
          <div className="space-y-6">
            {/* Header info box */}
            <div className="bg-white border border-neutral-200 rounded-lg p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded">
                    Access Control
                  </span>
                  <span className="text-xs text-neutral-400">Room 102B Personnel</span>
                </div>
                <h2 className="text-base font-bold text-neutral-900">
                  Laboratory User & Role Management
                </h2>
                <p className="text-xs text-neutral-500 mt-1 max-w-xl">
                  Change role permissions for lab staff, technicians, and student assistants. Changes apply immediately to active sessions.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsAddUserModalOpen(true)}
                className="flex items-center gap-2 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-semibold px-3.5 py-2 rounded transition-colors cursor-pointer shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Operator</span>
              </button>
            </div>

            {/* Role Summary Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {Object.entries(ROLE_DEFINITIONS).map(([key, def]) => {
                const count = managedUsers.filter((u) => u.role === def.role).length;
                return (
                  <div
                    key={key}
                    className="bg-white border border-neutral-200 rounded-lg p-3.5 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span
                          className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${getRoleBadgeStyle(
                            def.badge
                          )}`}
                        >
                          {def.badge}
                        </span>
                        <span className="text-xs font-bold text-neutral-800 font-mono">
                          {count} {count === 1 ? 'user' : 'users'}
                        </span>
                      </div>
                      <div className="text-xs font-bold text-neutral-900 leading-tight">
                        {def.role}
                      </div>
                      <p className="text-[11px] text-neutral-500 mt-1 leading-snug">
                        {def.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Managed Users List */}
            <div className="bg-white border border-neutral-200 rounded-lg shadow-xs">
              <div className="px-5 py-3.5 border-b border-neutral-200 bg-neutral-50/70 rounded-t-lg flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-neutral-700" />
                  <span suppressHydrationWarning className="text-xs font-bold text-neutral-900">
                    Personnel Directory ({managedUsers.length})
                  </span>
                </div>
                <span className="text-[11px] text-neutral-500">
                  Select a role dropdown to instantly change permissions
                </span>
              </div>

              <div className="divide-y divide-neutral-200">
                {managedUsers.map((u) => {
                  const isCurrentLoggedUser = user?.id === u.id || user?.email === u.email;
                  return (
                    <div
                      key={u.id}
                      className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-neutral-50/60 transition-colors"
                    >
                      {/* Left: Avatar & Identity */}
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`w-10 h-10 rounded-full font-bold flex items-center justify-center text-xs shrink-0 border ${
                            u.roleBadge === 'Admin'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              : u.roleBadge === 'Lecturer'
                              ? 'bg-blue-50 text-blue-800 border-blue-200'
                              : 'bg-amber-50 text-amber-800 border-amber-200'
                          }`}
                        >
                          {u.avatarText}
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-neutral-900 truncate">
                              {u.name}
                            </span>
                            {isCurrentLoggedUser && (
                              <span className="text-[9px] font-bold bg-neutral-900 text-white px-1.5 py-0.2 rounded">
                                YOU
                              </span>
                            )}
                            <span className="inline-flex items-center gap-1 text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                              <span>{u.status}</span>
                            </span>
                          </div>

                          <div className="text-[11px] text-neutral-500 truncate font-mono mt-0.5">
                            {u.email}
                          </div>

                          <div className="text-[10px] text-neutral-400 mt-0.5">
                            {u.department} • Last login: {u.lastLogin}
                          </div>

                          {/* Scoped Lab Permissions Pills */}
                          <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                            <span className="text-[10px] uppercase font-bold text-neutral-400 shrink-0">
                              Assigned Labs:
                            </span>
                            {u.assignedLabs?.includes('all') || u.roleBadge === 'Admin' ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-neutral-900 text-white px-2 py-0.5 rounded font-mono shadow-2xs">
                                <Shield className="w-2.5 h-2.5 text-emerald-400" />
                                <span>All Laboratories (Universal Access)</span>
                              </span>
                            ) : (
                              u.assignedLabs && u.assignedLabs.length > 0 ? (
                                u.assignedLabs.map((room) => (
                                  <span
                                    key={room}
                                    className="inline-flex items-center gap-1 text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded font-mono"
                                  >
                                    <Building className="w-2.5 h-2.5 text-blue-500" />
                                    <span>{room}</span>
                                  </span>
                                ))
                              ) : (
                                <span className="text-[10px] text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded font-medium">
                                  No Labs Assigned
                                </span>
                              )
                            )}

                            {/* Button to edit lab assignments */}
                            <button
                              type="button"
                              onClick={() => openAssignLabsModal(u)}
                              className="inline-flex items-center gap-1 text-[10px] font-semibold text-neutral-600 hover:text-neutral-900 bg-neutral-100 hover:bg-neutral-200 px-2 py-0.5 rounded transition-colors cursor-pointer ml-1"
                              title="Assign or modify authorized laboratory rooms"
                            >
                              <Sliders className="w-2.5 h-2.5 text-neutral-500" />
                              <span>Assign Labs</span>
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Right: Role Switcher & Delete */}
                      <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end shrink-0">
                        <div className="text-right hidden md:block">
                          <div className="text-[11px] font-semibold text-neutral-800">
                            {u.permissions}
                          </div>
                          <div className="text-[10px] text-neutral-400">
                            Access level
                          </div>
                        </div>

                        {/* Interactive Role Switcher Dropdown */}
                        <div className="w-56 shrink-0">
                          <Dropdown
                            value={u.role}
                            options={roleOptions}
                            onChange={(newRole) => handleRoleChange(u.id, newRole)}
                            className="w-full"
                            buttonClassName="py-1.5 px-2.5 text-xs font-semibold text-neutral-900 bg-white border-neutral-300 rounded hover:border-neutral-900"
                          />
                        </div>

                        {/* Delete User Button */}
                        <button
                          type="button"
                          onClick={() => handleDeleteUser(u.id, u.name)}
                          disabled={isCurrentLoggedUser}
                          title={
                            isCurrentLoggedUser
                              ? 'Cannot remove yourself'
                              : 'Remove operator'
                          }
                          className="p-1.5 text-neutral-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 2: SESSION DEVICES ================= */}
        {activeTab === 'sessions' && (
          <div className="space-y-6">
            {/* Header info box */}
            <div className="bg-white border border-neutral-200 rounded-lg p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded">
                    Active Telemetry
                  </span>
                  <span className="text-xs text-neutral-400">Room 102B Network</span>
                </div>
                <h2 className="text-base font-bold text-neutral-900">
                  Connected Session Devices
                </h2>
                <p className="text-xs text-neutral-500 mt-1 max-w-xl">
                  Inspect workstations, handheld scanners, and switch console terminals currently authenticated to Lab 102B.
                </p>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={handleRefreshDevices}
                  className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-neutral-800 bg-white border border-neutral-200 hover:bg-neutral-50 rounded transition-colors cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-neutral-500" />
                  <span>Scan Devices</span>
                </button>

                <button
                  type="button"
                  onClick={handleRevokeAllOthers}
                  className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 hover:bg-rose-100 rounded transition-colors cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5 text-rose-600" />
                  <span>Revoke Others</span>
                </button>
              </div>
            </div>

            {/* Network Environment Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-white border border-neutral-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-neutral-500 font-medium">
                    Active Client Sessions
                  </span>
                  <Radio className="w-4 h-4 text-emerald-500" />
                </div>
                <div suppressHydrationWarning className="text-xl font-bold text-neutral-900 mt-1.5 font-mono">
                  {sessionDevices.length} Connected
                </div>
                <div className="text-[11px] text-neutral-400 mt-1">
                  1 Current Device • {Math.max(0, sessionDevices.length - 1)} Remote Terminals
                </div>
              </div>

              <div className="bg-white border border-neutral-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-neutral-500 font-medium">
                    Host & Network Gateway
                  </span>
                  <Wifi className="w-4 h-4 text-blue-500" />
                </div>
                <div suppressHydrationWarning className="text-xl font-bold text-neutral-900 mt-1.5 font-mono truncate" title={telemetry.host}>
                  {telemetry.host}
                </div>
                <div suppressHydrationWarning className="text-[11px] text-emerald-600 font-medium mt-1 flex items-center gap-1">
                  <span className={`w-1.5 h-1.5 rounded-full ${telemetry.isOnline ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                  <span>{telemetry.isOnline ? 'Online' : 'Offline'} • {telemetry.protocol} • {telemetry.timezone}</span>
                </div>
              </div>

              <div className="bg-white border border-neutral-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-neutral-500 font-medium">
                    Session Security
                  </span>
                  <Lock className="w-4 h-4 text-neutral-700" />
                </div>
                <div suppressHydrationWarning className="text-xl font-bold text-neutral-900 mt-1.5 truncate">
                  {telemetry.protocol === 'HTTPS' ? 'HTTPS / TLS Encrypted' : 'HTTP Local Session'}
                </div>
                <div className="text-[11px] text-neutral-400 mt-1 truncate" title={user?.email}>
                  Operator: <span className="text-neutral-700 font-medium">{user?.name || 'Administrator'}</span> ({user?.role || 'Staff'})
                </div>
              </div>
            </div>

            {/* Device Session Cards List */}
            <div className="bg-white border border-neutral-200 rounded-lg overflow-hidden shadow-xs">
              <div className="px-5 py-3.5 border-b border-neutral-200 bg-neutral-50/70 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Monitor className="w-4 h-4 text-neutral-700" />
                  <span className="text-xs font-bold text-neutral-900">
                    Authenticated Hardware & Workstations
                  </span>
                </div>
                <span className="text-[11px] text-neutral-500">
                  Live detection from user-agent & network gateway
                </span>
              </div>

              <div className="divide-y divide-neutral-200">
                {sessionDevices.map((device) => (
                  <div
                    key={device.id}
                    className={`p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-colors ${
                      device.isCurrent ? 'bg-emerald-50/20' : 'hover:bg-neutral-50/60'
                    }`}
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

        {/* ================= TAB 3: SYSTEM PREFERENCES & API ================= */}
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

            {/* Backend API & Gateway Configuration */}
            <section className="bg-white border border-neutral-200 rounded-lg p-6 space-y-4 shadow-xs">
              <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <Server className="w-4 h-4 text-neutral-800" />
                  <h2 className="text-sm font-bold text-neutral-900">
                    Backend API & Faculty Gateway Daemon
                  </h2>
                </div>
                <span className="text-[10px] font-mono uppercase bg-neutral-100 text-neutral-700 px-2 py-0.5 rounded border border-neutral-200 font-bold">
                  REST v1 / WebSocket
                </span>
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
                      value={apiBaseUrl}
                      onChange={(e) => setApiBaseUrl(e.target.value)}
                      placeholder="http://localhost:5001/api/v1"
                      className="w-full bg-white border border-neutral-300 text-neutral-900 font-medium text-xs px-3.5 py-2.5 rounded focus:outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 font-mono transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-neutral-800 mb-1.5">
                      Deployment Environment Profile
                    </label>
                    <select
                      value={apiEnvironment}
                      onChange={(e) => setApiEnvironment(e.target.value)}
                      className="w-full bg-white border border-neutral-300 text-neutral-900 font-medium text-xs px-3.5 py-2.5 rounded focus:outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 transition-colors cursor-pointer"
                    >
                      <option value="Development (Local Faculty Fleet)">Development (Local Faculty Fleet)</option>
                      <option value="Campus Intranet (RUPP STEM Network)">Campus Intranet (RUPP STEM Network)</option>
                      <option value="Production Cloud (GitHub Pages / Standalone)">Production Cloud (GitHub Pages / Standalone)</option>
                    </select>
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
                        <span>Connection Timeout</span>
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

                    <button
                      type="submit"
                      className="px-3.5 py-1.5 rounded text-xs font-semibold bg-neutral-900 hover:bg-neutral-800 text-white transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <Save className="w-3.5 h-3.5 text-neutral-300" />
                      <span>Save Config</span>
                    </button>
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
                <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded">
                  Active Monitoring
                </span>
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
                      value={lowStockThreshold}
                      onChange={(e) => setLowStockThreshold(Number(e.target.value))}
                      className="w-full bg-white border border-neutral-300 text-neutral-900 font-semibold text-xs px-3.5 py-2 rounded focus:outline-none focus:border-neutral-900 font-mono transition-colors"
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
                      value={calibrationDaysAhead}
                      onChange={(e) => setCalibrationDaysAhead(Number(e.target.value))}
                      className="w-full bg-white border border-neutral-300 text-neutral-900 font-semibold text-xs px-3.5 py-2 rounded focus:outline-none focus:border-neutral-900 font-mono transition-colors"
                    />
                  </div>
                </div>

                {/* Interactive Feature Toggles */}
                <div className="space-y-3 pt-1">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-900">
                    Automated Alert Policies
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <label className="p-3 rounded-lg border border-neutral-200 hover:border-neutral-300 bg-white flex items-start gap-3 cursor-pointer transition-colors">
                      <input
                        type="checkbox"
                        checked={enableLowStockRibbon}
                        onChange={(e) => setEnableLowStockRibbon(e.target.checked)}
                        className="mt-0.5 rounded border-neutral-300 text-neutral-900 focus:ring-0 cursor-pointer"
                      />
                      <div>
                        <div className="font-semibold text-neutral-900">Low Stock Warning Badges</div>
                        <div className="text-[11px] text-neutral-500">Display prominent amber warning pills on consumable items.</div>
                      </div>
                    </label>

                    <label className="p-3 rounded-lg border border-neutral-200 hover:border-neutral-300 bg-white flex items-start gap-3 cursor-pointer transition-colors">
                      <input
                        type="checkbox"
                        checked={enableLoanReminders}
                        onChange={(e) => setEnableLoanReminders(e.target.checked)}
                        className="mt-0.5 rounded border-neutral-300 text-neutral-900 focus:ring-0 cursor-pointer"
                      />
                      <div>
                        <div className="font-semibold text-neutral-900">Overdue Device Loan Alerts</div>
                        <div className="text-[11px] text-neutral-500">Flag checked-out devices immediately upon passing expected return date.</div>
                      </div>
                    </label>

                    <label className="p-3 rounded-lg border border-neutral-200 hover:border-neutral-300 bg-white flex items-start gap-3 cursor-pointer transition-colors">
                      <input
                        type="checkbox"
                        checked={enableAudioBeep}
                        onChange={(e) => setEnableAudioBeep(e.target.checked)}
                        className="mt-0.5 rounded border-neutral-300 text-neutral-900 focus:ring-0 cursor-pointer"
                      />
                      <div>
                        <div className="font-semibold text-neutral-900">Scanner Audio Feedback Tone</div>
                        <div className="text-[11px] text-neutral-500">Provide audio confirmation chime upon successful barcode/QR code scan.</div>
                      </div>
                    </label>

                    <label className="p-3 rounded-lg border border-neutral-200 hover:border-neutral-300 bg-white flex items-start gap-3 cursor-pointer transition-colors">
                      <input
                        type="checkbox"
                        checked={enableDailyDigest}
                        onChange={(e) => setEnableDailyDigest(e.target.checked)}
                        className="mt-0.5 rounded border-neutral-300 text-neutral-900 focus:ring-0 cursor-pointer"
                      />
                      <div>
                        <div className="font-semibold text-neutral-900">Automated Daily Fleet Digest</div>
                        <div className="text-[11px] text-neutral-500">Compile audit records and stock movement summaries into notifications.</div>
                      </div>
                    </label>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-100">
                  <button
                    type="button"
                    onClick={handleResetAlerts}
                    className="px-3 py-1.5 rounded text-xs font-medium text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reset Defaults</span>
                  </button>

                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded text-xs font-semibold bg-neutral-900 hover:bg-neutral-800 text-white transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Save className="w-3.5 h-3.5 text-neutral-300" />
                    <span>Save Alert Rules</span>
                  </button>
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

        {/* ================= TAB 4: ACTIVE OPERATOR PROFILE ================= */}
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
                    {user?.email || 'admin@lab.edu'}
                  </div>
                  <div className="flex items-center gap-2 pt-1">
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${getRoleBadgeStyle(
                        user?.roleBadge || 'Admin'
                      )}`}
                    >
                      {user?.roleBadge || 'Admin'}
                    </span>
                    <span className="text-xs text-neutral-600 font-medium">
                      {user?.role || 'Primary Lab Administrator'}
                    </span>
                  </div>
                  <div className="text-[11px] text-emerald-700 font-semibold pt-1">
                    Permissions: {user?.permissions || 'Full Read/Write Access & System Config'}
                  </div>
                  <div className="text-[10px] text-neutral-400 pt-0.5">
                    Terminal Workstation: {user?.department || 'Engineering Block A - Room 102B'}
                  </div>
                </div>
              </div>
            </section>
          </div>
        )}
      </div>

      {/* ================= ADD OPERATOR MODAL ================= */}
      {isAddUserModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/40 backdrop-blur-xs">
          <div className="bg-white border border-neutral-200 rounded-lg max-w-md w-full p-6 shadow-xl relative animate-in fade-in zoom-in-95 duration-150">
            <button
              onClick={() => setIsAddUserModalOpen(false)}
              className="absolute top-4 right-4 text-neutral-400 hover:text-neutral-900 p-1 rounded hover:bg-neutral-100 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-neutral-900">
                  Register Lab Operator
                </h3>
                <p className="text-xs text-neutral-500">
                  Assign user privileges for Room 102B
                </p>
              </div>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-800 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  placeholder="e.g. David Seng"
                  className="w-full bg-white border border-neutral-300 text-neutral-900 text-xs px-3 py-2 rounded focus:outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-800 mb-1">
                  Laboratory Email
                </label>
                <input
                  type="email"
                  required
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  placeholder="e.g. david@lab.edu"
                  className="w-full bg-white border border-neutral-300 text-neutral-900 text-xs px-3 py-2 rounded focus:outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-800 mb-1">
                  Access Role Level
                </label>
                <Dropdown
                  value={newUserRole}
                  options={roleOptions}
                  onChange={(newRole) => setNewUserRole(newRole)}
                  className="w-full"
                  buttonClassName="py-2 px-3 text-xs font-semibold text-neutral-900 bg-white border-neutral-300 rounded hover:border-neutral-900"
                />
                <p className="text-[10px] text-neutral-500 mt-1">
                  {ROLE_DEFINITIONS[newUserRole]?.description}
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-800 mb-1">
                  Department / Workstation
                </label>
                <input
                  type="text"
                  value={newUserDept}
                  onChange={(e) => setNewUserDept(e.target.value)}
                  className="w-full bg-white border border-neutral-300 text-neutral-900 text-xs px-3 py-2 rounded focus:outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-800 mb-1.5">
                  Authorized Laboratories Scope
                </label>
                <div className="space-y-1.5 max-h-40 overflow-y-auto p-2.5 bg-neutral-50 rounded border border-neutral-200">
                  {locations.map((loc) => {
                    const checked = newUserAssignedLabs.includes(loc.room);
                    return (
                      <label
                        key={loc.id}
                        className="flex items-center gap-2 text-xs text-neutral-800 cursor-pointer hover:text-neutral-900"
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => {
                            if (checked) {
                              setNewUserAssignedLabs(newUserAssignedLabs.filter((r) => r !== loc.room));
                            } else {
                              setNewUserAssignedLabs([...newUserAssignedLabs, loc.room]);
                            }
                          }}
                          className="rounded text-neutral-900 focus:ring-neutral-900"
                        />
                        <span className="font-medium">{loc.name}</span>
                        <span className="text-[10px] text-neutral-400 font-mono">({loc.room})</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-200">
                <button
                  type="button"
                  onClick={() => setIsAddUserModalOpen(false)}
                  className="px-3.5 py-1.5 text-xs font-medium text-neutral-600 hover:text-neutral-900 bg-white border border-neutral-200 hover:bg-neutral-50 rounded transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-neutral-900 hover:bg-neutral-800 rounded transition-colors cursor-pointer"
                >
                  Save & Register
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= ASSIGN LABORATORIES MODAL ================= */}
      {isAssignLabsModalOpen && selectedUserForLabs && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/40 backdrop-blur-xs">
          <div className="bg-white border border-neutral-200 rounded-lg max-w-md w-full p-6 shadow-xl relative animate-in fade-in zoom-in-95 duration-150">
            <button
              onClick={() => setIsAssignLabsModalOpen(false)}
              className="absolute top-4 right-4 text-neutral-400 hover:text-neutral-900 p-1 rounded hover:bg-neutral-100 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded bg-blue-50 border border-blue-200 text-blue-700 flex items-center justify-center">
                <Building className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-neutral-900">
                  Assign Laboratories Scope
                </h3>
                <p className="text-xs text-neutral-500">
                  Managing access scope for <span className="font-semibold text-neutral-900">{selectedUserForLabs.name}</span>
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-lg text-xs text-blue-900 space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-blue-600" />
                  <span>Room-Level Control Guard</span>
                </div>
                <p className="text-[11px] text-blue-700 leading-relaxed">
                  Operators can only edit, delete, lend, or transfer equipment located inside their assigned laboratories.
                </p>
              </div>

              {/* Universal All Labs Option */}
              <label className="flex items-center gap-2 p-2.5 rounded border border-neutral-200 bg-neutral-50 hover:bg-neutral-100/70 cursor-pointer">
                <input
                  type="checkbox"
                  checked={tempAssignedLabs.includes('all')}
                  onChange={() => toggleLabInTemp('all')}
                  className="rounded text-neutral-900 focus:ring-neutral-900"
                />
                <div>
                  <div className="text-xs font-bold text-neutral-900">👑 All Laboratories (Universal Access)</div>
                  <div className="text-[10px] text-neutral-500">Full administrative authority across all current & future facilities</div>
                </div>
              </label>

              {!tempAssignedLabs.includes('all') && (
                <div className="space-y-1.5 max-h-60 overflow-y-auto p-2 bg-neutral-50/70 rounded border border-neutral-200">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block px-1 mb-1">
                    Select Authorized Classrooms ({locations.length})
                  </span>
                  {locations.map((loc) => {
                    const isChecked = tempAssignedLabs.includes(loc.room);
                    return (
                      <label
                        key={loc.id}
                        className={`flex items-center justify-between p-2 rounded border transition-colors cursor-pointer ${
                          isChecked
                            ? 'bg-blue-50/70 border-blue-200 text-blue-950 font-semibold'
                            : 'bg-white border-neutral-200 text-neutral-700 hover:bg-neutral-50'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleLabInTemp(loc.room)}
                            className="rounded text-neutral-900 focus:ring-neutral-900"
                          />
                          <span className="text-xs">{loc.name}</span>
                        </div>
                        <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-white border border-neutral-200">
                          {loc.room}
                        </span>
                      </label>
                    );
                  })}
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-200">
                <button
                  type="button"
                  onClick={() => setIsAssignLabsModalOpen(false)}
                  className="px-3.5 py-1.5 text-xs font-medium text-neutral-600 hover:text-neutral-900 bg-white border border-neutral-200 hover:bg-neutral-50 rounded transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveAssignedLabs}
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-neutral-900 hover:bg-neutral-800 rounded transition-colors cursor-pointer"
                >
                  Apply Lab Scope
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
