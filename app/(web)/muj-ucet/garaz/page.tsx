import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { GarageManager } from "@/components/web/GarageManager";


export const dynamic = "force-dynamic";
export default async function GaragePage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");

  const cars = await prisma.customerGarage.findMany({
    where: { userId: session.user.id },
    orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
  });

  const serialized = cars.map((c) => ({
    id: c.id,
    brand: c.brand,
    model: c.model,
    year: c.year,
    vin: c.vin,
    nickname: c.nickname,
    isDefault: c.isDefault,
    createdAt: c.createdAt.toISOString(),
  }));

  return <GarageManager initialCars={serialized} />;
}
