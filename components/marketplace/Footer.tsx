import Link from "next/link";
import { urls } from "@/lib/urls";
import { companyInfo } from "@/lib/company-info";
import Image from "next/image";
import { PlatformSwitcher } from "@/components/ui/PlatformSwitcher";

export function MarketplaceFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-950 text-white border-t border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Logo + popis */}
          <div className="col-span-2 lg:col-span-1">
            <Link href="/" className="flex items-center gap-2 no-underline mb-4">
              <Image src="/brand/logo-white.png" alt="CarMakléř" width={120} height={40} className="h-10 w-auto object-contain" />
              <span className="text-sm font-semibold text-orange-400">Marketplace</span>
            </Link>
            <p className="text-sm text-gray-500 leading-relaxed">
              Uzavřená investiční platforma pro flipping vozidel. Ověření dealeři a investoři na jednom místě.
            </p>
          </div>

          {/* Marketplace */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wide text-gray-400 mb-4">
              Marketplace
            </h3>
            <ul className="list-none p-0 m-0 flex flex-col gap-3">
              <li>
                <Link href="/dealer" className="text-sm text-gray-500 hover:text-white transition-colors no-underline">
                  Pro dealery
                </Link>
              </li>
              <li>
                <Link href="/investor" className="text-sm text-gray-500 hover:text-white transition-colors no-underline">
                  Pro investory
                </Link>
              </li>
            </ul>
          </div>

          {/* Platformy */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wide text-gray-400 mb-4">
              Platformy
            </h3>
            <PlatformSwitcher current="marketplace" variant="footer" />
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
                <a href={companyInfo.contact.phoneHref} className="text-sm text-gray-500 hover:text-white transition-colors no-underline">
                  {companyInfo.contact.phone}
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-gray-500">
            &copy; {currentYear} CarMakléř. Všechna práva vyhrazena.
          </p>
          <div className="flex items-center gap-6">
            <a href={urls.main("/ochrana-osobnich-udaju")} className="text-sm text-gray-500 hover:text-white transition-colors no-underline">
              Ochrana osobních údajů
            </a>
            <a href={urls.main("/obchodni-podminky")} className="text-sm text-gray-500 hover:text-white transition-colors no-underline">
              Obchodní podmínky
            </a>
            <a href={urls.main("/reklamacni-rad")} className="text-sm text-gray-500 hover:text-white transition-colors no-underline">
              Reklamační řád
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
