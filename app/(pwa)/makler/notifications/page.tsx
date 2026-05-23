import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NotificationsInbox } from "@/components/pwa/notifications/NotificationsInbox";

const TAKE = 20;

export default async function NotificationsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");

  const userId = session.user.id;

  const [notifications, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: TAKE + 1,
    }),
    prisma.notification.count({
      where: { userId, read: false },
    }),
  ]);

  const hasMore = notifications.length > TAKE;
  const items = hasMore ? notifications.slice(0, TAKE) : notifications;
  const nextCursor = hasMore ? items[items.length - 1]?.id : undefined;

  const serialized = items.map((n) => ({
    ...n,
    createdAt: n.createdAt.toISOString(),
  }));

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <h1 className="text-xl font-bold text-gray-900 mb-6">
        Zprávy a notifikace
      </h1>
      <NotificationsInbox
        initialNotifications={serialized}
        initialUnreadCount={unreadCount}
        initialNextCursor={nextCursor}
        initialHasMore={hasMore}
      />
    </div>
  );
}
