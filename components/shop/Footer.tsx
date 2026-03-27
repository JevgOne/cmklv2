import Link from "next/link";
import { urls } from "@/lib/urls";

export function ShopFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-950 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Logo + popis */}
          <div className="col-span-2 lg:col-span-1">
            <Link href="/" className="flex items-center gap-2 no-underline mb-4">
              <img src="/brand/logo-color.png" alt="CarMakléř" className="h-10 brightness-0 invert" />
              <span className="text-sm font-semibold text-orange-400">Shop</span>
            </Link>
            <p className="text-sm text-gray-500 leading-relaxed">
              E-shop s autodíly. Použité díly z vrakovišť i nové aftermarket díly za skvělé ceny.
            </p>
          </div>

          {/* Shop */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wide text-gray-400 mb-4">
              Shop
            </h3>
            <ul className="list-none p-0 m-0 flex flex-col gap-3">
              <li>
                <Link href="/katalog" className="text-sm text-gray-500 hover:text-white transition-colors no-underline">
                  Katalog dílů
                </Link>
              </li>
              <li>
                <Link href="/kosik" className="text-sm text-gray-500 hover:text-white transition-colors no-underline">
                  Košík
                </Link>
              </li>
              <li>
                <Link href="/moje-objednavky" className="text-sm text-gray-500 hover:text-white transition-colors no-underline">
                  Moje objednávky
                </Link>
              </li>
            </ul>
          </div>

          {/* Další platformy */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wide text-gray-400 mb-4">
              Další platformy
            </h3>
            <ul className="list-none p-0 m-0 flex flex-col gap-3">
              <li>
                <a href={urls.main("/")} className="text-sm text-gray-500 hover:text-white transition-colors no-underline">
                  CarMakléř
                </a>
              </li>
              <li>
                <a href={urls.inzerce("/")} className="text-sm text-gray-500 hover:text-white transition-colors no-underline">
                  Inzerce
                </a>
              </li>
              <li>
                <a href={urls.marketplace("/")} className="text-sm text-gray-500 hover:text-white transition-colors no-underline">
                  Marketplace
                </a>
              </li>
            </ul>
          </div>

          {/* Kontakt */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wide text-gray-400 mb-4">
              Kontakt
            </h3>
            <ul className="list-none p-0 m-0 flex flex-col gap-3">
              <li>
                <a href="mailto:info@carmakler.cz" className="text-sm text-gray-500 hover:text-white transition-colors no-underline">
                  info@carmakler.cz
                </a>
              </li>
              <li>
                <a href="tel:+420123456789" className="text-sm text-gray-500 hover:text-white transition-colors no-underline">
                  +420 123 456 789
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-gray-500">
            &copy; {currentYear} CarMakléř. Všechna práva vyhrazena.
          </p>
          <div className="flex items-center gap-6">
            <a href={urls.main("/kontakt")} className="text-sm text-gray-500 hover:text-white transition-colors no-underline">
              Ochrana soukromí
            </a>
            <a href={urls.main("/kontakt")} className="text-sm text-gray-500 hover:text-white transition-colors no-underline">
              Obchodní podmínky
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
