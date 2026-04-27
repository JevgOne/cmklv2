import { emailLayout, formatCzk, escapeHtml } from "./layout";
import { companySignatureHtml, companySignatureText } from "./company-signature";

export interface MarketplaceNegotiationData {
  recipientName: string;
  dealerName: string;
  carTitle: string;
  dealerSharePct: number;
  investorSharePct: number;
  message?: string | null;
  action: "NEW_OFFER" | "COUNTER" | "ACCEPTED" | "REJECTED";
  link: string;
}

const ACTION_TITLES: Record<MarketplaceNegotiationData["action"], string> = {
  NEW_OFFER: "Nová nabídka na rozdělení zisku",
  COUNTER: "Protinabídka na rozdělení zisku",
  ACCEPTED: "Nabídka přijata!",
  REJECTED: "Nabídka zamítnuta",
};

export function marketplaceNegotiationSubject(
  data: MarketplaceNegotiationData,
): string {
  return `${ACTION_TITLES[data.action]} — ${data.carTitle} | Carmakler Marketplace`;
}

export function marketplaceNegotiationHtml(
  data: MarketplaceNegotiationData,
): string {
  const actionTitle = ACTION_TITLES[data.action];
  const isPositive = data.action === "ACCEPTED";
  const isNegative = data.action === "REJECTED";
  const borderColor = isPositive ? "#22c55e" : isNegative ? "#ef4444" : "#F97316";

  const content = `
    <h1 style="margin: 0 0 16px; font-size: 24px; color: #111827; font-weight: 700;">
      ${escapeHtml(actionTitle)}
    </h1>

    <p style="margin: 0 0 12px; font-size: 15px; color: #374151; line-height: 1.6;">
      Dobrý den ${escapeHtml(data.recipientName)},
    </p>

    <p style="margin: 0 0 20px; font-size: 15px; color: #374151; line-height: 1.6;">
      ${data.action === "NEW_OFFER" || data.action === "COUNTER"
        ? `${escapeHtml(data.dealerName)} poslal${data.action === "COUNTER" ? "(a) protinabídku" : "(a) nabídku"} na rozdělení zisku pro <strong>${escapeHtml(data.carTitle)}</strong>.`
        : data.action === "ACCEPTED"
        ? `Nabídka na rozdělení zisku pro <strong>${escapeHtml(data.carTitle)}</strong> byla přijata!`
        : `Nabídka na rozdělení zisku pro <strong>${escapeHtml(data.carTitle)}</strong> byla zamítnuta.`
      }
    </p>

    <table cellpadding="0" cellspacing="0" border="0" width="100%"
           style="margin: 24px 0; background-color: #f9fafb; border-radius: 8px; border-left: 4px solid ${borderColor};">
      <tr>
        <td style="padding: 20px;">
          <h2 style="margin: 0 0 12px; font-size: 16px; color: #111827; font-weight: 600;">
            Navržené rozdělení
          </h2>
          <table cellpadding="4" cellspacing="0" border="0" style="font-size: 14px; color: #374151;">
            <tr>
              <td style="padding-right: 24px;">Realizátor:</td>
              <td style="font-weight: 700;">${data.dealerSharePct}%</td>
            </tr>
            <tr>
              <td style="padding-right: 24px;">Investor:</td>
              <td style="font-weight: 700;">${data.investorSharePct}%</td>
            </tr>
          </table>
          ${data.message ? `<p style="margin: 12px 0 0; font-size: 13px; color: #6b7280; font-style: italic;">"${escapeHtml(data.message)}"</p>` : ""}
        </td>
      </tr>
    </table>

    <table cellpadding="0" cellspacing="0" border="0" style="margin: 24px 0;">
      <tr>
        <td style="background-color: #F97316; border-radius: 8px;">
          <a href="${escapeHtml(data.link)}"
             style="display: inline-block; padding: 14px 28px; color: #ffffff; font-size: 15px; font-weight: 600; text-decoration: none;">
            Zobrazit detail
          </a>
        </td>
      </tr>
    </table>
  `;

  return emailLayout(content, companySignatureHtml());
}

export function marketplaceNegotiationText(
  data: MarketplaceNegotiationData,
): string {
  return [
    `Dobrý den ${data.recipientName},`,
    "",
    `${ACTION_TITLES[data.action]} — ${data.carTitle}`,
    "",
    `Realizátor: ${data.dealerSharePct}%`,
    `Investor: ${data.investorSharePct}%`,
    data.message ? `Zpráva: "${data.message}"` : "",
    "",
    `Detail: ${data.link}`,
    "",
    companySignatureText(),
  ]
    .filter(Boolean)
    .join("\n");
}
