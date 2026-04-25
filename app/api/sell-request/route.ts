import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { assignRegionByCity, roundRobinAssignBroker } from "@/lib/lead-management";
import { createNotification } from "@/lib/notifications";

const sellRequestSchema = z.object({
  brand: z.string().min(1, "Značka je povinná"),
  model: z.string().min(1, "Model je povinný"),
  year: z.union([z.string(), z.number()]).transform(String),
  mileage: z.union([z.string(), z.number()]).transform(String),
  fuelType: z.string().min(1, "Typ paliva je povinný"),
  name: z.string().min(1, "Jméno je povinné"),
  phone: z.string().min(1, "Telefon je povinný"),
  email: z.string().email("Neplatný email"),
  city: z.string().optional(),
  note: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const data = sellRequestSchema.parse(body);

    // Auto-assign region by city
    const regionId = data.city
      ? await assignRegionByCity(data.city)
      : null;

    // Auto-assign broker by region (round-robin)
    let assignedBrokerId: string | null = null;
    if (regionId) {
      assignedBrokerId = await roundRobinAssignBroker(regionId);
    }

    // Fallback: least busy broker across all regions
    if (!assignedBrokerId) {
      const leastBusyBroker = await prisma.user.findFirst({
        where: { role: "BROKER", status: "ACTIVE" },
        select: { id: true },
        orderBy: { assignedLeads: { _count: "asc" } },
      });
      assignedBrokerId = leastBusyBroker?.id || null;
    }

    // Create Lead record
    const lead = await prisma.lead.create({
      data: {
        name: data.name,
        phone: data.phone,
        email: data.email,
        brand: data.brand,
        model: data.model,
        year: parseInt(data.year, 10) || null,
        mileage: parseInt(data.mileage, 10) || null,
        description: data.note || null,
        city: data.city || null,
        regionId,
        source: "WEB_FORM",
        status: assignedBrokerId ? "ASSIGNED" : "NEW",
        assignedToId: assignedBrokerId,
        assignedAt: assignedBrokerId ? new Date() : null,
      },
    });

    // Notify assigned broker in PWA
    if (assignedBrokerId) {
      const vehicleInfo = `${data.brand} ${data.model} (${data.year})`;
      await createNotification({
        userId: assignedBrokerId,
        type: "SYSTEM",
        title: "Nový požadavek na prodej",
        body: `${data.name} (${data.phone}) — ${vehicleInfo}, ${data.mileage} km`,
        link: `/makler/leads/${lead.id}`,
      });
    }

    return NextResponse.json({ success: true, leadId: lead.id });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Neplatná data", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Sell request error:", error);
    return NextResponse.json(
      { error: "Interní chyba serveru" },
      { status: 500 }
    );
  }
}
