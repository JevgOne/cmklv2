import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createWorkflowCommentSchema } from "@/lib/validators/workflow";
import { addWorkflowStep, notifyWatchers } from "@/lib/workflow/actions";

const ALLOWED_ROLES = ["ADMIN", "BACKOFFICE", "MANAGER", "REGIONAL_DIRECTOR", "BROKER"];

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

    const comments = await prisma.workflowComment.findMany({
      where: { requestId: id, parentId: null },
      orderBy: { createdAt: "asc" },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, role: true, avatar: true } },
        replies: {
          orderBy: { createdAt: "asc" },
          include: {
            user: { select: { id: true, firstName: true, lastName: true, role: true, avatar: true } },
          },
        },
      },
    });

    return NextResponse.json({ comments });
  } catch (error) {
    console.error("GET /api/workflow/[id]/comments error:", error);
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
    const data = createWorkflowCommentSchema.parse(body);

    // Verify request exists
    const workflowRequest = await prisma.workflowRequest.findUnique({
      where: { id },
      select: { id: true, title: true, status: true },
    });
    if (!workflowRequest) {
      return NextResponse.json({ error: "Požadavek nenalezen" }, { status: 404 });
    }

    // Broker nemůže psát interní komentáře
    const isAdmin = ["ADMIN", "BACKOFFICE", "MANAGER", "REGIONAL_DIRECTOR"].includes(session.user.role);
    const isInternal = isAdmin ? data.isInternal : false;

    const comment = await prisma.workflowComment.create({
      data: {
        requestId: id,
        userId: session.user.id,
        content: data.content,
        isInternal,
        parentId: data.parentId ?? null,
      },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, role: true, avatar: true } },
      },
    });

    // Audit trail
    await addWorkflowStep(id, session.user.id, "COMMENTED", {
      note: data.content.length > 100 ? data.content.slice(0, 100) + "…" : data.content,
    });

    // If WAITING_INFO and creator/broker comments → auto-resume to IN_PROGRESS
    if (workflowRequest.status === "WAITING_INFO") {
      const isCreator = await prisma.workflowRequest.findFirst({
        where: { id, createdById: session.user.id },
      });
      if (isCreator) {
        await prisma.workflowRequest.update({
          where: { id },
          data: { status: "IN_PROGRESS" },
        });
        await addWorkflowStep(id, session.user.id, "STATUS_CHANGED", {
          fromStatus: "WAITING_INFO",
          toStatus: "IN_PROGRESS",
          note: "Automaticky obnoveno po odpovědi",
        });
      }
    }

    // Notifikace watcher-ům
    const authorName = `${session.user.firstName} ${session.user.lastName}`;
    const preview = data.content.length > 80 ? data.content.slice(0, 80) + "…" : data.content;
    await notifyWatchers(
      id,
      session.user.id,
      `Komentář: ${workflowRequest.title}`,
      `${authorName}: "${preview}"`,
    );

    // Auto-watch commenter
    await prisma.workflowWatcher.upsert({
      where: { requestId_userId: { requestId: id, userId: session.user.id } },
      update: {},
      create: { requestId: id, userId: session.user.id },
    });

    return NextResponse.json({ comment }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Neplatná data", details: error.issues },
        { status: 400 },
      );
    }
    console.error("POST /api/workflow/[id]/comments error:", error);
    return NextResponse.json({ error: "Interní chyba serveru" }, { status: 500 });
  }
}
