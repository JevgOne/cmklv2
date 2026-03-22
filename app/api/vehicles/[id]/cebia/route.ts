import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/* ------------------------------------------------------------------ */
/*  POST /api/vehicles/[id]/cebia — Prověrka vozidla přes CEBIA       */
/*  Proxy na /api/cebia/check s automatickým doplněním VIN            */
/* ------------------------------------------------------------------ */

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Najít vozidlo a jeho VIN
    const vehicle = await prisma.vehicle.findUnique({
      where: { id },
      select: { vin: true, brokerId: true },
    });

    if (!vehicle) {
      return NextResponse.json({ error: "Vozidlo nenalezeno" }, { status: 404 });
    }

    if (!vehicle.vin || vehicle.vin.startsWith("PRIV")) {
      return NextResponse.json(
        { error: "VIN není k dispozici pro toto vozidlo" },
        { status: 400 }
      );
    }

    // Zjistit, zda je to makléřské auto (= zdarma)
    const session = await getServerSession(authOptions);
    const isBrokerListing = !!vehicle.brokerId;

    if (isBrokerListing && session?.user?.id) {
      // Pro přihlášené u makléřských vozidel — přesměrovat na cebia/check
      const res = await fetch(new URL("/api/cebia/check", request.url), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          cookie: request.headers.get("cookie") || "",
        },
        body: JSON.stringify({ vin: vehicle.vin, listingId: id }),
      });

      const data = await res.json();
      return NextResponse.json(data, { status: res.status });
    }

    // Pro nepřihlášené nebo placené — vrátit URL na platební stránku
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Pro prověrku se musíte přihlásit", loginRequired: true },
        { status: 401 }
      );
    }

    // Přesměrovat na cebia/check
    const res = await fetch(new URL("/api/cebia/check", request.url), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        cookie: request.headers.get("cookie") || "",
      },
      body: JSON.stringify({ vin: vehicle.vin, listingId: id }),
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error("POST /api/vehicles/[id]/cebia error:", error);
    return NextResponse.json(
      { error: "Interní chyba serveru" },
      { status: 500 }
    );
  }
}
