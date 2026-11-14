'use client';

import React, { useState } from 'react';

export interface NumberInputProps
  extends Omit<
    React.InputHTMLAttributes<HTMLInputElement>,
    'type' | 'value' | 'onChange' | 'min' | 'max'
  > {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  emptyValue?: number;
}

/**
 * Digit-only numeric input that prevents leading-zero artifacts ("01") and
 * allows clearing the field while typing without snapping back to 0 mid-edit.
 */
export function NumberInput({
  value,
  onChange,
  min = 0,
  max,
  emptyValue,
  disabled,
  readOnly,
  onFocus,
  onBlur,
  onKeyDown,
  ...rest
}: NumberInputProps) {
  const fallback = emptyValue ?? min ?? 0;
  const safeValue = Number.isFinite(value) ? value : fallback;

  const [focused, setFocused] = useState(false);
  const [draft, setDraft] = useState('');

  const displayValue = focused ? draft : String(safeValue);

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    const initial = String(safeValue);
    setFocused(true);
    setDraft(initial);
    if (initial === '0' && !disabled && !readOnly) {
      e.currentTarget.select();
    }
    onFocus?.(e);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digitsOnly = e.target.value.replace(/\D+/g, '');
    const cleaned = digitsOnly.replace(/^0+(?=\d)/, '');
    setDraft(cleaned);

    if (cleaned === '') {
      onChange(fallback);
      return;
    }

    const parsed = parseInt(cleaned, 10);
    if (!Number.isNaN(parsed)) {
      onChange(parsed);
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    setFocused(false);
    if (draft === '') {
      onChange(fallback);
    } else {
      let parsed = parseInt(draft, 10);
      if (Number.isNaN(parsed)) parsed = fallback;
      if (min !== undefined) parsed = Math.max(min, parsed);
      if (max !== undefined) parsed = Math.min(max, parsed);
      if (parsed !== safeValue) {
        onChange(parsed);
      }
    }
    onBlur?.(e);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!disabled && !readOnly && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) {
      e.preventDefault();
      const base = draft === '' ? fallback : parseInt(draft, 10) || 0;
      let next = e.key === 'ArrowUp' ? base + 1 : base - 1;
      if (min !== undefined) next = Math.max(min, next);
      if (max !== undefined) next = Math.min(max, next);
      setDraft(String(next));
      onChange(next);
    }
    onKeyDown?.(e);
  };

  return (
    <input
      {...rest}
      type="text"
      inputMode="numeric"
      pattern="[0-9]*"
      disabled={disabled}
      readOnly={readOnly}
      value={displayValue}
      onFocus={handleFocus}
      onChange={handleChange}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
    />
  );
}
