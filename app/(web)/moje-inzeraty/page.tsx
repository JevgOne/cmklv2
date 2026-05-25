import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { MyListingsManager } from "@/components/web/MyListingsManager";


export const dynamic = "force-dynamic";
export default async function MojeInzeratyPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");

  const [listings, user] = await Promise.all([
    prisma.listing.findMany({
      where: { userId: session.user.id },
      include: {
        images: { orderBy: { order: "asc" } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { accountType: true, listingCredits: true },
    }),
  ]);

  const accountType = user?.accountType || "PRIVATE";
  const baseLimits: Record<string, number | null> = {
    PRIVATE: 1,
    BAZAAR: 10,
    DEALER: null,
  };
  const base = baseLimits[accountType] ?? 1;
  const maxListings = base === null ? null : base + (user?.listingCredits ?? 0);

  const serialized = listings.map((l) => ({
    id: l.id,
    slug: l.slug,
    brand: l.brand,
    model: l.model,
    variant: l.variant,
    year: l.year,
    price: l.price,
    status: l.status,
    viewCount: l.viewCount,
    inquiryCount: l.inquiryCount,
    isPremium: l.isPremium,
    createdAt: l.createdAt.toISOString(),
    images: l.images.map((img) => ({ url: img.url, isPrimary: img.isPrimary })),
  }));

  return <MyListingsManager initialListings={serialized} maxListings={maxListings} />;
}
