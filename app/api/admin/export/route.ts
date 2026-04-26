import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const ALLOWED_ROLES = ["ADMIN", "BACKOFFICE"];
const BOM = "\uFEFF";

function csvResponse(content: string, filename: string) {
  return new NextResponse(BOM + content, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}

function escapeCsv(value: string | number | null | undefined): string {
  if (value == null) return "";
  const str = String(value);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

async function exportVehicles() {
  const vehicles = await prisma.vehicle.findMany({
    where: { status: "ACTIVE" },
    include: { broker: { select: { firstName: true, lastName: true, email: true } } },
    orderBy: { createdAt: "desc" },
  });

  const header = "ID,VIN,Značka,Model,Rok,Cena,Stav,Makléř,Email makléře,Vytvořeno\n";
  const rows = vehicles
    .map((v) =>
      [
        escapeCsv(v.id),
        escapeCsv(v.vin),
        escapeCsv(v.brand),
        escapeCsv(v.model),
        escapeCsv(v.year),
        escapeCsv(v.price),
        escapeCsv(v.status),
        escapeCsv(v.broker ? `${v.broker.firstName} ${v.broker.lastName}` : ""),
        escapeCsv(v.broker?.email),
        escapeCsv(v.createdAt.toISOString().slice(0, 10)),
      ].join(",")
    )
    .join("\n");

  const date = new Date().toISOString().slice(0, 10);
  return csvResponse(header + rows, `vozidla-${date}.csv`);
}

async function exportBrokers() {
  const brokers = await prisma.user.findMany({
    where: { role: "BROKER" },
    include: {
      _count: { select: { vehicles: true } },
      region: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const header = "ID,Jméno,Příjmení,Email,Telefon,Region,Počet vozidel,Level,Status,Registrace\n";
  const rows = brokers
    .map((b) =>
      [
        escapeCsv(b.id),
        escapeCsv(b.firstName),
        escapeCsv(b.lastName),
        escapeCsv(b.email),
        escapeCsv(b.phone),
        escapeCsv(b.region?.name),
        escapeCsv(b._count.vehicles),
        escapeCsv(b.level),
        escapeCsv(b.status),
        escapeCsv(b.createdAt.toISOString().slice(0, 10)),
      ].join(",")
    )
    .join("\n");

  const date = new Date().toISOString().slice(0, 10);
  return csvResponse(header + rows, `makleri-${date}.csv`);
}

async function exportCommissions() {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const commissions = await prisma.commission.findMany({
    where: { createdAt: { gte: startOfMonth } },
    include: {
      broker: { select: { firstName: true, lastName: true, email: true } },
      vehicle: { select: { brand: true, model: true, vin: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const header = "ID,Makléř,Email,Vozidlo,VIN,Částka,Status,Datum\n";
  const rows = commissions
    .map((c) =>
      [
        escapeCsv(c.id),
        escapeCsv(c.broker ? `${c.broker.firstName} ${c.broker.lastName}` : ""),
        escapeCsv(c.broker?.email),
        escapeCsv(c.vehicle ? `${c.vehicle.brand} ${c.vehicle.model}` : ""),
        escapeCsv(c.vehicle?.vin),
        escapeCsv(c.commission),
        escapeCsv(c.status),
        escapeCsv(c.createdAt.toISOString().slice(0, 10)),
      ].join(",")
    )
    .join("\n");

  const date = new Date().toISOString().slice(0, 10);
  return csvResponse(header + rows, `provize-${date}.csv`);
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !ALLOWED_ROLES.includes(session.user.role)) {
      return NextResponse.json({ error: "Přístup odepřen" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");

    switch (type) {
      case "vehicles":
        return await exportVehicles();
      case "brokers":
        return await exportBrokers();
      case "commissions":
        return await exportCommissions();
      default:
        return NextResponse.json(
          { error: "Neplatný typ exportu. Použijte: vehicles, brokers, commissions" },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("Export error:", error);
    return NextResponse.json({ error: "Chyba při exportu" }, { status: 500 });
  }
}
