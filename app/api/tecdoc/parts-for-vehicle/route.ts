import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getPartsForKType, getProductGroupsForKType } from "@/lib/tecdoc";
import { z } from "zod";

const schema = z.object({
  kTypeId: z.number().int().nullable().optional(),
});

const ALLOWED_ROLES = ["PARTS_SUPPLIER", "ADMIN", "BACKOFFICE"];

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !ALLOWED_ROLES.includes(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Neplatný vstup" },
      { status: 400 }
    );
  }

  const kTypeId = parsed.data.kTypeId ?? 0;
  const [parts, groups] = await Promise.all([
    getPartsForKType(kTypeId),
    getProductGroupsForKType(kTypeId),
  ]);

  return NextResponse.json({ parts, groups });
}
