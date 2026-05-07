import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ProfileEditor } from "@/components/web/ProfileEditor";

export default async function ProfileEditPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");

  const [user, tagRecords] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        bio: true,
        avatar: true,
        coverPhoto: true,
        city: true,
        slug: true,
        favoriteBrands: true,
        showPhone: true,
        showEmail: true,
        phone: true,
        email: true,
        role: true,
        yearsExperience: true,
        website: true,
        motto: true,
        socialLinks: true,
        services: true,
        languageSkills: true,
        specializations: true,
        warehouseAddress: true,
        openingHours: true,
      },
    }),
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        tags: { select: { slug: true, label: true }, orderBy: { label: "asc" } },
      },
    }),
  ]);

  if (!user) redirect("/login");

  const initialData = {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    bio: user.bio,
    avatar: user.avatar,
    coverPhoto: user.coverPhoto,
    city: user.city,
    slug: user.slug,
    favoriteBrands: user.favoriteBrands as string | null,
    showPhone: user.showPhone,
    showEmail: user.showEmail,
    phone: user.phone,
    email: user.email,
    role: user.role,
    yearsExperience: user.yearsExperience,
    website: user.website,
    motto: user.motto,
    socialLinks: user.socialLinks as { instagram?: string; facebook?: string; youtube?: string } | null,
    services: user.services as string[] | null,
    languageSkills: user.languageSkills as string[] | null,
    specializations: user.specializations as string | null,
    warehouseAddress: user.warehouseAddress,
    openingHours: user.openingHours as Record<string, string> | null,
  };

  const initialTags = tagRecords?.tags ?? [];

  return <ProfileEditor initialData={initialData} initialTags={initialTags} />;
}
