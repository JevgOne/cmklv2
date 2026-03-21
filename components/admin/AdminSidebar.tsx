"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const navSections = [
  {
    title: "HLAVNÍ",
    items: [
      { href: "/admin/dashboard", icon: "📊", label: "Dashboard" },
      { href: "/admin/vehicles", icon: "🚗", label: "Vozidla", badge: "23" },
      { href: "/admin/brokers", icon: "👥", label: "Makléři" },
      { href: "/admin/dashboard", icon: "✅", label: "Schvalování", badge: "5" },
    ],
  },
  {
    title: "SPRÁVA",
    items: [
      { href: "/admin/dashboard", icon: "📍", label: "Regiony" },
      { href: "/admin/dashboard", icon: "💰", label: "Provize" },
      { href: "/admin/dashboard", icon: "🔧", label: "Uživatelé" },
    ],
  },
  {
    title: "SYSTÉM",
    items: [
      { href: "/admin/dashboard", icon: "⚙️", label: "Nastavení" },
      { href: "/admin/dashboard", icon: "📋", label: "Logy" },
    ],
  },
];

interface AdminSidebarProps {
  open: boolean;
  onClose: () => void;
}

export function AdminSidebar({ open, onClose }: AdminSidebarProps) {
  const pathname = usePathname();

  return (
    <>
      {/* Backdrop overlay for mobile */}
      {open && (
        <div
          className="fixed inset-0 bg-black/50 z-[99] lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 h-full w-[280px] bg-gray-950 text-white z-[100] flex flex-col transition-transform duration-300",
          "max-lg:-translate-x-full",
          open && "max-lg:translate-x-0"
        )}
      >
        {/* Header */}
        <div className="p-6 border-b border-white/[0.08]">
          <div className="flex items-center gap-3">
            <img src="/brand/logo-color.png" alt="CarMakléř" className="h-10 brightness-0 invert" />
            <span className="text-[10px] font-bold bg-orange-500 text-white px-2 py-0.5 rounded-full ml-2">ADMIN</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          {navSections.map((section) => (
            <div key={section.title} className="mb-2">
              <div className="text-[11px] font-bold text-gray-500 uppercase tracking-widest px-3 py-2">
                {section.title}
              </div>
              {section.items.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onClose}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 rounded-lg text-gray-400 text-sm font-medium mb-1 transition-all no-underline",
                      "hover:bg-white/5 hover:text-white",
                      isActive && "bg-orange-500/15 text-orange-500"
                    )}
                  >
                    <span className="text-base">{item.icon}</span>
                    <span>{item.label}</span>
                    {item.badge && (
                      <span className="ml-auto bg-error-500 text-white text-[11px] font-bold px-2 py-0.5 rounded-full">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-white/[0.08]">
          <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
            <div
              className="w-[40px] h-[40px] rounded-lg flex items-center justify-center"
              style={{ background: "var(--gradient-orange)" }}
            >
              <span className="font-bold text-white text-sm">AD</span>
            </div>
            <div>
              <div className="font-semibold text-sm text-white">Admin</div>
              <div className="text-xs text-gray-500">Administrátor</div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
