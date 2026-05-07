import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ProfileSetupWizard } from "@/components/web/ProfileSetupWizard";

export const metadata: Metadata = {
  title: "Nastavit profil",
  robots: { index: false, follow: false },
};

export default async function ProfileSetupPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  return <ProfileSetupWizard />;
}
