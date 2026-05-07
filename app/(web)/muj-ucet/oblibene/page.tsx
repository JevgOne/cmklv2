import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { FavoritesList } from "@/components/web/FavoritesList";

export default async function OblibenePage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");

  const favorites = await prisma.favorite.findMany({
    where: { userId: session.user.id, listingId: { not: null } },
    include: {
      listing: {
        select: {
          id: true, slug: true, brand: true, model: true,
          variant: true, year: true, mileage: true, price: true,
          fuelType: true, city: true, status: true,
          images: { select: { url: true, isPrimary: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const serialized = favorites
    .filter((f) => f.listing !== null)
    .map((f) => ({
      id: f.id,
      listingId: f.listingId!,
      listing: f.listing!,
    }));

  return <FavoritesList initialFavorites={serialized} />;
}
