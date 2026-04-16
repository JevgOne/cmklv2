import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { TagPill } from "@/components/web/TagPill";
import { cn, getInitials } from "@/lib/utils";

export interface BrokerCardBroker {
  slug: string;
  firstName: string;
  lastName: string;
  avatar: string | null;
  level: string;
  city: string | null;
  cities: string[];
  bio: string | null;
  totalSales: number;
  activeVehicles: number;
  phone: string | null;
  showPhone: boolean;
  tags: { slug: string; label: string }[];
}

export interface BrokerCardProps {
  broker: BrokerCardBroker;
  featured?: boolean;
}

const LEVEL_LABEL: Record<string, string> = {
  TOP: "TOP Makléř",
  SENIOR: "Senior",
  BROKER: "Makléř",
  JUNIOR: "Ověřený",
};

export function BrokerCard({ broker, featured = false }: BrokerCardProps) {
  const initials = getInitials(broker.firstName, broker.lastName);
  const primaryCity = broker.city || broker.cities[0] || null;
  const maxTags = 3;
  const visibleTags = broker.tags.slice(0, maxTags);
  const hiddenCount = Math.max(0, broker.tags.length - maxTags);

  const avatarSize = featured ? "w-24 h-24" : "w-20 h-20";
  const nameSize = featured ? "text-xl" : "text-lg";

  return (
    <article
      className={cn(
        "rounded-xl p-5 transition-all flex flex-col h-full",
        featured
          ? "lg:col-span-2 border-2 border-orange-500 bg-gradient-to-br from-orange-50 to-white shadow-sm"
          : "bg-white border border-gray-200 hover:border-orange-300 hover:shadow-lg"
      )}
    >
      {featured && (
        <div className="mb-3">
          <Badge variant="top">Doporučený</Badge>
        </div>
      )}

      <div className="flex items-start gap-4">
        {broker.avatar ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={broker.avatar}
            alt={`${broker.firstName} ${broker.lastName}`}
            className={cn(
              avatarSize,
              "rounded-full object-cover shrink-0 border border-gray-200"
            )}
          />
        ) : (
          <div
            className={cn(
              avatarSize,
              "rounded-full bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center text-white font-extrabold text-xl shrink-0"
            )}
          >
            {initials}
          </div>
        )}

        <div className="min-w-0 flex-1">
          <h3 className={cn(nameSize, "font-bold text-gray-900 truncate")}>
            {broker.firstName} {broker.lastName}
          </h3>
          <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
            <Badge variant={broker.level === "TOP" || broker.level === "SENIOR" ? "top" : "verified"}>
              {LEVEL_LABEL[broker.level] ?? "Makléř"}
            </Badge>
            {primaryCity && <span>{primaryCity}</span>}
          </div>
        </div>
      </div>

      {visibleTags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-4">
          {visibleTags.map((t) => (
            <TagPill
              key={t.slug}
              slug={t.slug}
              label={t.label}
              size="sm"
              variant="muted"
            />
          ))}
          {hiddenCount > 0 && (
            <span className="inline-flex items-center px-2.5 py-0.5 text-xs text-gray-500 rounded-full bg-gray-50">
              +{hiddenCount}
            </span>
          )}
        </div>
      )}

      {broker.bio && (
        <p className="text-sm text-gray-600 line-clamp-2 mt-3">{broker.bio}</p>
      )}

      <div className="flex gap-4 mt-4 pt-4 border-t border-gray-100 text-sm text-gray-600">
        <div>
          <span className="font-bold text-gray-900">{broker.totalSales}</span>{" "}
          prodejů
        </div>
        {featured && (
          <div>
            <span className="font-bold text-gray-900">
              {broker.activeVehicles}
            </span>{" "}
            aktivních vozidel
          </div>
        )}
      </div>

      <div className="mt-4 flex gap-2">
        <Link
          href={`/profil/${broker.slug}`}
          className="flex-1 inline-flex items-center justify-center bg-orange-500 hover:bg-orange-600 text-white font-semibold px-4 py-2 rounded-full text-sm no-underline transition-colors"
        >
          Zobrazit profil
        </Link>
        {broker.phone && broker.showPhone && (
          <a
            href={`tel:${broker.phone}`}
            className="inline-flex items-center justify-center border border-gray-300 hover:border-orange-300 text-gray-700 font-semibold px-4 py-2 rounded-full text-sm no-underline transition-colors"
            aria-label={`Zavolat ${broker.firstName} ${broker.lastName}`}
          >
            Kontaktovat
          </a>
        )}
      </div>
    </article>
  );
}
