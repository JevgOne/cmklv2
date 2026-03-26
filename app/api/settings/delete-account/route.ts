import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createNotification } from "@/lib/notifications";

export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Nepřihlášen" }, { status: 401 });
    }

    const userName = session.user.name || session.user.email;

    const admins = await prisma.user.findMany({
      where: {
        role: { in: ["ADMIN", "BACKOFFICE"] },
        status: "ACTIVE",
      },
      select: { id: true },
    });

    await Promise.all(
      admins.map((admin) =>
        createNotification({
          userId: admin.id,
          type: "SYSTEM",
          title: "Žádost o smazání účtu",
          body: `Makléř ${userName} žádá o smazání účtu.`,
          link: `/admin/users/${session.user.id}`,
        })
      )
    );

    return NextResponse.json({
      message: "Žádost o smazání účtu byla odeslána. Budeme vás kontaktovat.",
    });
  } catch (error) {
    console.error("POST /api/settings/delete-account error:", error);
    return NextResponse.json(
      { error: "Interní chyba serveru" },
      { status: 500 }
    );
  }
}
