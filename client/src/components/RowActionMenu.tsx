'use client';

import React, { useState, useRef, useEffect } from 'react';
import { MoreVertical, Trash2, Edit3, Eye } from 'lucide-react';

interface RowActionMenuProps {
  onEdit?: () => void;
  onViewDetails?: () => void;
  onDelete?: () => void;
}

export function RowActionMenu({
  onEdit,
  onViewDetails,
  onDelete,
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
        const menuHeight = 115; // approximate height of 3 items
        const menuWidth = 128; // w-32 = 128px

        let top = rect.bottom + 4;
        // If not enough room below, flip upwards
        if (spaceBelow < menuHeight && rect.top > menuHeight) {
          top = rect.top - menuHeight - 4;
        }

        // Align right edge of menu with right edge of button
        let left = rect.right - menuWidth;
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

  return (
    <div className="relative inline-block text-left">
      <button
        ref={buttonRef}
        onClick={toggleMenu}
        className="text-neutral-400 hover:text-neutral-900 p-1 rounded hover:bg-neutral-100 transition-colors cursor-pointer"
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
            zIndex: 9999,
          }}
          className="w-32 bg-white border border-neutral-200 rounded shadow-2xl py-1 text-xs"
        >
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

          {onDelete && (
            <button
              onClick={() => {
                if (confirm('Are you sure you want to delete this record?')) {
                  onDelete();
                }
                setOpen(false);
              }}
              className="w-full text-left px-3 py-1.5 flex items-center gap-2 hover:bg-rose-50 text-rose-600 border-t border-neutral-100 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-500" />
              <span>Delete</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
