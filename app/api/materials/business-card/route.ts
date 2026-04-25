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
    ? `carmakler.cz/profil/${user.slug}`
    : "carmakler.cz";
  const regionText = user.region?.name || user.city || "";

  // Generate printable business card HTML (85mm x 55mm, 4 per A4)
  const cardHtml = `<!DOCTYPE html>
<html lang="cs">
<head>
<meta charset="UTF-8">
<style>
  @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&display=swap');
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Outfit', sans-serif; }
  @media print {
    @page { size: A4; margin: 10mm; }
    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  }
  .card-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 4mm;
    width: 190mm;
    margin: 0 auto;
  }
  .card {
    width: 85mm;
    height: 55mm;
    border: 0.5px solid #e5e7eb;
    border-radius: 3mm;
    overflow: hidden;
    display: flex;
    position: relative;
    page-break-inside: avoid;
  }
  .card-left {
    width: 30%;
    background: linear-gradient(135deg, #f97316, #ea580c);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 4mm;
  }
  .card-left img {
    width: 18mm;
    height: 18mm;
    border-radius: 50%;
    object-fit: cover;
    border: 2px solid rgba(255,255,255,0.8);
    margin-bottom: 2mm;
  }
  .card-left .avatar-placeholder {
    width: 18mm;
    height: 18mm;
    border-radius: 50%;
    background: rgba(255,255,255,0.2);
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-size: 14pt;
    font-weight: 700;
    margin-bottom: 2mm;
  }
  .card-right {
    width: 70%;
    padding: 5mm 5mm 4mm;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  }
  .card-name {
    font-size: 11pt;
    font-weight: 700;
    color: #111827;
    margin-bottom: 1mm;
  }
  .card-role {
    font-size: 7pt;
    font-weight: 600;
    color: #f97316;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: 3mm;
  }
  .card-info {
    font-size: 7.5pt;
    color: #374151;
    line-height: 1.6;
  }
  .card-info a { color: #374151; text-decoration: none; }
  .card-logo {
    margin-top: auto;
    display: flex;
    align-items: center;
    gap: 2mm;
  }
  .card-logo img { height: 5mm; }
  .card-logo span { font-size: 6pt; color: #9ca3af; }
</style>
</head>
<body>
<div class="card-grid">
${Array(4).fill(`
  <div class="card">
    <div class="card-left">
      ${user.avatar
        ? `<img src="${user.avatar}" alt="${fullName}" />`
        : `<div class="avatar-placeholder">${(user.firstName?.[0] || "") + (user.lastName?.[0] || "")}</div>`
      }
    </div>
    <div class="card-right">
      <div>
        <div class="card-name">${fullName}</div>
        <div class="card-role">Makléř${regionText ? ` — ${regionText}` : ""}</div>
        <div class="card-info">
          ${user.phone ? `📱 ${user.phone}<br/>` : ""}
          ✉️ ${user.email}<br/>
          🌐 ${profileUrl}
        </div>
      </div>
      <div class="card-logo">
        <img src="https://carmakler.cz/brand/logo-dark.png" alt="CarMakléř" />
        <span>carmakler.cz</span>
      </div>
    </div>
  </div>
`).join("")}
</div>
</body>
</html>`;

  return new NextResponse(cardHtml, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
    },
  });
}
