import { FooterBase } from "@/components/common/FooterBase";

export function InzerceFooter() {
  return (
    <FooterBase
      platformKey="inzerce"
      tagline="Inzertní platforma pro prodej a nákup vozidel. Podejte inzerát a oslovte tisíce zájemců."
      productColumn={{
        title: "Inzerce",
        links: [
          { href: "/katalog", label: "Katalog vozidel" },
          { href: "/pridat", label: "Přidat inzerát" },
          { href: "/moje-inzeraty", label: "Moje inzeráty" },
          { href: "/cenik", label: "Ceník" },
          { href: "/tipy", label: "Tipy prodejcům" },
        ],
      }}
    />
  );
}
