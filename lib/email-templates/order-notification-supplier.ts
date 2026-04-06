import { emailLayout, escapeHtml } from "./layout";
import { companySignatureHtml, companySignatureText } from "./company-signature";

export interface OrderNotificationSupplierData {
  orderNumber: string;
  supplierName: string;
  items: Array<{
    name: string;
    partNumber: string | null;
    quantity: number;
  }>;
  delivery: {
    method: string;
    carrier: string;
    trackingNumber: string;
    labelUrl: string;
    zasilkovnaPointName: string | null;
    address: {
      name: string;
      phone: string;
      street: string;
      city: string;
      zip: string;
    } | null;
  };
  hasMultipleSuppliers: boolean;
  dryRun: boolean;
}

const DELIVERY_METHOD_LABELS: Record<string, string> = {
  ZASILKOVNA: "Zásilkovna",
  DPD: "DPD",
  PPL: "PPL",
  GLS: "GLS",
  CESKA_POSTA: "Česká pošta",
  PICKUP: "Osobní odběr",
};

function localizedDeliveryMethod(method: string): string {
  return DELIVERY_METHOD_LABELS[method] ?? method;
}

function dryRunBannerHtml(): string {
  return `
    <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 12px 16px; margin: 0 0 16px; border-radius: 6px; font-size: 14px; color: #78350f;">
      <strong>TEST REŽIM (DRY-RUN)</strong> — štítek nebyl skutečně vytvořen u dopravce. Neposílejte zásilku, dokud nejsou nastaveny API klíče.
    </div>
  `;
}

function multiSupplierWarningHtml(): string {
  return `
    <div style="background: #fef2f2; border: 1px solid #fecaca; padding: 12px 16px; margin: 16px 0; border-radius: 6px; font-size: 14px; color: #7f1d1d;">
      <strong>Pozor:</strong> Tato objednávka obsahuje položky od více dodavatelů. Kontaktujte prosím BackOffice pro koordinaci balení.
    </div>
  `;
}

export function orderNotificationSupplierHtml(
  data: OrderNotificationSupplierData,
): string {
  const banner = data.dryRun ? dryRunBannerHtml() : "";
  const warning = data.hasMultipleSuppliers ? multiSupplierWarningHtml() : "";

  const itemRows = data.items
    .map(
      (item) => `
        <tr>
          <td style="padding: 10px 12px; font-size: 14px; color: #111827; border: 1px solid #e5e7eb;">
            ${escapeHtml(item.name)}
          </td>
          <td style="padding: 10px 12px; font-size: 13px; color: #6b7280; border: 1px solid #e5e7eb; font-family: monospace;">
            ${escapeHtml(item.partNumber ?? "—")}
          </td>
          <td style="padding: 10px 12px; font-size: 14px; color: #111827; border: 1px solid #e5e7eb; text-align: right; font-weight: 600;">
            ${item.quantity}×
          </td>
        </tr>
      `,
    )
    .join("");

  const deliverySection =
    data.delivery.method === "ZASILKOVNA"
      ? `
        <p style="margin: 0 0 4px; font-size: 14px; color: #6b7280;">Výdejní místo Zásilkovny</p>
        <p style="margin: 0 0 12px; font-size: 15px; color: #111827; font-weight: 600;">
          ${escapeHtml(data.delivery.zasilkovnaPointName ?? "—")}
        </p>
      `
      : data.delivery.address
        ? `
          <p style="margin: 0 0 4px; font-size: 14px; color: #6b7280;">Doručovací adresa</p>
          <p style="margin: 0 0 12px; font-size: 15px; color: #111827; line-height: 1.5;">
            ${escapeHtml(data.delivery.address.name)}<br>
            ${escapeHtml(data.delivery.address.street)}<br>
            ${escapeHtml(data.delivery.address.zip)} ${escapeHtml(data.delivery.address.city)}<br>
            Tel: ${escapeHtml(data.delivery.address.phone)}
          </p>
        `
        : "";

  const content = `
    ${banner}

    <h1 style="margin: 0 0 16px; font-size: 24px; color: #111827; font-weight: 700;">
      Nová objednávka k odeslání
    </h1>

    <p style="margin: 0 0 12px; font-size: 15px; color: #374151; line-height: 1.6;">
      Dobrý den ${escapeHtml(data.supplierName)},
    </p>

    <p style="margin: 0 0 12px; font-size: 15px; color: #374151; line-height: 1.6;">
      Objednávka <strong>${escapeHtml(data.orderNumber)}</strong> byla zaplacena. Prosíme:
    </p>
    <ol style="margin: 0 0 20px; padding-left: 20px; font-size: 15px; color: #374151; line-height: 1.8;">
      <li>Zabalte níže uvedené položky</li>
      <li>Vytiskněte přepravní štítek (PDF níže)</li>
      <li>Nalepte štítek a předejte zásilku dopravci</li>
    </ol>

    ${warning}

    <h2 style="margin: 24px 0 12px; font-size: 16px; color: #111827; font-weight: 600;">
      Položky k zabalení
    </h2>
    <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin: 0 0 20px; border-collapse: collapse;">
      <thead>
        <tr>
          <th style="padding: 10px 12px; font-size: 13px; color: #6b7280; text-align: left; background-color: #f9fafb; border: 1px solid #e5e7eb;">Díl</th>
          <th style="padding: 10px 12px; font-size: 13px; color: #6b7280; text-align: left; background-color: #f9fafb; border: 1px solid #e5e7eb;">Part Number</th>
          <th style="padding: 10px 12px; font-size: 13px; color: #6b7280; text-align: right; background-color: #f9fafb; border: 1px solid #e5e7eb;">Ks</th>
        </tr>
      </thead>
      <tbody>
        ${itemRows}
      </tbody>
    </table>

    <h2 style="margin: 24px 0 12px; font-size: 16px; color: #111827; font-weight: 600;">
      Doručení
    </h2>
    <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin: 0 0 20px; background-color: #f9fafb; border-radius: 8px;">
      <tr>
        <td style="padding: 16px;">
          ${deliverySection}

          <p style="margin: 0 0 4px; font-size: 14px; color: #6b7280;">Dopravce</p>
          <p style="margin: 0 0 12px; font-size: 15px; color: #111827; font-weight: 600;">
            ${escapeHtml(localizedDeliveryMethod(data.delivery.method))}
          </p>

          <p style="margin: 0 0 4px; font-size: 14px; color: #6b7280;">Tracking číslo</p>
          <p style="margin: 0; font-size: 15px; color: #111827; font-family: monospace;">
            ${escapeHtml(data.delivery.trackingNumber)}
          </p>
        </td>
      </tr>
    </table>

    <p style="margin: 24px 0;">
      <a href="${escapeHtml(data.delivery.labelUrl)}"
         style="background: #F97316; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 600; font-size: 15px;">
        Stáhnout PDF štítek
      </a>
    </p>

    <p style="margin: 24px 0 0; font-size: 14px; color: #6b7280; line-height: 1.6;">
      V případě problémů kontaktujte
      <a href="mailto:info@carmakler.cz" style="color: #F97316; text-decoration: none;">info@carmakler.cz</a>.
    </p>
  `;

  return emailLayout(content, companySignatureHtml());
}

export function orderNotificationSupplierText(
  data: OrderNotificationSupplierData,
): string {
  const banner = data.dryRun
    ? ["[TEST REŽIM — DRY-RUN] Štítek není skutečný, neposílejte zásilku.", ""]
    : [];

  const warning = data.hasMultipleSuppliers
    ? [
        "POZOR: Objednávka obsahuje položky od více dodavatelů.",
        "Kontaktujte prosím BackOffice pro koordinaci balení.",
        "",
      ]
    : [];

  const itemLines = data.items.map(
    (it) =>
      `- ${it.quantity}× ${it.name}${it.partNumber ? ` (PN: ${it.partNumber})` : ""}`,
  );

  const deliveryLines =
    data.delivery.method === "ZASILKOVNA"
      ? [`Výdejní místo: ${data.delivery.zasilkovnaPointName ?? "—"}`]
      : data.delivery.address
        ? [
            "Doručovací adresa:",
            data.delivery.address.name,
            data.delivery.address.street,
            `${data.delivery.address.zip} ${data.delivery.address.city}`,
            `Tel: ${data.delivery.address.phone}`,
          ]
        : [];

  const lines = [
    ...banner,
    `Dobrý den ${data.supplierName},`,
    "",
    `Objednávka ${data.orderNumber} byla zaplacena. Prosíme:`,
    "1) Zabalte níže uvedené položky",
    "2) Vytiskněte přepravní štítek (odkaz níže)",
    "3) Nalepte štítek a předejte zásilku dopravci",
    "",
    ...warning,
    "--- POLOŽKY K ZABALENÍ ---",
    ...itemLines,
    "",
    "--- DORUČENÍ ---",
    ...deliveryLines,
    `Dopravce: ${localizedDeliveryMethod(data.delivery.method)}`,
    `Tracking: ${data.delivery.trackingNumber}`,
    "",
    `Stáhnout PDF štítek: ${data.delivery.labelUrl}`,
    "",
    "V případě problémů kontaktujte info@carmakler.cz.",
    companySignatureText(),
  ];

  return lines.join("\n");
}

export function orderNotificationSupplierSubject(
  data: OrderNotificationSupplierData,
): string {
  const prefix = data.dryRun ? "[DRY-RUN] " : "";
  return `${prefix}Objednávka ${data.orderNumber} k odeslání | Carmakler`;
}
