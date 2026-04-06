import { emailLayout, escapeHtml, formatCzk } from "./layout";
import { companySignatureHtml, companySignatureText } from "./company-signature";

export interface OrderConfirmationCustomerData {
  orderNumber: string;
  customerName: string;
  totalPrice: number;
  deliveryMethod: string;
  carrier: string;
  trackingNumber: string;
  trackingUrl: string;
  zasilkovnaPointName: string | null;
  deliveryAddress: {
    name: string;
    street: string;
    city: string;
    zip: string;
  } | null;
  items: Array<{
    name: string;
    quantity: number;
    price: number; // unit price v Kč
  }>;
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
      <strong>TEST REŽIM (DRY-RUN)</strong> — zásilka nebyla skutečně vytvořena u dopravce. Pro produkční odeslání musí být nastaveny API klíče dopravců.
    </div>
  `;
}

export function orderConfirmationCustomerHtml(
  data: OrderConfirmationCustomerData,
): string {
  const banner = data.dryRun ? dryRunBannerHtml() : "";

  const itemRows = data.items
    .map(
      (item) => `
        <tr>
          <td style="padding: 8px 0; font-size: 14px; color: #374151; border-bottom: 1px solid #f3f4f6;">
            ${escapeHtml(item.name)}
          </td>
          <td style="padding: 8px 0; font-size: 14px; color: #6b7280; text-align: center; border-bottom: 1px solid #f3f4f6;">
            ${item.quantity}×
          </td>
          <td style="padding: 8px 0; font-size: 14px; color: #111827; text-align: right; border-bottom: 1px solid #f3f4f6; font-weight: 600;">
            ${formatCzk(item.price * item.quantity)}
          </td>
        </tr>
      `,
    )
    .join("");

  const deliverySection =
    data.deliveryMethod === "ZASILKOVNA"
      ? `
        <p style="margin: 0 0 4px; font-size: 14px; color: #6b7280;">Výdejní místo</p>
        <p style="margin: 0; font-size: 15px; color: #111827; font-weight: 600;">
          ${escapeHtml(data.zasilkovnaPointName ?? "—")}
        </p>
      `
      : data.deliveryAddress
        ? `
          <p style="margin: 0 0 4px; font-size: 14px; color: #6b7280;">Doručovací adresa</p>
          <p style="margin: 0; font-size: 15px; color: #111827; line-height: 1.5;">
            ${escapeHtml(data.deliveryAddress.name)}<br>
            ${escapeHtml(data.deliveryAddress.street)}<br>
            ${escapeHtml(data.deliveryAddress.zip)} ${escapeHtml(data.deliveryAddress.city)}
          </p>
        `
        : "";

  const content = `
    ${banner}

    <h1 style="margin: 0 0 16px; font-size: 24px; color: #111827; font-weight: 700;">
      Děkujeme za objednávku!
    </h1>

    <p style="margin: 0 0 12px; font-size: 15px; color: #374151; line-height: 1.6;">
      Dobrý den ${escapeHtml(data.customerName)},
    </p>

    <p style="margin: 0 0 20px; font-size: 15px; color: #374151; line-height: 1.6;">
      Vaše objednávka <strong>${escapeHtml(data.orderNumber)}</strong> byla zaplacena a předána dopravci. Níže najdete shrnutí.
    </p>

    <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin: 20px 0; background-color: #f9fafb; border-radius: 8px;">
      <tr>
        <td style="padding: 16px;">
          <p style="margin: 0 0 4px; font-size: 14px; color: #6b7280;">Číslo objednávky</p>
          <p style="margin: 0 0 12px; font-size: 16px; color: #111827; font-weight: 600;">
            ${escapeHtml(data.orderNumber)}
          </p>

          <p style="margin: 0 0 4px; font-size: 14px; color: #6b7280;">Celková cena</p>
          <p style="margin: 0 0 12px; font-size: 18px; color: #F97316; font-weight: 700;">
            ${formatCzk(data.totalPrice)}
          </p>

          <p style="margin: 0 0 4px; font-size: 14px; color: #6b7280;">Způsob dopravy</p>
          <p style="margin: 0 0 12px; font-size: 15px; color: #111827; font-weight: 600;">
            ${escapeHtml(localizedDeliveryMethod(data.deliveryMethod))}
          </p>

          <p style="margin: 0 0 4px; font-size: 14px; color: #6b7280;">Tracking číslo</p>
          <p style="margin: 0; font-size: 15px; color: #111827; font-family: monospace;">
            ${escapeHtml(data.trackingNumber)}
          </p>
        </td>
      </tr>
    </table>

    <h2 style="margin: 24px 0 12px; font-size: 16px; color: #111827; font-weight: 600;">
      Položky
    </h2>
    <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin: 0 0 20px;">
      ${itemRows}
    </table>

    <h2 style="margin: 24px 0 12px; font-size: 16px; color: #111827; font-weight: 600;">
      Doručení
    </h2>
    <div style="margin: 0 0 24px;">
      ${deliverySection}
    </div>

    <p style="margin: 24px 0;">
      <a href="${escapeHtml(data.trackingUrl)}"
         style="background: #F97316; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 600; font-size: 15px;">
        Sledovat zásilku
      </a>
    </p>

    <p style="margin: 24px 0 0; font-size: 14px; color: #6b7280; line-height: 1.6;">
      O doručení vás budeme informovat. V případě dotazů nás neváhejte kontaktovat na
      <a href="mailto:info@carmakler.cz" style="color: #F97316; text-decoration: none;">info@carmakler.cz</a>.
    </p>
  `;

  return emailLayout(content, companySignatureHtml());
}

export function orderConfirmationCustomerText(
  data: OrderConfirmationCustomerData,
): string {
  const banner = data.dryRun
    ? ["[TEST REŽIM — DRY-RUN] Zásilka nebyla skutečně vytvořena u dopravce.", ""]
    : [];

  const itemLines = data.items.map(
    (it) => `- ${it.quantity}× ${it.name} — ${formatCzk(it.price * it.quantity)}`,
  );

  const deliveryLines =
    data.deliveryMethod === "ZASILKOVNA"
      ? [`Výdejní místo: ${data.zasilkovnaPointName ?? "—"}`]
      : data.deliveryAddress
        ? [
            "Doručovací adresa:",
            data.deliveryAddress.name,
            data.deliveryAddress.street,
            `${data.deliveryAddress.zip} ${data.deliveryAddress.city}`,
          ]
        : [];

  const lines = [
    ...banner,
    `Dobrý den ${data.customerName},`,
    "",
    `Vaše objednávka ${data.orderNumber} byla zaplacena a předána dopravci.`,
    "",
    "--- SHRNUTÍ OBJEDNÁVKY ---",
    `Číslo: ${data.orderNumber}`,
    `Celková cena: ${formatCzk(data.totalPrice)}`,
    `Doprava: ${localizedDeliveryMethod(data.deliveryMethod)}`,
    `Tracking: ${data.trackingNumber}`,
    "",
    "--- POLOŽKY ---",
    ...itemLines,
    "",
    "--- DORUČENÍ ---",
    ...deliveryLines,
    "",
    `Sledovat zásilku: ${data.trackingUrl}`,
    "",
    "V případě dotazů pište na info@carmakler.cz.",
    companySignatureText(),
  ];

  return lines.filter((line) => line !== undefined).join("\n");
}

export function orderConfirmationCustomerSubject(
  data: OrderConfirmationCustomerData,
): string {
  const prefix = data.dryRun ? "[DRY-RUN] " : "";
  return `${prefix}Objednávka ${data.orderNumber} byla odeslána | Carmakler`;
}
