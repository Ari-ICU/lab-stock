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
  UserCheck,
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
  const isLecturer = user?.roleBadge === 'Lecturer' || user?.role === 'Faculty Lecturer';
  const isAssistant = user?.roleBadge === 'Lab Assistant' || user?.role === 'Lab Assistant';

  // Find which specific Faculty Lecturer manages the laboratory where this assistant is stationed
  const getSupervisorsForAssistant = (assistant: ManagedUser): ManagedUser[] => {
    if (assistant.roleBadge !== 'Lab Assistant' && assistant.role !== 'Lab Assistant') {
      return [];
    }
    const lecturers = managedUsers.filter(
      (u) => u.roleBadge === 'Lecturer' || u.role === 'Faculty Lecturer'
    );
    if (assistant.supervisedBy) {
      const supLower = assistant.supervisedBy.toLowerCase();
      const explicit = lecturers.filter(
        (l) => supLower.includes(l.name.toLowerCase()) || l.name.toLowerCase().includes(supLower)
      );
      if (explicit.length > 0) return explicit;
    }
    const assistantRooms = assistant.assignedLabs || [];
    // Find lecturers who manage at least one room assigned to this assistant
    const matches = lecturers.filter((l) =>
      (l.assignedLabs || []).some((room) => assistantRooms.includes(room))
    );
    return matches.length > 0 ? matches : lecturers.slice(0, 1);
  };

  const getAssistantSupervisorScope = (target: ManagedUser | null) => {
    if (!target) return null;
    const targetIsAssistant = target.roleBadge === 'Lab Assistant' || target.role === 'Lab Assistant';
    if (!targetIsAssistant) return null;
    const supervisors = getSupervisorsForAssistant(target);
    const supervisor = supervisors[0];
    const rooms = supervisor?.assignedLabs && supervisor.assignedLabs.length > 0
      ? supervisor.assignedLabs
      : (isLecturer ? (user?.assignedLabs || ['Room 102B', 'Room 206']) : ['Room 102B', 'Room 206']);
    return { supervisor, rooms };
  };

  const canManageUserLabs = (targetUser: ManagedUser) => {
    if (isAdmin) return true;
    if (isLecturer && (targetUser.roleBadge === 'Lab Assistant' || targetUser.role === 'Lab Assistant')) {
      // ONLY allow the lecturer who actively manages the lab room where this assistant is stationed
      const lecturerRooms = user?.assignedLabs || [];
      const assistantRooms = targetUser.assignedLabs || [];
      return assistantRooms.some((room) => lecturerRooms.includes(room));
    }
    return false;
  };

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

  const lecturerLocationOptions = React.useMemo(() => {
    const lecturerRooms = user?.assignedLabs || ['Room 102B', 'Room 206'];
    const opts = locations
      .filter((loc) => lecturerRooms.includes(loc.room))
      .map((loc) => ({
        label: `${loc.name} (${loc.room}) • ${loc.building}`,
        value: loc.room,
      }));

    if (lecturerRooms.length > 1) {
      opts.push({
        label: `+ Multi-Room Scope (${lecturerRooms.join(', ')})`,
        value: 'custom',
      });
    }
    return opts.length > 0 ? opts : [{ label: 'Room 102B', value: 'Room 102B' }];
  }, [locations, user?.assignedLabs]);

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
    if (!isAdmin && !isLecturer) {
      showToast('Permission denied: You do not have authority to register operators.', 'error');
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

    const effectiveRole = isLecturer ? 'Lab Assistant' : newUserRole;
    const roleDef = ROLE_DEFINITIONS[effectiveRole] || ROLE_DEFINITIONS['Lab Assistant'];

    let targetDept = 'Engineering Block A - Room 102B';
    let assignedLabsToSave: string[] = ['Room 102B'];

    if (isLecturer) {
      const lecturerRooms = user?.assignedLabs || ['Room 102B', 'Room 206'];
      if (newUserPrimaryLocation === 'custom') {
        assignedLabsToSave = newUserAssignedLabs.filter((r) => lecturerRooms.includes(r));
        if (assignedLabsToSave.length === 0) assignedLabsToSave = [lecturerRooms[0]];
      } else {
        assignedLabsToSave = lecturerRooms.includes(newUserPrimaryLocation)
          ? [newUserPrimaryLocation]
          : [lecturerRooms[0]];
      }
      const matched = locations.filter((l) => assignedLabsToSave.includes(l.room));
      targetDept =
        matched.length > 0
          ? matched.map((l) => `${l.building} • ${l.room}`).join(', ')
          : `Engineering Block A - ${assignedLabsToSave.join(', ')}`;
    } else {
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

    if (isLecturer) {
      showToast(
        `Registered ${newUserName.trim()} as Lab Assistant for ${assignedLabsToSave.join(
          ', '
        )} under your supervision`,
        'success'
      );
    } else {
      showToast(
        `Added ${newUserName.trim()} as ${roleDef.badge} (${assignedLabsToSave.join(', ')})`,
        'success'
      );
    }

    setNewUserName('');
    setNewUserEmail('');
    setNewUserPrimaryLocation(isLecturer ? user?.assignedLabs?.[0] || 'Room 102B' : 'Room 102B');
    setNewUserAssignedLabs(isLecturer ? [user?.assignedLabs?.[0] || 'Room 102B'] : ['Room 102B']);
    setIsAddUserModalOpen(false);
  };

  const openAssignLabsModal = (targetUser: ManagedUser) => {
    if (!canManageUserLabs(targetUser)) {
      showToast(
        'Permission denied: You do not have authority to configure this user’s lab assignments.',
        'error'
      );
      return;
    }
    setSelectedUserForLabs(targetUser);

    const currentLabs =
      targetUser.assignedLabs && targetUser.assignedLabs.length > 0
        ? targetUser.assignedLabs
        : ['Room 102B'];

    const assistantScope = getAssistantSupervisorScope(targetUser);
    if (isLecturer) {
      // For lecturers, only allow selection within the lecturer's managed laboratories
      const lecturerRooms = user?.assignedLabs || ['Room 102B', 'Room 206'];
      const validCurrent = currentLabs.filter((r) => lecturerRooms.includes(r));
      setTempAssignedLabs(validCurrent.length > 0 ? validCurrent : [lecturerRooms[0]]);
    } else if (assistantScope) {
      // For assistants, strictly align with supervisor's handled rooms
      const validCurrent = currentLabs.filter((r) => assistantScope.rooms.includes(r));
      setTempAssignedLabs(validCurrent.length > 0 ? validCurrent : assistantScope.rooms);
    } else {
      setTempAssignedLabs(currentLabs);
    }

    setIsAssignLabsModalOpen(true);
  };

  const handleSaveAssignedLabs = () => {
    if (!selectedUserForLabs || !canManageUserLabs(selectedUserForLabs)) {
      showToast('Permission denied: You do not have authority to modify laboratory scopes.', 'error');
      return;
    }

    const assistantScope = getAssistantSupervisorScope(selectedUserForLabs);
    if (isLecturer || assistantScope) {
      const allowedRooms = isLecturer ? (user?.assignedLabs || []) : (assistantScope?.rooms || []);
      if (tempAssignedLabs.length === 0) {
        showToast('Please assign this assistant to at least one of their supervisor’s laboratories.', 'warning');
        return;
      }
      if (tempAssignedLabs.includes('all')) {
        showToast('Lab assistants cannot be granted universal access.', 'error');
        return;
      }
      const hasInvalidRoom = tempAssignedLabs.some((r) => !allowedRooms.includes(r));
      if (hasInvalidRoom) {
        showToast(
          `Assistant can only be assigned to supervising lecturer's laboratories (${allowedRooms.join(', ')}).`,
          'error'
        );
        return;
      }
    }

    const finalLabs = tempAssignedLabs.length > 0 ? tempAssignedLabs : ['Room 102B'];
    updateUserAssignedLabs(selectedUserForLabs.id, finalLabs);

    if (isLecturer) {
      showToast(
        `Relocated Lab Assistant ${selectedUserForLabs.name} to [${finalLabs.join(
          ', '
        )}] under your supervision`,
        'success'
      );
    } else {
      showToast(
        `Updated lab scope for ${selectedUserForLabs.name}: [${finalLabs.join(', ')}]`,
        'success'
      );
    }

    setIsAssignLabsModalOpen(false);
    setSelectedUserForLabs(null);
  };

  const toggleLabInTemp = (roomCode: string) => {
    const assistantScope = getAssistantSupervisorScope(selectedUserForLabs);
    if (isLecturer || assistantScope) {
      const allowedRooms = isLecturer ? (user?.assignedLabs || []) : (assistantScope?.rooms || []);
      if (!allowedRooms.includes(roomCode)) {
        showToast(
          `Room ${roomCode} is outside supervising lecturer's managed laboratories (${allowedRooms.join(', ')})`,
          'warning'
        );
        return;
      }
      if (tempAssignedLabs.includes(roomCode)) {
        if (tempAssignedLabs.length === 1) {
          showToast('Assistant must remain assigned to at least one laboratory.', 'warning');
          return;
        }
        setTempAssignedLabs(tempAssignedLabs.filter((r) => r !== roomCode));
      } else {
        setTempAssignedLabs([...tempAssignedLabs, roomCode]);
      }
      return;
    }

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
    showToast(`Removed ${userName} from laboratory operators`, 'info');
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

  if (isAssistant) {
    return (
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-neutral-50/50">
        <Header
          title="Access Restricted"
          subtitle="User & Role Management is restricted to Faculty Administrators and Lecturers"
          showExport={false}
          showAction={false}
        />
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-white border border-neutral-200 rounded-lg p-6 text-center shadow-xs">
            <div className="w-12 h-12 rounded-full bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto mb-4">
              <Lock className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-neutral-900 mb-1">
              Access Restricted
            </h3>
            <p className="text-xs text-neutral-500 mb-6 leading-relaxed">
              Lab Assistants do not have administrative permissions to view or modify institutional user roles and lab supervisory scopes.
            </p>
            <Link
              href="/"
              className="inline-flex items-center justify-center px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-semibold rounded transition-colors"
            >
              Return to Overview
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-neutral-50/50">
      <Header
        title="User & Role Management"
        subtitle="Manage Faculty Personnel, Lab Scopes, and Delegated Assistant Allocation"
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
              <span className="text-xs text-neutral-400">Department Laboratories Personnel</span>
            </div>
            <h2 className="text-base font-bold text-neutral-900">
              Laboratory User & Role Management
            </h2>
            <p className="text-xs text-neutral-500 mt-1 max-w-xl">
              Configure personnel roles, laboratory station allocations, and supervisory delegation scopes. Changes apply immediately to active sessions.
            </p>
          </div>

          {(isAdmin || isLecturer) && (
            <button
              type="button"
              onClick={() => {
                if (isLecturer) {
                  setNewUserRole('Lab Assistant');
                  const firstLab = user?.assignedLabs?.[0] || 'Room 102B';
                  setNewUserPrimaryLocation(firstLab);
                  setNewUserAssignedLabs([firstLab]);
                }
                setIsAddUserModalOpen(true);
              }}
              className={`flex items-center gap-2 text-xs font-semibold px-3.5 py-2 rounded transition-colors cursor-pointer shrink-0 shadow-xs ${
                isLecturer
                  ? 'bg-blue-600 hover:bg-blue-700 text-white'
                  : 'bg-neutral-900 hover:bg-neutral-800 text-white'
              }`}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{isLecturer ? 'Add Lab Assistant' : 'Add Operator'}</span>
            </button>
          )}
        </div>

        {/* Non-Admin Restriction / Supervisory Alert Banner */}
        {!isAdmin && isLecturer && (
          <div className="p-4 bg-blue-50/90 border border-blue-200 rounded-lg flex items-start gap-3 shadow-2xs">
            <Building className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
            <div className="text-xs text-blue-900 leading-relaxed">
              <span className="font-bold">Faculty Lecturer Supervisory Scope:</span> You manage{' '}
              <span className="font-mono font-bold text-blue-950">
                {user?.assignedLabs?.join(', ') || 'Room 102B, Room 206'}
              </span>
              . Under your supervisory authority (ក្រោមការគ្រប់គ្រង់របស់គ្រូ), you can relocate and assign Lab Assistants assisting within your laboratories, as well as register new Lab Assistants for your lab. Modifying user roles and account deletions remain restricted exclusively to Primary Administrators.
            </div>
          </div>
        )}

        {!isAdmin && !isLecturer && (
          <div className="p-4 bg-amber-50/90 border border-amber-200 rounded-lg flex items-start gap-3 shadow-2xs">
            <Shield className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <div className="text-xs text-amber-900 leading-relaxed">
              <span className="font-bold">Read-Only Personnel Directory:</span> You are currently signed in as{' '}
              <span className="font-semibold text-neutral-900">{user?.name} (Lab Assistant)</span>. Lab assistants operate under faculty lecturer supervision and cannot modify user permissions, relocate personnel, or delete accounts.
            </div>
          </div>
        )}

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

                      {/* Supervisor Hierarchy Badge for Assistants with Lecturer's Exact Name */}
                      {u.roleBadge === 'Lab Assistant' && (() => {
                        const supervisors = getSupervisorsForAssistant(u);
                        const supervisorNames = supervisors.map((s) => s.name).join(', ') || 'Thoeurn Ratha';
                        const isUnderCurrentLecturer =
                          isLecturer && supervisors.some((s) => s.id === user?.id || s.email === user?.email);

                        return (
                          <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                            <span
                              className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-0.5 rounded border shadow-2xs ${
                                isUnderCurrentLecturer
                                  ? 'text-blue-900 bg-blue-50 border-blue-300'
                                  : 'text-indigo-900 bg-indigo-50/80 border-indigo-200'
                              }`}
                            >
                              <UserCheck
                                className={`w-3 h-3 ${isUnderCurrentLecturer ? 'text-blue-600' : 'text-indigo-600'}`}
                              />
                              <span>
                                <strong className="font-bold">Supervised by:</strong> {supervisorNames} (Faculty Lecturer)
                              </span>
                              {isUnderCurrentLecturer && (
                                <span className="text-[9px] font-bold bg-blue-600 text-white px-1.5 py-0.2 rounded font-mono ml-0.5">
                                  UNDER YOUR LAB
                                </span>
                              )}
                            </span>
                          </div>
                        );
                      })()}

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

                        {/* Button to edit lab assignments (Admin or Supervising Lecturer) */}
                        {canManageUserLabs(u) && (
                          <button
                            type="button"
                            onClick={() => openAssignLabsModal(u)}
                            className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2.5 py-0.5 rounded transition-colors cursor-pointer ml-1 ${
                              isLecturer
                                ? 'text-blue-700 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 border border-blue-200'
                                : 'text-neutral-600 hover:text-neutral-900 bg-neutral-100 hover:bg-neutral-200'
                            }`}
                            title={
                              isLecturer
                                ? 'Relocate assistant across your supervised laboratories'
                                : 'Assign or modify authorized laboratory rooms'
                            }
                          >
                            {isLecturer ? (
                              <>
                                <Building className="w-2.5 h-2.5 text-blue-600" />
                                <span>Relocate Assistant</span>
                              </>
                            ) : (
                              <>
                                <Sliders className="w-2.5 h-2.5 text-neutral-500" />
                                <span>Assign Labs</span>
                              </>
                            )}
                          </button>
                        )}
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

                    {/* Interactive Role Switcher Dropdown (Admin) or Locked Badge (Non-Admin) */}
                    {isAdmin ? (
                      <div className="w-56 shrink-0">
                        <Dropdown
                          value={u.role}
                          options={roleOptions}
                          onChange={(newRole) => handleRoleChange(u.id, newRole)}
                          className="w-full"
                          buttonClassName="py-1.5 px-2.5 text-xs font-semibold text-neutral-900 bg-white border-neutral-300 rounded hover:border-neutral-900"
                        />
                      </div>
                    ) : (
                      <div className="w-56 shrink-0 flex items-center justify-end">
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold border ${getRoleBadgeStyle(
                            u.roleBadge
                          )}`}
                          title="Role permissions are managed exclusively by Primary Administrators"
                        >
                          <Lock className="w-3 h-3 opacity-60" />
                          <span>{u.role}</span>
                        </span>
                      </div>
                    )}

                    {/* Delete User Button (Admin Only) */}
                    {isAdmin && (
                      <button
                        type="button"
                        onClick={() => handleDeleteUser(u.id, u.name)}
                        disabled={u.id === user?.id || u.roleBadge === 'Admin'}
                        className={`p-1.5 rounded transition-colors ${
                          u.id === user?.id || u.roleBadge === 'Admin'
                            ? 'text-neutral-300 cursor-not-allowed'
                            : 'text-neutral-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer'
                        }`}
                        title={
                          u.id === user?.id
                            ? 'Cannot delete active session'
                            : u.roleBadge === 'Admin'
                            ? 'Cannot delete primary administrator'
                            : 'Remove user privileges'
                        }
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

      {/* ================= ADD OPERATOR / LAB ASSISTANT MODAL ================= */}
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
              <div
                className={`w-9 h-9 rounded flex items-center justify-center ${
                  isLecturer
                    ? 'bg-blue-50 border border-blue-200 text-blue-700'
                    : 'bg-emerald-50 border border-emerald-200 text-emerald-700'
                }`}
              >
                {isLecturer ? <Building className="w-5 h-5" /> : <Users className="w-5 h-5" />}
              </div>
              <div>
                <h3 className="text-sm font-bold text-neutral-900">
                  {isLecturer ? 'Register Lab Assistant' : 'Register Lab Operator'}
                </h3>
                <p className="text-xs text-neutral-500">
                  {isLecturer
                    ? `Onboard an assistant under your supervision (${user?.name})`
                    : 'Assign user privileges and laboratory location'}
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
                  placeholder="e.g. chan.vicheka@rupp.edu.kh"
                  className="w-full bg-white border border-neutral-300 text-neutral-900 text-xs px-3 py-2 rounded focus:outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-800 mb-1">
                  Access Role Level
                </label>
                {isLecturer ? (
                  <div className="p-2.5 bg-blue-50/70 border border-blue-200 rounded flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Lock className="w-3.5 h-3.5 text-blue-600" />
                      <span className="text-xs font-bold text-blue-950">Lab Assistant</span>
                    </div>
                    <span className="text-[10px] text-blue-700 font-semibold bg-white border border-blue-200 px-2 py-0.5 rounded font-mono">
                      Supervised by {user?.name}
                    </span>
                  </div>
                ) : (
                  <Dropdown
                    value={newUserRole}
                    options={roleOptions}
                    onChange={(newRole) => {
                      setNewUserRole(newRole);
                      if (newRole === 'Primary Lab Administrator') {
                        setNewUserPrimaryLocation('all');
                        setNewUserAssignedLabs(['all']);
                      } else if (newUserPrimaryLocation === 'all') {
                        setNewUserPrimaryLocation('Room 102B');
                        setNewUserAssignedLabs(['Room 102B']);
                      }
                    }}
                    className="w-full"
                    buttonClassName="py-2 px-3 text-xs font-semibold text-neutral-900 bg-white border-neutral-300 rounded hover:border-neutral-900"
                  />
                )}
                <p className="text-[10px] text-neutral-500 mt-1">
                  {isLecturer
                    ? 'Hardware setup, student lab check-in, and inventory maintenance logging under your direct guidance.'
                    : ROLE_DEFINITIONS[newUserRole]?.description}
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-800 mb-1">
                  Assigned Laboratory Location
                </label>
                <Dropdown
                  value={newUserPrimaryLocation}
                  options={isLecturer ? lecturerLocationOptions : locationOptions}
                  onChange={(locVal) => {
                    setNewUserPrimaryLocation(locVal);
                    if (locVal !== 'custom') {
                      setNewUserAssignedLabs([locVal]);
                    }
                  }}
                  className="w-full"
                  buttonClassName="py-2 px-3 text-xs font-semibold text-neutral-900 bg-white border-neutral-300 rounded hover:border-neutral-900"
                />
                <p className="text-[10px] text-neutral-500 mt-1">
                  {newUserPrimaryLocation === 'all'
                    ? 'Universal access across all faculty laboratories.'
                    : newUserPrimaryLocation === 'custom'
                    ? `Multiple authorized laboratories selected below (${(isLecturer
                        ? user?.assignedLabs || []
                        : locations.map((l) => l.room)
                      ).join(', ')}).`
                    : `Scoped exclusively to ${
                        locations.find((l) => l.room === newUserPrimaryLocation)?.name || newUserPrimaryLocation
                      }.`}
                </p>
              </div>

              {newUserPrimaryLocation === 'custom' && (
                <div className="animate-in fade-in duration-150">
                  <label className="block text-xs font-semibold text-neutral-800 mb-1.5">
                    Select Authorized Laboratory Rooms
                  </label>
                  <div className="space-y-1.5 max-h-40 overflow-y-auto p-2.5 bg-neutral-50 rounded border border-neutral-200">
                    {(isLecturer
                      ? locations.filter((loc) => (user?.assignedLabs || []).includes(loc.room))
                      : locations
                    ).map((loc) => {
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
                                const next = newUserAssignedLabs.filter((r) => r !== loc.room);
                                setNewUserAssignedLabs(next.length > 0 ? next : [loc.room]);
                              } else {
                                setNewUserAssignedLabs([...newUserAssignedLabs, loc.room]);
                              }
                            }}
                            className="rounded text-neutral-900 focus:ring-neutral-900 cursor-pointer"
                          />
                          <span className="font-medium">{loc.name}</span>
                          <span className="text-[10px] text-neutral-400 font-mono">({loc.room})</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}

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
                  className={`px-4 py-1.5 text-xs font-semibold text-white rounded transition-colors cursor-pointer shadow-xs ${
                    isLecturer
                      ? 'bg-blue-600 hover:bg-blue-700'
                      : 'bg-neutral-900 hover:bg-neutral-800'
                  }`}
                >
                  {isLecturer ? 'Register Assistant' : 'Save & Register'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= ASSIGN LABORATORIES / RELOCATE ASSISTANT MODAL ================= */}
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
                  {isLecturer
                    ? `Relocate Lab Assistant: ${selectedUserForLabs.name}`
                    : 'Assign Laboratories Scope'}
                </h3>
                <p className="text-xs text-neutral-500">
                  {isLecturer ? (
                    <>
                      Supervised under <span className="font-semibold text-neutral-900">{user?.name} (Faculty Lecturer)</span>
                    </>
                  ) : (
                    <>
                      Managing access scope for <span className="font-semibold text-neutral-900">{selectedUserForLabs.name}</span>
                    </>
                  )}
                </p>
              </div>
            </div>

            {(() => {
              const assistantScope = getAssistantSupervisorScope(selectedUserForLabs);
              const isTargetLecturer =
                selectedUserForLabs?.roleBadge === 'Lecturer' ||
                selectedUserForLabs?.role === 'Faculty Lecturer';

              return (
                <div className="space-y-4">
                  {isLecturer ? (
                    <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-lg text-xs text-blue-900 space-y-1">
                      <div className="font-bold flex items-center gap-1.5">
                        <Building className="w-3.5 h-3.5 text-blue-600" />
                        <span>Supervisory Delegation (ក្រោមការគ្រប់គ្រង់របស់គ្រូ)</span>
                      </div>
                      <p className="text-[11px] text-blue-700 leading-relaxed">
                        You manage <span className="font-mono font-bold">{user?.assignedLabs?.join(', ') || 'Room 102B, Room 206'}</span>. Select which of your supervised laboratories to station this assistant in.
                      </p>
                    </div>
                  ) : assistantScope ? (
                    <div className="p-3 bg-blue-50/80 border border-blue-200 rounded-lg text-xs text-blue-900 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="font-bold flex items-center gap-1.5">
                          <UserCheck className="w-3.5 h-3.5 text-blue-600" />
                          <span>Supervised by {assistantScope.supervisor?.name || 'Thoeurn Ratha'} (Faculty Lecturer)</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setTempAssignedLabs([...assistantScope.rooms])}
                          className="text-[10px] font-bold text-blue-700 hover:text-blue-900 bg-white border border-blue-300 hover:bg-blue-50 px-2 py-0.5 rounded cursor-pointer transition-colors"
                        >
                          ⚡ Sync All ({assistantScope.rooms.join(', ')})
                        </button>
                      </div>
                      <p className="text-[11px] text-blue-700 leading-relaxed">
                        Supervisor manages: <span className="font-mono font-bold">{assistantScope.rooms.join(', ')}</span>. Lab assistants must strictly operate within their supervising lecturer's managed laboratories.
                      </p>
                    </div>
                  ) : isTargetLecturer ? (
                    <div className="p-3 bg-indigo-50/80 border border-indigo-200 rounded-lg text-xs text-indigo-900 space-y-1">
                      <div className="font-bold flex items-center gap-1.5">
                        <Shield className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Faculty Lecturer Managed Laboratories</span>
                      </div>
                      <p className="text-[11px] text-indigo-700 leading-relaxed">
                        Configuring laboratories managed by {selectedUserForLabs?.name}. Supervised assistants (such as Chan Vicheka) will stay synchronized with these locations.
                      </p>
                    </div>
                  ) : (
                    <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-lg text-xs text-blue-900 space-y-1">
                      <div className="font-bold flex items-center gap-1.5">
                        <Shield className="w-3.5 h-3.5 text-blue-600" />
                        <span>Room-Level Control Guard</span>
                      </div>
                      <p className="text-[11px] text-blue-700 leading-relaxed">
                        Operators can only edit, delete, lend, or transfer equipment located inside their assigned laboratories.
                      </p>
                    </div>
                  )}

                  {/* Universal All Labs Option (Admin Only, Not for Assistants) */}
                  {isAdmin && !assistantScope && (
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
                  )}

                  {!tempAssignedLabs.includes('all') && (
                    <div className="space-y-1.5 max-h-60 overflow-y-auto p-2 bg-neutral-50/70 rounded border border-neutral-200">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 block px-1 mb-1">
                        {isLecturer
                          ? 'Your Managed Laboratories (Eligible for Relocation)'
                          : assistantScope
                          ? `Supervised Laboratories (${assistantScope.rooms.join(', ')})`
                          : `Select Authorized Classrooms (${locations.length})`}
                      </span>
                      {locations.map((loc) => {
                        const isUnderScope = isLecturer
                          ? (user?.assignedLabs || []).includes(loc.room)
                          : assistantScope
                          ? assistantScope.rooms.includes(loc.room)
                          : true;
                        const isChecked = tempAssignedLabs.includes(loc.room);

                        if (!isUnderScope) {
                          return (
                            <div
                              key={loc.id}
                              className="flex items-center justify-between p-2 rounded border border-neutral-200/60 bg-neutral-100/60 text-neutral-400 select-none cursor-not-allowed"
                              title={
                                assistantScope
                                  ? `Outside ${assistantScope.supervisor?.name || 'Supervisor'}'s scope (${assistantScope.rooms.join(', ')})`
                                  : 'This laboratory is managed by other faculty'
                              }
                            >
                              <div className="flex items-center gap-2">
                                <Lock className="w-3 h-3 text-neutral-400" />
                                <span className="text-xs">{loc.name}</span>
                              </div>
                              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-neutral-200/80 text-neutral-500">
                                Outside Scope ({loc.room})
                              </span>
                            </div>
                          );
                        }

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
                  {isLecturer ? 'Confirm Relocation' : 'Apply Lab Scope'}
                </button>
              </div>
            </div>
          );
        })()}
          </div>
        </div>
      )}
    </div>
  );
}

