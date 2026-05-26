import { getServerSession } from "next-auth";
import jwt from "jsonwebtoken";
import { authOptions } from "@/lib/auth";

export interface MobileUser {
  id: string;
  email: string;
  name: string;
  role: string;
  status: string;
  firstName: string;
  lastName: string;
  avatar: string | null;
  accountType: string | null;
  level: string;
  onboardingStep: number;
  onboardingCompleted: boolean;
  isEmailVerified: boolean;
}

export async function getSessionOrMobileToken(
  request?: Request
): Promise<{ user: MobileUser } | null> {
  // 1. Try NextAuth session first (web)
  const session = await getServerSession(authOptions);
  if (session?.user?.id) return { user: session.user as unknown as MobileUser };

  // 2. Try Bearer token (mobile)
  if (!request) return null;
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;

  try {
    const token = authHeader.slice(7);
    const decoded = jwt.verify(token, process.env.NEXTAUTH_SECRET!) as Record<string, unknown> & { sub: string };
    return {
      user: {
        id: decoded.sub,
        email: decoded.email as string,
        name: decoded.name as string,
        role: decoded.role as string,
        status: decoded.status as string,
        firstName: decoded.firstName as string,
        lastName: decoded.lastName as string,
        avatar: (decoded.avatar as string) ?? null,
        accountType: (decoded.accountType as string) ?? null,
        level: (decoded.level as string) ?? "STAR_1",
        onboardingStep: (decoded.onboardingStep as number) ?? 0,
        onboardingCompleted: (decoded.onboardingCompleted as boolean) ?? false,
        isEmailVerified: (decoded.isEmailVerified as boolean) ?? false,
      },
    };
  } catch {
    return null;
  }
}
