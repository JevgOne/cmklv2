import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/Card";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Zpravy | Carmakler Partner",
  description: "Zpravy a notifikace pro partnery.",
};

export default async function PartnerMessagesPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");

  const notifications = await prisma.notification.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return (
    <div>
      <h1 className="text-2xl font-extrabold text-gray-900 mb-2">Zpravy</h1>
      <p className="text-gray-500 text-sm mb-6">
        Systémové notifikace a zprávy. Pro komunikaci nás kontaktujte na{" "}
        <a href="mailto:info@carmakler.cz" className="text-orange-500 hover:underline">info@carmakler.cz</a>{" "}
        nebo{" "}
        <a href="tel:+420733179199" className="text-orange-500 hover:underline">+420 733 179 199</a>.
      </p>

      {notifications.length === 0 ? (
        <Card className="p-12 text-center">
          <div className="text-5xl mb-4">💬</div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">
            Zadne zpravy
          </h3>
          <p className="text-sm text-gray-500">
            Zatim nemate zadne notifikace. Az se neco stane, dozvite se to
            zde.
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {notifications.map((n) => (
            <Card key={n.id} className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={`inline-block w-2 h-2 rounded-full shrink-0 ${
                        n.read ? "bg-gray-300" : "bg-orange-500"
                      }`}
                    />
                    <span className="text-sm font-bold text-gray-900 truncate">
                      {n.title}
                    </span>
                    <span className="text-xs font-medium text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full shrink-0">
                      {n.type}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">{n.body}</p>
                </div>
                <div className="text-xs text-gray-400 whitespace-nowrap shrink-0">
                  {new Date(n.createdAt).toLocaleDateString("cs-CZ", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
