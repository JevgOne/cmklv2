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
      Dobrý den, ${data.recipientName},
    </p>
    <p style="margin: 0 0 16px; font-size: 15px; color: #374151; line-height: 1.6;">
      jmenuji se ${data.broker.firstName} ${data.broker.lastName} a jsem certifikovaný makléř Carmakler.
      Rád bych Vám představil, jak Vám můžeme pomoci s prodejem Vašeho vozidla.
    </p>
    ${data.customText ? `<p style="margin: 0 0 16px; font-size: 15px; color: #374151; line-height: 1.6;">${data.customText}</p>` : ""}
    <h3 style="margin: 24px 0 12px; font-size: 16px; color: #111827;">Jak Carmakler funguje:</h3>
    <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom: 20px;">
      <tr><td style="padding: 8px 0; font-size: 14px; color: #374151;">&#10003; Bezplatně nafotíme a zadáme Vaše auto na přední portály</td></tr>
      <tr><td style="padding: 8px 0; font-size: 14px; color: #374151;">&#10003; Inzerujeme na předních portálech (Sauto, Bazoš, TipCars...)</td></tr>
      <tr><td style="padding: 8px 0; font-size: 14px; color: #374151;">&#10003; Auto zůstává u Vás, můžete ho používat</td></tr>
      <tr><td style="padding: 8px 0; font-size: 14px; color: #374151;">&#10003; Platíte pouze provizi z úspěšného prodeje</td></tr>
    </table>
    <h3 style="margin: 24px 0 12px; font-size: 16px; color: #111827;">Proč Carmakler:</h3>
    <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom: 20px;">
      <tr><td style="padding: 8px 0; font-size: 14px; color: #374151;">&#8226; Síť certifikovaných makléřů po celé ČR</td></tr>
      <tr><td style="padding: 8px 0; font-size: 14px; color: #374151;">&#8226; Profesionální fotografie a popis vozidla</td></tr>
      <tr><td style="padding: 8px 0; font-size: 14px; color: #374151;">&#8226; Kompletní servis od nacenění po předání</td></tr>
    </table>
    <p style="margin: 0 0 16px; font-size: 15px; color: #374151; line-height: 1.6;">
      Budu rád, když mi zavoláte nebo odpovídejte na tento email.
    </p>
  `;
  return emailLayout(content, generateSignatureHtml(data.broker));
}

export function presentationText(data: PresentationData): string {
  return [
    `Dobrý den, ${data.recipientName},`,
    "",
    `jmenuji se ${data.broker.firstName} ${data.broker.lastName} a jsem certifikovaný makléř Carmakler.`,
    "Rád bych Vám představil, jak Vám můžeme pomoci s prodejem Vašeho vozidla.",
    "",
    data.customText || "",
    "",
    "Jak Carmakler funguje:",
    "- Bezplatně nafotíme a zadáme Vaše auto na přední portály",
    "- Inzerujeme na předních portálech (Sauto, Bazoš, TipCars...)",
    "- Auto zůstává u Vás, můžete ho používat",
    "- Platíte pouze provizi z úspěšného prodeje",
    "",
    "Proč Carmakler:",
    "- Síť certifikovaných makléřů po celé ČR",
    "- Profesionální fotografie a popis vozidla",
    "- Kompletní servis od nacenění po předání",
    "",
    "Budu rád, když mi zavoláte nebo odpovídejte na tento email.",
    generateSignatureText(data.broker),
  ]
    .filter(Boolean)
    .join("\n");
}

export function presentationSubject(data: PresentationData): string {
  return `Představení Carmakler — ${data.broker.firstName} ${data.broker.lastName}`;
}
