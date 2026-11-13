'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Header } from '@/components/Header';
import { LoadingScreen } from '@/components/LoadingScreen';
import { useStock } from '@/context/StockContext';
import { exportToCsv } from '@/lib/exportCsv';
import {
  Laptop,
  ArrowLeft,
  Calendar,
  User,
  CheckCircle2,
  MapPin,
  ExternalLink,
  Copy,
  Check,
  FileText,
  X,
  GraduationCap,
  AlertTriangle,
  FileSpreadsheet,
  Share2,
} from 'lucide-react';

function formatLoanDate(value?: string | null): string {
  if (!value) return '—';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value.slice(0, 10);
  }
  return parsed.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export default function LoanDetailsClient({ id: propId }: { id?: string }) {
  const params = useParams();
  const router = useRouter();
  const id = propId || (params?.id as string);

  const { loans, assets, stock, returnAsset, showToast, isLoading } = useStock();

  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
  const [returnNotes, setReturnNotes] = useState('');

  const loan =
    loans.find((l) => l.id === id || (l as any).serverId === id) ||
    (id && (id.includes('-') || id.length > 15) ? loans[0] : undefined);
  const asset = loan ? assets.find((a) => a.id === loan.assetId || (a as any).serverId === loan.assetId) : null;
  const stockItem = loan
    ? stock.find(
        (s) =>
          s.id === loan.stockId ||
          s.code === loan.serialNumber ||
          s.name === loan.assetName
      )
    : null;
  const itemHref = asset ? `/assets/${asset.id}` : stockItem ? `/stock/${stockItem.id}` : loan?.assetId ? `/assets/${loan.assetId}` : null;
  const inspectLabel = stockItem && !asset ? 'Inspect Item' : 'Inspect Asset';

  const todayStr = new Date().toISOString().split('T')[0];
  const isOverdue = loan ? loan.status === 'active' && loan.expectedReturnDate < todayStr : false;

  const copyToClipboard = (text: string, label: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    showToast(`Copied ${label} to clipboard`);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  if (!loan && isLoading) {
    return <LoadingScreen message="Loading loan record dossier..." />;
  }

  if (!loan) {
    return (
      <div className="flex-1 flex flex-col min-w-0">
        <Header
          title="Loan Dossier Not Found"
          subtitle="Equipment Check-Out Directory"
          showExport={false}
          actionLabel="All Loans"
          onAction={() => router.push('/loans')}
        />
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="bg-white border border-neutral-200 rounded-2xl p-8 max-w-md w-full text-center space-y-4 shadow-sm">
            <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h2 className="text-base font-bold text-neutral-900">Loan Record Not Found</h2>
            <p className="text-xs text-neutral-500 leading-relaxed">
              The loan dossier with ID <span className="font-mono font-semibold text-neutral-800">{id}</span> does not exist or has been archived.
            </p>
            <Link
              href="/loans"
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-neutral-900 rounded-lg hover:bg-neutral-800 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Return to Loans Directory
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const handleConfirmReturn = () => {
    returnAsset(loan.id, returnNotes.trim() || undefined);
    setIsReturnModalOpen(false);
    setReturnNotes('');
    showToast(`Equipment ${loan.assetName} checked in successfully!`);
  };

  const handleExportLoan = () => {
    exportToCsv(
      `loan_${loan.id}_dossier`,
      [
        {
          'Loan ID': loan.id,
          'Equipment Name': loan.assetName,
          'Serial Number': loan.serialNumber,
          'Borrower Full Name': loan.borrowerName,
          'Borrower Role': loan.borrowerRole,
          'Contact / Student ID': loan.borrowerContact,
          'Class / Course': loan.courseOrClass || '',
          'Check-Out Date': loan.borrowDate,
          'Due Return Date': loan.expectedReturnDate,
          'Actual Return Date': loan.actualReturnDate || 'Pending Return',
          'Status': loan.status,
          'Staff Inspection Notes': loan.notes || '',
        },
      ],
      {
        sheetTitle: 'Loan Dossier',
        reportTitle: 'Equipment Checkout & Custody Dossier',
        reportSubtitle: `${loan.assetName} (SN: ${loan.serialNumber}) — Borrower: ${loan.borrowerName}`,
      }
    );
  };

  return (
    <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-neutral-50/50">
      {/* 1. Header with direct actions */}
      <Header
        title={loan.assetName}
        subtitle={`Borrower: ${loan.borrowerName} (${loan.borrowerRole}) • SN: ${loan.serialNumber}`}
        backHref="/loans"
        backLabel="Device Loans"
        showAction={false}
        showExport={false}
        actions={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => copyToClipboard(window.location.href, 'Link', 'share-link')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-neutral-700 bg-white border border-neutral-200 hover:border-neutral-300 rounded-xl hover:bg-neutral-50 transition-colors shadow-2xs cursor-pointer"
              title="Copy link to this loan record"
            >
              <Share2 className="w-3.5 h-3.5 text-neutral-500" />
              <span className="hidden sm:inline">{copiedKey === 'share-link' ? 'Copied' : 'Share'}</span>
            </button>

            <button
              type="button"
              onClick={handleExportLoan}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-neutral-700 bg-white border border-neutral-200 hover:border-neutral-300 rounded-xl hover:bg-neutral-50 transition-colors shadow-2xs cursor-pointer"
              title="Export loan dossier as Excel (.xlsx)"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span className="hidden sm:inline">Export</span>
            </button>

            {loan.status === 'active' && (
              <button
                type="button"
                onClick={() => setIsReturnModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-colors shadow-xs cursor-pointer"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Check-In / Return Device</span>
              </button>
            )}
          </div>
        }
      />

      {/* 2. Main Page Content */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-6 w-full">
        {/* Overdue Warning Alert */}
        {isOverdue && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-800 flex items-start gap-3 shadow-xs">
            <div className="w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center shrink-0 text-rose-600">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div className="space-y-1">
              <h4 className="font-bold text-sm text-rose-900">Overdue Custody Notice</h4>
              <p className="leading-relaxed">
                This device was scheduled for return on <strong className="font-mono">{loan.expectedReturnDate}</strong> and is currently overdue. Please contact the borrower (<strong className="text-neutral-900">{loan.borrowerName}</strong> at <code className="font-mono font-semibold">{loan.borrowerContact}</code>) for check-in inspection.
              </p>
            </div>
          </div>
        )}

        {/* Loan Header Card */}
        <div className="bg-white border border-neutral-200/80 rounded-2xl p-5 sm:p-6 shadow-2xs space-y-4">
          {/* Top Badges */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Status Badge */}
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold border ${
              loan.status === 'returned'
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : isOverdue
                ? 'bg-rose-50 text-rose-700 border-rose-200'
                : 'bg-amber-50 text-amber-700 border-amber-200'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${
                loan.status === 'returned'
                  ? 'bg-emerald-600'
                  : isOverdue
                  ? 'bg-rose-600'
                  : 'bg-amber-600'
              }`} />
              {loan.status === 'returned'
                ? 'Returned & Verified'
                : isOverdue
                ? 'Overdue Check-Out'
                : 'Active Custody Check-Out'}
            </span>

            {/* Serial Number Pill */}
            <button
              type="button"
              onClick={() => copyToClipboard(loan.serialNumber, 'Serial Number', 'hero-sn')}
              className="inline-flex items-center gap-1.5 font-mono text-[11px] text-neutral-700 bg-neutral-50 hover:bg-neutral-100 px-2.5 py-1 rounded-lg border border-neutral-200 transition-colors cursor-pointer"
              title="Click to copy serial number"
            >
              <span>SN: {loan.serialNumber}</span>
              {copiedKey === 'hero-sn' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3 text-neutral-400" />}
            </button>
          </div>

          {/* Main Content */}
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 pt-1">
            <div className="min-w-0 space-y-1.5">
              <h2 className="text-lg sm:text-xl font-bold tracking-tight text-neutral-900 truncate">
                {loan.assetName}
              </h2>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-neutral-600 font-medium">
                <span className="text-neutral-900 font-semibold inline-flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                  {loan.borrowerName} ({loan.borrowerRole})
                </span>
                <span className="font-mono text-neutral-500">{loan.borrowerContact}</span>
                {loan.courseOrClass && (
                  <span className="text-neutral-700">{loan.courseOrClass}</span>
                )}
                {(asset?.location || stockItem?.location) && (
                  <span className="text-neutral-500 inline-flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                    {asset?.location || stockItem?.location}
                  </span>
                )}
              </div>
            </div>

            {/* Quick Dates Summary Pill */}
            <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
              <div className="flex items-center gap-2.5 bg-neutral-50 border border-neutral-200 px-3 py-2 rounded-xl text-xs whitespace-nowrap">
                <div className="flex items-center gap-1.5">
                  <span className="text-neutral-500">Out:</span>
                  <span className="font-mono font-semibold text-neutral-800">{formatLoanDate(loan.borrowDate)}</span>
                </div>
                <span className="text-neutral-300">|</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-neutral-500">Due:</span>
                  <span className={`font-mono font-semibold ${isOverdue ? 'text-rose-600' : 'text-emerald-700'}`}>
                    {formatLoanDate(loan.expectedReturnDate)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 2-Column Responsive Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Left Column (2/3 width): Details, Borrower, and Notes */}
          <div className="lg:col-span-2 space-y-6">
            {/* Card 1: Equipment Hardware Details */}
            <div className="bg-white border border-neutral-200/80 rounded-2xl p-5 sm:p-6 shadow-2xs space-y-4">
              <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
                <h3 className="text-xs font-bold text-neutral-900 uppercase tracking-wider flex items-center gap-2">
                  <Laptop className="w-4 h-4 text-blue-600" />
                  <span>{stockItem && !asset ? 'Inventory Item Details' : 'Equipment Hardware Details'}</span>
                </h3>
                {itemHref && (
                  <Link
                    href={itemHref}
                    className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
                  >
                    <span>{inspectLabel}</span>
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="space-y-1">
                  <span className="text-neutral-400 font-medium block text-[11px]">Item / Hardware Name</span>
                  <span className="font-bold text-neutral-900 text-sm">{loan.assetName}</span>
                </div>

                <div className="space-y-1">
                  <span className="text-neutral-400 font-medium block text-[11px]">Serial / SKU Identifier</span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(loan.serialNumber, 'Serial Number', 'card-sn')}
                    className="inline-flex items-center gap-1 font-mono font-bold text-neutral-800 bg-neutral-100 hover:bg-neutral-200/80 px-2 py-1 rounded-lg transition-colors cursor-pointer"
                  >
                    <span>{loan.serialNumber}</span>
                    {copiedKey === 'card-sn' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3 text-neutral-400" />}
                  </button>
                </div>

                {asset && (
                  <>
                    <div className="space-y-1">
                      <span className="text-neutral-400 font-medium block text-[11px]">Model & Specification</span>
                      <span className="font-semibold text-neutral-800">{asset.model}</span>
                    </div>

                    <div className="space-y-1">
                      <span className="text-neutral-400 font-medium block text-[11px]">Stationed Lab Facility</span>
                      <span className="font-semibold text-neutral-800 flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-neutral-400" />
                        {asset.location}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <span className="text-neutral-400 font-medium block text-[11px]">Operational Status</span>
                      <span
                        className={`inline-flex items-center gap-1.5 font-semibold ${
                          asset.status === 'operational'
                            ? 'text-emerald-700'
                            : asset.status === 'in_use'
                            ? 'text-blue-700'
                            : 'text-amber-700'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            asset.status === 'operational'
                              ? 'bg-emerald-500'
                              : asset.status === 'in_use'
                              ? 'bg-blue-500'
                              : 'bg-amber-500'
                          }`}
                        />
                        {asset.status === 'operational'
                          ? 'Operational'
                          : asset.status === 'in_use'
                          ? 'In Use'
                          : 'In Repair'}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <span className="text-neutral-400 font-medium block text-[11px]">Next Scheduled Audit / Calibration</span>
                      <span className="font-medium text-neutral-700">{asset.nextCalibration || 'Active'}</span>
                    </div>
                  </>
                )}

                {stockItem && (
                  <>
                    <div className="space-y-1">
                      <span className="text-neutral-400 font-medium block text-[11px]">Item Category & SKU</span>
                      <span className="font-semibold text-neutral-800">{stockItem.category} ({stockItem.code})</span>
                    </div>

                    <div className="space-y-1">
                      <span className="text-neutral-400 font-medium block text-[11px]">Storage Facility Room</span>
                      <span className="font-semibold text-neutral-800 flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-neutral-400" />
                        {stockItem.location}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <span className="text-neutral-400 font-medium block text-[11px]">Units Checked Out</span>
                      <span className="inline-flex items-center gap-1 font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        {loan.quantity || 1} {stockItem.unit || 'units'}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <span className="text-neutral-400 font-medium block text-[11px]">Current Remaining In Stock</span>
                      <span className="font-medium text-neutral-700">{stockItem.quantity} {stockItem.unit || 'units'}</span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Card 2: Borrower Identity & Contact */}
            <div className="bg-white border border-neutral-200/90 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
              <div className="border-b border-neutral-100 pb-3">
                <h3 className="text-xs font-bold text-neutral-900 uppercase tracking-wider flex items-center gap-2">
                  <User className="w-4 h-4 text-emerald-600" />
                  <span>Borrower Identity & Authorization</span>
                </h3>
              </div>

              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-neutral-900 text-white flex items-center justify-center font-bold text-base shrink-0 shadow-xs">
                  {loan.borrowerName.slice(0, 2).toUpperCase()}
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="text-base font-bold text-neutral-900">{loan.borrowerName}</h4>
                    <span className="inline-block bg-neutral-100 text-neutral-800 font-semibold px-2 py-0.5 rounded text-[11px] border border-neutral-200">
                      {loan.borrowerRole}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-neutral-500 flex-wrap">
                    <button
                      type="button"
                      onClick={() => copyToClipboard(loan.borrowerContact, 'Contact', 'card-contact')}
                      className="inline-flex items-center gap-1 hover:text-neutral-900 font-medium bg-neutral-50 hover:bg-neutral-100 px-2 py-0.5 rounded border border-neutral-200 transition-colors"
                      title="Click to copy contact"
                    >
                      <span>{loan.borrowerContact}</span>
                      {copiedKey === 'card-contact' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3 text-neutral-400" />}
                    </button>
                  </div>
                </div>
              </div>

              {loan.courseOrClass && (
                <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200/70 text-xs flex items-center gap-2 text-neutral-700">
                  <GraduationCap className="w-4 h-4 text-neutral-500 shrink-0" />
                  <span>
                    Assigned Course / Practical: <strong className="text-neutral-900">{loan.courseOrClass}</strong>
                  </span>
                </div>
              )}
            </div>

            {/* Card 3: Notes & Condition Log */}
            <div className="bg-white border border-neutral-200/90 rounded-2xl p-5 sm:p-6 shadow-xs space-y-3">
              <div className="border-b border-neutral-100 pb-3">
                <h3 className="text-xs font-bold text-neutral-900 uppercase tracking-wider flex items-center gap-2">
                  <FileText className="w-4 h-4 text-purple-600" />
                  <span>Inspection Notes & Custody Purpose</span>
                </h3>
              </div>

              <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-200/70 text-xs text-neutral-700 whitespace-pre-line leading-relaxed">
                {loan.notes || 'No specific condition or reservation notes recorded.'}
              </div>
            </div>
          </div>

          {/* Right Column (1/3 width): Timeline & Actions */}
          <div className="space-y-6">
            {/* Timeline Card */}
            <div className="bg-white border border-neutral-200/80 rounded-2xl p-5 sm:p-6 shadow-2xs space-y-4">
              <div className="border-b border-neutral-100 pb-3">
                <h3 className="text-xs font-bold text-neutral-900 uppercase tracking-wider flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-amber-600" />
                  <span>Custody Schedule</span>
                </h3>
              </div>

              <div className="space-y-3">
                <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200/70">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block">
                    Check-Out Date
                  </span>
                  <div className="text-sm font-bold text-neutral-900 font-mono mt-0.5">
                    {formatLoanDate(loan.borrowDate)}
                  </div>
                  <span className="text-[11px] text-neutral-500 mt-0.5 block">
                    Issued to borrower
                  </span>
                </div>

                <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200/70">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block">
                    Due Return Date
                  </span>
                  <div className={`text-sm font-bold font-mono mt-0.5 ${isOverdue ? 'text-rose-600' : 'text-neutral-900'}`}>
                    {formatLoanDate(loan.expectedReturnDate)}
                  </div>
                  <span className={`text-[11px] font-medium mt-0.5 block ${isOverdue ? 'text-rose-600' : 'text-neutral-500'}`}>
                    {isOverdue ? 'Overdue past deadline' : 'Scheduled deadline'}
                  </span>
                </div>

                <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200/70">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block">
                    Actual Return Date
                  </span>
                  <div className="text-sm font-bold text-emerald-700 font-mono mt-0.5">
                    {loan.actualReturnDate ? formatLoanDate(loan.actualReturnDate) : 'Pending Return'}
                  </div>
                  <span className="text-[11px] text-neutral-500 mt-0.5 block">
                    {loan.status === 'returned' ? 'Verified in lab inventory' : 'Currently in custody'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Return Device Modal */}
      {isReturnModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl border border-neutral-200 shadow-2xl max-w-lg w-full overflow-hidden flex flex-col animate-in zoom-in-95 duration-150">
            <div className="px-5 py-4 border-b border-neutral-200 flex items-center justify-between bg-neutral-50/70">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 shrink-0">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-neutral-900 leading-tight">Confirm Equipment Return</h3>
                  <p className="text-[11px] text-neutral-500">Record check-in inspection & return to active lab stock</p>
                </div>
              </div>
              <button
                onClick={() => setIsReturnModalOpen(false)}
                className="p-1.5 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 rounded-lg cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-3.5 space-y-2 text-xs">
                <div className="font-bold text-neutral-900">{loan.assetName}</div>
                <div className="flex items-center gap-2 text-neutral-500 font-mono text-[11px]">
                  <span>SN: {loan.serialNumber}</span>
                  <span>•</span>
                  <span>Borrower: {loan.borrowerName}</span>
                </div>
              </div>

              {/* Notes Textarea */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-neutral-800 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-neutral-600" />
                  <span>Inspection & Condition Notes</span>
                </label>
                <textarea
                  rows={3}
                  placeholder="e.g. Device examined in student presence, verified working, all accessories intact..."
                  value={returnNotes}
                  onChange={(e) => setReturnNotes(e.target.value)}
                  className="w-full bg-white text-xs border border-neutral-300 rounded-xl p-2.5 text-neutral-900 focus:outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 placeholder:text-neutral-400 transition-all shadow-2xs resize-none"
                />
              </div>
            </div>

            <div className="px-5 py-3.5 bg-neutral-50/70 border-t border-neutral-200 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setIsReturnModalOpen(false)}
                className="px-3.5 py-1.5 text-xs font-semibold text-neutral-700 bg-white border border-neutral-300 hover:bg-neutral-50 rounded-xl cursor-pointer transition-colors shadow-2xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmReturn}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl cursor-pointer transition-colors shadow-xs"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Confirm Return & Check-in</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
