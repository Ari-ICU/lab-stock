'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { BrowserMultiFormatReader } from '@zxing/library';
import { useStock } from '@/context/StockContext';
import { findProductByBarcode, ProductModelInfo } from '@/data/productCatalog';
import { MockAsset, MockItem, MockLocation } from '@/types';
import {
  Barcode,
  QrCode,
  X,
  Camera,
  CheckCircle2,
  RotateCcw,
  Search,
  Upload,
  ExternalLink,
  Laptop,
  Boxes,
  Building,
  MapPin,
  AlertCircle,
  Plus,
  SwitchCamera,
  Volume2,
  VolumeX,
  Copy,
  Check,
} from 'lucide-react';

type MatchType =
  | { kind: 'asset'; item: MockAsset }
  | { kind: 'stock'; item: MockItem }
  | { kind: 'location'; item: MockLocation }
  | { kind: 'catalog'; item: ProductModelInfo }
  | { kind: 'unregistered'; rawCode: string };

// Play a quick synthesized beep on successful scan using Web Audio API
function playBeepSound() {
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, ctx.currentTime); // A5 tone
    osc.frequency.exponentialRampToValueAtTime(1760, ctx.currentTime + 0.08); // chirp up to A6

    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.1);
  } catch {
    // Audio context may be restricted by browser policy before user interaction
  }
}

export function QRScannerModal() {
  const router = useRouter();
  const {
    isScannerOpen,
    closeScanner,
    assets,
    stock,
    locations,
    openModalWithPrefill,
    showToast,
  } = useStock();

  const [activeTab, setActiveTab] = useState<'camera' | 'upload' | 'manual'>('camera');
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [scannedResult, setScannedResult] = useState<{
    code: string;
    match: MatchType;
  } | null>(null);

  const [manualCodeInput, setManualCodeInput] = useState<string>('');
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const [cameraDevices, setCameraDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceIndex, setSelectedDeviceIndex] = useState(0);
  const [copiedCode, setCopiedCode] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const codeReaderRef = useRef<BrowserMultiFormatReader | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const resetScan = () => {
    setScannedResult(null);
    setCameraError(null);
    setManualCodeInput('');
  };

  const handleMatchCode = useCallback(
    (rawCode: string) => {
      const code = rawCode.trim();
      if (!code) return;

      if (soundEnabled) {
        playBeepSound();
      }

      // Priority 1: Match against live hardware assets
      const matchedAsset = assets.find(
        (a) =>
          a.serialNumber.toLowerCase() === code.toLowerCase() ||
          a.id.toLowerCase() === code.toLowerCase() ||
          a.model.toLowerCase() === code.toLowerCase()
      );

      if (matchedAsset) {
        setScannedResult({
          code,
          match: { kind: 'asset', item: matchedAsset },
        });
        return;
      }

      // Priority 2: Match against live inventory stock items
      const matchedStock = stock.find(
        (s) =>
          s.code.toLowerCase() === code.toLowerCase() ||
          s.id.toLowerCase() === code.toLowerCase()
      );

      if (matchedStock) {
        setScannedResult({
          code,
          match: { kind: 'stock', item: matchedStock },
        });
        return;
      }

      // Priority 3: Match against lab locations (e.g. room QR code)
      const matchedLoc = locations.find(
        (l) =>
          l.room.toLowerCase().replace(/^rm\s*/i, '') === code.toLowerCase().replace(/^rm\s*/i, '') ||
          l.id.toLowerCase() === code.toLowerCase()
      );

      if (matchedLoc) {
        setScannedResult({
          code,
          match: { kind: 'location', item: matchedLoc },
        });
        return;
      }

      // Priority 4: Match against product model catalog
      const matchedCatalog = findProductByBarcode(code);
      if (matchedCatalog) {
        setScannedResult({
          code,
          match: { kind: 'catalog', item: matchedCatalog },
        });
        return;
      }

      // Fallback: Unregistered hardware code
      setScannedResult({
        code,
        match: { kind: 'unregistered', rawCode: code },
      });
    },
    [assets, stock, locations, soundEnabled]
  );

  const stopCamera = useCallback(() => {
    if (codeReaderRef.current) {
      try {
        codeReaderRef.current.reset();
      } catch {
        // ignore reset errors
      }
      codeReaderRef.current = null;
    }
    setCameraActive(false);
  }, []);

  const startScanner = useCallback(
    async (deviceIdx: number = 0) => {
      stopCamera();
      setCameraError(null);

      try {
        const codeReader = new BrowserMultiFormatReader();
        codeReaderRef.current = codeReader;

        const videoInputDevices = await codeReader.listVideoInputDevices();
        setCameraDevices(videoInputDevices);

        if (!videoInputDevices || videoInputDevices.length === 0) {
          setCameraError('No video camera detected on this system.');
          setCameraActive(false);
          return;
        }

        const chosenIndex = deviceIdx % videoInputDevices.length;
        setSelectedDeviceIndex(chosenIndex);
        const selectedDevice = videoInputDevices[chosenIndex];

        setCameraActive(true);

        codeReader.decodeFromVideoDevice(
          selectedDevice.deviceId,
          videoRef.current,
          (result) => {
            if (result) {
              const text = result.getText();
              handleMatchCode(text);
              stopCamera();
            }
          }
        );
      } catch (err: unknown) {
        const msg =
          err instanceof Error
            ? err.message
            : 'Camera unavailable or permission denied. You can still upload photos or enter codes below.';
        setCameraError(msg);
        setCameraActive(false);
      }
    },
    [handleMatchCode, stopCamera]
  );

  const handleSwitchCamera = () => {
    if (cameraDevices.length > 1) {
      const nextIdx = (selectedDeviceIndex + 1) % cameraDevices.length;
      startScanner(nextIdx);
    }
  };

  useEffect(() => {
    if (!isScannerOpen) {
      stopCamera();
      resetScan();
      return;
    }

    if (activeTab === 'camera') {
      startScanner(0);
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [isScannerOpen, activeTab, startScanner, stopCamera]);

  // Decode barcode/QR from uploaded image file
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessingImage(true);
    setCameraError(null);

    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const dataUrl = reader.result as string;
        try {
          const zxingReader = new BrowserMultiFormatReader();
          const result = await zxingReader.decodeFromImageUrl(dataUrl);
          if (result) {
            handleMatchCode(result.getText());
          } else {
            setCameraError('No clear barcode or QR code detected in this photo. Please try a closer image.');
          }
        } catch {
          setCameraError('Could not decode barcode from this image. Ensure the barcode is sharp, well-lit, and unblurred.');
        } finally {
          setIsProcessingImage(false);
        }
      };
      reader.readAsDataURL(file);
    } catch {
      setCameraError('Failed to read image file.');
      setIsProcessingImage(false);
    }
  };

  const handleManualSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCodeInput.trim()) return;
    handleMatchCode(manualCodeInput.trim());
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 1500);
  };

  if (!isScannerOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-100"
      onClick={(e) => {
        if (e.target === e.currentTarget) closeScanner();
      }}
    >
      <div className="bg-white border border-neutral-200 rounded-xl max-w-lg w-full overflow-hidden flex flex-col max-h-[90vh] shadow-2xl ring-1 ring-black/5">
        {/* Modal Header */}
        <div className="h-14 px-5 border-b border-neutral-200 flex items-center justify-between shrink-0 bg-white">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-neutral-900 text-emerald-400 flex items-center justify-center shrink-0 shadow-2xs">
              <Barcode className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-xs font-bold text-neutral-900 tracking-tight flex items-center gap-2">
                <span>Scan Barcode or QR Code</span>
                <span className="text-[10px] font-normal text-neutral-400 font-mono">ZXing Engine</span>
              </h2>
              <p className="text-[11px] text-neutral-500">
                Identify lab devices, serial numbers, and equipment tags
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="p-1.5 text-neutral-400 hover:text-neutral-700 rounded transition-colors"
              title={soundEnabled ? 'Mute scan beep' : 'Enable scan beep'}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-600" /> : <VolumeX className="w-4 h-4 text-neutral-400" />}
            </button>
            <button
              onClick={closeScanner}
              className="p-1.5 text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100 rounded transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Mode Selector Tabs (only shown if not in scanned result mode) */}
        {!scannedResult && (
          <div className="flex border-b border-neutral-200 bg-neutral-50/70 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setActiveTab('camera')}
              className={`flex-1 py-2.5 flex items-center justify-center gap-1.5 border-b-2 transition-colors cursor-pointer ${
                activeTab === 'camera'
                  ? 'border-neutral-900 text-neutral-900 bg-white'
                  : 'border-transparent text-neutral-500 hover:text-neutral-900'
              }`}
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Live Camera</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('upload')}
              className={`flex-1 py-2.5 flex items-center justify-center gap-1.5 border-b-2 transition-colors cursor-pointer ${
                activeTab === 'upload'
                  ? 'border-neutral-900 text-neutral-900 bg-white'
                  : 'border-transparent text-neutral-500 hover:text-neutral-900'
              }`}
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Upload Photo / Tag</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('manual')}
              className={`flex-1 py-2.5 flex items-center justify-center gap-1.5 border-b-2 transition-colors cursor-pointer ${
                activeTab === 'manual'
                  ? 'border-neutral-900 text-neutral-900 bg-white'
                  : 'border-transparent text-neutral-500 hover:text-neutral-900'
              }`}
            >
              <Search className="w-3.5 h-3.5" />
              <span>Manual Entry</span>
            </button>
          </div>
        )}

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4 bg-neutral-50/40 text-xs flex-1">
          {scannedResult ? (
            /* Scanned Item Match Presentation */
            <div className="space-y-4 animate-in fade-in zoom-in-95 duration-150">
              {/* Header Box */}
              <div className="bg-white border border-neutral-200 rounded-xl p-4 space-y-3 shadow-xs">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-md">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Barcode / QR Decoded Successfully</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopyCode(scannedResult.code)}
                    className="flex items-center gap-1 font-mono text-[11px] text-neutral-500 hover:text-neutral-900 bg-neutral-100 hover:bg-neutral-200 px-2 py-0.5 rounded transition-colors cursor-pointer"
                    title="Copy scanned code"
                  >
                    {copiedCode ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                    <span>{scannedResult.code}</span>
                  </button>
                </div>

                {/* Match: Hardware Asset */}
                {scannedResult.match.kind === 'asset' && (
                  <div className="space-y-3 pt-1">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded inline-block mb-1">
                          Hardware Asset Match
                        </div>
                        <h3 className="text-base font-bold text-neutral-900">
                          {scannedResult.match.item.name}
                        </h3>
                        <p className="text-neutral-600 mt-0.5 font-medium">
                          Model: {scannedResult.match.item.model}
                        </p>
                      </div>
                      <span className="font-mono text-xs font-bold bg-neutral-100 px-2 py-1 rounded text-neutral-800 border border-neutral-200">
                        {scannedResult.match.item.serialNumber}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 p-3 bg-neutral-50 rounded-lg border border-neutral-200">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-neutral-400 block mb-0.5">
                          Current Room Placement
                        </span>
                        <span className="font-semibold text-neutral-900 flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-neutral-500" />
                          {scannedResult.match.item.location}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-bold text-neutral-400 block mb-0.5">
                          Operational Status
                        </span>
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {scannedResult.match.item.status}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          const assetId = (scannedResult.match as { kind: 'asset'; item: MockAsset }).item.id;
                          closeScanner();
                          router.push(`/assets/${assetId}`);
                        }}
                        className="flex-1 py-2 px-3 text-xs font-semibold bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Inspect Full Asset Specification</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Match: Inventory Stock Item */}
                {scannedResult.match.kind === 'stock' && (
                  <div className="space-y-3 pt-1">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded inline-block mb-1">
                          Inventory Stock Match
                        </div>
                        <h3 className="text-base font-bold text-neutral-900">
                          {scannedResult.match.item.name}
                        </h3>
                        <p className="text-neutral-600 mt-0.5 font-medium">
                          Category: {scannedResult.match.item.category} • SKU: {scannedResult.match.item.code}
                        </p>
                      </div>
                      <span className="font-mono text-xs font-bold bg-neutral-100 px-2 py-1 rounded text-neutral-800 border border-neutral-200">
                        {scannedResult.match.item.quantity} {scannedResult.match.item.unit}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 p-3 bg-neutral-50 rounded-lg border border-neutral-200">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-neutral-400 block mb-0.5">
                          Storage Rack / Shelf
                        </span>
                        <span className="font-semibold text-neutral-900 flex items-center gap-1">
                          <Boxes className="w-3.5 h-3.5 text-neutral-500" />
                          {scannedResult.match.item.rack || scannedResult.match.item.location}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-bold text-neutral-400 block mb-0.5">
                          Stock Availability
                        </span>
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {scannedResult.match.item.status === 'in_stock' ? 'In Stock' : 'Low Stock'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          const stockId = (scannedResult.match as { kind: 'stock'; item: MockItem }).item.id;
                          closeScanner();
                          router.push(`/stock/${stockId}`);
                        }}
                        className="flex-1 py-2 px-3 text-xs font-semibold bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Inspect Stock Item Specification</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Match: Lab Location */}
                {scannedResult.match.kind === 'location' && (
                  <div className="space-y-3 pt-1">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-purple-700 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded inline-block">
                      Laboratory Room QR Match
                    </div>
                    <h3 className="text-base font-bold text-neutral-900">
                      {scannedResult.match.item.name}
                    </h3>
                    <p className="text-neutral-600 font-medium">
                      {scannedResult.match.item.building} • Room <span className="font-bold text-neutral-900">{scannedResult.match.item.room}</span>
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        const locId = (scannedResult.match as { kind: 'location'; item: MockLocation }).item.id;
                        closeScanner();
                        router.push(`/locations/${locId}`);
                      }}
                      className="w-full py-2 px-3 text-xs font-semibold bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
                    >
                      <Building className="w-3.5 h-3.5" />
                      <span>View Room Fleet & Equipment</span>
                    </button>
                  </div>
                )}

                {/* Match: Catalog Model / Unregistered */}
                {(scannedResult.match.kind === 'catalog' || scannedResult.match.kind === 'unregistered') && (
                  <div className="space-y-3 pt-1">
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                      <div className="flex items-center gap-2 text-amber-800 font-bold mb-1">
                        <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                        <span>Unregistered Equipment Tag</span>
                      </div>
                      <p className="text-neutral-600 text-[11px] leading-relaxed">
                        Code <code className="font-mono font-bold text-neutral-800">{scannedResult.code}</code> was decoded, but is not currently cataloged in your active faculty inventory.
                      </p>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          const code = scannedResult.code;
                          closeScanner();
                          openModalWithPrefill('add_asset', { serial: code, model: code });
                        }}
                        className="w-full sm:flex-1 py-2 px-3 text-xs font-semibold bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Register as Device</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const code = scannedResult.code;
                          closeScanner();
                          openModalWithPrefill('add_stock', { code });
                        }}
                        className="w-full sm:flex-1 py-2 px-3 text-xs font-semibold bg-white border border-neutral-300 hover:bg-neutral-50 text-neutral-800 rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add as Stock SKU</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Action: Next Scan */}
              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    resetScan();
                    if (activeTab === 'camera') startScanner(selectedDeviceIndex);
                  }}
                  className="px-4 py-2 text-xs font-semibold bg-white border border-neutral-300 text-neutral-700 hover:bg-neutral-50 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Scan Next Barcode</span>
                </button>
                <button
                  type="button"
                  onClick={closeScanner}
                  className="px-4 py-2 text-xs font-semibold bg-neutral-900 text-white hover:bg-neutral-800 rounded-lg transition-colors cursor-pointer"
                >
                  Done
                </button>
              </div>
            </div>
          ) : (
            /* Active Scanner Modes */
            <div className="space-y-4">
              {/* TAB 1: LIVE CAMERA */}
              {activeTab === 'camera' && (
                <div className="space-y-3">
                  <div className="relative bg-neutral-950 rounded-xl overflow-hidden aspect-16/10 flex items-center justify-center border border-neutral-800 shadow-inner">
                    <video
                      ref={videoRef}
                      className={`w-full h-full object-cover ${cameraActive ? 'block' : 'hidden'}`}
                      autoPlay
                      playsInline
                      muted
                    />

                    {cameraActive && (
                      <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
                        <div className="w-64 h-36 border border-emerald-400/80 rounded-lg relative shadow-lg">
                          {/* Corner Reticles */}
                          <div className="absolute -top-0.5 -left-0.5 w-3 h-3 border-t-2 border-l-2 border-emerald-400"></div>
                          <div className="absolute -top-0.5 -right-0.5 w-3 h-3 border-t-2 border-r-2 border-emerald-400"></div>
                          <div className="absolute -bottom-0.5 -left-0.5 w-3 h-3 border-b-2 border-l-2 border-emerald-400"></div>
                          <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 border-b-2 border-r-2 border-emerald-400"></div>
                          {/* Laser beam */}
                          <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent absolute top-1/2 -translate-y-1/2 animate-pulse"></div>
                        </div>
                        <span className="text-[10px] text-white/90 font-medium bg-black/70 backdrop-blur-xs px-2.5 py-1 rounded-full mt-3 shadow-md">
                          Align barcode or QR code inside the box
                        </span>
                      </div>
                    )}

                    {!cameraActive && (
                      <div className="text-center p-6 text-neutral-400 space-y-2">
                        <Camera className="w-8 h-8 mx-auto text-neutral-600" />
                        <p className="text-xs text-neutral-200 font-bold">Camera Standby</p>
                        <p className="text-[11px] text-neutral-400 max-w-xs mx-auto">
                          {cameraError || 'Allow camera permission to scan physical equipment barcodes and QR labels.'}
                        </p>
                        <button
                          type="button"
                          onClick={() => startScanner(selectedDeviceIndex)}
                          className="mt-2 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer shadow-2xs"
                        >
                          Activate Camera
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Camera Controls */}
                  {cameraActive && cameraDevices.length > 1 && (
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-neutral-500 text-[11px]">
                        Active lens: {cameraDevices[selectedDeviceIndex]?.label || `Camera ${selectedDeviceIndex + 1}`}
                      </span>
                      <button
                        type="button"
                        onClick={handleSwitchCamera}
                        className="inline-flex items-center gap-1.5 text-xs font-medium text-neutral-700 bg-white border border-neutral-300 hover:bg-neutral-50 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                      >
                        <SwitchCamera className="w-3.5 h-3.5" />
                        <span>Switch Camera</span>
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: UPLOAD IMAGE / PHOTO */}
              {activeTab === 'upload' && (
                <div className="space-y-3">
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-neutral-300 hover:border-neutral-900 rounded-xl p-8 text-center bg-white hover:bg-neutral-50 transition-all cursor-pointer space-y-3"
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                    <div className="w-12 h-12 rounded-full bg-neutral-100 flex items-center justify-center mx-auto text-neutral-600">
                      <Upload className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-neutral-900">
                        {isProcessingImage ? 'Decoding Barcode from Image...' : 'Click or Drop Barcode Photo Here'}
                      </h4>
                      <p className="text-[11px] text-neutral-500 mt-1">
                        Upload equipment tag photos, screenshots, or sticker images (PNG, JPG, WebP)
                      </p>
                    </div>
                  </div>

                  {cameraError && (
                    <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-[11px] text-rose-700 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                      <span>{cameraError}</span>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: MANUAL LOOKUP */}
              {activeTab === 'manual' && (
                <div className="space-y-4 bg-white p-4 rounded-xl border border-neutral-200">
                  <form onSubmit={handleManualSearch} className="flex gap-2">
                    <div className="relative flex-1">
                      <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="e.g. OPT-102B-01-TO-24 or MON-102B-P2419H"
                        value={manualCodeInput}
                        onChange={(e) => setManualCodeInput(e.target.value)}
                        className="w-full bg-neutral-50 border border-neutral-300 text-xs pl-8 pr-3 py-2 rounded-lg focus:outline-none focus:border-neutral-900 focus:bg-white font-mono"
                      />
                    </div>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-neutral-900 text-white text-xs font-semibold rounded-lg hover:bg-neutral-800 transition-colors shrink-0 cursor-pointer shadow-2xs"
                    >
                      Lookup
                    </button>
                  </form>

                  {/* Sample Test Pills */}
                  <div className="space-y-2">
                    <span className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider block">
                      Quick Sample Test Codes
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        { label: 'Dell OptiPlex Workstations', code: 'OPT-102B-01-TO-24' },
                        { label: 'Dell 24" Monitors', code: 'MON-102B-P2419H' },
                        { label: 'Cisco ISR 4331 Router', code: 'FOC21342X8Z' },
                        { label: 'Rm 102B Lab Room', code: 'Rm 102B' },
                      ].map((sample) => (
                        <button
                          key={sample.code}
                          type="button"
                          onClick={() => handleMatchCode(sample.code)}
                          className="px-2 py-1 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 font-mono text-[10px] rounded border border-neutral-200 transition-colors cursor-pointer"
                        >
                          {sample.label} ({sample.code})
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
