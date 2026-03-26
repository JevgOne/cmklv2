import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SettingsContent } from "@/components/pwa/SettingsContent";

export default async function SettingsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      email: true,
      ico: true,
      bankAccount: true,
      firstName: true,
      lastName: true,
      quickModeEnabled: true,
      level: true,
    },
  });

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="p-4 pb-24 max-w-lg mx-auto">
      <h1 className="text-2xl font-extrabold text-gray-900 mb-6">Nastavení</h1>
      <SettingsContent
        email={user.email}
        ico={user.ico || ""}
        bankAccount={user.bankAccount || ""}
        quickModeEnabled={user.quickModeEnabled}
        userLevel={user.level}
      />
    </div>
  );
}
