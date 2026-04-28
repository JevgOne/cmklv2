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

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Moderace komentářů</h1>
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
