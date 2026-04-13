import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/resend";
import {
  stockAlertSupplierHtml,
  stockAlertSupplierText,
} from "./email-templates/stock-alert-supplier";

const LOW_STOCK_THRESHOLD = 3;

export interface StockAlertResult {
  suppliersNotified: number;
  totalLowStockParts: number;
  errors: string[];
}

export async function checkAndSendStockAlerts(): Promise<StockAlertResult> {
  // 1. Najdi aktivní díly s nízkým stockem
  const lowStockParts = await prisma.part.findMany({
    where: {
      status: "ACTIVE",
      stock: { lte: LOW_STOCK_THRESHOLD },
    },
    select: {
      id: true,
      name: true,
      stock: true,
      partNumber: true,
      supplier: {
        select: { id: true, firstName: true, lastName: true, email: true },
      },
    },
    orderBy: { stock: "asc" },
  });

  if (lowStockParts.length === 0) {
    return { suppliersNotified: 0, totalLowStockParts: 0, errors: [] };
  }

  // 2. Seskupit podle dodavatele
  const bySupplier = new Map<string, typeof lowStockParts>();
  for (const part of lowStockParts) {
    const key = part.supplier.id;
    if (!bySupplier.has(key)) bySupplier.set(key, []);
    bySupplier.get(key)!.push(part);
  }

  // 3. Poslat email každému dodavateli
  const errors: string[] = [];
  let suppliersNotified = 0;

  for (const [, parts] of bySupplier) {
    const supplier = parts[0].supplier;
    const supplierName = supplier.firstName || "dodavateli";

    const result = await sendEmail({
      to: supplier.email,
      subject: `Nízký sklad — ${parts.length} ${parts.length === 1 ? "díl potřebuje" : "dílů potřebuje"} doplnit`,
      html: stockAlertSupplierHtml({
        supplierName,
        parts: parts.map((p) => ({
          name: p.name,
          stock: p.stock,
          partNumber: p.partNumber,
        })),
      }),
      text: stockAlertSupplierText({
        supplierName,
        parts: parts.map((p) => ({
          name: p.name,
          stock: p.stock,
          partNumber: p.partNumber,
        })),
      }),
    });

    if (result.success) {
      suppliersNotified++;
    } else {
      errors.push(`${supplier.email}: ${result.error}`);
    }
  }

  return {
    suppliersNotified,
    totalLowStockParts: lowStockParts.length,
    errors,
  };
}
