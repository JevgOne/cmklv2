import { emailLayout, escapeHtml } from "./layout";
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
      Dobrý den, ${escapeHtml(data.recipientName)},
    </p>
    <p style="margin: 0 0 16px; font-size: 15px; color: #374151; line-height: 1.6;">
      gratuluji k zakoupení vozidla <strong>${escapeHtml(data.vehicleName)} (${data.vehicleYear})</strong>!
    </p>
    <p style="margin: 0 0 16px; font-size: 15px; color: #374151; line-height: 1.6;">
      Rád bych Vám nabídl zvýhodněné pojištění pro Vaše nové auto.
      Spolupracujeme s předními pojišťovnami a můžeme Vám zajistit:
    </p>
    <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom: 20px;">
      <tr><td style="padding: 8px 0; font-size: 14px; color: #374151;">&#10003; Povinné ručení od 1 200 Kč/rok</td></tr>
      <tr><td style="padding: 8px 0; font-size: 14px; color: #374151;">&#10003; Havarijní pojištění se slevou až 30 %</td></tr>
      <tr><td style="padding: 8px 0; font-size: 14px; color: #374151;">&#10003; Asistenční služby v ceně</td></tr>
      <tr><td style="padding: 8px 0; font-size: 14px; color: #374151;">&#10003; Rychlé sjednání online nebo telefonicky</td></tr>
    </table>
    ${data.customText ? `<p style="margin: 0 0 16px; font-size: 15px; color: #374151; line-height: 1.6;">${escapeHtml(data.customText)}</p>` : ""}
    <p style="margin: 0 0 16px; font-size: 15px; color: #374151; line-height: 1.6;">
      Dejte mi vědět a připravím nabídku na míru.
    </p>
  `;
  return emailLayout(content, generateSignatureHtml(data.broker));
}

export function insuranceText(data: InsuranceData): string {
  return [
    `Dobrý den, ${data.recipientName},`,
    "",
    `gratuluji k zakoupení vozidla ${data.vehicleName} (${data.vehicleYear})!`,
    "",
    "Rád bych Vám nabídl zvýhodněné pojištění pro Vaše nové auto:",
    "- Povinné ručení od 1 200 Kč/rok",
    "- Havarijní pojištění se slevou až 30 %",
    "- Asistenční služby v ceně",
    "- Rychlé sjednání online nebo telefonicky",
    "",
    data.customText || "",
    "",
    "Dejte mi vědět a připravím nabídku na míru.",
    generateSignatureText(data.broker),
  ]
    .filter(Boolean)
    .join("\n");
}

export function insuranceSubject(data: InsuranceData): string {
  return `Pojištění pro ${data.vehicleName} | Carmakler`;
}
