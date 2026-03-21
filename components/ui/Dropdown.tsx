"use client";

import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

export interface DropdownItem {
  label: string;
  icon?: React.ReactNode;
  onClick?: () => void;
  danger?: boolean;
}

export interface DropdownProps {
  trigger: React.ReactNode;
  items: DropdownItem[];
  dividerAfter?: number[];
  className?: string;
}

export function Dropdown({ trigger, items, dividerAfter = [], className }: DropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={ref} className={cn("relative inline-block", className)}>
      <div onClick={() => setOpen(!open)}>{trigger}</div>
      {open && (
        <div className="absolute top-[calc(100%+8px)] right-0 min-w-[200px] bg-white rounded-lg shadow-xl border border-gray-200 p-2 z-[100]">
          {items.map((item, i) => (
            <div key={i}>
              <button
                onClick={() => {
                  item.onClick?.();
                  setOpen(false);
                }}
                className={cn(
                  "w-full flex items-center gap-2.5 px-3 py-2.5 rounded-[10px] text-sm font-medium text-gray-700 cursor-pointer transition-all duration-200 hover:bg-gray-100 hover:text-gray-900 text-left border-none bg-transparent",
                  item.danger && "text-error-500 hover:bg-error-50 hover:text-error-500"
                )}
              >
                {item.icon && <span>{item.icon}</span>}
                {item.label}
              </button>
              {dividerAfter.includes(i) && <div className="h-px bg-gray-200 my-2" />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
