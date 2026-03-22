import { emailLayout } from "./layout";
import { generateSignatureHtml, generateSignatureText, BrokerSignatureData } from "./signature";

export interface VehicleSoldData {
  recipientName: string;
  vehicleName: string;
  salePrice: number;
  broker: BrokerSignatureData;
  customText?: string;
}

function formatCzk(amount: number): string {
  return new Intl.NumberFormat("cs-CZ").format(amount) + " Kc";
}

export function vehicleSoldHtml(data: VehicleSoldData): string {
  const content = `
    <p style="margin: 0 0 16px; font-size: 15px; color: #374151; line-height: 1.6;">
      Dobry den, ${data.recipientName},
    </p>
    <p style="margin: 0 0 16px; font-size: 15px; color: #374151; line-height: 1.6;">
      s radosti Vam oznamuji, ze Vase vozidlo <strong>${data.vehicleName}</strong> bylo uspesne prodano!
    </p>
    <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin: 20px 0; background-color: #ecfdf5; border-radius: 8px; border: 1px solid #a7f3d0;">
      <tr>
        <td style="padding: 20px 16px; text-align: center;">
          <p style="margin: 0 0 4px; font-size: 14px; color: #065f46;">Prodejni cena</p>
          <p style="margin: 0; font-size: 24px; font-weight: 700; color: #059669;">${formatCzk(data.salePrice)}</p>
        </td>
      </tr>
    </table>
    ${data.customText ? `<p style="margin: 0 0 16px; font-size: 15px; color: #374151; line-height: 1.6;">${data.customText}</p>` : ""}
    <p style="margin: 0 0 16px; font-size: 15px; color: #374151; line-height: 1.6;">
      V nasledujicich dnech Vas budu kontaktovat ohledne predani vozidla a vyrizeni platby.
    </p>
    <p style="margin: 0 0 16px; font-size: 15px; color: #374151; line-height: 1.6;">
      Dekuji za duveru a spolupráci!
    </p>
  `;
  return emailLayout(content, generateSignatureHtml(data.broker));
}

export function vehicleSoldText(data: VehicleSoldData): string {
  return [
    `Dobry den, ${data.recipientName},`,
    "",
    `s radosti Vam oznamuji, ze Vase vozidlo ${data.vehicleName} bylo uspesne prodano!`,
    "",
    `Prodejni cena: ${formatCzk(data.salePrice)}`,
    "",
    data.customText || "",
    "",
    "V nasledujicich dnech Vas budu kontaktovat ohledne predani vozidla a vyrizeni platby.",
    "",
    "Dekuji za duveru a spolupráci!",
    generateSignatureText(data.broker),
  ]
    .filter(Boolean)
    .join("\n");
}

export function vehicleSoldSubject(data: VehicleSoldData): string {
  return `Auto prodano — ${data.vehicleName} | Carmakler`;
}
