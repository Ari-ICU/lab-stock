'use client';

import React, { useEffect, useRef, useState } from 'react';
import { BrowserMultiFormatReader } from '@zxing/library';
import { useStock } from '@/context/StockContext';
import { findProductByBarcode, ProductModelInfo } from '@/data/productCatalog';
import {
  Barcode,
  X,
  Camera,
  CheckCircle2,
  RotateCcw,
  Search,
} from 'lucide-react';

export function QRScannerModal() {
  const { isScannerOpen, closeScanner, addStockItem } = useStock();
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [detectedModel, setDetectedModel] = useState<ProductModelInfo | null>(null);
  const [scannedCode, setScannedCode] = useState<string | null>(null);
  const [manualCodeInput, setManualCodeInput] = useState<string>('');

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const codeReaderRef = useRef<BrowserMultiFormatReader | null>(null);

  useEffect(() => {
    if (!isScannerOpen) {
      stopCamera();
      resetScan();
      return;
    }

    startScanner();

    return () => {
      stopCamera();
    };
  }, [isScannerOpen]);

  const resetScan = () => {
    setDetectedModel(null);
    setScannedCode(null);
    setCameraError(null);
    setManualCodeInput('');
  };

  const startScanner = async () => {
    setCameraError(null);
    try {
      const codeReader = new BrowserMultiFormatReader();
      codeReaderRef.current = codeReader;

      const videoInputDevices = await codeReader.listVideoInputDevices();
      if (!videoInputDevices || videoInputDevices.length === 0) {
        setCameraError('No camera detected on this system.');
        setCameraActive(false);
        return;
      }

      const selectedDevice =
        videoInputDevices.find(
          (d) =>
            d.label.toLowerCase().includes('back') ||
            d.label.toLowerCase().includes('rear') ||
            d.label.toLowerCase().includes('environment')
        ) || videoInputDevices[0];

      setCameraActive(true);

      codeReader.decodeFromVideoDevice(
        selectedDevice.deviceId,
        videoRef.current,
        (result) => {
          if (result) {
            handleBarcodeScanned(result.getText());
          }
        }
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Camera unavailable or permission denied.';
      setCameraError(msg);
      setCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (codeReaderRef.current) {
      codeReaderRef.current.reset();
      codeReaderRef.current = null;
    }
    setCameraActive(false);
  };

  const handleBarcodeScanned = (rawCode: string) => {
    const code = rawCode.trim();
    if (!code) return;
    setScannedCode(code);

    const matched = findProductByBarcode(code);

    if (matched) {
      setDetectedModel(matched);
      addStockItem({
        name: matched.productName,
        code: matched.modelNumber,
        category: matched.category,
        quantity: 1,
        unit: matched.unit || 'Units',
        location: matched.defaultLocation,
        rack: matched.defaultRack,
        status: 'in_stock',
        expiryDate: 'Warranty Active',
      });
      stopCamera();
    } else {
      const genericModel: ProductModelInfo = {
        barcode: code,
        modelNumber: code,
        productName: `Network Device (${code})`,
        brand: 'Generic Network Hardware',
        category: 'Hardware',
        specs: `Hardware unit registered via barcode ${code}`,
        formFactor: 'Standard Unit',
        defaultLocation: 'Datacenter Server Rm B04',
        defaultRack: 'MDF Core Server Rack 42U',
        inStockQuantity: 1,
        unit: 'Units',
      };
      setDetectedModel(genericModel);
      addStockItem({
        name: genericModel.productName,
        code: genericModel.modelNumber,
        category: genericModel.category,
        quantity: 1,
        unit: 'Units',
        location: genericModel.defaultLocation,
        rack: genericModel.defaultRack,
        status: 'in_stock',
        expiryDate: 'N/A',
      });
      stopCamera();
    }
  };

  const handleManualSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCodeInput.trim()) return;
    handleBarcodeScanned(manualCodeInput.trim());
  };

  if (!isScannerOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white border border-neutral-200 rounded-md max-w-lg w-full overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="h-14 px-5 border-b border-neutral-200 flex items-center justify-between shrink-0 bg-white">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded bg-neutral-900 text-emerald-400 flex items-center justify-center">
              <Barcode className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-xs font-semibold text-neutral-900 tracking-tight">
                Identify Product Model
              </h2>
              <p className="text-[11px] text-neutral-400">
                Scan barcode or serial to lookup hardware specs
              </p>
            </div>
          </div>
          <button
            onClick={closeScanner}
            className="p-1 text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100 rounded transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4 bg-neutral-50/50">
          {detectedModel ? (
            /* Model Specs Card */
            <div className="space-y-3">
              {/* Status Header */}
              <div className="bg-white border border-neutral-200 rounded p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Model Identified & Logged
                  </span>
                  <span className="text-[11px] font-mono text-neutral-400">
                    {scannedCode}
                  </span>
                </div>

                <div className="mt-1">
                  <div className="text-lg font-bold text-neutral-900 font-mono tracking-tight">
                    {detectedModel.modelNumber}
                  </div>
                  <div className="text-xs font-medium text-neutral-700 mt-0.5">
                    {detectedModel.productName}
                  </div>
                  <div className="text-[11px] text-neutral-400 mt-1 flex items-center gap-2">
                    <span>{detectedModel.brand}</span>
                    <span>•</span>
                    <span>{detectedModel.category}</span>
                  </div>
                </div>
              </div>

              {/* Specs Table */}
              <div className="bg-white border border-neutral-200 rounded divide-y divide-neutral-100 text-xs">
                {detectedModel.ports && (
                  <div className="p-3">
                    <span className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider block mb-1">
                      Interfaces & Ports
                    </span>
                    <p className="text-neutral-800 font-mono text-[11px] leading-relaxed">
                      {detectedModel.ports}
                    </p>
                  </div>
                )}

                <div className="p-3">
                  <span className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider block mb-1">
                    Hardware Specifications
                  </span>
                  <p className="text-neutral-700 leading-relaxed text-[11px]">
                    {detectedModel.specs}
                  </p>
                </div>

                <div className="p-3 grid grid-cols-2 gap-3 bg-neutral-50/50">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider block mb-0.5">
                      Assigned Storage
                    </span>
                    <span className="text-neutral-800 font-medium text-[11px]">
                      {detectedModel.defaultRack}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider block mb-0.5">
                      Lab Facility
                    </span>
                    <span className="text-neutral-800 font-medium text-[11px]">
                      {detectedModel.defaultLocation}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-1">
                <button
                  onClick={() => {
                    resetScan();
                    startScanner();
                  }}
                  className="flex-1 py-2 px-3 text-xs font-semibold bg-neutral-900 text-white rounded hover:bg-neutral-800 transition-colors flex items-center justify-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Scan Next Product</span>
                </button>
                <button
                  onClick={closeScanner}
                  className="py-2 px-4 text-xs font-medium border border-neutral-200 bg-white text-neutral-700 rounded hover:bg-neutral-50 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          ) : (
            /* Active Camera Scanner & Quick Lookups */
            <div className="space-y-4">
              {/* Viewfinder Frame */}
              <div className="relative bg-neutral-950 rounded overflow-hidden aspect-16/10 flex items-center justify-center border border-neutral-800">
                <video
                  ref={videoRef}
                  className={`w-full h-full object-cover ${cameraActive ? 'block' : 'hidden'}`}
                  autoPlay
                  playsInline
                  muted
                />

                {cameraActive && (
                  <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
                    <div className="w-60 h-20 border border-emerald-400/80 rounded relative">
                      <div className="absolute top-0 left-0 w-2.5 h-2.5 border-t-2 border-l-2 border-emerald-400"></div>
                      <div className="absolute top-0 right-0 w-2.5 h-2.5 border-t-2 border-r-2 border-emerald-400"></div>
                      <div className="absolute bottom-0 left-0 w-2.5 h-2.5 border-b-2 border-l-2 border-emerald-400"></div>
                      <div className="absolute bottom-0 right-0 w-2.5 h-2.5 border-b-2 border-r-2 border-emerald-400"></div>
                      <div className="w-full h-px bg-red-500 absolute top-1/2 -translate-y-1/2 animate-pulse"></div>
                    </div>
                    <span className="text-[10px] text-white/70 bg-black/60 px-2 py-0.5 rounded mt-3">
                      Center barcode in viewfinder
                    </span>
                  </div>
                )}

                {!cameraActive && (
                  <div className="text-center p-6 text-neutral-400">
                    <Camera className="w-7 h-7 mx-auto mb-2 text-neutral-600" />
                    <p className="text-xs text-neutral-300 font-medium">Camera Feed</p>
                    <p className="text-[11px] text-neutral-500 mt-1 max-w-xs">
                      {cameraError || 'Hold device barcode in front of the lens'}
                    </p>
                    <button
                      onClick={startScanner}
                      className="mt-3 px-3 py-1 bg-neutral-800 hover:bg-neutral-700 text-white text-xs rounded transition-colors"
                    >
                      Enable Camera
                    </button>
                  </div>
                )}
              </div>

              {/* Direct Code Input Form */}
              <form onSubmit={handleManualSearch} className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Enter barcode or part code (e.g. 0882658847219 or C9300-48P)"
                    value={manualCodeInput}
                    onChange={(e) => setManualCodeInput(e.target.value)}
                    className="w-full bg-white border border-neutral-200 text-xs pl-8 pr-3 py-1.5 rounded focus:outline-none focus:border-neutral-900 font-mono"
                  />
                </div>
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-neutral-900 text-white text-xs font-semibold rounded hover:bg-neutral-800 transition-colors shrink-0"
                >
                  Lookup
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
