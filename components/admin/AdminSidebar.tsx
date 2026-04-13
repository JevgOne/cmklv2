"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { cn } from "@/lib/utils";
import Image from "next/image";

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
    title: "HLAVNÍ",
    items: [
      { id: "dashboard", href: "/admin/dashboard", icon: "📊", label: "Dashboard" },
      { id: "vehicles", href: "/admin/vehicles", icon: "🚗", label: "Vozidla" },
      { id: "inzerce", href: "/admin/inzerce", icon: "📋", label: "Inzerce" },
      { id: "brokers", href: "/admin/brokers", icon: "👥", label: "Makléři" },
      { id: "leads", href: "/admin/leads", icon: "📨", label: "Leady" },
      { id: "users", href: "/admin/users", icon: "👤", label: "Uživatelé" },
    ],
    roles: ["ADMIN", "BACKOFFICE", "MANAGER", "REGIONAL_DIRECTOR"],
  },
  {
    title: "MANAŽER",
    items: [
      { id: "manager-dashboard", href: "/admin/manager", icon: "📊", label: "Můj tým" },
      { id: "manager-brokers", href: "/admin/manager/brokers", icon: "👥", label: "Moji makléři" },
      { id: "manager-approvals", href: "/admin/manager/approvals", icon: "✅", label: "Schvalování" },
      { id: "manager-bonuses", href: "/admin/manager/bonuses", icon: "🎯", label: "Bonusy" },
    ],
    roles: ["MANAGER", "REGIONAL_DIRECTOR"],
  },
  {
    title: "PARTNEŘI",
    items: [
      { id: "partners", href: "/admin/partners", icon: "🏢", label: "Všichni partneři" },
      { id: "partners-bazar", href: "/admin/partners?type=AUTOBAZAR", icon: "🚗", label: "Autobazary" },
      { id: "partners-vrakov", href: "/admin/partners?type=VRAKOVISTE", icon: "🔧", label: "Vrakoviště" },
    ],
    roles: ["ADMIN", "BACKOFFICE", "MANAGER", "REGIONAL_DIRECTOR"],
  },
  {
    title: "ESHOP",
    items: [
      { id: "feeds", href: "/admin/feeds", icon: "📡", label: "Feed importy" },
      { id: "orders", href: "/admin/orders", icon: "📦", label: "Objednávky" },
      { id: "returns", href: "/admin/returns", icon: "🔄", label: "Reklamace" },
      { id: "suppliers", href: "/admin/suppliers", icon: "🏭", label: "Dodavatelé" },
    ],
    roles: ["ADMIN", "BACKOFFICE", "MANAGER"],
  },
  {
    title: "FINANCE",
    items: [
      { id: "payments", href: "/admin/payments", icon: "💳", label: "Platby" },
      { id: "payouts", href: "/admin/payouts", icon: "💰", label: "Výplaty" },
    ],
    roles: ["ADMIN", "BACKOFFICE", "MANAGER"],
  },
  {
    title: "MARKETPLACE",
    items: [
      { id: "marketplace", href: "/admin/marketplace", icon: "📈", label: "Marketplace" },
    ],
    roles: ["ADMIN", "BACKOFFICE", "MANAGER"],
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
  const roleLabels: Record<string, string> = {
    ADMIN: "Administrátor",
    BACKOFFICE: "BackOffice",
    MANAGER: "Manažer",
    REGIONAL_DIRECTOR: "Regionální ředitel",
  };
  const roleLabel = roleLabels[userRole || ""] || "Administrátor";

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
            <Image src="/brand/logo-white.png" alt="CarMakléř" width={120} height={40} className="h-10 w-auto object-contain" sizes="120px" priority />
            <span className="text-[10px] font-bold bg-orange-500 text-white px-2 py-0.5 rounded-full ml-2">
              {roleLabel.toUpperCase()}
            </span>
          </div>
        </div>

        {/* Navigation */}
        <nav aria-label="Administrace" className="flex-1 overflow-y-auto px-3 py-4">
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
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-sm text-white">{displayName}</div>
              <div className="text-xs text-gray-500">{roleLabel}</div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="mt-3 w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
              <path fillRule="evenodd" d="M3 4.25A2.25 2.25 0 0 1 5.25 2h5.5A2.25 2.25 0 0 1 13 4.25v2a.75.75 0 0 1-1.5 0v-2a.75.75 0 0 0-.75-.75h-5.5a.75.75 0 0 0-.75.75v11.5c0 .414.336.75.75.75h5.5a.75.75 0 0 0 .75-.75v-2a.75.75 0 0 1 1.5 0v2A2.25 2.25 0 0 1 10.75 18h-5.5A2.25 2.25 0 0 1 3 15.75V4.25Z" clipRule="evenodd" />
              <path fillRule="evenodd" d="M19 10a.75.75 0 0 0-.75-.75H8.704l1.048-.943a.75.75 0 1 0-1.004-1.114l-2.5 2.25a.75.75 0 0 0 0 1.114l2.5 2.25a.75.75 0 1 0 1.004-1.114l-1.048-.943h9.546A.75.75 0 0 0 19 10Z" clipRule="evenodd" />
            </svg>
            Odhlásit
          </button>
        </div>
      </aside>
    </>
  );
}
