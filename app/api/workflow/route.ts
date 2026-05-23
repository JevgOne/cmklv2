import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createWorkflowRequestSchema } from "@/lib/validators/workflow";
import { createWorkflowRequest } from "@/lib/workflow/actions";

const ALLOWED_ROLES = ["ADMIN", "MANAGER", "REGIONAL_DIRECTOR", "BROKER"];

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Nepřihlášen" }, { status: 401 });
    }
    if (!ALLOWED_ROLES.includes(session.user.role)) {
      return NextResponse.json({ error: "Přístup odepřen" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const type = searchParams.get("type");
    const priority = searchParams.get("priority");
    const assignedToId = searchParams.get("assignedToId");
    const createdById = searchParams.get("createdById");
    const vehicleId = searchParams.get("vehicleId");
    const take = Math.min(Number(searchParams.get("take")) || 20, 50);
    const cursor = searchParams.get("cursor") || undefined;
    const scope = searchParams.get("scope"); // "my" | "assigned" | "all"

    const where: Record<string, unknown> = {};

    if (status) where.status = status;
    if (type) where.type = type;
    if (priority) where.priority = priority;
    if (assignedToId) where.assignedToId = assignedToId;
    if (createdById) where.createdById = createdById;
    if (vehicleId) where.vehicleId = vehicleId;

    // Scope filtering
    const isAdmin = session.user.role === "ADMIN";
    if (scope === "my") {
      where.createdById = session.user.id;
    } else if (scope === "assigned") {
      where.assignedToId = session.user.id;
    } else if (!isAdmin) {
      // Non-admins see only their created or assigned requests
      where.OR = [
        { createdById: session.user.id },
        { assignedToId: session.user.id },
        { watchers: { some: { userId: session.user.id } } },
      ];
    }

    const [requests, total] = await Promise.all([
      prisma.workflowRequest.findMany({
        where,
        orderBy: [
          { priority: "desc" },
          { createdAt: "desc" },
        ],
        take: take + 1,
        ...(cursor && { cursor: { id: cursor }, skip: 1 }),
        include: {
          createdBy: { select: { firstName: true, lastName: true, role: true } },
          assignedTo: { select: { firstName: true, lastName: true, role: true } },
          vehicle: { select: { brand: true, model: true, id: true } },
          _count: { select: { comments: true, documents: true } },
        },
      }),
      prisma.workflowRequest.count({ where }),
    ]);

    const hasMore = requests.length > take;
    const items = hasMore ? requests.slice(0, take) : requests;
    const nextCursor = hasMore ? items[items.length - 1]?.id : undefined;

    return NextResponse.json({
      requests: items,
      total,
      nextCursor,
      hasMore,
    });
  } catch (error) {
    console.error("GET /api/workflow error:", error);
    return NextResponse.json({ error: "Interní chyba serveru" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Nepřihlášen" }, { status: 401 });
    }
    if (!ALLOWED_ROLES.includes(session.user.role)) {
      return NextResponse.json({ error: "Přístup odepřen" }, { status: 403 });
    }

    const body = await request.json();
    const data = createWorkflowRequestSchema.parse(body);

    const workflowRequest = await createWorkflowRequest(data, session.user.id);

    return NextResponse.json({ request: workflowRequest }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Neplatná data", details: error.issues },
        { status: 400 },
      );
    }
    console.error("POST /api/workflow error:", error);
    return NextResponse.json({ error: "Interní chyba serveru" }, { status: 500 });
  }
}
