import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/*  POST /api/parts/import — Hromadný CSV import dílů                   */
/* ------------------------------------------------------------------ */

const VALID_CATEGORIES = [
  "ENGINE", "TRANSMISSION", "BRAKES", "SUSPENSION", "BODY",
  "ELECTRICAL", "INTERIOR", "WHEELS", "EXHAUST", "COOLING", "FUEL", "OTHER",
];

const VALID_CONDITIONS = ["NEW", "USED_GOOD", "USED_FAIR", "USED_POOR", "REFURBISHED"];

interface CsvRow {
  name: string;
  category: string;
  condition: string;
  price: string;
  stock?: string;
  description?: string;
  oemNumber?: string;
  partNumber?: string;
  manufacturer?: string;
  warranty?: string;
  compatibleBrands?: string;
  compatibleModels?: string;
  compatibleYearFrom?: string;
  compatibleYearTo?: string;
}

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (const char of line) {
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Nepřihlášený" }, { status: 401 });
    }

    const allowedRoles = ["PARTS_SUPPLIER", "WHOLESALE_SUPPLIER", "PARTNER_VRAKOVISTE", "ADMIN", "BACKOFFICE"];
    if (!allowedRoles.includes(session.user.role)) {
      return NextResponse.json({ error: "Nemáte oprávnění" }, { status: 403 });
    }

    const body = await request.text();
    const lines = body.split("\n").filter((l) => l.trim());

    if (lines.length < 2) {
      return NextResponse.json(
        { error: "CSV musí obsahovat hlavičku a alespoň jeden řádek dat" },
        { status: 400 }
      );
    }

    const headers = parseCsvLine(lines[0]).map((h) => h.toLowerCase().trim());
    const nameIdx = headers.indexOf("name");
    const categoryIdx = headers.indexOf("category");
    const conditionIdx = headers.indexOf("condition");
    const priceIdx = headers.indexOf("price");

    if (nameIdx === -1 || categoryIdx === -1 || conditionIdx === -1 || priceIdx === -1) {
      return NextResponse.json(
        { error: "CSV musí obsahovat sloupce: name, category, condition, price" },
        { status: 400 }
      );
    }

    const errors: { line: number; error: string }[] = [];
    const created: string[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = parseCsvLine(lines[i]);

      const row: CsvRow = {
        name: values[nameIdx] ?? "",
        category: values[categoryIdx] ?? "",
        condition: values[conditionIdx] ?? "",
        price: values[priceIdx] ?? "",
        stock: values[headers.indexOf("stock")] ?? undefined,
        description: values[headers.indexOf("description")] ?? undefined,
        oemNumber: values[headers.indexOf("oemnumber")] ?? undefined,
        partNumber: values[headers.indexOf("partnumber")] ?? undefined,
        manufacturer: values[headers.indexOf("manufacturer")] ?? undefined,
        warranty: values[headers.indexOf("warranty")] ?? undefined,
        compatibleBrands: values[headers.indexOf("compatiblebrands")] ?? undefined,
        compatibleModels: values[headers.indexOf("compatiblemodels")] ?? undefined,
        compatibleYearFrom: values[headers.indexOf("compatibleyearfrom")] ?? undefined,
        compatibleYearTo: values[headers.indexOf("compatibleyearto")] ?? undefined,
      };

      if (!row.name) {
        errors.push({ line: i + 1, error: "Chybí název" });
        continue;
      }

      const category = row.category.toUpperCase();
      if (!VALID_CATEGORIES.includes(category)) {
        errors.push({ line: i + 1, error: `Neplatná kategorie: ${row.category}` });
        continue;
      }

      const condition = row.condition.toUpperCase();
      if (!VALID_CONDITIONS.includes(condition)) {
        errors.push({ line: i + 1, error: `Neplatný stav: ${row.condition}` });
        continue;
      }

      const price = parseInt(row.price, 10);
      if (isNaN(price) || price < 1) {
        errors.push({ line: i + 1, error: `Neplatná cena: ${row.price}` });
        continue;
      }

      const baseSlug = slugify(row.name);
      const slug = `${baseSlug}-${Date.now().toString(36)}-${i}`;

      try {
        await prisma.part.create({
          data: {
            slug,
            supplierId: session.user.id,
            name: row.name,
            category,
            condition,
            price,
            stock: row.stock ? parseInt(row.stock, 10) || 1 : 1,
            description: row.description || null,
            oemNumber: row.oemNumber || null,
            partNumber: row.partNumber || null,
            manufacturer: row.manufacturer || null,
            warranty: row.warranty || null,
            compatibleBrands: row.compatibleBrands ? JSON.stringify(row.compatibleBrands.split(";")) : null,
            compatibleModels: row.compatibleModels ? JSON.stringify(row.compatibleModels.split(";")) : null,
            compatibleYearFrom: row.compatibleYearFrom ? parseInt(row.compatibleYearFrom, 10) || null : null,
            compatibleYearTo: row.compatibleYearTo ? parseInt(row.compatibleYearTo, 10) || null : null,
            status: "ACTIVE",
          },
        });
        created.push(row.name);
      } catch (err) {
        errors.push({ line: i + 1, error: `Chyba při ukládání: ${String(err)}` });
      }
    }

    return NextResponse.json({
      imported: created.length,
      errors: errors.length,
      details: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error("POST /api/parts/import error:", error);
    return NextResponse.json({ error: "Interní chyba serveru" }, { status: 500 });
  }
}
