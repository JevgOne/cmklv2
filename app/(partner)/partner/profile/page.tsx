import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { PartnerProfileEditor } from "@/components/partner/PartnerProfileEditor";

export const metadata: Metadata = {
  title: "Profil | Carmakler Partner",
  description: "Sprava verejneho profilu vasi firmy.",
};

export const dynamic = "force-dynamic";

const PARTNER_ROLES = ["PARTNER_BAZAR", "PARTNER_VRAKOVISTE"];

export default async function PartnerProfilePage() {
  const session = await getServerSession(authOptions);
  if (!session?.user || !PARTNER_ROLES.includes(session.user.role)) {
    redirect("/login");
  }

  const partner = await prisma.partner.findUnique({
    where: { userId: session.user.id },
  });

  if (!partner) redirect("/partner/onboarding");

  return (
    <PartnerProfileEditor
      initialData={{
        description: partner.description || "",
        phone: partner.phone || "",
        email: partner.email || "",
        web: partner.web || "",
        address: partner.address || "",
        openingHours: partner.openingHours || null,
      }}
      isBazar={session.user.role === "PARTNER_BAZAR"}
    />
  );
}
