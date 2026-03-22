"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { cn } from "@/lib/utils";

interface NavItem {
  id: string;
  href: string;
  icon: string;
  label: string;
  badge?: string;
}

interface NavSection {
  title: string;
  items: NavItem[];
  roles?: string[];
}

const navSections: NavSection[] = [
  {
    title: "HLAVNI",
    items: [
      { id: "dashboard", href: "/admin/dashboard", icon: "📊", label: "Dashboard" },
      { id: "vehicles", href: "/admin/vehicles", icon: "🚗", label: "Vozidla", badge: "23" },
      { id: "brokers", href: "/admin/brokers", icon: "👥", label: "Makleri" },
      { id: "approvals", href: "/admin/approvals", icon: "✅", label: "Schvalovani", badge: "5" },
      { id: "leads", href: "/admin/leads", icon: "📨", label: "Leady" },
    ],
    roles: ["ADMIN", "BACKOFFICE"],
  },
  {
    title: "MANAZER",
    items: [
      { id: "manager-dashboard", href: "/admin/manager", icon: "📊", label: "Dashboard" },
      { id: "manager-brokers", href: "/admin/manager/brokers", icon: "👥", label: "Moji makleri" },
      { id: "manager-approvals", href: "/admin/manager/approvals", icon: "✅", label: "Schvalovani" },
      { id: "manager-leads", href: "/admin/leads", icon: "📨", label: "Leady" },
      { id: "manager-bonuses", href: "/admin/manager/bonuses", icon: "🎯", label: "Bonusy" },
    ],
    roles: ["MANAGER"],
  },
  {
    title: "MARKETPLACE",
    items: [
      { id: "marketplace", href: "/admin/marketplace", icon: "📈", label: "Marketplace" },
    ],
    roles: ["ADMIN", "BACKOFFICE"],
  },
  {
    title: "SPRAVA",
    items: [
      { id: "regions", href: "/admin/regions", icon: "📍", label: "Regiony" },
      { id: "commissions", href: "/admin/commissions", icon: "💰", label: "Provize" },
      { id: "users", href: "/admin/users", icon: "🔧", label: "Uzivatele" },
    ],
    roles: ["ADMIN", "BACKOFFICE"],
  },
  {
    title: "SYSTEM",
    items: [
      { id: "settings", href: "/admin/settings", icon: "⚙️", label: "Nastaveni" },
      { id: "logs", href: "/admin/logs", icon: "📋", label: "Logy" },
    ],
    roles: ["ADMIN", "BACKOFFICE"],
  },
];

interface AdminSidebarProps {
  open: boolean;
  onClose: () => void;
}

export function AdminSidebar({ open, onClose }: AdminSidebarProps) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const userRole = session?.user?.role;

  const visibleSections = navSections.filter(
    (section) => !section.roles || (userRole && section.roles.includes(userRole))
  );

  const initials = session?.user
    ? `${(session.user.firstName || "")[0] || ""}${(session.user.lastName || "")[0] || ""}`
    : "AD";
  const displayName = session?.user
    ? `${session.user.firstName || ""} ${session.user.lastName || ""}`.trim()
    : "Admin";
  const roleLabel = userRole === "MANAGER" ? "Manazer" : "Administrator";

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
            <img src="/brand/logo-color.png" alt="CarMakler" className="h-10 brightness-0 invert" />
            <span className="text-[10px] font-bold bg-orange-500 text-white px-2 py-0.5 rounded-full ml-2">
              {userRole === "MANAGER" ? "MANAZER" : "ADMIN"}
            </span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          {visibleSections.map((section) => (
            <div key={section.title} className="mb-2">
              <div className="text-[11px] font-bold text-gray-500 uppercase tracking-widest px-3 py-2">
                {section.title}
              </div>
              {section.items.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                return (
                  <Link
                    key={item.id}
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
              <span className="font-bold text-white text-sm">{initials}</span>
            </div>
            <div>
              <div className="font-semibold text-sm text-white">{displayName}</div>
              <div className="text-xs text-gray-500">{roleLabel}</div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
