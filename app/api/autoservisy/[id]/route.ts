import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const servis = await prisma.autoServis.findFirst({
    where: {
      OR: [{ id }, { slug: id }],
      isPublished: true,
    },
    include: {
      reviews: {
        where: { isPublished: true },
        orderBy: { createdAt: "desc" },
        take: 20,
      },
    },
  });

  if (!servis) {
    return NextResponse.json({ error: "Servis nenalezen" }, { status: 404 });
  }

  return NextResponse.json(servis);
}
