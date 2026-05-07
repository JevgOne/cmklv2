import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ListingDetailManager } from "@/components/web/ListingDetailManager";

export default async function ListingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");

  const { id } = await params;

  const listing = await prisma.listing.findFirst({
    where: { id, userId: session.user.id },
    include: {
      images: { orderBy: { order: "asc" } },
      inquiries: {
        orderBy: { createdAt: "desc" },
        select: {
          id: true, name: true, email: true, phone: true,
          message: true, reply: true, repliedAt: true,
          status: true, read: true, createdAt: true,
        },
      },
    },
  });

  if (!listing) notFound();

  const serialized = {
    id: listing.id,
    slug: listing.slug,
    brand: listing.brand,
    model: listing.model,
    variant: listing.variant,
    year: listing.year,
    mileage: listing.mileage,
    price: listing.price,
    priceNegotiable: listing.priceNegotiable,
    fuelType: listing.fuelType,
    transmission: listing.transmission,
    status: listing.status,
    viewCount: listing.viewCount,
    inquiryCount: listing.inquiryCount,
    description: listing.description,
    city: listing.city,
    district: listing.district,
    contactName: listing.contactName,
    contactPhone: listing.contactPhone,
    contactEmail: listing.contactEmail,
    isPremium: listing.isPremium,
    createdAt: listing.createdAt.toISOString(),
    publishedAt: listing.publishedAt?.toISOString() ?? null,
    images: listing.images.map((img) => ({
      id: img.id,
      url: img.url,
      isPrimary: img.isPrimary,
      order: img.order,
    })),
    inquiries: listing.inquiries.map((inq) => ({
      id: inq.id,
      name: inq.name,
      email: inq.email,
      phone: inq.phone,
      message: inq.message,
      reply: inq.reply,
      repliedAt: inq.repliedAt?.toISOString() ?? null,
      status: inq.status,
      read: inq.read,
      createdAt: inq.createdAt.toISOString(),
    })),
  };

  return <ListingDetailManager initialListing={serialized} listingId={id} />;
}
