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
          { href: "/makleri", label: "Naši makléři" },
          { href: "/recenze", label: "Recenze" },
          { href: "/sluzby/proverka", label: "Prověrka vozidla" },
          { href: "/sluzby/financovani", label: "Financování" },
          { href: "/sluzby/pojisteni", label: "Pojištění" },
          { href: "/kolik-stoji-moje-auto", label: "Kolik stojí moje auto?" },
          { href: "/jak-prodat-auto", label: "Jak prodat auto" },
          { href: "/kariera", label: "Staň se makléřem" },
          { href: "/registrace/partner", label: "Registrace pro partnery" },
        ],
      }}
    />
  );
}
