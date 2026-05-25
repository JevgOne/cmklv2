import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { WatchdogManager } from "@/components/web/WatchdogManager";


export const dynamic = "force-dynamic";
export default async function HlidaciPesPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");

  const watchdogs = await prisma.watchdog.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  });

  const serialized = watchdogs.map((wd) => ({
    id: wd.id,
    brand: wd.brand,
    model: wd.model,
    minPrice: wd.minPrice,
    maxPrice: wd.maxPrice,
    minYear: wd.minYear,
    maxYear: wd.maxYear,
    fuelType: wd.fuelType,
    bodyType: wd.bodyType,
    city: wd.city,
    email: wd.email,
    active: wd.active,
    createdAt: wd.createdAt.toISOString(),
  }));

  return <WatchdogManager initialWatchdogs={serialized} />;
}
