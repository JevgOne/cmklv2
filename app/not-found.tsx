import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Stránka nenalezena",
  description: "Hledaná stránka neexistuje. Vraťte se na hlavní stránku CarMakléř.",
};

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-24">
      <div className="text-center max-w-md">
        <div className="text-8xl font-extrabold text-orange-500 mb-4">404</div>
        <h1 className="text-2xl font-extrabold text-gray-900 mb-3">
          Stránka nenalezena
        </h1>
        <p className="text-gray-500 mb-8">
          Stránka, kterou hledáte, neexistuje nebo byla přesunuta.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center px-6 py-3 bg-orange-500 text-white font-semibold rounded-full hover:bg-orange-600 transition-colors no-underline"
          >
            Zpět na hlavní stránku
          </Link>
          <Link
            href="/nabidka"
            className="inline-flex items-center justify-center px-6 py-3 border-2 border-gray-200 text-gray-700 font-semibold rounded-full hover:border-gray-300 transition-colors no-underline"
          >
            Prohlédnout nabídku
          </Link>
        </div>
      </div>
    </div>
  );
}
