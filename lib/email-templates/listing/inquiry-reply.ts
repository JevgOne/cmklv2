import { emailLayout } from "../layout";

export interface InquiryReplyData {
  buyerName: string;
  vehicleName: string;
  sellerName: string;
  replyMessage: string;
  listingUrl: string;
}

export function inquiryReplySubject(data: InquiryReplyData): string {
  return `Odpověď na Váš dotaz — ${data.vehicleName}`;
}

export function inquiryReplyHtml(data: InquiryReplyData): string {
  const content = `
    <p style="margin: 0 0 16px; font-size: 15px; color: #374151; line-height: 1.6;">
      Dobrý den, ${data.buyerName},
    </p>
    <p style="margin: 0 0 16px; font-size: 15px; color: #374151; line-height: 1.6;">
      prodejce <strong>${data.sellerName}</strong> odpověděl na Váš dotaz k inzerátu <strong>${data.vehicleName}</strong>:
    </p>
    <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin: 20px 0; background-color: #f9fafb; border-radius: 8px;">
      <tr>
        <td style="padding: 16px;">
          <p style="margin: 0; font-size: 15px; color: #374151; line-height: 1.6;">${data.replyMessage}</p>
        </td>
      </tr>
    </table>
    <p style="margin: 24px 0 0; text-align: center;">
      <a href="${data.listingUrl}" style="display: inline-block; padding: 12px 32px; background-color: #f97316; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 15px;">
        Zobrazit inzerát
      </a>
    </p>
  `;
  return emailLayout(content, "");
}

export function inquiryReplyText(data: InquiryReplyData): string {
  return [
    `Dobrý den, ${data.buyerName},`,
    "",
    `prodejce ${data.sellerName} odpověděl na Váš dotaz k inzerátu "${data.vehicleName}":`,
    "",
    data.replyMessage,
    "",
    `Zobrazit inzerát: ${data.listingUrl}`,
  ].join("\n");
}
