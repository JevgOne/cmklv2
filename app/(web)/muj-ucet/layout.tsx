"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/muj-ucet", label: "Přehled", exact: true },
  { href: "/muj-ucet/oblibene", label: "Oblíbené" },
  { href: "/muj-ucet/hlidaci-pes", label: "Hlídací pes" },
  { href: "/muj-ucet/dotazy", label: "Moje dotazy" },
];

export default function MujUcetLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <main className="min-h-screen bg-gray-50">
      <section className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900">
            Můj účet
          </h1>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar nav */}
          <nav aria-label="Menu uctu" className="lg:w-56 shrink-0">
            <div className="flex lg:flex-col gap-2 overflow-x-auto">
              {navItems.map((item) => {
                const isActive = item.exact
                  ? pathname === item.href
                  : pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "px-4 py-2.5 rounded-lg text-sm font-medium no-underline whitespace-nowrap transition-colors",
                      isActive
                        ? "bg-orange-50 text-orange-600"
                        : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                    )}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </nav>

          {/* Content */}
          <div className="flex-1 min-w-0">{children}</div>
        </div>
      </div>
    </main>
  );
}
