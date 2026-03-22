import { emailLayout } from "./layout";
import { generateSignatureHtml, generateSignatureText, BrokerSignatureData } from "./signature";

export interface FinancingData {
  recipientName: string;
  vehicleName: string;
  price: number;
  monthlyPayment?: number;
  broker: BrokerSignatureData;
  customText?: string;
}

function formatCzk(amount: number): string {
  return new Intl.NumberFormat("cs-CZ").format(amount) + " Kc";
}

export function financingHtml(data: FinancingData): string {
  const monthlyHtml = data.monthlyPayment
    ? `<tr>
        <td style="padding: 12px 16px; border-top: 1px solid #e5e7eb;">
          <p style="margin: 0 0 4px; font-size: 14px; color: #6b7280;">Orientacni mesicni splatka</p>
          <p style="margin: 0; font-size: 18px; font-weight: 700; color: #f97316;">${formatCzk(data.monthlyPayment)}</p>
        </td>
      </tr>`
    : "";

  const content = `
    <p style="margin: 0 0 16px; font-size: 15px; color: #374151; line-height: 1.6;">
      Dobry den, ${data.recipientName},
    </p>
    <p style="margin: 0 0 16px; font-size: 15px; color: #374151; line-height: 1.6;">
      mate zajem o financovani vozidla <strong>${data.vehicleName}</strong>?
      Pripravili jsme pro Vas orientacni nabidku.
    </p>
    <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin: 20px 0; background-color: #f9fafb; border-radius: 8px;">
      <tr>
        <td style="padding: 12px 16px;">
          <p style="margin: 0 0 4px; font-size: 14px; color: #6b7280;">Cena vozidla</p>
          <p style="margin: 0; font-size: 16px; font-weight: 600; color: #111827;">${formatCzk(data.price)}</p>
        </td>
      </tr>
      ${monthlyHtml}
    </table>
    <p style="margin: 0 0 16px; font-size: 15px; color: #374151; line-height: 1.6;">
      Nabizime financovani pres nase partnery s vyhodnymi podminkami:
    </p>
    <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom: 20px;">
      <tr><td style="padding: 8px 0; font-size: 14px; color: #374151;">&#10003; Urok od 4,9 % p.a.</td></tr>
      <tr><td style="padding: 8px 0; font-size: 14px; color: #374151;">&#10003; Bez poplatku za zpracovani</td></tr>
      <tr><td style="padding: 8px 0; font-size: 14px; color: #374151;">&#10003; Schvaleni do 24 hodin</td></tr>
      <tr><td style="padding: 8px 0; font-size: 14px; color: #374151;">&#10003; Splatnost 12-84 mesicu</td></tr>
    </table>
    ${data.customText ? `<p style="margin: 0 0 16px; font-size: 15px; color: #374151; line-height: 1.6;">${data.customText}</p>` : ""}
    <p style="margin: 0 0 16px; font-size: 15px; color: #374151; line-height: 1.6;">
      Pro detailni kalkulaci me prosim kontaktujte.
    </p>
  `;
  return emailLayout(content, generateSignatureHtml(data.broker));
}

export function financingText(data: FinancingData): string {
  return [
    `Dobry den, ${data.recipientName},`,
    "",
    `mate zajem o financovani vozidla ${data.vehicleName}?`,
    `Cena vozidla: ${formatCzk(data.price)}`,
    data.monthlyPayment ? `Orientacni mesicni splatka: ${formatCzk(data.monthlyPayment)}` : "",
    "",
    "Nabizime financovani s vyhodnymi podminkami:",
    "- Urok od 4,9 % p.a.",
    "- Bez poplatku za zpracovani",
    "- Schvaleni do 24 hodin",
    "- Splatnost 12-84 mesicu",
    "",
    data.customText || "",
    "",
    "Pro detailni kalkulaci me prosim kontaktujte.",
    generateSignatureText(data.broker),
  ]
    .filter(Boolean)
    .join("\n");
}

export function financingSubject(data: FinancingData): string {
  return `Financovani ${data.vehicleName} | Carmakler`;
}
