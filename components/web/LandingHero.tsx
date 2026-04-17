import Link from "next/link";
import type { LandingStats } from "@/lib/landing-copy";
import { getInitials } from "@/lib/utils";

export interface LandingHeroBroker {
  slug: string;
  firstName: string;
  lastName: string;
  avatar: string | null;
}

export interface LandingHeroProps {
  eyebrow: string;
  h1: string;
  subheadline: string;
  stats: LandingStats;
  featuredBrokers: LandingHeroBroker[];
}

export function LandingHero({
  eyebrow,
  h1,
  subheadline,
  stats,
  featuredBrokers,
}: LandingHeroProps) {
  const chips: string[] = [];
  if (stats.count > 0) chips.push(`${stats.count} makléřů`);
  if (stats.totalSoldVehicles > 0) chips.push(`${stats.totalSoldVehicles} úspěšných prodejů`);
  if (stats.topLevelCount > 0) chips.push(`${stats.topLevelCount} TOP makléřů`);
  if (stats.activeVehicles > 0) chips.push(`${stats.activeVehicles} aktivních vozidel`);

  return (
    <section className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 py-12 sm:py-16 md:py-20 relative overflow-hidden">
      {/* Decorative gradient accent */}
      <div className="absolute inset-0 bg-gradient-to-r from-orange-500/10 via-transparent to-orange-500/5 pointer-events-none" aria-hidden="true" />
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-500 via-orange-400 to-amber-400" aria-hidden="true" />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-8">
          <div className="flex-1 min-w-0">
            <span className="inline-block text-xs font-semibold uppercase tracking-wider text-white/80 bg-white/10 px-3 py-1 rounded-full">
              {eyebrow}
            </span>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white mt-4 leading-tight">
              {h1}
            </h1>
            <p className="text-lg sm:text-xl text-white/90 mt-4 max-w-3xl leading-relaxed">
              {subheadline}
            </p>

            <div className="flex flex-wrap gap-3 mt-8">
              {chips.map((chip) => (
                <span
                  key={chip}
                  className="bg-white/10 border border-white/20 backdrop-blur-sm px-4 py-2 rounded-full text-white text-sm font-medium"
                >
                  {chip}
                </span>
              ))}
            </div>

            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <Link
                href="#broker-grid"
                className="inline-flex items-center justify-center bg-orange-500 text-white hover:bg-orange-600 font-semibold px-6 py-3 rounded-full no-underline transition-colors"
              >
                Najít makléře ↓
              </Link>
              <Link
                href="/registrace"
                className="inline-flex items-center justify-center border-2 border-white/70 text-white hover:bg-white/10 font-semibold px-6 py-3 rounded-full no-underline transition-colors"
              >
                Chci se stát makléřem
              </Link>
            </div>
          </div>

          {featuredBrokers.length > 0 && (
            <div className="flex items-center md:mt-2 shrink-0">
              {featuredBrokers.map((b, i) => {
                const initials = getInitials(b.firstName, b.lastName);
                return (
                  <div
                    key={b.slug}
                    className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full ring-2 ring-white/80 overflow-hidden bg-white/20 flex items-center justify-center text-white font-bold ${
                      i > 0 ? "-ml-3" : ""
                    }`}
                    style={{ zIndex: 10 - i }}
                    aria-hidden
                  >
                    {b.avatar ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={b.avatar}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-sm">{initials}</span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
