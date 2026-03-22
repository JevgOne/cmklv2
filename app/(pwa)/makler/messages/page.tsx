import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import Link from "next/link";
import Image from "next/image";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";

export default async function MessagesPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");

  const userId = session.user.id;

  // Nacist vsechny vozy maklere s dotazy
  const vehicles = await prisma.vehicle.findMany({
    where: {
      brokerId: userId,
      inquiries: { some: {} },
    },
    include: {
      images: { where: { isPrimary: true }, take: 1 },
      inquiries: {
        orderBy: { createdAt: "desc" },
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  // Seskupit dotazy podle vozu
  const vehiclesWithInquiries = vehicles.map((vehicle) => {
    const newCount = vehicle.inquiries.filter((i) => i.status === "NEW").length;
    const totalCount = vehicle.inquiries.length;
    const lastInquiry = vehicle.inquiries[0];
    const title = `${vehicle.brand} ${vehicle.model}${vehicle.variant ? ` ${vehicle.variant}` : ""}`;
    const primaryImage = vehicle.images[0];

    return {
      id: vehicle.id,
      title,
      primaryImage: primaryImage?.url || null,
      newCount,
      totalCount,
      lastInquiryDate: lastInquiry?.createdAt.toISOString() || "",
      lastBuyerName: lastInquiry?.buyerName || "",
      lastMessage: lastInquiry?.message || "",
    };
  });

  return (
    <div className="p-4 pb-24">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">Zpravy</h1>
          <p className="text-sm text-gray-500 mt-1">Dotazy od kupujicich</p>
        </div>
      </div>

      {vehiclesWithInquiries.length === 0 ? (
        <EmptyState
          icon="💬"
          title="Zatim zadne dotazy"
          description="Jakmile kupujici projevi zajem o vase vozidla, uvidite zde jejich dotazy."
        />
      ) : (
        <div className="space-y-3">
          {vehiclesWithInquiries.map((v) => (
            <Link
              key={v.id}
              href={`/makler/messages/${v.id}`}
              className="block no-underline"
            >
              <Card hover className="flex overflow-hidden">
                {/* Miniatura vozu */}
                <div className="w-20 h-20 flex-shrink-0 bg-gray-100 relative">
                  {v.primaryImage ? (
                    <Image
                      src={v.primaryImage}
                      alt={v.title}
                      fill
                      className="object-cover"
                      sizes="80px"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-2xl text-gray-300">
                      🚗
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 p-3 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-bold text-gray-900 text-sm truncate">
                      {v.title}
                    </h3>
                    {v.newCount > 0 && (
                      <Badge variant="top">
                        {v.newCount}
                      </Badge>
                    )}
                  </div>

                  <p className="text-xs text-gray-600 mt-1 truncate">
                    {v.lastBuyerName}: {v.lastMessage}
                  </p>

                  <div className="flex items-center gap-2 mt-1.5 text-xs text-gray-400">
                    <span>{v.totalCount} {v.totalCount === 1 ? "dotaz" : v.totalCount < 5 ? "dotazy" : "dotazu"}</span>
                    <span>·</span>
                    <span>{formatDate(v.lastInquiryDate)}</span>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function formatDate(dateStr: string): string {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return "Prave ted";
  if (diffMins < 60) return `pred ${diffMins} min`;

  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `pred ${diffHours} hod`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `pred ${diffDays} dny`;

  return date.toLocaleDateString("cs-CZ");
}
