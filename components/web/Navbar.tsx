import Link from "next/link";
import Image from "next/image";
import { MobileMenu } from "./MobileMenu";
import { CartIcon } from "./CartIcon";

const dropdownItems = {
  sluzby: [
    {
      href: "/sluzby/proverka",
      title: "Prověrka vozidla",
      description: "Kompletní kontrola historie a stavu vozu",
      icon: (
        <svg className="w-5 h-5 text-orange-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
        </svg>
      ),
    },
    {
      href: "/sluzby/financovani",
      title: "Financování",
      description: "Výhodné financování na míru vašim potřebám",
      icon: (
        <svg className="w-5 h-5 text-orange-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0 1 15.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 0 1 3 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 0 0-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 0 1-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 0 0 3 15h-.75M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm3 0h.008v.008H18V10.5Zm-12 0h.008v.008H6V10.5Z" />
        </svg>
      ),
    },
    {
      href: "/sluzby/pojisteni",
      title: "Pojištění",
      description: "Povinné ručení i havarijní pojištění online",
      icon: (
        <svg className="w-5 h-5 text-orange-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m0-10.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.75c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.57-.598-3.75h-.152c-3.196 0-6.1-1.249-8.25-3.286Zm0 13.036h.008v.008H12v-.008Z" />
        </svg>
      ),
    },
    {
      href: "/sluzby/vykup",
      title: "Výkup vozidel",
      description: "Rychlý a férový výkup vašeho auta",
      icon: (
        <svg className="w-5 h-5 text-orange-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
        </svg>
      ),
    },
  ],
  oNas: [
    {
      href: "/o-nas",
      title: "O CarMakléři",
      description: "Kdo jsme a proč děláme to, co děláme",
      icon: (
        <svg className="w-5 h-5 text-orange-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3H21m-3.75 3H21" />
        </svg>
      ),
    },
    {
      href: "/o-nas",
      title: "Náš tým",
      description: "Seznamte se s lidmi za CarMakléřem",
      icon: (
        <svg className="w-5 h-5 text-orange-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
        </svg>
      ),
    },
    {
      href: "/kariera",
      title: "Kariéra",
      description: "Připojte se k našemu týmu makléřů",
      icon: (
        <svg className="w-5 h-5 text-orange-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 0 0 .75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 0 0-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0 1 12 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 0 1-.673-.38m0 0A2.18 2.18 0 0 1 3 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 0 1 3.413-.387m7.5 0V5.25A2.25 2.25 0 0 0 13.5 3h-3a2.25 2.25 0 0 0-2.25 2.25v.894m7.5 0a48.667 48.667 0 0 0-7.5 0M12 12.75h.008v.008H12v-.008Z" />
        </svg>
      ),
    },
    {
      href: "/recenze",
      title: "Recenze",
      description: "Co o nás říkají naši zákazníci",
      icon: (
        <svg className="w-5 h-5 text-orange-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z" />
        </svg>
      ),
    },
  ],
};

function ExternalLinkIcon() {
  return (
    <svg className="w-3.5 h-3.5 ml-1 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
    </svg>
  );
}

function ChevronDownIcon() {
  return (
    <svg className="w-4 h-4 ml-1 text-gray-400 transition-transform group-hover:rotate-180" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
    </svg>
  );
}

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-200/80">
      <nav aria-label="Hlavni navigace" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-[72px] flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center no-underline shrink-0">
          <Image src="/brand/logo-dark.png" alt="CarMakléř" width={120} height={48} className="h-10 sm:h-12 w-auto object-contain" priority />
        </Link>

        {/* Nav Links - desktop */}
        <div className="hidden lg:flex items-center gap-1">
          {/* Nabídka vozidel */}
          <Link
            href="/nabidka"
            className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors no-underline px-4 py-2 rounded-lg hover:bg-gray-50"
          >
            Nabídka vozidel
          </Link>

          {/* Inzerce */}
          <Link
            href="/inzerce"
            className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors no-underline px-4 py-2 rounded-lg hover:bg-gray-50"
          >
            Inzerce
          </Link>

          {/* Shop */}
          <Link
            href="/shop"
            className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors no-underline px-4 py-2 rounded-lg hover:bg-gray-50"
          >
            Shop
          </Link>

          {/* Služby - dropdown */}
          <div className="relative group">
            <button
              type="button"
              className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors no-underline px-4 py-2 rounded-lg hover:bg-gray-50 inline-flex items-center bg-transparent border-none cursor-pointer"
            >
              Služby
              <ChevronDownIcon />
            </button>
            <div className="absolute top-full left-0 mt-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 ease-out z-50">
              <div className="bg-white rounded-xl shadow-xl border border-gray-200 p-2 min-w-[300px]">
                {dropdownItems.sluzby.map((item) => (
                  <Link
                    key={item.title}
                    href={item.href}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors no-underline group/item"
                  >
                    <div className="w-10 h-10 rounded-lg bg-orange-50 flex items-center justify-center shrink-0">
                      {item.icon}
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900 text-sm group-hover/item:text-orange-600 transition-colors">
                        {item.title}
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        {item.description}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* O nás - dropdown */}
          <div className="relative group">
            <button
              type="button"
              className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors no-underline px-4 py-2 rounded-lg hover:bg-gray-50 inline-flex items-center bg-transparent border-none cursor-pointer"
            >
              O nás
              <ChevronDownIcon />
            </button>
            <div className="absolute top-full right-0 mt-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 ease-out z-50">
              <div className="bg-white rounded-xl shadow-xl border border-gray-200 p-2 min-w-[300px]">
                {dropdownItems.oNas.map((item) => (
                  <Link
                    key={item.title}
                    href={item.href}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors no-underline group/item"
                  >
                    <div className="w-10 h-10 rounded-lg bg-orange-50 flex items-center justify-center shrink-0">
                      {item.icon}
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900 text-sm group-hover/item:text-orange-600 transition-colors">
                        {item.title}
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        {item.description}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* CTA Buttons - desktop */}
        <div className="hidden lg:flex items-center gap-3 shrink-0">
          <CartIcon />
          <Link
            href="/chci-prodat"
            className="inline-flex items-center justify-center gap-2 font-semibold rounded-full border-none cursor-pointer transition-all duration-200 whitespace-nowrap py-2 px-4 text-[13px] bg-white text-gray-800 shadow-[inset_0_0_0_2px_var(--gray-200)] hover:bg-gray-50 hover:shadow-[inset_0_0_0_2px_var(--gray-300)] no-underline"
          >
            Chci prodat auto
          </Link>
          <Link
            href="/nabidka"
            className="inline-flex items-center justify-center gap-2 font-semibold rounded-full border-none cursor-pointer transition-all duration-200 whitespace-nowrap py-2 px-4 text-[13px] bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-orange hover:-translate-y-0.5 hover:shadow-orange-hover no-underline"
          >
            Chci koupit auto
          </Link>
        </div>

        {/* Mobile menu button + overlay */}
        <MobileMenu />
      </nav>
    </header>
  );
}
