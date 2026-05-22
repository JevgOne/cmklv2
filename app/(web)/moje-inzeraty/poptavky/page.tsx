import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { DealerInquiryInbox } from "@/components/web/dealer/DealerInquiryInbox";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Poptávky — Dealer CRM",
  robots: { index: false, follow: false },
};

export default async function PoptavkyPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900 mb-4">Poptávky</h2>
      <DealerInquiryInbox />
    </div>
  );
}
