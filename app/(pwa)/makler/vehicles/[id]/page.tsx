import { redirect, notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { VehicleDetailHub } from "@/components/pwa/vehicles/VehicleDetailHub";

export default async function VehicleDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");

  const { id } = await params;
  const userId = session.user.id;
  const userRole = session.user.role;

  const vehicle = await prisma.vehicle.findUnique({
    where: { id },
    include: {
      images: { orderBy: { order: "asc" } },
      inquiries: {
        orderBy: { createdAt: "desc" },
      },
      contracts: {
        orderBy: { createdAt: "desc" },
      },
      changeLog: {
        orderBy: { createdAt: "desc" },
        take: 50,
      },
      damageReports: {
        orderBy: { createdAt: "desc" },
        include: {
          reportedBy: {
            select: { id: true, firstName: true, lastName: true },
          },
        },
      },
      broker: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          phone: true,
          email: true,
          managerId: true,
        },
      },
    },
  });

  if (!vehicle) notFound();

  // Autorizace: vlastnik, manazer vlastnika, nebo admin/backoffice
  const isAdmin = userRole === "ADMIN" || userRole === "BACKOFFICE";
  const isOwner = vehicle.brokerId === userId;
  const isManager =
    userRole === "MANAGER" && vehicle.broker?.managerId === userId;

  if (!isAdmin && !isOwner && !isManager) {
    notFound();
  }

  // Fetch exclusive contract data separately (optional relation)
  let exclusiveContract: {
    id: string;
    exclusiveEndDate: string | null;
    earlyTermination: boolean;
    terminationReason: string | null;
    violationReported: boolean;
    violationDetails: string | null;
    penaltyAmount: number | null;
    pdfUrl: string | null;
    status: string;
  } | null = null;

  if (vehicle.exclusiveContractId) {
    const contract = await prisma.contract.findUnique({
      where: { id: vehicle.exclusiveContractId },
      select: {
        id: true,
        exclusiveEndDate: true,
        earlyTermination: true,
        terminationReason: true,
        violationReported: true,
        violationDetails: true,
        penaltyAmount: true,
        pdfUrl: true,
        status: true,
      },
    });
    if (contract) {
      exclusiveContract = {
        ...contract,
        exclusiveEndDate: contract.exclusiveEndDate?.toISOString() ?? null,
      };
    }
  }

  // Statistiky
  const daysOnPlatform = vehicle.publishedAt
    ? Math.floor(
        (Date.now() - new Date(vehicle.publishedAt).getTime()) /
          (1000 * 60 * 60 * 24)
      )
    : 0;

  const newInquiriesCount = vehicle.inquiries.filter(
    (i) => i.status === "NEW"
  ).length;

  const stats = {
    viewCount: vehicle.viewCount,
    totalInquiries: vehicle.inquiries.length,
    newInquiries: newInquiriesCount,
    daysOnPlatform,
    damageReportsCount: vehicle.damageReports.length,
    contractsCount: vehicle.contracts.length,
  };

  // Serializace dat pro client component (DateTime -> string)
  const serializedVehicle = JSON.parse(JSON.stringify(vehicle));

  return (
    <VehicleDetailHub
      vehicle={serializedVehicle}
      stats={stats}
      exclusiveContract={exclusiveContract}
    />
  );
}
