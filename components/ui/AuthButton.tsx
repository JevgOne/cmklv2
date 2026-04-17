"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { getRedirectByRole } from "@/lib/auth-redirect";

/** Generates 1-2 letter initials from first/last name or full name. */
function getInitials(firstName?: string, lastName?: string, name?: string): string {
  if (firstName) {
    return (firstName[0] + (lastName?.[0] ?? "")).toUpperCase();
  }
  if (name) {
    const parts = name.trim().split(/\s+/);
    return (parts[0]?.[0] ?? "").toUpperCase() + (parts[1]?.[0] ?? "").toUpperCase();
  }
  return "?";
}

/**
 * Auth-aware button for the main navbar.
 * - Unauthenticated: shows "Prihlasit se" link
 * - Authenticated: shows avatar circle + dropdown with dashboard link and sign-out
 */
export function AuthButton() {
  const { data: session, status } = useSession();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  // Loading state — render nothing to avoid layout shift
  if (status === "loading") {
    return <div className="w-9 h-9 rounded-full bg-gray-100 animate-pulse" />;
  }

  // Not authenticated
  if (!session?.user) {
    return (
      <Link
        href="/login"
        className="inline-flex items-center justify-center gap-2 font-semibold rounded-full border-none cursor-pointer transition-all duration-200 whitespace-nowrap py-2 px-4 text-[13px] bg-white text-gray-800 shadow-[inset_0_0_0_2px_var(--gray-200)] hover:bg-gray-50 hover:shadow-[inset_0_0_0_2px_var(--gray-300)] no-underline"
      >
        Přihlásit se
      </Link>
    );
  }

  // Authenticated
  const { firstName, lastName, name, avatar, role } = session.user;
  const initials = getInitials(firstName, lastName, name);
  const dashboardUrl = getRedirectByRole(role);
  const displayName = firstName
    ? `${firstName}${lastName ? ` ${lastName}` : ""}`
    : name || "Uživatel";

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-full bg-transparent border-none cursor-pointer p-0.5 hover:bg-gray-50 transition-colors"
        aria-expanded={open}
        aria-haspopup="true"
      >
        {avatar ? (
          <img
            src={avatar}
            alt={displayName}
            className="w-9 h-9 rounded-full object-cover"
          />
        ) : (
          <div className="w-9 h-9 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center text-sm font-semibold select-none">
            {initials}
          </div>
        )}
      </button>

      {open && (
        <div className="absolute top-full right-0 mt-2 z-50">
          <div className="bg-white rounded-xl shadow-xl border border-gray-200 py-2 min-w-[200px]">
            {/* User info */}
            <div className="px-4 py-2 border-b border-gray-100">
              <p className="text-sm font-semibold text-gray-900 truncate">{displayName}</p>
              <p className="text-xs text-gray-500 truncate">{session.user.email}</p>
            </div>

            {/* Dashboard link */}
            <Link
              href={dashboardUrl}
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-orange-600 transition-colors no-underline"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z" />
              </svg>
              Můj dashboard
            </Link>

            {/* Sign out */}
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                signOut({ callbackUrl: "/" });
              }}
              className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-red-600 transition-colors bg-transparent border-none cursor-pointer text-left"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9" />
              </svg>
              Odhlásit se
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Simplified auth UI for mobile menu.
 * Shows login link or user info + dashboard link + sign-out button.
 */
export function MobileAuthSection({ onNavigate }: { onNavigate?: () => void }) {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return <div className="h-11 bg-gray-100 animate-pulse rounded-lg" />;
  }

  if (!session?.user) {
    return (
      <Link
        href="/login"
        onClick={onNavigate}
        className="flex items-center justify-center gap-2 w-full py-3 rounded-lg border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors no-underline min-h-[44px]"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
        </svg>
        Přihlásit se
      </Link>
    );
  }

  const { firstName, lastName, name, avatar, role } = session.user;
  const initials = getInitials(firstName, lastName, name);
  const dashboardUrl = getRedirectByRole(role);
  const displayName = firstName
    ? `${firstName}${lastName ? ` ${lastName}` : ""}`
    : name || "Uživatel";

  return (
    <div className="space-y-3">
      {/* User info row */}
      <div className="flex items-center gap-3 px-1">
        {avatar ? (
          <img src={avatar} alt={displayName} className="w-10 h-10 rounded-full object-cover" />
        ) : (
          <div className="w-10 h-10 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center text-sm font-semibold select-none">
            {initials}
          </div>
        )}
        <div className="min-w-0">
          <p className="text-sm font-semibold text-gray-900 truncate">{displayName}</p>
          <p className="text-xs text-gray-500 truncate">{session.user.email}</p>
        </div>
      </div>

      {/* Dashboard */}
      <Link
        href={dashboardUrl}
        onClick={onNavigate}
        className="flex items-center justify-center gap-2 w-full py-3 rounded-lg bg-orange-500 text-white text-sm font-semibold hover:bg-orange-600 transition-colors no-underline min-h-[44px]"
      >
        Muj dashboard
      </Link>

      {/* Sign out */}
      <button
        type="button"
        onClick={() => {
          onNavigate?.();
          signOut({ callbackUrl: "/" });
        }}
        className="flex items-center justify-center gap-2 w-full py-3 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors bg-transparent cursor-pointer min-h-[44px]"
      >
        Odhlasit se
      </button>
    </div>
  );
}
