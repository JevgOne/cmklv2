import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { vinToKType } from "@/lib/tecdoc";
import { z } from "zod";

const schema = z.object({
  vin: z
    .string()
    .min(1)
    .max(17)
    .regex(/^[A-HJ-NPR-Z0-9]+$/i, "Neplatný VIN formát"),
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
      { error: parsed.error.issues[0]?.message ?? "Neplatný vstup" },
      { status: 400 }
    );
  }

  const vehicle = await vinToKType(parsed.data.vin.toUpperCase());
  return NextResponse.json({ vehicle });
}
