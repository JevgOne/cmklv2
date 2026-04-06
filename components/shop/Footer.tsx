import { FooterBase } from "@/components/common/FooterBase";
import { ShopTrustBar } from "./ShopTrustBar";

export function ShopFooter() {
  return (
    <FooterBase
      platformKey="shop"
      tagline="E-shop s autodíly. Použité díly z vrakovišť i nové aftermarket díly za skvělé ceny."
      productColumn={{
        title: "Shop",
        links: [
          { href: "/katalog", label: "Katalog dílů" },
          { href: "/kosik", label: "Košík" },
          { href: "/moje-objednavky", label: "Moje objednávky" },
          { href: "/vraceni-zbozi", label: "Vrácení zboží" },
          { href: "/reklamace", label: "Reklamace" },
        ],
      }}
      trustBar={<ShopTrustBar />}
    />
  );
}
