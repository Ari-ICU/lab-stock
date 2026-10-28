'use client';

import React, { useState } from 'react';
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
} from 'lucide-react';

export default function SettingsPage() {
  const { showToast } = useStock();
  const {
    user,
    managedUsers,
    updateUserRole,
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
  const [newUserRole, setNewUserRole] = useState('Network Technician');
  const [newUserDept, setNewUserDept] = useState('Engineering Block A - Room 102B');

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

    addUser({
      name: newUserName.trim(),
      email: newUserEmail.trim().toLowerCase(),
      role: roleDef.role,
      roleBadge: roleDef.badge,
      avatarText: initials,
      permissions: roleDef.permissions,
      department: newUserDept,
      status: 'active',
    });

    showToast(`Added ${newUserName.trim()} as ${roleDef.badge}`, 'success');
    setNewUserName('');
    setNewUserEmail('');
    setIsAddUserModalOpen(false);
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
      case 'Technician':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Operator':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Viewer':
      default:
        return 'bg-neutral-100 text-neutral-700 border-neutral-200';
    }
  };

  return (
    <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-neutral-50/50">
      <Header
        title="Settings & Access Control"
        subtitle="Manage User Roles, Session Devices, and Lab Configuration"
        showExport={false}
        actionLabel={
          activeTab === 'users'
            ? '+ Add Operator'
            : activeTab === 'sessions'
            ? 'Scan Devices'
            : 'Save Changes'
        }
        onAction={() => {
          if (activeTab === 'users') {
            setIsAddUserModalOpen(true);
          } else if (activeTab === 'sessions') {
            handleRefreshDevices();
          } else {
            showToast('Configuration changes saved successfully', 'success');
          }
        }}
      />

      <div className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-6 max-w-8xl">
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
                  <span className="text-xs font-bold text-neutral-900">
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
                              : u.roleBadge === 'Technician'
                              ? 'bg-blue-50 text-blue-800 border-blue-200'
                              : u.roleBadge === 'Operator'
                              ? 'bg-amber-50 text-amber-800 border-amber-200'
                              : 'bg-neutral-100 text-neutral-800 border-neutral-200'
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
                    Total Active Sessions
                  </span>
                  <Radio className="w-4 h-4 text-emerald-500" />
                </div>
                <div className="text-xl font-bold text-neutral-900 mt-1.5 font-mono">
                  {sessionDevices.length} Connected
                </div>
                <div className="text-[11px] text-neutral-400 mt-1">
                  1 Current • {sessionDevices.length - 1} Remote Terminals
                </div>
              </div>

              <div className="bg-white border border-neutral-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-neutral-500 font-medium">
                    Laboratory Gateway
                  </span>
                  <Wifi className="w-4 h-4 text-blue-500" />
                </div>
                <div className="text-xl font-bold text-neutral-900 mt-1.5 font-mono">
                  192.168.102.1
                </div>
                <div className="text-[11px] text-emerald-600 font-medium mt-1 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span>Subnet 255.255.255.0 Online</span>
                </div>
              </div>

              <div className="bg-white border border-neutral-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-neutral-500 font-medium">
                    Security Policy
                  </span>
                  <Lock className="w-4 h-4 text-neutral-700" />
                </div>
                <div className="text-xl font-bold text-neutral-900 mt-1.5">
                  WPA3-Enterprise
                </div>
                <div className="text-[11px] text-neutral-400 mt-1">
                  MAC-Filtered Switch Access
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
            {/* Backend & API Connection */}
            <section className="bg-white border border-neutral-200 rounded-lg p-6 space-y-4">
              <div className="flex items-center gap-2.5">
                <Server className="w-4 h-4 text-neutral-800" />
                <h2 className="text-sm font-bold text-neutral-900">
                  Backend API & Proxy Configuration
                </h2>
              </div>
              <p className="text-xs text-neutral-500">
                Configure network proxy endpoints connecting to your LabStock room 102B daemon.
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
                    value="Development (Room 102B Local Lab)"
                    className="w-full bg-neutral-100 border border-neutral-300 text-neutral-700 font-medium text-xs px-3.5 py-2.5 rounded cursor-not-allowed"
                  />
                </div>
              </div>
            </section>

            {/* Inventory Alert Rules */}
            <section className="bg-white border border-neutral-200 rounded-lg p-6 space-y-4">
              <div className="flex items-center gap-2.5">
                <Bell className="w-4 h-4 text-neutral-800" />
                <h2 className="text-sm font-bold text-neutral-900">
                  Stock & Maintenance Alerts
                </h2>
              </div>
              <p className="text-xs text-neutral-500">
                Set threshold parameters for low-stock warnings and instrument service due dates.
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
    </div>
  );
}
