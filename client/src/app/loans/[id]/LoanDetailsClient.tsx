'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Header } from '@/components/Header';
import { useStock } from '@/context/StockContext';
import { exportToCsv } from '@/lib/exportCsv';
import {
  Laptop,
  ArrowLeft,
  Calendar,
  User,
  CheckCircle2,
  AlertCircle,
  Clock,
  MapPin,
  ExternalLink,
  Copy,
  Check,
  FileText,
  Sparkles,
  X,
  Building,
  Mail,
  Phone,
  GraduationCap,
  AlertTriangle,
  FileSpreadsheet,
  Share2,
} from 'lucide-react';

export default function LoanDetailsClient({ id: propId }: { id?: string }) {
  const params = useParams();
  const router = useRouter();
  const id = propId || (params?.id as string);

  const { loans, assets, returnAsset, showToast } = useStock();

  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
  const [returnNotes, setReturnNotes] = useState('');

  const loan = loans.find((l) => l.id === id);
  const asset = loan ? assets.find((a) => a.id === loan.assetId) : null;

  const todayStr = new Date().toISOString().split('T')[0];
  const isOverdue = loan ? loan.status === 'active' && loan.expectedReturnDate < todayStr : false;

  const copyToClipboard = (text: string, label: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    showToast(`Copied ${label} to clipboard`);
    setTimeout(() => setCopiedKey(null), 2000);
  };

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
    exportToCsv(`loan_${loan.id}_dossier`, [
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
    ]);
  };

  return (
    <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-neutral-50/50">
      {/* 1. Header with direct actions */}
      <Header
        title={loan.assetName}
        subtitle={`Check-Out Dossier • ${loan.id}`}
        backHref="/loans"
        backLabel="Device Loans"
        showAction={false}
        showExport={false}
        actions={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExportLoan}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-neutral-700 bg-white border border-neutral-200 hover:border-neutral-300 rounded-lg hover:bg-neutral-50 transition-colors shadow-2xs cursor-pointer"
              title="Export loan dossier as CSV"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span className="hidden sm:inline">Export</span>
            </button>

            {loan.status === 'active' && (
              <button
                type="button"
                onClick={() => setIsReturnModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors shadow-xs cursor-pointer"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Check-In / Return Device</span>
              </button>
            )}
          </div>
        }
      />

      {/* 2. Main Page Content */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6 max-w-8xl w-full mx-auto">
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

        {/* Hero Dossier Card */}
        <div className="bg-white border border-neutral-200/90 rounded-2xl p-6 shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-2xs ${
                loan.status === 'returned'
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/70'
                  : isOverdue
                  ? 'bg-rose-50 text-rose-700 border border-rose-200/70'
                  : 'bg-amber-50 text-amber-700 border border-amber-200/70'
              }`}>
                <Laptop className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                    loan.status === 'returned'
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200/80'
                      : isOverdue
                      ? 'bg-rose-50 text-rose-800 border-rose-200/80'
                      : 'bg-amber-50 text-amber-800 border-amber-200/80'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${
                      loan.status === 'returned'
                        ? 'bg-emerald-500'
                        : isOverdue
                        ? 'bg-rose-500 animate-pulse'
                        : 'bg-amber-500'
                    }`} />
                    {loan.status === 'returned'
                      ? 'Returned & Verified'
                      : isOverdue
                      ? 'Overdue Loan'
                      : 'Active Custody Check-Out'}
                  </span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(loan.id, 'Loan ID', 'hero-id')}
                    className="inline-flex items-center gap-1 font-mono text-xs text-neutral-400 hover:text-neutral-700 bg-neutral-100 hover:bg-neutral-200/80 px-2 py-0.5 rounded transition-colors cursor-pointer"
                    title="Click to copy Loan ID"
                  >
                    <span>ID: {loan.id}</span>
                    {copiedKey === 'hero-id' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3 text-neutral-400" />}
                  </button>
                </div>
                <h1 className="text-xl sm:text-2xl font-bold text-neutral-900 tracking-tight">
                  {loan.assetName}
                </h1>
                <div className="flex items-center gap-3 text-xs text-neutral-500 flex-wrap pt-0.5">
                  <button
                    type="button"
                    onClick={() => copyToClipboard(loan.serialNumber, 'Serial Number', 'hero-sn')}
                    className="inline-flex items-center gap-1 font-mono text-neutral-700 bg-neutral-100 hover:bg-neutral-200/80 px-2 py-0.5 rounded font-semibold transition-colors cursor-pointer"
                  >
                    <span>SN: {loan.serialNumber}</span>
                    {copiedKey === 'hero-sn' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3 text-neutral-400" />}
                  </button>
                  <span>•</span>
                  <span className="flex items-center gap-1 text-neutral-600">
                    <User className="w-3.5 h-3.5 text-neutral-400" />
                    Borrower: <strong className="text-neutral-900">{loan.borrowerName}</strong> ({loan.borrowerRole})
                  </span>
                </div>
              </div>
            </div>

            {/* Top Right Quick Actions */}
            <div className="flex items-center gap-2 self-start sm:self-center">
              <Link
                href={`/assets/${loan.assetId}`}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-neutral-700 bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 rounded-lg transition-colors shadow-2xs"
              >
                <span>View Hardware Device</span>
                <ExternalLink className="w-3.5 h-3.5 text-neutral-400" />
              </Link>
            </div>
          </div>
        </div>

        {/* 2-Column Responsive Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column (2/3 width): Details, Borrower, and Notes */}
          <div className="lg:col-span-2 space-y-6">
            {/* Card 1: Equipment Hardware Details */}
            <div className="bg-white border border-neutral-200/90 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
                <h3 className="text-xs font-bold text-neutral-900 uppercase tracking-wider flex items-center gap-2">
                  <Laptop className="w-4 h-4 text-blue-600" />
                  <span>Equipment Hardware Details</span>
                </h3>
                <Link
                  href={`/assets/${loan.assetId}`}
                  className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
                >
                  <span>Inspect Asset</span>
                  <ExternalLink className="w-3 h-3" />
                </Link>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="space-y-1">
                  <span className="text-neutral-400 font-medium block text-[11px]">Hardware Name</span>
                  <span className="font-bold text-neutral-900 text-sm">{loan.assetName}</span>
                </div>

                <div className="space-y-1">
                  <span className="text-neutral-400 font-medium block text-[11px]">Serial Identifier</span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(loan.serialNumber, 'Serial Number', 'card-sn')}
                    className="inline-flex items-center gap-1 font-mono font-bold text-neutral-800 bg-neutral-100 hover:bg-neutral-200/80 px-2 py-1 rounded-md transition-colors"
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
                      <span className="inline-flex items-center gap-1 font-medium text-emerald-700">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        {asset.status === 'operational' ? 'Operational' : asset.status}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <span className="text-neutral-400 font-medium block text-[11px]">Next Scheduled Audit / Calibration</span>
                      <span className="font-medium text-neutral-700">{asset.nextCalibration || 'Active'}</span>
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
            <div className="bg-white border border-neutral-200/90 rounded-2xl p-5 shadow-xs space-y-4">
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
                    {loan.borrowDate}
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
                    {loan.expectedReturnDate}
                  </div>
                  <span className={`text-[11px] font-medium mt-0.5 block ${isOverdue ? 'text-rose-600' : 'text-neutral-500'}`}>
                    {isOverdue ? '⚠ Overdue past deadline' : 'Scheduled deadline'}
                  </span>
                </div>

                <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200/70">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block">
                    Actual Return Date
                  </span>
                  <div className="text-sm font-bold text-emerald-700 font-mono mt-0.5">
                    {loan.actualReturnDate || 'Pending Return'}
                  </div>
                  <span className="text-[11px] text-neutral-500 mt-0.5 block">
                    {loan.status === 'returned' ? 'Verified in lab inventory' : 'Currently in custody'}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Actions Card */}
            <div className="bg-white border border-neutral-200/90 rounded-2xl p-5 shadow-xs space-y-3">
              <h3 className="text-xs font-bold text-neutral-900 uppercase tracking-wider">
                Staff Quick Actions
              </h3>

              <div className="space-y-2">
                {loan.status === 'active' && (
                  <button
                    type="button"
                    onClick={() => setIsReturnModalOpen(true)}
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-colors shadow-xs cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Check-In & Return Device</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => copyToClipboard(window.location.href, 'Dossier Link', 'share-link')}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold text-neutral-700 bg-white hover:bg-neutral-50 border border-neutral-200 rounded-xl transition-colors cursor-pointer"
                >
                  <Share2 className="w-3.5 h-3.5 text-neutral-500" />
                  <span>{copiedKey === 'share-link' ? 'Link Copied!' : 'Copy Dossier Link'}</span>
                </button>

                <Link
                  href="/loans"
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold text-neutral-600 hover:text-neutral-900 transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to Loans Directory</span>
                </Link>
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

              {/* Quick Inspection Presets */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-neutral-800 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Quick Inspection Presets</span>
                  </label>
                  <span className="text-[10px] text-neutral-400">Click to insert note</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    '✓ Tested & Fully Functional',
                    '✓ Power Adapter & Cables Returned',
                    '✓ No Physical Damage',
                    '⚠ Minor Surface Wear',
                    '⚠ Requires Software Reset',
                  ].map((chip) => (
                    <button
                      key={chip}
                      type="button"
                      onClick={() => {
                        setReturnNotes((prev) => {
                          if (!prev.trim()) return chip;
                          if (prev.includes(chip)) return prev;
                          return `${prev}\n${chip}`;
                        });
                      }}
                      className="text-[11px] font-medium px-2 py-1 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-700 border border-neutral-200 transition-colors cursor-pointer"
                    >
                      {chip}
                    </button>
                  ))}
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
                className="px-3.5 py-1.5 text-xs font-semibold text-neutral-700 bg-white border border-neutral-300 hover:bg-neutral-50 rounded-lg cursor-pointer transition-colors shadow-2xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmReturn}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg cursor-pointer transition-colors shadow-xs"
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
