import { emailLayout } from "../layout";

export interface Upsell30dData {
  sellerName: string;
  vehicleName: string;
  daysOnline: number;
  viewCount: number;
  inquiryCount: number;
  listingUrl: string;
  brokerRequestUrl: string;
}

export function upsell30dSubject(data: Upsell30dData): string {
  return `${data.daysOnline} dni bez prodeje — nabizime maklersky servis pro ${data.vehicleName}`;
}

export function upsell30dHtml(data: Upsell30dData): string {
  const content = `
    <p style="margin: 0 0 16px; font-size: 15px; color: #374151; line-height: 1.6;">
      Dobry den, ${data.sellerName},
    </p>
    <p style="margin: 0 0 16px; font-size: 15px; color: #374151; line-height: 1.6;">
      vas inzerat <strong>${data.vehicleName}</strong> je online jiz <strong>${data.daysOnline} dni</strong>
      a zatim se neprodal. To je naprosto bezne — prumerny cas prodeje je 45 dni.
    </p>
    <p style="margin: 0 0 16px; font-size: 15px; color: #374151; line-height: 1.6;">
      Co vam muze pomoci prodat rychleji:
    </p>
    <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom: 20px;">
      <tr><td style="padding: 8px 0; font-size: 14px; color: #374151;">&#10003; Profesionalni fotografie (az 2x vice zhlednuti)</td></tr>
      <tr><td style="padding: 8px 0; font-size: 14px; color: #374151;">&#10003; Inzerce na 5+ portalech soucasne</td></tr>
      <tr><td style="padding: 8px 0; font-size: 14px; color: #374151;">&#10003; Aktivni komunikace se zajemci</td></tr>
      <tr><td style="padding: 8px 0; font-size: 14px; color: #374151;">&#10003; Platite pouze z uspesneho prodeje</td></tr>
    </table>
    <p style="margin: 24px 0 0; text-align: center;">
      <a href="${data.brokerRequestUrl}" style="display: inline-block; padding: 14px 36px; background-color: #f97316; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
        Predat prodej maklerovi
      </a>
    </p>
    <p style="margin: 16px 0 0; text-align: center;">
      <a href="${data.listingUrl}" style="font-size: 13px; color: #9ca3af; text-decoration: none;">
        Zobrazit muj inzerat
      </a>
    </p>
  `;
  return emailLayout(content, "");
}

export function upsell30dText(data: Upsell30dData): string {
  return [
    `Dobry den, ${data.sellerName},`,
    "",
    `vas inzerat "${data.vehicleName}" je online jiz ${data.daysOnline} dni a zatim se neprodal.`,
    "",
    `Co vam muze pomoci prodat rychleji:`,
    `- Profesionalni fotografie (az 2x vice zhlednuti)`,
    `- Inzerce na 5+ portalech soucasne`,
    `- Aktivni komunikace se zajemci`,
    `- Platite pouze z uspesneho prodeje`,
    "",
    `Predat prodej maklerovi: ${data.brokerRequestUrl}`,
    `Zobrazit inzerat: ${data.listingUrl}`,
  ].join("\n");
}
