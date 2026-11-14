'use client';

import React, { createContext, useContext, useState, useRef, useEffect } from 'react';
import {
  MockItem,
  MockAsset,
  MockRack,
  MockLocation,
  MockLoan,
  MockTransfer,
  ModalType,
  AnyEntity,
  ToastType,
  ToastData,
  RoomInventoryItem,
} from '@/types';
import {
  assetService,
  stockService,
  categoryService,
  locationService,
  loanService,
  transferService,
  getAuthToken,
  mapServerAsset,
  mapServerStock,
  mapServerLocation,
  mapServerLoan,
  mapServerTransfer,
  toServerAsset,
  toServerStock,
  toServerLocation,
  toServerLoan,
} from '@/services';
import { getRoomInventoryItemKey, mergeDistinctRemarks } from '@/lib/locationMatch';

export type {
  ModalType,
  AnyEntity,
  ToastType,
  ToastData,
};

interface StockContextType {
  stock: MockItem[];
  categories: string[];
  createCategory: (name: string) => Promise<void>;
  assets: MockAsset[];
  racks: MockRack[];
  locations: MockLocation[];
  loans: MockLoan[];
  transfers: MockTransfer[];
  isLoading: boolean;
  isBackendConnected: boolean;
  refreshBackendData: () => Promise<void>;
  addStockItem: (item: Omit<MockItem, 'id' | 'status'> & { id?: string; status?: MockItem['status'] }) => MockItem;
  updateStockQuantity: (id: string, delta: number, options?: { silent?: boolean }) => void;
  updateStockItem: (item: MockItem) => void;
  deleteStockItem: (id: string) => void;
  addAsset: (asset: Omit<MockAsset, 'id'> & { id?: string }) => MockAsset;
  updateAsset: (asset: MockAsset) => void;
  deleteAsset: (id: string) => void;
  lendAsset: (data: Omit<MockLoan, 'id' | 'status'> & { id?: string }) => MockLoan;
  lendStockItem: (
    stockId: string,
    quantity: number,
    data: {
      borrowerName: string;
      borrowerRole: 'Student' | 'Lecturer' | 'Lab Assistant' | 'Technician';
      borrowerContact: string;
      courseOrClass?: string;
      borrowDate: string;
      expectedReturnDate: string;
      notes?: string;
    }
  ) => MockLoan | null;
  returnAsset: (loanId: string, notes?: string) => void;
  transferAsset: (
    assetId: string,
    toLocation: string,
    reason?: string,
    transferredBy?: string,
    fromLocation?: string,
    quantity?: number,
    options?: { silent?: boolean }
  ) => MockTransfer;
  addRack: (rack: Omit<MockRack, 'id'> & { id?: string }) => void;
  updateRack: (rack: MockRack) => void;
  deleteRack: (id: string) => void;
  addLocation: (loc: Omit<MockLocation, 'id'> & { id?: string }) => void;
  updateLocation: (loc: MockLocation) => void;
  deleteLocation: (id: string) => void;
  updateRoomInventoryCount: (roomId: string, itemId: string, field: 'qtyWorking' | 'qtyBroken' | 'qtyMaintenance', delta: number) => void;
  updateRoomInventoryItem: (roomId: string, itemId: string, updates: Partial<RoomInventoryItem>) => void;
  markRoomAudited: (roomId: string, auditorName: string) => void;
  addRoomInventoryItem: (
    roomId: string,
    item: Omit<RoomInventoryItem, 'id' | 'roomId'>,
    options?: { silent?: boolean }
  ) => void;
  deleteRoomInventoryItem: (roomId: string, itemId: string, options?: { silent?: boolean }) => void;
  isScannerOpen: boolean;
  openScanner: () => void;
  closeScanner: () => void;
  isSearchOpen: boolean;
  openSearch: () => void;
  closeSearch: () => void;
  prefillData: Record<string, any> | null;
  activeModal: ModalType;
  openModal: (type: ModalType) => void;
  openModalWithPrefill: (type: ModalType, prefill?: Record<string, any>) => void;
  closeModal: () => void;
  toast: ToastData | null;
  showToast: (
    msg: string,
    options?: ToastType | { type?: ToastType; title?: string }
  ) => void;
  closeToast: () => void;
  isMobileSidebarOpen: boolean;
  toggleMobileSidebar: () => void;
  closeMobileSidebar: () => void;
  detailsItem: AnyEntity | null;
  openDetails: (item: AnyEntity) => void;
  closeDetails: () => void;
  editingItem: AnyEntity | null;
  openEdit: (item: AnyEntity) => void;
  closeEdit: () => void;
}

const StockContext = createContext<StockContextType | undefined>(undefined);

function getCachedData<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(`csd_cache_${key}`);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function setCachedData<T>(key: string, data: T) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(`csd_cache_${key}`, JSON.stringify(data));
  } catch {
    // ignore
  }
}

export function StockProvider({ children }: { children: React.ReactNode }) {
  const [stock, setStock] = useState<MockItem[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [assets, setAssets] = useState<MockAsset[]>([]);
  const [racks, setRacks] = useState<MockRack[]>([]);
  const [locations, setLocations] = useState<MockLocation[]>([]);
  const [loans, setLoans] = useState<MockLoan[]>([]);
  const [transfers, setTransfers] = useState<MockTransfer[]>([]);
  const [isBackendConnected, setIsBackendConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const refreshBackendData = async () => {
    try {
      const token = getAuthToken();

      if (!token) {
        setIsBackendConnected(false);
        return;
      }

      const [assetsRes, stockRes, locsRes, loansRes, transfersRes, catsRes] = await Promise.allSettled([
        assetService.getAssets(),
        stockService.getStockItems(),
        locationService.getLocations(),
        loanService.getLoans(),
        transferService.getTransfers(),
        categoryService.getAll(),
      ]);

      let connected = false;
      let fetchedAssets: MockAsset[] = [];
      let fetchedStock: MockItem[] = [];

      if (assetsRes.status === 'fulfilled' && Array.isArray(assetsRes.value?.data)) {
        fetchedAssets = assetsRes.value.data.map(mapServerAsset);
        setAssets(fetchedAssets);
        setCachedData('assets', fetchedAssets);
        connected = true;
      }

      if (stockRes.status === 'fulfilled' && Array.isArray(stockRes.value?.data)) {
        fetchedStock = stockRes.value.data.map(mapServerStock);
        setStock(fetchedStock);
        setCachedData('stock', fetchedStock);
        connected = true;
      }

      if (catsRes.status === 'fulfilled' && Array.isArray(catsRes.value)) {
        const fetchedCats = catsRes.value.map((c) => c.name).filter(Boolean);
        setCategories(fetchedCats);
        setCachedData('categories', fetchedCats);
      }

      if (locsRes.status === 'fulfilled' && Array.isArray(locsRes.value?.data)) {
        const fetchedLocs = locsRes.value.data.map(mapServerLocation);
        setLocations(fetchedLocs);
        setCachedData('locations', fetchedLocs);
        connected = true;
      }

      if (loansRes.status === 'fulfilled' && Array.isArray(loansRes.value?.data)) {
        const fetchedLoans = loansRes.value.data.map(mapServerLoan);
        setLoans(fetchedLoans);
        setCachedData('loans', fetchedLoans);
        connected = true;
      }


      if (transfersRes.status === 'fulfilled' && Array.isArray(transfersRes.value?.data)) {
        const fetchedTransfers = transfersRes.value.data.map(mapServerTransfer);
        setTransfers(fetchedTransfers);
        setCachedData('transfers', fetchedTransfers);
        connected = true;
      }

      // Populate racks dynamically from real database stock and assets
      const uniqueRackNames = Array.from(
        new Set([
          ...fetchedStock.map((s) => s.rack).filter(Boolean),
          ...fetchedAssets.map((a: any) => a.placementRack).filter(Boolean),
        ])
      );
      if (uniqueRackNames.length > 0) {
        const genRacks = uniqueRackNames.map((name, idx) => ({
          id: `rack-${idx + 1}`,
          name,
          code: `RCK-${String(idx + 1).padStart(2, '0')}`,
          location: 'Laboratory Facility',
          totalSlots: 24,
          usedSlots: 12,
          type: 'Storage Shelf' as const,
        }));
        setRacks(genRacks);
        setCachedData('racks', genRacks);
      }

      setIsBackendConnected(connected);
    } catch {
      setIsBackendConnected(false);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // 1. Immediately hydrate cached data on client mount without causing SSR mismatch
    try {
      const cachedAssets = localStorage.getItem('csd_cache_assets');
      if (cachedAssets) {
        const parsed = JSON.parse(cachedAssets);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setAssets(parsed);
          setIsLoading(false);
        }
      }
      const cachedStock = localStorage.getItem('csd_cache_stock');
      if (cachedStock) {
        const parsed = JSON.parse(cachedStock);
        if (Array.isArray(parsed) && parsed.length > 0) setStock(parsed);
      }
      const cachedLocations = localStorage.getItem('csd_cache_locations');
      if (cachedLocations) {
        const parsed = JSON.parse(cachedLocations);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setLocations(
            parsed.map((loc: MockLocation) => ({
              ...loc,
              inventories: Array.isArray(loc.inventories)
                ? loc.inventories.filter((inv: RoomInventoryItem) => Boolean(inv.stockItemId))
                : [],
            }))
          );
        }
      }
      const cachedLoans = localStorage.getItem('csd_cache_loans');
      if (cachedLoans) {
        const parsed = JSON.parse(cachedLoans);
        if (Array.isArray(parsed)) setLoans(parsed);
      }
      const cachedTransfers = localStorage.getItem('csd_cache_transfers');
      if (cachedTransfers) {
        const parsed = JSON.parse(cachedTransfers);
        if (Array.isArray(parsed)) setTransfers(parsed);
      }
      const cachedRacks = localStorage.getItem('csd_cache_racks');
      if (cachedRacks) {
        const parsed = JSON.parse(cachedRacks);
        if (Array.isArray(parsed)) setRacks(parsed);
      }
    } catch {
      // ignore
    }

    // 2. Fetch fresh data from backend
    refreshBackendData();

    // Listen for live token acquisition from AuthContext
    const handleAuthTokenReady = () => {
      refreshBackendData();
    };

    window.addEventListener('csd-auth-token-ready', handleAuthTokenReady);
    return () => window.removeEventListener('csd-auth-token-ready', handleAuthTokenReady);
  }, []);

  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [prefillData, setPrefillData] = useState<Record<string, any> | null>(null);
  const [activeModal, setActiveModal] = useState<ModalType>('none');
  const [toast, setToast] = useState<ToastData | null>(null);
  const toastTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const [detailsItem, setDetailsItem] = useState<AnyEntity | null>(null);
  const [editingItem, setEditingItem] = useState<AnyEntity | null>(null);

  const openDetails = (item: AnyEntity) => setDetailsItem(item);
  const closeDetails = () => setDetailsItem(null);

  const openEdit = (item: AnyEntity) => setEditingItem(item);
  const closeEdit = () => setEditingItem(null);

  const toggleMobileSidebar = () => setIsMobileSidebarOpen((prev) => !prev);
  const closeMobileSidebar = () => setIsMobileSidebarOpen(false);

  const closeToast = () => {
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
      toastTimerRef.current = null;
    }
    setToast(null);
  };

  const showToast = (
    msg: string,
    options?: ToastType | { type?: ToastType; title?: string }
  ) => {
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
    }

    let type: ToastType = 'success';
    let title: string | undefined = undefined;

    if (typeof options === 'string') {
      type = options;
    } else if (options && typeof options === 'object') {
      if (options.type) type = options.type;
      if (options.title) title = options.title;
    } else {
      const lower = msg.toLowerCase();
      if (lower.includes('error') || lower.includes('fail') || lower.includes('denied')) {
        type = 'error';
      } else if (lower.includes('deleted') || lower.includes('removed') || lower.includes('signed out')) {
        type = 'info';
      } else if (lower.includes('warning') || lower.includes('alert')) {
        type = 'warning';
      } else {
        type = 'success';
      }
    }

    setToast({
      id: Date.now(),
      message: msg,
      title,
      type,
    });

    toastTimerRef.current = setTimeout(() => {
      setToast(null);
      toastTimerRef.current = null;
    }, 3600);
  };

  useEffect(() => {
    function handleCustomToast(e: Event) {
      const customEvent = e as CustomEvent<{ message: string; type?: ToastType }>;
      if (customEvent.detail?.message) {
        showToast(customEvent.detail.message, customEvent.detail.type || 'success');
      }
    }
    window.addEventListener('csd-stock-toast', handleCustomToast);
    return () => window.removeEventListener('csd-stock-toast', handleCustomToast);
  }, []);

  useEffect(() => {
    function handleGlobalKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
    }
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  const openScanner = () => setIsScannerOpen(true);
  const closeScanner = () => setIsScannerOpen(false);

  const openSearch = () => setIsSearchOpen(true);
  const closeSearch = () => setIsSearchOpen(false);

  const openModal = (type: ModalType) => {
    setPrefillData(null);
    setActiveModal(type);
  };
  const openModalWithPrefill = (type: ModalType, prefill?: Record<string, any>) => {
    setPrefillData(prefill || null);
    setActiveModal(type);
  };
  const closeModal = () => {
    setActiveModal('none');
    setPrefillData(null);
  };

  const createCategory = async (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setCategories((prev) => {
      if (prev.some((c) => c.toLowerCase() === trimmed.toLowerCase())) return prev;
      return [...prev, trimmed].sort((a, b) => a.localeCompare(b));
    });
    if (getAuthToken()) {
      try {
        await categoryService.create(trimmed);
      } catch {
        // ignore if offline or already exists
      }
    }
  };

  const addStockItem = (itemData: Omit<MockItem, 'id' | 'status'> & { id?: string; status?: MockItem['status'] }): MockItem => {
    const existingIndex = stock.findIndex((i) => i.code.toLowerCase() === itemData.code.toLowerCase());

    if (existingIndex >= 0) {
      const updated = [...stock];
      const existing = updated[existingIndex];
      const newQty = existing.quantity + (itemData.quantity || 1);
      updated[existingIndex] = {
        ...existing,
        quantity: newQty,
        status: newQty > 5 ? 'in_stock' : 'low_stock',
      };
      setStock(updated);
      showToast(`Updated quantity for ${existing.name} (+${itemData.quantity || 1})`);
      return updated[existingIndex];
    } else {
      const newItem: MockItem = {
        id: itemData.id || String(Date.now()),
        name: itemData.name,
        code: itemData.code,
        category: itemData.category || 'Hardware',
        quantity: itemData.quantity || 1,
        unit: itemData.unit || 'Units',
        location: itemData.location || 'Unassigned',
        rack: itemData.rack || 'Unassigned',
        status: (itemData.quantity || 1) > 5 ? 'in_stock' : 'low_stock',
        expiryDate: itemData.expiryDate || 'N/A',
        imageUrl: itemData.imageUrl || 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&w=400&q=80',
        description: itemData.description,
      };
      setStock((prev) => {
        const next = [newItem, ...prev];
        setCachedData('stock', next);
        return next;
      });
      showToast(`Added ${newItem.name} to stock`);
      if (getAuthToken()) {
        stockService
          .createStockItem(toServerStock(newItem) as any)
          .then((res) => {
            if (res?.data?.id) {
              const saved = mapServerStock(res.data);
              setStock((prev) => {
                const next = prev.map((i) => (i.id === newItem.id ? saved : i));
                setCachedData('stock', next);
                return next;
              });
            }
          })
          .catch(() => {});
      }
      return newItem;
    }
  };

  const updateStockItem = (updatedItem: MockItem) => {
    setStock((prev) => {
      const next = prev.map((i) => (i.id === updatedItem.id ? updatedItem : i));
      setCachedData('stock', next);
      return next;
    });
    showToast(`Updated ${updatedItem.name}`);
    if (getAuthToken()) {
      stockService
        .updateStockItem(updatedItem.id, toServerStock(updatedItem) as any)
        .then((res) => {
          if (res?.data?.id) {
            const saved = mapServerStock(res.data);
            setStock((prev) => {
              const next = prev.map((i) => (i.id === updatedItem.id ? saved : i));
              setCachedData('stock', next);
              return next;
            });
          }
        })
        .catch(() => {});
    }
  };

  const updateStockQuantity = (id: string, delta: number, options?: { silent?: boolean }) => {
    setStock((prev) => {
      const next = prev.map((item) => {
        if (item.id === id || item.code.toLowerCase() === id.toLowerCase()) {
          const newQty = Math.max(0, item.quantity + delta);
          return {
            ...item,
            quantity: newQty,
            status: newQty === 0 ? 'out_of_stock' : newQty <= 5 ? 'low_stock' : 'in_stock',
          } as MockItem;
        }
        return item;
      });
      setCachedData('stock', next);
      return next;
    });
    if (!options?.silent) {
      showToast(`Quantity adjusted (${delta > 0 ? `+${delta}` : delta})`);
    }
    if (getAuthToken()) {
      const targetItem = stock.find((i) => i.id === id || i.code.toLowerCase() === id.toLowerCase());
      const targetId = targetItem ? targetItem.id : id;
      stockService.adjustStockQuantity(targetId, delta).catch(() => {});
    }
  };

  const deleteStockItem = (id: string) => {
    const target = stock.find((i) => i.id === id);
    setStock((prev) => {
      const next = prev.filter((i) => i.id !== id);
      setCachedData('stock', next);
      return next;
    });
    if (target) {
      setLocations((prevLocs) => {
        const nextLocs = prevLocs.map((loc) => ({
          ...loc,
          inventories: (loc.inventories || []).filter(
            (inv) => inv.stockItemId !== target.id && inv.stockItemId !== target.code
          ),
        }));
        setCachedData('locations', nextLocs);
        return nextLocs;
      });
    }
    showToast(`Removed ${target?.name || 'item'} from inventory`);
    if (getAuthToken()) {
      stockService.deleteStockItem(id).catch(() => {});
    }
  };

  const addAsset = (assetData: Omit<MockAsset, 'id'> & { id?: string }): MockAsset => {
    const newAsset: MockAsset = {
      id: assetData.id || `A${Date.now()}`,
      imageUrl: assetData.imageUrl || 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&w=400&q=80',
      ...assetData,
    };
    setAssets((prev) => {
      const next = [newAsset, ...prev];
      setCachedData('assets', next);
      return next;
    });
    showToast(`Registered network asset ${newAsset.name}`);
    if (getAuthToken()) {
      assetService
        .createAsset(toServerAsset(newAsset) as any)
        .then((res) => {
          if (res?.data?.id) {
            const saved = mapServerAsset(res.data);
            setAssets((prev) => {
              const next = prev.map((a) => (a.id === newAsset.id ? saved : a));
              setCachedData('assets', next);
              return next;
            });
          }
        })
        .catch(() => {});
    }
    return newAsset;
  };

  const updateAsset = (updatedAsset: MockAsset) => {
    setAssets((prev) => {
      const next = prev.map((a) => (a.id === updatedAsset.id ? updatedAsset : a));
      setCachedData('assets', next);
      return next;
    });
    showToast(`Updated ${updatedAsset.name}`);
    if (getAuthToken()) {
      assetService
        .updateAsset(updatedAsset.id, toServerAsset(updatedAsset) as any)
        .then((res) => {
          if (res?.data?.id) {
            const saved = mapServerAsset(res.data);
            setAssets((prev) => {
              const next = prev.map((a) => (a.id === updatedAsset.id ? saved : a));
              setCachedData('assets', next);
              return next;
            });
          }
        })
        .catch(() => {});
    }
  };

  const deleteAsset = (id: string) => {
    const target = assets.find((a) => a.id === id);
    setAssets((prev) => {
      const next = prev.filter((a) => a.id !== id);
      setCachedData('assets', next);
      return next;
    });
    if (target) {
      setLocations((prevLocs) => {
        const nextLocs = prevLocs.map((loc) => ({
          ...loc,
          inventories: (loc.inventories || []).filter(
            (inv) => inv.assetId !== target.id && inv.assetId !== target.serialNumber
          ),
        }));
        setCachedData('locations', nextLocs);
        return nextLocs;
      });
    }
    showToast(`Deleted asset ${target?.name || ''}`);
    if (getAuthToken()) {
      assetService.deleteAsset(id).catch(() => {});
    }
  };

  const lendAsset = (data: Omit<MockLoan, 'id' | 'status'> & { id?: string }): MockLoan => {
    const newLoan: MockLoan = {
      id: data.id || `LN-${Date.now().toString().slice(-4)}`,
      status: 'active',
      itemType: data.itemType || (data.stockId ? 'stock' : 'asset'),
      ...data,
    };
    setLoans((prev) => [newLoan, ...prev]);

    if (newLoan.itemType === 'stock' || newLoan.stockId) {
      // Deduct from stock
      const stockId = newLoan.stockId || newLoan.assetId;
      const qtyToLend = newLoan.quantity || 1;
      setStock((prev) =>
        prev.map((s) => {
          if (s.id === stockId || s.code === newLoan.serialNumber) {
            const newQty = Math.max(0, s.quantity - qtyToLend);
            return {
              ...s,
              quantity: newQty,
              status: newQty === 0 ? 'out_of_stock' : newQty <= 5 ? 'low_stock' : 'in_stock',
            };
          }
          return s;
        })
      );
    } else {
      // Update asset loan status
      setAssets((prev) =>
        prev.map((a) =>
          a.id === data.assetId
            ? {
                ...a,
                loanStatus: 'on_loan',
                currentBorrower: data.borrowerName,
                loanDueDate: data.expectedReturnDate,
              }
            : a
        )
      );
    }

    showToast(`Checked out ${data.assetName} to ${data.borrowerName}`);
    if (getAuthToken()) {
      loanService.createLoan(toServerLoan(newLoan) as any).catch(() => {});
    }
    return newLoan;
  };

  const lendStockItem = (
    stockId: string,
    quantity: number,
    data: {
      borrowerName: string;
      borrowerRole: 'Student' | 'Lecturer' | 'Lab Assistant' | 'Technician';
      borrowerContact: string;
      courseOrClass?: string;
      borrowDate: string;
      expectedReturnDate: string;
      notes?: string;
    }
  ): MockLoan | null => {
    const stockItem = stock.find((s) => s.id === stockId || s.code === stockId);
    if (!stockItem) {
      showToast('Inventory stock item not found', 'error');
      return null;
    }

    const qtyToLend = Math.max(1, Math.min(stockItem.quantity, quantity));
    if (stockItem.quantity < qtyToLend) {
      showToast(`Cannot lend ${qtyToLend} units. Only ${stockItem.quantity} ${stockItem.unit} available.`, 'error');
      return null;
    }

    const newLoan: MockLoan = {
      id: `LN-${Date.now().toString().slice(-4)}`,
      itemType: 'stock',
      stockId: stockItem.id,
      quantity: qtyToLend,
      assetName: stockItem.name,
      serialNumber: stockItem.code,
      borrowerName: data.borrowerName,
      borrowerRole: data.borrowerRole,
      borrowerContact: data.borrowerContact,
      courseOrClass: data.courseOrClass,
      borrowDate: data.borrowDate,
      expectedReturnDate: data.expectedReturnDate,
      status: 'active',
      notes: data.notes,
    };

    setLoans((prev) => [newLoan, ...prev]);

    // Deduct quantity from stock
    const newQty = Math.max(0, stockItem.quantity - qtyToLend);
    const updatedStockItem: MockItem = {
      ...stockItem,
      quantity: newQty,
      status: newQty === 0 ? 'out_of_stock' : newQty <= 5 ? 'low_stock' : 'in_stock',
    };
    setStock((prev) => prev.map((s) => (s.id === stockItem.id ? updatedStockItem : s)));

    if (getAuthToken()) {
      stockService.updateStockItem(stockItem.id, toServerStock(updatedStockItem) as any).catch(() => {});
    }

    showToast(`Checked out ${qtyToLend} ${stockItem.unit} of ${stockItem.name} to ${data.borrowerName}`);
    return newLoan;
  };

  const returnAsset = (loanId: string, notes?: string) => {
    const targetLoan = loans.find((l) => l.id === loanId);
    if (!targetLoan) return;

    const today = new Date().toISOString().split('T')[0];
    setLoans((prev) =>
      prev.map((l) =>
        l.id === loanId
          ? {
              ...l,
              status: 'returned',
              actualReturnDate: today,
              notes: notes ? (l.notes ? `${l.notes} | ${notes}` : notes) : l.notes,
            }
          : l
      )
    );

    // If it is a stock item loan, return units back to stock
    if (targetLoan.itemType === 'stock' || targetLoan.stockId) {
      const stockId = targetLoan.stockId || targetLoan.assetId;
      const qtyReturned = targetLoan.quantity || 1;
      setStock((prev) =>
        prev.map((s) => {
          if (s.id === stockId || s.code === targetLoan.serialNumber || s.name === targetLoan.assetName) {
            const newQty = s.quantity + qtyReturned;
            const updated: MockItem = {
              ...s,
              quantity: newQty,
              status: newQty > 5 ? 'in_stock' : 'low_stock',
            };
            if (getAuthToken()) {
              stockService.updateStockItem(s.id, toServerStock(updated) as any).catch(() => {});
            }
            return updated;
          }
          return s;
        })
      );
      showToast(`${qtyReturned} unit(s) of ${targetLoan.assetName} returned to stock`);
    } else {
      // Update asset loan status back to available
      setAssets((prev) =>
        prev.map((a) =>
          a.id === targetLoan.assetId
            ? {
                ...a,
                loanStatus: 'available',
                currentBorrower: undefined,
                loanDueDate: undefined,
              }
            : a
        )
      );

      showToast(`Device ${targetLoan.assetName} returned to lab stock`);
      if (getAuthToken()) {
        loanService.returnLoan(loanId, notes).catch(() => {});
      }
    }
  };

  const transferAsset = (
    assetId: string,
    toLocation: string,
    reason?: string,
    transferredBy?: string,
    fromLocation?: string,
    quantity?: number,
    options?: { silent?: boolean }
  ): MockTransfer => {
    const asset = assets.find((a) => a.id === assetId);
    const fromLoc = fromLocation || asset?.location || 'Unknown';
    const moveQty = quantity && quantity > 0 ? quantity : (asset?.totalUnits || 1);

    const newTransfer: MockTransfer = {
      id: `TR-${Date.now().toString().slice(-4)}-${Math.random().toString(36).slice(2, 6)}`,
      assetId,
      assetName: asset?.name || 'Lab Asset',
      serialNumber: asset?.serialNumber || 'N/A',
      fromLocation: fromLoc,
      toLocation,
      transferDate: new Date().toISOString().split('T')[0],
      transferredBy: transferredBy || 'Thoeurn Ratha',
      reason: reason || 'Location relocation between faculty labs',
    };

    setTransfers((prev) => {
      const next = [newTransfer, ...prev];
      setCachedData('transfers', next);
      return next;
    });

    // Update asset location in state and cache
    if (asset) {
      setAssets((prev) => {
        const next = prev.map((a) => (a.id === assetId ? { ...a, location: toLocation } : a));
        setCachedData('assets', next);
        return next;
      });
    }

    // Persist relocation directly to PostgreSQL backend
    if (getAuthToken()) {
      transferService
        .createTransfer({
          asset_id: asset?.serverId || assetId,
          from_location: fromLoc,
          to_location: toLocation,
          transferred_by: transferredBy || 'Thoeurn Ratha',
          reason: reason || 'Location relocation between faculty labs',
          transfer_date: newTransfer.transferDate,
          quantity: moveQty,
        })
        .then((res) => {
          if (res?.data?.id) {
            setTransfers((prev) => {
              const updated = prev.map((t) => (t.id === newTransfer.id ? { ...t, id: String(res.data.id) } : t));
              setCachedData('transfers', updated);
              return updated;
            });
          }
        })
        .catch(() => {});
    }

    if (!options?.silent) {
      showToast(`Relocated ${asset?.name || 'Device'} from ${fromLoc} to ${toLocation}`);
    }
    return newTransfer;
  };

  const addRack = (rackData: Omit<MockRack, 'id'> & { id?: string }) => {
    const newRack: MockRack = {
      id: rackData.id || `R${Date.now()}`,
      ...rackData,
    };
    setRacks((prev) => [newRack, ...prev]);
    showToast(`Added storage rack ${newRack.name}`);
  };

  const updateRack = (updatedRack: MockRack) => {
    setRacks((prev) => prev.map((r) => (r.id === updatedRack.id ? updatedRack : r)));
    showToast(`Updated rack ${updatedRack.name}`);
  };

  const deleteRack = (id: string) => {
    const target = racks.find((r) => r.id === id);
    setRacks((prev) => prev.filter((r) => r.id !== id));
    showToast(`Deleted rack ${target?.name || ''}`);
  };

  const addLocation = (locData: Omit<MockLocation, 'id'> & { id?: string }) => {
    const newLoc: MockLocation = {
      id: locData.id || `L${Date.now()}`,
      ...locData,
    };
    setLocations((prev) => [newLoc, ...prev]);
    showToast(`Registered location ${newLoc.name}`);
    if (getAuthToken()) {
      locationService.createLocation(toServerLocation(newLoc) as any).catch(() => {});
    }
  };

  const updateLocation = (updatedLoc: MockLocation) => {
    setLocations((prev) => prev.map((l) => (l.id === updatedLoc.id ? updatedLoc : l)));
    showToast(`Updated location ${updatedLoc.name}`);
    if (getAuthToken()) {
      locationService.updateLocation(updatedLoc.id, toServerLocation(updatedLoc) as any).catch(() => {});
    }
  };

  const deleteLocation = (id: string) => {
    const target = locations.find((l) => l.id === id);
    setLocations((prev) => prev.filter((l) => l.id !== id));
    showToast(`Deleted location ${target?.name || ''}`);
    if (getAuthToken()) {
      locationService.deleteLocation(id).catch(() => {});
    }
  };

  const updateRoomInventoryCount = (
    roomId: string,
    itemId: string,
    field: 'qtyWorking' | 'qtyBroken' | 'qtyMaintenance',
    delta: number
  ) => {
    setLocations((prev) =>
      prev.map((loc) => {
        if (loc.id !== roomId) return loc;
        const updatedInventories = (loc.inventories || []).map((item) => {
          if (item.id !== itemId) return item;
          const nextVal = Math.max(0, (item[field] || 0) + delta);
          return {
            ...item,
            [field]: nextVal,
            lastAuditedAt: new Date().toISOString().split('T')[0],
          };
        });
        return {
          ...loc,
          inventories: updatedInventories,
        };
      })
    );
    showToast(`Updated count in room inventory`, 'info');
    if (getAuthToken()) {
      locationService.updateRoomInventoryCount(itemId, field, delta).catch(() => {});
    }
  };

  const markRoomAudited = (roomId: string, auditorName: string) => {
    const today = new Date().toISOString().split('T')[0];
    setLocations((prev) =>
      prev.map((loc) => {
        if (loc.id !== roomId) return loc;
        return {
          ...loc,
          lastAuditedAt: today,
          auditedBy: auditorName,
          inventories: (loc.inventories || []).map((inv) => ({
            ...inv,
            lastAuditedAt: today,
          })),
        };
      })
    );
    showToast(`Room marked audited for ${today} by ${auditorName}`, 'success');
    if (getAuthToken()) {
      locationService.markRoomAudited(roomId, auditorName).catch(() => {});
    }
  };

  const addRoomInventoryItem = (
    roomId: string,
    itemData: Omit<RoomInventoryItem, 'id' | 'roomId'>,
    options?: { silent?: boolean }
  ) => {
    const today = new Date().toISOString().split('T')[0];
    const targetKey = getRoomInventoryItemKey(itemData, stock);
    const currentRoom = locations.find((l) => l.id === roomId);
    const existingMatches = (currentRoom?.inventories || []).filter(
      (inv) => getRoomInventoryItemKey(inv, stock) === targetKey
    );
    const primaryMatch = existingMatches[0];
    const duplicateIds = new Set(existingMatches.slice(1).map((inv) => inv.id));

    const tempId = `inv-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const newItem: RoomInventoryItem = {
      id: tempId,
      roomId,
      lastAuditedAt: today,
      ...itemData,
    };

    setLocations((prev) => {
      const next = prev.map((loc) => {
        if (loc.id !== roomId) return loc;
        const inventories = loc.inventories || [];
        const matched = inventories.filter(
          (inv) => getRoomInventoryItemKey(inv, stock) === targetKey
        );
        if (matched.length > 0) {
          const primary = matched[0];
          const extraIds = new Set(matched.slice(1).map((inv) => inv.id));
          const mergedWorking =
            matched.reduce((sum, inv) => sum + (inv.qtyWorking || 0), 0) +
            (itemData.qtyWorking || 0);
          const mergedBroken =
            matched.reduce((sum, inv) => sum + (inv.qtyBroken || 0), 0) +
            (itemData.qtyBroken || 0);
          const mergedMaintenance =
            matched.reduce((sum, inv) => sum + (inv.qtyMaintenance || 0), 0) +
            (itemData.qtyMaintenance || 0);
          const mergedRemarks = mergeDistinctRemarks(
            ...matched.map((inv) => inv.remarks),
            itemData.remarks
          );
          return {
            ...loc,
            inventories: inventories
              .filter((inv) => !extraIds.has(inv.id))
              .map((inv) =>
                inv.id === primary.id
                  ? {
                      ...inv,
                      qtyWorking: mergedWorking,
                      qtyBroken: mergedBroken,
                      qtyMaintenance: mergedMaintenance,
                      remarks: mergedRemarks,
                      lastAuditedAt: today,
                    }
                  : inv
              ),
          };
        }
        return {
          ...loc,
          inventories: [...inventories, newItem],
        };
      });
      setCachedData('locations', next);
      return next;
    });

    if (!options?.silent) {
      showToast(
        primaryMatch
          ? `Updated ${itemData.name} count in room inventory`
          : `Added ${newItem.name} to room inventory`,
        'success'
      );
    }

    if (getAuthToken()) {
      locationService
        .addRoomInventory(roomId, itemData)
        .then((res) => {
          const row = res?.data;
          if (!row?.id) return;
          const serverId = String(row.id);

          setLocations((current) => {
            const next = current.map((l) => {
              if (l.id !== roomId) return l;
              const list = l.inventories || [];

              // Brand-new entry created on server: swap temporary ID with canonical server UUID
              if (!primaryMatch) {
                return {
                  ...l,
                  inventories: list.map((inv) =>
                    inv.id === tempId ? { ...inv, id: serverId } : inv
                  ),
                };
              }

              // Updated backend consolidated directly into primaryMatch.id: sync exact server counts
              if (serverId === primaryMatch.id) {
                return {
                  ...l,
                  inventories: list.map((inv) =>
                    inv.id === primaryMatch.id
                      ? {
                          ...inv,
                          qtyWorking: Number(row.qtyWorking ?? row.qty_working ?? inv.qtyWorking),
                          qtyBroken: Number(row.qtyBroken ?? row.qty_broken ?? inv.qtyBroken),
                          qtyMaintenance: Number(
                            row.qtyMaintenance ?? row.qty_maintenance ?? inv.qtyMaintenance
                          ),
                          remarks: row.remarks ?? inv.remarks,
                        }
                      : inv
                  ),
                };
              }

              // Fallback if an un-restarted backend inserted a separate row: restore raw rows so UI
              // consolidation still displays 1 item while retaining every DB row ID for edits/deletes.
              const restoredPrimary: RoomInventoryItem = {
                ...primaryMatch,
                id: primaryMatch.id,
              };
              const restoredExtras = existingMatches.slice(1);
              const serverInserted: RoomInventoryItem = {
                id: serverId,
                roomId,
                stockItemId: row.stock_item_id || itemData.stockItemId,
                assetId: row.asset_id || itemData.assetId,
                name: row.name || itemData.name,
                group: row.group_type || itemData.group,
                brandSpec: row.brand_spec ?? itemData.brandSpec,
                unit: row.unit || itemData.unit,
                qtyWorking: Number(row.qty_working ?? row.qtyWorking ?? itemData.qtyWorking ?? 0),
                qtyBroken: Number(row.qty_broken ?? row.qtyBroken ?? itemData.qtyBroken ?? 0),
                qtyMaintenance: Number(
                  row.qty_maintenance ?? row.qtyMaintenance ?? itemData.qtyMaintenance ?? 0
                ),
                remarks: row.remarks ?? itemData.remarks,
                lastAuditedAt: row.last_audited_at || today,
              };
              return {
                ...l,
                inventories: [
                  ...list.filter((inv) => inv.id !== primaryMatch.id && !duplicateIds.has(inv.id)),
                  restoredPrimary,
                  ...restoredExtras,
                  serverInserted,
                ],
              };
            });
            setCachedData('locations', next);
            return next;
          });
        })
        .catch(() => {});
    }
  };

  const deleteRoomInventoryItem = (
    roomId: string,
    itemId: string,
    options?: { silent?: boolean }
  ) => {
    setLocations((prev) => {
      const next = prev.map((loc) => {
        if (loc.id !== roomId) return loc;
        return {
          ...loc,
          inventories: (loc.inventories || []).filter((inv) => inv.id !== itemId),
        };
      });
      setCachedData('locations', next);
      return next;
    });
    if (!options?.silent) {
      showToast(`Removed item from room inventory`, 'info');
    }
    if (getAuthToken()) {
      locationService.deleteRoomInventory(itemId).catch(() => {});
    }
  };

  const updateRoomInventoryItem = (
    roomId: string,
    itemId: string,
    updates: Partial<RoomInventoryItem>
  ) => {
    setLocations((prev) => {
      const next = prev.map((loc) => {
        if (loc.id !== roomId) return loc;
        return {
          ...loc,
          inventories: (loc.inventories || []).map((inv) =>
            inv.id === itemId ? { ...inv, ...updates } : inv
          ),
        };
      });
      setCachedData('locations', next);
      return next;
    });
    showToast(`Updated facility equipment record`, 'success');
    if (getAuthToken()) {
      locationService.updateRoomInventoryItem(itemId, updates).catch(() => {});
    }
  };

  return (
    <StockContext.Provider
      value={{
        stock,
        categories,
        createCategory,
        assets,
        racks,
        locations,
        loans,
        transfers,
        isLoading,
        isBackendConnected,
        refreshBackendData,
        addStockItem,
        updateStockItem,
        updateStockQuantity,
        deleteStockItem,
        addAsset,
        updateAsset,
        deleteAsset,
        lendAsset,
        lendStockItem,
        returnAsset,
        transferAsset,
        addRack,
        updateRack,
        deleteRack,
        addLocation,
        updateLocation,
        deleteLocation,
        updateRoomInventoryCount,
        updateRoomInventoryItem,
        markRoomAudited,
        addRoomInventoryItem,
        deleteRoomInventoryItem,
        isScannerOpen,
        openScanner,
        closeScanner,
        isSearchOpen,
        openSearch,
        closeSearch,
        prefillData,
        activeModal,
        openModal,
        openModalWithPrefill,
        closeModal,
        toast,
        showToast,
        closeToast,
        isMobileSidebarOpen,
        toggleMobileSidebar,
        closeMobileSidebar,
        detailsItem,
        openDetails,
        closeDetails,
        editingItem,
        openEdit,
        closeEdit,
      }}
    >
      {children}
    </StockContext.Provider>
  );
}

export function useStock() {
  const context = useContext(StockContext);
  if (!context) {
    throw new Error('useStock must be used within a StockProvider');
  }
  return context;
}
