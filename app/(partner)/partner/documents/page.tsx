import type { Metadata } from "next";
import { Card } from "@/components/ui/Card";

export const metadata: Metadata = {
  title: "Dokumenty | Carmakler Partner",
  description: "Partnerske dokumenty ke stazeni.",
};

interface DocumentItem {
  title: string;
  description: string;
  href: string | null;
  available: boolean;
}

const documents: DocumentItem[] = [
  {
    title: "Partnerska smlouva",
    description:
      "Vzor partnerske smlouvy pro spolupraci s Carmakler. Ke stazeni ve formatu PDF.",
    href: "/documents/partnerska-smlouva.pdf",
    available: true,
  },
  {
    title: "Obchodni podminky",
    description:
      "Obchodni podminky pro partnery platformy Carmakler. Aktualni verze.",
    href: "/documents/obchodni-podminky.pdf",
    available: true,
  },
  {
    title: "Mesicni vyuctovani",
    description:
      "Bude dostupne po prvnim mesici spoluprace. Automaticky generovane.",
    href: null,
    available: false,
  },
];

export default function PartnerDocumentsPage() {
  return (
    <div>
      <h1 className="text-2xl font-extrabold text-gray-900 mb-6">Dokumenty</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {documents.map((doc) => (
          <Card key={doc.title} className="p-6 flex flex-col">
            <div className="w-12 h-12 rounded-lg bg-orange-50 flex items-center justify-center text-2xl mb-4">
              📄
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              {doc.title}
            </h3>
            <p className="text-sm text-gray-500 mb-4 flex-1">
              {doc.description}
            </p>
            {doc.available && doc.href ? (
              <a
                href={doc.href}
                download
                className="inline-flex items-center justify-center gap-2 bg-orange-500 text-white px-4 py-2.5 rounded-full text-sm font-semibold hover:bg-orange-600 transition-colors no-underline"
              >
                Stahnout PDF
              </a>
            ) : (
              <span className="inline-flex items-center justify-center gap-2 bg-gray-100 text-gray-400 px-4 py-2.5 rounded-full text-sm font-semibold cursor-not-allowed">
                Zatim nedostupne
              </span>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
