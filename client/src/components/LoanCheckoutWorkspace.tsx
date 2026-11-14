'use client';

import React, { useState, useMemo, useEffect, Suspense } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Header } from '@/components/Header';
import { useStock } from '@/context/StockContext';
import { useAuth } from '@/context/AuthContext';
import { Dropdown } from '@/components/Dropdown';
import { DatePicker } from '@/components/DatePicker';
import { LabThumbnail } from '@/components/LabThumbnail';
import { NumberInput } from '@/components/NumberInput';
import { LoadingScreen } from '@/components/LoadingScreen';
import {
  ArrowLeft,
  ArrowRight,
  Laptop,
  CheckCircle2,
  AlertTriangle,
  Building,
  Clock,
  User,
  Check,
  Copy,
  Shield,
  Layers,
  Sparkles,
  Calendar,
  Package,
  QrCode,
  MapPin,
  ChevronRight,
  Phone,
  GraduationCap,
  FileText,
  BadgeCheck,
} from 'lucide-react';
import { MockItem, MockAsset } from '@/types/stock';

interface LoanCheckoutWorkspaceProps {
  itemId?: string;
  itemType?: 'stock' | 'asset';
  returnTo?: string;
}

function CheckoutContent({
  itemId: propItemId,
  itemType: propItemType,
  returnTo: propReturnTo,
}: LoanCheckoutWorkspaceProps) {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();

  const { stock, assets, loans, locations, lendAsset, lendStockItem, showToast, isLoading } = useStock();
  const { user, canManageLocation } = useAuth();

  const paramId = (params?.id as string) || propItemId || searchParams.get('id') || searchParams.get('assetId') || searchParams.get('stockId') || '';

  // Detect whether initial item is in stock or in assets
  const detectedType = useMemo<'stock' | 'asset'>(() => {
    if (propItemType) return propItemType;
    if (searchParams.get('type') === 'stock') return 'stock';
    if (searchParams.get('type') === 'asset') return 'asset';
    if (stock.some((s) => s.id === paramId || s.code === paramId)) return 'stock';
    if (assets.some((a) => a.id === paramId || a.serialNumber === paramId)) return 'asset';
    return 'stock';
  }, [paramId, propItemType, searchParams, stock, assets]);

  const [targetType, setTargetType] = useState<'stock' | 'asset'>(detectedType);
  const [selectedId, setSelectedId] = useState<string>(paramId);

  // Sync initial selection
  useEffect(() => {
    if (!selectedId) {
      if (targetType === 'stock' && stock.length > 0) {
        setSelectedId(stock[0].id);
      } else if (targetType === 'asset' && assets.length > 0) {
        setSelectedId(assets[0].id);
      }
    }
  }, [selectedId, targetType, stock, assets]);

  // Current item object
  const currentStockItem: MockItem | undefined = useMemo(() => {
    if (targetType !== 'stock') return undefined;
    return (
      stock.find((s) => s.id === selectedId || s.code === selectedId) ||
      (stock.length > 0 ? stock[0] : undefined)
    );
  }, [targetType, selectedId, stock]);

  const currentAssetItem: MockAsset | undefined = useMemo(() => {
    if (targetType !== 'asset') return undefined;
    return (
      assets.find((a) => a.id === selectedId || a.serialNumber === selectedId) ||
      (assets.length > 0 ? assets[0] : undefined)
    );
  }, [targetType, selectedId, assets]);

  const activeItem = targetType === 'stock' ? currentStockItem : currentAssetItem;
  const itemLocation = activeItem ? activeItem.location : '';
  const isAllowed = itemLocation ? canManageLocation(itemLocation) : true;

  // Max available units to lend
  const maxAvailableUnits = useMemo(() => {
    if (targetType === 'stock' && currentStockItem) {
      return currentStockItem.quantity;
    }
    if (targetType === 'asset' && currentAssetItem) {
      return currentAssetItem.loanStatus === 'on_loan' ? 0 : 1;
    }
    return 1;
  }, [targetType, currentStockItem, currentAssetItem]);

  // Determine return URL
  const returnTo = useMemo(() => {
    if (propReturnTo) return propReturnTo;
    const queryReturn = searchParams.get('returnTo');
    if (queryReturn) return queryReturn;
    if (targetType === 'stock' && currentStockItem) {
      return `/stock/${currentStockItem.id}`;
    }
    if (targetType === 'asset' && currentAssetItem) {
      return `/assets/${currentAssetItem.id}`;
    }
    return '/loans';
  }, [propReturnTo, searchParams, targetType, currentStockItem, currentAssetItem]);

  // Form State
  const [quantity, setQuantity] = useState<number>(1);
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
  const [copied, setCopied] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Active loans for this specific item
  const activeItemLoans = useMemo(() => {
    if (!activeItem) return [];
    return loans.filter((l) => {
      if (l.status !== 'active') return false;
      if (targetType === 'stock' && currentStockItem) {
        return (
          l.stockId === currentStockItem.id ||
          l.serialNumber === currentStockItem.code ||
          l.assetName === currentStockItem.name
        );
      }
      if (targetType === 'asset' && currentAssetItem) {
        return (
          l.assetId === currentAssetItem.id ||
          l.serialNumber === currentAssetItem.serialNumber ||
          l.assetName === currentAssetItem.name
        );
      }
      return false;
    });
  }, [activeItem, loans, targetType, currentStockItem, currentAssetItem]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    showToast('Copied identifier to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!borrowerName.trim()) {
      showToast('Please enter the borrower full name', 'error');
      return;
    }

    if (!activeItem) {
      showToast('No equipment or stock item selected', 'error');
      return;
    }

    if (!isAllowed) {
      showToast('Action restricted: item is stationed outside your assigned laboratory room.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      if (targetType === 'stock' && currentStockItem) {
        if (currentStockItem.quantity <= 0) {
          showToast('Cannot check out: Item is currently out of stock.', 'error');
          return;
        }
        const res = lendStockItem(currentStockItem.id, quantity, {
          borrowerName: borrowerName.trim(),
          borrowerRole,
          borrowerContact: borrowerContact.trim() || 'No contact provided',
          courseOrClass: courseOrClass.trim() || undefined,
          borrowDate,
          expectedReturnDate,
          notes: loanNotes.trim() || undefined,
        });
        if (res) {
          showToast(`Successfully checked out ${quantity} ${currentStockItem.unit} to ${borrowerName}`);
          router.push(returnTo);
        }
      } else if (targetType === 'asset' && currentAssetItem) {
        if (currentAssetItem.loanStatus === 'on_loan') {
          showToast('This device is already currently marked on loan.', 'error');
          return;
        }
        lendAsset({
          assetId: currentAssetItem.id,
          assetName: currentAssetItem.name,
          serialNumber: currentAssetItem.serialNumber,
          borrowerName: borrowerName.trim(),
          borrowerRole,
          borrowerContact: borrowerContact.trim() || 'No contact provided',
          courseOrClass: courseOrClass.trim() || undefined,
          borrowDate,
          expectedReturnDate,
          notes: loanNotes.trim() || undefined,
        });
        showToast(`Successfully checked out ${currentAssetItem.name} to ${borrowerName}`);
        router.push(returnTo);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading && paramId) {
    return <LoadingScreen message="Loading loan checkout workspace..." />;
  }

  return (
    <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-neutral-50/40">
      {/* Top Header */}
      <Header
        title="Check-Out / Lend Equipment"
        subtitle={
          activeItem
            ? `${activeItem.name} • ${
                targetType === 'stock'
                  ? `SKU: ${(activeItem as MockItem).code}`
                  : `SN: ${(activeItem as MockAsset).serialNumber}`
              }`
            : 'Department Loan Workspace'
        }
        backHref={returnTo}
        backLabel={
          returnTo.includes('/stock')
            ? 'Stock Details'
            : returnTo.includes('/assets')
            ? 'Asset Details'
            : 'Device Loans'
        }
        showExport={false}
      />

      <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6 w-full">
        {/* ================= 1. CLEAN CHECKOUT SUMMARY HEADER ================= */}
        <div className="w-full rounded-2xl bg-white border border-neutral-200/80 p-4 sm:p-5 shadow-2xs">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="min-w-0 space-y-1.5">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
                  <Laptop className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Department of Computer Science · {targetType === 'stock' ? 'Stock Check-Out' : 'Hardware Loan'}</span>
                </span>
                {activeItem && (
                  <button
                    type="button"
                    onClick={() =>
                      copyToClipboard(
                        targetType === 'stock'
                          ? (activeItem as MockItem).code
                          : (activeItem as MockAsset).serialNumber
                      )
                    }
                    className="inline-flex items-center gap-1 font-mono text-[10px] text-neutral-600 bg-neutral-100 hover:bg-neutral-200 px-2 py-0.5 rounded border border-neutral-200 transition-colors cursor-pointer"
                    title="Click to copy identifier"
                  >
                    <span>
                      {targetType === 'stock' ? 'SKU' : 'SN'}:{' '}
                      {targetType === 'stock'
                        ? (activeItem as MockItem).code
                        : (activeItem as MockAsset).serialNumber}
                    </span>
                    {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3 text-neutral-400" />}
                  </button>
                )}
                {activeItem?.location && (
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-neutral-100 text-neutral-600">
                    {activeItem.location}
                  </span>
                )}
              </div>

              <h1 className="text-lg sm:text-xl font-bold text-neutral-900 tracking-tight truncate">
                Check Out {activeItem ? activeItem.name : 'Equipment'}
              </h1>

              <p className="text-neutral-500 text-xs sm:text-sm flex items-center gap-2 flex-wrap">
                <span>Record borrower details, expected return date, and purpose for lab checkout.</span>
                <span>·</span>
                <span className="text-emerald-700 font-semibold font-mono">
                  {targetType === 'stock'
                    ? `${currentStockItem?.quantity ?? 0} ${currentStockItem?.unit || 'units'} available`
                    : currentAssetItem?.loanStatus === 'on_loan'
                    ? 'Currently On Loan'
                    : 'Available for Lending'}
                </span>
              </p>
            </div>

            {/* Live Borrower Summary Strip */}
            <div className="px-3.5 py-2.5 bg-neutral-50 rounded-xl border border-neutral-200/80 flex items-center gap-3 shrink-0 self-start md:self-auto">
              <div className="text-right">
                <div className="text-[10px] text-neutral-500 font-medium uppercase tracking-wider">
                  Borrower
                </div>
                <div className="text-xs font-bold text-neutral-900 truncate max-w-[140px]">
                  {borrowerName.trim() || 'Pending Name'}
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-emerald-600 shrink-0" />
              <div>
                <div className="text-[10px] text-neutral-500 font-medium uppercase tracking-wider">
                  Due Date
                </div>
                <div className="text-xs font-bold text-emerald-700 font-mono">
                  {expectedReturnDate || '7 Days'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Lab Scope Restriction Alert */}
        {!isAllowed && (
          <div className="p-4 bg-amber-50/80 border border-amber-300/80 rounded-2xl flex items-start gap-3 shadow-xs">
            <Shield className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <div className="text-xs font-bold text-amber-950">
                Restricted Laboratory Equipment
              </div>
              <div className="text-xs text-amber-800 leading-relaxed">
                This item is stored in <span className="font-semibold text-neutral-900">{itemLocation}</span>. Your account is restricted from authorizing loans outside your designated laboratory room.
              </div>
            </div>
          </div>
        )}

        {/* ================= 2. MAIN CHECK-OUT WORKSPACE ================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column (7 Cols): Check-Out Form */}
          <div className="lg:col-span-7 space-y-6">
            <form onSubmit={handleSubmit} className="bg-white border border-neutral-200/80 rounded-2xl p-5 sm:p-6 shadow-2xs space-y-5">
              <div className="border-b border-neutral-100 pb-3">
                <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-900 flex items-center gap-2">
                  <Laptop className="w-4 h-4 text-emerald-600" />
                  <span>Lending & Student Authorization Details</span>
                </h2>
                <p className="text-[11px] text-neutral-500 mt-0.5">
                  Record borrower identification, role, and equipment inspection agreement
                </p>
              </div>

              {/* 1. Category Switcher */}
              <div>
                <label className="block text-xs font-bold text-neutral-800 mb-1.5">
                  Inventory Classification
                </label>
                <div className="grid grid-cols-2 p-1 bg-neutral-100 rounded-xl gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      setTargetType('stock');
                      if (stock.length > 0) setSelectedId(stock[0].id);
                    }}
                    className={`py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                      targetType === 'stock'
                        ? 'bg-white text-neutral-900 shadow-2xs'
                        : 'text-neutral-500 hover:text-neutral-900'
                    }`}
                  >
                    Consumables, Tools & Stock
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setTargetType('asset');
                      if (assets.length > 0) setSelectedId(assets[0].id);
                    }}
                    className={`py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                      targetType === 'asset'
                        ? 'bg-white text-neutral-900 shadow-2xs'
                        : 'text-neutral-500 hover:text-neutral-900'
                    }`}
                  >
                    Hardware Device / Equipment
                  </button>
                </div>
              </div>

              {/* 2. Item Selector */}
              <div>
                <label className="block text-xs font-bold text-neutral-800 mb-1.5 flex items-center justify-between">
                  <span>
                    Select {targetType === 'stock' ? 'Stock Item / Lab Tool' : 'Hardware Asset'}{' '}
                    <span className="text-rose-500">*</span>
                  </span>
                  <span className="text-[10px] font-mono text-neutral-400">
                    {targetType === 'stock'
                      ? `${stock.length} cataloged SKUs`
                      : `${assets.length} fleet units`}
                  </span>
                </label>

                {targetType === 'stock' ? (
                  <Dropdown
                    value={selectedId}
                    onChange={(val) => {
                      setSelectedId(val);
                      setQuantity(1);
                    }}
                    options={stock.map((s) => ({
                      value: s.id,
                      label: `${s.name} (SKU: ${s.code}) — ${s.quantity} ${s.unit} in ${s.location}${
                        s.quantity === 0 ? ' [OUT OF STOCK]' : ''
                      }`,
                    }))}
                    placeholder="Select inventory stock item..."
                    searchable={true}
                    searchPlaceholder="Search by name, category or SKU..."
                    buttonClassName="rounded-xl py-2"
                  />
                ) : (
                  <Dropdown
                    value={selectedId}
                    onChange={(val) => {
                      setSelectedId(val);
                      setQuantity(1);
                    }}
                    options={assets.map((a) => ({
                      value: a.id,
                      label: `${a.name} (SN: ${a.serialNumber}) — ${a.location}${
                        a.loanStatus === 'on_loan' ? ' [ON LOAN]' : ''
                      }`,
                    }))}
                    placeholder="Select hardware device..."
                    searchable={true}
                    searchPlaceholder="Search by device name, model, serial..."
                    buttonClassName="rounded-xl py-2"
                  />
                )}
              </div>

              {/* 3. Quantity to Borrow (for stock items) */}
              {targetType === 'stock' && currentStockItem && (
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-neutral-800">
                      Quantity to Check Out
                    </label>
                    <span className="text-[10px] font-mono text-neutral-500">
                      Available: <strong className="text-emerald-700">{currentStockItem.quantity} {currentStockItem.unit}</strong>
                    </span>
                  </div>

                  <NumberInput
                    min={1}
                    max={Math.max(1, currentStockItem.quantity)}
                    value={quantity}
                    disabled={currentStockItem.quantity <= 0}
                    onChange={(val) =>
                      setQuantity(
                        Math.max(1, Math.min(currentStockItem.quantity, val))
                      )
                    }
                    className="w-full sm:w-48 bg-white border border-neutral-300 text-neutral-900 px-3 py-2 rounded-xl focus:outline-none focus:border-neutral-900 text-sm font-mono font-bold shadow-2xs"
                  />
                  <p className="text-[10px] text-neutral-400 mt-1">
                    Checking out {quantity} {currentStockItem.unit || 'units'} will deduct them from central stock until returned.
                  </p>
                </div>
              )}

              {/* 4. Borrower Identity Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-neutral-800 mb-1.5">
                    Borrower Full Name <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. Chan Vutha"
                      value={borrowerName}
                      onChange={(e) => setBorrowerName(e.target.value)}
                      className="w-full bg-white border border-neutral-300 text-neutral-900 pl-9 pr-3 py-2 rounded-xl focus:outline-none focus:border-neutral-900 text-xs shadow-2xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-800 mb-1.5">
                    Borrower University Role
                  </label>
                  <Dropdown
                    value={borrowerRole}
                    onChange={(val) => setBorrowerRole(val as any)}
                    options={[
                      { value: 'Student', label: 'Student' },
                      { value: 'Lecturer', label: 'Faculty Lecturer' },
                      { value: 'Lab Assistant', label: 'Lab Assistant' },
                      { value: 'Technician', label: 'Department Technician' },
                    ]}
                    buttonClassName="rounded-xl py-2"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-neutral-800 mb-1.5">
                    Student ID / Phone Contact
                  </label>
                  <div className="relative">
                    <Phone className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      placeholder="ID: e20230114 / Tel: 012 999 888"
                      value={borrowerContact}
                      onChange={(e) => setBorrowerContact(e.target.value)}
                      className="w-full bg-white border border-neutral-300 text-neutral-900 pl-9 pr-3 py-2 rounded-xl focus:outline-none focus:border-neutral-900 text-xs shadow-2xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-800 mb-1.5">
                    Class / Course / Bench
                  </label>
                  <div className="relative">
                    <GraduationCap className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      placeholder="e.g. CS Year 4 Advanced Networks"
                      value={courseOrClass}
                      onChange={(e) => setCourseOrClass(e.target.value)}
                      className="w-full bg-white border border-neutral-300 text-neutral-900 pl-9 pr-3 py-2 rounded-xl focus:outline-none focus:border-neutral-900 text-xs shadow-2xs"
                    />
                  </div>
                </div>
              </div>

              {/* 5. Date Scheduling */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-neutral-800 mb-1.5">
                    Check-Out Date
                  </label>
                  <DatePicker
                    value={borrowDate}
                    onChange={setBorrowDate}
                    placeholder="Select check-out date"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-800 mb-1.5">
                    Expected Return Date
                  </label>
                  <DatePicker
                    value={expectedReturnDate}
                    onChange={setExpectedReturnDate}
                    placeholder="Select expected return date"
                  />
                </div>
              </div>

              {/* 6. Purpose & Notes */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-neutral-800">
                    Loan Purpose & Technical Notes
                  </label>
                  <span className="text-[10px] text-neutral-400">Click preset or type</span>
                </div>

                <div className="flex flex-wrap gap-1.5 pb-1">
                  {[
                    'Course Practical Assignment',
                    'Final Year Capstone Project',
                    'Faculty Lecture Demonstration',
                    'Department Hackathon & Workshop',
                  ].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setLoanNotes(preset)}
                      className={`text-[11px] font-medium px-2 py-0.5 rounded-lg border transition-colors cursor-pointer ${
                        loanNotes === preset
                          ? 'bg-neutral-900 text-white border-neutral-900'
                          : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700 border-neutral-200'
                      }`}
                    >
                      {preset}
                    </button>
                  ))}
                </div>

                <textarea
                  rows={2}
                  placeholder="e.g. Authorized for computer network cable testing lab bench, Group 3."
                  value={loanNotes}
                  onChange={(e) => setLoanNotes(e.target.value)}
                  className="w-full bg-white border border-neutral-300 text-neutral-900 p-3 rounded-xl focus:outline-none focus:border-neutral-900 text-xs placeholder:text-neutral-400 shadow-2xs"
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-neutral-100 flex items-center justify-between gap-3">
                <Link
                  href={returnTo}
                  className="px-4 py-2 border border-neutral-300 text-neutral-700 hover:text-neutral-900 font-semibold text-xs rounded-xl hover:bg-neutral-50 transition-colors shadow-2xs"
                >
                  Cancel
                </Link>

                <button
                  type="submit"
                  disabled={isSubmitting || !isAllowed || maxAvailableUnits <= 0}
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-neutral-900 hover:bg-neutral-800 disabled:opacity-40 text-white font-semibold text-xs rounded-xl transition-all shadow-xs cursor-pointer active:scale-98"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>
                    {isSubmitting
                      ? 'Authorizing...'
                      : maxAvailableUnits <= 0
                      ? 'Item Out of Stock'
                      : 'Confirm Check-Out'}
                  </span>
                </button>
              </div>
            </form>

            {/* University SOP Guideline Card */}
            <div className="bg-neutral-100/70 border border-neutral-200/80 rounded-2xl p-5 space-y-3">
              <div className="flex items-center gap-2 text-neutral-800 font-bold text-xs">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                <span>Equipment Loan Standard Operating Procedure</span>
              </div>
              <ul className="text-xs text-neutral-600 space-y-1.5 list-disc pl-5 leading-relaxed">
                <li>Borrowers must provide valid university identification prior to equipment handover.</li>
                <li>Conduct physical condition inspection before releasing inventory or hardware assets.</li>
                <li>All borrowed equipment must be returned on or before the agreed expected return date.</li>
                <li>Loss or damage during loan period is subject to department replacement protocol.</li>
              </ul>
            </div>
          </div>

          {/* Right Column (5 Cols): Equipment Dossier, Telemetry & Active Loans */}
          <div className="lg:col-span-5 space-y-6">
            {/* Equipment Dossier Card */}
            {activeItem && (
              <div className="bg-white border border-neutral-200/80 rounded-2xl p-5 shadow-2xs space-y-4">
                <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-900 flex items-center gap-2">
                    <Package className="w-4 h-4 text-neutral-700" />
                    <span>Selected Equipment Dossier</span>
                  </h3>
                  <span
                    className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full border ${
                      maxAvailableUnits > 0
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-rose-50 text-rose-700 border-rose-200'
                    }`}
                  >
                    {maxAvailableUnits > 0 ? 'AVAILABLE' : 'OUT OF STOCK'}
                  </span>
                </div>

                {/* Photo & Identity */}
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 rounded-xl overflow-hidden bg-neutral-100 border border-neutral-200 shrink-0">
                    <LabThumbnail
                      src={activeItem.imageUrl}
                      alt={activeItem.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="min-w-0 space-y-1">
                    <h4 className="font-bold text-sm text-neutral-900 truncate">
                      {activeItem.name}
                    </h4>
                    <div className="text-xs text-neutral-500 font-mono">
                      {targetType === 'stock' ? 'SKU' : 'Serial'}:{' '}
                      <span className="font-semibold text-neutral-800">
                        {targetType === 'stock'
                          ? (activeItem as MockItem).code
                          : (activeItem as MockAsset).serialNumber}
                      </span>
                    </div>
                    <div className="text-xs text-neutral-500 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-neutral-400" />
                      <span className="font-medium text-neutral-800">{activeItem.location}</span>
                    </div>
                  </div>
                </div>

                {/* Specs Table */}
                <div className="border-t border-neutral-100 pt-3 space-y-2 text-xs">
                  <div className="flex items-center justify-between py-1 border-b border-neutral-50">
                    <span className="text-neutral-500">Classification</span>
                    <span className="font-medium text-neutral-900 capitalize">
                      {targetType === 'stock'
                        ? (activeItem as MockItem).category
                        : (activeItem as MockAsset).model}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-1 border-b border-neutral-50">
                    <span className="text-neutral-500">Central Stock Units</span>
                    <span className="font-medium text-neutral-900 font-mono">
                      {targetType === 'stock'
                        ? `${(activeItem as MockItem).quantity} ${(activeItem as MockItem).unit || 'units'}`
                        : (activeItem as MockAsset).loanStatus === 'on_loan'
                        ? '1 Unit (On Loan)'
                        : '1 Unit (Available)'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-1 border-b border-neutral-50">
                    <span className="text-neutral-500">Active Borrowings</span>
                    <span className="font-medium text-neutral-900 font-mono">
                      {activeItemLoans.length} active {activeItemLoans.length === 1 ? 'loan' : 'loans'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-1">
                    <span className="text-neutral-500">Primary Facility</span>
                    <span className="font-medium text-neutral-900 font-mono text-[11px] truncate max-w-[200px] text-right">
                      {activeItem.location}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Currently Active Loans for this Item */}
            <div className="bg-white border border-neutral-200/80 rounded-2xl p-5 shadow-2xs space-y-3">
              <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-900 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-blue-600" />
                  <span>Current Active Check-Outs</span>
                </h3>
                <span className="text-[10px] font-mono text-neutral-500">
                  {activeItemLoans.length} Records
                </span>
              </div>

              {activeItemLoans.length === 0 ? (
                <div className="py-6 text-center text-xs text-neutral-400 space-y-1">
                  <p className="font-medium">No active student loans for this item.</p>
                  <p className="text-[10px] text-neutral-400">All available units are stationed in inventory.</p>
                </div>
              ) : (
                <div className="space-y-2.5 max-h-72 overflow-y-auto">
                  {activeItemLoans.map((l) => (
                    <div
                      key={l.id}
                      className="p-3 rounded-xl border border-neutral-100 bg-neutral-50/70 space-y-1.5 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-neutral-900">{l.borrowerName}</span>
                        <span className="font-mono text-[10px] text-neutral-500">
                          Due: {l.expectedReturnDate}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-neutral-600">
                        <span>{l.borrowerRole} • {l.borrowerContact}</span>
                        <span className="font-mono font-bold text-neutral-900 bg-white border border-neutral-200 px-1.5 py-0.2 rounded">
                          {l.quantity || 1} units
                        </span>
                      </div>
                      {l.notes && <p className="text-[10px] text-neutral-400 italic">{l.notes}</p>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoanCheckoutWorkspace({
  itemId,
  itemType,
  returnTo,
}: LoanCheckoutWorkspaceProps) {
  return (
    <Suspense
      fallback={
        <div className="flex-1 flex items-center justify-center p-12 text-xs text-neutral-500">
          <div className="flex flex-col items-center gap-3">
            <div className="w-6 h-6 border-2 border-neutral-300 border-t-emerald-500 rounded-full animate-spin" />
            <span>Loading Check-Out Workspace...</span>
          </div>
        </div>
      }
    >
      <CheckoutContent itemId={itemId} itemType={itemType} returnTo={returnTo} />
    </Suspense>
  );
}

