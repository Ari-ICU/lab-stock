'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Header } from '@/components/Header';
import { Dropdown } from '@/components/Dropdown';
import { useStock } from '@/context/StockContext';
import {
  useAuth,
  ROLE_DEFINITIONS,
  ManagedUser,
} from '@/context/AuthContext';
import {
  Shield,
  Users,
  Plus,
  Trash2,
  Lock,
  Building,
  Sliders,
  X,
} from 'lucide-react';

export default function UsersPage() {
  const { showToast, locations } = useStock();
  const {
    user,
    managedUsers,
    updateUserRole,
    updateUserAssignedLabs,
    addUser,
    deleteUser,
  } = useAuth();

  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserRole, setNewUserRole] = useState('Faculty Lecturer');
  const [newUserPrimaryLocation, setNewUserPrimaryLocation] = useState<string>('Room 102B');
  const [newUserAssignedLabs, setNewUserAssignedLabs] = useState<string[]>(['Room 102B']);

  // Assign / Relocate Labs Modal State
  const [selectedUserForLabs, setSelectedUserForLabs] = useState<ManagedUser | null>(null);
  const [isAssignLabsModalOpen, setIsAssignLabsModalOpen] = useState(false);
  const [tempAssignedLabs, setTempAssignedLabs] = useState<string[]>([]);

  const isAdmin = user?.roleBadge === 'Admin' || user?.role === 'Primary Lab Administrator';

  const roleOptions = Object.keys(ROLE_DEFINITIONS).map((roleName) => ({
    label: `${roleName} (${ROLE_DEFINITIONS[roleName].badge})`,
    value: roleName,
  }));

  const locationOptions = React.useMemo(() => {
    const opts = [
      {
        label: 'All Laboratories (Universal Access)',
        value: 'all',
      },
    ];

    locations.forEach((loc) => {
      opts.push({
        label: `${loc.name} (${loc.room}) • ${loc.building}`,
        value: loc.room,
      });
    });

    opts.push({
      label: '+ Custom Multi-Room Scope...',
      value: 'custom',
    });

    return opts;
  }, [locations]);

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

    let targetDept = 'Engineering Block A - Room 102B';
    let assignedLabsToSave: string[] = ['Room 102B'];

    if (
      newUserRole === 'Primary Lab Administrator' ||
      roleDef.badge === 'Admin' ||
      newUserPrimaryLocation === 'all'
    ) {
      assignedLabsToSave = ['all'];
      targetDept = 'Faculty Fleet Administration (All Labs)';
    } else if (newUserPrimaryLocation === 'custom') {
      assignedLabsToSave = newUserAssignedLabs.length > 0 ? newUserAssignedLabs : ['Room 102B'];
      const matched = locations.filter((l) => assignedLabsToSave.includes(l.room));
      targetDept =
        matched.length > 0
          ? matched.map((l) => `${l.building} • ${l.room}`).join(', ')
          : 'Engineering Block A - Room 102B';
    } else {
      assignedLabsToSave = [newUserPrimaryLocation];
      const matched = locations.find((l) => l.room === newUserPrimaryLocation);
      targetDept = matched
        ? `${matched.building} - ${matched.room}`
        : 'Engineering Block A - Room 102B';
    }

    addUser({
      name: newUserName.trim(),
      email: newUserEmail.trim().toLowerCase(),
      role: roleDef.role,
      roleBadge: roleDef.badge,
      avatarText: initials,
      permissions: roleDef.permissions,
      department: targetDept,
      status: 'active',
      assignedLabs: assignedLabsToSave,
    });

    showToast(
      `Added ${newUserName.trim()} as ${roleDef.badge} (${assignedLabsToSave.join(', ')})`,
      'success'
    );

    setNewUserName('');
    setNewUserEmail('');
    setNewUserPrimaryLocation('Room 102B');
    setNewUserAssignedLabs(['Room 102B']);
    setIsAddUserModalOpen(false);
  };

  const openAssignLabsModal = (targetUser: ManagedUser) => {
    if (!isAdmin) {
      showToast(
        'Permission denied: Only Administrators can configure lab room scopes.',
        'error'
      );
      return;
    }
    setSelectedUserForLabs(targetUser);

    const currentLabs =
      targetUser.assignedLabs && targetUser.assignedLabs.length > 0
        ? targetUser.assignedLabs
        : ['Room 102B'];

    setTempAssignedLabs(currentLabs);
    setIsAssignLabsModalOpen(true);
  };

  const handleSaveAssignedLabs = () => {
    if (!selectedUserForLabs || !isAdmin) {
      showToast('Permission denied: You do not have authority to modify laboratory scopes.', 'error');
      return;
    }

    const finalLabs = tempAssignedLabs.length > 0 ? tempAssignedLabs : ['Room 102B'];
    updateUserAssignedLabs(selectedUserForLabs.id, finalLabs);

    showToast(
      `Updated lab scope for ${selectedUserForLabs.name}: [${finalLabs.join(', ')}]`,
      'success'
    );

    setIsAssignLabsModalOpen(false);
    setSelectedUserForLabs(null);
  };

  const toggleLabInTemp = (roomCode: string) => {
    if (roomCode === 'all') {
      if (tempAssignedLabs.includes('all')) {
        setTempAssignedLabs(['Room 102B']);
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
        subtitle="Manage Faculty Personnel, Administrator Roles, and Laboratory Room Scopes"
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
              Configure personnel roles and laboratory station scopes. Changes apply immediately to active sessions.
            </p>
          </div>

          {isAdmin && (
            <button
              type="button"
              onClick={() => {
                setNewUserRole('Faculty Lecturer');
                setNewUserPrimaryLocation('Room 102B');
                setNewUserAssignedLabs(['Room 102B']);
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
              {isAdmin ? 'Select a role dropdown to instantly change permissions' : 'Authorized Department Roster'}
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
                        ) : u.assignedLabs && u.assignedLabs.length > 0 ? (
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
                        )}

                        {/* Button to edit lab assignments (Admin Only) */}
                        {isAdmin && (
                          <button
                            type="button"
                            onClick={() => openAssignLabsModal(u)}
                            className="inline-flex items-center gap-1 text-[10px] font-semibold px-2.5 py-0.5 rounded transition-colors cursor-pointer ml-1 text-neutral-600 hover:text-neutral-900 bg-neutral-100 hover:bg-neutral-200 border border-neutral-200"
                            title="Configure authorized lab classrooms"
                          >
                            <Sliders className="w-2.5 h-2.5" />
                            <span>Assign Labs</span>
                          </button>
                        )}
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
                  Provision institutional credentials and laboratory station assignments
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

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Authorized Laboratory Scope
                </label>
                <Dropdown
                  value={newUserPrimaryLocation}
                  options={locationOptions}
                  onChange={(val) => {
                    setNewUserPrimaryLocation(val);
                    if (val !== 'custom' && val !== 'all') {
                      setNewUserAssignedLabs([val]);
                    }
                  }}
                  className="w-full"
                />
              </div>

              {newUserPrimaryLocation === 'custom' && (
                <div className="p-3 bg-neutral-50 rounded border border-neutral-200 space-y-1.5 max-h-40 overflow-y-auto">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 block mb-1">
                    Select Multiple Laboratories:
                  </span>
                  {locations.map((loc) => {
                    const isChecked = newUserAssignedLabs.includes(loc.room);
                    return (
                      <label
                        key={loc.id}
                        className="flex items-center justify-between text-xs p-1.5 rounded hover:bg-neutral-100 cursor-pointer"
                      >
                        <span className="text-neutral-700">
                          {loc.name} ({loc.room})
                        </span>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {
                            if (isChecked) {
                              setNewUserAssignedLabs(
                                newUserAssignedLabs.filter((r) => r !== loc.room)
                              );
                            } else {
                              setNewUserAssignedLabs([...newUserAssignedLabs, loc.room]);
                            }
                          }}
                          className="rounded text-neutral-900 focus:ring-neutral-900"
                        />
                      </label>
                    );
                  })}
                </div>
              )}

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

      {/* Assign Laboratories Modal */}
      {isAssignLabsModalOpen && selectedUserForLabs && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white rounded-lg border border-neutral-200 max-w-lg w-full p-5 shadow-xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100 mb-4">
              <div>
                <h3 className="text-sm font-bold text-neutral-900">
                  Assign Laboratories Scope
                </h3>
                <p className="text-xs text-neutral-500">
                  Managing authorized laboratory rooms for <span className="font-semibold text-neutral-900">{selectedUserForLabs.name}</span>
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsAssignLabsModalOpen(false);
                  setSelectedUserForLabs(null);
                }}
                className="text-neutral-400 hover:text-neutral-700 p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              <label className="flex items-center gap-2 p-2.5 rounded border border-neutral-200 bg-neutral-50 hover:bg-neutral-100/70 cursor-pointer">
                <input
                  type="checkbox"
                  checked={tempAssignedLabs.includes('all')}
                  onChange={() => toggleLabInTemp('all')}
                  className="rounded text-neutral-900 focus:ring-neutral-900"
                />
                <div>
                  <div className="text-xs font-bold text-neutral-900">All Laboratories (Universal Access)</div>
                  <div className="text-[10px] text-neutral-500">Universal access across all current and future laboratory facilities</div>
                </div>
              </label>

              {!tempAssignedLabs.includes('all') && (
                <div className="space-y-1.5 max-h-60 overflow-y-auto p-2 bg-neutral-50/70 rounded border border-neutral-200">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 block px-1 mb-1">
                    Select Authorized Classrooms ({locations.length})
                  </span>
                  {locations.map((loc) => {
                    const isChecked = tempAssignedLabs.includes(loc.room);
                    return (
                      <label
                        key={loc.id}
                        className={`flex items-center justify-between p-2 rounded border transition-colors cursor-pointer ${
                          isChecked
                            ? 'bg-blue-50/80 border-blue-300 text-blue-900'
                            : 'bg-white border-neutral-200 text-neutral-700 hover:bg-neutral-100/60'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleLabInTemp(loc.room)}
                            className="rounded text-blue-600 focus:ring-blue-500 shrink-0"
                          />
                          <div className="min-w-0">
                            <div className="text-xs font-bold truncate">
                              {loc.name} ({loc.room})
                            </div>
                            <div className="text-[10px] text-neutral-500 truncate">
                              {loc.building} • {loc.description || loc.name}
                            </div>
                          </div>
                        </div>
                        {isChecked && (
                          <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 bg-blue-100/70 px-1.5 py-0.5 rounded font-mono shrink-0">
                            Assigned
                          </span>
                        )}
                      </label>
                    );
                  })}
                </div>
              )}

              <div className="flex items-center justify-between pt-3 border-t border-neutral-100 mt-2">
                <div className="text-[11px] text-neutral-500">
                  Selected scope:{' '}
                  <span className="font-mono font-bold text-neutral-900">
                    {tempAssignedLabs.includes('all') ? 'All Labs (Universal)' : tempAssignedLabs.join(', ')}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsAssignLabsModalOpen(false);
                      setSelectedUserForLabs(null);
                    }}
                    className="px-3 py-1.5 text-xs font-medium text-neutral-600 hover:text-neutral-900 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveAssignedLabs}
                    className="px-4 py-1.5 text-xs font-semibold text-white bg-neutral-900 hover:bg-neutral-800 rounded cursor-pointer shadow-xs"
                  >
                    Save Laboratory Scope
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
