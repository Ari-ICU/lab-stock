'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { Header } from '@/components/Header';
import { LabThumbnail } from '@/components/LabThumbnail';
import { useStock } from '@/context/StockContext';
import { useAuth } from '@/context/AuthContext';
import { PurchaseRequest } from '@/types';
import {
  ArrowLeft,
  ShoppingCart,
  Edit3,
  Trash2,
  CheckCircle2,
  Clock,
  PackageCheck,
  XCircle,
  Building2,
  Tag,
  DollarSign,
  AlertTriangle,
  User,
  Calendar,
  FileText,
  Flame,
  Check,
  Printer,
  Copy,
} from 'lucide-react';

export default function RequestDetailsClient({ id: propId }: { id?: string }) {
  const params = useParams();
  const router = useRouter();
  const id = propId || (params?.id as string);

  const { user, canManageLocation } = useAuth();
  const { requests, updatePurchaseRequestStatus, deletePurchaseRequest, showToast } = useStock();

  const isPrimaryAdmin = user?.role === 'Primary Lab Administrator' || user?.roleBadge === 'Admin';
  const request = requests.find((r) => r.id === id);

  const [copied, setCopied] = useState(false);
  const [adminNote, setAdminNote] = useState('');

  if (!request) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-neutral-50/50">
        <div className="bg-white border border-neutral-200 rounded-2xl p-8 max-w-md w-full text-center space-y-4 shadow-xs">
          <div className="w-12 h-12 rounded-xl bg-neutral-100 flex items-center justify-center mx-auto text-neutral-400">
            <ShoppingCart className="w-6 h-6" />
          </div>
          <h2 className="text-base font-bold text-neutral-900">Requisition Record Not Found</h2>
          <p className="text-xs text-neutral-500">
            The purchase requisition with ID &ldquo;<span className="font-mono font-semibold">{id}</span>&rdquo; could not be located in active records.
          </p>
          <Link
            href="/requests"
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-neutral-900 hover:bg-neutral-800 rounded-xl transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Purchase Requests</span>
          </Link>
        </div>
      </div>
    );
  }

  const isHandled = canManageLocation(request.targetRoom);
  const canEdit = isPrimaryAdmin || (request.requestedBy === user?.name && request.status === 'pending');

  const handleCopyId = () => {
    if (typeof navigator !== 'undefined') {
      navigator.clipboard.writeText(request.id);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      showToast(`Copied requisition ID ${request.id}`);
    }
  };

  const handleStatusUpdate = (newStatus: PurchaseRequest['status'], defaultNote?: string) => {
    updatePurchaseRequestStatus(request.id, newStatus, adminNote.trim() || defaultNote);
    setAdminNote('');
  };

  const handleDelete = () => {
    if (window.confirm(`Are you sure you want to cancel requisition ${request.id}?`)) {
      deletePurchaseRequest(request.id);
      router.push('/requests');
    }
  };

  return (
    <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-neutral-50/50">
      {/* Top Header with Integrated Back Navigation & Action Controls (matching Assets & Inventory style) */}
      <Header
        title={request.title}
        subtitle={`ID: ${request.id} • Destination: ${request.targetRoom}`}
        backHref="/requests"
        backLabel="Purchase Requests"
        showExport={false}
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs bg-white border border-neutral-200 hover:border-neutral-300 text-neutral-700 hover:bg-neutral-50 rounded font-medium transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 text-neutral-500" />
              <span className="hidden sm:inline">Print Voucher</span>
            </button>

            {canEdit && (
              <Link
                href={`/requests/${request.id}/edit`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-white rounded text-xs font-semibold transition-colors shadow-xs"
              >
                <Edit3 className="w-3.5 h-3.5 text-neutral-300" />
                <span>Edit Requisition</span>
              </Link>
            )}
          </div>
        }
      />

      <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6 w-full">
        {/* Requisition Hero Banner with Product Photo (No Breadcrumbs) */}
        <div className="bg-white border border-neutral-200/90 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row items-start justify-between gap-6">
          <div className="flex items-start gap-5 min-w-0 flex-1">
            {/* Visual Thumbnail */}
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl border border-neutral-200 bg-neutral-100 overflow-hidden shrink-0 shadow-2xs">
              <LabThumbnail
                src={request.imageUrl}
                alt={request.title}
                size="card"
                fallbackType="item"
                className="w-full h-full object-cover"
              />
            </div>

            <div className="space-y-2 min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono text-xs font-bold text-neutral-500 bg-neutral-100 px-2 py-0.5 rounded">
                  {request.id}
                </span>
                <button
                  onClick={handleCopyId}
                  className="text-[11px] text-neutral-400 hover:text-neutral-700 flex items-center gap-1 cursor-pointer"
                  title="Copy requisition ID"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied' : 'Copy ID'}</span>
                </button>
                <span>•</span>
                <span className="text-xs text-neutral-500 font-semibold">{request.category}</span>
              </div>

              <h1 className="text-xl font-bold text-neutral-900 tracking-tight leading-snug">
                {request.title}
              </h1>

              <div className="flex items-center gap-3 text-xs text-neutral-500 flex-wrap pt-1">
                <div className="flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-neutral-400" />
                  <span className="font-semibold text-neutral-800">{request.targetRoom}</span>
                  {isHandled ? (
                    <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 px-1.5 py-0.2 rounded">
                      Handled Lab
                    </span>
                  ) : (
                    <span className="text-[10px] font-medium bg-neutral-100 text-neutral-500 border border-neutral-200 px-1.5 py-0.2 rounded">
                      External Lab
                    </span>
                  )}
                </div>
                <span>•</span>
                <div className="flex items-center gap-1.5">
                  <User className="w-4 h-4 text-neutral-400" />
                  <span>Submitted by <strong>{request.requestedBy}</strong> ({request.requesterRole})</span>
                </div>
                <span>•</span>
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-neutral-400" />
                  <span>{request.requestDate}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Status Badge & Priority */}
          <div className="flex flex-col items-end gap-2 shrink-0">
            {request.status === 'pending' ? (
              <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl bg-amber-50 text-amber-800 border border-amber-200 shadow-2xs">
                <Clock className="w-4 h-4 text-amber-600" /> Pending Review
              </span>
            ) : request.status === 'approved' ? (
              <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl bg-blue-50 text-blue-800 border border-blue-200 shadow-2xs">
                <CheckCircle2 className="w-4 h-4 text-blue-600" /> Approved
              </span>
            ) : request.status === 'ordered' ? (
              <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl bg-purple-50 text-purple-800 border border-purple-200 shadow-2xs">
                <Tag className="w-4 h-4 text-purple-600" /> PO Dispatched / Ordered
              </span>
            ) : request.status === 'fulfilled' ? (
              <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-2xs">
                <Check className="w-4 h-4 text-emerald-600" /> Stocked & Received
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl bg-rose-50 text-rose-800 border border-rose-200 shadow-2xs">
                <XCircle className="w-4 h-4 text-rose-600" /> Rejected
              </span>
            )}

            {/* Priority Indicator */}
            {request.priority === 'urgent' ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                <Flame className="w-3.5 h-3.5 text-rose-500" /> Urgent Priority
              </span>
            ) : request.priority === 'high' ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                ▲ High Priority
              </span>
            ) : request.priority === 'medium' ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                ● Medium Priority
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-600 border border-neutral-200">
                ▽ Low Priority
              </span>
            )}
          </div>
        </div>

        {/* 4. Two-Column Detailed Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main 2-Col Body */}
          <div className="lg:col-span-2 space-y-6">
            {/* Procurement Specifications Card */}
            <div className="bg-white border border-neutral-200/90 rounded-2xl p-6 shadow-xs space-y-5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-700 border-b border-neutral-100 pb-3 flex items-center gap-2">
                <Tag className="w-4 h-4 text-neutral-500" />
                <span>Requisition Breakdown</span>
              </h3>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200/70">
                  <span className="text-[10px] uppercase font-semibold text-neutral-500 block">Requested Quantity</span>
                  <div className="text-base font-bold text-neutral-900 mt-1">
                    {request.quantity} <span className="text-xs font-normal text-neutral-600">{request.unit}</span>
                  </div>
                </div>

                <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200/70">
                  <span className="text-[10px] uppercase font-semibold text-neutral-500 block">Estimated Cost</span>
                  <div className="text-base font-bold text-neutral-900 mt-1">
                    {request.estimatedCost || 'Unspecified'}
                  </div>
                </div>

                <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200/70">
                  <span className="text-[10px] uppercase font-semibold text-neutral-500 block">Target Room</span>
                  <div className="text-base font-bold text-neutral-900 mt-1">
                    {request.targetRoom}
                  </div>
                </div>
              </div>

              {/* Justification Section */}
              <div>
                <span className="text-[10px] uppercase font-bold text-neutral-500 tracking-wider block mb-2">
                  Academic Justification & Practical Purpose
                </span>
                <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-200 text-xs text-neutral-800 leading-relaxed font-sans">
                  {request.reason}
                </div>
              </div>

              {/* Procurement & Administrative Notes */}
              <div>
                <span className="text-[10px] uppercase font-bold text-neutral-500 tracking-wider block mb-2">
                  Department / Procurement Review Notes
                </span>
                <div className="p-4 bg-blue-50/50 rounded-xl border border-blue-200/70 text-xs text-blue-950 leading-relaxed">
                  {request.notes || 'No administrative notes attached yet. Requisition is awaiting committee review.'}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Workflow Management & Personnel */}
          <div className="space-y-6">
            {/* Administrative Action Box */}
            <div className="bg-white border border-neutral-200/90 rounded-2xl p-5 shadow-xs space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-700 border-b border-neutral-100 pb-2.5">
                Requisition Workflow Actions
              </h3>

              {isPrimaryAdmin ? (
                <div className="space-y-3">
                  <p className="text-xs text-neutral-500">
                    As Primary Lab Administrator, you can update procurement milestones:
                  </p>

                  <div className="space-y-2">
                    {request.status === 'pending' && (
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => handleStatusUpdate('approved', 'Approved for institutional purchase.')}
                          className="w-full py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-colors cursor-pointer shadow-2xs"
                        >
                          ✓ Approve Requisition
                        </button>
                        <button
                          onClick={() => handleStatusUpdate('rejected', 'Declined by department administration.')}
                          className="w-full py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-xl transition-colors cursor-pointer"
                        >
                          ✕ Reject
                        </button>
                      </div>
                    )}

                    {request.status === 'approved' && (
                      <button
                        onClick={() => handleStatusUpdate('ordered', 'PO generated and sent to equipment supplier.')}
                        className="w-full py-2.5 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-700 rounded-xl transition-colors cursor-pointer shadow-2xs"
                      >
                        📦 Issue Purchase Order (Ordered)
                      </button>
                    )}

                    {request.status === 'ordered' && (
                      <button
                        onClick={() => handleStatusUpdate('fulfilled', 'Stock received, inspected, and placed into lab inventory.')}
                        className="w-full py-2.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-colors cursor-pointer shadow-2xs"
                      >
                        🎉 Mark as Fulfilled & Received
                      </button>
                    )}
                  </div>

                  {/* Add Administrative Note */}
                  <div className="pt-2">
                    <label className="block text-[11px] font-semibold text-neutral-600 mb-1">
                      Update Administrative Note:
                    </label>
                    <input
                      type="text"
                      value={adminNote}
                      onChange={(e) => setAdminNote(e.target.value)}
                      placeholder="e.g. PO #9841 sent to vendor..."
                      className="w-full px-3 py-1.5 text-xs bg-neutral-50 border border-neutral-200 rounded-lg focus:outline-none focus:border-neutral-900 focus:bg-white"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-3 text-xs text-neutral-500">
                  <p>
                    Submitted under your faculty account. You will receive notifications when administrative budget approval is granted.
                  </p>
                  {request.status === 'pending' && (
                    <button
                      onClick={handleDelete}
                      className="w-full py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-xl transition-colors cursor-pointer"
                    >
                      Cancel / Withdraw Requisition
                    </button>
                  )}
                </div>
              )}

              {/* Direct Edit Webpage Link */}
              <div className="pt-3 border-t border-neutral-100 flex items-center justify-between">
                <Link
                  href={`/requests/${request.id}/edit`}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Open Full Edit Webpage</span>
                </Link>
                {isPrimaryAdmin && (
                  <button
                    onClick={handleDelete}
                    className="text-xs font-semibold text-neutral-400 hover:text-rose-600 cursor-pointer"
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>

            {/* Requester Identity Card */}
            <div className="bg-white border border-neutral-200/90 rounded-2xl p-5 shadow-xs space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-700 border-b border-neutral-100 pb-2">
                Personnel Roster Record
              </h3>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-neutral-900 text-emerald-400 font-bold flex items-center justify-center text-sm">
                  {request.requestedBy.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <div className="font-bold text-xs text-neutral-900">{request.requestedBy}</div>
                  <div className="text-[11px] text-neutral-500">{request.requesterRole}</div>
                  <div className="text-[10px] text-neutral-400 mt-0.5">Faculty Staff ID: RUPP-ENG-2026</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

