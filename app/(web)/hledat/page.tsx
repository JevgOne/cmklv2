import { globalSearch } from "@/lib/search";
import Link from "next/link";
import { Breadcrumbs } from "@/components/web/Breadcrumbs";
import { Card } from "@/components/ui/Card";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

interface Props {
  searchParams: Promise<{ q?: string; typ?: string }>;
}

// STOP-5: noindex on search results
export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { q } = await searchParams;
  return {
    title: q ? `"${q}" — Hledání` : "Hledání",
    robots: { index: false, follow: true },
  };
}

const TYPE_LABELS: Record<string, string> = {
  vehicles: "Vozidla",
  parts: "Autodíly",
  services: "Autoservisy",
  articles: "Články",
};

const TYPE_ICONS: Record<string, string> = {
  vehicles: "🚗",
  parts: "🔧",
  services: "🏪",
  articles: "📝",
};

export default async function SearchPage({ searchParams }: Props) {
  const { q, typ } = await searchParams;

  if (!q || q.trim().length < 2) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <Breadcrumbs items={[{ label: "Domů", href: "/" }, { label: "Hledání" }]} />
        <h1 className="text-2xl font-extrabold text-gray-900 mb-4">Hledání</h1>
        <p className="text-gray-500 mb-8">Zadejte hledaný výraz (min. 2 znaky).</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {[
            { href: "/nabidka", label: "Vozidla", icon: "🚗" },
            { href: "/dily", label: "Autodíly", icon: "🔧" },
            { href: "/autoservisy", label: "Autoservisy", icon: "🏪" },
            { href: "/stk", label: "STK stanice", icon: "📋" },
            { href: "/makleri", label: "Makléři", icon: "👤" },
            { href: "/blog", label: "Blog", icon: "📝" },
          ].map((cat) => (
            <Link key={cat.href} href={cat.href} className="no-underline">
              <Card hover className="p-6 text-center">
                <div className="text-3xl mb-2">{cat.icon}</div>
                <p className="text-sm font-medium text-gray-900">{cat.label}</p>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    );
  }

  const type = typ === "vozidla" ? "vehicles" : typ === "dily" ? "parts" : typ === "servisy" ? "services" : typ === "clanky" ? "articles" : "all";
  const results = await globalSearch(q, { limitPerType: type === "all" ? 5 : 20, type });

  const categories = [
    { key: "vehicles" as const, items: results.vehicles },
    { key: "parts" as const, items: results.parts },
    { key: "services" as const, items: results.services },
    { key: "articles" as const, items: results.articles },
  ].filter((c) => c.items.length > 0);

  const totalResults = results.vehicles.length + results.parts.length + results.services.length + results.articles.length;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <Breadcrumbs items={[{ label: "Domů", href: "/" }, { label: "Hledání" }]} />

      <h1 className="text-2xl font-extrabold text-gray-900 mb-1">
        Výsledky pro &quot;{q}&quot;
      </h1>
      <p className="text-sm text-gray-500 mb-6">
        {totalResults > 0 ? `${totalResults} výsledků` : "Žádné výsledky"}
      </p>

      {/* Type filter tabs */}
      {type === "all" && totalResults > 0 && (
        <div className="flex flex-wrap gap-2 mb-6">
          <Link
            href={`/hledat?q=${encodeURIComponent(q)}`}
            className={`px-3 py-1.5 text-sm rounded-lg no-underline transition ${
              !typ ? "bg-orange-500 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            Vše ({totalResults})
          </Link>
          {categories.map((c) => (
            <Link
              key={c.key}
              href={`/hledat?q=${encodeURIComponent(q)}&typ=${c.key === "vehicles" ? "vozidla" : c.key === "parts" ? "dily" : c.key === "services" ? "servisy" : "clanky"}`}
              className="px-3 py-1.5 text-sm rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 no-underline transition"
            >
              {TYPE_LABELS[c.key]} ({c.items.length})
            </Link>
          ))}
        </div>
      )}

      {/* Results */}
      {categories.length > 0 ? (
        <div className="space-y-8">
          {categories.map((c) => (
            <div key={c.key}>
              {type === "all" && (
                <h2 className="text-sm font-semibold text-gray-400 uppercase mb-3 flex items-center gap-2">
                  <span>{TYPE_ICONS[c.key]}</span>
                  {TYPE_LABELS[c.key]}
                </h2>
              )}
              <div className="space-y-3">
                {c.items.map((item) => (
                  <Link key={item.id} href={item.url} className="no-underline">
                    <Card hover className="p-4 flex items-center gap-4">
                      {item.image ? (
                        <img
                          src={item.image}
                          alt=""
                          className="w-16 h-16 rounded-lg object-cover shrink-0 bg-gray-100"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-lg bg-gray-100 shrink-0 flex items-center justify-center text-2xl text-gray-300">
                          {TYPE_ICONS[c.key]}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">{item.title}</p>
                        <p className="text-sm text-gray-500 truncate">{item.subtitle}</p>
                      </div>
                      {item.price != null && (
                        <span className="font-bold text-gray-900 shrink-0">
                          {item.price.toLocaleString("cs-CZ")} Kč
                        </span>
                      )}
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <div className="text-5xl mb-4">🔍</div>
          <h2 className="text-lg font-bold text-gray-900 mb-2">
            Nic jsme nenašli
          </h2>
          <p className="text-sm text-gray-500 mb-6">
            Zkuste upravit hledaný výraz nebo procházejte kategorie.
          </p>
          {results.suggestions.length > 0 && (
            <div className="mb-6">
              <p className="text-xs text-gray-400 mb-2">Možná jste mysleli:</p>
              <div className="flex flex-wrap gap-2 justify-center">
                {results.suggestions.map((s) => (
                  <Link
                    key={s}
                    href={`/hledat?q=${encodeURIComponent(s)}`}
                    className="px-3 py-1 text-sm rounded-full bg-gray-100 text-gray-600 hover:bg-orange-50 hover:text-orange-600 no-underline transition"
                  >
                    {s}
                  </Link>
                ))}
              </div>
            </div>
          )}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 max-w-lg mx-auto">
            {[
              { href: "/nabidka", label: "Vozidla", icon: "🚗" },
              { href: "/dily", label: "Autodíly", icon: "🔧" },
              { href: "/autoservisy", label: "Autoservisy", icon: "🏪" },
            ].map((cat) => (
              <Link key={cat.href} href={cat.href} className="no-underline">
                <Card hover className="p-4 text-center">
                  <div className="text-2xl mb-1">{cat.icon}</div>
                  <p className="text-xs font-medium text-gray-700">{cat.label}</p>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
