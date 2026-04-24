import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { NotificationsPageContent } from "@/components/admin/NotificationsPageContent";

export default async function AdminNotificationsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || !["ADMIN", "BACKOFFICE", "MANAGER", "REGIONAL_DIRECTOR", "BROKER"].includes(session.user.role)) {
    redirect("/login");
  }

  const notifications = await prisma.notification.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  const serialized = notifications.map((n) => ({
    id: n.id,
    type: n.type,
    title: n.title,
    body: n.body,
    link: n.link,
    read: n.read,
    createdAt: n.createdAt.toISOString(),
  }));

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-gray-500 mb-1">Admin / Upozornění</p>
        <h1 className="text-2xl font-bold text-gray-900">Upozornění</h1>
      </div>

      <NotificationsPageContent notifications={serialized} />
    </div>
  );
}
