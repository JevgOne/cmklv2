import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { addSkillTag, hashIp, type SkillTagContext } from "@/lib/reputation/skill-tags";

const tagSchema = z.object({
  tag: z.string().min(1),
  context: z.enum(["BROKER", "SUPPLIER", "DEALER", "SELLER"]),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> },
) {
  try {
    const { userId: targetId } = await params;
    const body = await request.json();
    const { tag, context } = tagSchema.parse(body);

    const session = await getServerSession(authOptions);
    const giverId = session?.user?.id ?? null;

    // IP hash for anti-spam
    const forwarded = request.headers.get("x-forwarded-for");
    const ip = forwarded?.split(",")[0]?.trim() ?? "unknown";
    const ipHash = hashIp(ip);

    const result = await addSkillTag(
      targetId,
      tag,
      context as SkillTagContext,
      giverId,
      ipHash,
    );

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Neplatná data", details: error.issues },
        { status: 400 },
      );
    }
    console.error("POST /api/reputation/[userId]/tags error:", error);
    return NextResponse.json({ error: "Interní chyba" }, { status: 500 });
  }
}
