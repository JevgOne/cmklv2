import { emailLayout } from "../layout";

export interface Upsell14dData {
  sellerName: string;
  vehicleName: string;
  daysOnline: number;
  viewCount: number;
  inquiryCount: number;
  listingUrl: string;
  brokerRequestUrl: string;
}

export function upsell14dSubject(data: Upsell14dData): string {
  return `Váš inzerát ${data.vehicleName} je ${data.daysOnline} dní online — zvažte pomoc makléře`;
}

export function upsell14dHtml(data: Upsell14dData): string {
  const content = `
    <p style="margin: 0 0 16px; font-size: 15px; color: #374151; line-height: 1.6;">
      Dobrý den, ${data.sellerName},
    </p>
    <p style="margin: 0 0 16px; font-size: 15px; color: #374151; line-height: 1.6;">
      Váš inzerát <strong>${data.vehicleName}</strong> je již <strong>${data.daysOnline} dní</strong> online.
    </p>
    <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin: 20px 0; background-color: #f9fafb; border-radius: 8px;">
      <tr>
        <td style="padding: 16px; text-align: center;">
          <table cellpadding="0" cellspacing="0" border="0" width="100%">
            <tr>
              <td style="text-align: center; padding: 8px;">
                <p style="margin: 0; font-size: 24px; font-weight: 700; color: #111827;">${data.viewCount}</p>
                <p style="margin: 4px 0 0; font-size: 13px; color: #6b7280;">zhlédnutí</p>
              </td>
              <td style="text-align: center; padding: 8px;">
                <p style="margin: 0; font-size: 24px; font-weight: 700; color: #111827;">${data.inquiryCount}</p>
                <p style="margin: 4px 0 0; font-size: 13px; color: #6b7280;">dotazů</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
    <p style="margin: 0 0 16px; font-size: 15px; color: #374151; line-height: 1.6;">
      Věděli jste, že auta prodávaná přes naše makléře se prodají v průměru o <strong>40 % rychleji</strong>?
      Makléř za Vás zařídí profesionální fotky, inzerci na všech portálech a komunikaci se zájemci.
    </p>
    <p style="margin: 24px 0 0; text-align: center;">
      <a href="${data.brokerRequestUrl}" style="display: inline-block; padding: 12px 32px; background-color: #f97316; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 15px;">
        Chci pomoc makléře
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

export function upsell14dText(data: Upsell14dData): string {
  return [
    `Dobrý den, ${data.sellerName},`,
    "",
    `Váš inzerát "${data.vehicleName}" je již ${data.daysOnline} dní online.`,
    "",
    `Statistiky: ${data.viewCount} zhlédnutí, ${data.inquiryCount} dotazů`,
    "",
    `Věděli jste, že auta prodávaná přes naše makléře se prodají v průměru o 40 % rychleji?`,
    "",
    `Chci pomoc makléře: ${data.brokerRequestUrl}`,
    `Zobrazit inzerát: ${data.listingUrl}`,
  ].join("\n");
}
