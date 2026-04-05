import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";
import { slugify } from "@/lib/utils";
import { sendVerificationEmail } from "@/lib/email-verification";

const registerPartnerSchema = z.object({
  // Firemni udaje
  companyName: z.string().min(1, "Název firmy je povinný"),
  ico: z.string().regex(/^\d{8}$/, "IČO musí mít přesně 8 číslic"),
  type: z.enum(["AUTOBAZAR", "VRAKOVISTE"]),

  // Kontaktni osoba
  contactName: z.string().min(1, "Kontaktní osoba je povinná"),
  email: z.string().email("Neplatný formát emailu"),
  phone: z.string().min(1, "Telefon je povinný"),
  password: z.string().min(8, "Heslo musí mít alespoň 8 znaků"),

  // Adresa
  street: z.string().optional(),
  city: z.string().optional(),
  zip: z.string().optional(),

  // Popis
  description: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const ip = request.headers.get("x-forwarded-for") || "unknown";
    const { success } = rateLimit(ip, 5, 15 * 60 * 1000);
    if (!success) {
      return NextResponse.json(
        { error: "Příliš mnoho pokusů. Zkuste to později." },
        { status: 429 }
      );
    }

    const body = await request.json();
    const data = registerPartnerSchema.parse(body);

    // Kontrola, zda email jiz existuje
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Uživatel s tímto emailem již existuje" },
        { status: 409 }
      );
    }

    // Kontrola ICO duplicity
    const existingPartner = await prisma.partner.findUnique({
      where: { ico: data.ico },
    });

    if (existingPartner) {
      return NextResponse.json(
        { error: "Partner s tímto IČO již existuje" },
        { status: 409 }
      );
    }

    // Hash hesla
    const passwordHash = await bcrypt.hash(data.password, 12);

    // Parse contact name into first/last
    const nameParts = data.contactName.trim().split(" ");
    const firstName = nameParts[0] || data.contactName;
    const lastName = nameParts.slice(1).join(" ") || "";

    const role = data.type === "AUTOBAZAR" ? "PARTNER_BAZAR" : "PARTNER_VRAKOVISTE";

    // Generate slug for partner
    const baseSlug = slugify(data.companyName);
    const existingSlug = await prisma.partner.findUnique({ where: { slug: baseSlug } });
    const slug = existingSlug ? `${baseSlug}-${Date.now().toString(36)}` : baseSlug;

    // Create user + partner in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Vytvoreni uzivatele
      const user = await tx.user.create({
        data: {
          email: data.email,
          passwordHash,
          firstName,
          lastName,
          phone: data.phone,
          role,
          status: "PENDING", // Partneri musi byt schvaleni adminem
          companyName: data.companyName,
          ico: data.ico,
        },
      });

      // Vytvoreni partnerskeho zaznamu
      const partner = await tx.partner.create({
        data: {
          name: data.companyName,
          type: data.type,
          ico: data.ico,
          address: data.street || null,
          city: data.city || null,
          zip: data.zip || null,
          phone: data.phone,
          email: data.email,
          contactPerson: data.contactName,
          description: data.description || null,
          slug,
          status: "JEDNAME", // Automaticky nastaveno na "jednáme"
          userId: user.id,
        },
      });

      // Log activity
      await tx.partnerActivity.create({
        data: {
          partnerId: partner.id,
          userId: user.id,
          type: "SYSTEM",
          title: "Registrace partnera",
          description: `Self-service registrace: ${data.companyName} (${data.type})`,
        },
      });

      return { user, partner };
    });

    // Odeslat verifikacni email
    try {
      await sendVerificationEmail(result.user.email, result.user.firstName);
    } catch (error) {
      console.error("Failed to send verification email:", error);
    }

    return NextResponse.json(
      {
        user: {
          id: result.user.id,
          email: result.user.email,
          firstName: result.user.firstName,
          lastName: result.user.lastName,
          role: result.user.role,
          status: result.user.status,
        },
        partnerId: result.partner.id,
        emailVerificationRequired: true,
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Neplatná data", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Partner registration error:", error);
    return NextResponse.json(
      { error: "Interní chyba serveru" },
      { status: 500 }
    );
  }
}
