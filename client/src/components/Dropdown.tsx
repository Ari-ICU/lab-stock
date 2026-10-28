'use client';

import React, { useState, useRef, useEffect } from 'react';
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
}

export function Dropdown({
  value,
  options,
  onChange,
  placeholder = 'Select option',
  className = '',
  buttonClassName = '',
}: DropdownProps) {
  const [open, setOpen] = useState(false);
  const [openUpwards, setOpenUpwards] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const selectedOption = options.find((o) => o.value === value);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const spaceBelow = window.innerHeight - rect.bottom;
        // If less than 260px below, flip upwards
        setOpenUpwards(spaceBelow < 260 && rect.top > 260);
      }
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [open]);

  const isFullWidth = className.includes('w-full');

  return (
    <div
      className={`relative ${open ? 'z-30' : 'z-auto'} ${
        isFullWidth ? 'w-full' : 'inline-block'
      } ${className}`}
      ref={containerRef}
    >
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`w-full flex items-center justify-between gap-2.5 px-3 py-2 text-xs font-medium text-neutral-900 bg-white border border-neutral-300 rounded hover:border-neutral-400 focus:outline-none focus:ring-1 focus:ring-neutral-900 transition-colors cursor-pointer select-none ${buttonClassName}`}
      >
        <span className="truncate">
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown
          className={`w-3.5 h-3.5 text-neutral-500 transition-transform shrink-0 ${
            open ? 'rotate-180' : ''
          }`}
        />
      </button>

      {open && (
        <div
          className={`absolute bg-white border border-neutral-200 rounded shadow-lg z-50 py-1 text-xs divide-y divide-neutral-100 max-h-60 overflow-y-auto ${
            openUpwards ? 'bottom-full mb-1' : 'top-full mt-1'
          } ${
            isFullWidth
              ? 'left-0 right-0 w-full'
              : 'left-0 sm:left-auto sm:right-0 min-w-[160px] w-max max-w-xs'
          }`}
        >
          <div className="py-0.5">
            {options.map((option) => {
              const isSelected = option.value === value;
              return (
                <button
                  key={option.value}
                  type="button"
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
                    {isSelected && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
