import { companyInfo } from "@/lib/company-info";

/**
 * Company signature pro automatizované emaily (objednávky, potvrzení, faktury, ...)
 * — tam kde není přidělen broker.
 *
 * Paralela k `signature.ts` (BrokerSignatureData), používá data z `lib/company-info.ts`.
 */
export function companySignatureHtml(): string {
  const webHost = companyInfo.web.url.replace(/^https?:\/\//, "");
  return `
    <table cellpadding="0" cellspacing="0" border="0" width="100%"
           style="margin-top: 32px; border-top: 1px solid #e5e7eb; padding-top: 16px;">
      <tr>
        <td style="padding: 0; font-size: 14px; color: #374151; line-height: 1.6;">
          <p style="margin: 0 0 4px; font-weight: 600; color: #111827;">
            ${companyInfo.legalName}
          </p>
          <p style="margin: 0 0 2px; color: #6b7280; font-size: 13px;">
            ${companyInfo.address.full}
          </p>
          <p style="margin: 0; font-size: 13px;">
            <a href="${companyInfo.contact.emailHref}"
               style="color: #F97316; text-decoration: none;">
              ${companyInfo.contact.email}
            </a>
            &nbsp;·&nbsp;
            <a href="${companyInfo.web.url}"
               style="color: #F97316; text-decoration: none;">
              ${webHost}
            </a>
          </p>
        </td>
      </tr>
    </table>
  `;
}

export function companySignatureText(): string {
  return [
    "",
    "---",
    companyInfo.legalName,
    companyInfo.address.full,
    companyInfo.contact.email,
    companyInfo.web.url,
  ].join("\n");
}
