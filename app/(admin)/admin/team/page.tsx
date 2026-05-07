import { prisma } from "@/lib/prisma";
import { TeamManager } from "@/components/admin/TeamManager";

export const dynamic = "force-dynamic";

export default async function AdminTeamPage() {
  const members = await prisma.teamMember.findMany({
    orderBy: { order: "asc" },
  });

  const serialized = members.map((m) => ({
    id: m.id,
    name: m.name,
    initials: m.initials,
    position: m.position,
    bio: m.bio,
    photoUrl: m.photoUrl,
    order: m.order,
    isPublic: m.isPublic,
  }));

  return <TeamManager initialMembers={serialized} />;
}
