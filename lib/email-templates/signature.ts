export interface BrokerSignatureData {
  firstName: string;
  lastName: string;
  phone?: string;
  email: string;
  slug?: string;
  avatar?: string | null;
}

export function generateSignatureHtml(broker: BrokerSignatureData): string {
  const fullName = `${broker.firstName} ${broker.lastName}`;
  const profileUrl = broker.slug
    ? `https://carmakler.cz/makler/${broker.slug}`
    : "https://carmakler.cz";

  const avatarHtml = broker.avatar
    ? `<img src="${broker.avatar}" alt="${fullName}" width="50" height="50" style="border-radius: 50%; object-fit: cover;" />`
    : "";

  return `
    <table cellpadding="0" cellspacing="0" border="0" style="margin-top: 24px; border-top: 1px solid #e5e7eb; padding-top: 20px;">
      <tr>
        ${avatarHtml ? `<td style="vertical-align: top; padding-right: 12px;">${avatarHtml}</td>` : ""}
        <td style="vertical-align: top;">
          <p style="margin: 0; font-size: 14px; color: #374151;">S pozdravem,</p>
          <p style="margin: 4px 0 0; font-size: 15px; font-weight: 600; color: #111827;">${fullName}</p>
          <p style="margin: 2px 0 0; font-size: 13px; color: #6b7280;">Makléř Carmakler</p>
          ${broker.phone ? `<p style="margin: 4px 0 0; font-size: 13px; color: #6b7280;">Tel: ${broker.phone}</p>` : ""}
          <p style="margin: 2px 0 0; font-size: 13px; color: #6b7280;">Email: ${broker.email}</p>
          <p style="margin: 2px 0 0;"><a href="${profileUrl}" style="font-size: 13px; color: #f97316; text-decoration: none;">${profileUrl}</a></p>
        </td>
      </tr>
    </table>
  `;
}

export function generateSignatureText(broker: BrokerSignatureData): string {
  const fullName = `${broker.firstName} ${broker.lastName}`;
  const profileUrl = broker.slug
    ? `https://carmakler.cz/makler/${broker.slug}`
    : "https://carmakler.cz";

  const lines = [
    "",
    "S pozdravem,",
    fullName,
    "Makléř Carmakler",
  ];
  if (broker.phone) lines.push(`Tel: ${broker.phone}`);
  lines.push(`Email: ${broker.email}`);
  lines.push(profileUrl);

  return lines.join("\n");
}
