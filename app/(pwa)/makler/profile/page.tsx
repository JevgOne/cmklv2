import { redirect } from "next/navigation";
import Link from "next/link";
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
        <div className="w-16 h-16 rounded-full flex-shrink-0 overflow-hidden relative">
          <Image
            src={user.avatar || "/brand/default-avatar.png"}
            alt={`${user.firstName} ${user.lastName}`}
            fill
            className="object-cover"
            sizes="64px"
          />
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

      {/* Odkazy */}
      {(user.role === "BROKER" || user.role === "MANAGER" || user.role === "ADMIN") && (
        <div className="grid grid-cols-2 gap-3">
          <Link href="/makler/commissions" className="no-underline">
            <Card className="p-4 text-center hover:bg-gray-50 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-6 h-6 mx-auto text-orange-500 mb-1">
                <path d="M10.75 10.818v2.614A3.13 3.13 0 0011.888 13c.482-.315.612-.648.612-.875 0-.227-.13-.56-.612-.875a3.13 3.13 0 00-1.138-.432zM8.33 8.62c.053.055.115.11.184.164.208.16.46.284.736.363V6.603c-.481.085-.876.315-1.09.563-.16.187-.227.39-.227.59 0 .28.178.588.397.864z" />
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-6a.75.75 0 01.75.75v.316a3.78 3.78 0 011.653.713c.426.33.744.74.925 1.2a.75.75 0 01-1.395.55 1.35 1.35 0 00-.447-.563 2.187 2.187 0 00-.736-.363V9.3c.514.093 1.01.265 1.459.507.672.362 1.34 1.006 1.34 1.943 0 .637-.293 1.177-.749 1.573-.398.346-.903.594-1.46.72a.75.75 0 01-.59 0 3.782 3.782 0 01-1.46-.72c-.456-.396-.749-.936-.749-1.573 0-.937.668-1.58 1.34-1.943.449-.242.945-.414 1.459-.507V6.147a2.186 2.186 0 00-.736.363c-.216.164-.38.357-.447.563a.75.75 0 11-1.395-.55c.18-.46.5-.87.925-1.2a3.78 3.78 0 011.653-.713V4.75A.75.75 0 0110 4z" clipRule="evenodd" />
              </svg>
              <p className="text-sm font-semibold text-gray-900">Provize</p>
            </Card>
          </Link>
          <Link href="/makler/provize" className="no-underline">
            <Card className="p-4 text-center hover:bg-gray-50 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-6 h-6 mx-auto text-green-500 mb-1">
                <path fillRule="evenodd" d="M1 4a1 1 0 011-1h16a1 1 0 011 1v8a1 1 0 01-1 1H2a1 1 0 01-1-1V4zm12 4a3 3 0 11-6 0 3 3 0 016 0zM4 9a1 1 0 100-2 1 1 0 000 2zm13-1a1 1 0 11-2 0 1 1 0 012 0zM1.75 14.5a.75.75 0 000 1.5c4.417 0 8.693.603 12.749 1.73 1.111.309 2.251-.512 2.251-1.696v-.784a.75.75 0 00-1.5 0v.784a.272.272 0 01-.35.25A49.043 49.043 0 001.75 14.5z" clipRule="evenodd" />
              </svg>
              <p className="text-sm font-semibold text-gray-900">Výplaty</p>
            </Card>
          </Link>
        </div>
      )}

      {/* Formular profilu */}
      <Card className="p-4">
        <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-4">
          Osobní údaje
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
