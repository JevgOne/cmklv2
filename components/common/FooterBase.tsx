/**
 * FooterBase — sdílená kostra footeru pro všechny 4 platformy
 * (main, shop, inzerce, marketplace).
 *
 * Per-platform wrappery (components/{platform}/Footer.tsx) volají tuto
 * komponentu s vlastním `tagline` + `productColumn` + (shop) `trustBar`.
 *
 * Struktura:
 *  - 4-col grid: O nás + social | Produkt | Podpora | Firma
 *  - Platformy sekce (PlatformSwitcher variant="footer")
 *  - Volitelný trust bar (shop platby + dopravci)
 *  - Bottom bar: © + IČO/DIČ (pokud nejsou placeholder) + legal nav
 */

import Link from "next/link";
import Image from "next/image";
import { urls } from "@/lib/urls";
import { companyInfo, isPlaceholder } from "@/lib/company-info";
import { PlatformSwitcher, type PlatformKey } from "@/components/ui/PlatformSwitcher";
import { FacebookIcon, InstagramIcon, YoutubeIcon } from "./FooterIcons";

export interface FooterProductLink {
  href: string;
  label: string;
  /** true = použít `<a>` místo `<Link>` (pro externí URL nebo cross-subdomain) */
  external?: boolean;
}

export interface FooterBaseProps {
  platformKey: PlatformKey;
  tagline: string;
  productColumn: {
    title: string;
    links: FooterProductLink[];
  };
  /** Volitelný trust bar (pouze shop — platby + dopravci) */
  trustBar?: React.ReactNode;
}

const PLATFORM_BADGE_LABEL: Record<PlatformKey, string | null> = {
  main: null,
  shop: "Shop",
  inzerce: "Inzerce",
  marketplace: "Marketplace",
};

export function FooterBase({
  platformKey,
  tagline,
  productColumn,
  trustBar,
}: FooterBaseProps) {
  const currentYear = new Date().getFullYear();
  const badgeLabel = PLATFORM_BADGE_LABEL[platformKey];

  return (
    <footer className="bg-gray-950 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        {/* === 4-SLOUPCOVÝ GRID === */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-10">
          {/* Sloupec 1 — O nás + social */}
          <div>
            <Link href="/" className="flex items-center gap-2 no-underline mb-4">
              <Image
                src="/brand/logo-white.png"
                alt="CarMakléř"
                width={120}
                height={40}
                className="h-10 w-auto object-contain"
              />
              {badgeLabel && (
                <span className="text-sm font-semibold text-orange-400">
                  {badgeLabel}
                </span>
              )}
            </Link>
            <p className="text-sm text-gray-500 leading-relaxed mb-6">
              {tagline}
            </p>

            {/* Social */}
            <div className="flex items-center gap-3">
              {companyInfo.social.facebook && (
                <a
                  href={companyInfo.social.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Facebook"
                  className="text-gray-500 hover:text-orange-400 transition-colors"
                >
                  <FacebookIcon className="w-5 h-5" />
                </a>
              )}
              {companyInfo.social.instagram && (
                <a
                  href={companyInfo.social.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Instagram"
                  className="text-gray-500 hover:text-orange-400 transition-colors"
                >
                  <InstagramIcon className="w-5 h-5" />
                </a>
              )}
              {companyInfo.social.youtube && (
                <a
                  href={companyInfo.social.youtube}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="YouTube"
                  className="text-gray-500 hover:text-orange-400 transition-colors"
                >
                  <YoutubeIcon className="w-5 h-5" />
                </a>
              )}
            </div>
          </div>

          {/* Sloupec 2 — Produkt (per-platform) */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wide text-gray-400 mb-4">
              {productColumn.title}
            </h3>
            <ul className="list-none p-0 m-0 flex flex-col gap-3">
              {productColumn.links.map((link, i) => (
                <li key={`${productColumn.title}-${i}`}>
                  {link.external ? (
                    <a
                      href={link.href}
                      className="text-sm text-gray-500 hover:text-white transition-colors no-underline"
                    >
                      {link.label}
                    </a>
                  ) : (
                    <Link
                      href={link.href}
                      className="text-sm text-gray-500 hover:text-white transition-colors no-underline"
                    >
                      {link.label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* Sloupec 3 — Podpora (shared) */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wide text-gray-400 mb-4">
              Podpora
            </h3>
            <ul className="list-none p-0 m-0 flex flex-col gap-3 text-sm text-gray-500">
              {!isPlaceholder(companyInfo.contact.phone) && (
                <li>
                  <a
                    href={companyInfo.contact.phoneHref}
                    className="hover:text-white transition-colors no-underline"
                  >
                    {companyInfo.contact.phone}
                  </a>
                </li>
              )}
              <li>
                <a
                  href={companyInfo.contact.emailHref}
                  className="hover:text-white transition-colors no-underline"
                >
                  {companyInfo.contact.email}
                </a>
              </li>
              <li className="text-gray-600">{companyInfo.hours}</li>
              <li>
                <a
                  href={urls.main("/jak-to-funguje")}
                  className="hover:text-white transition-colors no-underline"
                >
                  FAQ
                </a>
              </li>
              <li>
                <a
                  href={urls.main("/kontakt")}
                  className="hover:text-white transition-colors no-underline"
                >
                  Kontaktní formulář
                </a>
              </li>
              <li>
                <a
                  href={urls.main("/reklamacni-rad")}
                  className="hover:text-white transition-colors no-underline"
                >
                  Reklamační řád
                </a>
              </li>
            </ul>
          </div>

          {/* Sloupec 4 — Firma (shared) */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wide text-gray-400 mb-4">
              Firma
            </h3>
            <ul className="list-none p-0 m-0 flex flex-col gap-3 text-sm text-gray-500">
              <li className="text-gray-400 font-semibold">
                {companyInfo.legalName}
              </li>
              {!isPlaceholder(companyInfo.ico) && <li>IČO: {companyInfo.ico}</li>}
              {!isPlaceholder(companyInfo.dic) && <li>DIČ: {companyInfo.dic}</li>}
              {!isPlaceholder(companyInfo.address.full) && (
                <li className="leading-relaxed">{companyInfo.address.full}</li>
              )}
              <li>
                <a
                  href={urls.main("/o-nas")}
                  className="hover:text-white transition-colors no-underline"
                >
                  O nás
                </a>
              </li>
              <li>
                <a
                  href={urls.main("/kariera")}
                  className="hover:text-white transition-colors no-underline"
                >
                  Kariéra
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* === PLATFORM SWITCHER === */}
        <div className="mt-10 pt-6 border-t border-white/10">
          <h4 className="text-xs font-bold uppercase tracking-wide text-gray-400 mb-3">
            Platformy CarMakléř
          </h4>
          <PlatformSwitcher current={platformKey} variant="footer" />
        </div>

        {/* === TRUST BAR (only shop) === */}
        {trustBar}

        {/* === BOTTOM BAR === */}
        <div className="mt-8 pt-6 border-t border-white/10">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 text-xs text-gray-500">
            <div>
              &copy; {currentYear} {companyInfo.legalName}
              {!isPlaceholder(companyInfo.ico) && (
                <span> &middot; IČO: {companyInfo.ico}</span>
              )}
              {!isPlaceholder(companyInfo.dic) && (
                <span> &middot; DIČ: {companyInfo.dic}</span>
              )}
            </div>
            <nav
              aria-label="Právní informace"
              className="flex flex-wrap gap-4"
            >
              <a
                href={urls.main("/ochrana-osobnich-udaju")}
                className="hover:text-white transition-colors no-underline"
              >
                Ochrana OÚ
              </a>
              <a
                href={urls.main("/obchodni-podminky")}
                className="hover:text-white transition-colors no-underline"
              >
                Obchodní podmínky
              </a>
              <a
                href={urls.main("/zasady-cookies")}
                className="hover:text-white transition-colors no-underline"
              >
                Cookies
              </a>
            </nav>
          </div>
        </div>
      </div>
    </footer>
  );
}
