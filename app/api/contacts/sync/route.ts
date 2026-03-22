import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { syncContactsSchema } from "@/lib/validators/contact";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Nepřihlášen" }, { status: 401 });
    }

    const brokerId = session.user.id;
    const body = await request.json();
    const parsed = syncContactsSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Neplatná data", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const results: Array<{ action: string; id?: string; success: boolean; error?: string }> = [];

    for (const change of parsed.data.changes) {
      try {
        if (change.action === "CREATE" && change.data) {
          const { name, phone, email, address, city, note } = change.data as Record<string, string | undefined>;
          const contact = await prisma.sellerContact.create({
            data: {
              brokerId,
              name: name || "",
              phone: phone || "",
              email: email || null,
              address: address || null,
              city: city || null,
              note: note || null,
            },
          });
          results.push({ action: "CREATE", id: contact.id, success: true });
        } else if (change.action === "UPDATE" && change.id && change.data) {
          const existing = await prisma.sellerContact.findUnique({
            where: { id: change.id },
            select: { brokerId: true, updatedAt: true },
          });

          if (!existing || existing.brokerId !== brokerId) {
            results.push({ action: "UPDATE", id: change.id, success: false, error: "Nenalezen" });
            continue;
          }

          // Last-write-wins: skip if server version is newer
          if (existing.updatedAt.getTime() > change.updatedAt) {
            results.push({ action: "UPDATE", id: change.id, success: false, error: "Konflikt — novější verze na serveru" });
            continue;
          }

          const { name, phone, email, address, city, note, nextFollowUp, followUpNote } = change.data as Record<string, string | undefined>;
          await prisma.sellerContact.update({
            where: { id: change.id },
            data: {
              ...(name !== undefined ? { name } : {}),
              ...(phone !== undefined ? { phone } : {}),
              ...(email !== undefined ? { email: email || null } : {}),
              ...(address !== undefined ? { address: address || null } : {}),
              ...(city !== undefined ? { city: city || null } : {}),
              ...(note !== undefined ? { note: note || null } : {}),
              ...(nextFollowUp !== undefined
                ? { nextFollowUp: nextFollowUp ? new Date(nextFollowUp) : null }
                : {}),
              ...(followUpNote !== undefined ? { followUpNote: followUpNote || null } : {}),
            },
          });
          results.push({ action: "UPDATE", id: change.id, success: true });
        } else if (change.action === "DELETE" && change.id) {
          const existing = await prisma.sellerContact.findUnique({
            where: { id: change.id },
            select: { brokerId: true },
          });

          if (existing && existing.brokerId === brokerId) {
            await prisma.sellerContact.delete({ where: { id: change.id } });
          }
          results.push({ action: "DELETE", id: change.id, success: true });
        }
      } catch (err) {
        results.push({
          action: change.action,
          id: change.id,
          success: false,
          error: err instanceof Error ? err.message : "Neznámá chyba",
        });
      }
    }

    // Return full contact list for client cache refresh
    const contacts = await prisma.sellerContact.findMany({
      where: { brokerId },
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json({ results, contacts });
  } catch (error) {
    console.error("POST /api/contacts/sync error:", error);
    return NextResponse.json(
      { error: "Interní chyba serveru" },
      { status: 500 }
    );
  }
}
