import { FooterBase } from "@/components/common/FooterBase";

export function MarketplaceFooter() {
  return (
    <FooterBase
      platformKey="marketplace"
      tagline="VIP investiční platforma pro flipping vozidel. Ověření dealeři a investoři na jednom místě."
      productColumn={{
        title: "CarMarketplace",
        links: [
          { href: "/", label: "Jak to funguje" },
          { href: "/apply?role=investor", label: "Pro investory" },
          { href: "/apply?role=dealer", label: "Pro dealery" },
          { href: "/apply", label: "Žádost o přístup" },
          { href: "/#faq", label: "FAQ" },
        ],
      }}
    />
  );
}
