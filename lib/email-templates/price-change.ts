import { emailLayout, escapeHtml, formatCzk } from "./layout";
import { generateSignatureHtml, generateSignatureText, BrokerSignatureData } from "./signature";

export interface PriceChangeData {
  recipientName: string;
  vehicleName: string;
  currentPrice: number;
  newPrice: number;
  reason?: string;
  broker: BrokerSignatureData;
  customText?: string;
}

export function priceChangeHtml(data: PriceChangeData): string {
  const discount = data.currentPrice - data.newPrice;
  const discountPercent = Math.round((discount / data.currentPrice) * 100);

  const content = `
    <p style="margin: 0 0 16px; font-size: 15px; color: #374151; line-height: 1.6;">
      Dobrý den, ${escapeHtml(data.recipientName)},
    </p>
    <p style="margin: 0 0 16px; font-size: 15px; color: #374151; line-height: 1.6;">
      rád bych Vám doporučil úpravu ceny Vašeho vozidla <strong>${escapeHtml(data.vehicleName)}</strong>
      pro zvýšení šance na rychlý prodej.
    </p>
    <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin: 20px 0; background-color: #f9fafb; border-radius: 8px;">
      <tr>
        <td style="padding: 12px 16px;">
          <p style="margin: 0 0 4px; font-size: 14px; color: #6b7280;">Aktuální cena</p>
          <p style="margin: 0; font-size: 16px; color: #111827; text-decoration: line-through;">${formatCzk(data.currentPrice)}</p>
        </td>
      </tr>
      <tr>
        <td style="padding: 12px 16px; border-top: 1px solid #e5e7eb;">
          <p style="margin: 0 0 4px; font-size: 14px; color: #6b7280;">Doporučená nová cena</p>
          <p style="margin: 0; font-size: 18px; font-weight: 700; color: #f97316;">${formatCzk(data.newPrice)}</p>
          <p style="margin: 4px 0 0; font-size: 13px; color: #16a34a;">Snížení o ${formatCzk(discount)} (${discountPercent} %)</p>
        </td>
      </tr>
    </table>
    ${
      data.reason
        ? `<p style="margin: 0 0 16px; font-size: 15px; color: #374151; line-height: 1.6;"><strong>Důvod doporučení:</strong> ${escapeHtml(data.reason)}</p>`
        : ""
    }
    ${data.customText ? `<p style="margin: 0 0 16px; font-size: 15px; color: #374151; line-height: 1.6;">${escapeHtml(data.customText)}</p>` : ""}
    <p style="margin: 0 0 16px; font-size: 15px; color: #374151; line-height: 1.6;">
      Samozřejmě je to pouze doporučení a konečné rozhodnutí je na Vás.
      Budu rád za Vaši odpověď.
    </p>
  `;
  return emailLayout(content, generateSignatureHtml(data.broker));
}

export function priceChangeText(data: PriceChangeData): string {
  const discount = data.currentPrice - data.newPrice;
  const discountPercent = Math.round((discount / data.currentPrice) * 100);

  return [
    `Dobrý den, ${data.recipientName},`,
    "",
    `rád bych Vám doporučil úpravu ceny Vašeho vozidla ${data.vehicleName}.`,
    "",
    `Aktuální cena: ${formatCzk(data.currentPrice)}`,
    `Doporučená nová cena: ${formatCzk(data.newPrice)}`,
    `Snížení o ${formatCzk(discount)} (${discountPercent} %)`,
    "",
    data.reason ? `Důvod doporučení: ${data.reason}` : "",
    data.customText || "",
    "",
    "Samozřejmě je to pouze doporučení a konečné rozhodnutí je na Vás.",
    "Budu rád za Vaši odpověď.",
    generateSignatureText(data.broker),
  ]
    .filter(Boolean)
    .join("\n");
}

export function priceChangeSubject(data: PriceChangeData): string {
  return `Doporučení změny ceny — ${data.vehicleName} | Carmakler`;
}
