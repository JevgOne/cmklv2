import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params;
    const tab = request.nextUrl.searchParams.get("tab") || "vehicles";
    const cursor = request.nextUrl.searchParams.get("cursor") || undefined;
    const limit = Math.min(24, parseInt(request.nextUrl.searchParams.get("limit") || "12", 10));

    const user = await prisma.user.findFirst({
      where: { slug, status: "ACTIVE" },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ error: "Profil nenalezen" }, { status: 404 });
    }

    const cursorObj = cursor ? { id: cursor } : undefined;
    const skip = cursor ? 1 : 0;

    switch (tab) {
      case "vehicles": {
        const items = await prisma.vehicle.findMany({
          where: { brokerId: user.id, status: "ACTIVE" },
          select: {
            id: true,
            slug: true,
            brand: true,
            model: true,
            variant: true,
            year: true,
            price: true,
            mileage: true,
            fuelType: true,
            transmission: true,
            enginePower: true,
            city: true,
            trustScore: true,
            stkValidUntil: true,
            sellerType: true,
            images: { select: { url: true }, orderBy: { order: "asc" }, take: 1 },
            broker: {
              select: { id: true, firstName: true, lastName: true, slug: true },
            },
            _count: { select: { profileLikes: true, profileComments: true } },
          },
          orderBy: { createdAt: "desc" },
          take: limit,
          skip,
          cursor: cursorObj,
        });
        const nextCursor = items.length === limit ? items[items.length - 1].id : null;
        return NextResponse.json({ items, nextCursor, type: "vehicle" });
      }

      case "listings": {
        const items = await prisma.listing.findMany({
          where: { userId: user.id, status: "ACTIVE" },
          select: {
            id: true,
            slug: true,
            brand: true,
            model: true,
            variant: true,
            year: true,
            price: true,
            mileage: true,
            fuelType: true,
            transmission: true,
            enginePower: true,
            city: true,
            listingType: true,
            isPremium: true,
            stkValidUntil: true,
            images: { select: { url: true }, orderBy: { order: "asc" }, take: 1 },
            user: {
              select: { id: true, firstName: true, lastName: true, companyName: true },
            },
            _count: { select: { profileLikes: true, profileComments: true } },
          },
          orderBy: { createdAt: "desc" },
          take: limit,
          skip,
          cursor: cursorObj,
        });
        const nextCursor = items.length === limit ? items[items.length - 1].id : null;
        return NextResponse.json({ items, nextCursor, type: "listing" });
      }

      case "parts": {
        const items = await prisma.part.findMany({
          where: { supplierId: user.id, status: "ACTIVE" },
          select: {
            id: true,
            slug: true,
            name: true,
            category: true,
            price: true,
            stock: true,
            partType: true,
            images: { select: { url: true }, orderBy: { order: "asc" }, take: 1 },
            _count: { select: { profileLikes: true, profileComments: true } },
          },
          orderBy: { createdAt: "desc" },
          take: limit,
          skip,
          cursor: cursorObj,
        });
        const nextCursor = items.length === limit ? items[items.length - 1].id : null;
        return NextResponse.json({ items, nextCursor, type: "part" });
      }

      case "liked": {
        const items = await prisma.profileLike.findMany({
          where: { userId: user.id },
          select: {
            id: true,
            createdAt: true,
            vehicle: {
              select: {
                id: true, slug: true, brand: true, model: true, year: true,
                price: true, images: { select: { url: true }, take: 1 },
              },
            },
            listing: {
              select: {
                id: true, slug: true, brand: true, model: true, year: true,
                price: true, images: { select: { url: true }, take: 1 },
              },
            },
            part: {
              select: {
                id: true, slug: true, name: true, price: true,
                images: { select: { url: true }, take: 1 },
              },
            },
          },
          orderBy: { createdAt: "desc" },
          take: limit,
          skip,
          cursor: cursorObj,
        });
        const nextCursor = items.length === limit ? items[items.length - 1].id : null;
        return NextResponse.json({ items, nextCursor, type: "liked" });
      }

      case "investments": {
        const items = await prisma.investment.findMany({
          where: { investorId: user.id },
          select: {
            id: true,
            amount: true,
            returnAmount: true,
            paymentStatus: true,
            createdAt: true,
            opportunity: {
              select: {
                id: true,
                brand: true,
                model: true,
                year: true,
                status: true,
                photos: true,
                estimatedSalePrice: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
          take: limit,
          skip,
          cursor: cursorObj,
        });
        const nextCursor = items.length === limit ? items[items.length - 1].id : null;
        return NextResponse.json({ items, nextCursor, type: "investment" });
      }

      case "flips": {
        const items = await prisma.flipOpportunity.findMany({
          where: { dealerId: user.id },
          select: {
            id: true,
            brand: true,
            model: true,
            year: true,
            status: true,
            photos: true,
            purchasePrice: true,
            estimatedSalePrice: true,
            actualSalePrice: true,
            createdAt: true,
          },
          orderBy: { createdAt: "desc" },
          take: limit,
          skip,
          cursor: cursorObj,
        });
        const nextCursor = items.length === limit ? items[items.length - 1].id : null;
        return NextResponse.json({ items, nextCursor, type: "flip" });
      }

      default:
        return NextResponse.json({ error: "Neplatný tab" }, { status: 400 });
    }
  } catch (error) {
    console.error("GET /api/profile/[slug]/items error:", error);
    return NextResponse.json({ error: "Interní chyba serveru" }, { status: 500 });
  }
}
