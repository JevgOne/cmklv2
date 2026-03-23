import { emailLayout } from "./layout";
import { generateSignatureHtml, generateSignatureText, BrokerSignatureData } from "./signature";

export interface ContractOfferData {
  recipientName: string;
  vehicleName: string;
  vin?: string;
  price: number;
  broker: BrokerSignatureData;
  customText?: string;
}

function formatCzk(amount: number): string {
  return new Intl.NumberFormat("cs-CZ").format(amount) + " Kč";
}

export function contractOfferHtml(data: ContractOfferData): string {
  const content = `
    <p style="margin: 0 0 16px; font-size: 15px; color: #374151; line-height: 1.6;">
      Dobrý den, ${data.recipientName},
    </p>
    <p style="margin: 0 0 16px; font-size: 15px; color: #374151; line-height: 1.6;">
      v příloze zasílám návrh zprostředkovatelské smlouvy pro Vaše vozidlo.
    </p>
    <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin: 20px 0; background-color: #f9fafb; border-radius: 8px; padding: 16px;">
      <tr>
        <td style="padding: 12px 16px;">
          <p style="margin: 0 0 4px; font-size: 14px; color: #6b7280;">Vozidlo</p>
          <p style="margin: 0; font-size: 16px; font-weight: 600; color: #111827;">${data.vehicleName}</p>
        </td>
      </tr>
      ${data.vin ? `<tr><td style="padding: 4px 16px 12px;"><p style="margin: 0; font-size: 13px; color: #9ca3af;">VIN: ${data.vin}</p></td></tr>` : ""}
      <tr>
        <td style="padding: 12px 16px; border-top: 1px solid #e5e7eb;">
          <p style="margin: 0 0 4px; font-size: 14px; color: #6b7280;">Inzertní cena</p>
          <p style="margin: 0; font-size: 18px; font-weight: 700; color: #f97316;">${formatCzk(data.price)}</p>
        </td>
      </tr>
    </table>
    ${data.customText ? `<p style="margin: 0 0 16px; font-size: 15px; color: #374151; line-height: 1.6;">${data.customText}</p>` : ""}
    <p style="margin: 0 0 16px; font-size: 15px; color: #374151; line-height: 1.6;">
      Prosím o prostudování a podpis smlouvy. V případě dotazů se neváhejte ozvat.
    </p>
  `;
  return emailLayout(content, generateSignatureHtml(data.broker));
}

export function contractOfferText(data: ContractOfferData): string {
  return [
    `Dobrý den, ${data.recipientName},`,
    "",
    "v příloze zasílám návrh zprostředkovatelské smlouvy pro Vaše vozidlo.",
    "",
    `Vozidlo: ${data.vehicleName}`,
    data.vin ? `VIN: ${data.vin}` : "",
    `Inzertní cena: ${formatCzk(data.price)}`,
    "",
    data.customText || "",
    "",
    "Prosím o prostudování a podpis smlouvy. V případě dotazů se neváhejte ozvat.",
    generateSignatureText(data.broker),
  ]
    .filter(Boolean)
    .join("\n");
}

export function contractOfferSubject(data: ContractOfferData): string {
  return `Návrh smlouvy — ${data.vehicleName} | Carmakler`;
}
