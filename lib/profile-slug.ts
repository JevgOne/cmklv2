import { prisma } from "@/lib/prisma";

export async function generateProfileSlug(firstName: string, lastName: string): Promise<string> {
  const base = `${firstName}-${lastName}`
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  let slug = base;
  let counter = 1;
  while (await prisma.user.findFirst({ where: { slug } })) {
    slug = `${base}-${counter}`;
    counter++;
  }
  return slug;
}
