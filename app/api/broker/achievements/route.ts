import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ACHIEVEMENTS, checkAndUnlockAchievements } from "@/lib/gamification";

const ALLOWED_ROLES = ["BROKER", "MANAGER", "REGIONAL_DIRECTOR", "ADMIN"];

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Neprihlaseny" }, { status: 401 });
    }
    if (!ALLOWED_ROLES.includes(session.user.role)) {
      return NextResponse.json({ error: "Pristup odepren" }, { status: 403 });
    }

    const userId = session.user.id;

    // Check for new achievements
    const newlyUnlocked = await checkAndUnlockAchievements(userId);

    // Get all achievements for user
    const userAchievements = await prisma.userAchievement.findMany({
      where: { userId },
      select: { achievementKey: true, unlockedAt: true },
    });

    const unlockedMap = new Map(
      userAchievements.map((a) => [a.achievementKey, a.unlockedAt])
    );

    const achievements = Object.values(ACHIEVEMENTS).map((achievement) => ({
      ...achievement,
      unlocked: unlockedMap.has(achievement.key),
      unlockedAt: unlockedMap.get(achievement.key)?.toISOString() ?? null,
      newlyUnlocked: newlyUnlocked.includes(achievement.key),
    }));

    return NextResponse.json({ achievements });
  } catch (error) {
    console.error("GET /api/broker/achievements error:", error);
    return NextResponse.json({ error: "Interni chyba serveru" }, { status: 500 });
  }
}
