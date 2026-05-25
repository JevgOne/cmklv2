import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";


export const dynamic = "force-dynamic";
function formatDate(date: Date): string {
  return date.toLocaleDateString("cs-CZ", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatPrice(price: number): string {
  return new Intl.NumberFormat("cs-CZ", {
    style: "currency",
    currency: "CZK",
    maximumFractionDigits: 0,
  }).format(price);
}

export default async function DotazyPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");

  const inquiries = await prisma.inquiry.findMany({
    where: { senderId: session.user.id },
    include: {
      listing: {
        select: {
          id: true, slug: true, brand: true, model: true,
          variant: true, year: true, price: true,
          images: { select: { url: true, isPrimary: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  if (inquiries.length === 0) {
    return (
      <div className="text-center py-20">
        <div className="text-4xl mb-3">&#128172;</div>
        <h3 className="text-xl font-bold text-gray-900">Zatím jste neodeslali žádné dotazy</h3>
        <p className="text-gray-500 mt-2">Při procházení nabídky můžete poslat dotaz prodejci.</p>
        <Link href="/nabidka" className="inline-block mt-4 text-orange-500 font-semibold no-underline">
          Prohlédnout nabídku &rarr;
        </Link>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-lg font-bold text-gray-900 mb-4">
        Moje dotazy ({inquiries.length})
      </h2>

      <div className="space-y-4">
        {inquiries.map((inquiry) => {
          const listing = inquiry.listing;
          const primaryImage = listing.images?.find((img) => img.isPrimary) || listing.images?.[0];

          return (
            <Card key={inquiry.id} className="p-0">
              <div className="flex flex-col sm:flex-row">
                {/* Listing thumbnail */}
                <div className="sm:w-40 shrink-0">
                  <Link href={`/nabidka/${listing.slug}`} className="block no-underline">
                    <div className="aspect-[4/3] sm:h-full bg-gray-100">
                      {primaryImage ? (
                        <img
                          src={primaryImage.url}
                          alt={`${listing.brand} ${listing.model}`}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-300 text-2xl">
                          &#128247;
                        </div>
                      )}
                    </div>
                  </Link>
                </div>

                {/* Content */}
                <div className="flex-1 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <Link
                        href={`/nabidka/${listing.slug}`}
                        className="font-bold text-gray-900 text-sm no-underline hover:text-orange-500 transition-colors"
                      >
                        {listing.brand} {listing.model} {listing.variant || ""}
                      </Link>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {listing.year} &middot; {formatPrice(listing.price)}
                      </p>
                    </div>
                    <Badge variant={inquiry.reply ? "verified" : "pending"}>
                      {inquiry.reply ? "Odpovězeno" : "Čeká na odpověď"}
                    </Badge>
                  </div>

                  {/* My message */}
                  <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                    <span className="text-[11px] text-gray-500 font-medium uppercase tracking-wide">
                      Váš dotaz ({formatDate(inquiry.createdAt)})
                    </span>
                    <p className="text-sm text-gray-700 mt-1">{inquiry.message}</p>
                  </div>

                  {/* Reply */}
                  {inquiry.reply && (
                    <div className="mt-2 p-3 bg-orange-50 rounded-lg border-l-3 border-orange-400">
                      <span className="text-[11px] text-orange-500 font-medium uppercase tracking-wide">
                        Odpověď prodejce ({inquiry.repliedAt ? formatDate(inquiry.repliedAt) : ""})
                      </span>
                      <p className="text-sm text-gray-700 mt-1">{inquiry.reply}</p>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
