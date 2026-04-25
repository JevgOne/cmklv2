import { prisma } from "@/lib/prisma";
import { createHash } from "crypto";
import { SKILL_TAGS, type SkillTagContext } from "./skill-tag-defs";

export { SKILL_TAGS, MIN_TAG_DISPLAY_COUNT, type SkillTagContext } from "./skill-tag-defs";

export function hashIp(ip: string): string {
  return createHash("sha256").update(ip).digest("hex").slice(0, 16);
}

interface AddTagResult {
  success: boolean;
  error?: string;
}

export async function addSkillTag(
  targetId: string,
  tag: string,
  context: SkillTagContext,
  giverId: string | null,
  ipHash: string | null,
): Promise<AddTagResult> {
  // Validate tag exists for context
  const validTags: string[] = SKILL_TAGS[context]?.map((t) => t.tag) ?? [];
  if (!validTags.includes(tag)) {
    return { success: false, error: "Neplatný tag" };
  }

  // Cannot tag yourself
  if (giverId && giverId === targetId) {
    return { success: false, error: "Nelze hodnotit sebe" };
  }

  // Rate limit: max 10 tags per IP per 24h
  if (ipHash) {
    const dayAgo = new Date(Date.now() - 86400000);
    const recentCount = await prisma.skillTag.count({
      where: { ipHash, createdAt: { gte: dayAgo } },
    });
    if (recentCount >= 10) {
      return { success: false, error: "Příliš mnoho hodnocení, zkuste to později" };
    }

    // Cooldown: 5s between tags from same IP
    const fiveSecondsAgo = new Date(Date.now() - 5000);
    const veryRecent = await prisma.skillTag.count({
      where: { ipHash, createdAt: { gte: fiveSecondsAgo } },
    });
    if (veryRecent > 0) {
      return { success: false, error: "Počkejte chvíli" };
    }
  }

  try {
    await prisma.skillTag.create({
      data: {
        targetId,
        giverId,
        tag,
        context,
        ipHash,
      },
    });
    return { success: true };
  } catch (err) {
    // Unique constraint violation — already tagged
    if ((err as { code?: string }).code === "P2002") {
      return { success: false, error: "Tento tag jste už přidali" };
    }
    throw err;
  }
}

export async function getSkillTagCounts(
  targetId: string,
  context: string,
): Promise<{ tag: string; count: number }[]> {
  const grouped = await prisma.skillTag.groupBy({
    by: ["tag"],
    where: { targetId, context },
    _count: { id: true },
    orderBy: { _count: { id: "desc" } },
  });

  return grouped.map((g) => ({ tag: g.tag, count: g._count.id }));
}
