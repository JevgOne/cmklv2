/**
 * TODO(cleanup): Pravděpodobně orphan — není importován v žádné App Router route.
 * Grep provedeno 2026-04-06, žádné importy nenalezeny.
 * Zachováno pro safety margin — smazat v cleanup tasku po ověření >= 1 týden produkce.
 * Aktivní varianta je v `components/main/Footer.tsx` (viz app/(web)/layout.tsx).
 *
 * Task #28 dual-write: migrováno na FooterBase stejně jako components/main/Footer.tsx.
 */
import { FooterBase } from "@/components/common/FooterBase";

export function Footer() {
  return (
    <FooterBase
      platformKey="main"
      tagline="Prodejte nebo kupte auto bezpečně přes síť ověřených makléřů. Rychle, transparentně a bez starostí."
      productColumn={{
        title: "Služby",
        links: [
          { href: "/nabidka", label: "Nabídka vozidel" },
          { href: "/chci-prodat", label: "Prodat auto" },
          { href: "/jak-to-funguje", label: "Jak to funguje" },
          { href: "/stan-se-maklerem", label: "Staň se makléřem" },
          { href: "/blog", label: "Blog" },
        ],
      }}
    />
  );
}
