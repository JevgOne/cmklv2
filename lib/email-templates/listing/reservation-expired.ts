import { emailLayout } from "../layout";

export interface ReservationExpiredData {
  buyerName: string;
  vehicleName: string;
  listingUrl: string;
  searchUrl: string;
}

export function reservationExpiredSubject(data: ReservationExpiredData): string {
  return `Rezervace vypršela — ${data.vehicleName}`;
}

export function reservationExpiredHtml(data: ReservationExpiredData): string {
  const content = `
    <p style="margin: 0 0 16px; font-size: 15px; color: #374151; line-height: 1.6;">
      Dobrý den, ${data.buyerName},
    </p>
    <p style="margin: 0 0 16px; font-size: 15px; color: #374151; line-height: 1.6;">
      Vaše rezervace vozidla <strong>${data.vehicleName}</strong> vypršela.
      Vozidlo je nyní opět k dispozici pro ostatní zájemce.
    </p>
    <p style="margin: 0 0 16px; font-size: 15px; color: #374151; line-height: 1.6;">
      Pokud máte stále zájem, můžete vozidlo znovu rezervovat — pokud je stále dostupné.
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
            Hledat další auta
          </a>
        </td>
      </tr>
    </table>
  `;
  return emailLayout(content, "");
}

export function reservationExpiredText(data: ReservationExpiredData): string {
  return [
    `Dobrý den, ${data.buyerName},`,
    "",
    `Vaše rezervace vozidla "${data.vehicleName}" vypršela.`,
    `Vozidlo je nyní opět k dispozici pro ostatní zájemce.`,
    "",
    `Zobrazit vozidlo: ${data.listingUrl}`,
    `Hledat další auta: ${data.searchUrl}`,
  ].join("\n");
}
