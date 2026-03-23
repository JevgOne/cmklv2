import { emailLayout } from "../layout";

export interface SlaReminderData {
  sellerName: string;
  vehicleName: string;
  inquiryCount: number;
  hoursRemaining: number;
  listingUrl: string;
}

export function slaReminderSubject(data: SlaReminderData): string {
  return `Máte nepřečtený dotaz — odpovězte do ${data.hoursRemaining}h`;
}

export function slaReminderHtml(data: SlaReminderData): string {
  const content = `
    <p style="margin: 0 0 16px; font-size: 15px; color: #374151; line-height: 1.6;">
      Dobrý den, ${data.sellerName},
    </p>
    <p style="margin: 0 0 16px; font-size: 15px; color: #374151; line-height: 1.6;">
      k Vašemu inzerátu <strong>${data.vehicleName}</strong> máte
      <strong>${data.inquiryCount} nepřečtený${data.inquiryCount > 1 ? "ch" : ""} dotaz${data.inquiryCount > 1 ? "ů" : ""}</strong>.
    </p>
    <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin: 20px 0; background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 8px;">
      <tr>
        <td style="padding: 16px;">
          <p style="margin: 0; font-size: 15px; color: #991b1b; line-height: 1.6;">
            Prosím odpovídejte do <strong>${data.hoursRemaining} hodin</strong>.
            Rychlá odpověď zvyšuje šanci na prodej a zajišťuje dobré hodnocení Vašeho inzerátu.
          </p>
        </td>
      </tr>
    </table>
    <p style="margin: 24px 0 0; text-align: center;">
      <a href="${data.listingUrl}" style="display: inline-block; padding: 12px 32px; background-color: #f97316; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 15px;">
        Odpovědět na dotazy
      </a>
    </p>
  `;
  return emailLayout(content, "");
}

export function slaReminderText(data: SlaReminderData): string {
  return [
    `Dobrý den, ${data.sellerName},`,
    "",
    `k Vašemu inzerátu "${data.vehicleName}" máte ${data.inquiryCount} nepřečtený dotaz.`,
    "",
    `Prosím odpovídejte do ${data.hoursRemaining} hodin.`,
    `Rychlá odpověď zvyšuje šanci na prodej.`,
    "",
    `Odpovědět: ${data.listingUrl}`,
  ].join("\n");
}
