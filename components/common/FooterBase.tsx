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
    <footer className="bg-gray-950 text-white border-t-4 border-orange-500">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 lg:py-20">
        {/* === 4-SLOUPCOVÝ GRID === */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-12">
          {/* Sloupec 1 — O nás + social */}
          <div>
            <Link href="/" className="flex items-center gap-2 no-underline mb-8">
              <Image
                src="/brand/logo-white.png"
                alt="CarMakléř"
                width={180}
                height={86}
                className="h-10 w-auto object-contain"
              />
              {badgeLabel && (
                <span className="text-sm font-semibold text-orange-400">
                  {badgeLabel}
                </span>
              )}
            </Link>
            <p className="text-sm text-gray-400 leading-relaxed mb-6">
              {tagline}
            </p>

            {/* Social */}
            <div className="flex items-center gap-4">
              {companyInfo.social.facebook && (
                <a
                  href={companyInfo.social.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Facebook"
                  className="text-gray-400 hover:text-orange-400 hover:bg-orange-400/10 rounded-full p-2 transition-all duration-200"
                >
                  <FacebookIcon className="w-6 h-6" />
                </a>
              )}
              {companyInfo.social.instagram && (
                <a
                  href={companyInfo.social.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Instagram"
                  className="text-gray-400 hover:text-orange-400 hover:bg-orange-400/10 rounded-full p-2 transition-all duration-200"
                >
                  <InstagramIcon className="w-6 h-6" />
                </a>
              )}
              {companyInfo.social.youtube && (
                <a
                  href={companyInfo.social.youtube}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="YouTube"
                  className="text-gray-400 hover:text-orange-400 hover:bg-orange-400/10 rounded-full p-2 transition-all duration-200"
                >
                  <YoutubeIcon className="w-6 h-6" />
                </a>
              )}
            </div>
          </div>

          {/* Sloupec 2 — Produkt (per-platform) */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-widest text-orange-400/80 mb-5">
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
            <h3 className="text-xs font-bold uppercase tracking-widest text-orange-400/80 mb-5">
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
            <h3 className="text-xs font-bold uppercase tracking-widest text-orange-400/80 mb-5">
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
        <div className="mt-12 pt-8 border-t border-gray-700/50 text-center">
          <h4 className="text-xs font-bold uppercase tracking-widest text-orange-400/80 mb-4">
            Platformy CarMakléř
          </h4>
          <PlatformSwitcher current={platformKey} variant="footer" />
        </div>

        {/* === TRUST BAR (only shop) === */}
        {trustBar}

        {/* === BOTTOM BAR === */}
        <div className="mt-8 pt-6 border-t border-gray-700/50">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 text-xs text-gray-600">
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
                className="hover:text-orange-400 transition-colors no-underline"
              >
                Ochrana OÚ
              </a>
              <a
                href={urls.main("/obchodni-podminky")}
                className="hover:text-orange-400 transition-colors no-underline"
              >
                Obchodní podmínky
              </a>
              <a
                href={urls.main("/zasady-cookies")}
                className="hover:text-orange-400 transition-colors no-underline"
              >
                Cookies
              </a>
            </nav>
          </div>
          <div className="text-center mt-4 text-xs text-gray-700">
            © {new Date().getFullYear()} CarMakléř |{" "}
            <a
              href="https://weblyx.cz"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-orange-400 transition-colors no-underline"
            >
              weblyx.cz
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
