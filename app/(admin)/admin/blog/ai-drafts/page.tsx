import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AiDraftGenerator } from "./AiDraftGenerator";

export const dynamic = "force-dynamic";

export default async function AdminAiDraftsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/admin/dashboard");
  }

  const categories = await prisma.articleCategory.findMany({
    orderBy: { name: "asc" },
  });

  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">AI Návrhy článků</h1>
      <p className="text-gray-500 text-sm mb-6">
        Zadejte téma a AI vygeneruje návrh článku, který můžete upravit a publikovat.
      </p>
      <AiDraftGenerator
        categories={categories.map((c) => ({
          id: c.id,
          name: c.name,
          icon: c.icon,
        }))}
      />
    </div>
  );
}
