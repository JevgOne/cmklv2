import { Metadata } from "next";
import { notFound } from "next/navigation";
import { getSellerPreferences } from "@/lib/seller-notifications";
import { SELLER_EVENT_TYPES } from "@/lib/validators/notifications";
import { SellerNotificationPreferences } from "@/components/web/SellerNotificationPreferences";

export const metadata: Metadata = {
  title: "Nastaveni notifikaci | Carmakler",
  description: "Upravte si, jak Vas budeme informovat o Vasem vozidle.",
  // Token-based private page — not indexable. Žádný canonical, místo toho
  // robots noindex.
  robots: { index: false, follow: false },
};

interface PageProps {
  params: Promise<{ token: string }>;
}

export default async function SellerNotificationsPage({ params }: PageProps) {
  const { token } = await params;

  const seller = await getSellerPreferences(token);

  if (!seller) {
    notFound();
  }

  // Doplnit defaulty pro chybejici event typy
  const prefsMap = new Map(
    seller.notificationPreferences.map((p) => [p.eventType, p])
  );

  const preferences = SELLER_EVENT_TYPES.map((eventType) => {
    const existing = prefsMap.get(eventType);
    return {
      eventType,
      smsEnabled: existing?.smsEnabled ?? true,
      emailEnabled: existing?.emailEnabled ?? true,
    };
  });

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <SellerNotificationPreferences
        token={token}
        sellerName={seller.name}
        initialPreferences={preferences}
      />
    </div>
  );
}
