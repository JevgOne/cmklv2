import Link from "next/link";

const footerSections = [
  {
    title: "Služby",
    links: [
      { href: "/nabidka", label: "Nabídka vozidel" },
      { href: "/chci-prodat", label: "Prodat auto" },
      { href: "/sluzby/proverka", label: "Prověrka vozidla" },
      { href: "/sluzby/financovani", label: "Financování" },
      { href: "/sluzby/pojisteni", label: "Pojištění" },
      { href: "/sluzby/vykup", label: "Výkup vozidel" },
    ],
  },
  {
    title: "Platformy",
    links: [
      { href: "/inzerce", label: "Inzerce" },
      { href: "/shop", label: "Shop" },
      { href: "/kariera", label: "Pro makléře" },
      { href: "/sluzby/financovani", label: "Provizní systém" },
    ],
  },
  {
    title: "O nás",
    links: [
      { href: "/o-nas", label: "O CarMakléř" },
      { href: "/o-nas", label: "Náš tým" },
      { href: "/kariera", label: "Kariéra" },
      { href: "/recenze", label: "Recenze" },
    ],
  },
  {
    title: "Kontakt",
    links: [
      { href: "mailto:info@carmakler.cz", label: "info@carmakler.cz" },
      { href: "tel:+420123456789", label: "+420 123 456 789" },
      { href: "/kontakt", label: "Praha, Česká republika", plainText: true },
    ],
  },
];

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-950 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        {/* Top section */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-8">
          {/* Logo + description */}
          <div className="col-span-2 sm:col-span-2 lg:col-span-1">
            <Link href="/" className="flex items-center no-underline mb-4">
              <img src="/brand/logo-color.png" alt="CarMakléř" className="h-12 sm:h-14 brightness-0 invert" />
            </Link>
            <p className="text-sm text-gray-500 leading-relaxed">
              Prodejte nebo kupte auto bezpečně přes síť ověřených makléřů. Rychle, transparentně a bez starostí.
            </p>
          </div>

          {/* Link columns */}
          {footerSections.map((section) => (
            <div key={section.title}>
              <h3 className="text-sm font-bold uppercase tracking-wide text-gray-400 mb-4">
                {section.title}
              </h3>
              <ul className="list-none p-0 m-0 flex flex-col gap-3">
                {section.links.map((link, i) => (
                  <li key={`${section.title}-${i}`}>
                    {"plainText" in link && link.plainText ? (
                      <span className="text-sm text-gray-500">
                        {link.label}
                      </span>
                    ) : "external" in link && link.external ? (
                      <a
                        href={link.href}
                        target="_blank"
                        rel="noopener noreferrer"
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
          ))}
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-gray-500">
            &copy; {currentYear} CarMakléř. Všechna práva vyhrazena.
          </p>
          <div className="flex items-center gap-6">
            <Link
              href="/kontakt"
              className="text-sm text-gray-500 hover:text-white transition-colors no-underline"
            >
              Ochrana soukromí
            </Link>
            <Link
              href="/kontakt"
              className="text-sm text-gray-500 hover:text-white transition-colors no-underline"
            >
              Obchodní podmínky
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
