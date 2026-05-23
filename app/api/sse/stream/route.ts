import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { sseManager } from "@/lib/sse/manager";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return new Response("Unauthorized", { status: 401 });
  }

  const userId = session.user.id;
  const userRole = session.user.role;

  const stream = new ReadableStream({
    start(controller) {
      const client = sseManager.addClient(userId, userRole, controller);

      // Initial connection confirmation
      const welcome = `event: connected\ndata: ${JSON.stringify({ userId })}\n\n`;
      controller.enqueue(new TextEncoder().encode(welcome));

      // Heartbeat every 30s to keep connection alive
      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(new TextEncoder().encode(": heartbeat\n\n"));
        } catch {
          clearInterval(heartbeat);
          sseManager.removeClient(client);
        }
      }, 30000);

      // Cleanup when client disconnects (stream is cancelled)
      const originalCancel = stream.cancel?.bind(stream);
      stream.cancel = (reason) => {
        clearInterval(heartbeat);
        sseManager.removeClient(client);
        return originalCancel?.(reason) ?? Promise.resolve();
      };
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
