import { prisma } from "@/lib/prisma";
import { clampScore } from "./trust-score";

interface BrokerMetrics {
  totalSales: number;
  avgSaleDays: number | null;
  responseRate: number;        // 0-100
  avgResponseMinutes: number | null;
  avgPhotosPerVehicle: number;
  level: string;
  tenureMonths: number;
}

// Weights (must sum to 100)
const W = {
  sales: 25,
  saleSpeed: 15,
  responseRate: 20,
  responseSpeed: 15,
  photoQuality: 10,
  careerLevel: 10,
  tenure: 5,
} as const;

function salesScore(totalSales: number): number {
  return Math.min(totalSales / 20, 1) * W.sales;
}

function saleSpeedScore(avgDays: number | null): number {
  if (avgDays === null) return W.saleSpeed * 0.25;
  if (avgDays < 30) return W.saleSpeed;
  if (avgDays < 60) return W.saleSpeed * 0.75;
  if (avgDays < 90) return W.saleSpeed * 0.5;
  return W.saleSpeed * 0.25;
}

function responseRateScore(rate: number): number {
  return (rate / 100) * W.responseRate;
}

function responseSpeedScore(avgMinutes: number | null): number {
  if (avgMinutes === null) return W.responseSpeed * 0.25;
  if (avgMinutes < 60) return W.responseSpeed;
  if (avgMinutes < 240) return W.responseSpeed * 0.75;
  if (avgMinutes < 1440) return W.responseSpeed * 0.5;
  return W.responseSpeed * 0.25;
}

function photoQualityScore(avgPhotos: number): number {
  if (avgPhotos >= 20) return W.photoQuality;
  if (avgPhotos >= 15) return W.photoQuality * 0.75;
  if (avgPhotos >= 10) return W.photoQuality * 0.5;
  return W.photoQuality * 0.25;
}

const LEVEL_SCORES: Record<string, number> = {
  STAR_1: 0.2,
  STAR_2: 0.4,
  STAR_3: 0.6,
  STAR_4: 0.8,
  STAR_5: 1.0,
};

function careerLevelScore(level: string): number {
  return (LEVEL_SCORES[level] ?? 0.2) * W.careerLevel;
}

function tenureScore(months: number): number {
  if (months >= 12) return W.tenure;
  if (months >= 6) return W.tenure * 0.75;
  if (months >= 3) return W.tenure * 0.5;
  return W.tenure * 0.25;
}

export function calculateBrokerScore(m: BrokerMetrics): number {
  const total =
    salesScore(m.totalSales) +
    saleSpeedScore(m.avgSaleDays) +
    responseRateScore(m.responseRate) +
    responseSpeedScore(m.avgResponseMinutes) +
    photoQualityScore(m.avgPhotosPerVehicle) +
    careerLevelScore(m.level) +
    tenureScore(m.tenureMonths);

  return clampScore(total);
}

export async function fetchBrokerMetrics(userId: string): Promise<BrokerMetrics> {
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: {
      totalSales: true,
      level: true,
      createdAt: true,
    },
  });

  // Avg sale days (createdAt → soldAt approximation via status changes)
  const soldVehicles = await prisma.vehicle.findMany({
    where: { brokerId: userId, status: "SOLD" },
    select: { createdAt: true, updatedAt: true },
  });
  const avgSaleDays =
    soldVehicles.length > 0
      ? soldVehicles.reduce((sum, v) => {
          const days = (v.updatedAt.getTime() - v.createdAt.getTime()) / 86400000;
          return sum + days;
        }, 0) / soldVehicles.length
      : null;

  // Response metrics from VehicleInquiry
  const inquiries = await prisma.vehicleInquiry.findMany({
    where: { vehicle: { brokerId: userId } },
    select: { createdAt: true, repliedAt: true, status: true },
  });
  const totalInquiries = inquiries.length;
  const repliedInquiries = inquiries.filter((i) => i.repliedAt);
  const responseRate = totalInquiries > 0 ? (repliedInquiries.length / totalInquiries) * 100 : 0;
  const avgResponseMinutes =
    repliedInquiries.length > 0
      ? repliedInquiries.reduce((sum, i) => {
          const mins = (i.repliedAt!.getTime() - i.createdAt.getTime()) / 60000;
          return sum + mins;
        }, 0) / repliedInquiries.length
      : null;

  // Avg photos per vehicle
  const photoStats = await prisma.vehicleImage.groupBy({
    by: ["vehicleId"],
    where: { vehicle: { brokerId: userId } },
    _count: { id: true },
  });
  const avgPhotosPerVehicle =
    photoStats.length > 0
      ? photoStats.reduce((sum, s) => sum + s._count.id, 0) / photoStats.length
      : 0;

  const tenureMonths = Math.floor(
    (Date.now() - user.createdAt.getTime()) / (30.44 * 86400000),
  );

  return {
    totalSales: user.totalSales,
    avgSaleDays,
    responseRate,
    avgResponseMinutes,
    avgPhotosPerVehicle,
    level: user.level,
    tenureMonths,
  };
}
