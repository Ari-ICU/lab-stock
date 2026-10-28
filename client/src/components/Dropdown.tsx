'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { DropdownOption } from '@/types';

export type { DropdownOption };

interface DropdownProps {
  value: string;
  options: DropdownOption[];
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  buttonClassName?: string;
  align?: 'left' | 'right';
}

export function Dropdown({
  value,
  options,
  onChange,
  placeholder = 'Select option',
  className = '',
  buttonClassName = '',
  align = 'left',
}: DropdownProps) {
  const [open, setOpen] = useState(false);
  const [openUpwards, setOpenUpwards] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const selectedOption = options.find((o) => o.value === value);

  // If the passed value doesn't match an option directly, include it as an effective option
  const effectiveOptions = useMemo(() => {
    if (value && value.trim().length > 0 && !options.some((o) => o.value === value)) {
      return [{ label: value, value }, ...options];
    }
    return options;
  }, [value, options]);

  const displayLabel = selectedOption
    ? selectedOption.label
    : value && value.trim().length > 0
    ? value
    : placeholder;

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setOpen(false);
      }
    }
    if (open) {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const spaceBelow = window.innerHeight - rect.bottom;
        setOpenUpwards(spaceBelow < 240 && rect.top > 240);
      }
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  // Determine width
  const hasCustomWidth =
    className.includes('w-') || className.includes('inline-') || className.includes('max-w-');
  const widthClass = hasCustomWidth ? '' : 'w-full';

  return (
    <div
      className={`relative ${open ? 'z-50' : 'z-20'} ${widthClass} ${className}`}
      ref={containerRef}
    >
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`w-full flex items-center justify-between gap-2.5 px-3 py-1.5 text-xs font-medium text-neutral-900 bg-white border border-neutral-300 rounded hover:border-neutral-400 focus:outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 transition-colors cursor-pointer select-none text-left ${buttonClassName}`}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span
          className={`truncate ${
            !selectedOption && (!value || value.trim().length === 0)
              ? 'text-neutral-400 font-normal'
              : 'text-neutral-900'
          }`}
        >
          {displayLabel}
        </span>
        <ChevronDown
          className={`w-3.5 h-3.5 text-neutral-500 transition-transform shrink-0 ${
            open ? 'rotate-180' : ''
          }`}
        />
      </button>

      {open && (
        <div
          role="listbox"
          className={`absolute bg-white border border-neutral-200 rounded shadow-lg z-50 py-1 text-xs max-h-60 overflow-y-auto ${
            openUpwards ? 'bottom-full mb-1' : 'top-full mt-1'
          } ${
            align === 'right' ? 'right-0' : 'left-0'
          }`}
          style={{ minWidth: '100%', maxWidth: 'max(100%, 360px)' }}
        >
          {effectiveOptions.length === 0 ? (
            <div className="px-3 py-2 text-neutral-400 text-center italic">
              No options available
            </div>
          ) : (
            effectiveOptions.map((option) => {
              const isSelected = option.value === value;
              return (
                <button
                  key={option.value}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => {
                    onChange(option.value);
                    setOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-1.5 text-left transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-neutral-100 text-neutral-900 font-semibold'
                      : 'text-neutral-700 hover:bg-neutral-50 hover:text-neutral-900'
                  }`}
                >
                  <span className="truncate">{option.label}</span>
                  <div className="flex items-center gap-1.5 shrink-0 ml-2">
                    {option.count !== undefined && (
                      <span className="text-[10px] text-neutral-400 font-mono">
                        {option.count}
                      </span>
                    )}
                    {isSelected && (
                      <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
