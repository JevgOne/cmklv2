import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const ALLOWED_ROLES = ["ADMIN", "BACKOFFICE"];

const teamMemberUpdateSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  initials: z.string().min(1).max(4).optional(),
  position: z.string().min(2).max(200).optional(),
  bio: z.string().min(10).max(1000).optional(),
  photoUrl: z.string().url().nullable().optional(),
  order: z.number().int().min(0).optional(),
  isPublic: z.boolean().optional(),
});

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role || !ALLOWED_ROLES.includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const member = await prisma.teamMember.findUnique({ where: { id } });
  if (!member) {
    return NextResponse.json({ error: "Nenalezeno" }, { status: 404 });
  }

  return NextResponse.json(member);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role || !ALLOWED_ROLES.includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();
  const parsed = teamMemberUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validační chyba", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  try {
    const member = await prisma.teamMember.update({
      where: { id },
      data: parsed.data,
    });
    return NextResponse.json(member);
  } catch {
    return NextResponse.json({ error: "Nenalezeno" }, { status: 404 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role || !ALLOWED_ROLES.includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  try {
    await prisma.teamMember.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Nenalezeno" }, { status: 404 });
  }
}
