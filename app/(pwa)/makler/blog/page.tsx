import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function BrokerBlogPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");

  const articles = await prisma.article.findMany({
    where: { authorId: session.user.id },
    include: {
      category: { select: { name: true, icon: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const statusLabels: Record<string, { label: string; color: string }> = {
    DRAFT: { label: "Koncept", color: "bg-gray-100 text-gray-700" },
    REVIEW: { label: "Ke schválení", color: "bg-yellow-100 text-yellow-700" },
    PUBLISHED: { label: "Publikováno", color: "bg-green-100 text-green-700" },
    ARCHIVED: { label: "Archivováno", color: "bg-red-100 text-red-700" },
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-900">Moje články</h1>
        <Link
          href="/makler/blog/new"
          className="px-4 py-2 bg-orange-500 text-white text-sm font-semibold rounded-xl hover:bg-orange-600 transition-colors"
        >
          + Nový článek
        </Link>
      </div>

      {articles.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <p className="text-4xl mb-3">📝</p>
          <p className="font-medium">Zatím nemáte žádné články</p>
          <p className="text-sm mt-1">Napište svůj první článek a sdílejte zkušenosti s ostatními</p>
        </div>
      ) : (
        <div className="space-y-3">
          {articles.map((article) => {
            const status = statusLabels[article.status] || statusLabels.DRAFT;
            return (
              <Link
                key={article.id}
                href={`/makler/blog/${article.id}/edit`}
                className="block p-4 bg-white rounded-xl border border-gray-200 hover:border-orange-300 transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate">
                      {article.title || "Bez názvu"}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                      {article.category?.icon} {article.category?.name} · {new Date(article.createdAt).toLocaleDateString("cs-CZ")}
                    </p>
                  </div>
                  <span className={`shrink-0 px-2 py-1 rounded-full text-xs font-medium ${status.color}`}>
                    {status.label}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
