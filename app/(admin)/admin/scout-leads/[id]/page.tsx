import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ScoutLeadDetail } from "@/components/admin/scout-leads/ScoutLeadDetail";

export const dynamic = "force-dynamic";

export default async function AdminScoutLeadDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getServerSession(authOptions);
  const { id } = await params;

  const lead = await prisma.scoutLead.findUnique({
    where: { id },
    select: { id: true, name: true, assignedToId: true },
  });

  if (!lead) notFound();

  // Broker can only see their own leads
  if (
    session?.user?.role === "BROKER" &&
    lead.assignedToId !== session.user.id
  ) {
    notFound();
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <div className="flex items-center gap-2 text-[13px] text-gray-500 mb-2">
          <span>Admin</span>
          <span>/</span>
          <Link
            href="/admin/scout-leads"
            className="hover:text-gray-700"
          >
            Lead Scout
          </Link>
          <span>/</span>
          <span className="text-gray-900 font-medium">Detail</span>
        </div>
        <div className="flex items-center justify-between">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900">
            {lead.name}
          </h1>
          <Link
            href="/admin/scout-leads"
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            Zpět na seznam
          </Link>
        </div>
      </div>

      <ScoutLeadDetail id={id} />
    </div>
  );
}
