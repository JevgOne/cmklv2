import Link from "next/link";
import { Badge } from "@/components/ui/Badge";

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
  trustScore?: number | null;
  trustTier?: string | null;
  topSkillTags?: { tag: string; emoji: string; count: number }[];
}

export interface BrokerCardProps {
  broker: BrokerCardBroker;
}

const LEVEL_LABEL: Record<string, string> = {
  STAR_5: "⭐⭐⭐⭐⭐",
  STAR_4: "⭐⭐⭐⭐",
  STAR_3: "⭐⭐⭐",
  STAR_2: "⭐⭐",
  STAR_1: "⭐",
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
          <Badge variant={["STAR_4", "STAR_5"].includes(broker.level) ? "top" : "verified"}>
            {LEVEL_LABEL[broker.level] ?? "⭐"}
          </Badge>
          {broker.trustScore != null && broker.trustScore > 0 && (
            <>
              <span className="text-gray-300">·</span>
              <span className={`text-xs font-semibold ${
                (broker.trustScore ?? 0) >= 75 ? "text-yellow-600" :
                (broker.trustScore ?? 0) >= 50 ? "text-slate-600" :
                (broker.trustScore ?? 0) >= 25 ? "text-amber-600" : "text-gray-500"
              }`}>
                {broker.trustScore}
              </span>
            </>
          )}
        </div>
        {primaryCity && (
          <div className="flex items-center gap-1 mt-1.5">
            <svg className="w-3.5 h-3.5 text-orange-400" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
            </svg>
            <span className="text-sm text-gray-600 font-medium">{primaryCity}</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-3 divide-x divide-gray-100 mt-4 py-3 mx-5 border-y border-gray-100">
        <StatCell value={broker.totalSales} label="Prodejů" />
        <StatCell value={broker.activeVehicles} label="Vozidel" />
        <StatCell value={broker.tags.length} label="Specializací" />
      </div>

      {broker.topSkillTags && broker.topSkillTags.length > 0 && (
        <div className="flex justify-center gap-2 mt-3 px-5">
          {broker.topSkillTags.slice(0, 3).map((t) => (
            <span
              key={t.tag}
              title={t.tag}
              className="inline-flex items-center gap-0.5 text-sm"
            >
              <span>{t.emoji}</span>
              <span className="text-xs text-gray-500">{t.count}</span>
            </span>
          ))}
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
