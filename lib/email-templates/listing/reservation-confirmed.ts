import { emailLayout } from "../layout";

export interface ReservationConfirmedData {
  buyerName: string;
  vehicleName: string;
  price: string;
  sellerName: string;
  sellerPhone?: string;
  reservationExpiry: string;
  listingUrl: string;
}

export function reservationConfirmedSubject(data: ReservationConfirmedData): string {
  return `Rezervace potvrzena — ${data.vehicleName}`;
}

export function reservationConfirmedHtml(data: ReservationConfirmedData): string {
  const content = `
    <p style="margin: 0 0 16px; font-size: 15px; color: #374151; line-height: 1.6;">
      Dobrý den, ${data.buyerName},
    </p>
    <p style="margin: 0 0 16px; font-size: 15px; color: #374151; line-height: 1.6;">
      Vaše rezervace vozidla <strong>${data.vehicleName}</strong> byla potvrzena.
    </p>
    <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin: 20px 0; background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px;">
      <tr>
        <td style="padding: 16px;">
          <p style="margin: 0 0 8px; font-size: 14px; color: #6b7280;">Detaily rezervace:</p>
          <p style="margin: 0 0 4px; font-size: 15px; color: #374151;"><strong>Vozidlo:</strong> ${data.vehicleName}</p>
          <p style="margin: 0 0 4px; font-size: 15px; color: #374151;"><strong>Cena:</strong> ${data.price}</p>
          <p style="margin: 0 0 4px; font-size: 15px; color: #374151;"><strong>Prodejce:</strong> ${data.sellerName}</p>
          ${data.sellerPhone ? `<p style="margin: 0 0 4px; font-size: 15px; color: #374151;"><strong>Telefon:</strong> ${data.sellerPhone}</p>` : ""}
          <p style="margin: 8px 0 0; font-size: 14px; color: #166534;"><strong>Rezervace platná do:</strong> ${data.reservationExpiry}</p>
        </td>
      </tr>
    </table>
    <p style="margin: 0 0 16px; font-size: 15px; color: #374151; line-height: 1.6;">
      Kontaktujte prodejce a domluvte si předání vozidla. Pokud rezervaci nevyužijete do uvedeného data, automaticky vyprší.
    </p>
    <p style="margin: 24px 0 0; text-align: center;">
      <a href="${data.listingUrl}" style="display: inline-block; padding: 12px 32px; background-color: #16a34a; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 15px;">
        Zobrazit detail vozidla
      </a>
    </p>
  `;
  return emailLayout(content, "");
}

export function reservationConfirmedText(data: ReservationConfirmedData): string {
  return [
    `Dobrý den, ${data.buyerName},`,
    "",
    `Vaše rezervace vozidla "${data.vehicleName}" byla potvrzena.`,
    "",
    `Vozidlo: ${data.vehicleName}`,
    `Cena: ${data.price}`,
    `Prodejce: ${data.sellerName}`,
    data.sellerPhone ? `Telefon: ${data.sellerPhone}` : "",
    `Rezervace platná do: ${data.reservationExpiry}`,
    "",
    `Kontaktujte prodejce a domluvte si předání vozidla.`,
    "",
    `Detail: ${data.listingUrl}`,
  ]
    .filter(Boolean)
    .join("\n");
}
