import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Image from "next/image";
import { ProfileForm } from "@/components/admin/ProfileForm";

const roleLabels: Record<string, string> = {
  ADMIN: "Administrátor",
  BACKOFFICE: "BackOffice",
  MANAGER: "Manažer",
  REGIONAL_DIRECTOR: "Regionální ředitel",
};

export default async function AdminProfilePage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || !["ADMIN", "BACKOFFICE", "MANAGER", "REGIONAL_DIRECTOR"].includes(session.user.role)) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      phone: true,
      avatar: true,
      role: true,
    },
  });

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-gray-500 mb-1">Admin / Profil</p>
        <h1 className="text-2xl font-bold text-gray-900">Můj profil</h1>
      </div>

      {/* User info header */}
      <div className="bg-white rounded-2xl shadow-card p-6 flex items-center gap-4">
        <div className="relative w-16 h-16 rounded-xl overflow-hidden">
          <Image src={user.avatar || "/brand/default-avatar.png"} alt="Avatar" fill className="object-cover" sizes="64px" />
        </div>
        <div>
          <div className="text-lg font-bold text-gray-900">{user.firstName} {user.lastName}</div>
          <div className="text-sm text-gray-500">{user.email}</div>
          <span className="inline-block mt-1 text-[10px] font-bold bg-orange-500 text-white px-2 py-0.5 rounded-full">
            {(roleLabels[user.role] || user.role).toUpperCase()}
          </span>
        </div>
      </div>

      <ProfileForm
        initialData={{
          firstName: user.firstName,
          lastName: user.lastName,
          phone: user.phone || "",
          avatar: user.avatar,
        }}
      />
    </div>
  );
}
