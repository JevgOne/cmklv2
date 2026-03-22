import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  getContractTemplate,
  generateContractNumber,
} from "@/lib/contract-templates";

/* ------------------------------------------------------------------ */
/*  GET /api/contracts — Seznam smluv makléře                          */
/* ------------------------------------------------------------------ */

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Přístup odepřen" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    const where: Record<string, unknown> = { brokerId: session.user.id };
    if (status && status !== "all") {
      where.status = status;
    }

    const contracts = await prisma.contract.findMany({
      where,
      include: {
        vehicle: {
          select: {
            id: true,
            brand: true,
            model: true,
            variant: true,
            year: true,
            vin: true,
            price: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ contracts });
  } catch (error) {
    console.error("GET /api/contracts error:", error);
    return NextResponse.json(
      { error: "Interní chyba serveru" },
      { status: 500 }
    );
  }
}

/* ------------------------------------------------------------------ */
/*  POST /api/contracts — Vytvoření nové smlouvy                       */
/* ------------------------------------------------------------------ */

const createContractSchema = z.object({
  type: z.enum(["BROKERAGE", "HANDOVER"]),
  vehicleId: z.string().optional(),
  sellerName: z.string().min(1, "Jméno prodejce je povinné"),
  sellerPhone: z.string().min(1, "Telefon prodejce je povinný"),
  sellerEmail: z.string().email().optional().or(z.literal("")),
  sellerAddress: z.string().optional(),
  sellerIdNumber: z.string().optional(),
  sellerIdCard: z.string().optional(),
  sellerBankAccount: z.string().optional(),
  price: z.number().int().min(0, "Cena musí být kladná"),
  commission: z.number().int().min(0).optional(),
  // Vehicle data for template generation
  vehicleBrand: z.string().optional(),
  vehicleModel: z.string().optional(),
  vehicleVariant: z.string().optional(),
  vehicleVin: z.string().optional(),
  vehicleYear: z.number().optional(),
  vehicleMileage: z.number().optional(),
  vehicleCondition: z.string().optional(),
  vehicleColor: z.string().optional(),
  vehicleFuelType: z.string().optional(),
  vehicleTransmission: z.string().optional(),
  vehicleEnginePower: z.number().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Přístup odepřen" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const data = createContractSchema.parse(body);

    const contractNumber = generateContractNumber();

    // Generate contract content from template
    const content = getContractTemplate(data.type, {
      contractNumber,
      date: new Date().toISOString(),
      type: data.type,
      seller: {
        name: data.sellerName,
        phone: data.sellerPhone,
        email: data.sellerEmail || undefined,
        address: data.sellerAddress,
        idNumber: data.sellerIdNumber,
        idCard: data.sellerIdCard,
        bankAccount: data.sellerBankAccount,
      },
      broker: {
        name: `${session.user.firstName} ${session.user.lastName}`,
        email: session.user.email || undefined,
      },
      vehicle: {
        vin: data.vehicleVin || "",
        brand: data.vehicleBrand || "",
        model: data.vehicleModel || "",
        variant: data.vehicleVariant,
        year: data.vehicleYear || 0,
        mileage: data.vehicleMileage || 0,
        condition: data.vehicleCondition || "",
        color: data.vehicleColor,
        fuelType: data.vehicleFuelType || "",
        transmission: data.vehicleTransmission || "",
        enginePower: data.vehicleEnginePower,
      },
      price: data.price,
      commission: data.commission || 0,
    });

    const contract = await prisma.contract.create({
      data: {
        type: data.type,
        vehicleId: data.vehicleId || null,
        brokerId: session.user.id,
        sellerName: data.sellerName,
        sellerPhone: data.sellerPhone,
        sellerEmail: data.sellerEmail || null,
        sellerAddress: data.sellerAddress || null,
        sellerIdNumber: data.sellerIdNumber || null,
        sellerIdCard: data.sellerIdCard || null,
        sellerBankAccount: data.sellerBankAccount || null,
        content: JSON.stringify(content),
        price: data.price,
        commission: data.commission || null,
        status: "DRAFT",
      },
      include: {
        vehicle: {
          select: {
            id: true,
            brand: true,
            model: true,
            year: true,
            vin: true,
          },
        },
      },
    });

    return NextResponse.json({ contract }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Neplatná data", details: error.issues },
        { status: 400 }
      );
    }

    console.error("POST /api/contracts error:", error);
    return NextResponse.json(
      { error: "Interní chyba serveru" },
      { status: 500 }
    );
  }
}
