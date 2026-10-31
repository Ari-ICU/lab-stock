'use client';

import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { MoreVertical, Trash2, Edit3, Eye } from 'lucide-react';

export interface RowActionItem {
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  variant?: 'default' | 'danger' | 'success' | 'warning';
  disabled?: boolean;
}

export interface RowActionMenuProps {
  onEdit?: () => void;
  onViewDetails?: () => void;
  onDelete?: () => void;
  actions?: RowActionItem[];
  menuWidth?: number;
}

export function RowActionMenu({
  onEdit,
  onViewDetails,
  onDelete,
  actions,
  menuWidth,
}: RowActionMenuProps) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [menuPos, setMenuPos] = useState<{ top: number; left: number } | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const calculatePosition = () => {
    if (!buttonRef.current) return null;
    const rect = buttonRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const totalItems =
      (actions?.length || 0) +
      (onViewDetails ? 1 : 0) +
      (onEdit ? 1 : 0) +
      (onDelete ? 1 : 0);
    const menuHeight = totalItems * 36 + 12;
    const width = menuWidth || (actions && actions.length > 0 ? 160 : 136);

    let top = rect.bottom + 4;
    // If not enough room below, flip upwards
    if (spaceBelow < menuHeight && rect.top > menuHeight) {
      top = Math.max(10, rect.top - menuHeight - 4);
    }

    // Align right edge of menu with right edge of button
    let left = rect.right - width;
    if (left < 10) left = 10;
    if (typeof window !== 'undefined' && left + width > window.innerWidth - 10) {
      left = Math.max(10, window.innerWidth - width - 10);
    }

    return { top, left };
  };

  const toggleMenu = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (open) {
      setOpen(false);
      setMenuPos(null);
    } else {
      const pos = calculatePosition();
      if (pos) {
        setMenuPos(pos);
        setOpen(true);
      }
    }
  };

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
        setMenuPos(null);
      }
    }

    function handleScrollOrResize(e: Event) {
      // Don't close if scrolling inside the menu itself
      if (menuRef.current && menuRef.current.contains(e.target as Node)) {
        return;
      }
      if (open) {
        setOpen(false);
        setMenuPos(null);
      }
    }

    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
      window.addEventListener('scroll', handleScrollOrResize, true);
      window.addEventListener('resize', handleScrollOrResize);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('scroll', handleScrollOrResize, true);
      window.removeEventListener('resize', handleScrollOrResize);
    };
  }, [open]);

  const width = menuWidth || (actions && actions.length > 0 ? 160 : 136);

  const menuElement =
    open && menuPos && mounted && typeof document !== 'undefined'
      ? createPortal(
          <div
            ref={menuRef}
            style={{
              position: 'fixed',
              top: `${menuPos.top}px`,
              left: `${menuPos.left}px`,
              width: `${width}px`,
              zIndex: 99999,
            }}
            className="bg-white border border-neutral-200 rounded-lg shadow-2xl py-1 text-xs divide-y divide-neutral-100 ring-1 ring-black/5 animate-in fade-in zoom-in-95 duration-75 select-none"
            onClick={(e) => e.stopPropagation()}
          >
            {actions && actions.length > 0 && (
              <div className="py-0.5">
                {actions.map((act, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!act.disabled) {
                        act.onClick();
                        setOpen(false);
                      }
                    }}
                    disabled={act.disabled}
                    className={`w-full text-left px-3 py-1.5 flex items-center gap-2 transition-colors cursor-pointer text-xs ${
                      act.disabled
                        ? 'opacity-40 cursor-not-allowed text-neutral-400'
                        : act.variant === 'danger'
                        ? 'hover:bg-rose-50 text-rose-600'
                        : act.variant === 'warning'
                        ? 'hover:bg-amber-50 text-amber-700'
                        : act.variant === 'success'
                        ? 'hover:bg-emerald-50 text-emerald-700'
                        : 'hover:bg-neutral-50 text-neutral-800'
                    }`}
                  >
                    {act.icon}
                    <span className="font-medium">{act.label}</span>
                  </button>
                ))}
              </div>
            )}

            {(onViewDetails || onEdit) && (
              <div className="py-0.5">
                {onViewDetails && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onViewDetails();
                      setOpen(false);
                    }}
                    className="w-full text-left px-3 py-1.5 flex items-center gap-2 hover:bg-neutral-50 text-neutral-800 cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5 text-neutral-500" />
                    <span>View</span>
                  </button>
                )}

                {onEdit && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit();
                      setOpen(false);
                    }}
                    className="w-full text-left px-3 py-1.5 flex items-center gap-2 hover:bg-neutral-50 text-neutral-800 cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-neutral-500" />
                    <span>Edit</span>
                  </button>
                )}
              </div>
            )}

            {onDelete && (
              <div className="py-0.5">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm('Are you sure you want to delete this record?')) {
                      onDelete();
                    }
                    setOpen(false);
                  }}
                  className="w-full text-left px-3 py-1.5 flex items-center gap-2 hover:bg-rose-50 text-rose-600 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                  <span>Delete</span>
                </button>
              </div>
            )}
          </div>,
          document.body
        )
      : null;

  return (
    <div className="relative inline-block text-left" onClick={(e) => e.stopPropagation()}>
      <button
        ref={buttonRef}
        type="button"
        onClick={toggleMenu}
        className="text-neutral-500 hover:text-neutral-900 p-1.5 rounded-lg hover:bg-neutral-100 transition-colors cursor-pointer block"
        title="Actions"
      >
        <MoreVertical className="w-4 h-4" />
      </button>

      {menuElement}
    </div>
  );
}
