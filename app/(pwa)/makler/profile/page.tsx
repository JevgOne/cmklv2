import { redirect } from "next/navigation";
import Image from "next/image";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/Card";
import { TrustScore } from "@/components/ui/TrustScore";
import { ProfileForm } from "@/components/pwa/profile/ProfileForm";
import { BrokerStats } from "@/components/pwa/profile/BrokerStats";
import { NotificationSettings } from "@/components/pwa/profile/NotificationSettings";
import { QuickModeToggle } from "@/components/pwa/profile/QuickModeToggle";

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/login");
  }

  const userId = session.user.id;

  const [user, totalVehicles, soldVehicles, soldVehiclesData] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        avatar: true,
        bio: true,
        role: true,
        quickModeEnabled: true,
        level: true,
        createdAt: true,
      },
    }),
    prisma.vehicle.count({
      where: { brokerId: userId },
    }),
    prisma.vehicle.count({
      where: { brokerId: userId, status: "SOLD" },
    }),
    // Pro vypocet prumerne doby prodeje
    prisma.vehicle.findMany({
      where: {
        brokerId: userId,
        status: "SOLD",
        publishedAt: { not: null },
      },
      select: { publishedAt: true, updatedAt: true },
    }),
  ]);

  if (!user) {
    redirect("/login");
  }

  // Prumerna doba prodeje ve dnech
  let avgDays = 0;
  if (soldVehiclesData.length > 0) {
    const totalDays = soldVehiclesData.reduce((sum, v) => {
      if (!v.publishedAt) return sum;
      const diff = v.updatedAt.getTime() - v.publishedAt.getTime();
      return sum + diff / (1000 * 60 * 60 * 24);
    }, 0);
    avgDays = Math.round(totalDays / soldVehiclesData.length);
  }

  // Prumerny trust score vozu brokera
  const trustAgg = await prisma.vehicle.aggregate({
    where: { brokerId: userId, status: "ACTIVE" },
    _avg: { trustScore: true },
  });
  const avgTrustScore = Math.round(trustAgg._avg.trustScore ?? 0);

  return (
    <div className="p-4 space-y-6">
      {/* Header s avatarem */}
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center text-2xl flex-shrink-0 overflow-hidden relative">
          {user.avatar ? (
            <Image
              src={user.avatar}
              alt={`${user.firstName} ${user.lastName}`}
              fill
              className="object-cover"
              sizes="64px"
            />
          ) : (
            <span>👤</span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-extrabold text-gray-900">
            {user.firstName} {user.lastName}
          </h1>
          <p className="text-sm text-gray-500">{user.email}</p>
        </div>
        <TrustScore value={avgTrustScore} />
      </div>

      {/* Statistiky */}
      <BrokerStats
        totalVehicles={totalVehicles}
        soldVehicles={soldVehicles}
        avgDays={avgDays}
      />

      {/* Formular profilu */}
      <Card className="p-4">
        <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-4">
          Osobni udaje
        </h3>
        <ProfileForm
          defaultValues={{
            firstName: user.firstName,
            lastName: user.lastName,
            phone: user.phone,
            bio: user.bio,
          }}
        />
      </Card>

      {/* Rychlé nabírání — toggle (pro makléře) */}
      {user.role === "BROKER" || user.role === "MANAGER" || user.role === "REGIONAL_DIRECTOR" ? (
        <QuickModeToggle initialEnabled={user.quickModeEnabled} userLevel={user.level} />
      ) : null}

      {/* Nastaveni notifikaci */}
      <NotificationSettings />
    </div>
  );
}
