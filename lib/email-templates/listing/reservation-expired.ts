import { emailLayout } from "../layout";

export interface ReservationExpiredData {
  buyerName: string;
  vehicleName: string;
  listingUrl: string;
  searchUrl: string;
}

export function reservationExpiredSubject(data: ReservationExpiredData): string {
  return `Rezervace vyprsela — ${data.vehicleName}`;
}

export function reservationExpiredHtml(data: ReservationExpiredData): string {
  const content = `
    <p style="margin: 0 0 16px; font-size: 15px; color: #374151; line-height: 1.6;">
      Dobry den, ${data.buyerName},
    </p>
    <p style="margin: 0 0 16px; font-size: 15px; color: #374151; line-height: 1.6;">
      vase rezervace vozidla <strong>${data.vehicleName}</strong> vyprsela.
      Vozidlo je nyni opet k dispozici pro ostatni zajemce.
    </p>
    <p style="margin: 0 0 16px; font-size: 15px; color: #374151; line-height: 1.6;">
      Pokud mate stale zajem, muzete vozidlo znovu rezervovat — pokud je stale dostupne.
    </p>
    <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin: 24px 0;">
      <tr>
        <td style="text-align: center; padding-right: 8px;" width="50%">
          <a href="${data.listingUrl}" style="display: inline-block; padding: 12px 24px; background-color: #f97316; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px;">
            Zobrazit vozidlo
          </a>
        </td>
        <td style="text-align: center; padding-left: 8px;" width="50%">
          <a href="${data.searchUrl}" style="display: inline-block; padding: 12px 24px; background-color: #374151; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px;">
            Hledat dalsi auta
          </a>
        </td>
      </tr>
    </table>
  `;
  return emailLayout(content, "");
}

export function reservationExpiredText(data: ReservationExpiredData): string {
  return [
    `Dobry den, ${data.buyerName},`,
    "",
    `vase rezervace vozidla "${data.vehicleName}" vyprsela.`,
    `Vozidlo je nyni opet k dispozici pro ostatni zajemce.`,
    "",
    `Zobrazit vozidlo: ${data.listingUrl}`,
    `Hledat dalsi auta: ${data.searchUrl}`,
  ].join("\n");
}
