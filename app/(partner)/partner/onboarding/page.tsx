import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const STEP_ROUTES: Record<number, string> = {
  1: "/partner/onboarding/profile",
  2: "/partner/onboarding/documents",
  3: "/partner/onboarding/approval",
};

export default async function PartnerOnboardingPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  const step = session.user.onboardingStep ?? 1;
  const route = STEP_ROUTES[step] || STEP_ROUTES[1];

  redirect(route);
}
