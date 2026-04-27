import { emailLayout, escapeHtml } from "./layout";
import { companySignatureHtml, companySignatureText } from "./company-signature";

export interface MarketplaceStatusChangeData {
  recipientName: string;
  carTitle: string;
  oldStatus: string;
  newStatus: string;
  link: string;
}

const STATUS_LABELS: Record<string, string> = {
  PENDING_APPROVAL: "Ke schválení",
  APPROVED: "Schváleno",
  FUNDING: "Financování",
  FUNDED: "Financováno",
  IN_REPAIR: "V opravě",
  FOR_SALE: "Na prodej",
  SOLD: "Prodáno",
  PAYOUT_PENDING: "Čeká na výplatu",
  COMPLETED: "Dokončeno",
  CANCELLED: "Zrušeno",
};

export function marketplaceStatusChangeSubject(
  data: MarketplaceStatusChangeData,
): string {
  const newLabel = STATUS_LABELS[data.newStatus] ?? data.newStatus;
  return `${data.carTitle} — stav: ${newLabel} | Carmakler Marketplace`;
}

export function marketplaceStatusChangeHtml(
  data: MarketplaceStatusChangeData,
): string {
  const oldLabel = STATUS_LABELS[data.oldStatus] ?? data.oldStatus;
  const newLabel = STATUS_LABELS[data.newStatus] ?? data.newStatus;

  const content = `
    <h1 style="margin: 0 0 16px; font-size: 24px; color: #111827; font-weight: 700;">
      Změna stavu flipu
    </h1>

    <p style="margin: 0 0 12px; font-size: 15px; color: #374151; line-height: 1.6;">
      Dobrý den ${escapeHtml(data.recipientName)},
    </p>

    <p style="margin: 0 0 20px; font-size: 15px; color: #374151; line-height: 1.6;">
      Stav příležitosti <strong>${escapeHtml(data.carTitle)}</strong> byl změněn.
    </p>

    <table cellpadding="0" cellspacing="0" border="0" width="100%"
           style="margin: 24px 0; background-color: #f9fafb; border-radius: 8px; border-left: 4px solid #F97316;">
      <tr>
        <td style="padding: 20px;">
          <table cellpadding="4" cellspacing="0" border="0" style="font-size: 14px; color: #374151;">
            <tr>
              <td style="padding-right: 24px;">Předchozí stav:</td>
              <td style="font-weight: 600; color: #6b7280;">${escapeHtml(oldLabel)}</td>
            </tr>
            <tr>
              <td style="padding-right: 24px;">Nový stav:</td>
              <td style="font-weight: 700; color: #F97316;">${escapeHtml(newLabel)}</td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <table cellpadding="0" cellspacing="0" border="0" style="margin: 24px 0;">
      <tr>
        <td style="background-color: #F97316; border-radius: 8px;">
          <a href="${escapeHtml(data.link)}"
             style="display: inline-block; padding: 14px 28px; color: #ffffff; font-size: 15px; font-weight: 600; text-decoration: none;">
            Zobrazit detail
          </a>
        </td>
      </tr>
    </table>
  `;

  return emailLayout(content, companySignatureHtml());
}

export function marketplaceStatusChangeText(
  data: MarketplaceStatusChangeData,
): string {
  const oldLabel = STATUS_LABELS[data.oldStatus] ?? data.oldStatus;
  const newLabel = STATUS_LABELS[data.newStatus] ?? data.newStatus;

  return [
    `Dobrý den ${data.recipientName},`,
    "",
    `Stav příležitosti ${data.carTitle} byl změněn.`,
    `Předchozí stav: ${oldLabel}`,
    `Nový stav: ${newLabel}`,
    "",
    `Detail: ${data.link}`,
    "",
    companySignatureText(),
  ].join("\n");
}
