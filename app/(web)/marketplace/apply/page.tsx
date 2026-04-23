import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/web/Breadcrumbs";
import { ApplyForm } from "@/components/web/marketplace/ApplyForm";
import { Alert } from "@/components/ui/Alert";
import { pageCanonical } from "@/lib/canonical";

export const metadata: Metadata = {
  title: "Žádost o přístup | Marketplace",
  description:
    "Vyplňte žádost o přístup k marketplace. Investujte do aut nebo nabízejte flip příležitosti. Ověříme váš profil do 48 hodin.",
  robots: { index: true, follow: true },
  openGraph: {
    title: "Žádost o přístup k Marketplace | CarMakléř",
    description:
      "Staňte se součástí VIP investiční platformy pro flipping vozidel. Ověřeni dealeři + investoři.",
  },
  alternates: pageCanonical("/marketplace/apply"),
};

type Props = {
  searchParams: Promise<{
    role?: string;
    reason?: string;
  }>;
};

export default async function MarketplaceApplyPage({ searchParams }: Props) {
  const { role, reason } = await searchParams;

  const initialRole =
    role === "investor"
      ? "INVESTOR"
      : role === "dealer"
        ? "VERIFIED_DEALER"
        : null;

  return (
    <main>
      <Breadcrumbs
        items={[
          { label: "Domů", href: "/" },
          { label: "Marketplace", href: "/marketplace" },
          { label: "Žádost o přístup" },
        ]}
      />

      <section className="py-12 md:py-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          {reason === "auth_required" && (
            <Alert variant="info" className="mb-6">
              <span className="text-sm leading-relaxed">
                <strong className="block mb-1">Pro přístup musíte být ověřený uživatel</strong>
                Marketplace je VIP platforma pro ověřené dealery a investory. Vyplňte žádost
                níže a my vás do 48 hodin prověříme.
              </span>
            </Alert>
          )}
          {reason === "not_authorized" && (
            <Alert variant="warning" className="mb-6">
              <span className="text-sm leading-relaxed">
                <strong className="block mb-1">Vaše role nemá přístup k této sekci</strong>
                Pokud máte zájem o investování nebo nabízení flip příležitostí, vyplňte
                žádost o rozšíření role.
              </span>
            </Alert>
          )}

          <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 text-center">
            Žádost o přístup
          </h1>
          <p className="text-gray-500 text-center mt-3 mb-10 max-w-lg mx-auto leading-relaxed">
            Vyberte svou roli a vyplňte kontaktní údaje. Náš tým váš profil ověří a ozve se
            vám <strong>do 48 hodin</strong>.
          </p>

          <ApplyForm initialRole={initialRole} />
        </div>
      </section>
    </main>
  );
}
