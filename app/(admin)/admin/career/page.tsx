import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { CareerOverviewContent } from "@/components/admin/CareerOverviewContent";

export const dynamic = "force-dynamic";

export default async function CareerPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/login");
  }

  if (!["ADMIN", "BACKOFFICE", "MANAGER", "REGIONAL_DIRECTOR"].includes(session.user.role)) {
    redirect("/admin/dashboard");
  }

  return <CareerOverviewContent />;
}
