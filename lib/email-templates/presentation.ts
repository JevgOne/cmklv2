import { emailLayout } from "./layout";
import { generateSignatureHtml, generateSignatureText, BrokerSignatureData } from "./signature";

export interface PresentationData {
  recipientName: string;
  broker: BrokerSignatureData;
  customText?: string;
}

export function presentationHtml(data: PresentationData): string {
  const content = `
    <p style="margin: 0 0 16px; font-size: 15px; color: #374151; line-height: 1.6;">
      Dobry den, ${data.recipientName},
    </p>
    <p style="margin: 0 0 16px; font-size: 15px; color: #374151; line-height: 1.6;">
      jmenuji se ${data.broker.firstName} ${data.broker.lastName} a jsem certifikovany makler Carmakler.
      Rad bych Vam predstavil, jak Vam muzeme pomoci s prodejem Vaseho vozidla.
    </p>
    ${data.customText ? `<p style="margin: 0 0 16px; font-size: 15px; color: #374151; line-height: 1.6;">${data.customText}</p>` : ""}
    <h3 style="margin: 24px 0 12px; font-size: 16px; color: #111827;">Jak Carmakler funguje:</h3>
    <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom: 20px;">
      <tr><td style="padding: 8px 0; font-size: 14px; color: #374151;">&#10003; Bezplatne nafotíme a zadame Vase auto na predni portaly</td></tr>
      <tr><td style="padding: 8px 0; font-size: 14px; color: #374151;">&#10003; Inzerujeme na predních portalech (Sauto, Bazos, TipCars...)</td></tr>
      <tr><td style="padding: 8px 0; font-size: 14px; color: #374151;">&#10003; Auto zustava u Vas, muzete ho pouzivat</td></tr>
      <tr><td style="padding: 8px 0; font-size: 14px; color: #374151;">&#10003; Platite pouze provizi z uspesneho prodeje</td></tr>
    </table>
    <h3 style="margin: 24px 0 12px; font-size: 16px; color: #111827;">Proc Carmakler:</h3>
    <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom: 20px;">
      <tr><td style="padding: 8px 0; font-size: 14px; color: #374151;">&#8226; Sit certifikovanych makleru po cele CR</td></tr>
      <tr><td style="padding: 8px 0; font-size: 14px; color: #374151;">&#8226; Profesionalni fotografie a popis vozidla</td></tr>
      <tr><td style="padding: 8px 0; font-size: 14px; color: #374151;">&#8226; Kompletni servis od naceneni po predani</td></tr>
    </table>
    <p style="margin: 0 0 16px; font-size: 15px; color: #374151; line-height: 1.6;">
      Budu rad, kdyz mi zavolate nebo odpovidejte na tento email.
    </p>
  `;
  return emailLayout(content, generateSignatureHtml(data.broker));
}

export function presentationText(data: PresentationData): string {
  return [
    `Dobry den, ${data.recipientName},`,
    "",
    `jmenuji se ${data.broker.firstName} ${data.broker.lastName} a jsem certifikovany makler Carmakler.`,
    "Rad bych Vam predstavil, jak Vam muzeme pomoci s prodejem Vaseho vozidla.",
    "",
    data.customText || "",
    "",
    "Jak Carmakler funguje:",
    "- Bezplatne nafotíme a zadame Vase auto na predni portaly",
    "- Inzerujeme na predních portalech (Sauto, Bazos, TipCars...)",
    "- Auto zustava u Vas, muzete ho pouzivat",
    "- Platite pouze provizi z uspesneho prodeje",
    "",
    "Proc Carmakler:",
    "- Sit certifikovanych makleru po cele CR",
    "- Profesionalni fotografie a popis vozidla",
    "- Kompletni servis od naceneni po predani",
    "",
    "Budu rad, kdyz mi zavolate nebo odpovidejte na tento email.",
    generateSignatureText(data.broker),
  ]
    .filter(Boolean)
    .join("\n");
}

export function presentationSubject(data: PresentationData): string {
  return `Predstaveni Carmakler — ${data.broker.firstName} ${data.broker.lastName}`;
}
