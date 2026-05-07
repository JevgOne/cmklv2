"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/moje-inzeraty", label: "Moje inzeráty", exact: true },
  { href: "/inzerce/pridat", label: "Nový inzerát", exact: true },
];

export function InzeratyNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Menu inzeratu" className="lg:w-56 shrink-0">
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
