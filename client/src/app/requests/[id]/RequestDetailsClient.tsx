'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { Header } from '@/components/Header';
import { LabThumbnail } from '@/components/LabThumbnail';
import { getAssetPath } from '@/lib/basePath';
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

  useEffect(() => {
    let originalTitle = typeof document !== 'undefined' ? document.title : '';
    const handleBeforePrint = () => {
      originalTitle = document.title;
      document.title = '';
    };
    const handleAfterPrint = () => {
      document.title = originalTitle;
    };
    window.addEventListener('beforeprint', handleBeforePrint);
    window.addEventListener('afterprint', handleAfterPrint);
    return () => {
      window.removeEventListener('beforeprint', handleBeforePrint);
      window.removeEventListener('afterprint', handleAfterPrint);
    };
  }, []);

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

  const handlePrint = () => {
    let style = document.getElementById('print-zero-margin') as HTMLStyleElement | null;
    if (!style) {
      style = document.createElement('style');
      style.id = 'print-zero-margin';
      style.innerHTML = `@page { size: A4 portrait; margin: 0mm !important; } @page :left { margin: 0mm !important; } @page :right { margin: 0mm !important; } @page :first { margin: 0mm !important; }`;
      document.head.appendChild(style);
    }
    const originalTitle = document.title;
    document.title = '';
    window.print();
    setTimeout(() => {
      document.title = originalTitle;
    }, 1000);
  };

  const parsedCost = request.estimatedCost ? parseFloat(request.estimatedCost.replace(/[^0-9.]/g, '')) : null;
  const totalCostFormatted = parsedCost != null ? `$${parsedCost.toFixed(2)}` : (request.estimatedCost || 'Unspecified');
  const unitPriceFormatted = parsedCost != null && request.quantity > 0 ? `$${(parsedCost / request.quantity).toFixed(2)}` : 'N/A';

  const amountInWords = (num: number | null): string => {
    if (!num || isNaN(num) || num <= 0) return 'Zero US Dollars Only';
    const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
      'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    const dollars = Math.floor(num);
    const cents = Math.round((num - dollars) * 100);

    const convert = (n: number): string => {
      if (n === 0) return '';
      if (n < 20) return ones[n];
      if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + ones[n % 10] : '');
      if (n < 1000) return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 !== 0 ? ' and ' + convert(n % 100) : '');
      if (n < 1000000) return convert(Math.floor(n / 1000)) + ' Thousand' + (n % 1000 !== 0 ? ' ' + convert(n % 1000) : '');
      return n.toString();
    };

    let result = convert(dollars).trim() + ' US Dollars';
    if (cents > 0) {
      result += ` and ${cents}/100 Cents`;
    } else {
      result += ' Only';
    }
    return result;
  };

  return (
    <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-neutral-50/50">
      {/* Top Header with Integrated Back Navigation & Action Controls */}
      <Header
        title={request.title}
        subtitle={`ID: ${request.id} • Destination: ${request.targetRoom}`}
        backHref="/requests"
        backLabel="Purchase Requests"
        showExport={false}
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs bg-white border border-neutral-200 hover:border-neutral-300 text-neutral-700 hover:bg-neutral-50 rounded font-medium transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 text-neutral-500" />
              <span className="hidden sm:inline">Print Voucher / Invoice</span>
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

      {/* 1. Interactive Web Application View (Screen Only) */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6 w-full print:hidden">
        {/* Requisition Hero Banner with Product Photo */}
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

        {/* Two-Column Detailed Breakdown */}
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
                    {totalCostFormatted}
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

      {/* 2. DEDICATED OFFICIAL PRINT INVOICE & VOUCHER DOCUMENT (Standard A4 Format) */}
      <div className="hidden print:flex flex-col justify-between a4-print-canvas w-full max-w-[210mm] mx-auto font-sans text-neutral-900 bg-white px-3 py-2">
        <div className="space-y-4">
          {/* Invoice Top Letterhead */}
          <div className="border-b-2 border-neutral-900 pb-3">
            {/* Top Cambodian Motto */}
            <div className="text-center mb-2">
              <div className="font-khmer font-bold text-xs text-neutral-900 tracking-wide">
                ព្រះរាជាណាចក្រកម្ពុជា • ជាតិ សាសនា ព្រះមហាក្សត្រ
              </div>
              <div className="text-[9px] uppercase tracking-widest text-neutral-500 font-semibold">
                Kingdom of Cambodia • Nation Religion King
              </div>
            </div>

            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <img
                  src={getAssetPath('/logo.png')}
                  alt="RUPP Seal"
                  className="w-16 h-16 object-contain shrink-0"
                />
                <div>
                  <div className="font-khmer font-bold text-sm text-neutral-900 leading-tight">
                    សាកលវិទ្យាល័យភូមិន្ទភ្នំពេញ
                  </div>
                  <div className="text-sm font-black uppercase tracking-tight text-neutral-900 font-serif leading-tight">
                    Royal University of Phnom Penh
                  </div>
                  <div className="text-xs font-bold text-neutral-700 leading-tight mt-0.5">
                    Faculty of Engineering • Computer Science & STEM Laboratories
                  </div>
                  <div className="text-[10px] text-neutral-500 tracking-normal mt-0.5">
                    Russian Federation Blvd, Khan Toul Kork, Phnom Penh, Cambodia • CSD Fleet System
                  </div>
                </div>
              </div>

              <div className="text-right shrink-0">
                <div className="font-khmer font-bold text-xs text-neutral-800 leading-tight">
                  ប័ណ្ណស្នើសុំទិញសម្ភារៈ និងឧបករណ៍
                </div>
                <div className="text-base font-black tracking-tight text-neutral-900 uppercase leading-snug">
                  PURCHASE REQUISITION
                </div>
                <div className="text-[10px] font-bold text-neutral-600 uppercase tracking-widest">
                  OFFICIAL INVOICE VOUCHER
                </div>
                <div className="mt-1 font-mono text-xs font-extrabold text-neutral-900 bg-neutral-100 px-2 py-0.5 rounded border border-neutral-300 inline-block">
                  REF: {request.id}
                </div>
                <div className="text-[9px] font-mono text-neutral-400 mt-0.5">
                  ||||| | |||| || | |||||||| |||||
                </div>
              </div>
            </div>
          </div>

          {/* Invoice Metadata Box (4-Column Tabular Grid) */}
          <div className="grid grid-cols-4 gap-3 p-3 bg-neutral-50/80 border border-neutral-300 rounded-lg text-xs">
            <div>
              <div className="text-[9px] uppercase font-bold text-neutral-500 tracking-wider mb-1">
                Requisition Ref & Date
              </div>
              <div className="font-mono font-bold text-neutral-900 text-xs">{request.id}</div>
              <div className="text-[11px] text-neutral-600 mt-0.5">Date: <span className="font-semibold text-neutral-900">{request.requestDate}</span></div>
              <div className="text-[10px] text-neutral-500 mt-0.5">Fiscal Year: 2026 (Q4)</div>
            </div>

            <div>
              <div className="text-[9px] uppercase font-bold text-neutral-500 tracking-wider mb-1">
                Target Laboratory
              </div>
              <div className="font-bold text-neutral-900 text-xs">{request.targetRoom}</div>
              <div className="text-[11px] text-neutral-600 mt-0.5">Engineering Block A</div>
              <div className="text-[10px] text-neutral-500 mt-0.5">Facility Code: RUPP-LAB-{request.targetRoom.replace(/[^0-9A-Za-z]/g, '')}</div>
            </div>

            <div>
              <div className="text-[9px] uppercase font-bold text-neutral-500 tracking-wider mb-1">
                Requested By (Faculty)
              </div>
              <div className="font-bold text-neutral-900 text-xs">{request.requestedBy}</div>
              <div className="text-[11px] text-neutral-600 mt-0.5">{request.requesterRole}</div>
              <div className="text-[10px] text-neutral-500 mt-0.5">Staff ID: RUPP-ENG-2026</div>
            </div>

            <div>
              <div className="text-[9px] uppercase font-bold text-neutral-500 tracking-wider mb-1">
                Priority & Approval Status
              </div>
              <div className="font-bold uppercase text-neutral-900 text-xs flex items-center gap-1">
                <span>{request.priority} Priority</span>
              </div>
              <div className="text-[11px] font-semibold uppercase text-emerald-800 mt-0.5">
                Status: {request.status}
              </div>
              <div className="text-[10px] text-neutral-500 mt-0.5">Budget Line: STEM-ALLOC-019</div>
            </div>
          </div>

          {/* Invoice Item Specifications Table */}
          <table className="w-full text-left border-collapse border border-neutral-300 text-xs">
            <thead>
              <tr className="bg-neutral-100 border-b border-neutral-300 font-bold text-neutral-800 uppercase text-[10px]">
                <th className="py-2 px-2.5 border-r border-neutral-300 w-10 text-center">#</th>
                <th className="py-2 px-3 border-r border-neutral-300">Item Description & Specifications</th>
                <th className="py-2 px-3 border-r border-neutral-300 w-36">Category</th>
                <th className="py-2 px-2 border-r border-neutral-300 w-16 text-center">Qty</th>
                <th className="py-2 px-2 border-r border-neutral-300 w-20 text-center">Unit</th>
                <th className="py-2 px-3 border-r border-neutral-300 w-28 text-right">Est. Unit Price</th>
                <th className="py-2 px-3 w-32 text-right">Total Est. Cost</th>
              </tr>
            </thead>
            <tbody>
              {/* Primary Item Row */}
              <tr className="border-b border-neutral-300">
                <td className="py-3 px-2.5 border-r border-neutral-300 text-center font-mono font-bold align-top">1</td>
                <td className="py-3 px-3 border-r border-neutral-300 font-medium align-top">
                  <div className="flex items-start gap-3">
                    {request.imageUrl && (
                      <img
                        src={request.imageUrl}
                        alt={request.title}
                        className="w-14 h-14 object-cover rounded border border-neutral-300 shrink-0"
                      />
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="font-bold text-neutral-900 text-xs sm:text-sm leading-snug">{request.title}</div>
                      <div className="text-[11px] text-neutral-600 mt-1 leading-normal">
                        Specification: Academic Laboratory Hardware Grade • Pre-inspected for STEM curriculum usage
                      </div>
                      <div className="text-[10px] text-neutral-400 mt-0.5">
                        Target Station: {request.targetRoom} • Allocation: Faculty Lab Fleet Inventory
                      </div>
                    </div>
                  </div>
                </td>
                <td className="py-3 px-3 border-r border-neutral-300 text-neutral-800 font-medium align-top">{request.category}</td>
                <td className="py-3 px-2 border-r border-neutral-300 text-center font-bold font-mono text-neutral-900 text-sm align-top">{request.quantity}</td>
                <td className="py-3 px-2 border-r border-neutral-300 text-center text-neutral-700 align-top">{request.unit}</td>
                <td className="py-3 px-3 border-r border-neutral-300 text-right font-mono text-neutral-800 text-xs align-top">{unitPriceFormatted}</td>
                <td className="py-3 px-3 text-right font-mono font-bold text-neutral-900 text-sm align-top">{totalCostFormatted}</td>
              </tr>

              {/* Technical Inspection & Standards Row */}
              <tr className="bg-neutral-50/50 text-[10px] text-neutral-600 border-b border-neutral-300">
                <td className="py-1.5 px-2.5 border-r border-neutral-300 text-center font-mono text-neutral-400">NOTE</td>
                <td colSpan={6} className="py-1.5 px-3">
                  <span className="font-bold text-neutral-700">Acceptance Checkpoint:</span> Physical inspection, quantity verification, and CSD asset tag assignment required upon depot delivery.
                </td>
              </tr>
            </tbody>
          </table>

          {/* Invoice Justification, Compliance Checklist & Financial Summary Box */}
          <div className="grid grid-cols-12 gap-3.5">
            {/* Left Column (7 cols): Justification & Department Review */}
            <div className="col-span-7 space-y-2.5">
              <div className="border border-neutral-300 rounded-lg p-3 bg-neutral-50/60">
                <div className="text-[9px] uppercase font-bold text-neutral-700 tracking-wider mb-1 flex items-center justify-between">
                  <span>Academic Justification & Practical Purpose</span>
                  <span className="text-[8px] text-neutral-400 font-normal">មូលហេតុ និងតម្រូវការ</span>
                </div>
                <div className="text-xs text-neutral-800 leading-relaxed font-sans">
                  {request.reason}
                </div>
              </div>

              <div className="border border-neutral-300 rounded-lg p-3 bg-neutral-50/60">
                <div className="text-[9px] uppercase font-bold text-neutral-700 tracking-wider mb-1 flex items-center justify-between">
                  <span>Department Review & Technical Compliance</span>
                  <span className="text-[8px] text-neutral-400 font-normal">ការត្រួតពិនិត្យបច្ចេកទេស</span>
                </div>
                <div className="text-xs text-neutral-800 leading-relaxed font-sans mb-2">
                  {request.notes || 'Requisition submitted for department director review. Awaiting budget sign-off.'}
                </div>
                <div className="grid grid-cols-2 gap-1.5 pt-2 border-t border-neutral-200 text-[10px] text-neutral-600">
                  <div className="flex items-center gap-1.5">
                    <span className="text-emerald-700 font-bold">☑</span> STEM Standard Compliant
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-emerald-700 font-bold">☑</span> Budget Code Verified
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-emerald-700 font-bold">☑</span> Asset Tagging Required
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-emerald-700 font-bold">☑</span> Lab Depot Delivery
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column (5 cols): Financial Ledger & Words */}
            <div className="col-span-5 flex flex-col justify-between space-y-2">
              <table className="w-full text-right border-collapse border border-neutral-300 text-xs">
                <tbody>
                  <tr className="border-b border-neutral-200">
                    <td className="py-2 px-3 font-semibold text-neutral-600 bg-neutral-50 border-r border-neutral-200">Subtotal:</td>
                    <td className="py-2 px-3 font-mono font-semibold text-neutral-900">{totalCostFormatted}</td>
                  </tr>
                  <tr className="border-b border-neutral-200">
                    <td className="py-2 px-3 font-semibold text-neutral-600 bg-neutral-50 border-r border-neutral-200">Educational Tax (0%):</td>
                    <td className="py-2 px-3 font-mono text-neutral-500">$0.00</td>
                  </tr>
                  <tr className="border-b border-neutral-300">
                    <td className="py-2 px-3 font-semibold text-neutral-600 bg-neutral-50 border-r border-neutral-200">Shipping & Handling:</td>
                    <td className="py-2 px-3 font-mono text-neutral-500">Free / Campus Depot</td>
                  </tr>
                  <tr className="bg-neutral-100 font-bold border-t border-neutral-300">
                    <td className="py-2 px-3 text-neutral-900 border-r border-neutral-300 uppercase text-[10px]">Total Requisition:</td>
                    <td className="py-2 px-3 font-mono text-neutral-900 text-sm">{totalCostFormatted}</td>
                  </tr>
                </tbody>
              </table>

              {/* Total in Words */}
              <div className="border border-neutral-300 rounded-lg p-2.5 bg-neutral-50/80 text-left">
                <div className="text-[9px] uppercase font-bold text-neutral-500 tracking-wider">
                  Amount in Words (USD):
                </div>
                <div className="text-xs font-bold text-neutral-900 italic mt-0.5 leading-snug">
                  {amountInWords(parsedCost)}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section: 3-Party Authorization & Institutional Sign-Off & Official Footer */}
        <div className="space-y-3 pt-3">
          {/* Official 3-Party Institutional Authorization & Signatures */}
          <div className="border-t-2 border-neutral-900 pt-2.5">
            <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-neutral-700 mb-2">
              <span>OFFICIAL INSTITUTIONAL AUTHORIZATION & SIGN-OFF</span>
              <span className="font-khmer font-normal text-[9px] text-neutral-500">ការអនុម័ត និងហត្ថលេខាផ្លូវការ</span>
            </div>

            <div className="grid grid-cols-3 gap-3 text-left">
              {/* Box 1: Applicant / Preparer */}
              <div className="border border-neutral-300 rounded-lg p-3 flex flex-col justify-between h-32 bg-white">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] uppercase font-bold text-neutral-600 block">1. Prepared & Requested By</span>
                    <span className="font-khmer text-[8px] text-neutral-400">អ្នកស្នើសុំ</span>
                  </div>
                  <div className="font-bold text-xs text-neutral-900 mt-1">{request.requestedBy}</div>
                  <div className="text-[10px] text-neutral-500">{request.requesterRole}</div>
                  <div className="text-[9px] text-neutral-400">Staff ID: RUPP-ENG-2026</div>
                </div>
                <div className="border-t border-neutral-400 pt-1 text-center">
                  <span className="text-[9px] text-neutral-400 italic block leading-none mb-0.5">Applicant Signature</span>
                  <span className="text-[10px] text-neutral-700 font-mono font-medium">Date: {request.requestDate}</span>
                </div>
              </div>

              {/* Box 2: Lab Director / Department Head with Official Seal Stamp */}
              <div className="border border-neutral-300 rounded-lg p-3 flex flex-col justify-between h-32 bg-white relative">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] uppercase font-bold text-neutral-600 block">2. Lab Director / Dept Head</span>
                    <span className="font-khmer text-[8px] text-neutral-400">ប្រធានមន្ទីរពិសោធន៍</span>
                  </div>
                  <div className="font-bold text-xs text-neutral-900 mt-1">Dr. Heng Sovannarith</div>
                  <div className="text-[10px] text-neutral-500">Primary Lab Administrator</div>
                  <div className="text-[9px] text-neutral-400">Faculty of Engineering</div>
                </div>

                {/* Stamp Circle */}
                <div className="absolute right-3 top-8 w-14 h-14 rounded-full border border-dashed border-neutral-300 flex items-center justify-center text-[8px] text-neutral-400 text-center leading-tight font-sans uppercase pointer-events-none">
                  Official<br />Seal
                </div>

                <div className="border-t border-neutral-400 pt-1 text-center">
                  <span className="text-[9px] text-neutral-400 italic block leading-none mb-0.5">Authorized Signature & Seal</span>
                  <span className="text-[10px] text-neutral-700 font-mono font-medium">Date: ____ / ____ / 2026</span>
                </div>
              </div>

              {/* Box 3: Procurement & Finance Office */}
              <div className="border border-neutral-300 rounded-lg p-3 flex flex-col justify-between h-32 bg-white">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] uppercase font-bold text-neutral-600 block">3. Procurement & Finance</span>
                    <span className="font-khmer text-[8px] text-neutral-400">គណនេយ្យ និងផ្គត់ផ្គង់</span>
                  </div>
                  <div className="font-bold text-xs text-neutral-900 mt-1">Institutional Finance Board</div>
                  <div className="text-[10px] text-neutral-500">Status: <span className="font-bold uppercase text-neutral-800">{request.status}</span></div>
                  <div className="text-[9px] text-neutral-400">Ref Code: RUPP-FIN-2026</div>
                </div>
                <div className="border-t border-neutral-400 pt-1 text-center">
                  <span className="text-[9px] text-neutral-400 italic block leading-none mb-0.5">Disbursement Approval</span>
                  <span className="text-[10px] text-neutral-700 font-mono font-medium">Date: ____ / ____ / 2026</span>
                </div>
              </div>
            </div>
          </div>

          {/* Institutional Legal Declaration & Footer */}
          <div className="border-t border-neutral-300 pt-2 space-y-1">
            <div className="text-[9px] text-neutral-500 leading-tight">
              <strong>Official Notice:</strong> This Purchase Requisition Voucher is an authorized record of the Royal University of Phnom Penh. Procured hardware remains the property of the Faculty of Engineering and is subject to mandatory asset tagging and annual inventory verification audits.
            </div>
            <div className="flex items-center justify-between text-[9px] text-neutral-400 font-mono pt-0.5">
              <span>RUPP CSD FLEET • SYSTEM ID: RUPP-REQ-2026</span>
              <span>VOUCHER REF: {request.id} • {request.targetRoom}</span>
              <span className="font-bold text-neutral-600">STANDARD A4 FORMAT • PAGE 1 OF 1</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

