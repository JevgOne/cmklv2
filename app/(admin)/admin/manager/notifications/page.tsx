import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { ManagerNotificationPreferences } from "@/components/admin/ManagerNotificationPreferences";

export default async function ManagerNotificationsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  if (!["MANAGER", "REGIONAL_DIRECTOR", "ADMIN"].includes(session.user.role)) {
    redirect("/admin/dashboard");
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-gray-500">Nastaveni</p>
        <h1 className="text-2xl font-bold text-gray-900">
          Notifikace
        </h1>
      </div>

      <ManagerNotificationPreferences />
    </div>
  );
}
