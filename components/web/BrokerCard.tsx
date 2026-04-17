import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { TagPill } from "@/components/web/TagPill";
import { getInitials } from "@/lib/utils";

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
}

const LEVEL_LABEL: Record<string, string> = {
  TOP: "TOP Makléř",
  SENIOR: "Senior",
  BROKER: "Makléř",
  JUNIOR: "Ověřený",
};

function StatCell({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <span className="text-base font-bold text-gray-900">
        {value > 0 ? value : "—"}
      </span>
      <span className="text-[11px] text-gray-500 mt-0.5">{label}</span>
    </div>
  );
}

export function BrokerCard({ broker }: BrokerCardProps) {
  const initials = getInitials(broker.firstName, broker.lastName);
  const primaryCity = broker.city || broker.cities[0] || null;
  const maxTags = 3;
  const visibleTags = broker.tags.slice(0, maxTags);
  const hiddenCount = Math.max(0, broker.tags.length - maxTags);

  return (
    <article className="rounded-2xl bg-white shadow-card hover:shadow-card-hover transition-all duration-300 hover:-translate-y-1 flex flex-col h-full overflow-hidden group">

      <div className="flex flex-col items-center pt-6 px-5">
        {/* Gradient ring wrapper */}
        <div className="p-[3px] rounded-full bg-gradient-to-br from-orange-400 via-orange-500 to-orange-600 shadow-sm">
          {broker.avatar ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={broker.avatar}
              alt={`${broker.firstName} ${broker.lastName}`}
              className="w-20 h-20 rounded-full object-cover border-[3px] border-white"
            />
          ) : (
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 border-[3px] border-white flex items-center justify-center text-orange-500 font-extrabold text-xl">
              {initials}
            </div>
          )}
        </div>

        <h3 className="mt-3 text-lg font-bold text-gray-900 truncate max-w-full text-center">
          {broker.firstName} {broker.lastName}
        </h3>

        <div className="flex items-center gap-1.5 mt-1">
          <Badge variant={broker.level === "TOP" || broker.level === "SENIOR" ? "top" : "verified"}>
            {LEVEL_LABEL[broker.level] ?? "Makléř"}
          </Badge>
          {primaryCity && (
            <>
              <span className="text-gray-300">·</span>
              <span className="text-xs text-gray-500">{primaryCity}</span>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 divide-x divide-gray-100 mt-4 py-3 mx-5 border-y border-gray-100">
        <StatCell value={broker.totalSales} label="Prodejů" />
        <StatCell value={broker.activeVehicles} label="Vozidel" />
        <StatCell value={broker.tags.length} label="Specializací" />
      </div>

      {broker.bio && (
        <p className="text-sm text-gray-500 line-clamp-2 mt-3 px-5 text-center">
          {broker.bio}
        </p>
      )}

      {visibleTags.length > 0 && (
        <div className="flex flex-wrap justify-center gap-1.5 mt-3 px-5">
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
            <span className="inline-flex items-center px-2.5 py-0.5 text-xs text-gray-400 rounded-full bg-gray-50">
              +{hiddenCount}
            </span>
          )}
        </div>
      )}

      <div className="mt-auto pt-4 px-5 pb-5 flex flex-col gap-2">
        <Link
          href={`/profil/${broker.slug}`}
          className="w-full inline-flex items-center justify-center bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2.5 rounded-xl text-sm no-underline transition-colors"
        >
          Zobrazit profil
        </Link>
        {broker.phone && broker.showPhone && (
          <a
            href={`tel:${broker.phone}`}
            className="w-full inline-flex items-center justify-center border border-gray-200 hover:border-orange-300 hover:text-orange-600 text-gray-600 font-medium py-2.5 rounded-xl text-sm no-underline transition-colors"
            aria-label={`Zavolat ${broker.firstName} ${broker.lastName}`}
          >
            Kontaktovat
          </a>
        )}
      </div>
    </article>
  );
}
