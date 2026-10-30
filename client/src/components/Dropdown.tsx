'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ChevronDown, Check, Search, X } from 'lucide-react';
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
  direction?: 'auto' | 'up' | 'down';
  searchable?: boolean;
  searchPlaceholder?: string;
  disabled?: boolean;
}

export function Dropdown({
  value,
  options,
  onChange,
  placeholder = 'Select option',
  className = '',
  buttonClassName = '',
  align = 'left',
  direction = 'auto',
  searchable,
  searchPlaceholder = 'Search options...',
  disabled = false,
}: DropdownProps) {
  const [open, setOpen] = useState(false);
  const [openUpwards, setOpenUpwards] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef<HTMLDivElement | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  // Auto-enable search if there are 6 or more options, unless explicitly turned off
  const isSearchable = searchable ?? options.length >= 6;

  const selectedOption = options.find((o) => o.value === value);

  // If the passed value doesn't match an option directly, include it as an effective option
  const effectiveOptions = useMemo(() => {
    if (value && value.trim().length > 0 && !options.some((o) => o.value === value)) {
      return [{ label: value, value }, ...options];
    }
    return options;
  }, [value, options]);

  const filteredOptions = useMemo(() => {
    if (!searchQuery.trim()) return effectiveOptions;
    const q = searchQuery.toLowerCase().trim();
    return effectiveOptions.filter(
      (opt) =>
        opt.label.toLowerCase().includes(q) ||
        opt.value.toLowerCase().includes(q)
    );
  }, [effectiveOptions, searchQuery]);

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
        if (direction === 'up') {
          setOpenUpwards(true);
        } else if (direction === 'down') {
          setOpenUpwards(false);
        } else {
          const rect = containerRef.current.getBoundingClientRect();
          let availableBelow = window.innerHeight - rect.bottom;
          let availableAbove = rect.top;

          // Check inside parent modal or scroll container to prevent clipped overflow
          let el = containerRef.current.parentElement;
          while (el && el !== document.body) {
            const style = window.getComputedStyle(el);
            const isScrollable = /(auto|scroll)/.test(style.overflowY || style.overflow);
            const isModal =
              (el.hasAttribute('role') && el.getAttribute('role') === 'dialog') ||
              el.classList.contains('shadow-2xl') ||
              el.classList.contains('shadow-xl') ||
              el.tagName === 'FORM';

            if (isScrollable || isModal) {
              const pRect = el.getBoundingClientRect();
              availableBelow = Math.min(availableBelow, pRect.bottom - rect.bottom);
              availableAbove = Math.min(availableAbove, rect.top - pRect.top);
              break;
            }
            el = el.parentElement;
          }

          // If space below is restricted (< 210px) and there's more room above, flip upwards
          const shouldFlipUp = availableBelow < 210 && availableAbove > availableBelow;
          setOpenUpwards(shouldFlipUp);
        }
      }
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);

      if (isSearchable) {
        setTimeout(() => {
          searchInputRef.current?.focus();
        }, 30);
      }
    } else {
      setSearchQuery('');
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, direction, isSearchable]);

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
        disabled={disabled}
        onClick={() => !disabled && setOpen(!open)}
        className={`w-full flex items-center justify-between gap-2.5 px-3 py-1.5 text-xs font-medium rounded transition-colors select-none text-left ${
          disabled
            ? 'bg-neutral-100/80 border border-neutral-200 text-neutral-400 cursor-not-allowed shadow-none'
            : 'text-neutral-900 bg-white border border-neutral-300 hover:border-neutral-400 focus:outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 cursor-pointer'
        } ${buttonClassName}`}
        aria-haspopup="listbox"
        aria-expanded={open && !disabled}
      >
        <span
          className={`truncate ${
            disabled
              ? 'text-neutral-400'
              : !selectedOption && (!value || value.trim().length === 0)
              ? 'text-neutral-400 font-normal'
              : 'text-neutral-900'
          }`}
        >
          {displayLabel}
        </span>
        <ChevronDown
          className={`w-3.5 h-3.5 transition-transform shrink-0 ${
            disabled ? 'text-neutral-400' : 'text-neutral-500'
          } ${open && !disabled ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div
          role="listbox"
          className={`absolute bg-white border border-neutral-200 rounded-lg shadow-xl z-50 text-xs max-h-52 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-100 ${
            openUpwards ? 'bottom-full mb-1' : 'top-full mt-1'
          } ${
            align === 'right' ? 'right-0' : 'left-0'
          }`}
          style={{ minWidth: '100%', maxWidth: 'max(100%, 420px)' }}
        >
          {isSearchable && (
            <div className="p-2 border-b border-neutral-100 bg-neutral-50/80 shrink-0">
              <div className="relative flex items-center">
                <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={searchPlaceholder}
                  className="w-full text-xs pl-8 pr-7 py-1.5 bg-white border border-neutral-200 rounded text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 transition-colors"
                  onClick={(e) => e.stopPropagation()}
                  onKeyDown={(e) => e.stopPropagation()}
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSearchQuery('');
                      searchInputRef.current?.focus();
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700 p-0.5 rounded cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          )}

          <div className="overflow-y-auto flex-1 py-1">
            {filteredOptions.length === 0 ? (
              <div className="px-3 py-4 text-neutral-400 text-center italic text-xs">
                No matching options found
              </div>
            ) : (
              filteredOptions.map((option) => {
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
                      setSearchQuery('');
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 text-left transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-neutral-100 text-neutral-900 font-semibold'
                        : 'text-neutral-700 hover:bg-neutral-50 hover:text-neutral-900'
                    }`}
                  >
                    <span className="truncate pr-2" title={option.label}>
                      {option.label}
                    </span>
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
        </div>
      )}
    </div>
  );
}
