"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/muj-ucet", label: "Přehled", exact: true },
  { href: "/muj-ucet/profil", label: "Můj profil", exact: true },
  { href: "/muj-ucet/profil/setup", label: "Nastavit profil" },
  { href: "/muj-ucet/oblibene", label: "Oblíbené" },
  { href: "/muj-ucet/hlidaci-pes", label: "Hlídací pes" },
  { href: "/muj-ucet/dotazy", label: "Moje dotazy" },
  { href: "/muj-ucet/garaz", label: "Moje garáž" },
  { href: "/muj-ucet/poptavky", label: "Moje poptávky" },
];

export function AccountSidebarNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Menu účtu" className="lg:w-56 shrink-0">
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
  );
}
