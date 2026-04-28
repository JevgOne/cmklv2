import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const ALLOWED_ROLES = ["ADMIN", "BACKOFFICE"];

const teamMemberSchema = z.object({
  name: z.string().min(2).max(100),
  initials: z.string().min(1).max(4),
  position: z.string().min(2).max(200),
  bio: z.string().min(10).max(1000),
  photoUrl: z.string().url().nullable().optional(),
  order: z.number().int().min(0).default(0),
  isPublic: z.boolean().default(true),
});

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role || !ALLOWED_ROLES.includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const members = await prisma.teamMember.findMany({
    orderBy: { order: "asc" },
  });

  return NextResponse.json(members);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role || !ALLOWED_ROLES.includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = teamMemberSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validační chyba", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const member = await prisma.teamMember.create({
    data: parsed.data,
  });

  return NextResponse.json(member, { status: 201 });
}
