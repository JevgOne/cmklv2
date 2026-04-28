import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { CommentsModeration } from "./CommentsModeration";

export const dynamic = "force-dynamic";

export default async function AdminBlogCommentsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user || !["ADMIN", "BACKOFFICE"].includes(session.user.role)) {
    redirect("/admin/dashboard");
  }

  const comments = await prisma.profileComment.findMany({
    where: { articleId: { not: null } },
    include: {
      user: { select: { firstName: true, lastName: true, email: true, avatar: true } },
      article: { select: { title: true, slug: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const pendingCount = comments.filter((c) => c.isHidden).length;

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <h1 className="text-[28px] font-extrabold text-gray-900">Moderace komentářů</h1>
        {pendingCount > 0 && (
          <span className="bg-red-500 text-white text-xs font-bold px-2.5 py-1 rounded-full">
            {pendingCount} ke schválení
          </span>
        )}
      </div>
      <CommentsModeration
        comments={comments.map((c) => ({
          id: c.id,
          text: c.text,
          isHidden: c.isHidden,
          createdAt: c.createdAt.toISOString(),
          author: c.user,
          authorName: c.authorName,
          authorEmail: c.authorEmail,
          article: c.article!,
        }))}
      />
    </div>
  );
}
