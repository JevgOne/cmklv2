import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { OrderTracker } from "@/components/web/OrderTracker";
import { formatPrice } from "@/lib/utils";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

type OrderTrackerStatus = "NEW" | "CONFIRMED" | "SHIPPED" | "DELIVERED" | "CANCELLED";

function mapToTrackerStatus(apiStatus: string): OrderTrackerStatus {
  switch (apiStatus) {
    case "PENDING": return "NEW";
    case "CONFIRMED": return "CONFIRMED";
    case "SHIPPED": return "SHIPPED";
    case "DELIVERED": return "DELIVERED";
    case "CANCELLED": return "CANCELLED";
    default: return "NEW";
  }
}

const statusBadge: Record<string, { label: string; variant: "verified" | "pending" | "new" | "default" | "rejected" }> = {
  PENDING: { label: "Nová", variant: "new" },
  CONFIRMED: { label: "Potvrzená", variant: "pending" },
  SHIPPED: { label: "Odesláno", variant: "verified" },
  DELIVERED: { label: "Doručeno", variant: "verified" },
  CANCELLED: { label: "Zrušená", variant: "rejected" },
};

export const metadata: Metadata = {
  title: "Sledování objednávky",
  robots: { index: false, follow: false },
};

export default async function SledovaniPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  if (!token || token.length < 32) {
    notFound();
  }

  const order = await prisma.order.findUnique({
    where: { guestToken: token },
    include: {
      subOrders: {
        include: {
          supplier: { select: { companyName: true, firstName: true, lastName: true } },
          items: {
            include: {
              part: {
                select: {
                  name: true,
                  slug: true,
                  images: { where: { isPrimary: true }, take: 1 },
                },
              },
            },
          },
        },
        orderBy: { createdAt: "asc" },
      },
      items: {
        include: {
          part: {
            select: {
              name: true,
              slug: true,
              images: { where: { isPrimary: true }, take: 1 },
            },
          },
        },
      },
    },
  });

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-2xl mx-auto px-4 py-16 text-center">
          <div className="text-5xl mb-4">🔍</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Objednávka nenalezena</h1>
          <p className="text-gray-500 mb-6">
            Odkaz pro sledování je neplatný nebo vypršela jeho platnost.
          </p>
          <Link href="/shop" className="no-underline">
            <Button variant="outline">Zpět do shopu</Button>
          </Link>
        </div>
      </div>
    );
  }

  const badge = statusBadge[order.status] ?? statusBadge.PENDING;
  const date = order.createdAt.toLocaleDateString("cs-CZ");

  const subOrders = order.subOrders.map((so) => ({
    id: so.id,
    status: so.status,
    deliveryMethod: so.deliveryMethod,
    zasilkovnaPointName: so.zasilkovnaPointName,
    trackingNumber: so.trackingNumber,
    shippedAt: so.shippedAt,
    deliveredAt: so.deliveredAt,
    subtotal: so.subtotal,
    shippingPrice: so.shippingPrice,
    supplierName: so.supplier.companyName ?? `${so.supplier.firstName} ${so.supplier.lastName}`,
    items: so.items.map((i) => ({
      id: i.id,
      quantity: i.quantity,
      unitPrice: i.unitPrice,
      totalPrice: i.totalPrice,
      part: i.part,
    })),
  }));

  return (
    <div className="min-h-screen bg-gray-50">
      <section className="bg-white border-b border-gray-200">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-3xl font-extrabold text-gray-900">Sledování objednávky</h1>
          <p className="text-gray-500 mt-1">Objednávka #{order.orderNumber}</p>
        </div>
      </section>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Status */}
        <Card className="p-6">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
            <div className="flex items-center gap-3">
              <span className="text-sm font-mono text-gray-500">#{order.orderNumber}</span>
              <Badge variant={badge.variant}>{badge.label}</Badge>
            </div>
            <span className="text-sm text-gray-500">{date}</span>
          </div>

          <div className="mb-4">
            <OrderTracker status={mapToTrackerStatus(order.status)} />
          </div>

          {order.trackingNumber && (
            <div className="text-sm text-orange-500 font-medium">
              Tracking číslo: {order.trackingNumber}
            </div>
          )}
        </Card>

        {/* SubOrders per supplier (if multiple) */}
        {subOrders.length > 1 ? (
          <>
            {subOrders.map((so) => {
              const soBadge = statusBadge[so.status] ?? statusBadge.PENDING;
              return (
                <Card key={so.id} className="p-6">
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-base font-bold text-gray-900">
                      {so.supplierName}
                    </h2>
                    <Badge variant={soBadge.variant}>{soBadge.label}</Badge>
                  </div>
                  <div className="mb-3">
                    <OrderTracker status={mapToTrackerStatus(so.status)} />
                  </div>
                  {so.trackingNumber && (
                    <div className="text-sm text-orange-500 font-medium mb-3">
                      Tracking: {so.trackingNumber}
                    </div>
                  )}
                  <div className="space-y-2">
                    {so.items.map((item) => (
                      <div key={item.id} className="flex justify-between text-sm">
                        <span className="text-gray-600">{item.part.name} x {item.quantity}</span>
                        <span className="font-medium text-gray-900">{formatPrice(item.totalPrice)}</span>
                      </div>
                    ))}
                  </div>
                  <hr className="my-3 border-gray-200" />
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Doprava</span>
                    <span className="font-medium">{so.shippingPrice > 0 ? formatPrice(so.shippingPrice) : "Zdarma"}</span>
                  </div>
                </Card>
              );
            })}
            {/* Total */}
            <Card className="p-6">
              <div className="flex justify-between">
                <span className="font-bold text-gray-900">Celkem</span>
                <span className="text-xl font-extrabold text-gray-900">{formatPrice(order.totalPrice)}</span>
              </div>
            </Card>
          </>
        ) : (
          <Card className="p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Položky objednávky</h2>
            <div className="space-y-3">
              {order.items.map((item) => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span className="text-gray-600">
                    {item.part.name} x {item.quantity}
                  </span>
                  <span className="font-medium text-gray-900">{formatPrice(item.totalPrice)}</span>
                </div>
              ))}
            </div>
            <hr className="my-3 border-gray-200" />
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Doprava</span>
              <span className="text-sm font-medium text-gray-900">
                {order.shippingPrice > 0 ? formatPrice(order.shippingPrice) : "Zdarma"}
              </span>
            </div>
            <div className="flex justify-between mt-2">
              <span className="font-bold text-gray-900">Celkem</span>
              <span className="text-xl font-extrabold text-gray-900">{formatPrice(order.totalPrice)}</span>
            </div>
          </Card>
        )}

        {/* Info */}
        <Card className="p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Informace</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Doručení pro</span>
              <span className="text-gray-900">{order.deliveryName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Způsob doručení</span>
              <span className="text-gray-900">
                {order.deliveryMethod === "ZASILKOVNA"
                  ? `Zásilkovna${order.zasilkovnaPointName ? ` — ${order.zasilkovnaPointName}` : ""}`
                  : order.deliveryMethod === "PPL" ? "PPL"
                  : order.deliveryMethod === "CESKA_POSTA" ? "Česká pošta"
                  : order.deliveryMethod === "PICKUP" ? "Osobní odběr"
                  : order.deliveryMethod}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Platba</span>
              <span className="text-gray-900">
                {order.paymentMethod === "BANK_TRANSFER" ? "Bankovní převod" : "Dobírka"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Stav platby</span>
              <span className="text-gray-900">
                {order.paymentStatus === "PAID" ? "Zaplaceno" : "Čeká na platbu"}
              </span>
            </div>
            {order.shippedAt && (
              <div className="flex justify-between">
                <span className="text-gray-500">Odesláno</span>
                <span className="text-gray-900">{order.shippedAt.toLocaleDateString("cs-CZ")}</span>
              </div>
            )}
            {order.deliveredAt && (
              <div className="flex justify-between">
                <span className="text-gray-500">Doručeno</span>
                <span className="text-gray-900">{order.deliveredAt.toLocaleDateString("cs-CZ")}</span>
              </div>
            )}
          </div>
        </Card>

        {/* CTA: Registration */}
        <Card className="p-6 bg-orange-50 border border-orange-200">
          <h3 className="font-bold text-gray-900 mb-2">Registrujte se pro snadnější sledování</h3>
          <p className="text-sm text-gray-600 mb-4">
            S účtem uvidíte všechny své objednávky na jednom místě a můžete je snadno reklamovat.
          </p>
          <Link href="/registrace" className="no-underline">
            <Button variant="primary" size="sm">Vytvořit účet</Button>
          </Link>
        </Card>

        <div className="text-center pt-4">
          <Link href="/shop" className="text-orange-500 font-semibold hover:text-orange-600 no-underline">
            Zpět do shopu
          </Link>
        </div>
      </div>
    </div>
  );
}
