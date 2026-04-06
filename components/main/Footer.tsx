import Link from "next/link";
import { companyInfo } from "@/lib/company-info";
import Image from "next/image";
import { PlatformSwitcher } from "@/components/ui/PlatformSwitcher";

const footerSections = [
  {
    title: "Služby",
    links: [
      { href: "/nabidka", label: "Nabídka vozidel" },
      { href: "/chci-prodat", label: "Prodat auto" },
      { href: "/sluzby/proverka", label: "Prověrka vozidla" },
      { href: "/sluzby/financovani", label: "Financování" },
      { href: "/sluzby/pojisteni", label: "Pojištění" },
    ],
  },
  {
    title: "O nás",
    links: [
      { href: "/o-nas", label: "O CarMakléři" },
      { href: "/o-nas", label: "Náš tým" },
      { href: "/kariera", label: "Kariéra" },
      { href: "/recenze", label: "Recenze" },
    ],
  },
  {
    title: "Kontakt",
    links: [
      { href: "mailto:info@carmakler.cz", label: "info@carmakler.cz", external: true },
      { href: companyInfo.contact.phoneHref, label: companyInfo.contact.phone, external: true },
      { href: "/kontakt", label: "Praha, Česká republika", plainText: true },
    ],
  },
];

export function MainFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-950 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-8">
          <div className="col-span-2 sm:col-span-2 lg:col-span-1">
            <Link href="/" className="flex items-center no-underline mb-4">
              <Image src="/brand/logo-white.png" alt="CarMakléř" width={120} height={48} className="h-10 sm:h-12 w-auto object-contain" />
            </Link>
            <p className="text-sm text-gray-500 leading-relaxed">
              Prodejte nebo kupte auto bezpečně přes síť ověřených makléřů. Rychle, transparentně a bez starostí.
            </p>
          </div>

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

          <div>
            <h3 className="text-sm font-bold uppercase tracking-wide text-gray-400 mb-4">
              Platformy
            </h3>
            <PlatformSwitcher current="main" variant="footer" />
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-gray-500">
            &copy; {currentYear} CarMakléř. Všechna práva vyhrazena.
          </p>
          <div className="flex items-center gap-6">
            <Link href="/ochrana-osobnich-udaju" className="text-sm text-gray-500 hover:text-white transition-colors no-underline">
              Ochrana osobních údajů
            </Link>
            <Link href="/obchodni-podminky" className="text-sm text-gray-500 hover:text-white transition-colors no-underline">
              Obchodní podmínky
            </Link>
            <Link href="/reklamacni-rad" className="text-sm text-gray-500 hover:text-white transition-colors no-underline">
              Reklamační řád
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-white transition-colors" aria-label="Facebook">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" />
              </svg>
            </a>
            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-white transition-colors" aria-label="Instagram">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" />
              </svg>
            </a>
            <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-white transition-colors" aria-label="YouTube">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
