import { emailLayout, escapeHtml } from "./layout";
import { companySignatureHtml, companySignatureText } from "./company-signature";

export interface MarketplaceApplicationConfirmationData {
  firstName: string;
  role: "VERIFIED_DEALER" | "INVESTOR";
}

const ROLE_LABELS: Record<MarketplaceApplicationConfirmationData["role"], string> = {
  VERIFIED_DEALER: "realizátora (dealera)",
  INVESTOR: "investora",
};

export function marketplaceApplicationConfirmationSubject(): string {
  return "Vaše žádost o přístup k marketplace byla přijata | Carmakler";
}

export function marketplaceApplicationConfirmationHtml(
  data: MarketplaceApplicationConfirmationData,
): string {
  const roleLabel = ROLE_LABELS[data.role];

  const content = `
    <h1 style="margin: 0 0 16px; font-size: 24px; color: #111827; font-weight: 700;">
      Děkujeme za zájem o marketplace!
    </h1>

    <p style="margin: 0 0 12px; font-size: 15px; color: #374151; line-height: 1.6;">
      Dobrý den ${escapeHtml(data.firstName)},
    </p>

    <p style="margin: 0 0 20px; font-size: 15px; color: #374151; line-height: 1.6;">
      přijali jsme vaši žádost o přístup k naší investiční platformě v roli
      <strong>${escapeHtml(roleLabel)}</strong>. Náš tým váš profil ověří
      a ozve se vám <strong>do 48 hodin</strong>.
    </p>

    <table cellpadding="0" cellspacing="0" border="0" width="100%"
           style="margin: 24px 0; background-color: #fff7ed; border-radius: 8px; border-left: 4px solid #F97316;">
      <tr>
        <td style="padding: 20px;">
          <h2 style="margin: 0 0 12px; font-size: 16px; color: #111827; font-weight: 600;">
            Co bude následovat?
          </h2>
          <ol style="margin: 0; padding-left: 20px; font-size: 14px; color: #374151; line-height: 1.8;">
            <li>Ověříme vaše údaje (IČO, kontaktní informace, reference).</li>
            <li>Kontaktujeme vás telefonicky nebo emailem pro osobní seznámení.</li>
            <li>Po schválení vám vytvoříme účet s přístupem k marketplace.</li>
            <li>Obdržíte welcome email s přihlašovacími údaji a návodem.</li>
          </ol>
        </td>
      </tr>
    </table>

    <p style="margin: 20px 0; font-size: 14px; color: #374151; line-height: 1.6;">
      Máte-li dotazy, kontaktujte nás na
      <a href="mailto:info@carmakler.cz" style="color: #F97316; text-decoration: none;">info@carmakler.cz</a>.
    </p>

    <p style="margin: 20px 0 0; font-size: 14px; color: #6b7280; line-height: 1.6;">
      Mezitím si můžete prohlédnout, jak marketplace funguje, na
      <a href="https://carmakler.cz/marketplace" style="color: #F97316; text-decoration: none;">carmakler.cz/marketplace</a>.
    </p>
  `;

  return emailLayout(content, companySignatureHtml());
}

export function marketplaceApplicationConfirmationText(
  data: MarketplaceApplicationConfirmationData,
): string {
  const roleLabel = ROLE_LABELS[data.role];

  return [
    `Dobrý den ${data.firstName},`,
    "",
    `přijali jsme vaši žádost o přístup k marketplace v roli ${roleLabel}.`,
    "Náš tým váš profil ověří a ozve se vám do 48 hodin.",
    "",
    "--- CO BUDE NÁSLEDOVAT ---",
    "1. Ověříme vaše údaje (IČO, kontaktní informace, reference).",
    "2. Kontaktujeme vás telefonicky nebo emailem pro osobní seznámení.",
    "3. Po schválení vám vytvoříme účet s přístupem k marketplace.",
    "4. Obdržíte welcome email s přihlašovacími údaji a návodem.",
    "",
    "Máte-li dotazy, kontaktujte nás na info@carmakler.cz.",
    "",
    "Mezitím si můžete prohlédnout, jak marketplace funguje, na:",
    "https://carmakler.cz/marketplace",
    "",
    companySignatureText(),
  ].join("\n");
}
