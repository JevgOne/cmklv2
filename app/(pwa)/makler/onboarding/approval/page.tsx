import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ApprovalWaiting } from "./ApprovalWaiting";

export default async function OnboardingApprovalPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  // Fresh DB check — broker may have been activated while on this page
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { status: true },
  });

  if (user?.status === "ACTIVE") {
    redirect("/makler/dashboard");
  }

  return <ApprovalWaiting />;
}
