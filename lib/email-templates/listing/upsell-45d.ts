import { emailLayout } from "../layout";

export interface Upsell45dData {
  sellerName: string;
  vehicleName: string;
  daysOnline: number;
  listingUrl: string;
  brokerRequestUrl: string;
}

export function upsell45dSubject(data: Upsell45dData): string {
  return `Posledni sance — makler proda ${data.vehicleName} za vas`;
}

export function upsell45dHtml(data: Upsell45dData): string {
  const content = `
    <p style="margin: 0 0 16px; font-size: 15px; color: #374151; line-height: 1.6;">
      Dobry den, ${data.sellerName},
    </p>
    <p style="margin: 0 0 16px; font-size: 15px; color: #374151; line-height: 1.6;">
      vas inzerat <strong>${data.vehicleName}</strong> je online jiz <strong>${data.daysOnline} dni</strong>.
      Vim, ze prodej auta muze byt frustrujici — proto jsme tu, abychom vam pomohli.
    </p>
    <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin: 20px 0; background-color: #fff7ed; border: 1px solid #fed7aa; border-radius: 8px;">
      <tr>
        <td style="padding: 16px;">
          <p style="margin: 0 0 8px; font-size: 16px; font-weight: 700; color: #c2410c;">Specialni nabidka</p>
          <p style="margin: 0; font-size: 15px; color: #374151; line-height: 1.6;">
            Predejte prodej nasemu maklerovi a neztraacejte cas. Makler prevezme kompletni servis —
            od profesionalnich fotek, pres inzerci na vsech portalech, az po predani kupujicimu.
            Platite pouze provizi z uspesneho prodeje.
          </p>
        </td>
      </tr>
    </table>
    <p style="margin: 24px 0 0; text-align: center;">
      <a href="${data.brokerRequestUrl}" style="display: inline-block; padding: 14px 36px; background-color: #c2410c; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
        Chci prodat s maklerem
      </a>
    </p>
    <p style="margin: 16px 0 0; text-align: center;">
      <a href="${data.listingUrl}" style="font-size: 13px; color: #9ca3af; text-decoration: none;">
        Zobrazit muj inzerat
      </a>
    </p>
  `;
  return emailLayout(content, "");
}

export function upsell45dText(data: Upsell45dData): string {
  return [
    `Dobry den, ${data.sellerName},`,
    "",
    `vas inzerat "${data.vehicleName}" je online jiz ${data.daysOnline} dni.`,
    "",
    `SPECIALNI NABIDKA: Predejte prodej nasemu maklerovi.`,
    `Makler prevezme kompletni servis — od profesionalnich fotek po predani kupujicimu.`,
    `Platite pouze provizi z uspesneho prodeje.`,
    "",
    `Chci prodat s maklerem: ${data.brokerRequestUrl}`,
    `Zobrazit inzerat: ${data.listingUrl}`,
  ].join("\n");
}
