'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/Header';
import { Dropdown } from '@/components/Dropdown';
import { DatePicker } from '@/components/DatePicker';
import { usePersistentTab } from '@/hooks/usePersistentTab';
import { useStock } from '@/context/StockContext';
import { useAuth } from '@/context/AuthContext';
import { exportToCsv } from '@/lib/exportCsv';
import {
  ArrowLeftRight,
  Plus,
  CheckCircle2,
  Clock,
  AlertCircle,
  MapPin,
  X,
  Search,
  ExternalLink,
  Laptop,
  User,
  Calendar,
  FileText,
  Sparkles,
  Eye,
  Copy,
  Check,
  ChevronRight,
  Building2,
  AlertTriangle,
  FileSpreadsheet,
  Shield,
} from 'lucide-react';
import { MockLoan, MockTransfer } from '@/types';

export default function LoansPage() {
  const router = useRouter();
  const { user, canManageLocation } = useAuth();
  const isAssistant = user?.roleBadge === 'Lab Assistant' || user?.role === 'Lab Assistant';
  const {
    loans,
    transfers,
    assets,
    locations,
    lendAsset,
    returnAsset,
    transferAsset,
    showToast,
  } = useStock();

  type LoanTab = 'active' | 'history' | 'transfers';
  const LOAN_TABS: readonly LoanTab[] = ['active', 'history', 'transfers'] as const;

  const [activeTab, handleTabChange] = usePersistentTab<LoanTab>(
    'csd_loans_active_tab',
    LOAN_TABS,
    'active'
  );
  const [filterText, setFilterText] = useState('');

  // Modals state
  const [isLendModalOpen, setIsLendModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [returningLoan, setReturningLoan] = useState<MockLoan | null>(null);
  const [returnNotes, setReturnNotes] = useState('');

  // Loan Details Modal state
  const [selectedLoanDetails, setSelectedLoanDetails] = useState<MockLoan | null>(null);
  const [selectedTransferDetails, setSelectedTransferDetails] = useState<MockTransfer | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Form states for Lend Device
  const [selectedAssetId, setSelectedAssetId] = useState('');
  const [borrowerName, setBorrowerName] = useState('');
  const [borrowerRole, setBorrowerRole] = useState<'Student' | 'Lecturer' | 'Lab Assistant' | 'Technician'>('Student');
  const [borrowerContact, setBorrowerContact] = useState('');
  const [courseOrClass, setCourseOrClass] = useState('');
  const [borrowDate, setBorrowDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [expectedReturnDate, setExpectedReturnDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().split('T')[0];
  });
  const [loanNotes, setLoanNotes] = useState('');

  // Form states for Relocate Device
  const [transferAssetId, setTransferAssetId] = useState('');
  const [toLocation, setToLocation] = useState('');
  const [transferReason, setTransferReason] = useState('');
  const [transferredBy, setTransferredBy] = useState(() => user?.name || 'Dr. Heng Sovannarith');

  useEffect(() => {
    if (user?.name) {
      setTransferredBy(user.name);
    }
  }, [user]);

  const todayStr = new Date().toISOString().split('T')[0];

  const activeLoans = loans.filter((l) => l.status === 'active');
  const overdueLoans = activeLoans.filter((l) => l.expectedReturnDate < todayStr);
  const returnedLoans = loans.filter((l) => l.status === 'returned');

  // Filtered lists
  const filteredActiveLoans = activeLoans.filter(
    (l) =>
      l.assetName.toLowerCase().includes(filterText.toLowerCase()) ||
      l.borrowerName.toLowerCase().includes(filterText.toLowerCase()) ||
      l.serialNumber.toLowerCase().includes(filterText.toLowerCase()) ||
      (l.courseOrClass && l.courseOrClass.toLowerCase().includes(filterText.toLowerCase()))
  );

  const filteredHistoryLoans = returnedLoans.filter(
    (l) =>
      l.assetName.toLowerCase().includes(filterText.toLowerCase()) ||
      l.borrowerName.toLowerCase().includes(filterText.toLowerCase()) ||
      l.serialNumber.toLowerCase().includes(filterText.toLowerCase())
  );

  const filteredTransfers = transfers.filter(
    (t) =>
      t.assetName.toLowerCase().includes(filterText.toLowerCase()) ||
      t.serialNumber.toLowerCase().includes(filterText.toLowerCase()) ||
      t.fromLocation.toLowerCase().includes(filterText.toLowerCase()) ||
      t.toLocation.toLowerCase().includes(filterText.toLowerCase())
  );

  const copyToClipboard = (text: string, label: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    showToast(`Copied ${label} to clipboard`);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleExport = () => {
    if (activeTab === 'transfers') {
      exportToCsv(
        'csd_stock_relocation_logs',
        filteredTransfers.map((t) => ({
          'Relocation ID': t.id,
          'Equipment Name': t.assetName,
          'Serial Number': t.serialNumber,
          'From Lab Room': t.fromLocation,
          'To Lab Room': t.toLocation,
          'Transfer Date': t.transferDate,
          'Authorized By': t.transferredBy,
          'Relocation Reason': t.reason || 'Laboratory Reconfiguration',
        }))
      );
    } else {
      const targetLoans = activeTab === 'history' ? filteredHistoryLoans : filteredActiveLoans;
      exportToCsv(
        'csd_stock_device_loans',
        targetLoans.map((l) => ({
          'Loan ID': l.id,
          'Equipment Name': l.assetName,
          'Serial Number': l.serialNumber,
          'Borrower Name': l.borrowerName,
          'Borrower Role': l.borrowerRole,
          'Contact / Student ID': l.borrowerContact,
          'Course / Practical Class': l.courseOrClass || '',
          'Checkout Date': l.borrowDate,
          'Expected Due Date': l.expectedReturnDate,
          'Actual Return Date': l.actualReturnDate || 'Pending Return',
          'Loan Status': l.status,
          'Supervisor / Staff Notes': l.notes || '',
        }))
      );
    }
  };

  const handleCreateLoan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAssetId || !borrowerName.trim()) {
      showToast('Please select a device and enter the borrower name.', 'error');
      return;
    }
    const asset = assets.find((a) => a.id === selectedAssetId);
    if (!asset) return;

    if (!canManageLocation(asset.location)) {
      showToast('Action restricted: equipment is stationed outside your assigned laboratory room.', 'error');
      return;
    }

    lendAsset({
      assetId: asset.id,
      assetName: asset.name,
      serialNumber: asset.serialNumber,
      borrowerName: borrowerName.trim(),
      borrowerRole,
      borrowerContact: borrowerContact.trim() || 'No contact provided',
      courseOrClass: courseOrClass.trim() || undefined,
      borrowDate,
      expectedReturnDate,
      notes: loanNotes.trim() || undefined,
    });

    setIsLendModalOpen(false);
    setSelectedAssetId('');
    setBorrowerName('');
    setBorrowerContact('');
    setCourseOrClass('');
    setLoanNotes('');
  };

  const handleCreateTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferAssetId || !toLocation) {
      showToast('Please select an equipment item and target lab room.', 'error');
      return;
    }

    const asset = assets.find((a) => a.id === transferAssetId);
    if (!asset) return;

    if (!canManageLocation(asset.location)) {
      showToast('Action restricted: equipment is stationed outside your assigned laboratory room.', 'error');
      return;
    }

    transferAsset(transferAssetId, toLocation, transferReason.trim(), transferredBy.trim());
    setIsTransferModalOpen(false);
    setTransferAssetId('');
    setToLocation('');
    setTransferReason('');
  };

  const handleConfirmReturn = () => {
    if (!returningLoan) return;
    const loanAsset = assets.find((a) => a.id === returningLoan.assetId);
    if (loanAsset && !canManageLocation(loanAsset.location)) {
      showToast('Action restricted: equipment belongs to a room outside your assigned laboratory scope.', 'error');
      return;
    }

    returnAsset(returningLoan.id, returnNotes.trim() || undefined);
    // If the details modal is showing this loan, update or close it
    if (selectedLoanDetails && selectedLoanDetails.id === returningLoan.id) {
      setSelectedLoanDetails(null);
    }
    setReturningLoan(null);
    setReturnNotes('');
  };

  const selectedTransferAsset = assets.find((a) => a.id === transferAssetId);
  const detailAsset = selectedLoanDetails ? assets.find((a) => a.id === selectedLoanDetails.assetId) : null;

  return (
    <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-neutral-50/50">
      {/* 1. Header with Actions */}
      <Header
        title="Device Loans & Relocations"
        subtitle="Faculty Equipment Lending, Student Check-Out & Room Movement"
        onExport={handleExport}
        actions={
          isAssistant ? undefined : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  if (assets.length > 0) setTransferAssetId(assets[0].id);
                  setToLocation('');
                  if (user?.name) setTransferredBy(user.name);
                  setIsTransferModalOpen(true);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-neutral-700 bg-white border border-neutral-200 hover:border-neutral-300 rounded-lg hover:bg-neutral-50 transition-colors shadow-2xs cursor-pointer"
              >
                <ArrowLeftRight className="w-3.5 h-3.5 text-blue-600" />
                <span className="hidden sm:inline">Relocate Device</span>
              </button>
              <button
                onClick={() => {
                  const available = assets.filter((a) => a.loanStatus !== 'on_loan');
                  if (available.length > 0) setSelectedAssetId(available[0].id);
                  setIsLendModalOpen(true);
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-neutral-900 hover:bg-neutral-800 rounded-lg transition-colors shadow-xs cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 text-emerald-400" />
                <span>Check-Out Device</span>
              </button>
            </div>
          )
        }
      />

      <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6 max-w-8xl w-full mx-auto">
        {/* Assistant View-Only Notice Banner */}
        {isAssistant && (
          <div className="p-3.5 bg-neutral-100 border border-neutral-300 rounded-lg flex items-center gap-3 text-neutral-800 text-xs shadow-2xs">
            <Shield className="w-4 h-4 text-neutral-600 shrink-0" />
            <div>
              <span className="font-semibold">View-Only Department Inspection Mode:</span> Lab Assistants have read-only inspection access. Equipment loans and room transfers cannot be processed.
            </div>
          </div>
        )}
        {/* 2. Sleek KPI Metrics Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-white border border-neutral-200/90 rounded-2xl p-4 shadow-xs">
            <div className="flex items-center justify-between text-neutral-500 mb-1">
              <span className="text-xs font-medium">Active Loans</span>
              <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                <Laptop className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-bold text-neutral-900 mt-1">
              {activeLoans.length} <span className="text-xs font-normal text-neutral-500">units</span>
            </div>
            <div className="text-[11px] text-neutral-500 mt-1">In student / faculty possession</div>
          </div>

          <div className="bg-white border border-neutral-200/90 rounded-2xl p-4 shadow-xs">
            <div className="flex items-center justify-between text-neutral-500 mb-1">
              <span className="text-xs font-medium">Overdue Returns</span>
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                overdueLoans.length > 0 ? 'bg-rose-50 text-rose-600' : 'bg-neutral-100 text-neutral-400'
              }`}>
                <AlertCircle className="w-4 h-4" />
              </div>
            </div>
            <div className={`text-2xl font-bold mt-1 ${overdueLoans.length > 0 ? 'text-rose-600' : 'text-neutral-900'}`}>
              {overdueLoans.length} <span className="text-xs font-normal text-neutral-500">pending</span>
            </div>
            <div className="text-[11px] text-neutral-500 mt-1">
              {overdueLoans.length > 0 ? 'Requires lab follow-up' : 'All returns on schedule'}
            </div>
          </div>

          <div className="bg-white border border-neutral-200/90 rounded-2xl p-4 shadow-xs">
            <div className="flex items-center justify-between text-neutral-500 mb-1">
              <span className="text-xs font-medium">Returned & Verified</span>
              <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-bold text-neutral-900 mt-1">
              {returnedLoans.length} <span className="text-xs font-normal text-neutral-500">records</span>
            </div>
            <div className="text-[11px] text-neutral-500 mt-1">Returned to lab stock safely</div>
          </div>

          <div className="bg-white border border-neutral-200/90 rounded-2xl p-4 shadow-xs">
            <div className="flex items-center justify-between text-neutral-500 mb-1">
              <span className="text-xs font-medium">Room Relocations</span>
              <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                <ArrowLeftRight className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-bold text-neutral-900 mt-1">
              {transfers.length} <span className="text-xs font-normal text-neutral-500">transfers</span>
            </div>
            <div className="text-[11px] text-neutral-500 mt-1">Across all faculty lab rooms</div>
          </div>
        </div>

        {/* 3. Segmented Navigation & Search Filter Toolbar */}
        <div className="bg-white border border-neutral-200/90 rounded-2xl p-3.5 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Filter by device name, serial number, borrower, or room..."
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              className="w-full bg-neutral-50/70 border border-neutral-200 text-neutral-900 text-xs pl-9 pr-8 py-2 rounded-lg focus:outline-none focus:border-neutral-900 focus:bg-white focus:ring-1 focus:ring-neutral-900 font-medium transition-all placeholder:text-neutral-400"
            />
            {filterText && (
              <button
                type="button"
                onClick={() => setFilterText('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700 p-0.5"
                title="Clear filter"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Segmented Tabs */}
          <div className="flex items-center gap-1 bg-neutral-100 p-1 rounded-xl border border-neutral-200/80 text-xs font-semibold shrink-0">
            <button
              onClick={() => handleTabChange('active')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                activeTab === 'active'
                  ? 'bg-white text-neutral-900 shadow-2xs font-bold'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              Active Loans ({activeLoans.length})
            </button>
            <button
              onClick={() => handleTabChange('history')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                activeTab === 'history'
                  ? 'bg-white text-neutral-900 shadow-2xs font-bold'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              Loan History ({returnedLoans.length})
            </button>
            <button
              onClick={() => handleTabChange('transfers')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                activeTab === 'transfers'
                  ? 'bg-white text-neutral-900 shadow-2xs font-bold'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              Relocations ({transfers.length})
            </button>
          </div>
        </div>

        {/* 4. Tab 1: Active Loans Table */}
        {activeTab === 'active' && (
          <div className="bg-white border border-neutral-200/90 rounded-2xl overflow-hidden shadow-xs space-y-0">
            <div className="p-4 border-b border-neutral-100 bg-neutral-50/50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-amber-50 text-amber-600 flex items-center justify-center">
                  <Laptop className="w-3.5 h-3.5" />
                </div>
                <h2 className="text-xs font-bold text-neutral-900 uppercase tracking-wider">
                  Active Equipment Check-Outs ({filteredActiveLoans.length})
                </h2>
              </div>
              <span className="text-[11px] font-medium text-neutral-500">
                Click any row to view full loan dossier
              </span>
            </div>

            {filteredActiveLoans.length === 0 ? (
              <div className="py-12 px-4 text-center space-y-3">
                <div className="w-10 h-10 rounded-full bg-neutral-100 text-neutral-400 flex items-center justify-center mx-auto">
                  <Laptop className="w-5 h-5" />
                </div>
                <p className="text-xs text-neutral-500">
                  {filterText
                    ? `No active loans matching "${filterText}".`
                    : 'No devices currently checked out to students or faculty.'}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    const available = assets.filter((a) => a.loanStatus !== 'on_loan');
                    if (available.length > 0) setSelectedAssetId(available[0].id);
                    setIsLendModalOpen(true);
                  }}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Check Out Equipment
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs min-w-[840px]">
                  <thead>
                    <tr className="border-b border-neutral-200 bg-neutral-50/70 text-neutral-600 font-semibold uppercase tracking-wider text-[10px]">
                      <th className="py-3 px-4">Equipment & Serial</th>
                      <th className="py-3 px-4">Borrower Details</th>
                      <th className="py-3 px-4">Course / Project</th>
                      <th className="py-3 px-4">Check-Out Date</th>
                      <th className="py-3 px-4">Due Return Date</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {filteredActiveLoans.map((loan) => {
                      const isOverdue = loan.expectedReturnDate < todayStr;
                      return (
                        <tr
                          key={loan.id}
                          onClick={() => router.push(`/loans/${loan.id}`)}
                          className="hover:bg-neutral-50/80 transition-colors cursor-pointer group"
                        >
                          <td className="py-3.5 px-4">
                            <div className="font-bold text-neutral-900 group-hover:text-emerald-700 transition-colors flex items-center gap-1.5">
                              <span>{loan.assetName}</span>
                              <ExternalLink className="w-3 h-3 text-neutral-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                copyToClipboard(loan.serialNumber, 'Serial Number', loan.id);
                              }}
                              className="mt-0.5 inline-flex items-center gap-1 font-mono text-[10px] text-neutral-600 bg-neutral-100 hover:bg-neutral-200/80 px-1.5 py-0.5 rounded transition-colors"
                              title="Click to copy serial"
                            >
                              <span>SN: {loan.serialNumber}</span>
                              {copiedKey === loan.id ? (
                                <Check className="w-2.5 h-2.5 text-emerald-600" />
                              ) : (
                                <Copy className="w-2.5 h-2.5 text-neutral-400" />
                              )}
                            </button>
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="font-semibold text-neutral-900">{loan.borrowerName}</div>
                            <div className="text-[11px] text-neutral-500 flex items-center gap-1.5 mt-0.5">
                              <span className="inline-block bg-neutral-100 text-neutral-700 border border-neutral-200 px-1.5 py-0.2 rounded text-[10px] font-medium">
                                {loan.borrowerRole}
                              </span>
                              <span className="truncate max-w-[150px]">{loan.borrowerContact}</span>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-neutral-600 max-w-xs truncate font-medium">
                            {loan.courseOrClass || 'General Lab Practical'}
                          </td>
                          <td className="py-3.5 px-4 text-neutral-600 font-mono text-[11px]">
                            {loan.borrowDate}
                          </td>
                          <td className="py-3.5 px-4 font-mono text-[11px]">
                            <span className={isOverdue ? 'text-rose-600 font-bold' : 'text-neutral-800 font-semibold'}>
                              {loan.expectedReturnDate}
                            </span>
                            {isOverdue && (
                              <span className="block text-[10px] text-rose-500 font-sans font-semibold">
                                Overdue
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-4">
                            {isOverdue ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-rose-50 text-rose-700 border border-rose-200">
                                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                                Overdue
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-amber-50 text-amber-700 border border-amber-200">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                                On Loan
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => router.push(`/loans/${loan.id}`)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-neutral-700 bg-white border border-neutral-200 hover:border-neutral-300 rounded-lg hover:bg-neutral-50 shadow-2xs transition-all cursor-pointer"
                                title="Open dedicated loan dossier page"
                              >
                                <Eye className="w-3.5 h-3.5 text-neutral-400" />
                                <span>Details</span>
                              </button>
                              {!isAssistant && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setReturningLoan(loan);
                                    setReturnNotes('');
                                  }}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors shadow-2xs cursor-pointer"
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                  <span>Return</span>
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
        )}

        {/* 5. Tab 2: Loan History Table */}
        {activeTab === 'history' && (
          <div className="bg-white border border-neutral-200/90 rounded-2xl overflow-hidden shadow-xs space-y-0">
            <div className="p-4 border-b border-neutral-100 bg-neutral-50/50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </div>
                <h2 className="text-xs font-bold text-neutral-900 uppercase tracking-wider">
                  Past Returns & Lending History ({filteredHistoryLoans.length})
                </h2>
              </div>
              <span className="text-[11px] font-medium text-neutral-500">
                Archived return logs with inspection records
              </span>
            </div>

            {filteredHistoryLoans.length === 0 ? (
              <div className="py-12 px-4 text-center space-y-2">
                <p className="text-xs text-neutral-500">No past return records match current query.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs min-w-[840px]">
                  <thead>
                    <tr className="border-b border-neutral-200 bg-neutral-50/70 text-neutral-600 font-semibold uppercase tracking-wider text-[10px]">
                      <th className="py-3 px-4">Equipment & Serial</th>
                      <th className="py-3 px-4">Borrower</th>
                      <th className="py-3 px-4">Check-Out Date</th>
                      <th className="py-3 px-4">Actual Return Date</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Staff Inspection Notes</th>
                      <th className="py-3 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {filteredHistoryLoans.map((loan) => (
                      <tr
                        key={loan.id}
                        onClick={() => router.push(`/loans/${loan.id}`)}
                        className="hover:bg-neutral-50/80 transition-colors cursor-pointer group"
                      >
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-neutral-900 group-hover:text-emerald-700 transition-colors flex items-center gap-1.5">
                            <span>{loan.assetName}</span>
                            <ExternalLink className="w-3 h-3 text-neutral-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                          <div className="text-[10px] text-neutral-500 font-mono mt-0.5">
                            SN: {loan.serialNumber}
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-neutral-900">{loan.borrowerName}</div>
                          <div className="text-[11px] text-neutral-500">
                            {loan.borrowerRole} • {loan.borrowerContact}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-neutral-600 font-mono text-[11px]">
                          {loan.borrowDate}
                        </td>
                        <td className="py-3.5 px-4 text-emerald-700 font-mono font-bold text-[11px]">
                          {loan.actualReturnDate || 'Returned'}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            Returned
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-neutral-600 max-w-xs truncate font-medium">
                          {loan.notes || 'Returned in good working condition.'}
                        </td>
                        <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={() => router.push(`/loans/${loan.id}`)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-neutral-700 bg-white border border-neutral-200 hover:border-neutral-300 rounded-lg hover:bg-neutral-50 shadow-2xs transition-all cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5 text-neutral-400" />
                            <span>Details</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* 6. Tab 3: Relocation / Transfer History */}
        {activeTab === 'transfers' && (
          <div className="bg-white border border-neutral-200/90 rounded-2xl overflow-hidden shadow-xs space-y-0">
            <div className="p-4 border-b border-neutral-100 bg-neutral-50/50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-blue-50 text-blue-600 flex items-center justify-center">
                  <ArrowLeftRight className="w-3.5 h-3.5" />
                </div>
                <h2 className="text-xs font-bold text-neutral-900 uppercase tracking-wider">
                  Equipment Room Movement & Relocation Logs ({filteredTransfers.length})
                </h2>
              </div>
              <span className="text-[11px] font-medium text-neutral-500">
                Verified equipment physical movements
              </span>
            </div>

            {filteredTransfers.length === 0 ? (
              <div className="py-12 px-4 text-center space-y-2">
                <p className="text-xs text-neutral-500">No equipment movement records found.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs min-w-[840px]">
                  <thead>
                    <tr className="border-b border-neutral-200 bg-neutral-50/70 text-neutral-600 font-semibold uppercase tracking-wider text-[10px]">
                      <th className="py-3 px-4">Equipment & Serial</th>
                      <th className="py-3 px-4">From Location</th>
                      <th className="py-3 px-4">Destination Room</th>
                      <th className="py-3 px-4">Transfer Date</th>
                      <th className="py-3 px-4">Authorized By</th>
                      <th className="py-3 px-4">Relocation Purpose / Notes</th>
                      <th className="py-3 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {filteredTransfers.map((transfer) => (
                      <tr
                        key={transfer.id}
                        onClick={() => setSelectedTransferDetails(transfer)}
                        className="hover:bg-neutral-50/80 transition-colors cursor-pointer group"
                      >
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-neutral-900 group-hover:text-blue-600 transition-colors flex items-center gap-1.5">
                            <span>{transfer.assetName}</span>
                            <ExternalLink className="w-3 h-3 text-neutral-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                          <div className="text-[10px] text-neutral-500 font-mono mt-0.5">
                            SN: {transfer.serialNumber}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-neutral-600 font-medium">
                          {transfer.fromLocation}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="inline-flex items-center gap-1 text-emerald-800 font-semibold bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full text-[11px]">
                            <MapPin className="w-3 h-3 text-emerald-600" />
                            {transfer.toLocation}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-neutral-600 font-mono text-[11px]">
                          {transfer.transferDate}
                        </td>
                        <td className="py-3.5 px-4 text-neutral-900 font-semibold">
                          {transfer.transferredBy}
                        </td>
                        <td className="py-3.5 px-4 text-neutral-600 max-w-xs truncate">
                          {transfer.reason || 'Laboratory workshop re-allocation'}
                        </td>
                        <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={() => setSelectedTransferDetails(transfer)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-neutral-700 bg-white border border-neutral-200 hover:border-neutral-300 rounded-lg hover:bg-neutral-50 shadow-2xs transition-all cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5 text-neutral-400" />
                            <span>Details</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 7. Loan Details Modal (View Details feature requested by user) */}
      {selectedLoanDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl border border-neutral-200 shadow-2xl max-w-xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-5 border-b border-neutral-200 bg-neutral-50/70 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  selectedLoanDetails.status === 'returned'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : selectedLoanDetails.expectedReturnDate < todayStr
                    ? 'bg-rose-50 text-rose-700 border border-rose-200'
                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                }`}>
                  <Laptop className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full border ${
                      selectedLoanDetails.status === 'returned'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : selectedLoanDetails.expectedReturnDate < todayStr
                        ? 'bg-rose-50 text-rose-700 border-rose-200'
                        : 'bg-amber-50 text-amber-700 border-amber-200'
                    }`}>
                      {selectedLoanDetails.status === 'returned'
                        ? 'Returned & Verified'
                        : selectedLoanDetails.expectedReturnDate < todayStr
                        ? 'Overdue Loan'
                        : 'Active Check-Out'}
                    </span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(selectedLoanDetails.id, 'Loan ID', 'loan-id')}
                      className="text-[10px] text-neutral-400 font-mono hover:text-neutral-700 flex items-center gap-1"
                      title="Copy Loan ID"
                    >
                      <span>ID: {selectedLoanDetails.id.slice(0, 8)}...</span>
                      {copiedKey === 'loan-id' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                    </button>
                  </div>
                  <h3 className="font-bold text-base text-neutral-900 mt-0.5">
                    {selectedLoanDetails.assetName}
                  </h3>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedLoanDetails(null)}
                className="p-1.5 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 rounded-lg cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {/* Overdue Warning Alert */}
              {selectedLoanDetails.status === 'active' && selectedLoanDetails.expectedReturnDate < todayStr && (
                <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start gap-2.5">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="font-bold">Overdue Return Warning:</strong> This equipment device was expected to be returned on <span className="font-mono font-bold">{selectedLoanDetails.expectedReturnDate}</span>. Please contact the borrower immediately for check-in inspection.
                  </div>
                </div>
              )}

              {/* Equipment Information Section */}
              <div className="bg-neutral-50/70 border border-neutral-200/80 rounded-xl p-4 space-y-2.5">
                <div className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider">
                  Equipment Hardware Details
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-neutral-500 block text-[11px]">Hardware Name:</span>
                    <strong className="text-neutral-900 font-semibold">{selectedLoanDetails.assetName}</strong>
                  </div>
                  <div>
                    <span className="text-neutral-500 block text-[11px]">Serial Number:</span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(selectedLoanDetails.serialNumber, 'Serial Number', 'modal-sn')}
                      className="font-mono font-bold text-neutral-800 hover:text-emerald-700 inline-flex items-center gap-1 bg-white border border-neutral-200 px-2 py-0.5 rounded text-[11px]"
                    >
                      <span>{selectedLoanDetails.serialNumber}</span>
                      {copiedKey === 'modal-sn' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3 text-neutral-400" />}
                    </button>
                  </div>
                  {detailAsset && (
                    <>
                      <div>
                        <span className="text-neutral-500 block text-[11px]">Device Model:</span>
                        <span className="text-neutral-800 font-medium">{detailAsset.model}</span>
                      </div>
                      <div>
                        <span className="text-neutral-500 block text-[11px]">Home Location:</span>
                        <span className="text-neutral-800 font-medium">{detailAsset.location}</span>
                      </div>
                    </>
                  )}
                </div>
                <div className="pt-2 border-t border-neutral-200/60">
                  <Link
                    href={`/assets/${selectedLoanDetails.assetId}`}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 hover:text-emerald-800"
                  >
                    <span>Inspect Full Equipment Asset Dossier</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>

              {/* Borrower Profile Section */}
              <div className="bg-neutral-50/70 border border-neutral-200/80 rounded-xl p-4 space-y-3">
                <div className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider">
                  Borrower Identity & Contact
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-neutral-900 text-white flex items-center justify-center font-bold text-sm shrink-0">
                    {selectedLoanDetails.borrowerName.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className="text-sm font-bold text-neutral-900">
                      {selectedLoanDetails.borrowerName}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-neutral-500 mt-0.5">
                      <span className="inline-block bg-neutral-200 text-neutral-800 px-2 py-0.5 rounded text-[10px] font-semibold">
                        {selectedLoanDetails.borrowerRole}
                      </span>
                      <span>•</span>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(selectedLoanDetails.borrowerContact, 'Borrower Contact', 'modal-contact')}
                        className="hover:text-neutral-900 inline-flex items-center gap-1 font-medium"
                      >
                        <span>{selectedLoanDetails.borrowerContact}</span>
                        {copiedKey === 'modal-contact' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3 text-neutral-400" />}
                      </button>
                    </div>
                  </div>
                </div>

                {selectedLoanDetails.courseOrClass && (
                  <div className="pt-2 border-t border-neutral-200/60 text-xs text-neutral-600">
                    <span className="text-neutral-400">Class / Project: </span>
                    <strong className="text-neutral-800">{selectedLoanDetails.courseOrClass}</strong>
                  </div>
                )}
              </div>

              {/* Loan Timeline Schedule Section */}
              <div className="bg-neutral-50/70 border border-neutral-200/80 rounded-xl p-4 space-y-2.5">
                <div className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider">
                  Timeline & Custody Dates
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                  <div className="bg-white p-2.5 rounded-lg border border-neutral-200/80">
                    <span className="text-neutral-400 block text-[10px] font-semibold uppercase">Check-Out Date</span>
                    <strong className="text-neutral-900 font-mono text-xs mt-0.5 block">
                      {selectedLoanDetails.borrowDate}
                    </strong>
                  </div>
                  <div className="bg-white p-2.5 rounded-lg border border-neutral-200/80">
                    <span className="text-neutral-400 block text-[10px] font-semibold uppercase">Due Return Date</span>
                    <strong className={`font-mono text-xs mt-0.5 block ${
                      selectedLoanDetails.status === 'active' && selectedLoanDetails.expectedReturnDate < todayStr
                        ? 'text-rose-600'
                        : 'text-neutral-900'
                    }`}>
                      {selectedLoanDetails.expectedReturnDate}
                    </strong>
                  </div>
                  <div className="bg-white p-2.5 rounded-lg border border-neutral-200/80 col-span-2 sm:col-span-1">
                    <span className="text-neutral-400 block text-[10px] font-semibold uppercase">Actual Return Date</span>
                    <strong className="text-emerald-700 font-mono text-xs mt-0.5 block">
                      {selectedLoanDetails.actualReturnDate || 'Pending Return'}
                    </strong>
                  </div>
                </div>
              </div>

              {/* Staff Notes & Inspection Log */}
              <div className="bg-neutral-50/70 border border-neutral-200/80 rounded-xl p-4 space-y-1.5">
                <div className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider">
                  Supervisor Notes & Condition Log
                </div>
                <p className="text-xs text-neutral-700 whitespace-pre-line leading-relaxed bg-white p-3 rounded-lg border border-neutral-200/80">
                  {selectedLoanDetails.notes || 'No specific notes recorded for this loan session.'}
                </p>
              </div>
            </div>

            {/* Modal Action Footer */}
            <div className="p-4 border-t border-neutral-200 bg-neutral-50/90 flex items-center justify-between shrink-0">
              <button
                type="button"
                onClick={() => setSelectedLoanDetails(null)}
                className="px-3.5 py-1.5 text-xs font-semibold text-neutral-700 bg-white border border-neutral-300 hover:bg-neutral-50 rounded-lg cursor-pointer transition-colors shadow-2xs"
              >
                Close
              </button>

              <div className="flex items-center gap-2">
                {selectedLoanDetails.status === 'active' && (
                  <button
                    type="button"
                    onClick={() => {
                      const loanToReturn = selectedLoanDetails;
                      setSelectedLoanDetails(null);
                      setReturningLoan(loanToReturn);
                      setReturnNotes('');
                    }}
                    className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg cursor-pointer transition-colors shadow-xs"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Check-In / Return Device</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 8. Transfer Details Modal */}
      {selectedTransferDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl border border-neutral-200 shadow-2xl max-w-lg w-full overflow-hidden flex flex-col animate-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-neutral-200 bg-neutral-50/70 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-200">
                  <ArrowLeftRight className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-neutral-900">Equipment Relocation Log</h3>
                  <p className="text-xs text-neutral-500 font-mono mt-0.5">SN: {selectedTransferDetails.serialNumber}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedTransferDetails(null)}
                className="p-1.5 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 rounded-lg cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="bg-neutral-50 p-4 rounded-xl border border-neutral-200 space-y-3">
                <div className="text-sm font-bold text-neutral-900">
                  {selectedTransferDetails.assetName}
                </div>

                <div className="flex items-center justify-between bg-white p-3 rounded-lg border border-neutral-200">
                  <div className="text-xs">
                    <span className="text-[10px] text-neutral-400 font-bold uppercase block">Origin Room</span>
                    <strong className="text-neutral-800">{selectedTransferDetails.fromLocation}</strong>
                  </div>
                  <ArrowLeftRight className="w-4 h-4 text-blue-500 shrink-0 mx-2" />
                  <div className="text-xs text-right">
                    <span className="text-[10px] text-neutral-400 font-bold uppercase block">Target Room</span>
                    <strong className="text-emerald-700">{selectedTransferDetails.toLocation}</strong>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs pt-1">
                  <div>
                    <span className="text-neutral-400 block text-[11px]">Movement Date:</span>
                    <strong className="text-neutral-800 font-mono">{selectedTransferDetails.transferDate}</strong>
                  </div>
                  <div>
                    <span className="text-neutral-400 block text-[11px]">Authorized Operator:</span>
                    <strong className="text-neutral-800">{selectedTransferDetails.transferredBy}</strong>
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider">
                  Relocation Justification:
                </label>
                <p className="text-xs text-neutral-700 bg-neutral-50 p-3 rounded-lg border border-neutral-200">
                  {selectedTransferDetails.reason || 'Routine laboratory workshop reallocation.'}
                </p>
              </div>
            </div>

            <div className="p-4 border-t border-neutral-200 bg-neutral-50/70 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedTransferDetails(null)}
                className="px-4 py-1.5 text-xs font-semibold text-neutral-700 bg-white border border-neutral-300 hover:bg-neutral-50 rounded-lg cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 9. Lend Device Modal */}
      {isLendModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-neutral-200 shadow-2xl max-w-xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="h-14 px-5 border-b border-neutral-200 flex items-center justify-between shrink-0 bg-neutral-50/80">
              <div className="flex items-center gap-2">
                <Laptop className="w-4 h-4 text-emerald-600" />
                <h3 className="font-semibold text-sm text-neutral-900">Check-Out / Lend Equipment</h3>
              </div>
              <button
                onClick={() => setIsLendModalOpen(false)}
                className="p-1 text-neutral-400 hover:text-neutral-700 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form id="lend-device-form" onSubmit={handleCreateLoan} className="flex-1 overflow-y-auto p-5 pb-12 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Select Equipment / Device <span className="text-rose-500">*</span>
                </label>
                <Dropdown
                  value={selectedAssetId}
                  onChange={(val) => setSelectedAssetId(val)}
                  options={assets
                    .filter((a) => canManageLocation(a.location))
                    .map((a) => ({
                      value: a.id,
                      label: `${a.name} (SN: ${a.serialNumber}) — ${a.location}${a.loanStatus === 'on_loan' ? ' [ON LOAN]' : ''}`,
                    }))}
                  placeholder="Select device to check out"
                  searchable={true}
                  searchPlaceholder="Search device by name, model or serial number..."
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">
                    Borrower Full Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Sokha Chan"
                    value={borrowerName}
                    onChange={(e) => setBorrowerName(e.target.value)}
                    className="w-full bg-white text-xs border border-neutral-300 rounded-lg px-3 py-2 text-neutral-900 focus:outline-none focus:border-neutral-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">
                    Borrower Role
                  </label>
                  <Dropdown
                    value={borrowerRole}
                    onChange={(val) => setBorrowerRole(val as any)}
                    options={[
                      { value: 'Student', label: 'Student' },
                      { value: 'Lecturer', label: 'Lecturer' },
                      { value: 'Lab Assistant', label: 'Lab Assistant' },
                      { value: 'Technician', label: 'Technician' },
                    ]}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">
                    Contact / Student ID
                  </label>
                  <input
                    type="text"
                    placeholder="ID: e20230114 / Tel: 012 345 678"
                    value={borrowerContact}
                    onChange={(e) => setBorrowerContact(e.target.value)}
                    className="w-full bg-white text-xs border border-neutral-300 rounded-lg px-3 py-2 text-neutral-900 focus:outline-none focus:border-neutral-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">
                    Class / Course / Subject
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. CS Year 4 Advanced Networks"
                    value={courseOrClass}
                    onChange={(e) => setCourseOrClass(e.target.value)}
                    className="w-full bg-white text-xs border border-neutral-300 rounded-lg px-3 py-2 text-neutral-900 focus:outline-none focus:border-neutral-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">
                    Borrow Date
                  </label>
                  <DatePicker value={borrowDate} onChange={setBorrowDate} />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">
                    Expected Return Date
                  </label>
                  <DatePicker value={expectedReturnDate} onChange={setExpectedReturnDate} align="right" openDirection="auto" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Purpose / Notes
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Capstone presentation rehearsal, returned with charger and cables"
                  value={loanNotes}
                  onChange={(e) => setLoanNotes(e.target.value)}
                  className="w-full bg-white text-xs border border-neutral-300 rounded-lg p-2.5 text-neutral-900 focus:outline-none focus:border-neutral-900"
                />
              </div>
            </form>

            <div className="h-14 px-5 border-t border-neutral-200 bg-neutral-50/90 flex items-center justify-end gap-2 shrink-0 rounded-b-2xl">
              <button
                type="button"
                onClick={() => setIsLendModalOpen(false)}
                className="px-3.5 py-2 text-xs font-semibold text-neutral-700 bg-white border border-neutral-300 hover:bg-neutral-50 rounded-lg cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="lend-device-form"
                className="px-4 py-2 text-xs font-semibold text-white bg-neutral-900 hover:bg-neutral-800 rounded-lg cursor-pointer transition-colors shadow-2xs"
              >
                Confirm Check-Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 10. Relocate Device Modal */}
      {isTransferModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-neutral-200 shadow-2xl max-w-lg w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="h-14 px-5 border-b border-neutral-200 flex items-center justify-between shrink-0 bg-neutral-50/80">
              <div className="flex items-center gap-2">
                <ArrowLeftRight className="w-4 h-4 text-blue-600" />
                <h3 className="font-semibold text-sm text-neutral-900">Relocate Device to Another Lab</h3>
              </div>
              <button
                onClick={() => setIsTransferModalOpen(false)}
                className="p-1 text-neutral-400 hover:text-neutral-700 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form id="transfer-device-form" onSubmit={handleCreateTransfer} className="flex-1 overflow-y-auto p-5 pb-12 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Select Equipment to Relocate <span className="text-rose-500">*</span>
                </label>
                <Dropdown
                  value={transferAssetId}
                  onChange={(val) => setTransferAssetId(val)}
                  options={assets
                    .filter((a) => canManageLocation(a.location))
                    .map((a) => ({
                      value: a.id,
                      label: `${a.name} (SN: ${a.serialNumber}) — ${a.location}`,
                    }))}
                  placeholder="Select device to relocate"
                  searchable={true}
                  searchPlaceholder="Search by device name, model, or serial..."
                />
              </div>

              {selectedTransferAsset && (
                <div className="p-3 bg-neutral-50 border border-neutral-200 rounded-xl text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider">
                      Current Room Placement
                    </span>
                    <span className="text-[10px] font-mono text-neutral-500">
                      SN: {selectedTransferAsset.serialNumber}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 font-bold text-neutral-900">
                    <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                    <span>{selectedTransferAsset.location}</span>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Target Destination Lab Room <span className="text-rose-500">*</span>
                </label>
                <Dropdown
                  value={toLocation}
                  onChange={(val) => setToLocation(val)}
                  options={locations.map((l) => {
                    const isSameRoom = selectedTransferAsset?.location.toLowerCase().includes(l.room.toLowerCase());
                    return {
                      value: `${l.name} (${l.room})`,
                      label: `${l.name} — ${l.room} (${l.building})${isSameRoom ? ' (CURRENT ROOM)' : ''}`,
                    };
                  })}
                  placeholder="Select target lab room"
                  searchable={true}
                  searchPlaceholder="Search room by name, number, or building..."
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-neutral-700">
                    Transferred By
                  </label>
                  <span className="text-[10px] text-neutral-400">
                    {user?.name || 'Dr. Heng Sovannarith'} ({user?.role || 'Faculty Lecturer'})
                  </span>
                </div>
                <input
                  type="text"
                  value={transferredBy}
                  onChange={(e) => setTransferredBy(e.target.value)}
                  placeholder={user?.name || 'Operator Name'}
                  className="w-full bg-white text-xs border border-neutral-300 rounded-lg px-3 py-2 text-neutral-900 focus:outline-none focus:border-neutral-900"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-neutral-700">
                    Reason for Relocation
                  </label>
                  <span className="text-[10px] text-neutral-400">Click preset or type</span>
                </div>
                <div className="flex flex-wrap gap-1.5 pb-1">
                  {[
                    'Lab Workshop Setup',
                    'Routine Maintenance & Service',
                    'Student Project Allocation',
                    'Permanent Room Relocation',
                  ].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setTransferReason(preset)}
                      className="text-[11px] font-medium px-2 py-0.5 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-700 border border-neutral-200 transition-colors cursor-pointer"
                    >
                      {preset}
                    </button>
                  ))}
                </div>
                <textarea
                  rows={2}
                  placeholder="e.g. Reallocated for Network Security lab workshop"
                  value={transferReason}
                  onChange={(e) => setTransferReason(e.target.value)}
                  className="w-full bg-white text-xs border border-neutral-300 rounded-lg p-2.5 text-neutral-900 focus:outline-none focus:border-neutral-900"
                />
              </div>
            </form>

            <div className="h-14 px-5 border-t border-neutral-200 bg-neutral-50/90 flex items-center justify-end gap-2 shrink-0 rounded-b-2xl">
              <button
                type="button"
                onClick={() => setIsTransferModalOpen(false)}
                className="px-3.5 py-2 text-xs font-semibold text-neutral-700 bg-white border border-neutral-300 hover:bg-neutral-50 rounded-lg cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="transfer-device-form"
                className="px-4 py-2 text-xs font-semibold text-white bg-neutral-900 hover:bg-neutral-800 rounded-lg cursor-pointer transition-colors shadow-2xs"
              >
                Confirm Movement
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 11. Return Device Confirmation Modal */}
      {returningLoan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl border border-neutral-200 shadow-2xl max-w-lg w-full overflow-hidden flex flex-col animate-in zoom-in-95 duration-150">
            {/* Header */}
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
                onClick={() => setReturningLoan(null)}
                className="p-1.5 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 rounded-lg cursor-pointer transition-colors"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="p-5 space-y-4">
              <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-3.5 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2.5 min-w-0">
                    <div className="w-7 h-7 rounded-lg bg-white border border-neutral-200 flex items-center justify-center shrink-0 mt-0.5 text-neutral-700 shadow-2xs">
                      <Laptop className="w-3.5 h-3.5" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-neutral-900 truncate">
                        {returningLoan.assetName}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="font-mono text-[10px] bg-white border border-neutral-200 px-1.5 py-0.5 rounded text-neutral-600 font-semibold">
                          SN: {returningLoan.serialNumber}
                        </span>
                        {returningLoan.courseOrClass && (
                          <span className="text-[11px] text-neutral-500 truncate">
                            • {returningLoan.courseOrClass}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-neutral-200/80 text-[11px]">
                  <div className="flex items-center gap-1.5 text-neutral-600 min-w-0">
                    <User className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                    <span className="truncate">
                      <strong className="text-neutral-800">{returningLoan.borrowerName}</strong> ({returningLoan.borrowerRole})
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-neutral-600">
                    <Calendar className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                    <span>
                      Out: <strong className="text-neutral-800">{returningLoan.borrowDate}</strong>
                    </span>
                  </div>
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
                      className="text-[11px] font-medium px-2 py-1 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-700 border border-neutral-200 transition-colors cursor-pointer active:scale-98"
                    >
                      {chip}
                    </button>
                  ))}
                </div>
              </div>

              {/* Inspection Notes Textarea */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-neutral-800 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-neutral-600" />
                    <span>Inspection & Condition Notes</span>
                  </label>
                  {returnNotes && (
                    <button
                      type="button"
                      onClick={() => setReturnNotes('')}
                      className="text-[10px] text-neutral-400 hover:text-neutral-700 underline cursor-pointer"
                    >
                      Clear Notes
                    </button>
                  )}
                </div>
                <textarea
                  rows={3}
                  placeholder="e.g. Device examined in student presence, verified working, all accessories intact..."
                  value={returnNotes}
                  onChange={(e) => setReturnNotes(e.target.value)}
                  className="w-full bg-white text-xs border border-neutral-300 rounded-xl p-2.5 text-neutral-900 focus:outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 placeholder:text-neutral-400 transition-all shadow-2xs resize-none"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="px-5 py-3.5 bg-neutral-50/70 border-t border-neutral-200 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setReturningLoan(null)}
                className="px-3.5 py-1.5 text-xs font-semibold text-neutral-700 bg-white border border-neutral-300 hover:bg-neutral-50 rounded-lg cursor-pointer transition-colors shadow-2xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmReturn}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 rounded-lg cursor-pointer transition-colors shadow-xs"
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
