import { prisma } from "@/lib/prisma";
import { pusher } from "@/lib/pusher";
import { createNotification } from "@/lib/notifications";

interface NotifyWorkflowParams {
  event: "workflow:created" | "workflow:updated" | "workflow:comment" | "workflow:assigned";
  requestId: string;
  type: string;
  title: string;
  priority: string;
  assignedToId?: string | null;
  assignedRole?: string | null;
  createdByName: string;
  status?: string;
  extra?: Record<string, unknown>;
}

/**
 * Unified workflow notification — in-app + Pusher + notify admins.
 *
 * Pattern from marketplace/notifications.ts: check prefs → in-app → Pusher event
 */
export async function notifyWorkflow(params: NotifyWorkflowParams): Promise<void> {
  const {
    event,
    requestId,
    type,
    title,
    priority,
    assignedToId,
    assignedRole,
    createdByName,
    status,
    extra,
  } = params;

  const payload = {
    requestId,
    type,
    title,
    priority,
    createdByName,
    status,
    ...extra,
  };

  const link = `/makler/pozadavky/${requestId}`;

  try {
    // 1. Notify assignee (specific person)
    if (assignedToId) {
      await createNotification({
        userId: assignedToId,
        type: "SYSTEM",
        title: `Nový požadavek: ${title}`,
        body: `${createdByName} vytvořil požadavek typu ${type}.`,
        link,
      });

      if (pusher) {
        await pusher.trigger(`private-user-${assignedToId}`, event, payload);
      }
    }

    // 2. Notify the role channel (department)
    if (assignedRole && pusher) {
      await pusher.trigger(`private-role-${assignedRole}`, "workflow:created", payload);
    }

    // 3. Always notify ADMINs (system-wide visibility)
    const admins = await prisma.user.findMany({
      where: {
        role: "ADMIN",
        status: "ACTIVE",
        // Don't double-notify if assignee is already admin
        ...(assignedToId ? { id: { not: assignedToId } } : {}),
      },
      select: { id: true },
    });

    await Promise.all(
      admins.map(async (admin) => {
        await createNotification({
          userId: admin.id,
          type: "SYSTEM",
          title: `Nový požadavek: ${title}`,
          body: `${createdByName} → ${assignedRole ?? "nepřiřazeno"}`,
          link,
        });

        if (pusher) {
          await pusher.trigger(`private-user-${admin.id}`, event, payload);
        }
      }),
    );

    // 4. Pusher event on the workflow channel (for real-time detail page updates)
    if (pusher) {
      await pusher.trigger(`private-workflow-${requestId}`, event, payload);
    }
  } catch (error) {
    // Fire-and-forget — don't break the main flow
    console.error("notifyWorkflow error:", error);
  }
}
