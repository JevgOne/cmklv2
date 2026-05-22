"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/moje-inzeraty", label: "Moje inzeráty", exact: true },
  { href: "/moje-inzeraty/poptavky", label: "Poptávky", exact: false, badge: true },
  { href: "/moje-inzeraty/statistiky", label: "Statistiky", exact: false },
  { href: "/inzerce/pridat", label: "Nový inzerát", exact: true },
];

export function InzeratyNav() {
  const pathname = usePathname();
  const [newCount, setNewCount] = useState(0);

  useEffect(() => {
    fetch("/api/dealer/inquiries?status=NEW&limit=1")
      .then((r) => r.ok ? r.json() : null)
      .then((d) => { if (d) setNewCount(d.total); })
      .catch(() => {});
  }, []);

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
                "px-4 py-2.5 rounded-lg text-sm font-medium no-underline whitespace-nowrap transition-colors flex items-center gap-2",
                isActive
                  ? "bg-orange-50 text-orange-600"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              )}
            >
              {item.label}
              {"badge" in item && item.badge && newCount > 0 && (
                <span className="px-1.5 py-0.5 text-xs rounded-full bg-red-100 text-red-700 font-semibold">
                  {newCount}
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
