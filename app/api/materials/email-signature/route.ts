import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Nepřihlášený" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      avatar: true,
      slug: true,
      city: true,
      region: { select: { name: true } },
    },
  });

  if (!user) {
    return NextResponse.json({ error: "Uživatel nenalezen" }, { status: 404 });
  }

  const fullName = `${user.firstName} ${user.lastName}`;
  const profileUrl = user.slug
    ? `https://carmakler.cz/profil/${user.slug}`
    : "https://carmakler.cz";
  const regionText = user.region?.name || user.city || "";

  const html = `<table cellpadding="0" cellspacing="0" border="0" style="font-family: 'Outfit', Arial, sans-serif; max-width: 420px;">
  <tr>
    <td style="padding-bottom: 16px;">
      <table cellpadding="0" cellspacing="0" border="0">
        <tr>
          ${user.avatar ? `<td style="vertical-align: top; padding-right: 16px;">
            <img src="${user.avatar}" alt="${fullName}" width="64" height="64" style="border-radius: 50%; object-fit: cover; border: 2px solid #f97316;" />
          </td>` : ""}
          <td style="vertical-align: top;">
            <p style="margin: 0; font-size: 16px; font-weight: 700; color: #111827;">${fullName}</p>
            <p style="margin: 2px 0 0; font-size: 13px; font-weight: 500; color: #f97316;">Makléř CarMakléř${regionText ? ` — ${regionText}` : ""}</p>
            ${user.phone ? `<p style="margin: 8px 0 0; font-size: 13px; color: #374151;">📱 <a href="tel:${user.phone}" style="color: #374151; text-decoration: none;">${user.phone}</a></p>` : ""}
            <p style="margin: 2px 0 0; font-size: 13px; color: #374151;">✉️ <a href="mailto:${user.email}" style="color: #374151; text-decoration: none;">${user.email}</a></p>
            <p style="margin: 2px 0 0; font-size: 13px;">🌐 <a href="${profileUrl}" style="color: #f97316; text-decoration: none;">${profileUrl}</a></p>
          </td>
        </tr>
      </table>
    </td>
  </tr>
  <tr>
    <td style="border-top: 2px solid #f97316; padding-top: 12px;">
      <table cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td style="padding-right: 8px; vertical-align: middle;">
            <img src="https://carmakler.cz/brand/logo-dark.png" alt="CarMakléř" width="120" style="display: block;" />
          </td>
          <td style="vertical-align: middle; padding-left: 8px; border-left: 1px solid #e5e7eb;">
            <p style="margin: 0; font-size: 11px; color: #9ca3af; line-height: 1.4;">Prodejte auto za nejlepší cenu<br/>carmakler.cz</p>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>`;

  const text = [
    `${fullName}`,
    `Makléř CarMakléř${regionText ? ` — ${regionText}` : ""}`,
    user.phone ? `Tel: ${user.phone}` : null,
    `Email: ${user.email}`,
    profileUrl,
    "",
    "CarMakléř — Prodejte auto za nejlepší cenu",
    "carmakler.cz",
  ]
    .filter(Boolean)
    .join("\n");

  return NextResponse.json({ html, text });
}
