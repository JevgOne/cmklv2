import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/seo/slugify";

/**
 * Normalizuje user input pro nový tag.
 * Odmítá prázdné nebo příliš dlouhé labely, zajišťuje validní slug.
 */
export function normalizeTagInput(input: { slug?: string; label: string }): {
  slug: string;
  label: string;
} {
  const label = input.label.trim();
  if (!label || label.length > 50) {
    throw new Error("Invalid label");
  }
  const slug = (input.slug && input.slug.trim()) || slugify(label);
  if (!slug) {
    throw new Error("Invalid slug");
  }
  return { slug, label };
}

/**
 * Upsert tag by slug. Při existujícím zachová původní label (nepřepisuje).
 * Nové tagy zaznamenají createdById pro audit.
 */
export async function upsertTag(
  slug: string,
  label: string,
  createdById?: string
) {
  return prisma.tag.upsert({
    where: { slug },
    create: { slug, label, createdById: createdById ?? null },
    update: {},
  });
}

/**
 * Co-occurrence: vrací tagy, které sdílejí aktivní brokery s currentTag.
 * Raw SQL join přes `_UserTags` (implicit M2M join table).
 */
export async function getRelatedTagsByCoOccurrence(
  tagId: string,
  limit = 6
): Promise<
  Array<{ slug: string; label: string; category: string | null; shared: number }>
> {
  const rows = await prisma.$queryRaw<
    Array<{ slug: string; label: string; category: string | null; shared: bigint }>
  >`
    SELECT t.slug, t.label, t.category, COUNT(*)::bigint AS shared
    FROM "_UserTags" ut1
    JOIN "_UserTags" ut2 ON ut1."B" = ut2."B" AND ut1."A" != ut2."A"
    JOIN "Tag" t ON t.id = ut2."A"
    JOIN "User" u ON u.id = ut1."B"
    WHERE ut1."A" = ${tagId}
      AND u.role = 'BROKER'
      AND u.status = 'ACTIVE'
    GROUP BY t.slug, t.label, t.category
    ORDER BY shared DESC
    LIMIT ${limit}
  `;
  return rows.map((r) => ({ ...r, shared: Number(r.shared) }));
}
