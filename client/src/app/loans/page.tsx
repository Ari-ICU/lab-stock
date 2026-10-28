'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Header } from '@/components/Header';
import { Dropdown } from '@/components/Dropdown';
import { DatePicker } from '@/components/DatePicker';
import { useStock } from '@/context/StockContext';
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
  Laptop
} from 'lucide-react';
import { MockLoan } from '@/types';

export default function LoansPage() {
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

  const [activeTab, setActiveTab] = useState<'active' | 'history' | 'transfers'>('active');
  const [filterText, setFilterText] = useState('');

  // Modals state
  const [isLendModalOpen, setIsLendModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [returningLoan, setReturningLoan] = useState<MockLoan | null>(null);
  const [returnNotes, setReturnNotes] = useState('');

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
  const [transferredBy, setTransferredBy] = useState('Thoeurn Ratha');

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
    // Reset form
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

    transferAsset(transferAssetId, toLocation, transferReason.trim(), transferredBy.trim());
    setIsTransferModalOpen(false);
    setTransferAssetId('');
    setToLocation('');
    setTransferReason('');
  };

  const handleConfirmReturn = () => {
    if (!returningLoan) return;
    returnAsset(returningLoan.id, returnNotes.trim() || undefined);
    setReturningLoan(null);
    setReturnNotes('');
  };

  const selectedTransferAsset = assets.find((a) => a.id === transferAssetId);

  return (
    <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
      <Header
        title="Device Loans & Relocations"
        subtitle="Faculty Equipment Lending, Student Check-Out & Room Movement"
        onExport={handleExport}
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (assets.length > 0) setTransferAssetId(assets[0].id);
                if (locations.length > 0) setToLocation(locations[0].name);
                setIsTransferModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-neutral-700 bg-white border border-neutral-300 hover:bg-neutral-50 rounded transition-colors cursor-pointer"
            >
              <ArrowLeftRight className="w-3.5 h-3.5 text-neutral-500" />
              <span>Relocate Device</span>
            </button>
            <button
              onClick={() => {
                const available = assets.filter((a) => a.loanStatus !== 'on_loan');
                if (available.length > 0) setSelectedAssetId(available[0].id);
                setIsLendModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-neutral-900 hover:bg-neutral-800 rounded transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-emerald-400" />
              <span>Lend Device / PC</span>
            </button>
          </div>
        }
      />

      <div className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-6 max-w-8xl w-full mx-auto">
        {/* KPI Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="bg-white border border-neutral-200 rounded p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-neutral-500">Active Loans</span>
              <Laptop className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-2xl font-bold text-neutral-900 mt-2">
              {activeLoans.length} Checked Out
            </div>
            <div className="text-[11px] text-neutral-500 mt-1">Currently in student/faculty possession</div>
          </div>

          <div className="bg-white border border-neutral-200 rounded p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-neutral-500">Overdue Returns</span>
              <AlertCircle className={`w-4 h-4 ${overdueLoans.length > 0 ? 'text-rose-500' : 'text-neutral-400'}`} />
            </div>
            <div className={`text-2xl font-bold mt-2 ${overdueLoans.length > 0 ? 'text-rose-600' : 'text-neutral-900'}`}>
              {overdueLoans.length} Overdue
            </div>
            <div className="text-[11px] text-neutral-500 mt-1">Requires lab assistant follow-up</div>
          </div>

          <div className="bg-white border border-neutral-200 rounded p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-neutral-500">Returned & Verified</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="text-2xl font-bold text-neutral-900 mt-2">
              {returnedLoans.length} Returned
            </div>
            <div className="text-[11px] text-neutral-500 mt-1">Returned to lab stock safely</div>
          </div>

          <div className="bg-white border border-neutral-200 rounded p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-neutral-500">Room Relocations</span>
              <ArrowLeftRight className="w-4 h-4 text-blue-500" />
            </div>
            <div className="text-2xl font-bold text-neutral-900 mt-2">
              {transfers.length} Transfers
            </div>
            <div className="text-[11px] text-neutral-500 mt-1">Across all faculty lab rooms</div>
          </div>
        </div>

        {/* Tabs & Filter Bar */}
        <div className="bg-white border border-neutral-200 rounded overflow-hidden">
          <div className="border-b border-neutral-200 px-4 sm:px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3">
            <div className="flex items-center gap-1 sm:gap-2">
              <button
                onClick={() => setActiveTab('active')}
                className={`px-3 py-2 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
                  activeTab === 'active'
                    ? 'border-neutral-900 text-neutral-900'
                    : 'border-transparent text-neutral-500 hover:text-neutral-800'
                }`}
              >
                Active Loans ({activeLoans.length})
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`px-3 py-2 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
                  activeTab === 'history'
                    ? 'border-neutral-900 text-neutral-900'
                    : 'border-transparent text-neutral-500 hover:text-neutral-800'
                }`}
              >
                Loan History ({returnedLoans.length})
              </button>
              <button
                onClick={() => setActiveTab('transfers')}
                className={`px-3 py-2 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
                  activeTab === 'transfers'
                    ? 'border-neutral-900 text-neutral-900'
                    : 'border-transparent text-neutral-500 hover:text-neutral-800'
                }`}
              >
                Relocation History ({transfers.length})
              </button>
            </div>

            <div className="pb-3">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filter by device, borrower, room..."
                  value={filterText}
                  onChange={(e) => setFilterText(e.target.value)}
                  className="bg-white text-xs text-neutral-900 placeholder:text-neutral-400 pl-8 pr-3 py-1.5 border border-neutral-300 rounded focus:outline-none focus:border-neutral-900 transition-colors w-64"
                />
              </div>
            </div>
          </div>

          {/* Tab 1: Active Loans */}
          {activeTab === 'active' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-neutral-50 border-b border-neutral-200 text-neutral-500 font-medium">
                    <th className="py-3 px-4">Device & Serial</th>
                    <th className="py-3 px-4">Borrower</th>
                    <th className="py-3 px-4">Course / Project</th>
                    <th className="py-3 px-4">Check-Out Date</th>
                    <th className="py-3 px-4">Due Return Date</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200">
                  {filteredActiveLoans.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-neutral-500">
                        No active device loans found.
                      </td>
                    </tr>
                  ) : (
                    filteredActiveLoans.map((loan) => {
                      const isOverdue = loan.expectedReturnDate < todayStr;
                      return (
                        <tr key={loan.id} className="hover:bg-neutral-50/70 transition-colors">
                          <td className="py-3.5 px-4">
                            <Link
                              href={`/assets/${loan.assetId}`}
                              className="font-semibold text-neutral-900 hover:text-blue-600 flex items-center gap-1.5 group"
                            >
                              <span>{loan.assetName}</span>
                              <ExternalLink className="w-3 h-3 text-neutral-400 group-hover:text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </Link>
                            <span className="text-[11px] text-neutral-500 font-mono">
                              SN: {loan.serialNumber}
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="font-medium text-neutral-900">{loan.borrowerName}</div>
                            <div className="text-[11px] text-neutral-500">
                              <span className="inline-block bg-neutral-100 px-1 py-0.2 rounded text-[10px] font-medium mr-1">
                                {loan.borrowerRole}
                              </span>
                              {loan.borrowerContact}
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-neutral-600 max-w-xs truncate">
                            {loan.courseOrClass || 'General Lab Use'}
                          </td>
                          <td className="py-3.5 px-4 text-neutral-600 font-mono">
                            {loan.borrowDate}
                          </td>
                          <td className="py-3.5 px-4 font-mono">
                            <span className={isOverdue ? 'text-rose-600 font-semibold' : 'text-neutral-700'}>
                              {loan.expectedReturnDate}
                            </span>
                            {isOverdue && (
                              <span className="block text-[10px] text-rose-500 font-sans font-medium">
                                Overdue
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-4">
                            {isOverdue ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                                Overdue
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                                On Loan
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <button
                              onClick={() => {
                                setReturningLoan(loan);
                                setReturnNotes('');
                              }}
                              className="px-2.5 py-1 text-xs font-semibold text-neutral-800 bg-white border border-neutral-300 hover:bg-neutral-100 rounded transition-colors cursor-pointer"
                            >
                              Return Device
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Tab 2: Loan History */}
          {activeTab === 'history' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-neutral-50 border-b border-neutral-200 text-neutral-500 font-medium">
                    <th className="py-3 px-4">Device & Serial</th>
                    <th className="py-3 px-4">Borrower</th>
                    <th className="py-3 px-4">Borrow Date</th>
                    <th className="py-3 px-4">Actual Return</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Log Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200">
                  {filteredHistoryLoans.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-neutral-500">
                        No return history recorded yet.
                      </td>
                    </tr>
                  ) : (
                    filteredHistoryLoans.map((loan) => (
                      <tr key={loan.id} className="hover:bg-neutral-50/70 transition-colors">
                        <td className="py-3.5 px-4">
                          <Link
                            href={`/assets/${loan.assetId}`}
                            className="font-semibold text-neutral-900 hover:text-blue-600"
                          >
                            {loan.assetName}
                          </Link>
                          <div className="text-[11px] text-neutral-500 font-mono">
                            SN: {loan.serialNumber}
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-medium text-neutral-900">{loan.borrowerName}</div>
                          <div className="text-[11px] text-neutral-500">
                            {loan.borrowerRole} • {loan.borrowerContact}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-neutral-600 font-mono">
                          {loan.borrowDate}
                        </td>
                        <td className="py-3.5 px-4 text-emerald-700 font-mono font-medium">
                          {loan.actualReturnDate || 'Returned'}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Returned
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-neutral-500 max-w-sm truncate">
                          {loan.notes || 'Returned in good condition.'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Tab 3: Relocation / Transfer History */}
          {activeTab === 'transfers' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-neutral-50 border-b border-neutral-200 text-neutral-500 font-medium">
                    <th className="py-3 px-4">Device & Serial</th>
                    <th className="py-3 px-4">From Location</th>
                    <th className="py-3 px-4">New Destination Room</th>
                    <th className="py-3 px-4">Transfer Date</th>
                    <th className="py-3 px-4">Transferred By</th>
                    <th className="py-3 px-4">Relocation Purpose / Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200">
                  {filteredTransfers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-neutral-500">
                        No equipment relocation records found.
                      </td>
                    </tr>
                  ) : (
                    filteredTransfers.map((transfer) => (
                      <tr key={transfer.id} className="hover:bg-neutral-50/70 transition-colors">
                        <td className="py-3.5 px-4">
                          <Link
                            href={`/assets/${transfer.assetId}`}
                            className="font-semibold text-neutral-900 hover:text-blue-600"
                          >
                            {transfer.assetName}
                          </Link>
                          <div className="text-[11px] text-neutral-500 font-mono">
                            SN: {transfer.serialNumber}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-neutral-600">
                          {transfer.fromLocation}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="inline-flex items-center gap-1 text-emerald-800 font-medium bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded text-[11px]">
                            <MapPin className="w-3 h-3 text-emerald-600" />
                            {transfer.toLocation}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-neutral-600 font-mono">
                          {transfer.transferDate}
                        </td>
                        <td className="py-3.5 px-4 text-neutral-800 font-medium">
                          {transfer.transferredBy}
                        </td>
                        <td className="py-3.5 px-4 text-neutral-500 max-w-sm truncate">
                          {transfer.reason || 'Routine lab room relocation'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Lend Device Modal */}
      {isLendModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white rounded border border-neutral-300 shadow-2xl max-w-xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="h-14 px-5 border-b border-neutral-200 flex items-center justify-between shrink-0 bg-neutral-50">
              <div className="flex items-center gap-2">
                <Laptop className="w-4 h-4 text-emerald-600" />
                <h3 className="font-semibold text-sm text-neutral-900">Check-Out / Lend Device</h3>
              </div>
              <button
                onClick={() => setIsLendModalOpen(false)}
                className="p-1 text-neutral-400 hover:text-neutral-700 rounded cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateLoan} className="flex-1 overflow-y-auto p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Select Equipment / Device <span className="text-rose-500">*</span>
                </label>
                <Dropdown
                  value={selectedAssetId}
                  onChange={(val) => setSelectedAssetId(val)}
                  options={assets.map((a) => ({
                    value: a.id,
                    label: `${a.name} (${a.serialNumber}) — ${a.location}${a.loanStatus === 'on_loan' ? ' [ON LOAN]' : ''}`,
                  }))}
                  placeholder="Select device to check out"
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
                    className="w-full bg-white text-xs border border-neutral-300 rounded px-3 py-2 text-neutral-900 focus:outline-none focus:border-neutral-900"
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
                    className="w-full bg-white text-xs border border-neutral-300 rounded px-3 py-2 text-neutral-900 focus:outline-none focus:border-neutral-900"
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
                    className="w-full bg-white text-xs border border-neutral-300 rounded px-3 py-2 text-neutral-900 focus:outline-none focus:border-neutral-900"
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
                  <DatePicker value={expectedReturnDate} onChange={setExpectedReturnDate} align="right" />
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
                  className="w-full bg-white text-xs border border-neutral-300 rounded p-2.5 text-neutral-900 focus:outline-none focus:border-neutral-900"
                />
              </div>

              <div className="pt-3 border-t border-neutral-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsLendModalOpen(false)}
                  className="px-3 py-2 text-xs font-semibold text-neutral-700 bg-white border border-neutral-300 hover:bg-neutral-50 rounded cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-neutral-900 hover:bg-neutral-800 rounded cursor-pointer"
                >
                  Confirm Check-Out
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Relocate Device Modal */}
      {isTransferModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white rounded border border-neutral-300 shadow-2xl max-w-lg w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="h-14 px-5 border-b border-neutral-200 flex items-center justify-between shrink-0 bg-neutral-50">
              <div className="flex items-center gap-2">
                <ArrowLeftRight className="w-4 h-4 text-blue-600" />
                <h3 className="font-semibold text-sm text-neutral-900">Relocate Device to Another Lab</h3>
              </div>
              <button
                onClick={() => setIsTransferModalOpen(false)}
                className="p-1 text-neutral-400 hover:text-neutral-700 rounded cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateTransfer} className="flex-1 overflow-y-auto p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Select Equipment to Relocate <span className="text-rose-500">*</span>
                </label>
                <Dropdown
                  value={transferAssetId}
                  onChange={(val) => setTransferAssetId(val)}
                  options={assets.map((a) => ({
                    value: a.id,
                    label: `${a.name} (SN: ${a.serialNumber})`,
                  }))}
                  placeholder="Select device"
                />
              </div>

              {selectedTransferAsset && (
                <div className="p-3 bg-neutral-50 border border-neutral-200 rounded text-xs">
                  <span className="text-neutral-500">Current Placement:</span>{' '}
                  <span className="font-semibold text-neutral-900">{selectedTransferAsset.location}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Target Destination Lab Room <span className="text-rose-500">*</span>
                </label>
                <Dropdown
                  value={toLocation}
                  onChange={(val) => setToLocation(val)}
                  options={locations.map((l) => ({
                    value: `${l.name} (${l.room})`,
                    label: `${l.name} — ${l.room} (${l.building})`,
                  }))}
                  placeholder="Select target lab room"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Transferred By
                </label>
                <input
                  type="text"
                  value={transferredBy}
                  onChange={(e) => setTransferredBy(e.target.value)}
                  className="w-full bg-white text-xs border border-neutral-300 rounded px-3 py-2 text-neutral-900 focus:outline-none focus:border-neutral-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Reason for Relocation
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Reallocated for Network Security lab workshop"
                  value={transferReason}
                  onChange={(e) => setTransferReason(e.target.value)}
                  className="w-full bg-white text-xs border border-neutral-300 rounded p-2.5 text-neutral-900 focus:outline-none focus:border-neutral-900"
                />
              </div>

              <div className="pt-3 border-t border-neutral-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsTransferModalOpen(false)}
                  className="px-3 py-2 text-xs font-semibold text-neutral-700 bg-white border border-neutral-300 hover:bg-neutral-50 rounded cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-neutral-900 hover:bg-neutral-800 rounded cursor-pointer"
                >
                  Confirm Movement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Return Device Confirmation Modal */}
      {returningLoan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white rounded border border-neutral-300 shadow-2xl max-w-md w-full p-5 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-neutral-200 pb-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <h3 className="font-semibold text-sm text-neutral-900">Confirm Return to Lab</h3>
              </div>
              <button
                onClick={() => setReturningLoan(null)}
                className="p-1 text-neutral-400 hover:text-neutral-700 rounded cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-xs text-neutral-600 space-y-1">
              <p>
                <span className="font-semibold text-neutral-900">Device:</span> {returningLoan.assetName}
              </p>
              <p>
                <span className="font-semibold text-neutral-900">Borrower:</span> {returningLoan.borrowerName} ({returningLoan.borrowerRole})
              </p>
              <p>
                <span className="font-semibold text-neutral-900">Checked out:</span> {returningLoan.borrowDate}
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                Inspection & Return Notes
              </label>
              <textarea
                rows={2}
                placeholder="e.g. Device examined, no physical damage, power adapter returned"
                value={returnNotes}
                onChange={(e) => setReturnNotes(e.target.value)}
                className="w-full bg-white text-xs border border-neutral-300 rounded p-2.5 text-neutral-900 focus:outline-none focus:border-neutral-900"
              />
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setReturningLoan(null)}
                className="px-3 py-2 text-xs font-semibold text-neutral-700 bg-white border border-neutral-300 hover:bg-neutral-50 rounded cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmReturn}
                className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded cursor-pointer"
              >
                Confirm Return
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

