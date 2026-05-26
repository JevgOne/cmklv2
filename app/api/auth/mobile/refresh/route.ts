import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { prisma } from "@/lib/prisma";

const JWT_SECRET = process.env.NEXTAUTH_SECRET!;

export async function POST(request: NextRequest) {
  try {
    const { refreshToken } = await request.json();
    if (!refreshToken) {
      return NextResponse.json({ error: "Missing refresh token" }, { status: 400 });
    }

    const decoded = jwt.verify(refreshToken, JWT_SECRET) as { sub: string; type: string };
    if (decoded.type !== "refresh") {
      return NextResponse.json({ error: "Invalid token type" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.sub },
      select: {
        id: true, email: true, firstName: true, lastName: true,
        avatar: true, role: true, status: true, accountType: true,
        level: true, onboardingStep: true, onboardingCompleted: true,
        emailVerified: true,
      },
    });

    if (!user || (user.status !== "ACTIVE" && user.status !== "ONBOARDING")) {
      return NextResponse.json({ error: "Účet neaktivní" }, { status: 403 });
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

    const newAccessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: "30d" });

    return NextResponse.json({ accessToken: newAccessToken, user: payload });
  } catch {
    return NextResponse.json({ error: "Invalid or expired refresh token" }, { status: 401 });
  }
}
