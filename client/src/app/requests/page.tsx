'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { Header } from '@/components/Header';
import { Dropdown } from '@/components/Dropdown';
import { useStock } from '@/context/StockContext';
import { useAuth } from '@/context/AuthContext';
import { PurchaseRequest } from '@/types';
import {
  ShoppingCart,
  Plus,
  Clock,
  CheckCircle2,
  PackageCheck,
  AlertCircle,
  XCircle,
  Search,
  Building2,
  Tag,
  DollarSign,
  AlertTriangle,
  User,
  Calendar,
  FileText,
  X,
  ChevronRight,
  Eye,
  Check,
  Flame,
  ArrowRight,
} from 'lucide-react';

export default function PurchaseRequestsPage() {
  const { user, canManageLocation } = useAuth();
  const isPrimaryAdmin = user?.role === 'Primary Lab Administrator' || user?.roleBadge === 'Admin';
  const {
    requests,
    locations,
    addPurchaseRequest,
    updatePurchaseRequestStatus,
    deletePurchaseRequest,
    showToast,
  } = useStock();

  // Filters state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');
  const [selectedRoom, setSelectedRoom] = useState<string>('all');

  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedDetails, setSelectedDetails] = useState<PurchaseRequest | null>(null);

  // New Request Form states
  const defaultTargetRoom =
    user?.assignedLabs && user.assignedLabs.length > 0
      ? user.assignedLabs[0]
      : 'Room 102B';

  const [formTitle, setFormTitle] = useState('');
  const [formCategory, setFormCategory] = useState('Networking Equipment');
  const [formTargetRoom, setFormTargetRoom] = useState(defaultTargetRoom);
  const [formQuantity, setFormQuantity] = useState(1);
  const [formUnit, setFormUnit] = useState('Units');
  const [formEstimatedCost, setFormEstimatedCost] = useState('');
  const [formPriority, setFormPriority] = useState<PurchaseRequest['priority']>('medium');
  const [formReason, setFormReason] = useState('');

  // Allowed rooms for creation
  const availableRooms = useMemo(() => {
    if (isPrimaryAdmin) {
      return locations.map((l) => l.room);
    }
    if (user?.assignedLabs && user.assignedLabs.length > 0) {
      return user.assignedLabs;
    }
    return ['Room 102B', 'Room 206'];
  }, [isPrimaryAdmin, user, locations]);

  // Filter requests
  const filteredRequests = useMemo(() => {
    return requests.filter((req) => {
      // Search
      const q = searchTerm.trim().toLowerCase();
      if (q) {
        const matches =
          req.title.toLowerCase().includes(q) ||
          req.id.toLowerCase().includes(q) ||
          req.category.toLowerCase().includes(q) ||
          req.targetRoom.toLowerCase().includes(q) ||
          req.requestedBy.toLowerCase().includes(q) ||
          req.reason.toLowerCase().includes(q) ||
          (req.notes && req.notes.toLowerCase().includes(q));
        if (!matches) return false;
      }

      // Status
      if (selectedStatus !== 'all' && req.status !== selectedStatus) {
        return false;
      }

      // Priority
      if (selectedPriority !== 'all' && req.priority !== selectedPriority) {
        return false;
      }

      // Room
      if (selectedRoom !== 'all') {
        if (selectedRoom === 'my_labs') {
          if (!canManageLocation(req.targetRoom)) return false;
        } else if (req.targetRoom !== selectedRoom) {
          return false;
        }
      }

      return true;
    });
  }, [requests, searchTerm, selectedStatus, selectedPriority, selectedRoom, canManageLocation]);

  // Sort: pending first, then by priority, then by date desc
  const sortedRequests = useMemo(() => {
    const priorityWeights: Record<string, number> = {
      urgent: 4,
      high: 3,
      medium: 2,
      low: 1,
    };

    return [...filteredRequests].sort((a, b) => {
      // Prioritize handled labs
      const aHandled = canManageLocation(a.targetRoom);
      const bHandled = canManageLocation(b.targetRoom);
      if (aHandled && !bHandled) return -1;
      if (!aHandled && bHandled) return 1;

      // Prioritize pending status
      if (a.status === 'pending' && b.status !== 'pending') return -1;
      if (a.status !== 'pending' && b.status === 'pending') return 1;

      // Prioritize urgency
      const pDiff = (priorityWeights[b.priority] || 0) - (priorityWeights[a.priority] || 0);
      if (pDiff !== 0) return pDiff;

      return b.requestDate.localeCompare(a.requestDate);
    });
  }, [filteredRequests, canManageLocation]);

  // Metrics
  const totalCount = requests.length;
  const pendingCount = requests.filter((r) => r.status === 'pending').length;
  const inProcurementCount = requests.filter((r) => r.status === 'approved' || r.status === 'ordered').length;
  const fulfilledCount = requests.filter((r) => r.status === 'fulfilled').length;

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formTitle.trim()) {
      showToast('Please enter an item title or description.', 'error');
      return;
    }
    if (!formReason.trim()) {
      showToast('Please provide a justification / reason for this purchase request.', 'error');
      return;
    }

    if (!canManageLocation(formTargetRoom)) {
      showToast(`Action restricted: ${formTargetRoom} is outside your laboratory supervisory scope.`, 'error');
      return;
    }

    const created = addPurchaseRequest({
      title: formTitle.trim(),
      category: formCategory,
      targetRoom: formTargetRoom,
      quantity: Number(formQuantity) || 1,
      unit: formUnit,
      estimatedCost: formEstimatedCost ? (formEstimatedCost.startsWith('$') ? formEstimatedCost : `$${formEstimatedCost}`) : undefined,
      priority: formPriority,
      reason: formReason.trim(),
      requestedBy: user?.name || 'Thoeurn Ratha',
      requesterRole: user?.roleBadge || user?.role || 'Faculty Lecturer',
    });

    setIsCreateModalOpen(false);
    setFormTitle('');
    setFormReason('');
    setFormEstimatedCost('');
    setFormQuantity(1);
  };

  const handleStatusChange = (req: PurchaseRequest, newStatus: PurchaseRequest['status'], note?: string) => {
    if (!isPrimaryAdmin && req.requestedBy !== user?.name) {
      showToast('Only Primary Lab Administrators can alter procurement statuses for other users.', 'error');
      return;
    }
    updatePurchaseRequestStatus(req.id, newStatus, note);
    if (selectedDetails && selectedDetails.id === req.id) {
      setSelectedDetails({ ...selectedDetails, status: newStatus, notes: note || selectedDetails.notes });
    }
  };

  return (
    <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-neutral-50/50">
      {/* 1. Header */}
      <Header
        title="Purchase & Procurement Requisitions"
        subtitle="/ Request to Buy Laboratory Supplies, Hardware Equipment & Consumables"
        actions={
          <button
            onClick={() => {
              setFormTargetRoom(availableRooms[0] || 'Room 102B');
              setIsCreateModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-neutral-900 hover:bg-neutral-800 rounded-lg transition-colors shadow-xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-emerald-400" />
            <span>+ Request to Buy</span>
          </button>
        }
      />

      <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6 max-w-8xl w-full mx-auto">
        {/* 2. KPI Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-white border border-neutral-200/90 rounded-2xl p-4 shadow-xs">
            <div className="flex items-center justify-between text-neutral-500 mb-1">
              <span className="text-xs font-medium">Total Requisitions</span>
              <div className="w-7 h-7 rounded-lg bg-neutral-100 text-neutral-700 flex items-center justify-center">
                <ShoppingCart className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-bold text-neutral-900 mt-1">
              {totalCount} <span className="text-xs font-normal text-neutral-500">items</span>
            </div>
            <div className="text-[11px] text-neutral-500 mt-1">All department requests</div>
          </div>

          <div className="bg-white border border-neutral-200/90 rounded-2xl p-4 shadow-xs">
            <div className="flex items-center justify-between text-neutral-500 mb-1">
              <span className="text-xs font-medium">Pending Approval</span>
              <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-bold text-amber-700 mt-1">
              {pendingCount} <span className="text-xs font-normal text-neutral-500">pending</span>
            </div>
            <div className="text-[11px] text-neutral-500 mt-1">Awaiting director sign-off</div>
          </div>

          <div className="bg-white border border-neutral-200/90 rounded-2xl p-4 shadow-xs">
            <div className="flex items-center justify-between text-neutral-500 mb-1">
              <span className="text-xs font-medium">In Procurement</span>
              <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                <Tag className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-bold text-blue-700 mt-1">
              {inProcurementCount} <span className="text-xs font-normal text-neutral-500">ordered</span>
            </div>
            <div className="text-[11px] text-neutral-500 mt-1">Approved & vendor PO issued</div>
          </div>

          <div className="bg-white border border-neutral-200/90 rounded-2xl p-4 shadow-xs">
            <div className="flex items-center justify-between text-neutral-500 mb-1">
              <span className="text-xs font-medium">Fulfilled & Received</span>
              <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <PackageCheck className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-bold text-emerald-700 mt-1">
              {fulfilledCount} <span className="text-xs font-normal text-neutral-500">delivered</span>
            </div>
            <div className="text-[11px] text-neutral-500 mt-1">Stocked in laboratory</div>
          </div>
        </div>

        {/* 3. Supervisory Authority Notice */}
        <div className="bg-blue-50/70 border border-blue-200/80 rounded-xl p-3.5 flex items-start gap-3 text-xs text-blue-900">
          <Building2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            {isPrimaryAdmin ? (
              <span>
                <strong>Primary Administrator Authority:</strong> You possess universal approval, purchasing, and fulfillment authority across all 7 faculty laboratories.
              </span>
            ) : (
              <span>
                <strong>{user?.roleBadge || user?.role || 'Faculty Lecturer'} Scope:</strong> You are assigned to manage{' '}
                <strong className="text-neutral-900 font-semibold">
                  {user?.assignedLabs?.join(', ') || 'Room 102B, Room 206'}
                </strong>.
                You can note and submit purchase requisitions for equipment and consumables for your laboratories. Requests are routed to Department Administration for budget approval.
              </span>
            )}
          </div>
        </div>

        {/* 4. Filter Toolbar */}
        <div className="bg-white border border-neutral-200/90 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2 flex-1 min-w-[240px]">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search requisitions, items, rooms, or requester..."
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-neutral-50 border border-neutral-200 rounded-lg focus:outline-none focus:border-neutral-900 focus:bg-white transition-colors"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Status Dropdown */}
            <Dropdown
              value={selectedStatus}
              onChange={setSelectedStatus}
              options={[
                { value: 'all', label: 'All Statuses' },
                { value: 'pending', label: '⏳ Pending Approval' },
                { value: 'approved', label: '✓ Approved' },
                { value: 'ordered', label: '📦 Ordered' },
                { value: 'fulfilled', label: '🎉 Fulfilled' },
                { value: 'rejected', label: '✕ Rejected' },
              ]}
              buttonClassName="py-1.5 text-xs"
            />

            {/* Priority Dropdown */}
            <Dropdown
              value={selectedPriority}
              onChange={setSelectedPriority}
              options={[
                { value: 'all', label: 'All Priorities' },
                { value: 'urgent', label: '🔥 Urgent' },
                { value: 'high', label: '▲ High' },
                { value: 'medium', label: '● Medium' },
                { value: 'low', label: '▽ Low' },
              ]}
              buttonClassName="py-1.5 text-xs"
            />

            {/* Room Filter */}
            <Dropdown
              value={selectedRoom}
              onChange={setSelectedRoom}
              options={[
                { value: 'all', label: 'All Laboratories' },
                { value: 'my_labs', label: '★ My Handled Labs' },
                ...locations.map((l) => ({
                  value: l.room,
                  label: `${l.name} (${l.room})`,
                })),
              ]}
              buttonClassName="py-1.5 text-xs"
            />
          </div>
        </div>

        {/* 5. Requisitions Table */}
        <div className="bg-white border border-neutral-200/90 rounded-2xl overflow-hidden shadow-xs">
          <div className="p-4 border-b border-neutral-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingCart className="w-4 h-4 text-emerald-600" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-700">
                Purchase & Procurement Requisitions ({sortedRequests.length})
              </h2>
            </div>
            <span className="text-[11px] text-neutral-400">
              Showing active procurement requests across laboratories
            </span>
          </div>

          {sortedRequests.length === 0 ? (
            <div className="p-12 text-center text-neutral-400 space-y-3">
              <ShoppingCart className="w-8 h-8 mx-auto text-neutral-300" />
              <div className="font-semibold text-neutral-700 text-sm">No purchase requests found</div>
              <p className="text-xs text-neutral-400 max-w-sm mx-auto">
                No purchase requisition matched the selected filter or query. Click &quot;+ Request to Buy&quot; to note a new purchase requisition.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-neutral-50/70 border-b border-neutral-200 text-neutral-500 font-semibold text-[11px]">
                  <tr>
                    <th className="py-3 px-4">Item & Requisition ID</th>
                    <th className="py-3 px-4">Destination Lab</th>
                    <th className="py-3 px-4">Qty & Est. Cost</th>
                    <th className="py-3 px-4">Priority</th>
                    <th className="py-3 px-4">Requester</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {sortedRequests.map((req) => {
                    const isHandled = canManageLocation(req.targetRoom);

                    return (
                      <tr
                        key={req.id}
                        className={`hover:bg-neutral-50/60 transition-colors ${
                          !isHandled ? 'bg-neutral-50/25 text-neutral-500' : ''
                        }`}
                      >
                        {/* Item & Requisition ID */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-neutral-100 flex items-center justify-center shrink-0">
                              <Tag className="w-4 h-4 text-neutral-600" />
                            </div>
                            <div>
                              <div className="font-semibold text-neutral-900 line-clamp-1">
                                {req.title}
                              </div>
                              <div className="text-[11px] text-neutral-500 flex items-center gap-1.5 mt-0.5">
                                <span className="font-mono font-medium">{req.id}</span>
                                <span>•</span>
                                <span>{req.category}</span>
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Destination Lab */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-1.5">
                            <span className="font-medium text-neutral-800">{req.targetRoom}</span>
                            {isHandled ? (
                              <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-1.5 py-0.2 rounded font-semibold">
                                Handled
                              </span>
                            ) : (
                              <span className="text-[10px] bg-neutral-100 text-neutral-500 border border-neutral-200 px-1.5 py-0.2 rounded">
                                Other Lab
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Qty & Cost */}
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-neutral-900">
                            {req.quantity} {req.unit}
                          </div>
                          <div className="text-[11px] text-neutral-500">
                            {req.estimatedCost ? `Est. ${req.estimatedCost}` : 'Cost pending'}
                          </div>
                        </td>

                        {/* Priority */}
                        <td className="py-3.5 px-4">
                          {req.priority === 'urgent' ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                              <Flame className="w-3 h-3 text-rose-500" /> Urgent
                            </span>
                          ) : req.priority === 'high' ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                              ▲ High
                            </span>
                          ) : req.priority === 'medium' ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                              ● Medium
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-600 border border-neutral-200">
                              ▽ Low
                            </span>
                          )}
                        </td>

                        {/* Requester */}
                        <td className="py-3.5 px-4">
                          <div className="font-medium text-neutral-900">{req.requestedBy}</div>
                          <div className="text-[10px] text-neutral-500">
                            {req.requesterRole} • {req.requestDate}
                          </div>
                        </td>

                        {/* Status */}
                        <td className="py-3.5 px-4">
                          {req.status === 'pending' ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200">
                              <Clock className="w-3 h-3 text-amber-600" /> Pending Review
                            </span>
                          ) : req.status === 'approved' ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-md bg-blue-50 text-blue-800 border border-blue-200">
                              <CheckCircle2 className="w-3 h-3 text-blue-600" /> Approved
                            </span>
                          ) : req.status === 'ordered' ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-md bg-purple-50 text-purple-800 border border-purple-200">
                              <Tag className="w-3 h-3 text-purple-600" /> PO Ordered
                            </span>
                          ) : req.status === 'fulfilled' ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200">
                              <Check className="w-3 h-3 text-emerald-600" /> Stocked / Received
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-md bg-rose-50 text-rose-800 border border-rose-200">
                              <XCircle className="w-3 h-3 text-rose-600" /> Rejected
                            </span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => setSelectedDetails(req)}
                              className="px-2.5 py-1 text-xs font-semibold text-neutral-700 bg-white border border-neutral-200 hover:border-neutral-300 rounded hover:bg-neutral-50 transition-colors cursor-pointer shadow-2xs"
                            >
                              Details
                            </button>

                            {/* Admin Workflow Quick Approvals */}
                            {isPrimaryAdmin && req.status === 'pending' && (
                              <button
                                onClick={() => handleStatusChange(req, 'approved', 'Approved by Laboratory Director.')}
                                className="px-2.5 py-1 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded transition-colors cursor-pointer shadow-2xs"
                              >
                                Approve
                              </button>
                            )}

                            {isPrimaryAdmin && req.status === 'approved' && (
                              <button
                                onClick={() => handleStatusChange(req, 'ordered', 'PO generated and sent to vendor.')}
                                className="px-2.5 py-1 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-700 rounded transition-colors cursor-pointer shadow-2xs"
                              >
                                Order PO
                              </button>
                            )}

                            {isPrimaryAdmin && req.status === 'ordered' && (
                              <button
                                onClick={() => handleStatusChange(req, 'fulfilled', 'Delivered and verified in lab inventory.')}
                                className="px-2.5 py-1 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded transition-colors cursor-pointer shadow-2xs"
                              >
                                Fulfill
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* 6. Create / Note Requisition Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-neutral-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-neutral-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <ShoppingCart className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-neutral-900">Request to Buy / Note Requisition</h3>
                  <p className="text-xs text-neutral-500">Submit procurement requisition for faculty laboratory</p>
                </div>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1 text-neutral-400 hover:text-neutral-600 rounded-lg hover:bg-neutral-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4 pt-4 text-xs">
              {/* Item Title */}
              <div>
                <label className="block font-semibold text-neutral-700 mb-1">
                  Item Description / Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="e.g. Cat6A Patch Cords (Pack of 50) or 4K HDMI Cables"
                  className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-lg focus:outline-none focus:border-neutral-900 focus:bg-white text-xs"
                />
              </div>

              {/* Category & Destination Room */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">Category</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full px-2.5 py-2 bg-neutral-50 border border-neutral-200 rounded-lg focus:outline-none focus:border-neutral-900 focus:bg-white text-xs"
                  >
                    <option value="Networking Equipment">Networking Equipment</option>
                    <option value="Cables & Accessories">Cables & Accessories</option>
                    <option value="Computer Hardware">Computer Hardware</option>
                    <option value="Mice & Keyboards">Mice & Keyboards</option>
                    <option value="Monitors & Displays">Monitors & Displays</option>
                    <option value="Electronics & Tools">Electronics & Tools</option>
                    <option value="Printer Supplies">Printer Supplies</option>
                    <option value="Stationery & Misc">Stationery & Misc</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">
                    Destination Lab Room <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formTargetRoom}
                    onChange={(e) => setFormTargetRoom(e.target.value)}
                    className="w-full px-2.5 py-2 bg-neutral-50 border border-neutral-200 rounded-lg focus:outline-none focus:border-neutral-900 focus:bg-white text-xs"
                  >
                    {availableRooms.map((room) => (
                      <option key={room} value={room}>
                        {room} {canManageLocation(room) ? '(Handled)' : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Quantity, Unit, Estimated Cost */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">Quantity</label>
                  <input
                    type="number"
                    min={1}
                    value={formQuantity}
                    onChange={(e) => setFormQuantity(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-lg focus:outline-none focus:border-neutral-900 focus:bg-white text-xs"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">Unit</label>
                  <select
                    value={formUnit}
                    onChange={(e) => setFormUnit(e.target.value)}
                    className="w-full px-2.5 py-2 bg-neutral-50 border border-neutral-200 rounded-lg focus:outline-none focus:border-neutral-900 focus:bg-white text-xs"
                  >
                    <option value="Units">Units</option>
                    <option value="Boxes">Boxes</option>
                    <option value="Packs">Packs</option>
                    <option value="Rolls">Rolls</option>
                    <option value="Cartridges">Cartridges</option>
                    <option value="Kits">Kits</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">Estimated Cost ($)</label>
                  <input
                    type="text"
                    value={formEstimatedCost}
                    onChange={(e) => setFormEstimatedCost(e.target.value)}
                    placeholder="e.g. 150.00"
                    className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-lg focus:outline-none focus:border-neutral-900 focus:bg-white text-xs"
                  />
                </div>
              </div>

              {/* Priority */}
              <div>
                <label className="block font-semibold text-neutral-700 mb-1">Urgency / Priority</label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { value: 'low', label: 'Low', color: 'border-neutral-200 hover:border-neutral-400' },
                    { value: 'medium', label: 'Medium', color: 'border-blue-200 hover:border-blue-400' },
                    { value: 'high', label: 'High', color: 'border-amber-200 hover:border-amber-400' },
                    { value: 'urgent', label: '🔥 Urgent', color: 'border-rose-200 hover:border-rose-400' },
                  ].map((p) => (
                    <button
                      type="button"
                      key={p.value}
                      onClick={() => setFormPriority(p.value as PurchaseRequest['priority'])}
                      className={`py-1.5 text-center font-medium rounded-lg border transition-all cursor-pointer ${
                        formPriority === p.value
                          ? 'bg-neutral-900 text-white border-neutral-900 font-semibold'
                          : `bg-neutral-50 text-neutral-700 ${p.color}`
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Justification / Reason */}
              <div>
                <label className="block font-semibold text-neutral-700 mb-1">
                  Justification / Purpose <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  value={formReason}
                  onChange={(e) => setFormReason(e.target.value)}
                  placeholder="Explain why this equipment or supply is needed (e.g. laboratory expansion, replacing damaged patch cords, student semester practical exam)..."
                  className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-lg focus:outline-none focus:border-neutral-900 focus:bg-white text-xs"
                />
              </div>

              {/* Requester Info Notice */}
              <div className="bg-neutral-50 border border-neutral-200/80 rounded-lg p-2.5 text-[11px] text-neutral-600 flex items-center justify-between">
                <span>
                  Submitted by: <strong>{user?.name || 'Thoeurn Ratha'}</strong> ({user?.roleBadge || 'Faculty Lecturer'})
                </span>
                <span className="text-neutral-400">{new Date().toISOString().split('T')[0]}</span>
              </div>

              {/* Modal Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-3 py-2 font-semibold text-neutral-600 hover:text-neutral-900 rounded-lg hover:bg-neutral-100 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 font-semibold text-white bg-neutral-900 hover:bg-neutral-800 rounded-lg shadow-xs transition-colors cursor-pointer"
                >
                  Submit Requisition
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 7. Requisition Details Modal */}
      {selectedDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-neutral-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-neutral-100">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-semibold text-neutral-500">{selectedDetails.id}</span>
                  <span
                    className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${
                      selectedDetails.status === 'pending'
                        ? 'bg-amber-50 text-amber-800 border border-amber-200'
                        : selectedDetails.status === 'approved'
                        ? 'bg-blue-50 text-blue-800 border border-blue-200'
                        : selectedDetails.status === 'ordered'
                        ? 'bg-purple-50 text-purple-800 border border-purple-200'
                        : selectedDetails.status === 'fulfilled'
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        : 'bg-rose-50 text-rose-800 border border-rose-200'
                    }`}
                  >
                    {selectedDetails.status}
                  </span>
                </div>
                <h3 className="text-sm font-bold text-neutral-900 mt-1">{selectedDetails.title}</h3>
              </div>
              <button
                onClick={() => setSelectedDetails(null)}
                className="p-1 text-neutral-400 hover:text-neutral-600 rounded-lg hover:bg-neutral-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3.5 py-4 text-xs">
              <div className="grid grid-cols-2 gap-3 bg-neutral-50 p-3 rounded-xl border border-neutral-200/80">
                <div>
                  <span className="text-[10px] text-neutral-500 uppercase font-semibold">Destination Lab</span>
                  <div className="font-bold text-neutral-900 mt-0.5">{selectedDetails.targetRoom}</div>
                </div>
                <div>
                  <span className="text-[10px] text-neutral-500 uppercase font-semibold">Category</span>
                  <div className="font-bold text-neutral-900 mt-0.5">{selectedDetails.category}</div>
                </div>
                <div>
                  <span className="text-[10px] text-neutral-500 uppercase font-semibold">Quantity & Unit</span>
                  <div className="font-bold text-neutral-900 mt-0.5">{selectedDetails.quantity} {selectedDetails.unit}</div>
                </div>
                <div>
                  <span className="text-[10px] text-neutral-500 uppercase font-semibold">Estimated Cost</span>
                  <div className="font-bold text-neutral-900 mt-0.5">{selectedDetails.estimatedCost || 'Unspecified'}</div>
                </div>
              </div>

              <div>
                <span className="text-[10px] text-neutral-500 uppercase font-semibold">Justification / Reason</span>
                <p className="mt-1 p-2.5 bg-neutral-50/80 border border-neutral-200/70 rounded-lg text-neutral-800 leading-relaxed">
                  {selectedDetails.reason}
                </p>
              </div>

              {selectedDetails.notes && (
                <div>
                  <span className="text-[10px] text-neutral-500 uppercase font-semibold">Procurement / Administrative Notes</span>
                  <p className="mt-1 p-2.5 bg-blue-50/50 border border-blue-200/60 rounded-lg text-blue-950 leading-relaxed font-mono text-[11px]">
                    {selectedDetails.notes}
                  </p>
                </div>
              )}

              <div className="text-[11px] text-neutral-500 border-t border-neutral-100 pt-3 flex items-center justify-between">
                <span>Requested by: <strong>{selectedDetails.requestedBy}</strong> ({selectedDetails.requesterRole})</span>
                <span>Date: {selectedDetails.requestDate}</span>
              </div>
            </div>

            {/* Workflow status controls */}
            <div className="border-t border-neutral-100 pt-3 flex items-center justify-between">
              {/* Requester cancel option */}
              {selectedDetails.status === 'pending' && (selectedDetails.requestedBy === user?.name || isPrimaryAdmin) ? (
                <button
                  onClick={() => {
                    deletePurchaseRequest(selectedDetails.id);
                    setSelectedDetails(null);
                  }}
                  className="text-xs font-semibold text-rose-600 hover:text-rose-700 cursor-pointer"
                >
                  Cancel Requisition
                </button>
              ) : <div />}

              <div className="flex items-center gap-2">
                {isPrimaryAdmin && selectedDetails.status === 'pending' && (
                  <>
                    <button
                      onClick={() => handleStatusChange(selectedDetails, 'rejected', 'Rejected by Lab Administration.')}
                      className="px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-lg transition-colors cursor-pointer"
                    >
                      Reject
                    </button>
                    <button
                      onClick={() => handleStatusChange(selectedDetails, 'approved', 'Approved for procurement.')}
                      className="px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors cursor-pointer"
                    >
                      Approve
                    </button>
                  </>
                )}

                {isPrimaryAdmin && selectedDetails.status === 'approved' && (
                  <button
                    onClick={() => handleStatusChange(selectedDetails, 'ordered', 'Purchase Order dispatched.')}
                    className="px-3 py-1.5 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors cursor-pointer"
                  >
                    Mark as Ordered
                  </button>
                )}

                {isPrimaryAdmin && selectedDetails.status === 'ordered' && (
                  <button
                    onClick={() => handleStatusChange(selectedDetails, 'fulfilled', 'Delivered and stocked in laboratory.')}
                    className="px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors cursor-pointer"
                  >
                    Mark as Fulfilled & Received
                  </button>
                )}

                <button
                  onClick={() => setSelectedDetails(null)}
                  className="px-3 py-1.5 text-xs font-semibold text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded-lg transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
