import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import { WorkflowDetail } from "@/components/pwa/workflow/WorkflowDetail";
import type { WorkflowRequestDetail } from "@/types/workflow";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const request = await prisma.workflowRequest.findUnique({
    where: { id },
    select: { title: true },
  });
  return {
    title: request ? `${request.title} | Carmakler` : "Požadavek | Carmakler",
  };
}

const ALLOWED_ROLES = ["BROKER", "MANAGER", "REGIONAL_DIRECTOR", "ADMIN"];

export default async function PozadavekDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user || !ALLOWED_ROLES.includes(session.user.role)) {
    redirect("/login");
  }

  const request = await prisma.workflowRequest.findUnique({
    where: { id },
    include: {
      createdBy: {
        select: { id: true, firstName: true, lastName: true, avatar: true },
      },
      assignedTo: {
        select: { id: true, firstName: true, lastName: true, avatar: true },
      },
      vehicle: {
        select: {
          id: true,
          brand: true,
          model: true,
          year: true,
          vin: true,
          images: {
            where: { isPrimary: true },
            select: { url: true },
            take: 1,
          },
        },
      },
      steps: {
        include: {
          user: {
            select: { id: true, firstName: true, lastName: true },
          },
        },
        orderBy: { createdAt: "asc" },
      },
      comments: {
        include: {
          user: {
            select: { id: true, firstName: true, lastName: true },
          },
        },
        orderBy: { createdAt: "asc" },
      },
      documents: {
        include: {
          uploadedBy: {
            select: { id: true, firstName: true, lastName: true },
          },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!request) notFound();

  // Load contact if linked
  const contact = request.contactId
    ? await prisma.sellerContact.findUnique({
        where: { id: request.contactId },
        select: { id: true, name: true, phone: true },
      })
    : null;

  // Filter internal comments for brokers
  const isBroker = session.user.role === "BROKER";

  const serialized: WorkflowRequestDetail = {
    id: request.id,
    type: request.type as WorkflowRequestDetail["type"],
    category: request.category,
    title: request.title,
    description: request.description,
    priority: request.priority as WorkflowRequestDetail["priority"],
    status: request.status as WorkflowRequestDetail["status"],
    createdBy: request.createdBy,
    assignedTo: request.assignedTo,
    assignedRole: request.assignedRole,
    vehicleId: request.vehicleId,
    vehicleLabel: request.vehicle
      ? `${request.vehicle.brand} ${request.vehicle.model}`
      : null,
    vehicleContext: request.vehicle
      ? {
          id: request.vehicle.id,
          brand: request.vehicle.brand,
          model: request.vehicle.model,
          year: request.vehicle.year,
          vin: request.vehicle.vin,
          thumbnailUrl: request.vehicle.images[0]?.url ?? null,
        }
      : null,
    contactContext: contact ?? null,
    dueAt: request.dueAt?.toISOString() ?? null,
    slaBreached: request.slaBreached,
    createdAt: request.createdAt.toISOString(),
    updatedAt: request.updatedAt.toISOString(),
    resolution: request.resolution,
    resolvedAt: request.resolvedAt?.toISOString() ?? null,
    metadata: request.metadata ? JSON.parse(request.metadata) : null,
    steps: request.steps.map((s) => ({
      id: s.id,
      action: s.action,
      fromStatus: s.fromStatus,
      toStatus: s.toStatus,
      note: s.note,
      performedBy: s.user,
      createdAt: s.createdAt.toISOString(),
    })),
    comments: request.comments
      .filter((c) => !isBroker || !c.isInternal)
      .map((c) => ({
        id: c.id,
        content: c.content,
        isInternal: c.isInternal,
        author: c.user,
        parentId: c.parentId,
        createdAt: c.createdAt.toISOString(),
      })),
    documents: request.documents.map((d) => ({
      id: d.id,
      name: d.name,
      url: d.url,
      type: d.mimeType,
      category: d.category,
      size: d.size,
      uploadedBy: d.uploadedBy,
      createdAt: d.createdAt.toISOString(),
    })),
  };

  return (
    <WorkflowDetail
      request={serialized}
      userId={session.user.id}
      userRole={session.user.role}
    />
  );
}
