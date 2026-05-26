import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const JWT_SECRET = process.env.NEXTAUTH_SECRET!;
const TOKEN_EXPIRY = "30d";
const REFRESH_EXPIRY = "90d";

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const { success } = rateLimit(`mobile-login:${ip}`, 10, 15 * 60 * 1000);
    if (!success) {
      return NextResponse.json({ error: "Příliš mnoho pokusů" }, { status: 429 });
    }

    const body = await request.json();
    const { email, password } = loginSchema.parse(body);
    const emailNormalized = email.toLowerCase().trim();

    const user = await prisma.user.findFirst({
      where: { email: { equals: emailNormalized, mode: "insensitive" } },
    });

    if (!user) {
      return NextResponse.json({ error: "Neplatné přihlašovací údaje" }, { status: 401 });
    }

    if (user.status !== "ACTIVE" && user.status !== "ONBOARDING") {
      return NextResponse.json({ error: "Účet není aktivní" }, { status: 403 });
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      return NextResponse.json({ error: "Neplatné přihlašovací údaje" }, { status: 401 });
    }

    const payload = {
      sub: user.id,
      email: user.email,
      name: `${user.firstName} ${user.lastName}`,
      role: user.role,
      status: user.status,
      firstName: user.firstName,
      lastName: user.lastName,
      avatar: user.avatar,
      accountType: user.accountType,
      level: user.level ?? "STAR_1",
      onboardingStep: user.onboardingStep,
      onboardingCompleted: user.onboardingCompleted,
      isEmailVerified: !!user.emailVerified,
    };

    const accessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });
    const refreshToken = jwt.sign({ sub: user.id, type: "refresh" }, JWT_SECRET, { expiresIn: REFRESH_EXPIRY });

    return NextResponse.json({
      accessToken,
      refreshToken,
      user: payload,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Neplatný formát dat" }, { status: 400 });
    }
    return NextResponse.json({ error: "Chyba serveru" }, { status: 500 });
  }
}
