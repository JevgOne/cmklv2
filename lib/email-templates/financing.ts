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
  return new Intl.NumberFormat("cs-CZ").format(amount) + " Kč";
}

export function financingHtml(data: FinancingData): string {
  const monthlyHtml = data.monthlyPayment
    ? `<tr>
        <td style="padding: 12px 16px; border-top: 1px solid #e5e7eb;">
          <p style="margin: 0 0 4px; font-size: 14px; color: #6b7280;">Orientační měsíční splátka</p>
          <p style="margin: 0; font-size: 18px; font-weight: 700; color: #f97316;">${formatCzk(data.monthlyPayment)}</p>
        </td>
      </tr>`
    : "";

  const content = `
    <p style="margin: 0 0 16px; font-size: 15px; color: #374151; line-height: 1.6;">
      Dobrý den, ${data.recipientName},
    </p>
    <p style="margin: 0 0 16px; font-size: 15px; color: #374151; line-height: 1.6;">
      máte zájem o financování vozidla <strong>${data.vehicleName}</strong>?
      Připravili jsme pro Vás orientační nabídku.
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
      Nabízíme financování přes naše partnery s výhodnými podmínkami:
    </p>
    <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom: 20px;">
      <tr><td style="padding: 8px 0; font-size: 14px; color: #374151;">&#10003; Úrok od 4,9 % p.a.</td></tr>
      <tr><td style="padding: 8px 0; font-size: 14px; color: #374151;">&#10003; Bez poplatku za zpracování</td></tr>
      <tr><td style="padding: 8px 0; font-size: 14px; color: #374151;">&#10003; Schválení do 24 hodin</td></tr>
      <tr><td style="padding: 8px 0; font-size: 14px; color: #374151;">&#10003; Splatnost 12–84 měsíců</td></tr>
    </table>
    ${data.customText ? `<p style="margin: 0 0 16px; font-size: 15px; color: #374151; line-height: 1.6;">${data.customText}</p>` : ""}
    <p style="margin: 0 0 16px; font-size: 15px; color: #374151; line-height: 1.6;">
      Pro detailní kalkulaci mě prosím kontaktujte.
    </p>
  `;
  return emailLayout(content, generateSignatureHtml(data.broker));
}

export function financingText(data: FinancingData): string {
  return [
    `Dobrý den, ${data.recipientName},`,
    "",
    `máte zájem o financování vozidla ${data.vehicleName}?`,
    `Cena vozidla: ${formatCzk(data.price)}`,
    data.monthlyPayment ? `Orientační měsíční splátka: ${formatCzk(data.monthlyPayment)}` : "",
    "",
    "Nabízíme financování s výhodnými podmínkami:",
    "- Úrok od 4,9 % p.a.",
    "- Bez poplatku za zpracování",
    "- Schválení do 24 hodin",
    "- Splatnost 12–84 měsíců",
    "",
    data.customText || "",
    "",
    "Pro detailní kalkulaci mě prosím kontaktujte.",
    generateSignatureText(data.broker),
  ]
    .filter(Boolean)
    .join("\n");
}

export function financingSubject(data: FinancingData): string {
  return `Financování ${data.vehicleName} | Carmakler`;
}
