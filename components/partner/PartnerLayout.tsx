"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { cn } from "@/lib/utils";
import { PartnerBottomNav } from "@/components/partner/PartnerBottomNav";
import { SearchOverlay } from "@/components/ui/SearchOverlay";

interface NavItem {
  href: string;
  icon: string;
  label: string;
}

const bazarNav: NavItem[] = [
  { href: "/partner/dashboard", icon: "📊", label: "Dashboard" },
  { href: "/partner/vehicles", icon: "🚗", label: "Vozidla" },
  { href: "/partner/leads", icon: "👥", label: "Zájemci" },
  { href: "/partner/stats", icon: "📈", label: "Statistiky" },
  { href: "/partner/messages", icon: "💬", label: "Zprávy" },
  { href: "/partner/documents", icon: "📄", label: "Dokumenty" },
  { href: "/partner/profile", icon: "🏢", label: "Profil" },
];

const vrakovisteNav: NavItem[] = [
  { href: "/partner/dashboard", icon: "📊", label: "Dashboard" },
  { href: "/partner/parts", icon: "🔧", label: "Díly" },
  { href: "/partner/orders", icon: "📦", label: "Objednávky" },
  { href: "/partner/billing", icon: "💰", label: "Vyúčtování" },
  { href: "/partner/messages", icon: "💬", label: "Zprávy" },
  { href: "/partner/documents", icon: "📄", label: "Dokumenty" },
  { href: "/partner/profile", icon: "🏢", label: "Profil" },
];

export function PartnerLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const { data: session } = useSession();

  const isVrakoviste = session?.user?.role === "PARTNER_VRAKOVISTE";
  const navItems = isVrakoviste ? vrakovisteNav : bazarNav;
  const [searchOpen, setSearchOpen] = useState(false);

  const handleSearch = useCallback(async (q: string) => {
    const res = await fetch(`/api/partner/search?q=${encodeURIComponent(q)}`);
    if (!res.ok) return [];
    const data = await res.json();

    if (isVrakoviste) {
      return [
        { key: "parts", label: "Dily", icon: "🔧", results: (data.parts || []).map((p: { id: string; name: string; category: string; price: number; slug: string }) => ({
          id: p.id, title: p.name, subtitle: `${p.category} · ${p.price?.toLocaleString("cs-CZ")} Kc`, href: `/partner/parts/${p.id}`,
        }))},
        { key: "orders", label: "Objednavky", icon: "📦", results: (data.orders || []).map((o: { id: string; orderNumber: string; status: string; totalPrice: number }) => ({
          id: o.id, title: `#${o.orderNumber}`, subtitle: o.status, href: `/partner/orders/${o.id}`,
        }))},
      ];
    } else {
      return [
        { key: "vehicles", label: "Vozidla", icon: "🚗", results: (data.vehicles || []).map((v: { id: string; brand: string; model: string; year: number; price: number }) => ({
          id: v.id, title: `${v.brand} ${v.model} (${v.year})`, subtitle: `${v.price?.toLocaleString("cs-CZ")} Kc`, href: `/partner/vehicles/${v.id}`,
        }))},
        { key: "leads", label: "Zajemci", icon: "👥", results: (data.leads || []).map((l: { id: string; name: string; phone: string }) => ({
          id: l.id, title: l.name, subtitle: l.phone, href: `/partner/leads`,
        }))},
      ];
    }
  }, [isVrakoviste]);

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
              src="/brand/logo-symbol-dark.png"
              alt=""
              className="h-9"
            />
            <span className="text-xl font-extrabold tracking-tight">
              <span className="text-orange-500">Car</span>
              <span className="text-gray-900">Makléř</span>
            </span>
            <span className="text-[10px] font-bold bg-orange-500 text-white px-2 py-0.5 rounded-full">
              PARTNER
            </span>
          </div>
        </div>

        {/* Navigation */}
        <nav aria-label="Partner menu" className="flex-1 overflow-y-auto px-3 py-4">
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
            {isVrakoviste ? "Vrakoviště" : "Autobazar"}
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="text-xs text-gray-400 hover:text-gray-600 cursor-pointer bg-transparent border-none"
          >
            Odhlásit se
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:ml-[260px]">
        {/* Mobile top bar */}
        <header className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="w-8" />
            <div className="flex items-center gap-2">
              <img
                src="/brand/logo-symbol-dark.png"
                alt=""
                className="h-7"
              />
              <span className="text-lg font-extrabold tracking-tight">
                <span className="text-orange-500">Car</span>
                <span className="text-gray-900">Makléř</span>
              </span>
              <span className="text-[10px] font-bold bg-orange-500 text-white px-2 py-0.5 rounded-full">
                PARTNER
              </span>
            </div>
            <button onClick={() => setSearchOpen(true)} className="p-1 text-gray-600 bg-transparent border-none cursor-pointer" aria-label="Hledat">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 sm:p-6 lg:p-8 max-w-7xl pt-[calc(56px+16px)] lg:pt-4 pb-24 lg:pb-8">{children}</main>
      </div>

      {/* Mobile bottom nav */}
      <div className="lg:hidden">
        <PartnerBottomNav />
      </div>

      <SearchOverlay
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
        onSearch={handleSearch}
        placeholder={isVrakoviste ? "Hledat dily, objednavky..." : "Hledat vozidla, zajemce..."}
      />
    </div>
  );
}
