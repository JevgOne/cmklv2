import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(price: number): string {
  return new Intl.NumberFormat("cs-CZ", {
    style: "currency",
    currency: "CZK",
    maximumFractionDigits: 0,
  }).format(price);
}

export function formatMileage(km: number): string {
  return new Intl.NumberFormat("cs-CZ").format(km) + " km";
}

/**
 * Formátuje ISO timestamp jako relativní čas v češtině ("před 5 min",
 * "před 3 h", "před 2 d"). Starší než 30 dní → absolutní datum.
 */
export function formatRelativeCz(input: string | Date | null): string {
  if (!input) return "nikdy";
  const date = input instanceof Date ? input : new Date(input);
  const diffMs = Date.now() - date.getTime();
  const diffMin = Math.round(diffMs / 60_000);
  if (diffMin < 1) return "právě teď";
  if (diffMin < 60) return `před ${diffMin} min`;
  const diffH = Math.round(diffMin / 60);
  if (diffH < 24) return `před ${diffH} h`;
  const diffD = Math.round(diffH / 24);
  if (diffD < 30) return `před ${diffD} d`;
  return new Intl.DateTimeFormat("cs-CZ", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

/**
 * Dvoupísmenné iniciály z křestního a příjmení. Používáme na avatary
 * (fallback, když chybí foto).
 */
export function getInitials(
  firstName: string | null | undefined,
  lastName: string | null | undefined
): string {
  return (firstName?.[0] ?? "") + (lastName?.[0] ?? "");
}

/**
 * Parsuje JSON string pole měst z User.cities. Bezpečně vrací [] při chybě —
 * pole je historicky JSON string, ne nativní pole.
 */
export function parseCities(raw: string | null | undefined): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as string[]) : [];
  } catch {
    return [];
  }
}

export function slugify(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/**
 * Generuje 12-znakové alfanumerické heslo bez ambiguózních znaků (0/O/l/I).
 */
export function generatePassword(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  let password = "";
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}
