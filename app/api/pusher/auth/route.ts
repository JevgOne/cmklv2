import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { pusher } from "@/lib/pusher";

export async function POST(request: NextRequest) {
  if (!pusher) {
    return NextResponse.json({ error: "Pusher not configured" }, { status: 503 });
  }

  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Nepřihlášen" }, { status: 401 });
  }

  const body = await request.text();
  const params = new URLSearchParams(body);
  const socketId = params.get("socket_id");
  const channelName = params.get("channel_name");

  if (!socketId || !channelName) {
    return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
  }

  // Authorize private channels
  // private-user-{userId} — only the user themselves
  // private-workflow-{id} — any authenticated user (access checked at API level)
  // private-role-{role} — only users with matching role
  const userId = session.user.id;
  const userRole = session.user.role;

  if (channelName.startsWith("private-user-")) {
    const channelUserId = channelName.replace("private-user-", "");
    if (channelUserId !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  } else if (channelName.startsWith("private-role-")) {
    const channelRole = channelName.replace("private-role-", "");
    // ADMIN can subscribe to any role channel
    if (userRole !== "ADMIN" && userRole !== channelRole) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }
  // private-workflow-{id} — allow any authenticated user (fine-grained access at API level)

  const authResponse = pusher.authorizeChannel(socketId, channelName);
  return NextResponse.json(authResponse);
}
