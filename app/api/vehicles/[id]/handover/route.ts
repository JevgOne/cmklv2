import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { handoverVehicleSchema } from "@/lib/validators/sales";
import { calculateCommission } from "@/lib/commission-calculator";
import { addBrokerRevenue, type StarLevelKey } from "@/lib/broker-points";
import { createNotification } from "@/lib/notifications";
import { recalculateBrokerScore } from "@/lib/reputation/recalculate";
import { sendEmail, RESEND_FROM } from "@/lib/resend";

/* ------------------------------------------------------------------ */
/*  POST /api/vehicles/[id]/handover — Předání vozidla kupujícímu      */
/* ------------------------------------------------------------------ */

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Přístup odepřen. Přihlaste se." },
        { status: 401 }
      );
    }

    const { id } = await params;

    // Načtení vozidla s makléřem
    const vehicle = await prisma.vehicle.findFirst({
      where: { OR: [{ id }, { slug: id }] },
      include: {
        broker: {
          select: { id: true, firstName: true, lastName: true, managerId: true, level: true },
        },
      },
    });

    if (!vehicle) {
      return NextResponse.json(
        { error: "Vozidlo nenalezeno" },
        { status: 404 }
      );
    }

    // Autorizace: vlastník nebo admin
    const isAdmin =
      session.user.role === "ADMIN" || session.user.role === "BACKOFFICE";
    const isOwner = vehicle.brokerId === session.user.id;

    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        { error: "Nemáte oprávnění provést předání tohoto vozidla" },
        { status: 403 }
      );
    }

    // Kontrola stavu — pouze RESERVED nebo ACTIVE vozidla lze předat
    if (vehicle.status !== "RESERVED" && vehicle.status !== "ACTIVE") {
      return NextResponse.json(
        {
          error: `Vozidlo ve stavu "${vehicle.status}" nelze předat. Povolené stavy: ACTIVE, RESERVED`,
        },
        { status: 400 }
      );
    }

    const body = await request.json();
    const data = handoverVehicleSchema.parse(body);

    // Kontrola checklistu — vše musí být splněno
    const checklistItems = Object.entries(data.checklist);
    const unchecked = checklistItems.filter(([, value]) => !value);
    if (unchecked.length > 0) {
      return NextResponse.json(
        {
          error: `Nesplněné položky checklistu: ${unchecked.map(([key]) => key).join(", ")}`,
        },
        { status: 400 }
      );
    }

    // Výpočet provize dle úrovně makléře
    const brokerLevel = (vehicle.broker?.level ?? "STAR_1") as StarLevelKey;
    const commissionBreakdown = calculateCommission(data.soldPrice, brokerLevel);

    const result = await prisma.$transaction(async (tx) => {
      // Change log
      await tx.vehicleChangeLog.create({
        data: {
          vehicleId: vehicle.id,
          userId: session.user.id,
          field: "status",
          oldValue: vehicle.status,
          newValue: "SOLD",
          reason: data.note ?? "Předání vozidla kupujícímu",
          flagged: false,
          flagReason: null,
        },
      });

      // Aktualizace vozidla
      const updatedVehicle = await tx.vehicle.update({
        where: { id: vehicle.id },
        data: {
          status: "SOLD",
          soldPrice: data.soldPrice,
          soldAt: new Date(),
          handoverCompleted: true,
          commission: commissionBreakdown.total,
        },
        include: {
          images: { orderBy: { order: "asc" } },
          broker: {
            select: { id: true, firstName: true, lastName: true },
          },
        },
      });

      // Vytvoření záznamu o provizi
      let commission = null;
      if (vehicle.brokerId) {
        commission = await tx.commission.create({
          data: {
            brokerId: vehicle.brokerId,
            vehicleId: vehicle.id,
            salePrice: data.soldPrice,
            commission: commissionBreakdown.total,
            brokerShare: commissionBreakdown.brokerShare,
            companyShare: commissionBreakdown.companyShare,
            managerBonus: commissionBreakdown.managerBonus,
            rate: 0.05,
            status: "PENDING",
            soldAt: new Date(),
          },
        });
      }

      return { vehicle: updatedVehicle, commission, commissionBreakdown };
    });

    // --- Obrat za prodej auta ---
    if (vehicle.brokerId && result.commission) {
      const revenueResult = await addBrokerRevenue({
        brokerId: vehicle.brokerId,
        type: "CAR_SALE",
        amount: data.soldPrice,
        vehicleId: vehicle.id,
        commissionId: result.commission.id,
        description: `Prodej ${vehicle.brand} ${vehicle.model} za ${data.soldPrice} Kč`,
      });

      if (revenueResult.levelChanged) {
        const starLevel = revenueResult.newLevel;
        const stars = "⭐".repeat(parseInt(starLevel.replace("STAR_", "")));
        await createNotification({
          userId: vehicle.brokerId,
          type: "SYSTEM",
          title: `Povýšení! Jste nyní ${stars} Makléř`,
          body: `Celkový obrat ${new Intl.NumberFormat("cs-CZ").format(revenueResult.newTotalRevenue)} Kč`,
          link: "/makler/stats",
        });
      }
    }

    // --- Notifikace po prodeji ---

    // 1. Notifikace makléři o provizi
    if (vehicle.brokerId) {
      await createNotification({
        userId: vehicle.brokerId,
        type: "COMMISSION",
        title: `Provize: ${result.commissionBreakdown.brokerShare} Kč`,
        body: `Prodáno: ${vehicle.brand} ${vehicle.model}`,
        link: `/makler/commissions`,
      });
    }

    // 2. Notifikace manažerovi
    if (vehicle.broker?.managerId) {
      const brokerName = `${vehicle.broker.firstName} ${vehicle.broker.lastName}`;
      await createNotification({
        userId: vehicle.broker.managerId,
        type: "VEHICLE",
        title: `Makléř ${brokerName} prodal ${vehicle.brand} ${vehicle.model}`,
        body: `Cena: ${data.soldPrice} Kč, provize: ${result.commissionBreakdown.total} Kč`,
        link: `/makler/vehicles/${vehicle.id}`,
      });
    }

    // 3. Notifikace BackOffice (všichni ADMIN/BACKOFFICE uživatelé)
    const backofficeUsers = await prisma.user.findMany({
      where: { role: { in: ["ADMIN", "BACKOFFICE"] } },
      select: { id: true },
    });

    await Promise.all(
      backofficeUsers.map((user) =>
        createNotification({
          userId: user.id,
          type: "VEHICLE",
          title: `Prodej: ${vehicle.brand} ${vehicle.model}`,
          body: `Cena: ${data.soldPrice} Kč`,
          link: `/admin/vehicles/${vehicle.id}`,
        })
      )
    );

    // --- Recalculate broker Trust Score ---
    if (vehicle.brokerId) {
      recalculateBrokerScore(vehicle.brokerId).catch((err) =>
        console.error("Trust score recalculation failed:", err),
      );
    }

    // --- Follow-up emaily po předání ---
    const vehicleLabel = `${vehicle.brand} ${vehicle.model}`;
    const priceFormatted = new Intl.NumberFormat("cs-CZ").format(data.soldPrice);
    const brokerName = result.vehicle.broker
      ? `${result.vehicle.broker.firstName} ${result.vehicle.broker.lastName}`
      : "Váš makléř";

    // Najít kupujícího z inquiry (RESERVED/SOLD)
    const buyerInquiry = await prisma.vehicleInquiry.findFirst({
      where: {
        vehicleId: vehicle.id,
        status: { in: ["RESERVED", "SOLD"] },
        buyerEmail: { not: null },
      },
      orderBy: { updatedAt: "desc" },
      select: { buyerName: true, buyerEmail: true },
    });

    // Email kupujícímu
    if (buyerInquiry?.buyerEmail) {
      sendEmail({
        from: RESEND_FROM,
        to: buyerInquiry.buyerEmail,
        subject: `Potvrzení předání vozidla ${vehicleLabel} | Carmakler`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #F97316;">Carmakler</h2>
            <p>Dobrý den${buyerInquiry.buyerName ? `, ${buyerInquiry.buyerName}` : ""},</p>
            <p>potvrzujeme, že vozidlo <strong>${vehicleLabel}</strong> vám bylo úspěšně předáno.</p>
            <table style="margin: 16px 0; border-collapse: collapse;">
              <tr><td style="padding: 4px 12px 4px 0; color: #666;">Vozidlo:</td><td style="padding: 4px 0;"><strong>${vehicleLabel}</strong></td></tr>
              <tr><td style="padding: 4px 12px 4px 0; color: #666;">Prodejní cena:</td><td style="padding: 4px 0;"><strong>${priceFormatted} Kč</strong></td></tr>
              <tr><td style="padding: 4px 12px 4px 0; color: #666;">Makléř:</td><td style="padding: 4px 0;">${brokerName}</td></tr>
            </table>
            <p>Děkujeme za důvěru a přejeme mnoho spokojených kilometrů!</p>
            <p>Pokud budete mít jakékoli dotazy, neváhejte se na nás obrátit.</p>
            <br/>
            <p>S pozdravem,<br/>Tým Carmakler</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
            <p style="color: #999; font-size: 12px;">Tato zpráva byla odeslána automaticky ze systému Carmakler.</p>
          </div>
        `,
        text: `Potvrzení předání vozidla ${vehicleLabel}. Prodejní cena: ${priceFormatted} Kč. Makléř: ${brokerName}. Děkujeme za důvěru!`,
      }).catch((err) => console.error("Buyer handover email failed:", err));
    }

    // Email prodávajícímu
    if (vehicle.sellerEmail) {
      sendEmail({
        from: RESEND_FROM,
        to: vehicle.sellerEmail,
        subject: `Vaše vozidlo ${vehicleLabel} bylo úspěšně prodáno | Carmakler`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #F97316;">Carmakler</h2>
            <p>Dobrý den${vehicle.sellerName ? `, ${vehicle.sellerName}` : ""},</p>
            <p>rádi vás informujeme, že vaše vozidlo <strong>${vehicleLabel}</strong> bylo úspěšně předáno novému majiteli.</p>
            <table style="margin: 16px 0; border-collapse: collapse;">
              <tr><td style="padding: 4px 12px 4px 0; color: #666;">Vozidlo:</td><td style="padding: 4px 0;"><strong>${vehicleLabel}</strong></td></tr>
              <tr><td style="padding: 4px 12px 4px 0; color: #666;">Prodejní cena:</td><td style="padding: 4px 0;"><strong>${priceFormatted} Kč</strong></td></tr>
              <tr><td style="padding: 4px 12px 4px 0; color: #666;">Makléř:</td><td style="padding: 4px 0;">${brokerName}</td></tr>
            </table>
            <p>Děkujeme, že jste využili služeb Carmakler. Budeme rádi, pokud nás doporučíte svým známým.</p>
            <br/>
            <p>S pozdravem,<br/>Tým Carmakler</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
            <p style="color: #999; font-size: 12px;">Tato zpráva byla odeslána automaticky ze systému Carmakler.</p>
          </div>
        `,
        text: `Vaše vozidlo ${vehicleLabel} bylo úspěšně prodáno za ${priceFormatted} Kč. Makléř: ${brokerName}. Děkujeme za důvěru!`,
      }).catch((err) => console.error("Seller handover email failed:", err));
    }

    // Follow-up reminder pro makléře
    if (vehicle.brokerId) {
      await createNotification({
        userId: vehicle.brokerId,
        type: "SYSTEM",
        title: "Zavolej kupujícímu za 7 dní",
        body: `Follow-up po prodeji ${vehicleLabel}`,
        link: `/makler/vehicles/${vehicle.id}`,
      });
    }

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Neplatná data", details: error.issues },
        { status: 400 }
      );
    }

    console.error("POST /api/vehicles/[id]/handover error:", error);
    return NextResponse.json(
      { error: "Interní chyba serveru" },
      { status: 500 }
    );
  }
}
