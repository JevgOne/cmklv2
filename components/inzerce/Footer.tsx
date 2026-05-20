import { FooterBase } from "@/components/common/FooterBase";

export function InzerceFooter() {
  return (
    <FooterBase
      platformKey="inzerce"
      tagline="Inzertní platforma pro prodej a nákup vozidel. Podejte inzerát a oslovte tisíce zájemců."
      productColumn={{
        title: "Inzerce",
        links: [
          { href: "/katalog", label: "Nabídka vozidel" },
          { href: "/pridat", label: "Přidat inzerát" },
          { href: "/moje-inzeraty", label: "Moje inzeráty" },
        ],
      }}
    />
  );
}
