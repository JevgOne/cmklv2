import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ClaimForm } from "@/components/web/ClaimForm";
import Link from "next/link";
import { Card } from "@/components/ui/Card";

export default async function ReklamacePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");

  const { id } = await params;

  const order = await prisma.order.findFirst({
    where: { id, buyerId: session.user.id },
    select: {
      id: true,
      orderNumber: true,
      status: true,
      deliveryName: true,
      deliveryEmail: true,
      items: {
        select: {
          id: true,
          quantity: true,
          unitPrice: true,
          totalPrice: true,
          part: { select: { name: true } },
        },
      },
    },
  });

  if (!order) notFound();

  if (order.status !== "DELIVERED") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <Card className="p-8 max-w-md w-full text-center">
          <p className="text-gray-500">Reklamaci lze podat pouze u doručené objednávky.</p>
          <Link href="/shop/moje-objednavky" className="text-orange-500 font-semibold mt-4 inline-block">Zpět</Link>
        </Card>
      </div>
    );
  }

  return <ClaimForm order={order} />;
}
