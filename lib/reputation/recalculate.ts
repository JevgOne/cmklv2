import { prisma } from "@/lib/prisma";
import { getTier } from "./trust-score";
import { fetchBrokerMetrics, calculateBrokerScore } from "./broker-score";
import { checkAndUnlockBrokerBadges } from "./auto-badges";

export async function recalculateBrokerScore(userId: string): Promise<number> {
  const metrics = await fetchBrokerMetrics(userId);
  const score = calculateBrokerScore(metrics);
  const tier = getTier(score);

  await prisma.trustScore.upsert({
    where: { userId },
    create: {
      userId,
      score,
      tier,
      brokerScore: score,
      avgResponseMinutes: metrics.avgResponseMinutes ? Math.round(metrics.avgResponseMinutes) : null,
      responseRate: Math.round(metrics.responseRate),
      lastActiveAt: new Date(),
      metricsJson: JSON.stringify(metrics),
    },
    update: {
      score,
      tier,
      brokerScore: score,
      avgResponseMinutes: metrics.avgResponseMinutes ? Math.round(metrics.avgResponseMinutes) : null,
      responseRate: Math.round(metrics.responseRate),
      lastActiveAt: new Date(),
      metricsJson: JSON.stringify(metrics),
    },
  });

  // Also check/unlock badges
  await checkAndUnlockBrokerBadges(userId);

  return score;
}

export async function recalculateAllBrokers(): Promise<{ updated: number; errors: number }> {
  const brokers = await prisma.user.findMany({
    where: { role: "BROKER", status: "ACTIVE" },
    select: { id: true },
  });

  let updated = 0;
  let errors = 0;

  for (const broker of brokers) {
    try {
      await recalculateBrokerScore(broker.id);
      updated++;
    } catch (err) {
      console.error(`Failed to recalculate broker ${broker.id}:`, err);
      errors++;
    }
  }

  return { updated, errors };
}
