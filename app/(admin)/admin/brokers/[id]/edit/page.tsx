import { redirect, notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { BrokerEditForm } from "@/components/admin/BrokerEditForm";

interface PageProps {
  params: Promise<{ id: string }>;
}

export const dynamic = "force-dynamic";

const ALLOWED_ROLES = ["ADMIN", "MANAGER", "REGIONAL_DIRECTOR"];

export default async function AdminBrokerEditPage({ params }: PageProps) {
  const session = await getServerSession(authOptions);

  if (!session?.user || !ALLOWED_ROLES.includes(session.user.role)) {
    redirect("/login");
  }

  const { id } = await params;

  // Manager vidí jen své makléře, Regional Director jen makléře ze svého regionu
  let editFilter: Record<string, string> = {};
  if (session.user.role === "MANAGER") {
    editFilter = { managerId: session.user.id };
  } else if (session.user.role === "REGIONAL_DIRECTOR") {
    const director = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { regionId: true },
    });
    if (director?.regionId) {
      editFilter = { regionId: director.regionId };
    }
  }

  const broker = await prisma.user.findFirst({
    where: { id, role: "BROKER", ...editFilter },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      status: true,
      bio: true,
      specializations: true,
      cities: true,
      ico: true,
      bankAccount: true,
    },
  });

  if (!broker) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 text-[13px] text-gray-500 mb-2">
          <span>Admin</span>
          <span>/</span>
          <Link href="/admin/brokers" className="hover:text-gray-700">
            Makléři
          </Link>
          <span>/</span>
          <Link href={`/admin/brokers/${broker.id}`} className="hover:text-gray-700">
            {broker.firstName} {broker.lastName}
          </Link>
          <span>/</span>
          <span className="text-gray-900">Upravit</span>
        </div>
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">
            Upravit: {broker.firstName} {broker.lastName}
          </h1>
          <Link href={`/admin/brokers/${broker.id}`}>
            <Button variant="outline" size="sm">
              ← Zpět na detail
            </Button>
          </Link>
        </div>
      </div>

      <BrokerEditForm
        brokerId={broker.id}
        initialData={{
          firstName: broker.firstName,
          lastName: broker.lastName,
          email: broker.email,
          phone: broker.phone || "",
          status: broker.status,
          bio: broker.bio || "",
          specializations: broker.specializations
            ? JSON.parse(broker.specializations)
            : [],
          cities: broker.cities ? JSON.parse(broker.cities) : [],
          ico: broker.ico || "",
          bankAccount: broker.bankAccount || "",
        }}
      />
    </div>
  );
}
