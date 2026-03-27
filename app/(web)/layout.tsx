import { headers } from "next/headers";
import type { SubdomainType } from "@/lib/subdomain";

import { MainNavbar } from "@/components/main/Navbar";
import { MainFooter } from "@/components/main/Footer";
import { InzerceNavbar } from "@/components/inzerce/Navbar";
import { InzerceFooter } from "@/components/inzerce/Footer";
import { ShopNavbar } from "@/components/shop/Navbar";
import { ShopFooter } from "@/components/shop/Footer";
import { MarketplaceNavbar } from "@/components/marketplace/Navbar";
import { MarketplaceFooter } from "@/components/marketplace/Footer";
import { CompareProvider } from "@/components/web/CompareContext";
import { CompareBar } from "@/components/web/CompareBar";

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
      {navbar}
      <main className="min-h-[calc(100vh-72px)]">{children}</main>
      {footer}
      <CompareBar />
    </CompareProvider>
  );
}
