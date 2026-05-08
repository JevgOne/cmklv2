import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AdminNewVehicleForm } from "@/components/admin/AdminNewVehicleForm";

export const metadata: Metadata = {
  title: "Pridat vozidlo | Carmakler Admin",
  description: "Pridani noveho vozidla do systemu.",
};

export const dynamic = "force-dynamic";

const ALLOWED_ROLES = ["ADMIN", "BACKOFFICE", "MANAGER"];

export default async function AdminNewVehiclePage() {
  const session = await getServerSession(authOptions);
  if (!session?.user || !ALLOWED_ROLES.includes(session.user.role)) {
    redirect("/login");
  }

  return <AdminNewVehicleForm />;
}
