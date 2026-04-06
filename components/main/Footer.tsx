import { FooterBase } from "@/components/common/FooterBase";

export function MainFooter() {
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
