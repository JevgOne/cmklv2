import { emailLayout, escapeHtml } from "./layout";
import { companySignatureHtml, companySignatureText } from "./company-signature";

export interface MarketplaceRepairUpdateData {
  recipientName: string;
  carTitle: string;
  milestoneName: string;
  progressPct: number;
  note?: string | null;
  link: string;
}

export function marketplaceRepairUpdateSubject(
  data: MarketplaceRepairUpdateData,
): string {
  return `Oprava ${data.carTitle} — ${data.progressPct}% | Carmakler Marketplace`;
}

export function marketplaceRepairUpdateHtml(
  data: MarketplaceRepairUpdateData,
): string {
  const progressColor = data.progressPct >= 75 ? "#22c55e" : data.progressPct >= 50 ? "#eab308" : "#F97316";

  const content = `
    <h1 style="margin: 0 0 16px; font-size: 24px; color: #111827; font-weight: 700;">
      Nový milník opravy
    </h1>

    <p style="margin: 0 0 12px; font-size: 15px; color: #374151; line-height: 1.6;">
      Dobrý den ${escapeHtml(data.recipientName)},
    </p>

    <p style="margin: 0 0 20px; font-size: 15px; color: #374151; line-height: 1.6;">
      Realizátor přidal nový milník opravy pro <strong>${escapeHtml(data.carTitle)}</strong>.
    </p>

    <table cellpadding="0" cellspacing="0" border="0" width="100%"
           style="margin: 24px 0; background-color: #f9fafb; border-radius: 8px; border-left: 4px solid ${progressColor};">
      <tr>
        <td style="padding: 20px;">
          <h2 style="margin: 0 0 8px; font-size: 16px; color: #111827; font-weight: 600;">
            ${escapeHtml(data.milestoneName)}
          </h2>
          <!-- Progress bar -->
          <div style="background-color: #e5e7eb; border-radius: 9999px; height: 12px; margin: 12px 0;">
            <div style="background-color: ${progressColor}; border-radius: 9999px; height: 12px; width: ${data.progressPct}%;"></div>
          </div>
          <p style="margin: 4px 0 0; font-size: 14px; color: #374151; font-weight: 600;">
            Celkový postup: ${data.progressPct}%
          </p>
          ${data.note ? `<p style="margin: 12px 0 0; font-size: 13px; color: #6b7280; font-style: italic;">"${escapeHtml(data.note)}"</p>` : ""}
        </td>
      </tr>
    </table>

    <table cellpadding="0" cellspacing="0" border="0" style="margin: 24px 0;">
      <tr>
        <td style="background-color: #F97316; border-radius: 8px;">
          <a href="${escapeHtml(data.link)}"
             style="display: inline-block; padding: 14px 28px; color: #ffffff; font-size: 15px; font-weight: 600; text-decoration: none;">
            Zobrazit detail opravy
          </a>
        </td>
      </tr>
    </table>
  `;

  return emailLayout(content, companySignatureHtml());
}

export function marketplaceRepairUpdateText(
  data: MarketplaceRepairUpdateData,
): string {
  return [
    `Dobrý den ${data.recipientName},`,
    "",
    `Nový milník opravy pro ${data.carTitle}:`,
    `${data.milestoneName} — ${data.progressPct}% hotovo`,
    data.note ? `Poznámka: "${data.note}"` : "",
    "",
    `Detail: ${data.link}`,
    "",
    companySignatureText(),
  ]
    .filter(Boolean)
    .join("\n");
}
