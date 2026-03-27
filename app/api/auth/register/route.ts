import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";

const registerSchema = z.object({
  email: z.string().email("Neplatný formát emailu"),
  password: z.string().min(8, "Heslo musí mít alespoň 8 znaků"),
  firstName: z.string().min(1, "Jméno je povinné"),
  lastName: z.string().min(1, "Příjmení je povinné"),
  phone: z.string().optional(),
  // Inzertní platforma
  role: z.enum(["ADVERTISER", "BUYER"]).default("ADVERTISER"),
  accountType: z.enum(["PRIVATE", "DEALER", "BAZAAR"]).optional(),
  companyName: z.string().optional(),
  ico: z.string().optional(),
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
    const data = registerSchema.parse(body);

    // Kontrola, zda email již existuje
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Uživatel s tímto emailem již existuje" },
        { status: 409 }
      );
    }

    // Hash hesla
    const passwordHash = await bcrypt.hash(data.password, 12);

    // ADVERTISER a BUYER se aktivují rovnou
    const role = data.role;
    const autoActivate = role === "ADVERTISER" || role === "BUYER";

    // Vytvoření uživatele
    const user = await prisma.user.create({
      data: {
        email: data.email,
        passwordHash,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone ?? null,
        role,
        status: autoActivate ? "ACTIVE" : "PENDING",
        // Inzertní platforma
        accountType: data.accountType ?? null,
        companyName: data.companyName ?? null,
        ico: data.ico ?? null,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        status: true,
        accountType: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ user }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Neplatná data", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Interní chyba serveru" },
      { status: 500 }
    );
  }
}
