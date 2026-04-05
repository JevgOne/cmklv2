import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { ContractContent } from "@/lib/contract-templates";

/* ------------------------------------------------------------------ */
/*  POST /api/contracts/[id]/pdf — Generování PDF                      */
/* ------------------------------------------------------------------ */

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Přístup odepřen" },
        { status: 401 }
      );
    }

    const { id } = await params;

    const contract = await prisma.contract.findUnique({
      where: { id },
      include: {
        vehicle: {
          select: {
            brand: true,
            model: true,
            year: true,
            vin: true,
          },
        },
        broker: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!contract) {
      return NextResponse.json(
        { error: "Smlouva nenalezena" },
        { status: 404 }
      );
    }

    if (contract.brokerId !== session.user.id) {
      return NextResponse.json(
        { error: "Přístup odepřen" },
        { status: 403 }
      );
    }

    if (contract.status === "DRAFT") {
      return NextResponse.json(
        { error: "Smlouva musí být nejprve podepsána" },
        { status: 400 }
      );
    }

    // Parse contract content
    let content: ContractContent;
    try {
      content = JSON.parse(contract.content || "{}") as ContractContent;
    } catch {
      return NextResponse.json(
        { error: "Neplatný obsah smlouvy" },
        { status: 400 }
      );
    }

    // Generate PDF using jsPDF
    const { jsPDF } = await import("jspdf");
    const doc = new jsPDF({ format: "a4", unit: "mm" });

    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    const contentWidth = pageWidth - 2 * margin;
    let y = margin;

    // Helper to add text with word-wrap and page breaks
    const addText = (
      text: string,
      fontSize: number,
      bold: boolean = false,
      lineHeight: number = 6
    ) => {
      doc.setFontSize(fontSize);
      doc.setFont("helvetica", bold ? "bold" : "normal");
      const lines = doc.splitTextToSize(text, contentWidth);
      for (const line of lines) {
        if (y > 270) {
          doc.addPage();
          y = margin;
        }
        doc.text(line, margin, y);
        y += lineHeight;
      }
    };

    // Header
    addText("CARMAKLER", 10, true);
    y += 2;
    addText(content.title || "Smlouva", 18, true, 8);
    y += 2;
    addText(`Číslo smlouvy: ${content.contractNumber}`, 10, false);
    addText(`Datum: ${content.date}`, 10, false);
    y += 6;

    // Divider
    doc.setDrawColor(200);
    doc.line(margin, y, pageWidth - margin, y);
    y += 8;

    // Sections
    for (const section of content.sections || []) {
      if (y > 250) {
        doc.addPage();
        y = margin;
      }
      addText(section.heading, 13, true);
      y += 2;
      addText(section.content, 10, false);
      y += 8;
    }

    // Signatures
    if (contract.sellerSignature || contract.brokerSignature) {
      if (y > 220) {
        doc.addPage();
        y = margin;
      }

      y += 10;
      doc.setDrawColor(200);
      doc.line(margin, y, pageWidth - margin, y);
      y += 8;

      addText("Podpisy:", 13, true);
      y += 4;

      const sigWidth = 60;
      const sigHeight = 30;

      // Seller signature
      if (contract.sellerSignature) {
        addText("Prodejce:", 10, true);
        y += 2;
        try {
          doc.addImage(
            contract.sellerSignature,
            "PNG",
            margin,
            y,
            sigWidth,
            sigHeight
          );
        } catch {
          // If image fails, just note it
          addText("[Podpis prodejce]", 10, false);
        }
        y += sigHeight + 4;
        addText(contract.sellerName, 10, false);
        y += 6;
      }

      // Broker signature
      if (contract.brokerSignature) {
        addText("Makléř:", 10, true);
        y += 2;
        try {
          doc.addImage(
            contract.brokerSignature,
            "PNG",
            margin,
            y,
            sigWidth,
            sigHeight
          );
        } catch {
          addText("[Podpis makléře]", 10, false);
        }
        y += sigHeight + 4;
        addText(
          `${contract.broker.firstName} ${contract.broker.lastName}`,
          10,
          false
        );
        y += 6;
      }

      // Signed metadata
      if (contract.signedAt) {
        y += 4;
        const signedDate = new Date(contract.signedAt).toLocaleString("cs-CZ");
        addText(`Podepsáno: ${signedDate}`, 9, false);
        if (contract.signedLocation) {
          addText(`Místo (GPS): ${contract.signedLocation}`, 9, false);
        }
      }
    }

    // Generate PDF buffer
    const pdfBuffer = Buffer.from(doc.output("arraybuffer"));

    // Upload PDF na Cloudinary
    let pdfUrl: string;
    try {
      const { uploadToCloudinary } = await import("@/lib/cloudinary");
      const pdfFile = new File([pdfBuffer], `smlouva-${id}.pdf`, { type: "application/pdf" });
      pdfUrl = await uploadToCloudinary(pdfFile, `carmakler/contracts/${id}`);
    } catch (uploadError) {
      console.error("PDF upload failed, using base64 fallback:", uploadError);
      pdfUrl = `data:application/pdf;base64,${pdfBuffer.toString("base64")}`;
    }

    // Update contract with PDF URL
    await prisma.contract.update({
      where: { id },
      data: { pdfUrl },
    });

    return NextResponse.json({
      pdfUrl,
      message: "PDF vygenerováno",
    });
  } catch (error) {
    console.error("POST /api/contracts/[id]/pdf error:", error);
    return NextResponse.json(
      { error: "Chyba při generování PDF" },
      { status: 500 }
    );
  }
}
