import { emailLayout } from "./layout";
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

function formatCzk(amount: number): string {
  return new Intl.NumberFormat("cs-CZ").format(amount) + " Kc";
}

export function priceChangeHtml(data: PriceChangeData): string {
  const discount = data.currentPrice - data.newPrice;
  const discountPercent = Math.round((discount / data.currentPrice) * 100);

  const content = `
    <p style="margin: 0 0 16px; font-size: 15px; color: #374151; line-height: 1.6;">
      Dobry den, ${data.recipientName},
    </p>
    <p style="margin: 0 0 16px; font-size: 15px; color: #374151; line-height: 1.6;">
      rad bych Vam doporucil upravu ceny Vaseho vozidla <strong>${data.vehicleName}</strong>
      pro zvyseni sance na rychly prodej.
    </p>
    <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin: 20px 0; background-color: #f9fafb; border-radius: 8px;">
      <tr>
        <td style="padding: 12px 16px;">
          <p style="margin: 0 0 4px; font-size: 14px; color: #6b7280;">Aktualni cena</p>
          <p style="margin: 0; font-size: 16px; color: #111827; text-decoration: line-through;">${formatCzk(data.currentPrice)}</p>
        </td>
      </tr>
      <tr>
        <td style="padding: 12px 16px; border-top: 1px solid #e5e7eb;">
          <p style="margin: 0 0 4px; font-size: 14px; color: #6b7280;">Doporucena nova cena</p>
          <p style="margin: 0; font-size: 18px; font-weight: 700; color: #f97316;">${formatCzk(data.newPrice)}</p>
          <p style="margin: 4px 0 0; font-size: 13px; color: #16a34a;">Snizeni o ${formatCzk(discount)} (${discountPercent} %)</p>
        </td>
      </tr>
    </table>
    ${
      data.reason
        ? `<p style="margin: 0 0 16px; font-size: 15px; color: #374151; line-height: 1.6;"><strong>Duvod doporuceni:</strong> ${data.reason}</p>`
        : ""
    }
    ${data.customText ? `<p style="margin: 0 0 16px; font-size: 15px; color: #374151; line-height: 1.6;">${data.customText}</p>` : ""}
    <p style="margin: 0 0 16px; font-size: 15px; color: #374151; line-height: 1.6;">
      Samozrejme je to pouze doporuceni a konecne rozhodnuti je na Vas.
      Budu rad za Vasi odpoved.
    </p>
  `;
  return emailLayout(content, generateSignatureHtml(data.broker));
}

export function priceChangeText(data: PriceChangeData): string {
  const discount = data.currentPrice - data.newPrice;
  const discountPercent = Math.round((discount / data.currentPrice) * 100);

  return [
    `Dobry den, ${data.recipientName},`,
    "",
    `rad bych Vam doporucil upravu ceny Vaseho vozidla ${data.vehicleName}.`,
    "",
    `Aktualni cena: ${formatCzk(data.currentPrice)}`,
    `Doporucena nova cena: ${formatCzk(data.newPrice)}`,
    `Snizeni o ${formatCzk(discount)} (${discountPercent} %)`,
    "",
    data.reason ? `Duvod doporuceni: ${data.reason}` : "",
    data.customText || "",
    "",
    "Samozrejme je to pouze doporuceni a konecne rozhodnuti je na Vas.",
    "Budu rad za Vasi odpoved.",
    generateSignatureText(data.broker),
  ]
    .filter(Boolean)
    .join("\n");
}

export function priceChangeSubject(data: PriceChangeData): string {
  return `Doporuceni zmeny ceny — ${data.vehicleName} | Carmakler`;
}
