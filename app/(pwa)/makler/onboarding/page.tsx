import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const STEP_ROUTES: Record<number, string> = {
  1: "/makler/onboarding/profile",
  2: "/makler/onboarding/documents",
  3: "/makler/onboarding/training",
  4: "/makler/onboarding/contract",
  5: "/makler/onboarding/approval",
};

export default async function OnboardingPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  // Fresh DB check — JWT can be stale after admin activation
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { status: true, onboardingStep: true },
  });

  // If broker is already ACTIVE → go straight to dashboard
  if (user?.status === "ACTIVE") {
    redirect("/makler/dashboard");
  }

  const step = user?.onboardingStep ?? session.user.onboardingStep ?? 1;
  const route = STEP_ROUTES[step] || STEP_ROUTES[1];

  redirect(route);
}
