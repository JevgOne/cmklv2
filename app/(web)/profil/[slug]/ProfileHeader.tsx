import Image from "next/image";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { TagPill } from "@/components/web/TagPill";
import { LevelBadge } from "@/components/pwa/gamification/LevelBadge";
import { TrustScoreBadge } from "@/components/ui/TrustScoreBadge";
import { SkillTags } from "@/components/ui/SkillTags";
import { AutoBadges } from "@/components/ui/AutoBadges";
import { ActivitySignal } from "@/components/ui/ActivitySignal";
import { BrokerReviewSection } from "@/components/web/BrokerReviewSection";
import { getDefaultCover } from "@/lib/profile/defaultCovers";
import { categorizeSpecialization } from "@/lib/broker-specializations";
import { formatPrice, parseCities } from "@/lib/utils";
import { ROLE_LABELS, DAY_LABELS } from "@/lib/role-labels";
import { CoverImage } from "./CoverImage";
import { ShareButton } from "./ShareButton";
import type { ProfileData } from "./ProfileClient";

function safeHref(url: string): string {
  return /^https?:\/\//i.test(url) ? url : "#";
}

function Stat({
  value,
  label,
  valueClass,
}: {
  value: number | string;
  label: string;
  valueClass?: string;
}) {
  return (
    <div className="text-center px-5 sm:px-8">
      <div className={`text-xl font-bold ${valueClass ?? "text-gray-900"}`}>
        {value}
      </div>
      <div className="text-xs text-gray-500">{label}</div>
    </div>
  );
}

export function ProfileHeader({
  data,
  isOwner,
}: {
  data: ProfileData;
  isOwner: boolean;
}) {
  const { user, stats, roleStats, reputation, brokerReviews, ratingBreakdown, detailedRatings } = data;

  const coverSrc = user.coverPhoto || getDefaultCover(user.id);
  const memberSince = new Date(user.createdAt).toLocaleDateString("cs-CZ", {
    month: "long",
    year: "numeric",
  });
  const roleLabel = user.jobTitle || ROLE_LABELS[user.role] || user.role;
  const fullName = `${user.firstName} ${user.lastName}`;

  const favBrands = parseCities(user.favoriteBrands);
  const specsRaw = parseCities(user.specializations);
  const servicesRaw = user.services ?? [];
  const languages = user.languageSkills ?? [];

  const { vehicleTypeTags, serviceTags } = (() => {
    const allRaw = [...specsRaw, ...servicesRaw];
    const seen = new Set<string>();
    const vTypes: string[] = [];
    const svcs: string[] = [];
    for (const item of allRaw) {
      const key = item.trim().toLowerCase();
      if (!key || seen.has(key)) continue;
      seen.add(key);
      const cat = categorizeSpecialization(item);
      if (cat === "type") {
        vTypes.push(item);
      } else if (cat === "service") {
        svcs.push(item);
      } else {
        vTypes.push(item);
      }
    }
    return { vehicleTypeTags: vTypes, serviceTags: svcs };
  })();

  const hasAboutCard = !!(user.bio || user.motto || favBrands.length > 0);
  const hasSpecCard =
    vehicleTypeTags.length > 0 ||
    serviceTags.length > 0 ||
    languages.length > 0 ||
    !!user.yearsExperience;
  const hasContactCard = !!(
    user.phone ||
    user.website ||
    user.warehouseAddress ||
    user.socialLinks?.instagram ||
    user.socialLinks?.facebook ||
    user.socialLinks?.youtube
  );

  return (
    <>
      <div className="relative h-56 sm:h-72 md:h-96 bg-gradient-to-br from-orange-400 via-orange-500 to-orange-600 overflow-hidden">
        <CoverImage src={coverSrc} />
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4 sm:space-y-6">
        <section className="-mt-20 sm:-mt-24 relative z-10">
          <div className="bg-white rounded-2xl shadow-card p-6 sm:p-8">
            <div className="flex flex-col items-center">
              {/* Avatar */}
              <div className="relative w-28 h-28 sm:w-32 sm:h-32 -mt-20 sm:-mt-24 rounded-full border-4 border-white bg-gray-200 overflow-hidden shadow-lg">
                <Image
                  src={user.avatar || "/brand/default-avatar.png"}
                  alt={fullName}
                  fill
                  className="object-cover"
                />
              </div>

              {/* Name */}
              <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mt-4 text-center">
                {fullName}
              </h1>
              <p className="text-sm text-gray-500 mt-1 text-center">
                {roleLabel}
                {user.city ? ` · ${user.city}` : ""} · Člen od{" "}
                {memberSince}
              </p>

              {/* Career Level + Trust Score */}
              <div className="flex items-center gap-4 mt-4">
                {["BROKER", "MANAGER", "REGIONAL_DIRECTOR"].includes(user.role) && (
                  <LevelBadge level={user.level} size="lg" />
                )}
                {reputation && reputation.score > 0 && (
                  <TrustScoreBadge score={reputation.score} tier={reputation.tier} size="md" />
                )}
              </div>

              {/* Activity signal */}
              {reputation && (
                <div className="mt-2">
                  <ActivitySignal
                    avgResponseMinutes={reputation.avgResponseMinutes}
                    responseRate={reputation.responseRate}
                    lastActiveAt={reputation.lastActiveAt}
                  />
                </div>
              )}

              {/* Stats row */}
              <div className="flex justify-center divide-x divide-gray-200 mt-4 py-4 w-full border-t border-b border-gray-100">
                {["BROKER", "MANAGER", "REGIONAL_DIRECTOR"].includes(user.role) && (
                  <Stat value={stats.totalSales} label="Prodejů" />
                )}
                {stats.vehicles > 0 && <Stat value={stats.vehicles} label="Vozidla" />}
                {stats.listings > 0 && <Stat value={stats.listings} label="Inzeráty" />}
                {stats.parts > 0 && <Stat value={stats.parts} label="Díly" />}
                {stats.totalLikes > 0 && <Stat value={stats.totalLikes} label="Lajky" />}
                {roleStats.completedFlips !== undefined && (
                  <Stat value={roleStats.completedFlips} label="Flipy" />
                )}
                {roleStats.avgROI !== undefined && (
                  <Stat value={`${roleStats.avgROI}%`} label="Průměrné ROI" valueClass="text-green-600" />
                )}
                {roleStats.totalInvested !== undefined && (
                  <Stat value={formatPrice(roleStats.totalInvested)} label="Investováno" />
                )}
                {roleStats.completedDeals !== undefined && (
                  <Stat value={roleStats.completedDeals} label="Dokončené dealy" />
                )}
                {roleStats.totalReturn !== undefined && roleStats.totalReturn > 0 && (
                  <Stat value={formatPrice(roleStats.totalReturn)} label="Výnos" valueClass="text-green-600" />
                )}
              </div>

              {/* Auto-badges */}
              {reputation && reputation.badges.length > 0 && (
                <div className="mt-4">
                  <AutoBadges badges={reputation.badges} />
                </div>
              )}

              {/* Skill Tags */}
              {reputation && (
                <div className="mt-4">
                  <SkillTags
                    tags={reputation.skillTags}
                    targetId={user.id}
                    context={reputation.context}
                    interactive={!isOwner}
                  />
                  {isOwner && (
                    <p className="text-[11px] text-gray-400 mt-2 text-center">
                      Návštěvníci vašeho profilu vás mohou ohodnotit kliknutím na tag
                    </p>
                  )}
                </div>
              )}

              {user.tags && user.tags.length > 0 && (
                <div className="flex flex-wrap justify-center gap-1.5 mt-4">
                  {user.tags.map((tag) => (
                    <TagPill key={tag.slug} slug={tag.slug} label={tag.label} />
                  ))}
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-wrap justify-center gap-2 mt-5">
                {isOwner ? (
                  <Link
                    href="/muj-ucet/profil"
                    className="inline-flex items-center gap-1.5 py-2 px-4 bg-orange-500 text-white font-semibold rounded-full text-sm no-underline hover:bg-orange-600 transition-colors"
                  >
                    Upravit profil
                  </Link>
                ) : (
                  <>
                    {user.phone && (
                      <a
                        href={`tel:${user.phone}`}
                        className="inline-flex items-center gap-1.5 py-2.5 px-5 bg-orange-500 text-white font-semibold rounded-full text-sm no-underline hover:bg-orange-600 transition-colors shadow-sm"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                        Zavolat
                      </a>
                    )}
                    {user.email && (
                      <a
                        href={`mailto:${user.email}`}
                        className="inline-flex items-center gap-1.5 py-2.5 px-5 border-2 border-orange-500 text-orange-600 font-semibold rounded-full text-sm no-underline hover:bg-orange-50 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        Napsat zprávu
                      </a>
                    )}
                  </>
                )}
                <ShareButton name={fullName} />
              </div>

              {/* CTA */}
              {!isOwner && (user.role === "BROKER" || user.role === "MANAGER") && (
                <div className="w-full mt-4 pt-4 border-t border-gray-200">
                  <Link
                    href="/chci-prodat"
                    className="flex items-center gap-3 p-4 bg-orange-50 rounded-xl no-underline hover:bg-orange-100 transition-colors group"
                  >
                    <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center text-xl group-hover:scale-110 transition-transform">
                      🚗
                    </div>
                    <div>
                      <div className="font-bold text-gray-900 text-sm">Chcete prodat auto?</div>
                      <div className="text-xs text-gray-500">Vyplňte formulář a makléř vás kontaktuje</div>
                    </div>
                    <span className="ml-auto text-orange-500 font-semibold text-sm">→</span>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </section>

        {hasAboutCard && (
          <Card className="p-6 sm:p-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">O makléři</h2>
            {user.bio && (
              <p className="text-gray-600 leading-relaxed whitespace-pre-line">{user.bio}</p>
            )}
            {user.motto && (
              <p className="text-sm italic text-gray-500 mt-3">&ldquo;{user.motto}&rdquo;</p>
            )}
            {favBrands.length > 0 && (
              <div className="mt-5">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">
                  Oblíbené značky
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {favBrands.map((brand) => (
                    <span
                      key={brand}
                      className="text-xs font-medium bg-gray-100 text-gray-700 px-2.5 py-1 rounded-full"
                    >
                      {brand}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </Card>
        )}

        {hasSpecCard && (
          <Card className="p-6 sm:p-8">
            <h2 className="text-xl font-bold text-gray-900 mb-5">Specializace</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {(() => {
                const hasBothGroups = vehicleTypeTags.length > 0 && serviceTags.length > 0;
                return (
                  <>
                    {vehicleTypeTags.length > 0 && (
                      <div>
                        {hasBothGroups && (
                          <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">
                            Typy vozidel
                          </h3>
                        )}
                        <div className="flex flex-wrap gap-1.5">
                          {vehicleTypeTags.map((s) => (
                            <span key={s} className="text-xs font-medium bg-orange-50 text-orange-700 px-2.5 py-1 rounded-full">
                              {s}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {serviceTags.length > 0 && (
                      <div>
                        {hasBothGroups && (
                          <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">
                            Služby
                          </h3>
                        )}
                        <div className="flex flex-wrap gap-1.5">
                          {serviceTags.map((s) => (
                            <span key={s} className="text-xs font-medium bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full">
                              {s}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                );
              })()}
              {languages.length > 0 && (
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">Jazyky</h3>
                  <div className="flex flex-wrap gap-1.5">
                    {languages.map((lang) => (
                      <span key={lang} className="text-xs font-medium bg-orange-50 text-orange-700 px-2.5 py-1 rounded-full">
                        {lang}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {user.yearsExperience !== null && user.yearsExperience !== undefined && (
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">Zkušenosti</h3>
                  <p className="text-sm text-gray-700">{user.yearsExperience} let v oboru</p>
                </div>
              )}
            </div>
          </Card>
        )}

        {hasContactCard && (
          <Card className="p-6 sm:p-8">
            <h2 className="text-xl font-bold text-gray-900 mb-5">Kontakt</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-3">
                {user.phone && (
                  <a
                    href={`tel:${user.phone}`}
                    className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 hover:bg-orange-50 text-gray-700 hover:text-orange-600 no-underline transition-colors group"
                  >
                    <div className="w-10 h-10 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center shrink-0 group-hover:bg-orange-500 group-hover:text-white transition-colors">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 font-medium">Telefon</p>
                      <p className="text-sm font-semibold">{user.phone}</p>
                    </div>
                  </a>
                )}
                {user.website && (
                  <a
                    href={safeHref(user.website)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 hover:bg-orange-50 text-gray-700 hover:text-orange-600 no-underline transition-colors group"
                  >
                    <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 group-hover:bg-blue-500 group-hover:text-white transition-colors">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                      </svg>
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-gray-400 font-medium">Web</p>
                      <p className="text-sm font-semibold truncate">{user.website.replace(/^https?:\/\//, "")}</p>
                    </div>
                  </a>
                )}
                {user.warehouseAddress && (
                  <div className="flex items-start gap-3 p-3 rounded-xl bg-gray-50">
                    <div className="w-10 h-10 rounded-lg bg-green-100 text-green-600 flex items-center justify-center shrink-0 mt-0.5">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 font-medium">Adresa</p>
                      <p className="text-sm font-semibold text-gray-700">{user.warehouseAddress}</p>
                      {user.openingHours && (
                        <div className="mt-1.5 text-xs text-gray-500 flex flex-wrap gap-x-3">
                          {Object.entries(user.openingHours).map(([day, hours]) => (
                            <span key={day}>{DAY_LABELS[day] || day}: {hours}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {user.socialLinks && (user.socialLinks.instagram || user.socialLinks.facebook || user.socialLinks.youtube) && (
                <div>
                  <p className="text-xs text-gray-400 font-medium mb-3">Sociální sítě</p>
                  <div className="flex gap-3">
                    {user.socialLinks.instagram && (
                      <a
                        href={safeHref(user.socialLinks.instagram)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-12 h-12 flex items-center justify-center rounded-xl bg-gradient-to-tr from-purple-500 to-pink-500 text-white hover:scale-110 hover:shadow-lg transition-all duration-200"
                        title="Instagram"
                      >
                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                        </svg>
                      </a>
                    )}
                    {user.socialLinks.facebook && (
                      <a
                        href={safeHref(user.socialLinks.facebook)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-12 h-12 flex items-center justify-center rounded-xl bg-blue-600 text-white hover:scale-110 hover:shadow-lg transition-all duration-200"
                        title="Facebook"
                      >
                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                        </svg>
                      </a>
                    )}
                    {user.socialLinks.youtube && (
                      <a
                        href={safeHref(user.socialLinks.youtube)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-12 h-12 flex items-center justify-center rounded-xl bg-red-600 text-white hover:scale-110 hover:shadow-lg transition-all duration-200"
                        title="YouTube"
                      >
                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                        </svg>
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>
          </Card>
        )}

        {/* Recenze od klientů */}
        {["BROKER", "MANAGER", "REGIONAL_DIRECTOR"].includes(user.role) && (
          <BrokerReviewSection
            brokerId={user.id}
            brokerSlug={user.slug}
            brokerName={`${user.firstName} ${user.lastName}`}
            avgRating={user.brokerAvgRating}
            reviewCount={user.brokerReviewCount}
            recommendRate={user.brokerRecommendRate}
            reviews={brokerReviews}
            breakdown={ratingBreakdown}
            detailedRatings={detailedRatings}
          />
        )}
      </div>
    </>
  );
}
