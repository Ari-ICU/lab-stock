'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/Header';
import { Dropdown } from '@/components/Dropdown';
import { LabThumbnail } from '@/components/LabThumbnail';
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
  Edit3,
  Check,
  Flame,
  ArrowRight,
} from 'lucide-react';

export default function PurchaseRequestsPage() {
  const router = useRouter();
  const { user, canManageLocation } = useAuth();
  const isPrimaryAdmin = user?.role === 'Primary Lab Administrator' || user?.roleBadge === 'Admin';
  const {
    requests,
    locations,
    updatePurchaseRequestStatus,
    deletePurchaseRequest,
    showToast,
  } = useStock();

  // Filters state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');
  const [selectedRoom, setSelectedRoom] = useState<string>('all');

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

  const handleStatusChange = (req: PurchaseRequest, newStatus: PurchaseRequest['status'], note?: string) => {
    if (!isPrimaryAdmin && req.requestedBy !== user?.name) {
      showToast('Only Primary Lab Administrators can alter procurement statuses for other users.', 'error');
      return;
    }
    updatePurchaseRequestStatus(req.id, newStatus, note);
  };

  return (
    <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-neutral-50/50">
      {/* 1. Header with Dedicated New Webpage Action */}
      <Header
        title="Purchase & Procurement Requisitions"
        subtitle="/ Request to Buy Laboratory Supplies, Hardware Equipment & Consumables"
        actions={
          <Link
            href="/requests/create"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-neutral-900 hover:bg-neutral-800 rounded-lg transition-colors shadow-xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-emerald-400" />
            <span> Request to Buy</span>
          </Link>
        }
      />

      <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6 w-full">
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
                <strong>Primary Administrator Authority:</strong> You possess universal approval, purchasing, and fulfillment authority across all faculty laboratories.
              </span>
            ) : (
              <span>
                <strong>{user?.roleBadge || user?.role || 'Faculty Lecturer'} Scope:</strong> You manage{' '}
                <strong className="text-neutral-900 font-semibold">
                  {user?.assignedLabs?.join(', ') || 'Room 102B, Room 206'}
                </strong>.
                You can submit purchasing requests for your laboratories. Requests are routed to Department Administration for budget approval.
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
            <Link
              href="/requests/create"
              className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1"
            >
              <span>+ New Requisition Webpage</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {sortedRequests.length === 0 ? (
            <div className="p-12 text-center text-neutral-400 space-y-3">
              <ShoppingCart className="w-8 h-8 mx-auto text-neutral-300" />
              <div className="font-semibold text-neutral-700 text-sm">No purchase requests found</div>
              <p className="text-xs text-neutral-400 max-w-sm mx-auto">
                No purchase requisition matched the selected filter or query.
              </p>
              <Link
                href="/requests/create"
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-neutral-900 hover:bg-neutral-800 rounded-xl transition-colors"
              >
                <Plus className="w-3.5 h-3.5 text-emerald-400" />
                <span>Create Requisition Webpage</span>
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-neutral-50/70 border-b border-neutral-200 text-neutral-500 font-semibold text-[11px]">
                  <tr>
                    <th className="py-3 px-4 w-16">Item Visual</th>
                    <th className="py-3 px-4">Item & Requisition ID</th>
                    <th className="py-3 px-4">Destination Lab</th>
                    <th className="py-3 px-4">Qty & Est. Cost</th>
                    <th className="py-3 px-4">Priority</th>
                    <th className="py-3 px-4">Requester</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Webpage Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {sortedRequests.map((req) => {
                    const isHandled = canManageLocation(req.targetRoom);
                    const canEdit = isPrimaryAdmin || (req.requestedBy === user?.name && req.status === 'pending');

                    return (
                      <tr
                        key={req.id}
                        className={`hover:bg-neutral-50/60 transition-colors ${
                          !isHandled ? 'bg-neutral-50/25 text-neutral-500' : ''
                        }`}
                      >
                        {/* Item Visual Thumbnail */}
                        <td className="py-3 px-4 w-16">
                          <Link
                            href={`/requests/${req.id}`}
                            className="w-12 h-12 rounded-xl border border-neutral-200/90 bg-neutral-100 overflow-hidden flex items-center justify-center shrink-0 hover:border-neutral-400 transition-colors shadow-2xs group"
                            title="Click to view full webpage"
                          >
                            <LabThumbnail
                              src={req.imageUrl}
                              alt={req.title}
                              size="thumb"
                              fallbackType="item"
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                            />
                          </Link>
                        </td>

                        {/* Item & Requisition ID with direct link to details webpage */}
                        <td className="py-3.5 px-4">
                          <Link
                            href={`/requests/${req.id}`}
                            className="block group cursor-pointer"
                          >
                            <div className="font-semibold text-neutral-900 group-hover:text-emerald-700 transition-colors line-clamp-1">
                              {req.title}
                            </div>
                            <div className="text-[11px] text-neutral-500 flex items-center gap-1.5 mt-0.5">
                              <span className="font-mono font-medium">{req.id}</span>
                              <span>•</span>
                              <span>{req.category}</span>
                            </div>
                          </Link>
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

                        {/* Dedicated Webpage Actions */}
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* View Webpage Link */}
                            <Link
                              href={`/requests/${req.id}`}
                              className="px-2.5 py-1 text-xs font-semibold text-neutral-700 bg-white border border-neutral-200 hover:border-neutral-300 rounded hover:bg-neutral-50 transition-colors cursor-pointer shadow-2xs inline-flex items-center gap-1"
                            >
                              <Eye className="w-3 h-3 text-neutral-500" />
                              <span>View</span>
                            </Link>

                            {/* Edit Webpage Link */}
                            {canEdit && (
                              <Link
                                href={`/requests/${req.id}/edit`}
                                className="px-2.5 py-1 text-xs font-semibold text-neutral-900 bg-white border border-neutral-300 hover:border-neutral-400 rounded hover:bg-neutral-50 transition-colors cursor-pointer shadow-2xs inline-flex items-center gap-1"
                              >
                                <Edit3 className="w-3 h-3 text-blue-600" />
                                <span>Edit</span>
                              </Link>
                            )}

                            {/* Admin Quick Workflow Buttons */}
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
    </div>
  );
}
