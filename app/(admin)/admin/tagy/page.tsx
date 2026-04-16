import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/Card";

export const dynamic = "force-dynamic";

const CATEGORY_LABELS: Record<string, string> = {
  CITY: "Lokalita",
  BRAND: "Značka",
  SPECIALIZATION: "Specializace",
  SERVICE: "Služba",
  OTHER: "Jiné",
};

export default async function AdminTagsPage() {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "ADMIN") {
    redirect("/");
  }

  const tags = await prisma.tag.findMany({
    include: { _count: { select: { users: true } } },
    orderBy: [{ isFeatured: "desc" }, { users: { _count: "desc" } }],
  });

  const creatorIds = [...new Set(tags.map((t) => t.createdById).filter((id): id is string => !!id))];
  const creators = creatorIds.length
    ? await prisma.user.findMany({
        where: { id: { in: creatorIds } },
        select: { id: true, firstName: true, lastName: true },
      })
    : [];
  const creatorMap = new Map(
    creators.map((u) => [u.id, `${u.firstName ?? ""} ${u.lastName ?? ""}`.trim() || "—"])
  );

  return (
    <div className="p-6 space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-gray-900">Tagy</h1>
        <p className="text-sm text-gray-500 mt-1">
          Read-only přehled všech hashtagů v systému ({tags.length} celkem).
        </p>
      </header>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Slug</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Label</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Kategorie</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Featured</th>
                <th className="px-4 py-3 text-right font-semibold text-gray-700">Makléři</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Vytvořil</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Vytvořeno</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {tags.map((tag) => (
                <tr key={tag.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-xs text-gray-600">
                    {tag.slug}
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-900">
                    {tag.label}
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {tag.category
                      ? CATEGORY_LABELS[tag.category] ?? tag.category
                      : "—"}
                  </td>
                  <td className="px-4 py-3">
                    {tag.isFeatured ? (
                      <span className="inline-flex items-center rounded-full bg-orange-50 px-2 py-0.5 text-xs font-semibold text-orange-700">
                        Featured
                      </span>
                    ) : (
                      <span className="text-xs text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-gray-900">
                    {tag._count.users}
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {tag.createdById
                      ? creatorMap.get(tag.createdById) ?? "—"
                      : "seed"}
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {new Intl.DateTimeFormat("cs-CZ", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    }).format(tag.createdAt)}
                  </td>
                </tr>
              ))}
              {tags.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-10 text-center text-gray-400"
                  >
                    Zatím žádné tagy.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
