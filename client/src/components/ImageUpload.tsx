'use client';

import React, { useRef, useState } from 'react';
import { UploadCloud, Image as ImageIcon, X, RefreshCw, Link as LinkIcon } from 'lucide-react';

interface ImageUploadProps {
  value?: string;
  onChange: (url: string) => void;
  label?: string;
}

export function ImageUpload({ value, onChange, label = 'Product Image' }: ImageUploadProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [manualUrl, setManualUrl] = useState('');

  const handleFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file (PNG, JPG, WebP)');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      if (!dataUrl) return;

      // Automatically optimize high-res images to prevent oversized base64 payloads
      const img = new window.Image();
      img.onload = () => {
        const MAX_DIM = 1200;
        let { width, height } = img;

        if (width > MAX_DIM || height > MAX_DIM) {
          if (width > height) {
            height = Math.round((height * MAX_DIM) / width);
            width = MAX_DIM;
          } else {
            width = Math.round((width * MAX_DIM) / height);
            height = MAX_DIM;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressed = canvas.toDataURL('image/jpeg', 0.85);
          onChange(compressed);
        } else {
          onChange(dataUrl);
        }
      };
      img.onerror = () => {
        onChange(dataUrl);
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  };

  const onFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  return (
    <div className="space-y-1.5 text-xs">
      <div className="flex items-center justify-between">
        <label className="block font-semibold text-neutral-800">{label}</label>
        <button
          type="button"
          onClick={() => setShowUrlInput(!showUrlInput)}
          className="text-[11px] text-neutral-500 hover:text-neutral-900 flex items-center gap-1 cursor-pointer transition-colors"
        >
          <LinkIcon className="w-3 h-3" />
          <span>{showUrlInput ? 'Use file upload' : 'Paste URL instead'}</span>
        </button>
      </div>

      {showUrlInput ? (
        <div className="flex gap-2">
          <input
            type="url"
            placeholder="https://images.unsplash.com/..."
            value={value || manualUrl}
            onChange={(e) => {
              setManualUrl(e.target.value);
              onChange(e.target.value);
            }}
            className="flex-1 bg-white border border-neutral-300 text-neutral-900 px-3 py-2 rounded focus:outline-none focus:border-neutral-900 font-mono text-[11px]"
          />
        </div>
      ) : value ? (
        <div className="flex items-center gap-3 p-2.5 bg-neutral-50 border border-neutral-200 rounded">
          <div className="w-14 h-14 rounded border border-neutral-200 bg-white overflow-hidden shrink-0 flex items-center justify-center">
            <img
              src={value}
              alt="Uploaded preview"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-semibold text-neutral-900 truncate">
              Image ready
            </div>
            <div className="text-[11px] text-neutral-500 mt-0.5">
              Click change to pick another image
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              onChange={onFileInputChange}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-2.5 py-1.5 text-xs font-medium bg-white border border-neutral-300 hover:bg-neutral-100 rounded text-neutral-700 flex items-center gap-1 cursor-pointer transition-colors"
              title="Change Image"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Change</span>
            </button>
            <button
              type="button"
              onClick={() => onChange('')}
              className="p-1.5 text-rose-600 hover:bg-rose-50 rounded cursor-pointer transition-colors"
              title="Remove Image"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      ) : (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded p-4 text-center cursor-pointer transition-colors ${
            isDragging
              ? 'border-neutral-900 bg-neutral-100'
              : 'border-neutral-300 hover:border-neutral-400 bg-neutral-50/50 hover:bg-neutral-50'
          }`}
        >
          <input
            type="file"
            ref={fileInputRef}
            accept="image/*"
            onChange={onFileInputChange}
            className="hidden"
          />
          <div className="flex flex-col items-center gap-1.5">
            <div className="w-8 h-8 rounded-full bg-neutral-200/70 flex items-center justify-center text-neutral-700">
              <UploadCloud className="w-4 h-4" />
            </div>
            <div>
              <span className="font-semibold text-neutral-900">Click to upload</span>
              <span className="text-neutral-500"> or drag and drop</span>
            </div>
            <div className="text-[11px] text-neutral-400">
              PNG, JPG, WEBP, or SVG
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
