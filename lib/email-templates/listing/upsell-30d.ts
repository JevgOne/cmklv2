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
  return `${data.daysOnline} dní bez prodeje — nabízíme makléřský servis pro ${data.vehicleName}`;
}

export function upsell30dHtml(data: Upsell30dData): string {
  const content = `
    <p style="margin: 0 0 16px; font-size: 15px; color: #374151; line-height: 1.6;">
      Dobrý den, ${data.sellerName},
    </p>
    <p style="margin: 0 0 16px; font-size: 15px; color: #374151; line-height: 1.6;">
      Váš inzerát <strong>${data.vehicleName}</strong> je online již <strong>${data.daysOnline} dní</strong>
      a zatím se neprodal. To je naprosto běžné — průměrný čas prodeje je 45 dní.
    </p>
    <p style="margin: 0 0 16px; font-size: 15px; color: #374151; line-height: 1.6;">
      Co Vám může pomoci prodat rychleji:
    </p>
    <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom: 20px;">
      <tr><td style="padding: 8px 0; font-size: 14px; color: #374151;">&#10003; Profesionální fotografie (až 2x více zhlédnutí)</td></tr>
      <tr><td style="padding: 8px 0; font-size: 14px; color: #374151;">&#10003; Inzerce na 5+ portálech současně</td></tr>
      <tr><td style="padding: 8px 0; font-size: 14px; color: #374151;">&#10003; Aktivní komunikace se zájemci</td></tr>
      <tr><td style="padding: 8px 0; font-size: 14px; color: #374151;">&#10003; Platíte pouze z úspěšného prodeje</td></tr>
    </table>
    <p style="margin: 24px 0 0; text-align: center;">
      <a href="${data.brokerRequestUrl}" style="display: inline-block; padding: 14px 36px; background-color: #f97316; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
        Předat prodej makléřovi
      </a>
    </p>
    <p style="margin: 16px 0 0; text-align: center;">
      <a href="${data.listingUrl}" style="font-size: 13px; color: #9ca3af; text-decoration: none;">
        Zobrazit můj inzerát
      </a>
    </p>
  `;
  return emailLayout(content, "");
}

export function upsell30dText(data: Upsell30dData): string {
  return [
    `Dobrý den, ${data.sellerName},`,
    "",
    `Váš inzerát "${data.vehicleName}" je online již ${data.daysOnline} dní a zatím se neprodal.`,
    "",
    `Co Vám může pomoci prodat rychleji:`,
    `- Profesionální fotografie (až 2x více zhlédnutí)`,
    `- Inzerce na 5+ portálech současně`,
    `- Aktivní komunikace se zájemci`,
    `- Platíte pouze z úspěšného prodeje`,
    "",
    `Předat prodej makléřovi: ${data.brokerRequestUrl}`,
    `Zobrazit inzerát: ${data.listingUrl}`,
  ].join("\n");
}
