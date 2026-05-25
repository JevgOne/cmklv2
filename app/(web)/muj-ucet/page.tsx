import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { StatCard } from "@/components/ui/StatCard";
import { Card } from "@/components/ui/Card";
import { ProfileCompletenessBar } from "@/components/profile/ProfileCompletenessBar";
import type { ProfileCompletenessInput } from "@/lib/profile-completeness";


export const dynamic = "force-dynamic";
export default async function MujUcetPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");

  const [favoritesCount, watchdogsCount, inquiriesCount, profile] = await Promise.all([
    prisma.favorite.count({ where: { userId: session.user.id, listingId: { not: null } } }),
    prisma.watchdog.count({ where: { userId: session.user.id } }),
    prisma.inquiry.count({ where: { senderId: session.user.id } }),
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        avatar: true, coverPhoto: true, bio: true, city: true,
        motto: true, yearsExperience: true, website: true,
        specializations: true, services: true, languageSkills: true,
        socialLinks: true,
      },
    }),
  ]);

  const completenessInput: ProfileCompletenessInput | null = profile
    ? {
        avatar: profile.avatar ?? null,
        coverPhoto: profile.coverPhoto ?? null,
        bio: profile.bio ?? null,
        city: profile.city ?? null,
        motto: profile.motto ?? null,
        yearsExperience: profile.yearsExperience ?? null,
        website: profile.website ?? null,
        specializations: profile.specializations as string | null,
        services: profile.services as string[] | null,
        languageSkills: profile.languageSkills as string[] | null,
        socialLinks: profile.socialLinks as Record<string, string> | null,
      }
    : null;

  return (
    <div className="space-y-6">
      {/* Profile completeness banner (TASK-060) */}
      {completenessInput && <ProfileCompletenessBar user={completenessInput} />}

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          icon={<span>&#9829;</span>}
          iconColor="red"
          value={String(favoritesCount)}
          label="Oblíbené vozy"
        />
        <StatCard
          icon={<span>&#128276;</span>}
          iconColor="blue"
          value={String(watchdogsCount)}
          label="Hlídací psi"
        />
        <StatCard
          icon={<span>&#128172;</span>}
          iconColor="green"
          value={String(inquiriesCount)}
          label="Odeslaných dotazů"
        />
      </div>

      {/* Quick actions */}
      <Card className="p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Rychlé akce</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Link href="/muj-ucet/oblibene" className="no-underline">
            <Card hover className="p-5 text-center">
              <div className="text-2xl mb-2">&#9829;</div>
              <h4 className="font-semibold text-gray-900 text-sm">Oblíbené vozy</h4>
              <p className="text-xs text-gray-500 mt-1">Prohlédněte si uložené inzeráty</p>
            </Card>
          </Link>
          <Link href="/muj-ucet/hlidaci-pes" className="no-underline">
            <Card hover className="p-5 text-center">
              <div className="text-2xl mb-2">&#128276;</div>
              <h4 className="font-semibold text-gray-900 text-sm">Hlídací pes</h4>
              <p className="text-xs text-gray-500 mt-1">Nastavte upozornění na nové vozy</p>
            </Card>
          </Link>
          <Link href="/nabidka" className="no-underline">
            <Card hover className="p-5 text-center">
              <div className="text-2xl mb-2">&#128269;</div>
              <h4 className="font-semibold text-gray-900 text-sm">Hledat vozy</h4>
              <p className="text-xs text-gray-500 mt-1">Prohlédněte si aktuální nabídku</p>
            </Card>
          </Link>
        </div>
      </Card>
    </div>
  );
}
