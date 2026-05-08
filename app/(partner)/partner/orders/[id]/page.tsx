import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import { OrderDetailContent } from "@/components/partner/OrderDetailContent";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const order = await prisma.order.findUnique({
    where: { id },
    select: { orderNumber: true },
  });
  if (!order) return { title: "Objednávka nenalezena | Carmakler Partner" };
  return {
    title: `Objednávka #${order.orderNumber} | Carmakler Partner`,
  };
}

export default async function PartnerOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect("/login");
  }

  const { id } = await params;

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      items: {
        include: {
          part: { select: { name: true, slug: true } },
        },
      },
      buyer: { select: { firstName: true, lastName: true, email: true } },
    },
  });

  if (!order) notFound();

  // Verify the partner owns at least one item in this order
  const hasItems = order.items.some((item) => item.supplierId === session.user.id);
  if (!hasItems) notFound();

  const serialized = {
    id: order.id,
    orderNumber: order.orderNumber,
    status: order.status,
    totalPrice: order.totalPrice,
    shippingPrice: order.shippingPrice,
    deliveryMethod: order.deliveryMethod,
    deliveryName: order.deliveryName,
    deliveryEmail: order.deliveryEmail,
    deliveryPhone: order.deliveryPhone,
    deliveryStreet: order.deliveryAddress,
    deliveryCity: order.deliveryCity,
    deliveryZip: order.deliveryZip,
    trackingNumber: order.trackingNumber,
    paymentMethod: order.paymentMethod,
    paymentStatus: order.paymentStatus,
    createdAt: order.createdAt.toISOString(),
    items: order.items
      .filter((item) => item.supplierId === session.user.id)
      .map((item) => ({
        id: item.id,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.totalPrice,
        part: { name: item.part.name, slug: item.part.slug },
      })),
    buyer: order.buyer
      ? { firstName: order.buyer.firstName, lastName: order.buyer.lastName, email: order.buyer.email }
      : null,
  };

  return <OrderDetailContent initialOrder={serialized} />;
}
