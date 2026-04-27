import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/resend";

export type MarketplaceNotificationType =
  | "NEW_DEAL"
  | "NEGOTIATION"
  | "STATUS_CHANGE"
  | "PAYOUT"
  | "REPAIR_UPDATE";

const EVENT_TYPE_MAP: Record<MarketplaceNotificationType, string> = {
  NEW_DEAL: "MARKETPLACE_NEW_DEAL",
  NEGOTIATION: "MARKETPLACE_NEGOTIATION",
  STATUS_CHANGE: "MARKETPLACE_STATUS_CHANGE",
  PAYOUT: "MARKETPLACE_PAYOUT",
  REPAIR_UPDATE: "MARKETPLACE_REPAIR_UPDATE",
};

export interface NotifyParams {
  type: MarketplaceNotificationType;
  opportunityId: string;
  recipientIds: string[];
  title: string;
  body: string;
  link: string;
  /** Optional email content — if provided, email will be sent */
  email?: {
    subject: string;
    html: string;
    text: string;
  };
}

/**
 * Send marketplace notifications (in-app + optional email).
 * Fire-and-forget safe — catches all errors internally.
 */
export async function notifyMarketplace(params: NotifyParams): Promise<void> {
  const { type, recipientIds, title, body, link, email } = params;

  if (recipientIds.length === 0) return;

  try {
    // 1. Check notification preferences for each recipient
    const eventType = EVENT_TYPE_MAP[type];
    const preferences = await prisma.notificationPreference.findMany({
      where: {
        userId: { in: recipientIds },
        eventType,
      },
    });

    const prefMap = new Map(preferences.map((p) => [p.userId, p]));

    // 2. Create in-app notifications for recipients who have push enabled (default: true)
    const inAppRecipients = recipientIds.filter((id) => {
      const pref = prefMap.get(id);
      return !pref || pref.pushEnabled !== false;
    });

    if (inAppRecipients.length > 0) {
      await prisma.notification.createMany({
        data: inAppRecipients.map((userId) => ({
          userId,
          type: `MARKETPLACE_${type}`,
          title,
          body,
          link,
        })),
      });
    }

    // 3. Send emails for recipients who have email enabled
    if (email) {
      const emailRecipients = recipientIds.filter((id) => {
        const pref = prefMap.get(id);
        return !pref || pref.emailEnabled !== false;
      });

      if (emailRecipients.length > 0) {
        // Fetch email addresses
        const users = await prisma.user.findMany({
          where: { id: { in: emailRecipients } },
          select: { id: true, email: true, firstName: true },
        });

        // Send emails in parallel (fire-and-forget per email)
        await Promise.allSettled(
          users
            .filter((u) => u.email)
            .map((u) =>
              sendEmail({
                to: u.email,
                subject: email.subject,
                html: email.html,
                text: email.text,
              })
            )
        );
      }
    }
  } catch (error) {
    console.error(`[Marketplace:Notify] ${type} failed:`, error);
  }
}
