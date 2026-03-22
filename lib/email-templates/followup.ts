import { emailLayout } from "./layout";
import { generateSignatureHtml, generateSignatureText, BrokerSignatureData } from "./signature";

export interface FollowupData {
  recipientName: string;
  vehicleName: string;
  broker: BrokerSignatureData;
  customText?: string;
}

export function followupHtml(data: FollowupData): string {
  const content = `
    <p style="margin: 0 0 16px; font-size: 15px; color: #374151; line-height: 1.6;">
      Dobry den, ${data.recipientName},
    </p>
    <p style="margin: 0 0 16px; font-size: 15px; color: #374151; line-height: 1.6;">
      dekuji za schuzku a moznost prohlédnout Vase vozidlo <strong>${data.vehicleName}</strong>.
    </p>
    <p style="margin: 0 0 16px; font-size: 15px; color: #374151; line-height: 1.6;">
      Vozidlo jsem zadal do systemu a bude inzerovano na prednich portalech.
      Budu Vas pravidelne informovat o prubehu prodeje — poctu zobrazeni, dotazech od zajemcu
      a pripadnych nabidkach.
    </p>
    ${data.customText ? `<p style="margin: 0 0 16px; font-size: 15px; color: #374151; line-height: 1.6;">${data.customText}</p>` : ""}
    <p style="margin: 0 0 16px; font-size: 15px; color: #374151; line-height: 1.6;">
      V pripade jakychkoliv dotazu me nevanejte kontaktovat.
    </p>
  `;
  return emailLayout(content, generateSignatureHtml(data.broker));
}

export function followupText(data: FollowupData): string {
  return [
    `Dobry den, ${data.recipientName},`,
    "",
    `dekuji za schuzku a moznost prohlédnout Vase vozidlo ${data.vehicleName}.`,
    "",
    "Vozidlo jsem zadal do systemu a bude inzerovano na prednich portalech.",
    "Budu Vas pravidelne informovat o prubehu prodeje — poctu zobrazeni, dotazech od zajemcu",
    "a pripadnych nabidkach.",
    "",
    data.customText || "",
    "",
    "V pripade jakychkoliv dotazu me nevanejte kontaktovat.",
    generateSignatureText(data.broker),
  ]
    .filter(Boolean)
    .join("\n");
}

export function followupSubject(data: FollowupData): string {
  return `${data.vehicleName} — auto jsem zadal do systemu | Carmakler`;
}
