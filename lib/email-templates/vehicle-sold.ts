import { emailLayout, escapeHtml, formatCzk } from "./layout";
import { generateSignatureHtml, generateSignatureText, BrokerSignatureData } from "./signature";

export interface VehicleSoldData {
  recipientName: string;
  vehicleName: string;
  salePrice: number;
  broker: BrokerSignatureData;
  customText?: string;
}

export function vehicleSoldHtml(data: VehicleSoldData): string {
  const content = `
    <p style="margin: 0 0 16px; font-size: 15px; color: #374151; line-height: 1.6;">
      Dobrý den, ${escapeHtml(data.recipientName)},
    </p>
    <p style="margin: 0 0 16px; font-size: 15px; color: #374151; line-height: 1.6;">
      s radostí Vám oznamuji, že Vaše vozidlo <strong>${escapeHtml(data.vehicleName)}</strong> bylo úspěšně prodáno!
    </p>
    <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin: 20px 0; background-color: #ecfdf5; border-radius: 8px; border: 1px solid #a7f3d0;">
      <tr>
        <td style="padding: 20px 16px; text-align: center;">
          <p style="margin: 0 0 4px; font-size: 14px; color: #065f46;">Prodejní cena</p>
          <p style="margin: 0; font-size: 24px; font-weight: 700; color: #059669;">${formatCzk(data.salePrice)}</p>
        </td>
      </tr>
    </table>
    ${data.customText ? `<p style="margin: 0 0 16px; font-size: 15px; color: #374151; line-height: 1.6;">${escapeHtml(data.customText)}</p>` : ""}
    <p style="margin: 0 0 16px; font-size: 15px; color: #374151; line-height: 1.6;">
      V následujících dnech Vás budu kontaktovat ohledně předání vozidla a vyřízení platby.
    </p>
    <p style="margin: 0 0 16px; font-size: 15px; color: #374151; line-height: 1.6;">
      Děkuji za důvěru a spolupráci!
    </p>
  `;
  return emailLayout(content, generateSignatureHtml(data.broker));
}

export function vehicleSoldText(data: VehicleSoldData): string {
  return [
    `Dobrý den, ${data.recipientName},`,
    "",
    `s radostí Vám oznamuji, že Vaše vozidlo ${data.vehicleName} bylo úspěšně prodáno!`,
    "",
    `Prodejní cena: ${formatCzk(data.salePrice)}`,
    "",
    data.customText || "",
    "",
    "V následujících dnech Vás budu kontaktovat ohledně předání vozidla a vyřízení platby.",
    "",
    "Děkuji za důvěru a spolupráci!",
    generateSignatureText(data.broker),
  ]
    .filter(Boolean)
    .join("\n");
}

export function vehicleSoldSubject(data: VehicleSoldData): string {
  return `Auto prodáno — ${data.vehicleName} | Carmakler`;
}
