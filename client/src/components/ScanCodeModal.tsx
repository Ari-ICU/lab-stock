'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { BrowserMultiFormatReader } from '@zxing/library';
import { findProductByBarcode } from '@/data/productCatalog';
import {
  Barcode,
  QrCode,
  X,
  Camera,
  Upload,
  Search,
  CheckCircle2,
  SwitchCamera,
  AlertCircle,
  Volume2,
  VolumeX,
} from 'lucide-react';

interface ScanCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (code: string, meta?: { name?: string; model?: string; category?: string }) => void;
  title?: string;
  targetFieldLabel?: string;
}

function playBeepSound() {
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1760, ctx.currentTime + 0.08);

    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.1);
  } catch {
    // Ignore audio autoplay restrictions
  }
}

export function ScanCodeModal({
  isOpen,
  onClose,
  onScan,
  title = 'Scan Barcode / QR Code',
  targetFieldLabel = 'Serial Number or SKU',
}: ScanCodeModalProps) {
  const [activeTab, setActiveTab] = useState<'camera' | 'upload' | 'manual'>('camera');

  useEffect(() => {
    try {
      const saved = localStorage.getItem('csd_scancode_modal_tab') as 'camera' | 'upload' | 'manual' | null;
      if (saved && ['camera', 'upload', 'manual'].includes(saved)) {
        setActiveTab(saved);
      }
    } catch {
      // ignore
    }
  }, []);

  const switchTab = (tab: 'camera' | 'upload' | 'manual') => {
    setActiveTab(tab);
    try {
      localStorage.setItem('csd_scancode_modal_tab', tab);
    } catch {
      // ignore
    }
  };
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [manualInput, setManualInput] = useState('');
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const [cameraDevices, setCameraDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceIndex, setSelectedDeviceIndex] = useState(0);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const codeReaderRef = useRef<BrowserMultiFormatReader | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const stopCamera = useCallback(() => {
    if (codeReaderRef.current) {
      try {
        codeReaderRef.current.reset();
      } catch {
        // ignore
      }
      codeReaderRef.current = null;
    }
    setCameraActive(false);
  }, []);

  const handleDetected = useCallback(
    (rawText: string) => {
      const code = rawText.trim();
      if (!code) return;

      if (soundEnabled) {
        playBeepSound();
      }

      // Check if code contains structured JSON metadata
      let meta: { name?: string; model?: string; category?: string } | undefined;

      try {
        if (code.startsWith('{') && code.endsWith('}')) {
          const parsed = JSON.parse(code);
          meta = {
            name: parsed.name || parsed.productName,
            model: parsed.model || parsed.modelNumber,
            category: parsed.category,
          };
        }
      } catch {
        // Not JSON
      }

      // If not JSON, check against catalog
      if (!meta) {
        const catalogMatch = findProductByBarcode(code);
        if (catalogMatch) {
          meta = {
            name: catalogMatch.productName,
            model: catalogMatch.modelNumber,
            category: catalogMatch.category,
          };
        }
      }

      stopCamera();
      onScan(code, meta);
      onClose();
    },
    [soundEnabled, stopCamera, onScan, onClose]
  );

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
          setCameraError('No video camera detected on this device.');
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
              handleDetected(result.getText());
            }
          }
        );
      } catch (err: unknown) {
        const msg =
          err instanceof Error
            ? err.message
            : 'Camera unavailable or permission denied. You can upload an image or type the code below.';
        setCameraError(msg);
        setCameraActive(false);
      }
    },
    [handleDetected, stopCamera]
  );

  const handleSwitchCamera = () => {
    if (cameraDevices.length > 1) {
      const nextIdx = (selectedDeviceIndex + 1) % cameraDevices.length;
      startScanner(nextIdx);
    }
  };

  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      setManualInput('');
      setCameraError(null);
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
  }, [isOpen, activeTab, startScanner, stopCamera]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessingImage(true);
    setCameraError(null);

    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = reader.result as string;
      try {
        const zxingReader = new BrowserMultiFormatReader();
        const result = await zxingReader.decodeFromImageUrl(dataUrl);
        if (result) {
          handleDetected(result.getText());
        } else {
          setCameraError('No readable barcode or QR code found in this photo.');
        }
      } catch {
        setCameraError('Could not decode barcode from this image. Ensure the barcode is sharp, well-lit, and unblurred.');
      } finally {
        setIsProcessingImage(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualInput.trim()) return;
    handleDetected(manualInput.trim());
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-100"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white border border-neutral-200 rounded-xl max-w-md w-full overflow-hidden flex flex-col max-h-[90vh] shadow-2xl ring-1 ring-black/5">
        {/* Header */}
        <div className="h-14 px-5 border-b border-neutral-200 flex items-center justify-between shrink-0 bg-white">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-neutral-900 text-emerald-400 flex items-center justify-center shrink-0">
              <Barcode className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-neutral-900">{title}</h3>
              <p className="text-[11px] text-neutral-500">
                Auto-fill field: <span className="font-semibold text-neutral-800">{targetFieldLabel}</span>
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
              type="button"
              onClick={onClose}
              className="p-1.5 text-neutral-400 hover:text-neutral-900 rounded transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tab switcher */}
        <div className="flex border-b border-neutral-200 bg-neutral-50 text-xs font-semibold">
          <button
            type="button"
            onClick={() => switchTab('camera')}
            className={`flex-1 py-2 flex items-center justify-center gap-1.5 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'camera'
                ? 'border-neutral-900 text-neutral-900 bg-white'
                : 'border-transparent text-neutral-500 hover:text-neutral-900'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Camera</span>
          </button>
          <button
            type="button"
            onClick={() => switchTab('upload')}
            className={`flex-1 py-2 flex items-center justify-center gap-1.5 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'upload'
                ? 'border-neutral-900 text-neutral-900 bg-white'
                : 'border-transparent text-neutral-500 hover:text-neutral-900'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload Photo</span>
          </button>
          <button
            type="button"
            onClick={() => switchTab('manual')}
            className={`flex-1 py-2 flex items-center justify-center gap-1.5 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'manual'
                ? 'border-neutral-900 text-neutral-900 bg-white'
                : 'border-transparent text-neutral-500 hover:text-neutral-900'
            }`}
          >
            <Search className="w-3.5 h-3.5" />
            <span>Type Code</span>
          </button>
        </div>

        {/* Body */}
        <div className="p-4 space-y-3 text-xs bg-neutral-50/50">
          {activeTab === 'camera' && (
            <div className="space-y-3">
              <div className="relative bg-neutral-950 rounded-xl overflow-hidden aspect-4/3 flex items-center justify-center border border-neutral-800 shadow-inner">
                <video
                  ref={videoRef}
                  className={`w-full h-full object-cover ${cameraActive ? 'block' : 'hidden'}`}
                  autoPlay
                  playsInline
                  muted
                />

                {cameraActive && (
                  <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
                    <div className="w-56 h-32 border border-emerald-400/80 rounded-lg relative shadow-lg">
                      <div className="absolute -top-0.5 -left-0.5 w-3 h-3 border-t-2 border-l-2 border-emerald-400"></div>
                      <div className="absolute -top-0.5 -right-0.5 w-3 h-3 border-t-2 border-r-2 border-emerald-400"></div>
                      <div className="absolute -bottom-0.5 -left-0.5 w-3 h-3 border-b-2 border-l-2 border-emerald-400"></div>
                      <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 border-b-2 border-r-2 border-emerald-400"></div>
                      <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent absolute top-1/2 -translate-y-1/2 animate-pulse"></div>
                    </div>
                    <span className="text-[10px] text-white/90 font-medium bg-black/70 backdrop-blur-xs px-2.5 py-1 rounded-full mt-2.5 shadow-md">
                      Scan equipment barcode or QR tag
                    </span>
                  </div>
                )}

                {!cameraActive && (
                  <div className="text-center p-6 text-neutral-400 space-y-2">
                    <Camera className="w-7 h-7 mx-auto text-neutral-600" />
                    <p className="text-xs text-neutral-200 font-bold">Camera Ready</p>
                    <p className="text-[11px] text-neutral-400 max-w-xs mx-auto">
                      {cameraError || 'Allow camera permission to scan code directly into this field.'}
                    </p>
                    <button
                      type="button"
                      onClick={() => startScanner(selectedDeviceIndex)}
                      className="mt-2 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer shadow-2xs"
                    >
                      Start Camera
                    </button>
                  </div>
                )}
              </div>

              {cameraActive && cameraDevices.length > 1 && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-neutral-500 text-[11px]">
                    Lens: {cameraDevices[selectedDeviceIndex]?.label || `Camera ${selectedDeviceIndex + 1}`}
                  </span>
                  <button
                    type="button"
                    onClick={handleSwitchCamera}
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-neutral-700 bg-white border border-neutral-300 hover:bg-neutral-50 px-2 py-1 rounded-lg transition-colors cursor-pointer"
                  >
                    <SwitchCamera className="w-3.5 h-3.5" />
                    <span>Switch Camera</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {activeTab === 'upload' && (
            <div className="space-y-3">
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-neutral-300 hover:border-neutral-900 rounded-xl p-6 text-center bg-white hover:bg-neutral-50 transition-all cursor-pointer space-y-2.5"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <div className="w-10 h-10 rounded-full bg-neutral-100 flex items-center justify-center mx-auto text-neutral-600">
                  <Upload className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-neutral-900">
                    {isProcessingImage ? 'Decoding Image...' : 'Click to Upload Tag Photo'}
                  </h4>
                  <p className="text-[11px] text-neutral-500 mt-0.5">
                    Select a photo of the barcode or QR code label
                  </p>
                </div>
              </div>

              {cameraError && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-[11px] text-rose-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{cameraError}</span>
                </div>
              )}
            </div>
          )}

          {activeTab === 'manual' && (
            <form onSubmit={handleManualSubmit} className="space-y-3 bg-white p-3.5 rounded-xl border border-neutral-200">
              <label className="block text-xs font-semibold text-neutral-800">
                Enter Barcode / Serial / SKU Code:
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. FCW2348L09M or OPT-102B-01"
                  value={manualInput}
                  onChange={(e) => setManualInput(e.target.value)}
                  className="flex-1 bg-neutral-50 border border-neutral-300 text-xs px-3 py-2 rounded-lg font-mono focus:outline-none focus:border-neutral-900 focus:bg-white"
                  autoFocus
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer shrink-0"
                >
                  Insert
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="h-12 px-4 border-t border-neutral-200 bg-white flex items-center justify-end gap-2 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 text-xs font-semibold border border-neutral-300 rounded-lg text-neutral-700 hover:bg-neutral-50 cursor-pointer"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

