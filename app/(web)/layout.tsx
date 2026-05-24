import dynamic from "next/dynamic";
import { headers } from "next/headers";
import type { SubdomainType } from "@/lib/subdomain";
import { generateOrganizationJsonLd } from "@/lib/seo";

import { MainNavbar } from "@/components/main/Navbar";
import { MainFooter } from "@/components/main/Footer";
import { CompareProvider } from "@/components/web/CompareContext";
import { CompareBar } from "@/components/web/CompareBar";
import { CookieConsent } from "@/components/web/CookieConsent";

// Lazy-load non-main navbars/footers — only loaded when that subdomain is active
const InzerceNavbar = dynamic(() => import("@/components/inzerce/Navbar").then(m => m.InzerceNavbar));
const InzerceFooter = dynamic(() => import("@/components/inzerce/Footer").then(m => m.InzerceFooter));
const ShopNavbar = dynamic(() => import("@/components/shop/Navbar").then(m => m.ShopNavbar));
const ShopFooter = dynamic(() => import("@/components/shop/Footer").then(m => m.ShopFooter));
const MarketplaceNavbar = dynamic(() => import("@/components/marketplace/Navbar").then(m => m.MarketplaceNavbar));
const MarketplaceFooter = dynamic(() => import("@/components/marketplace/Footer").then(m => m.MarketplaceFooter));

function getNavbarAndFooter(subdomain: SubdomainType) {
  switch (subdomain) {
    case "inzerce":
      return {
        navbar: <InzerceNavbar />,
        footer: <InzerceFooter />,
      };
    case "shop":
      return {
        navbar: <ShopNavbar />,
        footer: <ShopFooter />,
      };
    case "marketplace":
      return {
        navbar: <MarketplaceNavbar />,
        footer: <MarketplaceFooter />,
      };
    case "main":
    default:
      return {
        navbar: <MainNavbar />,
        footer: <MainFooter />,
      };
  }
}

export default async function WebLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const headersList = await headers();
  const subdomain = (headersList.get("x-subdomain") || "main") as SubdomainType;
  const { navbar, footer } = getNavbarAndFooter(subdomain);

  return (
    <CompareProvider>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: generateOrganizationJsonLd() }}
      />
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[300] focus:px-4 focus:py-2 focus:bg-orange-600 focus:text-white focus:rounded-lg focus:text-sm focus:font-semibold focus:no-underline"
      >
        Prejit na obsah
      </a>
      {navbar}
      <main id="main-content" className="min-h-[calc(100vh-72px)]">{children}</main>
      {footer}
      <CompareBar />
      <CookieConsent />
    </CompareProvider>
  );
}
