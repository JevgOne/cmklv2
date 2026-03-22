"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { cn } from "@/lib/utils";

interface NavItem {
  href: string;
  icon: string;
  label: string;
}

const bazarNav: NavItem[] = [
  { href: "/partner/dashboard", icon: "📊", label: "Dashboard" },
  { href: "/partner/vehicles", icon: "🚗", label: "Vozidla" },
  { href: "/partner/leads", icon: "👥", label: "Zajemci" },
  { href: "/partner/stats", icon: "📈", label: "Statistiky" },
  { href: "/partner/profile", icon: "🏢", label: "Profil" },
];

const vrakovisteNav: NavItem[] = [
  { href: "/partner/dashboard", icon: "📊", label: "Dashboard" },
  { href: "/partner/parts", icon: "🔧", label: "Dily" },
  { href: "/partner/orders", icon: "📦", label: "Objednavky" },
  { href: "/partner/billing", icon: "💰", label: "Vyuctovani" },
  { href: "/partner/profile", icon: "🏢", label: "Profil" },
];

export function PartnerLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const { data: session } = useSession();

  const isVrakoviste = session?.user?.role === "PARTNER_VRAKOVISTE";
  const navItems = isVrakoviste ? vrakovisteNav : bazarNav;

  const companyName = session?.user
    ? `${session.user.firstName || ""} ${session.user.lastName || ""}`.trim()
    : "Partner";

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-[99] lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 h-full w-[260px] bg-white border-r border-gray-200 z-[100] flex flex-col transition-transform duration-300",
          "max-lg:-translate-x-full",
          sidebarOpen && "max-lg:translate-x-0"
        )}
      >
        {/* Logo */}
        <div className="p-5 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <img
              src="/brand/logo-color.png"
              alt="CarMakler"
              className="h-8"
            />
            <span className="text-[10px] font-bold bg-orange-500 text-white px-2 py-0.5 rounded-full">
              PARTNER
            </span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-lg text-gray-600 text-sm font-medium mb-1 transition-all no-underline",
                  "hover:bg-gray-100 hover:text-gray-900",
                  isActive && "bg-orange-50 text-orange-600 font-semibold"
                )}
              >
                <span className="text-base">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100">
          <div className="text-sm font-semibold text-gray-900 mb-1">
            {companyName}
          </div>
          <div className="text-xs text-gray-500 mb-3">
            {isVrakoviste ? "Vrakoviste" : "Autobazar"}
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="text-xs text-gray-400 hover:text-gray-600 cursor-pointer bg-transparent border-none"
          >
            Odhlasit se
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:ml-[260px]">
        {/* Mobile header */}
        <header className="lg:hidden sticky top-0 bg-white border-b border-gray-200 px-4 py-3 z-50">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setSidebarOpen(true)}
              className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-gray-100 cursor-pointer bg-transparent border-none text-xl"
            >
              ☰
            </button>
            <img
              src="/brand/logo-color.png"
              alt="CarMakler"
              className="h-7"
            />
            <div className="w-10" />
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 sm:p-6 lg:p-8 max-w-7xl">{children}</main>
      </div>
    </div>
  );
}
