import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");

  if (!token) {
    return NextResponse.redirect(new URL("/blog?newsletter=error", request.url));
  }

  try {
    const subscriber = await prisma.newsletterSubscriber.findUnique({
      where: { confirmToken: token },
    });

    if (!subscriber) {
      return NextResponse.redirect(new URL("/blog?newsletter=error", request.url));
    }

    if (subscriber.status === "ACTIVE") {
      return NextResponse.redirect(new URL("/blog?newsletter=already", request.url));
    }

    await prisma.newsletterSubscriber.update({
      where: { id: subscriber.id },
      data: {
        status: "ACTIVE",
        confirmedAt: new Date(),
        confirmToken: null, // Invalidovat token
      },
    });

    return NextResponse.redirect(new URL("/blog?newsletter=confirmed", request.url));
  } catch (error) {
    console.error("Newsletter confirm error:", error);
    return NextResponse.redirect(new URL("/blog?newsletter=error", request.url));
  }
}
