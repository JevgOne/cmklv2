import { emailLayout } from "../layout";

export interface InquiryNotificationData {
  sellerName: string;
  vehicleName: string;
  buyerName: string;
  buyerEmail: string;
  buyerPhone?: string;
  message: string;
  listingUrl: string;
}

export function inquiryNotificationSubject(data: InquiryNotificationData): string {
  return `Novy dotaz na ${data.vehicleName}`;
}

export function inquiryNotificationHtml(data: InquiryNotificationData): string {
  const content = `
    <p style="margin: 0 0 16px; font-size: 15px; color: #374151; line-height: 1.6;">
      Dobry den, ${data.sellerName},
    </p>
    <p style="margin: 0 0 16px; font-size: 15px; color: #374151; line-height: 1.6;">
      k vasemu inzeratu <strong>${data.vehicleName}</strong> byl zaslán nový dotaz.
    </p>
    <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin: 20px 0; background-color: #f9fafb; border-radius: 8px; padding: 16px;">
      <tr>
        <td style="padding: 16px;">
          <p style="margin: 0 0 8px; font-size: 14px; color: #6b7280;">Od:</p>
          <p style="margin: 0 0 4px; font-size: 15px; font-weight: 600; color: #111827;">${data.buyerName}</p>
          <p style="margin: 0 0 4px; font-size: 14px; color: #374151;">Email: ${data.buyerEmail}</p>
          ${data.buyerPhone ? `<p style="margin: 0 0 12px; font-size: 14px; color: #374151;">Tel: ${data.buyerPhone}</p>` : ""}
          <p style="margin: 12px 0 4px; font-size: 14px; color: #6b7280;">Zprava:</p>
          <p style="margin: 0; font-size: 15px; color: #374151; line-height: 1.6;">${data.message}</p>
        </td>
      </tr>
    </table>
    <p style="margin: 24px 0 0; text-align: center;">
      <a href="${data.listingUrl}" style="display: inline-block; padding: 12px 32px; background-color: #f97316; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 15px;">
        Odpovedet na dotaz
      </a>
    </p>
    <p style="margin: 16px 0 0; font-size: 13px; color: #9ca3af; text-align: center;">
      Doporucujeme odpovedet do 24 hodin pro zvyseni sance na prodej.
    </p>
  `;
  return emailLayout(content, "");
}

export function inquiryNotificationText(data: InquiryNotificationData): string {
  return [
    `Dobry den, ${data.sellerName},`,
    "",
    `k vasemu inzeratu "${data.vehicleName}" byl zaslan novy dotaz.`,
    "",
    `Od: ${data.buyerName}`,
    `Email: ${data.buyerEmail}`,
    data.buyerPhone ? `Tel: ${data.buyerPhone}` : "",
    "",
    `Zprava: ${data.message}`,
    "",
    `Odpovedet: ${data.listingUrl}`,
  ]
    .filter((l) => l !== undefined)
    .join("\n");
}
