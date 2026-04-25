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

  const html = `<!DOCTYPE html>
<html lang="cs">
<head>
<meta charset="UTF-8">
<title>CarMakléř — Prodejte auto za nejlepší cenu | ${fullName}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&display=swap');
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Outfit', sans-serif; background: #f8f9fa; }
  @media print {
    @page { size: A4 landscape; margin: 0; }
    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .slide { page-break-after: always; page-break-inside: avoid; }
    .slide:last-child { page-break-after: auto; }
  }
  .slide {
    width: 297mm; height: 210mm;
    position: relative; overflow: hidden;
    display: flex; flex-direction: column;
  }

  /* --- SLIDE 1: Title --- */
  .slide-title {
    background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
    color: white;
    justify-content: center; align-items: center; text-align: center;
    padding: 20mm;
  }
  .slide-title .logo { height: 14mm; margin-bottom: 12mm; }
  .slide-title h1 { font-size: 36pt; font-weight: 800; line-height: 1.2; margin-bottom: 6mm; }
  .slide-title h1 span { color: #f97316; }
  .slide-title p { font-size: 16pt; font-weight: 300; color: rgba(255,255,255,0.7); margin-bottom: 16mm; }
  .broker-intro {
    display: flex; align-items: center; gap: 5mm;
    background: rgba(255,255,255,0.1); border-radius: 4mm; padding: 4mm 8mm;
  }
  .broker-intro img {
    width: 16mm; height: 16mm; border-radius: 50%; object-fit: cover; border: 2px solid #f97316;
  }
  .broker-intro .placeholder-avatar {
    width: 16mm; height: 16mm; border-radius: 50%;
    background: rgba(249,115,22,0.3); display: flex; align-items: center; justify-content: center;
    color: #f97316; font-size: 14pt; font-weight: 700;
  }
  .broker-intro-text { text-align: left; }
  .broker-intro-text .name { font-size: 13pt; font-weight: 600; }
  .broker-intro-text .role { font-size: 10pt; color: rgba(255,255,255,0.6); }

  /* --- SLIDE 2: Why CarMakléř --- */
  .slide-white {
    background: white; padding: 16mm 20mm;
  }
  .slide-white .slide-header {
    display: flex; align-items: center; justify-content: space-between;
    margin-bottom: 12mm; border-bottom: 2px solid #f97316; padding-bottom: 4mm;
  }
  .slide-white .slide-header h2 { font-size: 24pt; font-weight: 700; color: #111827; }
  .slide-white .slide-header img { height: 8mm; }
  .benefits-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 6mm; }
  .benefit-card {
    background: #f8f9fa; border-radius: 4mm; padding: 6mm;
    border-left: 3px solid #f97316;
  }
  .benefit-card h3 { font-size: 13pt; font-weight: 700; color: #111827; margin-bottom: 2mm; }
  .benefit-card p { font-size: 10pt; color: #6b7280; line-height: 1.5; }
  .benefit-card .stat { font-size: 22pt; font-weight: 800; color: #f97316; }

  /* --- SLIDE 3: How it works --- */
  .steps-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 5mm; }
  .step-card {
    background: #f8f9fa; border-radius: 4mm; padding: 6mm; text-align: center;
  }
  .step-number {
    width: 12mm; height: 12mm; border-radius: 50%;
    background: linear-gradient(135deg, #f97316, #ea580c);
    color: white; font-size: 14pt; font-weight: 700;
    display: flex; align-items: center; justify-content: center;
    margin: 0 auto 4mm;
  }
  .step-card h3 { font-size: 11pt; font-weight: 700; color: #111827; margin-bottom: 2mm; }
  .step-card p { font-size: 9pt; color: #6b7280; line-height: 1.4; }

  /* --- SLIDE 4: Stats --- */
  .stats-row {
    display: grid; grid-template-columns: repeat(3, 1fr); gap: 6mm;
    margin-bottom: 10mm;
  }
  .stat-box {
    background: linear-gradient(135deg, #fff7ed, #fff);
    border: 1px solid #fed7aa; border-radius: 4mm; padding: 8mm; text-align: center;
  }
  .stat-box .number { font-size: 32pt; font-weight: 800; color: #f97316; }
  .stat-box .label { font-size: 10pt; color: #6b7280; margin-top: 2mm; }

  /* --- SLIDE 5: CTA --- */
  .slide-cta {
    background: linear-gradient(135deg, #1a1a2e, #0f3460);
    color: white; justify-content: center; align-items: center; text-align: center;
    padding: 20mm;
  }
  .slide-cta h2 { font-size: 30pt; font-weight: 800; margin-bottom: 8mm; }
  .slide-cta h2 span { color: #f97316; }
  .slide-cta .contact-grid {
    display: flex; gap: 8mm; justify-content: center; margin-top: 10mm;
  }
  .contact-item {
    background: rgba(255,255,255,0.1); border-radius: 4mm; padding: 5mm 8mm;
    text-align: center;
  }
  .contact-item .icon { font-size: 18pt; margin-bottom: 2mm; }
  .contact-item .value { font-size: 12pt; font-weight: 600; }
  .contact-item .label { font-size: 8pt; color: rgba(255,255,255,0.5); margin-top: 1mm; }
</style>
</head>
<body>

<!-- SLIDE 1: Title -->
<div class="slide slide-title">
  <img src="https://carmakler.cz/brand/logo-white.png" alt="CarMakléř" class="logo" />
  <h1>Prodejte auto za <span>nejlepší cenu</span></h1>
  <p>Váš makléř se postará o vše — od fotek po předání klíčů</p>
  <div class="broker-intro">
    ${user.avatar
      ? `<img src="${user.avatar}" alt="${fullName}" />`
      : `<div class="placeholder-avatar">${(user.firstName?.[0] || "") + (user.lastName?.[0] || "")}</div>`
    }
    <div class="broker-intro-text">
      <div class="name">${fullName}</div>
      <div class="role">Váš makléř${regionText ? ` — ${regionText}` : ""}</div>
    </div>
  </div>
</div>

<!-- SLIDE 2: Why CarMakléř -->
<div class="slide slide-white">
  <div class="slide-header">
    <h2>Proč prodat přes CarMakléř?</h2>
    <img src="https://carmakler.cz/brand/logo-dark.png" alt="CarMakléř" />
  </div>
  <div class="benefits-grid">
    <div class="benefit-card">
      <div class="stat">+15%</div>
      <h3>Vyšší prodejní cena</h3>
      <p>Díky profesionální prezentaci a cílenému oslovení kupujících prodáme auto v průměru o 15 % dráž než na inzertních portálech.</p>
    </div>
    <div class="benefit-card">
      <div class="stat">0 Kč</div>
      <h3>Žádné náklady předem</h3>
      <p>Neplatíte nic dopředu. Provize 5 % se platí až z úspěšného prodeje. Pokud neprodáme, nic nedlužíte.</p>
    </div>
    <div class="benefit-card">
      <div class="stat">20 dní</div>
      <h3>Průměrná doba prodeje</h3>
      <p>Díky síti makléřů po celé ČR a propojení s kupujícími prodáme auto v průměru do 20 dní.</p>
    </div>
    <div class="benefit-card">
      <div class="stat">100%</div>
      <h3>Kompletní servis</h3>
      <p>Fotky, inzerce, prohlídky, smlouvy, převod — vše zařídí váš osobní makléř. Vy jen předáte klíče.</p>
    </div>
  </div>
</div>

<!-- SLIDE 3: How it works -->
<div class="slide slide-white">
  <div class="slide-header">
    <h2>Jak to funguje?</h2>
    <img src="https://carmakler.cz/brand/logo-dark.png" alt="CarMakléř" />
  </div>
  <div class="steps-grid">
    <div class="step-card">
      <div class="step-number">1</div>
      <h3>Kontaktujte mě</h3>
      <p>Zavolejte nebo napište. Domluvíme se na schůzce u vás nebo u auta.</p>
    </div>
    <div class="step-card">
      <div class="step-number">2</div>
      <h3>Prohlídka a focení</h3>
      <p>Prohlédnu auto, nafotím profesionální fotky a připravím inzerát, který prodává.</p>
    </div>
    <div class="step-card">
      <div class="step-number">3</div>
      <h3>Inzerce a prohlídky</h3>
      <p>Zveřejním na všech portálech, řídím prohlídky a vyjednávám s kupujícími.</p>
    </div>
    <div class="step-card">
      <div class="step-number">4</div>
      <h3>Prodej a předání</h3>
      <p>Připravím smlouvu, zajistím převod a vy obdržíte peníze na účet.</p>
    </div>
  </div>
  <div class="stats-row" style="margin-top: 10mm;">
    <div class="stat-box">
      <div class="number">500+</div>
      <div class="label">Prodaných vozidel</div>
    </div>
    <div class="stat-box">
      <div class="number">98%</div>
      <div class="label">Spokojených klientů</div>
    </div>
    <div class="stat-box">
      <div class="number">50+</div>
      <div class="label">Makléřů po celé ČR</div>
    </div>
  </div>
</div>

<!-- SLIDE 4: CTA -->
<div class="slide slide-cta">
  <img src="https://carmakler.cz/brand/logo-white.png" alt="CarMakléř" style="height: 14mm; margin-bottom: 12mm;" />
  <h2>Připraveni <span>prodat?</span></h2>
  <p style="font-size: 14pt; color: rgba(255,255,255,0.7); max-width: 160mm;">
    Kontaktujte mě a společně najdeme nejlepšího kupce pro vaše auto.
  </p>
  <div class="contact-grid">
    ${user.phone ? `
    <div class="contact-item">
      <div class="icon">📱</div>
      <div class="value">${user.phone}</div>
      <div class="label">Telefon</div>
    </div>` : ""}
    <div class="contact-item">
      <div class="icon">✉️</div>
      <div class="value">${user.email}</div>
      <div class="label">Email</div>
    </div>
    <div class="contact-item">
      <div class="icon">🌐</div>
      <div class="value">${profileUrl}</div>
      <div class="label">Profil</div>
    </div>
  </div>
  <p style="margin-top: 12mm; font-size: 11pt; color: rgba(255,255,255,0.4);">${fullName} — Váš osobní makléř${regionText ? `, ${regionText}` : ""}</p>
</div>

</body>
</html>`;

  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
    },
  });
}
