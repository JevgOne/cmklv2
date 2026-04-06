import { emailLayout, escapeHtml } from "./layout";
import { companySignatureHtml, companySignatureText } from "./company-signature";

export interface MarketplaceApplicationAdminData {
  applicationId: string;
  role: "VERIFIED_DEALER" | "INVESTOR";
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  companyName: string | null;
  ico: string | null;
  investmentRange: string | null;
  message: string;
  createdAtIso: string;
  ipAddress: string | null;
  adminPanelUrl: string;
}

const ROLE_LABELS: Record<MarketplaceApplicationAdminData["role"], string> = {
  VERIFIED_DEALER: "Realizátor (dealer)",
  INVESTOR: "Investor",
};

const INVESTMENT_RANGE_LABELS: Record<string, string> = {
  "10k-50k": "10 000 – 50 000 Kč",
  "50k-200k": "50 000 – 200 000 Kč",
  "200k-1M": "200 000 – 1 000 000 Kč",
  "1M+": "1 000 000+ Kč",
};

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("cs-CZ", {
    day: "numeric",
    month: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function marketplaceApplicationAdminSubject(
  data: MarketplaceApplicationAdminData,
): string {
  return `Nová marketplace žádost — ${ROLE_LABELS[data.role]} — ${data.firstName} ${data.lastName}`;
}

export function marketplaceApplicationAdminHtml(
  data: MarketplaceApplicationAdminData,
): string {
  const roleLabel = ROLE_LABELS[data.role];
  const investmentLabel = data.investmentRange
    ? (INVESTMENT_RANGE_LABELS[data.investmentRange] ?? data.investmentRange)
    : null;

  const dealerRows =
    data.role === "VERIFIED_DEALER"
      ? `
        <tr>
          <td style="padding: 8px 0; font-size: 14px; color: #6b7280;">Název firmy</td>
          <td style="padding: 8px 0; font-size: 14px; color: #111827; font-weight: 600; text-align: right;">
            ${escapeHtml(data.companyName ?? "—")}
          </td>
        </tr>
        <tr>
          <td style="padding: 8px 0; font-size: 14px; color: #6b7280;">IČO</td>
          <td style="padding: 8px 0; font-size: 14px; color: #111827; font-weight: 600; text-align: right; font-family: monospace;">
            ${escapeHtml(data.ico ?? "—")}
          </td>
        </tr>
      `
      : "";

  const investorRows =
    data.role === "INVESTOR" && investmentLabel
      ? `
        <tr>
          <td style="padding: 8px 0; font-size: 14px; color: #6b7280;">Rozsah investice</td>
          <td style="padding: 8px 0; font-size: 14px; color: #111827; font-weight: 600; text-align: right;">
            ${escapeHtml(investmentLabel)}
          </td>
        </tr>
      `
      : "";

  const content = `
    <h1 style="margin: 0 0 16px; font-size: 22px; color: #111827; font-weight: 700;">
      Nová žádost o přístup k marketplace
    </h1>

    <p style="margin: 0 0 20px; font-size: 15px; color: #374151; line-height: 1.6;">
      Byla podána nová žádost o přístup k marketplace platformě.
      Role: <strong>${escapeHtml(roleLabel)}</strong>.
    </p>

    <table cellpadding="0" cellspacing="0" border="0" width="100%"
           style="margin: 20px 0; background-color: #f9fafb; border-radius: 8px;">
      <tr>
        <td style="padding: 20px;">
          <h2 style="margin: 0 0 12px; font-size: 16px; color: #111827; font-weight: 600;">
            Kontaktní údaje
          </h2>
          <table cellpadding="0" cellspacing="0" border="0" width="100%">
            <tr>
              <td style="padding: 8px 0; font-size: 14px; color: #6b7280;">Jméno</td>
              <td style="padding: 8px 0; font-size: 14px; color: #111827; font-weight: 600; text-align: right;">
                ${escapeHtml(data.firstName)} ${escapeHtml(data.lastName)}
              </td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-size: 14px; color: #6b7280;">Email</td>
              <td style="padding: 8px 0; font-size: 14px; color: #111827; font-weight: 600; text-align: right;">
                <a href="mailto:${escapeHtml(data.email)}" style="color: #F97316; text-decoration: none;">
                  ${escapeHtml(data.email)}
                </a>
              </td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-size: 14px; color: #6b7280;">Telefon</td>
              <td style="padding: 8px 0; font-size: 14px; color: #111827; font-weight: 600; text-align: right;">
                ${escapeHtml(data.phone)}
              </td>
            </tr>
            ${dealerRows}
            ${investorRows}
          </table>
        </td>
      </tr>
    </table>

    <h2 style="margin: 24px 0 8px; font-size: 16px; color: #111827; font-weight: 600;">
      Zpráva od žadatele
    </h2>
    <div style="padding: 16px; background: #fff; border-left: 4px solid #F97316; border-radius: 4px; font-size: 14px; color: #374151; line-height: 1.6; white-space: pre-wrap;">
      ${escapeHtml(data.message)}
    </div>

    <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-top: 20px; font-size: 13px; color: #9ca3af;">
      <tr>
        <td style="padding: 4px 0;">ID žádosti</td>
        <td style="padding: 4px 0; text-align: right; font-family: monospace;">${escapeHtml(data.applicationId)}</td>
      </tr>
      <tr>
        <td style="padding: 4px 0;">Odesláno</td>
        <td style="padding: 4px 0; text-align: right;">${escapeHtml(formatDateTime(data.createdAtIso))}</td>
      </tr>
      ${
        data.ipAddress
          ? `
        <tr>
          <td style="padding: 4px 0;">IP adresa</td>
          <td style="padding: 4px 0; text-align: right; font-family: monospace;">${escapeHtml(data.ipAddress)}</td>
        </tr>
      `
          : ""
      }
    </table>

    <p style="margin: 24px 0;">
      <a href="${escapeHtml(data.adminPanelUrl)}"
         style="background: #F97316; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 600; font-size: 15px;">
        Otevřít v admin panelu
      </a>
    </p>
  `;

  return emailLayout(content, companySignatureHtml());
}

export function marketplaceApplicationAdminText(
  data: MarketplaceApplicationAdminData,
): string {
  const roleLabel = ROLE_LABELS[data.role];
  const investmentLabel = data.investmentRange
    ? (INVESTMENT_RANGE_LABELS[data.investmentRange] ?? data.investmentRange)
    : null;

  const lines = [
    "=== NOVÁ MARKETPLACE ŽÁDOST ===",
    "",
    `Role: ${roleLabel}`,
    `Jméno: ${data.firstName} ${data.lastName}`,
    `Email: ${data.email}`,
    `Telefon: ${data.phone}`,
  ];

  if (data.role === "VERIFIED_DEALER") {
    lines.push(`Název firmy: ${data.companyName ?? "—"}`);
    lines.push(`IČO: ${data.ico ?? "—"}`);
  }

  if (data.role === "INVESTOR" && investmentLabel) {
    lines.push(`Rozsah investice: ${investmentLabel}`);
  }

  lines.push(
    "",
    "--- ZPRÁVA ---",
    data.message,
    "",
    "--- METADATA ---",
    `ID žádosti: ${data.applicationId}`,
    `Odesláno: ${formatDateTime(data.createdAtIso)}`,
  );

  if (data.ipAddress) {
    lines.push(`IP: ${data.ipAddress}`);
  }

  lines.push(
    "",
    `Admin panel: ${data.adminPanelUrl}`,
    "",
    companySignatureText(),
  );

  return lines.join("\n");
}
