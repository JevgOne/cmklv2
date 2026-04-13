import { emailLayout, escapeHtml } from "./layout";
import { companySignatureHtml, companySignatureText } from "./company-signature";

export interface StockAlertPart {
  name: string;
  stock: number;
  partNumber: string | null;
}

export interface StockAlertSupplierData {
  supplierName: string;
  parts: StockAlertPart[];
}

export function stockAlertSupplierHtml(data: StockAlertSupplierData): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://carmakler.cz";

  const rows = data.parts
    .map(
      (part) => `
        <tr>
          <td style="padding: 10px 12px; font-size: 14px; color: #111827; border: 1px solid #e5e7eb;">
            ${escapeHtml(part.name)}
          </td>
          <td style="padding: 10px 12px; font-size: 13px; color: #6b7280; border: 1px solid #e5e7eb; font-family: monospace;">
            ${escapeHtml(part.partNumber ?? "—")}
          </td>
          <td style="padding: 10px 12px; font-size: 14px; color: ${part.stock === 0 ? "#dc2626" : "#d97706"}; border: 1px solid #e5e7eb; text-align: right; font-weight: 600;">
            ${part.stock} ks
          </td>
        </tr>
      `,
    )
    .join("");

  const content = `
    <h1 style="margin: 0 0 16px; font-size: 24px; color: #111827; font-weight: 700;">
      Nízký sklad
    </h1>

    <p style="margin: 0 0 12px; font-size: 15px; color: #374151; line-height: 1.6;">
      Dobrý den ${escapeHtml(data.supplierName)},
    </p>

    <p style="margin: 0 0 20px; font-size: 15px; color: #374151; line-height: 1.6;">
      ${data.parts.length === 1 ? "1 díl má" : `${data.parts.length} dílů má`} méně než 3 kusy na skladě.
      Doporučujeme doplnit zásoby, aby vaše nabídky zůstaly aktivní.
    </p>

    <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin: 0 0 24px; border-collapse: collapse;">
      <thead>
        <tr>
          <th style="padding: 10px 12px; font-size: 13px; color: #6b7280; text-align: left; background-color: #f9fafb; border: 1px solid #e5e7eb;">Díl</th>
          <th style="padding: 10px 12px; font-size: 13px; color: #6b7280; text-align: left; background-color: #f9fafb; border: 1px solid #e5e7eb;">Part Number</th>
          <th style="padding: 10px 12px; font-size: 13px; color: #6b7280; text-align: right; background-color: #f9fafb; border: 1px solid #e5e7eb;">Sklad</th>
        </tr>
      </thead>
      <tbody>
        ${rows}
      </tbody>
    </table>

    <p style="margin: 0 0 24px;">
      <a href="${appUrl}/parts/my"
         style="background: #F97316; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 600; font-size: 15px;">
        Aktualizovat sklad
      </a>
    </p>

    <p style="margin: 0; font-size: 14px; color: #6b7280; line-height: 1.6;">
      Díly s nulovým skladem nebudou zobrazovány zákazníkům.
    </p>
  `;

  return emailLayout(content, companySignatureHtml());
}

export function stockAlertSupplierText(data: StockAlertSupplierData): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://carmakler.cz";

  const itemLines = data.parts.map(
    (p) =>
      `- ${p.name}${p.partNumber ? ` (PN: ${p.partNumber})` : ""} — ${p.stock} ks`,
  );

  const lines = [
    `Dobrý den ${data.supplierName},`,
    "",
    `${data.parts.length} dílů má méně než 3 kusy na skladě.`,
    "Doporučujeme doplnit zásoby.",
    "",
    "--- DÍLY S NÍZKÝM SKLADEM ---",
    ...itemLines,
    "",
    `Aktualizovat sklad: ${appUrl}/parts/my`,
    "",
    "Díly s nulovým skladem nebudou zobrazovány zákazníkům.",
    companySignatureText(),
  ];

  return lines.join("\n");
}
