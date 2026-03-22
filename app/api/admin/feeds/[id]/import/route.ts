import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { importFeed } from "@/lib/feed-import";

const ADMIN_ROLES = ["ADMIN", "BACKOFFICE"];

/* ------------------------------------------------------------------ */
/*  POST /api/admin/feeds/[id]/import — Spustit import manuálně        */
/* ------------------------------------------------------------------ */

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !ADMIN_ROLES.includes(session.user.role)) {
      return NextResponse.json({ error: "Nemáte oprávnění" }, { status: 403 });
    }

    const { id } = await params;
    const result = await importFeed(id);

    return NextResponse.json({ result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Neznámá chyba";
    console.error("POST /api/admin/feeds/[id]/import error:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
