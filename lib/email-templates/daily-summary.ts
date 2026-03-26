import { emailLayout, formatCzk, escapeHtml } from "./layout";

export interface TopVehicle {
  name: string;
  views: number;
  inquiries: number;
  price: number;
}

export interface InquiryItem {
  vehicleName: string;
  buyerName: string;
  buyerPhone?: string;
  createdAt: string;
}

export interface PendingLead {
  vehicleName: string;
  sellerName: string;
  daysOld: number;
}

export interface StalingVehicle {
  name: string;
  daysActive: number;
  views: number;
}

export interface DailySummaryData {
  brokerName: string;
  date: string;
  views: number;
  inquiries: number;
  leads: number;
  topVehicles: TopVehicle[];
  newInquiries: InquiryItem[];
  pendingLeads: PendingLead[];
  stalingVehicles: StalingVehicle[];
  unsubscribeUrl?: string;
}

export function dailySummarySubject(data: DailySummaryData): string {
  return `Denni shrnuti ${data.date} | Carmakler`;
}

export function dailySummaryHtml(data: DailySummaryData): string {
  const topVehiclesHtml = data.topVehicles.length > 0
    ? `
      <h3 style="margin: 24px 0 12px; font-size: 16px; color: #111827;">TOP 3 nejprohlizenejsi auta</h3>
      <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom: 20px; border-collapse: collapse;">
        <tr style="background-color: #f9fafb;">
          <td style="padding: 8px 12px; font-size: 12px; font-weight: 600; color: #6b7280; border-bottom: 1px solid #e5e7eb;">Vozidlo</td>
          <td style="padding: 8px 12px; font-size: 12px; font-weight: 600; color: #6b7280; border-bottom: 1px solid #e5e7eb; text-align: center;">Zobrazeni</td>
          <td style="padding: 8px 12px; font-size: 12px; font-weight: 600; color: #6b7280; border-bottom: 1px solid #e5e7eb; text-align: center;">Dotazy</td>
          <td style="padding: 8px 12px; font-size: 12px; font-weight: 600; color: #6b7280; border-bottom: 1px solid #e5e7eb; text-align: right;">Cena</td>
        </tr>
        ${data.topVehicles.map((v) => `
          <tr>
            <td style="padding: 8px 12px; font-size: 14px; color: #374151; border-bottom: 1px solid #f3f4f6;">${escapeHtml(v.name)}</td>
            <td style="padding: 8px 12px; font-size: 14px; color: #374151; border-bottom: 1px solid #f3f4f6; text-align: center;">${v.views}</td>
            <td style="padding: 8px 12px; font-size: 14px; color: #374151; border-bottom: 1px solid #f3f4f6; text-align: center;">${v.inquiries}</td>
            <td style="padding: 8px 12px; font-size: 14px; color: #374151; border-bottom: 1px solid #f3f4f6; text-align: right;">${formatCzk(v.price)}</td>
          </tr>
        `).join("")}
      </table>
    `
    : "";

  const newInquiriesHtml = data.newInquiries.length > 0
    ? `
      <h3 style="margin: 24px 0 12px; font-size: 16px; color: #111827;">Nove dotazy</h3>
      ${data.newInquiries.map((inq) => `
        <div style="padding: 10px 12px; margin-bottom: 8px; background-color: #fffbeb; border-left: 3px solid #f97316; border-radius: 4px;">
          <p style="margin: 0; font-size: 14px; color: #374151; font-weight: 600;">${escapeHtml(inq.vehicleName)}</p>
          <p style="margin: 4px 0 0; font-size: 13px; color: #6b7280;">Zajemce: ${escapeHtml(inq.buyerName)}${inq.buyerPhone ? `, tel: ${escapeHtml(inq.buyerPhone)}` : ""}</p>
        </div>
      `).join("")}
    `
    : "";

  const pendingLeadsHtml = data.pendingLeads.length > 0
    ? `
      <h3 style="margin: 24px 0 12px; font-size: 16px; color: #111827;">Cekajici leady</h3>
      ${data.pendingLeads.map((lead) => `
        <div style="padding: 10px 12px; margin-bottom: 8px; background-color: #fef2f2; border-left: 3px solid #ef4444; border-radius: 4px;">
          <p style="margin: 0; font-size: 14px; color: #374151; font-weight: 600;">${escapeHtml(lead.vehicleName)}</p>
          <p style="margin: 4px 0 0; font-size: 13px; color: #6b7280;">Prodejce: ${escapeHtml(lead.sellerName)} &bull; ${lead.daysOld} dni</p>
        </div>
      `).join("")}
    `
    : "";

  const stalingHtml = data.stalingVehicles.length > 0
    ? `
      <h3 style="margin: 24px 0 12px; font-size: 16px; color: #111827;">Auta blizici se 30 dnum</h3>
      ${data.stalingVehicles.map((v) => `
        <div style="padding: 10px 12px; margin-bottom: 8px; background-color: #fff7ed; border-left: 3px solid #f97316; border-radius: 4px;">
          <p style="margin: 0; font-size: 14px; color: #374151; font-weight: 600;">${escapeHtml(v.name)}</p>
          <p style="margin: 4px 0 0; font-size: 13px; color: #6b7280;">${v.daysActive} dni v nabidce &bull; ${v.views} zobrazeni</p>
        </div>
      `).join("")}
    `
    : "";

  const content = `
    <p style="margin: 0 0 8px; font-size: 15px; color: #374151; line-height: 1.6;">
      Dobry den, ${escapeHtml(data.brokerName)},
    </p>
    <p style="margin: 0 0 20px; font-size: 15px; color: #374151; line-height: 1.6;">
      zde je Vase denni shrnuti za ${escapeHtml(data.date)}:
    </p>

    <!-- Prehled -->
    <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom: 24px;">
      <tr>
        <td style="padding: 16px; background-color: #fff7ed; border-radius: 8px; text-align: center; width: 33%;">
          <p style="margin: 0; font-size: 24px; font-weight: 700; color: #f97316;">${data.views}</p>
          <p style="margin: 4px 0 0; font-size: 12px; color: #6b7280; text-transform: uppercase;">Zobrazeni</p>
        </td>
        <td style="width: 8px;">&nbsp;</td>
        <td style="padding: 16px; background-color: #fff7ed; border-radius: 8px; text-align: center; width: 33%;">
          <p style="margin: 0; font-size: 24px; font-weight: 700; color: #f97316;">${data.inquiries}</p>
          <p style="margin: 4px 0 0; font-size: 12px; color: #6b7280; text-transform: uppercase;">Dotazy</p>
        </td>
        <td style="width: 8px;">&nbsp;</td>
        <td style="padding: 16px; background-color: #fff7ed; border-radius: 8px; text-align: center; width: 33%;">
          <p style="margin: 0; font-size: 24px; font-weight: 700; color: #f97316;">${data.leads}</p>
          <p style="margin: 4px 0 0; font-size: 12px; color: #6b7280; text-transform: uppercase;">Leady</p>
        </td>
      </tr>
    </table>

    ${topVehiclesHtml}
    ${newInquiriesHtml}
    ${pendingLeadsHtml}
    ${stalingHtml}

    <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-top: 24px;">
      <tr>
        <td align="center">
          <a href="https://carmakler.cz/makler/dashboard" style="display: inline-block; padding: 12px 32px; background-color: #f97316; color: #ffffff; font-size: 15px; font-weight: 600; text-decoration: none; border-radius: 8px;">
            Otevrit dashboard
          </a>
        </td>
      </tr>
    </table>
  `;

  return emailLayout(content, "");
}

export function dailySummaryText(data: DailySummaryData): string {
  const lines = [
    `Dobry den, ${data.brokerName},`,
    "",
    `Denni shrnuti za ${data.date}:`,
    `- Zobrazeni: ${data.views}`,
    `- Dotazy: ${data.inquiries}`,
    `- Leady: ${data.leads}`,
  ];

  if (data.topVehicles.length > 0) {
    lines.push("", "TOP 3 nejprohlizenejsi auta:");
    for (const v of data.topVehicles) {
      lines.push(`  ${v.name} — ${v.views} zobrazeni, ${v.inquiries} dotazu, ${formatCzk(v.price)}`);
    }
  }

  if (data.newInquiries.length > 0) {
    lines.push("", "Nove dotazy:");
    for (const inq of data.newInquiries) {
      lines.push(`  ${inq.vehicleName} — ${inq.buyerName}${inq.buyerPhone ? `, tel: ${inq.buyerPhone}` : ""}`);
    }
  }

  if (data.pendingLeads.length > 0) {
    lines.push("", "Cekajici leady:");
    for (const lead of data.pendingLeads) {
      lines.push(`  ${lead.vehicleName} — ${lead.sellerName}, ${lead.daysOld} dni`);
    }
  }

  if (data.stalingVehicles.length > 0) {
    lines.push("", "Auta blizici se 30 dnum:");
    for (const v of data.stalingVehicles) {
      lines.push(`  ${v.name} — ${v.daysActive} dni, ${v.views} zobrazeni`);
    }
  }

  lines.push("", "Dashboard: https://carmakler.cz/makler/dashboard");

  return lines.join("\n");
}
