import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { SupplierProfileClient } from "@/components/pwa-parts/profile/SupplierProfileClient";

export const metadata: Metadata = {
  title: "Profil | Carmakler",
  description: "Profil dodavatele na platformě Carmakler.",
};

export const dynamic = "force-dynamic";

export default async function SupplierProfilePage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect("/login");
  }

  const partner = await prisma.partner.findUnique({
    where: { userId: session.user.id },
  });

  const profile = {
    description: partner?.description || "",
    phone: partner?.phone || "",
    email: partner?.email || "",
    web: partner?.web || "",
    address: partner?.address || "",
  };

  const userName = `${session.user.firstName ?? ""} ${session.user.lastName ?? ""}`.trim() || "Dodavatel";

  return <SupplierProfileClient initialProfile={profile} userName={userName} />;
}
