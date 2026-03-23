import { emailLayout } from "../layout";

export interface WatchdogMatchData {
  userName: string;
  criteria: string; // Lidsky čitelný popis kritérií
  matches: {
    title: string;
    price: string;
    year: number;
    mileage: string;
    imageUrl?: string;
    listingUrl: string;
  }[];
  manageUrl: string;
}

export function watchdogMatchSubject(data: WatchdogMatchData): string {
  const count = data.matches.length;
  return `Našli jsme ${count} ${count === 1 ? "auto" : count < 5 ? "auta" : "aut"} podle Vašich kritérií`;
}

export function watchdogMatchHtml(data: WatchdogMatchData): string {
  const matchItems = data.matches
    .map(
      (m) => `
    <tr>
      <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb;">
        <table cellpadding="0" cellspacing="0" border="0" width="100%">
          <tr>
            ${m.imageUrl ? `<td width="100" style="vertical-align: top; padding-right: 12px;"><img src="${m.imageUrl}" alt="${m.title}" width="100" height="70" style="border-radius: 6px; object-fit: cover;" /></td>` : ""}
            <td style="vertical-align: top;">
              <p style="margin: 0 0 4px; font-size: 15px; font-weight: 600; color: #111827;">${m.title}</p>
              <p style="margin: 0 0 4px; font-size: 14px; color: #374151;">${m.price} | ${m.year} | ${m.mileage}</p>
              <a href="${m.listingUrl}" style="font-size: 13px; color: #f97316; text-decoration: none;">Zobrazit detail →</a>
            </td>
          </tr>
        </table>
      </td>
    </tr>`
    )
    .join("");

  const content = `
    <p style="margin: 0 0 16px; font-size: 15px; color: #374151; line-height: 1.6;">
      Dobrý den, ${data.userName},
    </p>
    <p style="margin: 0 0 16px; font-size: 15px; color: #374151; line-height: 1.6;">
      našli jsme nová auta odpovídající Vašim kritériím: <strong>${data.criteria}</strong>
    </p>
    <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin: 16px 0;">
      ${matchItems}
    </table>
    <p style="margin: 24px 0 0; text-align: center;">
      <a href="${data.manageUrl}" style="font-size: 13px; color: #9ca3af; text-decoration: none;">
        Spravovat hlídacího psa
      </a>
    </p>
  `;
  return emailLayout(content, "");
}

export function watchdogMatchText(data: WatchdogMatchData): string {
  const matchLines = data.matches
    .map((m) => `- ${m.title} | ${m.price} | ${m.year} | ${m.mileage}\n  ${m.listingUrl}`)
    .join("\n");

  return [
    `Dobrý den, ${data.userName},`,
    "",
    `našli jsme nová auta odpovídající Vašim kritériím: ${data.criteria}`,
    "",
    matchLines,
    "",
    `Spravovat hlídacího psa: ${data.manageUrl}`,
  ].join("\n");
}
