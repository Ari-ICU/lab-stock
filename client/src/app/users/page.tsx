'use client';

import React, { useState } from 'react';
import { Header } from '@/components/Header';
import { Dropdown } from '@/components/Dropdown';
import { useStock } from '@/context/StockContext';
import {
  useAuth,
  ROLE_DEFINITIONS,
  ManagedUser,
} from '@/context/AuthContext';
import {
  Users,
  Plus,
  Trash2,
  X,
} from 'lucide-react';

export default function UsersPage() {
  const { showToast } = useStock();
  const {
    user,
    managedUsers,
    updateUserRole,
    addUser,
    deleteUser,
  } = useAuth();

  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserRole, setNewUserRole] = useState('Faculty Lecturer');

  const isAdmin = user?.roleBadge === 'Admin' || user?.role === 'Primary Lab Administrator';

  const roleOptions = Object.keys(ROLE_DEFINITIONS).map((roleName) => ({
    label: `${roleName} (${ROLE_DEFINITIONS[roleName].badge})`,
    value: roleName,
  }));

  const handleRoleChange = (userId: string, newRole: string) => {
    if (!isAdmin) {
      showToast('Permission denied: Only Primary Administrators can change user roles.', 'error');
      return;
    }
    updateUserRole(userId, newRole);
    const targetUser = managedUsers.find((u) => u.id === userId);
    showToast(`Role updated to ${newRole} for ${targetUser?.name || 'user'}`, 'success');
  };

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) {
      showToast('Permission denied: Only Administrators can register personnel.', 'error');
      return;
    }
    if (!newUserName.trim() || !newUserEmail.trim()) {
      showToast('Please fill in user name and email', 'warning');
      return;
    }

    const initials =
      newUserName
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2) || 'OP';

    const roleDef = ROLE_DEFINITIONS[newUserRole] || ROLE_DEFINITIONS['Faculty Lecturer'];

    addUser({
      name: newUserName.trim(),
      email: newUserEmail.trim().toLowerCase(),
      role: roleDef.role,
      roleBadge: roleDef.badge,
      avatarText: initials,
      permissions: roleDef.permissions,
      department: 'Faculty of Engineering',
      status: 'active',
      assignedLabs: ['all'],
    });

    showToast(
      `Added ${newUserName.trim()} as ${roleDef.badge}`,
      'success'
    );

    setNewUserName('');
    setNewUserEmail('');
    setNewUserRole('Faculty Lecturer');
    setIsAddUserModalOpen(false);
  };

  const handleDeleteUser = (userId: string, userName: string) => {
    if (!isAdmin) {
      showToast('Permission denied: Only Primary Administrators can delete operators.', 'error');
      return;
    }
    const success = deleteUser(userId);
    if (!success) {
      showToast('Cannot delete currently active administrator', 'warning');
      return;
    }
    showToast(`Removed ${userName} from laboratory personnel`, 'info');
  };

  const getRoleBadgeStyle = (badge: string) => {
    switch (badge) {
      case 'Admin':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Lecturer':
      default:
        return 'bg-blue-50 text-blue-700 border-blue-200';
    }
  };

  return (
    <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-neutral-50/50">
      <Header
        title="User & Role Management"
        subtitle="Manage Faculty Personnel and Administrative Roles"
        showExport={false}
        showAction={false}
      />

      <div className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-6 max-w-8xl w-full mx-auto">
        {/* Header info box with Action Button */}
        <div className="bg-white border border-neutral-200 rounded-lg p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded">
                Access Control
              </span>
              <span className="text-xs text-neutral-400">Department Laboratories Faculty Personnel</span>
            </div>
            <h2 className="text-base font-bold text-neutral-900">
              Department Faculty Personnel & Roles
            </h2>
            <p className="text-xs text-neutral-500 mt-1 max-w-xl">
              Configure personnel roles and administrative privileges. Changes apply immediately to active sessions.
            </p>
          </div>

          {isAdmin && (
            <button
              type="button"
              onClick={() => {
                setNewUserRole('Faculty Lecturer');
                setIsAddUserModalOpen(true);
              }}
              className="flex items-center gap-2 text-xs font-semibold px-3.5 py-2 rounded transition-colors cursor-pointer shrink-0 shadow-xs bg-neutral-900 hover:bg-neutral-800 text-white"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Personnel</span>
            </button>
          )}
        </div>

        {/* Role Summary Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 max-w-3xl">
          {Object.entries(ROLE_DEFINITIONS).map(([key, def]) => {
            const count = managedUsers.filter((u) => u.role === def.role).length;
            return (
              <div
                key={key}
                className="bg-white border border-neutral-200 rounded-lg p-4 flex flex-col justify-between shadow-2xs"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span
                      className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded border ${getRoleBadgeStyle(
                        def.badge
                      )}`}
                    >
                      {def.badge}
                    </span>
                    <span className="text-xs font-mono font-bold text-neutral-500">
                      {count} {count === 1 ? 'user' : 'users'}
                    </span>
                  </div>
                  <h3 className="text-xs font-bold text-neutral-900">{def.role}</h3>
                  <p className="text-[11px] text-neutral-500 mt-1 line-clamp-2">
                    {def.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Personnel Directory Card */}
        <div className="bg-white border border-neutral-200 rounded-lg shadow-2xs">
          <div className="p-4 border-b border-neutral-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-neutral-500" />
              <span className="text-xs font-bold text-neutral-900">
                Faculty Personnel Directory ({managedUsers.length})
              </span>
            </div>
            <span className="text-[11px] text-neutral-500">
              {isAdmin ? 'Select a role dropdown to change permissions' : 'Authorized Department Roster'}
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
                          : 'bg-blue-50 text-blue-800 border-blue-200'
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

                  {/* Right: Role selection & Delete */}
                  <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                    <div className="text-right hidden md:block">
                      <div className="text-[11px] font-semibold text-neutral-800">
                        {u.permissions}
                      </div>
                      <div className="text-[10px] text-neutral-400">Access level</div>
                    </div>

                    {isAdmin ? (
                      <Dropdown
                        value={u.role}
                        options={roleOptions}
                        onChange={(newRole) => handleRoleChange(u.id, newRole)}
                        className="w-56"
                      />
                    ) : (
                      <span
                        className={`text-xs font-semibold px-3 py-1 rounded border ${getRoleBadgeStyle(
                          u.roleBadge
                        )}`}
                      >
                        {u.role}
                      </span>
                    )}

                    {isAdmin && !isCurrentLoggedUser && (
                      <button
                        type="button"
                        onClick={() => handleDeleteUser(u.id, u.name)}
                        className="p-1.5 text-neutral-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                        title="Remove user"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Add User Modal */}
      {isAddUserModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white rounded-lg border border-neutral-200 max-w-md w-full p-5 shadow-xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100 mb-4">
              <div>
                <h3 className="text-sm font-bold text-neutral-900">
                  Register Department Faculty
                </h3>
                <p className="text-xs text-neutral-500">
                  Provision institutional credentials and administrative role
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsAddUserModalOpen(false)}
                className="text-neutral-400 hover:text-neutral-700 p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dr. Sok Vanna"
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  className="w-full text-xs border border-neutral-300 rounded px-3 py-2 focus:outline-none focus:border-neutral-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  University Email Address
                </label>
                <input
                  type="email"
                  required
                  placeholder="sok.vanna@rupp.edu.kh"
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  className="w-full text-xs border border-neutral-300 rounded px-3 py-2 focus:outline-none focus:border-neutral-900 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Faculty Role
                </label>
                <Dropdown
                  value={newUserRole}
                  options={roleOptions}
                  onChange={setNewUserRole}
                  className="w-full"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-100 mt-4">
                <button
                  type="button"
                  onClick={() => setIsAddUserModalOpen(false)}
                  className="px-3 py-1.5 text-xs font-medium text-neutral-600 hover:text-neutral-900 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-neutral-900 hover:bg-neutral-800 rounded cursor-pointer shadow-xs"
                >
                  Confirm & Provision
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
