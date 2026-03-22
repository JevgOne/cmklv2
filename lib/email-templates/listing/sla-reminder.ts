import { emailLayout } from "../layout";

export interface SlaReminderData {
  sellerName: string;
  vehicleName: string;
  inquiryCount: number;
  hoursRemaining: number;
  listingUrl: string;
}

export function slaReminderSubject(data: SlaReminderData): string {
  return `Mate neprecteny dotaz — odpovezte do ${data.hoursRemaining}h`;
}

export function slaReminderHtml(data: SlaReminderData): string {
  const content = `
    <p style="margin: 0 0 16px; font-size: 15px; color: #374151; line-height: 1.6;">
      Dobry den, ${data.sellerName},
    </p>
    <p style="margin: 0 0 16px; font-size: 15px; color: #374151; line-height: 1.6;">
      k vasemu inzeratu <strong>${data.vehicleName}</strong> mate
      <strong>${data.inquiryCount} neprecteny${data.inquiryCount > 1 ? "ch" : ""} dotaz${data.inquiryCount > 1 ? "u" : ""}</strong>.
    </p>
    <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin: 20px 0; background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 8px;">
      <tr>
        <td style="padding: 16px;">
          <p style="margin: 0; font-size: 15px; color: #991b1b; line-height: 1.6;">
            Prosim odpovidejte do <strong>${data.hoursRemaining} hodin</strong>.
            Rychla odpoved zvysuje sanci na prodej a zajistuje dobre hodnoceni vaseho inzeratu.
          </p>
        </td>
      </tr>
    </table>
    <p style="margin: 24px 0 0; text-align: center;">
      <a href="${data.listingUrl}" style="display: inline-block; padding: 12px 32px; background-color: #f97316; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 15px;">
        Odpovedet na dotazy
      </a>
    </p>
  `;
  return emailLayout(content, "");
}

export function slaReminderText(data: SlaReminderData): string {
  return [
    `Dobry den, ${data.sellerName},`,
    "",
    `k vasemu inzeratu "${data.vehicleName}" mate ${data.inquiryCount} neprecteny dotaz.`,
    "",
    `Prosim odpovidejte do ${data.hoursRemaining} hodin.`,
    `Rychla odpoved zvysuje sanci na prodej.`,
    "",
    `Odpovedet: ${data.listingUrl}`,
  ].join("\n");
}
