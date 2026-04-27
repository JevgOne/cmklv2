import { emailLayout, formatCzk, escapeHtml } from "./layout";
import { companySignatureHtml, companySignatureText } from "./company-signature";

export interface MarketplacePayoutData {
  recipientName: string;
  carTitle: string;
  investedAmount: number;
  returnAmount: number;
  profit: number;
  roi: number;
  link: string;
}

export function marketplacePayoutSubject(
  data: MarketplacePayoutData,
): string {
  return `Výplata zisku �� ${data.carTitle} | Carmakler Marketplace`;
}

export function marketplacePayoutHtml(
  data: MarketplacePayoutData,
): string {
  const isProfit = data.profit > 0;

  const content = `
    <h1 style="margin: 0 0 16px; font-size: 24px; color: #111827; font-weight: 700;">
      ${isProfit ? "Výplata zisku" : "Vyúčtování investice"}
    </h1>

    <p style="margin: 0 0 12px; font-size: 15px; color: #374151; line-height: 1.6;">
      Dobrý den ${escapeHtml(data.recipientName)},
    </p>

    <p style="margin: 0 0 20px; font-size: 15px; color: #374151; line-height: 1.6;">
      Flip <strong>${escapeHtml(data.carTitle)}</strong> byl úspěšně dokončen
      a vaše investice byla vyúčtována.
    </p>

    <table cellpadding="0" cellspacing="0" border="0" width="100%"
           style="margin: 24px 0; background-color: ${isProfit ? "#f0fdf4" : "#fef2f2"}; border-radius: 8px; border-left: 4px solid ${isProfit ? "#22c55e" : "#ef4444"};">
      <tr>
        <td style="padding: 20px;">
          <h2 style="margin: 0 0 12px; font-size: 16px; color: #111827; font-weight: 600;">
            Souhrn
          </h2>
          <table cellpadding="4" cellspacing="0" border="0" style="font-size: 14px; color: #374151;">
            <tr>
              <td style="padding-right: 24px;">Investováno:</td>
              <td style="font-weight: 600;">${formatCzk(data.investedAmount)}</td>
            </tr>
            <tr>
              <td style="padding-right: 24px;">Vráceno celkem:</td>
              <td style="font-weight: 700; color: ${isProfit ? "#16a34a" : "#dc2626"};">${formatCzk(data.returnAmount)}</td>
            </tr>
            <tr>
              <td style="padding-right: 24px;">${isProfit ? "Zisk" : "Ztráta"}:</td>
              <td style="font-weight: 700; color: ${isProfit ? "#16a34a" : "#dc2626"};">
                ${isProfit ? "+" : ""}${formatCzk(data.profit)} (${data.roi > 0 ? "+" : ""}${data.roi}%)
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <p style="margin: 20px 0; font-size: 14px; color: #374151; line-height: 1.6;">
      Výplata bude připsána na váš účet do 5 pracovních dní.
    </p>

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

export function marketplacePayoutText(
  data: MarketplacePayoutData,
): string {
  return [
    `Dobrý den ${data.recipientName},`,
    "",
    `Flip ${data.carTitle} byl dokončen.`,
    "",
    `Investováno: ${formatCzk(data.investedAmount)}`,
    `Vráceno celkem: ${formatCzk(data.returnAmount)}`,
    `${data.profit > 0 ? "Zisk" : "Ztráta"}: ${data.profit > 0 ? "+" : ""}${formatCzk(data.profit)} (${data.roi > 0 ? "+" : ""}${data.roi}%)`,
    "",
    "Výplata bude připsána na váš účet do 5 pracovních dní.",
    "",
    `Detail: ${data.link}`,
    "",
    companySignatureText(),
  ].join("\n");
}
