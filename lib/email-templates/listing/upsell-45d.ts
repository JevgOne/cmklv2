import { emailLayout } from "../layout";

export interface Upsell45dData {
  sellerName: string;
  vehicleName: string;
  daysOnline: number;
  listingUrl: string;
  brokerRequestUrl: string;
}

export function upsell45dSubject(data: Upsell45dData): string {
  return `Poslední šance — makléř prodá ${data.vehicleName} za Vás`;
}

export function upsell45dHtml(data: Upsell45dData): string {
  const content = `
    <p style="margin: 0 0 16px; font-size: 15px; color: #374151; line-height: 1.6;">
      Dobrý den, ${data.sellerName},
    </p>
    <p style="margin: 0 0 16px; font-size: 15px; color: #374151; line-height: 1.6;">
      Váš inzerát <strong>${data.vehicleName}</strong> je online již <strong>${data.daysOnline} dní</strong>.
      Vím, že prodej auta může být frustrující — proto jsme tu, abychom Vám pomohli.
    </p>
    <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin: 20px 0; background-color: #fff7ed; border: 1px solid #fed7aa; border-radius: 8px;">
      <tr>
        <td style="padding: 16px;">
          <p style="margin: 0 0 8px; font-size: 16px; font-weight: 700; color: #c2410c;">Speciální nabídka</p>
          <p style="margin: 0; font-size: 15px; color: #374151; line-height: 1.6;">
            Předejte prodej našemu makléřovi a neztrácejte čas. Makléř převezme kompletní servis —
            od profesionálních fotek, přes inzerci na všech portálech, až po předání kupujícímu.
            Platíte pouze provizi z úspěšného prodeje.
          </p>
        </td>
      </tr>
    </table>
    <p style="margin: 24px 0 0; text-align: center;">
      <a href="${data.brokerRequestUrl}" style="display: inline-block; padding: 14px 36px; background-color: #c2410c; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
        Chci prodat s makléřem
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

export function upsell45dText(data: Upsell45dData): string {
  return [
    `Dobrý den, ${data.sellerName},`,
    "",
    `Váš inzerát "${data.vehicleName}" je online již ${data.daysOnline} dní.`,
    "",
    `SPECIÁLNÍ NABÍDKA: Předejte prodej našemu makléřovi.`,
    `Makléř převezme kompletní servis — od profesionálních fotek po předání kupujícímu.`,
    `Platíte pouze provizi z úspěšného prodeje.`,
    "",
    `Chci prodat s makléřem: ${data.brokerRequestUrl}`,
    `Zobrazit inzerát: ${data.listingUrl}`,
  ].join("\n");
}
