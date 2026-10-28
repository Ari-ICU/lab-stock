'use client';

import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  X,
  Check,
} from 'lucide-react';

interface DatePickerProps {
  value: string; // Expected format: "YYYY-MM-DD"
  onChange: (date: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  align?: 'left' | 'right' | 'auto';
  openDirection?: 'up' | 'down' | 'auto';
}

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const WEEK_DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

export function DatePicker({
  value,
  onChange,
  placeholder = 'Select date (YYYY-MM-DD)',
  className = '',
  disabled = false,
  align = 'auto',
  openDirection = 'auto',
}: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const popoverRef = useRef<HTMLDivElement | null>(null);
  const [coords, setCoords] = useState<{ top: number; left: number; openUp: boolean }>({
    top: 0,
    left: 0,
    openUp: false,
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  // Parse initial selected date
  const parsedValue = useMemo(() => {
    if (!value || typeof value !== 'string') return null;
    const parts = value.split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1; // 0-indexed
      const day = parseInt(parts[2], 10);
      if (!isNaN(year) && !isNaN(month) && !isNaN(day)) {
        return { year, month, day };
      }
    }
    return null;
  }, [value]);

  const today = useMemo(() => {
    const d = new Date();
    return {
      year: d.getFullYear(),
      month: d.getMonth(),
      day: d.getDate(),
    };
  }, []);

  // Calendar view year and month
  const [viewYear, setViewYear] = useState<number>(
    parsedValue ? parsedValue.year : today.year
  );
  const [viewMonth, setViewMonth] = useState<number>(
    parsedValue ? parsedValue.month : today.month
  );

  // Sync view when value changes from outside
  useEffect(() => {
    if (parsedValue) {
      setViewYear(parsedValue.year);
      setViewMonth(parsedValue.month);
    }
  }, [parsedValue]);

  // Compute portal fixed screen position
  const updatePosition = useCallback(() => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const calendarHeight = 315;
    const calendarWidth = 288;
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;

    let openUp = false;
    if (openDirection === 'up') {
      openUp = true;
    } else if (openDirection === 'down') {
      openUp = false;
    } else {
      // Auto: if space below is insufficient (<325px) and space above has room, open upwards
      openUp = spaceBelow < calendarHeight + 10 && spaceAbove > spaceBelow;
    }

    const top = openUp
      ? Math.max(8, rect.top - calendarHeight - 4)
      : Math.min(window.innerHeight - calendarHeight - 8, rect.bottom + 4);

    let left = rect.left;
    if (align === 'right') {
      left = rect.right - calendarWidth;
    } else if (align === 'left') {
      left = rect.left;
    } else {
      // Auto alignment based on window right margin
      if (rect.left + calendarWidth > window.innerWidth - 12) {
        left = rect.right - calendarWidth;
      }
    }
    // Clamp horizontally to stay inside screen margins
    left = Math.max(8, Math.min(left, window.innerWidth - calendarWidth - 8));

    setCoords({ top, left, openUp });
  }, [openDirection, align]);

  // Click outside, escape key, and scroll/resize tracking
  useEffect(() => {
    if (!isOpen) return;

    updatePosition();

    function handleClickOutside(e: MouseEvent) {
      const target = e.target as Node;
      if (
        containerRef.current &&
        !containerRef.current.contains(target) &&
        popoverRef.current &&
        !popoverRef.current.contains(target)
      ) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    }

    function handleScrollOrResize() {
      updatePosition();
    }

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    window.addEventListener('scroll', handleScrollOrResize, true);
    window.addEventListener('resize', handleScrollOrResize);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('scroll', handleScrollOrResize, true);
      window.removeEventListener('resize', handleScrollOrResize);
    };
  }, [isOpen, updatePosition]);

  // Navigate months
  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  // Select day
  const handleSelectDay = (year: number, month: number, day: number) => {
    const formattedMonth = String(month + 1).padStart(2, '0');
    const formattedDay = String(day).padStart(2, '0');
    const dateStr = `${year}-${formattedMonth}-${formattedDay}`;
    onChange(dateStr);
    setIsOpen(false);
  };

  // Quick Today button
  const handleSelectToday = () => {
    handleSelectDay(today.year, today.month, today.day);
  };

  // Quick Clear button
  const handleClear = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    onChange('');
    setIsOpen(false);
  };

  // Generate calendar days: 35 or 42 grid
  const calendarDays = useMemo(() => {
    const firstDayIndex = new Date(viewYear, viewMonth, 1).getDay(); // 0 for Sunday
    const daysInCurrentMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const daysInPrevMonth = new Date(viewYear, viewMonth, 0).getDate();

    const days: {
      year: number;
      month: number;
      day: number;
      isCurrentMonth: boolean;
      isSelected: boolean;
      isToday: boolean;
    }[] = [];

    // Previous month trailing days
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const day = daysInPrevMonth - i;
      const m = viewMonth === 0 ? 11 : viewMonth - 1;
      const y = viewMonth === 0 ? viewYear - 1 : viewYear;
      days.push({
        year: y,
        month: m,
        day,
        isCurrentMonth: false,
        isSelected: !!(
          parsedValue &&
          parsedValue.year === y &&
          parsedValue.month === m &&
          parsedValue.day === day
        ),
        isToday: today.year === y && today.month === m && today.day === day,
      });
    }

    // Current month days
    for (let d = 1; d <= daysInCurrentMonth; d++) {
      days.push({
        year: viewYear,
        month: viewMonth,
        day: d,
        isCurrentMonth: true,
        isSelected: !!(
          parsedValue &&
          parsedValue.year === viewYear &&
          parsedValue.month === viewMonth &&
          parsedValue.day === d
        ),
        isToday:
          today.year === viewYear &&
          today.month === viewMonth &&
          today.day === d,
      });
    }

    // Next month trailing days to complete 35 or 42 grid
    const remaining = (7 - (days.length % 7)) % 7;
    const totalNeeded = days.length + remaining < 35 ? remaining + 7 : remaining;
    for (let d = 1; d <= totalNeeded; d++) {
      const m = viewMonth === 11 ? 0 : viewMonth + 1;
      const y = viewMonth === 11 ? viewYear + 1 : viewYear;
      days.push({
        year: y,
        month: m,
        day: d,
        isCurrentMonth: false,
        isSelected: !!(
          parsedValue &&
          parsedValue.year === y &&
          parsedValue.month === m &&
          parsedValue.day === d
        ),
        isToday: today.year === y && today.month === m && today.day === d,
      });
    }

    return days;
  }, [viewYear, viewMonth, parsedValue, today]);

  // Year choices for quick selection dropdown
  const yearOptions = useMemo(() => {
    const list: number[] = [];
    for (let y = today.year - 5; y <= today.year + 10; y++) {
      list.push(y);
    }
    return list;
  }, [today.year]);

  const popoverContent = isOpen && mounted && typeof document !== 'undefined' ? (
    createPortal(
      <div
        ref={popoverRef}
        style={{
          position: 'fixed',
          top: `${coords.top}px`,
          left: `${coords.left}px`,
          width: '288px',
          zIndex: 99999,
        }}
        className="bg-white border border-neutral-200 rounded-lg shadow-2xl p-3 select-none animate-in fade-in zoom-in-95 duration-100 ring-1 ring-black/5"
      >
        {/* Calendar Header with Month/Year Navigation */}
        <div className="flex items-center justify-between gap-1 pb-2.5 border-b border-neutral-100">
          <button
            type="button"
            onClick={handlePrevMonth}
            className="p-1 rounded text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 transition-colors cursor-pointer"
            title="Previous month"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-1.5 text-xs font-bold text-neutral-900">
            {/* Month Selector */}
            <select
              value={viewMonth}
              onChange={(e) => setViewMonth(parseInt(e.target.value, 10))}
              className="bg-transparent hover:bg-neutral-100 rounded px-1.5 py-0.5 font-semibold text-neutral-900 cursor-pointer focus:outline-none"
            >
              {MONTH_NAMES.map((m, idx) => (
                <option key={m} value={idx}>
                  {m}
                </option>
              ))}
            </select>

            {/* Year Selector */}
            <select
              value={viewYear}
              onChange={(e) => setViewYear(parseInt(e.target.value, 10))}
              className="bg-transparent hover:bg-neutral-100 rounded px-1 py-0.5 font-mono font-semibold text-neutral-900 cursor-pointer focus:outline-none"
            >
              {yearOptions.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={handleNextMonth}
            className="p-1 rounded text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 transition-colors cursor-pointer"
            title="Next month"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Weekday Header */}
        <div className="grid grid-cols-7 gap-1 pt-2 pb-1 text-center text-[10px] font-bold text-neutral-400">
          {WEEK_DAYS.map((day) => (
            <div key={day}>{day}</div>
          ))}
        </div>

        {/* Days Grid */}
        <div className="grid grid-cols-7 gap-1 text-xs">
          {calendarDays.map((item, idx) => {
            const isSelected = item.isSelected;
            const isToday = item.isToday;
            const isCurrent = item.isCurrentMonth;

            return (
              <button
                key={`${item.year}-${item.month}-${item.day}-${idx}`}
                type="button"
                onClick={() =>
                  handleSelectDay(item.year, item.month, item.day)
                }
                className={`h-7 w-7 mx-auto flex items-center justify-center rounded text-[11px] transition-all cursor-pointer relative ${
                  isSelected
                    ? 'bg-neutral-900 text-white font-bold shadow-xs'
                    : isToday
                    ? 'font-bold text-neutral-900 border border-neutral-400 hover:bg-neutral-100'
                    : isCurrent
                    ? 'text-neutral-800 hover:bg-neutral-100 hover:text-neutral-900 font-medium'
                    : 'text-neutral-300 hover:bg-neutral-50 hover:text-neutral-500'
                }`}
              >
                {item.day}
                {isToday && !isSelected && (
                  <span className="absolute bottom-0.5 w-1 h-1 rounded-full bg-emerald-500" />
                )}
              </button>
            );
          })}
        </div>

        {/* Calendar Footer with Clear and Today */}
        <div className="flex items-center justify-between pt-2.5 mt-2 border-t border-neutral-100 text-[11px]">
          <button
            type="button"
            onClick={() => handleClear()}
            className="text-neutral-500 hover:text-neutral-900 font-medium transition-colors cursor-pointer px-1.5 py-0.5 rounded hover:bg-neutral-100"
          >
            Clear
          </button>

          <button
            type="button"
            onClick={handleSelectToday}
            className="text-neutral-900 font-bold hover:text-emerald-700 transition-colors cursor-pointer px-2 py-0.5 rounded bg-neutral-100 hover:bg-neutral-200"
          >
            Today
          </button>
        </div>
      </div>,
      document.body
    )
  ) : null;

  return (
    <div
      className={`relative w-full ${className}`}
      ref={containerRef}
    >
      {/* Input Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => {
          if (!isOpen) {
            updatePosition();
          }
          setIsOpen(!isOpen);
        }}
        className={`w-full flex items-center justify-between gap-2.5 px-3 py-1.5 text-xs font-mono text-neutral-900 bg-white border border-neutral-300 rounded hover:border-neutral-400 focus:outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 transition-colors cursor-pointer select-none ${
          disabled ? 'opacity-50 cursor-not-allowed bg-neutral-100' : ''
        }`}
      >
        <div className="flex items-center gap-2 truncate">
          <CalendarIcon className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
          <span
            className={
              value ? 'font-semibold text-neutral-900' : 'text-neutral-400 font-sans'
            }
          >
            {value || placeholder}
          </span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {value && !disabled && (
            <span
              onClick={handleClear}
              className="p-0.5 text-neutral-400 hover:text-neutral-800 rounded transition-colors"
              title="Clear date"
            >
              <X className="w-3.5 h-3.5" />
            </span>
          )}
        </div>
      </button>

      {/* Rendered in Portal to document.body to prevent clipping or internal scrollbars */}
      {popoverContent}
    </div>
  );
}
