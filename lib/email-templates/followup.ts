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
      Dobrý den, ${data.recipientName},
    </p>
    <p style="margin: 0 0 16px; font-size: 15px; color: #374151; line-height: 1.6;">
      děkuji za schůzku a možnost prohlédnout Vaše vozidlo <strong>${data.vehicleName}</strong>.
    </p>
    <p style="margin: 0 0 16px; font-size: 15px; color: #374151; line-height: 1.6;">
      Vozidlo jsem zadal do systému a bude inzerováno na předních portálech.
      Budu Vás pravidelně informovat o průběhu prodeje — počtu zobrazení, dotazech od zájemců
      a případných nabídkách.
    </p>
    ${data.customText ? `<p style="margin: 0 0 16px; font-size: 15px; color: #374151; line-height: 1.6;">${data.customText}</p>` : ""}
    <p style="margin: 0 0 16px; font-size: 15px; color: #374151; line-height: 1.6;">
      V případě jakýchkoliv dotazů mě neváhejte kontaktovat.
    </p>
  `;
  return emailLayout(content, generateSignatureHtml(data.broker));
}

export function followupText(data: FollowupData): string {
  return [
    `Dobrý den, ${data.recipientName},`,
    "",
    `děkuji za schůzku a možnost prohlédnout Vaše vozidlo ${data.vehicleName}.`,
    "",
    "Vozidlo jsem zadal do systému a bude inzerováno na předních portálech.",
    "Budu Vás pravidelně informovat o průběhu prodeje — počtu zobrazení, dotazech od zájemců",
    "a případných nabídkách.",
    "",
    data.customText || "",
    "",
    "V případě jakýchkoliv dotazů mě neváhejte kontaktovat.",
    generateSignatureText(data.broker),
  ]
    .filter(Boolean)
    .join("\n");
}

export function followupSubject(data: FollowupData): string {
  return `${data.vehicleName} — auto jsem zadal do systému | Carmakler`;
}
