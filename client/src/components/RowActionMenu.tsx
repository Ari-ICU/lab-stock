'use client';

import React, { useState, useRef, useEffect } from 'react';
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
  const [menuPos, setMenuPos] = useState<{ top: number; left: number } | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const toggleMenu = () => {
    if (open) {
      setOpen(false);
      setMenuPos(null);
    } else {
      if (buttonRef.current) {
        const rect = buttonRef.current.getBoundingClientRect();
        const spaceBelow = window.innerHeight - rect.bottom;
        const totalItems =
          (actions?.length || 0) +
          (onViewDetails ? 1 : 0) +
          (onEdit ? 1 : 0) +
          (onDelete ? 1 : 0);
        const menuHeight = totalItems * 36 + 12;
        const width = menuWidth || (actions && actions.length > 0 ? 160 : 128);

        let top = rect.bottom + 4;
        // If not enough room below, flip upwards
        if (spaceBelow < menuHeight && rect.top > menuHeight) {
          top = rect.top - menuHeight - 4;
        }

        // Align right edge of menu with right edge of button
        let left = rect.right - width;
        if (left < 10) left = 10;

        setMenuPos({ top, left });
      }
      setOpen(true);
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

    function handleScrollOrResize() {
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

  const width = menuWidth || (actions && actions.length > 0 ? 160 : 128);

  return (
    <div className="relative inline-block text-left">
      <button
        ref={buttonRef}
        onClick={toggleMenu}
        className="text-neutral-400 hover:text-neutral-900 p-1.5 rounded-lg hover:bg-neutral-100 transition-colors cursor-pointer"
        title="Actions"
      >
        <MoreVertical className="w-4 h-4" />
      </button>

      {open && menuPos && (
        <div
          ref={menuRef}
          style={{
            position: 'fixed',
            top: `${menuPos.top}px`,
            left: `${menuPos.left}px`,
            width: `${width}px`,
            zIndex: 9999,
          }}
          className="bg-white border border-neutral-200 rounded-lg shadow-xl py-1 text-xs divide-y divide-neutral-100"
        >
          {actions && actions.length > 0 && (
            <div className="py-0.5">
              {actions.map((act, idx) => (
                <button
                  key={idx}
                  onClick={() => {
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
                  onClick={() => {
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
                  onClick={() => {
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
                onClick={() => {
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
        </div>
      )}
    </div>
  );
}
