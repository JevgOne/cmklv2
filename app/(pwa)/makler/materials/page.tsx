import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canAccess, getNextLevelInfo } from "@/lib/feature-gates";
import { LockedFeatureCard } from "@/components/pwa/LockedFeatureCard";
import { MaterialsContent } from "@/components/pwa/materials/MaterialsContent";

export default async function MaterialsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/login");
  }

  // Feature gate: MATERIALS requires STAR_3+
  if (session.user.role === "BROKER" && !canAccess(session.user.level ?? "STAR_1", "MATERIALS")) {
    const userData = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { totalRevenue: true, level: true, region: { select: { tier: true } } },
    });
    const nextInfo = getNextLevelInfo(
      userData?.level ?? "STAR_1",
      userData?.totalRevenue ?? 0,
      userData?.region?.tier ?? "SMALL"
    );
    return (
      <div className="p-4 pb-24">
        <LockedFeatureCard
          feature="MATERIALS"
          fullscreen
          percentage={nextInfo?.percentage ?? 0}
          revenueNeeded={nextInfo?.revenueNeeded ?? 0}
        />
      </div>
    );
  }

  return <MaterialsContent />;
}
