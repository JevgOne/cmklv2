import { urls } from "@/lib/urls";

export type PlatformKey = "main" | "inzerce" | "shop" | "marketplace";

interface Platform {
  key: PlatformKey;
  label: string;
  mobileLabel: string;
  href: string;
}

const PLATFORMS: Platform[] = [
  {
    key: "main",
    label: "CarMakléř",
    mobileLabel: "Hlavní web",
    href: urls.main("/"),
  },
  {
    key: "inzerce",
    label: "Inzerce",
    mobileLabel: "Inzerce vozidel",
    href: urls.inzerce("/"),
  },
  {
    key: "shop",
    label: "Shop",
    mobileLabel: "Shop — autodíly",
    href: urls.shop("/"),
  },
  {
    key: "marketplace",
    label: "Marketplace",
    mobileLabel: "Marketplace",
    href: urls.marketplace("/"),
  },
];

export interface PlatformSwitcherProps {
  /** Aktuální platforma — zvýrazní se (nebo skryje pokud hideCurrent) */
  current: PlatformKey;
  /** Layout varianta: navbar desktop | navbar mobile | footer */
  variant?: "navbar" | "navbar-mobile" | "footer";
  /** Vyfiltruje current platformu ze seznamu */
  hideCurrent?: boolean;
  /** Footer variant má 2 theme: light (gray-500 → white) nebo dark (gray-500 → white), default light */
  theme?: "light" | "dark";
  /** Extra className */
  className?: string;
  /** Volitelný onClick handler (např. pro zavření mobile menu) */
  onLinkClick?: () => void;
}

export function PlatformSwitcher({
  current,
  variant = "navbar",
  hideCurrent = false,
  theme = "light",
  className = "",
  onLinkClick,
}: PlatformSwitcherProps) {
  const items = hideCurrent
    ? PLATFORMS.filter((p) => p.key !== current)
    : PLATFORMS;

  if (variant === "navbar") {
    return (
      <div className={`flex items-center gap-1 ${className}`}>
        {items.map((p) => {
          const isCurrent = p.key === current;
          return (
            <a
              key={p.key}
              href={p.href}
              aria-current={isCurrent ? "page" : undefined}
              className={`text-sm font-medium transition-colors no-underline px-4 py-2 rounded-lg ${
                isCurrent
                  ? "text-orange-600 bg-orange-50"
                  : theme === "dark"
                    ? "text-gray-400 hover:text-white hover:bg-gray-800"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              }`}
            >
              {p.label}
            </a>
          );
        })}
      </div>
    );
  }

  if (variant === "navbar-mobile") {
    return (
      <div className={className}>
        <p
          className={`text-xs font-bold uppercase tracking-wide mt-6 mb-2 px-1 ${
            theme === "dark" ? "text-gray-500" : "text-gray-400"
          }`}
        >
          Ostatní platformy
        </p>
        {items.map((p) => {
          const isCurrent = p.key === current;
          return (
            <a
              key={p.key}
              href={p.href}
              aria-current={isCurrent ? "page" : undefined}
              onClick={onLinkClick}
              className={`block text-base font-semibold py-4 no-underline border-b min-h-[44px] ${
                theme === "dark"
                  ? "border-gray-800 text-gray-300 hover:text-orange-400"
                  : "border-gray-100 text-gray-900 hover:text-orange-500"
              } ${isCurrent ? "text-orange-500" : ""}`}
            >
              {p.mobileLabel}
            </a>
          );
        })}
      </div>
    );
  }

  // variant === "footer" — horizontal badge strip
  return (
    <div className={`flex flex-wrap items-center justify-center gap-3 ${className}`}>
      {items.map((p) => {
        const isCurrent = p.key === current;
        return (
          <a
            key={p.key}
            href={p.href}
            aria-current={isCurrent ? "page" : undefined}
            className={`inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all duration-200 no-underline ${
              isCurrent
                ? "bg-orange-500/15 text-orange-400 border border-orange-500/30"
                : "bg-gray-800/50 text-gray-400 hover:text-white hover:bg-gray-800"
            }`}
          >
            {p.label}
          </a>
        );
      })}
    </div>
  );
}
