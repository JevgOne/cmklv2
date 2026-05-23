import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { addWorkflowStep, notifyWatchers } from "@/lib/workflow/actions";

const ALLOWED_ROLES = ["ADMIN", "MANAGER", "REGIONAL_DIRECTOR", "BROKER"];

const documentSchema = z.object({
  name: z.string().min(1).max(200),
  fileName: z.string().min(1),
  url: z.string().url(),
  mimeType: z.string().min(1),
  size: z.number().int().positive().max(10 * 1024 * 1024), // 10MB max
  category: z.enum(["ID_CARD", "INCOME_PROOF", "CONTRACT", "INSURANCE", "PHOTO", "OTHER"]).optional(),
});

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Nepřihlášen" }, { status: 401 });
    }
    if (!ALLOWED_ROLES.includes(session.user.role)) {
      return NextResponse.json({ error: "Přístup odepřen" }, { status: 403 });
    }

    const { id } = await params;

    const documents = await prisma.workflowDocument.findMany({
      where: { requestId: id },
      orderBy: { createdAt: "desc" },
      include: {
        uploadedBy: { select: { firstName: true, lastName: true } },
      },
    });

    return NextResponse.json({ documents });
  } catch (error) {
    console.error("GET /api/workflow/[id]/documents error:", error);
    return NextResponse.json({ error: "Interní chyba serveru" }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Nepřihlášen" }, { status: 401 });
    }
    if (!ALLOWED_ROLES.includes(session.user.role)) {
      return NextResponse.json({ error: "Přístup odepřen" }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const data = documentSchema.parse(body);

    // Verify request exists
    const workflowRequest = await prisma.workflowRequest.findUnique({
      where: { id },
      select: { id: true, title: true },
    });
    if (!workflowRequest) {
      return NextResponse.json({ error: "Požadavek nenalezen" }, { status: 404 });
    }

    const document = await prisma.workflowDocument.create({
      data: {
        requestId: id,
        uploadedById: session.user.id,
        name: data.name,
        fileName: data.fileName,
        url: data.url,
        mimeType: data.mimeType,
        size: data.size,
        category: data.category ?? null,
      },
      include: {
        uploadedBy: { select: { firstName: true, lastName: true } },
      },
    });

    // Audit trail
    await addWorkflowStep(id, session.user.id, "DOCUMENT_ADDED", {
      note: `${data.name} (${data.category ?? "bez kategorie"})`,
    });

    // Notifikace
    const authorName = `${session.user.firstName} ${session.user.lastName}`;
    await notifyWatchers(
      id,
      session.user.id,
      `Nový dokument: ${workflowRequest.title}`,
      `${authorName} nahrál "${data.name}"`,
    );

    return NextResponse.json({ document }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Neplatná data", details: error.issues },
        { status: 400 },
      );
    }
    console.error("POST /api/workflow/[id]/documents error:", error);
    return NextResponse.json({ error: "Interní chyba serveru" }, { status: 500 });
  }
}
