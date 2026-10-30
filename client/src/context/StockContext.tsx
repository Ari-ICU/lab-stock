'use client';

import React, { createContext, useContext, useState, useRef, useEffect } from 'react';
import {
  MockItem,
  MockAsset,
  MockRack,
  MockMaintenance,
  MockLocation,
  MockLoan,
  MockTransfer,
  ModalType,
  AnyEntity,
  ToastType,
  ToastData,
  PurchaseRequest,
  RoomInventoryItem,
} from '@/types';
import {
  authService,
  assetService,
  stockService,
  locationService,
  loanService,
  maintenanceService,
  purchaseRequestService,
  getAuthToken,
  mapServerAsset,
  mapServerStock,
  mapServerLocation,
  mapServerLoan,
  mapServerMaintenance,
  mapServerPurchaseRequest,
  toServerAsset,
  toServerStock,
  toServerLocation,
  toServerLoan,
  toServerMaintenance,
  toServerPurchaseRequest,
} from '@/services';

export type {
  ModalType,
  AnyEntity,
  ToastType,
  ToastData,
};

interface StockContextType {
  stock: MockItem[];
  assets: MockAsset[];
  racks: MockRack[];
  maintenance: MockMaintenance[];
  locations: MockLocation[];
  loans: MockLoan[];
  transfers: MockTransfer[];
  requests: PurchaseRequest[];
  isBackendConnected: boolean;
  refreshBackendData: () => Promise<void>;
  addStockItem: (item: Omit<MockItem, 'id' | 'status'> & { id?: string; status?: MockItem['status'] }) => MockItem;
  updateStockQuantity: (id: string, delta: number) => void;
  updateStockItem: (item: MockItem) => void;
  deleteStockItem: (id: string) => void;
  addAsset: (asset: Omit<MockAsset, 'id'> & { id?: string }) => MockAsset;
  updateAsset: (asset: MockAsset) => void;
  deleteAsset: (id: string) => void;
  lendAsset: (data: Omit<MockLoan, 'id' | 'status'> & { id?: string }) => MockLoan;
  returnAsset: (loanId: string, notes?: string) => void;
  transferAsset: (assetId: string, toLocation: string, reason?: string, transferredBy?: string) => MockTransfer;
  addRack: (rack: Omit<MockRack, 'id'> & { id?: string }) => void;
  updateRack: (rack: MockRack) => void;
  deleteRack: (id: string) => void;
  addMaintenance: (rec: Omit<MockMaintenance, 'id'> & { id?: string }) => void;
  updateMaintenance: (rec: MockMaintenance) => void;
  deleteMaintenance: (id: string) => void;
  addLocation: (loc: Omit<MockLocation, 'id'> & { id?: string }) => void;
  updateLocation: (loc: MockLocation) => void;
  deleteLocation: (id: string) => void;
  updateRoomInventoryCount: (roomId: string, itemId: string, field: 'qtyWorking' | 'qtyBroken' | 'qtyMaintenance', delta: number) => void;
  markRoomAudited: (roomId: string, auditorName: string) => void;
  addRoomInventoryItem: (roomId: string, item: Omit<RoomInventoryItem, 'id' | 'roomId'>) => void;
  deleteRoomInventoryItem: (roomId: string, itemId: string) => void;
  addPurchaseRequest: (req: Omit<PurchaseRequest, 'id' | 'requestDate' | 'status'> & { id?: string; status?: PurchaseRequest['status'] }) => PurchaseRequest;
  updatePurchaseRequest: (req: PurchaseRequest) => void;
  updatePurchaseRequestStatus: (id: string, status: PurchaseRequest['status'], notes?: string) => void;
  deletePurchaseRequest: (id: string) => void;
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

export function StockProvider({ children }: { children: React.ReactNode }) {
  const [stock, setStock] = useState<MockItem[]>([]);
  const [assets, setAssets] = useState<MockAsset[]>([]);
  const [racks, setRacks] = useState<MockRack[]>([]);
  const [maintenance, setMaintenance] = useState<MockMaintenance[]>([]);
  const [locations, setLocations] = useState<MockLocation[]>([]);
  const [loans, setLoans] = useState<MockLoan[]>([]);
  const [transfers, setTransfers] = useState<MockTransfer[]>([]);
  const [requests, setRequests] = useState<PurchaseRequest[]>([]);
  const [isBackendConnected, setIsBackendConnected] = useState(false);

  const refreshBackendData = async () => {
    let token = getAuthToken();
    if (!token && typeof window !== 'undefined') {
      try {
        const authRes = await authService.login({
          email: 'heng.sovannarith@rupp.edu.kh',
          password: 'password123',
        });
        if (authRes?.token) {
          localStorage.setItem('lab_auth_token', authRes.token);
          token = authRes.token;
        }
      } catch {
        // backend might be starting
      }
    }

    if (!token) {
      setIsBackendConnected(false);
      return;
    }

    try {
      const [assetsRes, stockRes, locsRes, loansRes, maintRes, reqsRes] = await Promise.allSettled([
        assetService.getAssets(),
        stockService.getStockItems(),
        locationService.getLocations(),
        loanService.getLoans(),
        maintenanceService.getMaintenance(),
        purchaseRequestService.getPurchaseRequests(),
      ]);

      let connected = false;
      let fetchedAssets: MockAsset[] = [];
      let fetchedStock: MockItem[] = [];

      if (assetsRes.status === 'fulfilled' && Array.isArray(assetsRes.value?.data)) {
        fetchedAssets = assetsRes.value.data.map(mapServerAsset);
        setAssets(fetchedAssets);
        connected = true;
      }

      if (stockRes.status === 'fulfilled' && Array.isArray(stockRes.value?.data)) {
        fetchedStock = stockRes.value.data.map(mapServerStock);
        setStock(fetchedStock);
        connected = true;
      }

      if (locsRes.status === 'fulfilled' && Array.isArray(locsRes.value?.data)) {
        setLocations(locsRes.value.data.map(mapServerLocation));
        connected = true;
      }

      if (loansRes.status === 'fulfilled' && Array.isArray(loansRes.value?.data)) {
        setLoans(loansRes.value.data.map(mapServerLoan));
        connected = true;
      }

      if (maintRes.status === 'fulfilled' && Array.isArray(maintRes.value?.data)) {
        setMaintenance(maintRes.value.data.map(mapServerMaintenance));
        connected = true;
      }

      if (reqsRes.status === 'fulfilled' && Array.isArray(reqsRes.value?.data)) {
        setRequests(reqsRes.value.data.map(mapServerPurchaseRequest));
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
        setRacks(
          uniqueRackNames.map((name, idx) => ({
            id: `rack-${idx + 1}`,
            name,
            code: `RCK-${String(idx + 1).padStart(2, '0')}`,
            location: 'Laboratory Facility',
            totalSlots: 24,
            usedSlots: 12,
            type: 'Storage Shelf' as const,
          }))
        );
      }

      setIsBackendConnected(connected);
    } catch {
      setIsBackendConnected(false);
    }
  };

  useEffect(() => {
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
        location: itemData.location || 'Computer Lab Room 102B',
        rack: itemData.rack || 'MDF Core Server Rack 42U',
        status: (itemData.quantity || 1) > 5 ? 'in_stock' : 'low_stock',
        expiryDate: itemData.expiryDate || 'N/A',
        imageUrl: itemData.imageUrl || 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&w=400&q=80',
        description: itemData.description,
      };
      setStock((prev) => [newItem, ...prev]);
      showToast(`Added ${newItem.name} to stock`);
      if (getAuthToken()) {
        stockService.createStockItem(toServerStock(newItem) as any).catch(() => {});
      }
      return newItem;
    }
  };

  const updateStockItem = (updatedItem: MockItem) => {
    setStock((prev) => prev.map((i) => (i.id === updatedItem.id ? updatedItem : i)));
    showToast(`Updated ${updatedItem.name}`);
    if (getAuthToken()) {
      stockService.updateStockItem(updatedItem.id, toServerStock(updatedItem) as any).catch(() => {});
    }
  };

  const updateStockQuantity = (id: string, delta: number) => {
    setStock((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const newQty = Math.max(0, item.quantity + delta);
          return {
            ...item,
            quantity: newQty,
            status: newQty === 0 ? 'out_of_stock' : newQty <= 5 ? 'low_stock' : 'in_stock',
          };
        }
        return item;
      })
    );
    showToast(`Quantity adjusted (${delta > 0 ? `+${delta}` : delta})`);
    if (getAuthToken()) {
      stockService.adjustStockQuantity(id, delta).catch(() => {});
    }
  };

  const deleteStockItem = (id: string) => {
    const target = stock.find((i) => i.id === id);
    setStock((prev) => prev.filter((i) => i.id !== id));
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
    setAssets((prev) => [newAsset, ...prev]);
    showToast(`Registered network asset ${newAsset.name}`);
    if (getAuthToken()) {
      assetService.createAsset(toServerAsset(newAsset) as any).catch(() => {});
    }
    return newAsset;
  };

  const updateAsset = (updatedAsset: MockAsset) => {
    setAssets((prev) => prev.map((a) => (a.id === updatedAsset.id ? updatedAsset : a)));
    showToast(`Updated ${updatedAsset.name}`);
    if (getAuthToken()) {
      assetService.updateAsset(updatedAsset.id, toServerAsset(updatedAsset) as any).catch(() => {});
    }
  };

  const deleteAsset = (id: string) => {
    const target = assets.find((a) => a.id === id);
    setAssets((prev) => prev.filter((a) => a.id !== id));
    showToast(`Deleted asset ${target?.name || ''}`);
    if (getAuthToken()) {
      assetService.deleteAsset(id).catch(() => {});
    }
  };

  const lendAsset = (data: Omit<MockLoan, 'id' | 'status'> & { id?: string }): MockLoan => {
    const newLoan: MockLoan = {
      id: data.id || `LN-${Date.now().toString().slice(-4)}`,
      status: 'active',
      ...data,
    };
    setLoans((prev) => [newLoan, ...prev]);

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

    showToast(`Checked out ${data.assetName} to ${data.borrowerName}`);
    if (getAuthToken()) {
      loanService.createLoan(toServerLoan(newLoan) as any).catch(() => {});
    }
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
  };

  const transferAsset = (
    assetId: string,
    toLocation: string,
    reason?: string,
    transferredBy?: string
  ): MockTransfer => {
    const asset = assets.find((a) => a.id === assetId);
    const fromLoc = asset?.location || 'Unknown';

    const newTransfer: MockTransfer = {
      id: `TR-${Date.now().toString().slice(-4)}`,
      assetId,
      assetName: asset?.name || 'Lab Asset',
      serialNumber: asset?.serialNumber || 'N/A',
      fromLocation: fromLoc,
      toLocation,
      transferDate: new Date().toISOString().split('T')[0],
      transferredBy: transferredBy || 'Thoeurn Ratha',
      reason: reason || 'Location relocation between faculty labs',
    };

    setTransfers((prev) => [newTransfer, ...prev]);

    // Update asset location
    if (asset) {
      setAssets((prev) =>
        prev.map((a) => (a.id === assetId ? { ...a, location: toLocation } : a))
      );
    }

    showToast(`Moved ${asset?.name || 'Device'} to ${toLocation}`);
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

  const addMaintenance = (recData: Omit<MockMaintenance, 'id'> & { id?: string }) => {
    const newRec: MockMaintenance = {
      id: recData.id || `M${Date.now()}`,
      ...recData,
    };
    setMaintenance((prev) => [newRec, ...prev]);
    showToast(`Scheduled maintenance for ${newRec.assetName}`);
    if (getAuthToken()) {
      maintenanceService.createMaintenance(toServerMaintenance(newRec) as any).then((res) => {
        if (res?.data?.id) {
          setMaintenance((prev) => prev.map((m) => (m.id === newRec.id ? { ...m, id: String(res.data.id) } : m)));
        }
      }).catch(() => {});
    }
  };

  const updateMaintenance = (updatedRec: MockMaintenance) => {
    setMaintenance((prev) => prev.map((m) => (m.id === updatedRec.id ? updatedRec : m)));
    showToast(`Updated service log for ${updatedRec.assetName}`);
    if (getAuthToken()) {
      maintenanceService.updateMaintenance(updatedRec.id, toServerMaintenance(updatedRec) as any).catch(() => {});
    }
  };

  const deleteMaintenance = (id: string) => {
    setMaintenance((prev) => prev.filter((m) => m.id !== id));
    showToast(`Deleted maintenance record`);
    if (getAuthToken()) {
      maintenanceService.deleteMaintenance(id).catch(() => {});
    }
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
    itemData: Omit<RoomInventoryItem, 'id' | 'roomId'>
  ) => {
    const newItem: RoomInventoryItem = {
      id: `inv-${Date.now()}`,
      roomId,
      lastAuditedAt: new Date().toISOString().split('T')[0],
      ...itemData,
    };
    setLocations((prev) =>
      prev.map((loc) => {
        if (loc.id !== roomId) return loc;
        return {
          ...loc,
          inventories: [...(loc.inventories || []), newItem],
        };
      })
    );
    showToast(`Added ${newItem.name} to room inventory`, 'success');
    if (getAuthToken()) {
      locationService.addRoomInventory(roomId, itemData).then((res) => {
        if (res?.data?.id) {
          // Update temporary id with server id
          setLocations((current) =>
            current.map((l) =>
              l.id !== roomId
                ? l
                : {
                    ...l,
                    inventories: (l.inventories || []).map((inv) =>
                      inv.id === newItem.id ? { ...inv, id: String(res.data.id) } : inv
                    ),
                  }
            )
          );
        }
      }).catch(() => {});
    }
  };

  const deleteRoomInventoryItem = (roomId: string, itemId: string) => {
    setLocations((prev) =>
      prev.map((loc) => {
        if (loc.id !== roomId) return loc;
        return {
          ...loc,
          inventories: (loc.inventories || []).filter((inv) => inv.id !== itemId),
        };
      })
    );
    showToast(`Removed item from room inventory`, 'info');
    if (getAuthToken()) {
      locationService.deleteRoomInventory(itemId).catch(() => {});
    }
  };

  const addPurchaseRequest = (reqData: Omit<PurchaseRequest, 'id' | 'requestDate' | 'status'> & { id?: string; status?: PurchaseRequest['status'] }): PurchaseRequest => {
    const newReq: PurchaseRequest = {
      id: reqData.id || `REQ-2026-${String(requests.length + 1).padStart(3, '0')}`,
      requestDate: new Date().toISOString().split('T')[0],
      status: reqData.status || 'pending',
      ...reqData,
    };
    setRequests((prev) => [newReq, ...prev]);
    showToast(`Purchase requisition "${newReq.title}" submitted successfully for ${newReq.targetRoom}.`);
    if (getAuthToken()) {
      purchaseRequestService.createPurchaseRequest(toServerPurchaseRequest(newReq)).catch(() => {});
    }
    return newReq;
  };

  const updatePurchaseRequest = (updatedReq: PurchaseRequest) => {
    setRequests((prev) => prev.map((r) => (r.id === updatedReq.id ? updatedReq : r)));
    showToast(`Updated requisition ${updatedReq.id} (${updatedReq.title})`);
    if (getAuthToken()) {
      purchaseRequestService.updatePurchaseRequest(updatedReq.id, toServerPurchaseRequest(updatedReq)).catch(() => {});
    }
  };

  const updatePurchaseRequestStatus = (id: string, status: PurchaseRequest['status'], notes?: string) => {
    setRequests((prev) =>
      prev.map((r) => {
        if (r.id === id) {
          return {
            ...r,
            status,
            notes: notes !== undefined ? notes : r.notes,
          };
        }
        return r;
      })
    );
    showToast(`Requisition ${id} status updated to ${status.toUpperCase()}.`);
    if (getAuthToken()) {
      purchaseRequestService.updatePurchaseRequestStatus(id, status, notes).catch(() => {});
    }
  };

  const deletePurchaseRequest = (id: string) => {
    const target = requests.find((r) => r.id === id);
    setRequests((prev) => prev.filter((r) => r.id !== id));
    showToast(`Purchase request ${target?.id || id} removed.`);
    if (getAuthToken()) {
      purchaseRequestService.deletePurchaseRequest(id).catch(() => {});
    }
  };

  return (
    <StockContext.Provider
      value={{
        stock,
        assets,
        racks,
        maintenance,
        locations,
        loans,
        transfers,
        requests,
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
        returnAsset,
        transferAsset,
        addRack,
        updateRack,
        deleteRack,
        addMaintenance,
        updateMaintenance,
        deleteMaintenance,
        addLocation,
        updateLocation,
        deleteLocation,
        updateRoomInventoryCount,
        markRoomAudited,
        addRoomInventoryItem,
        deleteRoomInventoryItem,
        addPurchaseRequest,
        updatePurchaseRequest,
        updatePurchaseRequestStatus,
        deletePurchaseRequest,
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
