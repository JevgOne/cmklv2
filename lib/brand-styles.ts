/**
 * Sdílené brand konstanty pro všechny dokumenty, emaily a PDF.
 * Jeden zdroj pravdy pro celý vizuální styl Carmakler.
 */

export const brand = {
  colors: {
    orange: "#F97316",
    orangeDark: "#ea580c",
    dark: "#1a1a2e",
    darkBlue: "#16213e",
    white: "#ffffff",
    gray50: "#f9fafb",
    gray100: "#f3f4f6",
    gray200: "#e5e7eb",
    gray400: "#9ca3af",
    gray500: "#6b7280",
    gray600: "#4b5563",
    gray700: "#374151",
    gray900: "#111827",
  },
  fonts: {
    primary: "'Outfit', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
  },
  company: {
    name: "Carmakler s.r.o.",
    web: "carmakler.cz",
    email: "info@carmakler.cz",
    emailPartners: "partneri@carmakler.cz",
    phone: "+420 123 456 789",
    address: "Praha, Česká republika",
  },
} as const;

/** CSS pro tisk dokumentů (smlouvy, protokoly) — A4 portrait */
export function documentCSS(): string {
  return `
    @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap');
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: ${brand.fonts.primary};
      color: ${brand.colors.gray900};
      font-size: 11pt;
      line-height: 1.6;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    @page { size: A4; margin: 20mm 25mm; }
    .doc-page {
      max-width: 170mm;
      margin: 0 auto;
    }
    .doc-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding-bottom: 16px;
      border-bottom: 3px solid ${brand.colors.orange};
      margin-bottom: 24px;
    }
    .doc-header .logo { height: 40px; }
    .doc-header .meta { text-align: right; font-size: 9pt; color: ${brand.colors.gray500}; }
    .doc-title {
      font-size: 22pt;
      font-weight: 800;
      color: ${brand.colors.dark};
      margin-bottom: 8px;
    }
    .doc-subtitle {
      font-size: 10pt;
      color: ${brand.colors.gray500};
      margin-bottom: 24px;
    }
    .doc-section {
      margin-bottom: 20px;
      page-break-inside: avoid;
    }
    .doc-section-heading {
      font-size: 12pt;
      font-weight: 700;
      color: ${brand.colors.dark};
      padding: 6px 12px;
      background: ${brand.colors.gray100};
      border-left: 4px solid ${brand.colors.orange};
      margin-bottom: 10px;
    }
    .doc-section-content {
      font-size: 10.5pt;
      line-height: 1.7;
      color: ${brand.colors.gray700};
      white-space: pre-line;
      padding-left: 12px;
    }
    .doc-signatures {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 40px;
      margin-top: 40px;
      padding-top: 20px;
      border-top: 2px solid ${brand.colors.gray200};
    }
    .doc-sig-block { text-align: center; }
    .doc-sig-block .label {
      font-size: 9pt;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: ${brand.colors.gray500};
      margin-bottom: 8px;
    }
    .doc-sig-block .sig-area {
      height: 60px;
      border-bottom: 1px solid ${brand.colors.gray400};
      margin-bottom: 8px;
    }
    .doc-sig-block .sig-area img {
      max-height: 55px;
      max-width: 150px;
      object-fit: contain;
    }
    .doc-sig-block .name {
      font-size: 10pt;
      font-weight: 600;
      color: ${brand.colors.gray900};
    }
    .doc-footer {
      margin-top: 40px;
      padding-top: 12px;
      border-top: 1px solid ${brand.colors.gray200};
      text-align: center;
      font-size: 8pt;
      color: ${brand.colors.gray400};
    }
    .doc-footer span { color: ${brand.colors.orange}; }
  `;
}

/** HTML layout pro smlouvy a protokoly */
export function documentHTML(opts: {
  title: string;
  contractNumber?: string;
  date: string;
  sections: { heading: string; content: string }[];
  sellerSignature?: string | null;
  sellerName?: string;
  brokerSignature?: string | null;
  brokerName?: string;
  signedAt?: string | null;
}): string {
  const sectionsHtml = opts.sections
    .map(
      (s) => `
    <div class="doc-section">
      <div class="doc-section-heading">${s.heading}</div>
      <div class="doc-section-content">${s.content}</div>
    </div>`
    )
    .join("\n");

  const sigHtml =
    opts.sellerSignature || opts.brokerSignature
      ? `
    <div class="doc-signatures">
      <div class="doc-sig-block">
        <div class="label">Prodejce</div>
        <div class="sig-area">${opts.sellerSignature ? `<img src="${opts.sellerSignature}" alt="Podpis" />` : ""}</div>
        <div class="name">${opts.sellerName || ""}</div>
      </div>
      <div class="doc-sig-block">
        <div class="label">Makléř</div>
        <div class="sig-area">${opts.brokerSignature ? `<img src="${opts.brokerSignature}" alt="Podpis" />` : ""}</div>
        <div class="name">${opts.brokerName || ""}</div>
      </div>
    </div>
    ${opts.signedAt ? `<p style="text-align: center; font-size: 8pt; color: ${brand.colors.gray400}; margin-top: 8px;">Podepsáno: ${new Date(opts.signedAt).toLocaleString("cs-CZ")}</p>` : ""}`
      : `
    <div class="doc-signatures">
      <div class="doc-sig-block">
        <div class="label">Prodejce</div>
        <div class="sig-area"></div>
        <div class="name">${opts.sellerName || "________________"}</div>
      </div>
      <div class="doc-sig-block">
        <div class="label">Makléř</div>
        <div class="sig-area"></div>
        <div class="name">${opts.brokerName || "________________"}</div>
      </div>
    </div>`;

  return `<!DOCTYPE html>
<html lang="cs">
<head>
  <meta charset="UTF-8" />
  <title>${opts.title}</title>
  <style>${documentCSS()}</style>
</head>
<body>
  <div class="doc-page">
    <div class="doc-header">
      <div>
        <div class="doc-title">${opts.title}</div>
        <div class="doc-subtitle">${opts.contractNumber ? `Č. smlouvy: ${opts.contractNumber} | ` : ""}${opts.date}</div>
      </div>
      <div class="meta">
        <strong style="color: ${brand.colors.orange}; font-size: 14pt;">CarMakléř</strong><br />
        ${brand.company.web}<br />
        ${brand.company.email}
      </div>
    </div>

    ${sectionsHtml}
    ${sigHtml}

    <div class="doc-footer">
      ${brand.company.name} | ${brand.company.web} | <span>${brand.company.email}</span> | ${brand.company.phone}
    </div>
  </div>
</body>
</html>`;
}

/** HTML layout pro emaily */
export function emailLayoutHTML(content: string, signatureHtml: string): string {
  return `<!DOCTYPE html>
<html lang="cs">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>CarMakléř</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f3f4f6; font-family: ${brand.fonts.primary};">
  <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #f3f4f6;">
    <tr>
      <td align="center" style="padding: 24px 16px;">
        <table cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background: ${brand.colors.dark}; padding: 24px 32px; text-align: center;">
              <h1 style="margin: 0; font-size: 22px; font-weight: 700; color: #ffffff; letter-spacing: -0.5px;">
                Car<span style="color: ${brand.colors.orange};">Makléř</span>
              </h1>
            </td>
          </tr>
          <!-- Orange accent line -->
          <tr>
            <td style="height: 4px; background: linear-gradient(90deg, ${brand.colors.orange}, ${brand.colors.orangeDark}, ${brand.colors.orange});"></td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="padding: 32px;">
              ${content}
              ${signatureHtml}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding: 20px 32px; background-color: ${brand.colors.dark}; text-align: center;">
              <p style="margin: 0; font-size: 12px; color: rgba(255,255,255,0.5);">
                ${brand.company.name} | ${brand.company.address}
              </p>
              <p style="margin: 4px 0 0; font-size: 12px;">
                <a href="https://${brand.company.web}" style="color: ${brand.colors.orange}; text-decoration: none;">${brand.company.web}</a>
                &nbsp;|&nbsp;
                <a href="mailto:${brand.company.email}" style="color: ${brand.colors.orange}; text-decoration: none;">${brand.company.email}</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
