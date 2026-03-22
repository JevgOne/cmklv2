import { emailLayout } from "./layout";
import { generateSignatureHtml, generateSignatureText, BrokerSignatureData } from "./signature";

export interface InsuranceData {
  recipientName: string;
  vehicleName: string;
  vehicleYear: number;
  broker: BrokerSignatureData;
  customText?: string;
}

export function insuranceHtml(data: InsuranceData): string {
  const content = `
    <p style="margin: 0 0 16px; font-size: 15px; color: #374151; line-height: 1.6;">
      Dobry den, ${data.recipientName},
    </p>
    <p style="margin: 0 0 16px; font-size: 15px; color: #374151; line-height: 1.6;">
      gratuluji k zakoupeni vozidla <strong>${data.vehicleName} (${data.vehicleYear})</strong>!
    </p>
    <p style="margin: 0 0 16px; font-size: 15px; color: #374151; line-height: 1.6;">
      Rad bych Vam nabidl zvyhodnene pojisteni pro Vase nove auto.
      Spolupracujeme s prednich pojistovnami a muzeme Vam zajistit:
    </p>
    <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom: 20px;">
      <tr><td style="padding: 8px 0; font-size: 14px; color: #374151;">&#10003; Povinne ruceni od 1 200 Kc/rok</td></tr>
      <tr><td style="padding: 8px 0; font-size: 14px; color: #374151;">&#10003; Havarijni pojisteni se slevou az 30 %</td></tr>
      <tr><td style="padding: 8px 0; font-size: 14px; color: #374151;">&#10003; Asistenční sluzby v cene</td></tr>
      <tr><td style="padding: 8px 0; font-size: 14px; color: #374151;">&#10003; Rychle sjednani online nebo telefonicky</td></tr>
    </table>
    ${data.customText ? `<p style="margin: 0 0 16px; font-size: 15px; color: #374151; line-height: 1.6;">${data.customText}</p>` : ""}
    <p style="margin: 0 0 16px; font-size: 15px; color: #374151; line-height: 1.6;">
      Dejte mi vedet a pripravim nabidku na miru.
    </p>
  `;
  return emailLayout(content, generateSignatureHtml(data.broker));
}

export function insuranceText(data: InsuranceData): string {
  return [
    `Dobry den, ${data.recipientName},`,
    "",
    `gratuluji k zakoupeni vozidla ${data.vehicleName} (${data.vehicleYear})!`,
    "",
    "Rad bych Vam nabidl zvyhodnene pojisteni pro Vase nove auto:",
    "- Povinne ruceni od 1 200 Kc/rok",
    "- Havarijni pojisteni se slevou az 30 %",
    "- Asistenční sluzby v cene",
    "- Rychle sjednani online nebo telefonicky",
    "",
    data.customText || "",
    "",
    "Dejte mi vedet a pripravim nabidku na miru.",
    generateSignatureText(data.broker),
  ]
    .filter(Boolean)
    .join("\n");
}

export function insuranceSubject(data: InsuranceData): string {
  return `Pojisteni pro ${data.vehicleName} | Carmakler`;
}
