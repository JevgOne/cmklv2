"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSession } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { LikeButton } from "@/components/web/LikeButton";
import { CommentSection } from "@/components/web/CommentSection";
import { TagPill } from "@/components/web/TagPill";
import { VehicleCard, type VehicleData } from "@/components/web/VehicleCard";
import { BADGE_CATALOG } from "@/lib/badge-catalog";
import { getDefaultCover } from "@/lib/profile/defaultCovers";
import { categorizeSpecialization } from "@/lib/broker-specializations";
import { fuelLabels, transmissionLabels } from "@/lib/vehicle-labels";
import { formatPrice, getInitials, parseCities } from "@/lib/utils";
import {
  ROLE_LABELS,
  LEVEL_LABELS,
  ROLE_TABS,
  TAB_LABELS,
  DAY_LABELS,
} from "@/lib/role-labels";

export interface ProfileUser {
  id: string;
  firstName: string;
  lastName: string;
  avatar: string | null;
  coverPhoto: string | null;
  bio: string | null;
  city: string | null;
  slug: string;
  role: string;
  level: string;
  totalSales: number;
  profileViews: number;
  favoriteBrands: string | null;
  phone: string | null;
  email: string | null;
  createdAt: string;
  yearsExperience: number | null;
  website: string | null;
  motto: string | null;
  socialLinks: {
    instagram?: string;
    facebook?: string;
    youtube?: string;
  } | null;
  services: string[] | null;
  languageSkills: string[] | null;
  specializations: string | null;
  warehouseAddress: string | null;
  openingHours: Record<string, string> | null;
  tags: { slug: string; label: string }[] | null;
}

export interface ProfileStats {
  vehicles: number;
  listings: number;
  parts: number;
  totalLikes: number;
  totalSales: number;
}

export interface ProfileBadge {
  badgeKey: string;
  awardedAt: string;
}

export interface ProfileData {
  user: ProfileUser;
  stats: ProfileStats;
  roleStats: Record<string, number>;
  badges: ProfileBadge[];
}

interface ProfileItem {
  id: string;
  slug?: string;
  brand?: string;
  model?: string;
  variant?: string | null;
  name?: string;
  year?: number;
  price?: number;
  mileage?: number;
  fuelType?: string;
  transmission?: string;
  enginePower?: number | null;
  city?: string;
  trustScore?: number;
  stkValidUntil?: string | null;
  sellerType?: string;
  listingType?: string;
  isPremium?: boolean;
  category?: string;
  images?: { url: string }[];
  broker?: {
    id: string;
    firstName: string;
    lastName: string;
    slug?: string | null;
  } | null;
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    companyName?: string | null;
  } | null;
  _count?: { profileLikes: number; profileComments: number };
  vehicle?: {
    id: string;
    slug: string;
    brand: string;
    model: string;
    year: number;
    price: number;
    images: { url: string }[];
  } | null;
  listing?: {
    id: string;
    slug: string;
    brand: string;
    model: string;
    year: number;
    price: number;
    images: { url: string }[];
  } | null;
  part?: {
    id: string;
    slug: string;
    name: string;
    price: number;
    images: { url: string }[];
  } | null;
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
    <div className="text-center">
      <div className={`text-xl font-bold ${valueClass ?? "text-gray-900"}`}>
        {value}
      </div>
      <div className="text-xs text-gray-500">{label}</div>
    </div>
  );
}

interface ProfileClientProps {
  initialData: ProfileData;
  slug: string;
}

export function ProfileClient({ initialData, slug }: ProfileClientProps) {
  const { data: session } = useSession();

  const { user, stats, roleStats, badges } = initialData;
  const [activeTab, setActiveTab] = useState<string>(
    (ROLE_TABS[user.role] || ["liked"])[0],
  );
  const [items, setItems] = useState<ProfileItem[]>([]);
  const [itemType, setItemType] = useState("");
  const [loadingItems, setLoadingItems] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [coverError, setCoverError] = useState(false);
  const viewFiredRef = useRef(false);

  const coverSrc = user.coverPhoto || getDefaultCover(user.id);

  // Viewer-vs-owner check happens server-side in /api/profile/[slug].
  // Ref guard prevents React 18 StrictMode double-fire in dev.
  useEffect(() => {
    if (viewFiredRef.current) return;
    viewFiredRef.current = true;
    fetch(`/api/profile/${slug}`).catch(() => {});
  }, [slug]);

  const fetchItems = useCallback(
    async (cursor: string | undefined, signal: AbortSignal) => {
      setLoadingItems(true);
      try {
        const url = `/api/profile/${slug}/items?tab=${activeTab}&limit=12${
          cursor ? `&cursor=${cursor}` : ""
        }`;
        const res = await fetch(url, { signal });
        if (res.ok) {
          const data = await res.json();
          if (cursor) {
            setItems((prev) => [...prev, ...(data.items ?? [])]);
          } else {
            setItems(data.items ?? []);
          }
          setNextCursor(data.nextCursor);
          setItemType(data.type);
        }
      } catch (err) {
        if ((err as { name?: string }).name === "AbortError") return;
      } finally {
        if (!signal.aborted) setLoadingItems(false);
      }
    },
    [slug, activeTab],
  );

  useEffect(() => {
    if (!activeTab) return;
    const ctrl = new AbortController();
    setItems([]);
    setNextCursor(null);
    fetchItems(undefined, ctrl.signal);
    return () => ctrl.abort();
  }, [activeTab, fetchItems]);

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          url,
          title: `Profil — ${user.firstName} ${user.lastName}`,
        });
      } catch {}
    } else {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const isOwner = !!session?.user?.id && session.user.id === user.id;
  const tabs = ROLE_TABS[user.role] || ["liked"];
  const favBrands = parseCities(user.favoriteBrands);
  const specsRaw = parseCities(user.specializations);
  const servicesRaw = user.services ?? [];
  const languages = user.languageSkills ?? [];

  // Rozdělit specializations + services do 2 skupin (typy vozidel / služby).
  // Mergujeme z obou DB polí, protože hodnoty mohou být historicky zapsané
  // v opačném poli (backward compat). categorizeSpecialization je case-insensitive.
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
        // Unknown / starý formát — fallback do typů (zachová viditelnost).
        vTypes.push(item);
      }
    }
    return { vehicleTypeTags: vTypes, serviceTags: svcs };
  })();
  const memberSince = new Date(user.createdAt).toLocaleDateString("cs-CZ", {
    month: "long",
    year: "numeric",
  });
  const roleLabel = ROLE_LABELS[user.role] ?? user.role;
  const levelLabel =
    user.level !== "JUNIOR" ? LEVEL_LABELS[user.level] ?? user.level : null;

  const fullName = `${user.firstName} ${user.lastName}`;
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
    <main className="min-h-screen bg-gray-50 pb-16">
      <div className="relative h-56 sm:h-72 md:h-96 bg-gradient-to-br from-orange-400 via-orange-500 to-orange-600 overflow-hidden">
        {!coverError && (
          <Image
            src={coverSrc}
            alt="Cover"
            fill
            sizes="100vw"
            className="object-cover"
            priority
            onError={() => setCoverError(true)}
          />
        )}
        {!coverError && (
          <div
            className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/10 to-transparent pointer-events-none"
            aria-hidden="true"
          />
        )}
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4 sm:space-y-6">
        <section className="-mt-20 sm:-mt-24 relative z-10">
          <div className="bg-white rounded-2xl shadow-card p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
              <div className="relative w-28 h-28 sm:w-36 sm:h-36 -mt-16 sm:-mt-20 rounded-full border-4 border-white bg-gray-200 overflow-hidden shadow-lg shrink-0 mx-auto sm:mx-0">
                {user.avatar ? (
                  <Image
                    src={user.avatar}
                    alt={fullName}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-4xl text-gray-400">
                    {getInitials(user.firstName, user.lastName)}
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 break-words">
                      {fullName}
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">
                      {roleLabel}
                      {user.city ? ` · ${user.city}` : ""} · Člen od{" "}
                      {memberSince}
                    </p>
                  </div>
                  {levelLabel && (
                    <Badge variant="top" className="shrink-0">
                      {levelLabel}
                    </Badge>
                  )}
                </div>

                {user.tags && user.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-4">
                    {user.tags.map((tag) => (
                      <TagPill
                        key={tag.slug}
                        slug={tag.slug}
                        label={tag.label}
                      />
                    ))}
                  </div>
                )}

                {/* Stats row */}
                <div className="flex flex-wrap gap-6 sm:gap-8 mt-5 py-3 border-t border-gray-100">
                  {stats.vehicles > 0 && (
                    <Stat value={stats.vehicles} label="Vozidla" />
                  )}
                  {stats.listings > 0 && (
                    <Stat value={stats.listings} label="Inzeráty" />
                  )}
                  {stats.parts > 0 && (
                    <Stat value={stats.parts} label="Díly" />
                  )}
                  <Stat value={stats.totalLikes} label="Lajky" />
                  {["BROKER", "MANAGER", "REGIONAL_DIRECTOR"].includes(
                    user.role,
                  ) && <Stat value={stats.totalSales} label="Prodáno" />}
                  {roleStats.completedFlips !== undefined && (
                    <Stat value={roleStats.completedFlips} label="Flipy" />
                  )}
                  {roleStats.avgROI !== undefined && (
                    <Stat
                      value={`${roleStats.avgROI}%`}
                      label="Průměrné ROI"
                      valueClass="text-green-600"
                    />
                  )}
                  {roleStats.totalInvested !== undefined && (
                    <Stat
                      value={formatPrice(roleStats.totalInvested)}
                      label="Investováno"
                    />
                  )}
                  {roleStats.completedDeals !== undefined && (
                    <Stat
                      value={roleStats.completedDeals}
                      label="Dokončené dealy"
                    />
                  )}
                  {roleStats.totalReturn !== undefined &&
                    roleStats.totalReturn > 0 && (
                      <Stat
                        value={formatPrice(roleStats.totalReturn)}
                        label="Výnos"
                        valueClass="text-green-600"
                      />
                    )}
                </div>

                {/* Actions */}
                <div className="flex flex-wrap gap-2 mt-5">
                  {isOwner ? (
                    <Link
                      href="/muj-ucet/profil"
                      className="inline-flex items-center gap-1.5 py-2 px-4 bg-orange-500 text-white font-semibold rounded-full text-sm no-underline hover:bg-orange-600 transition-colors"
                    >
                      Upravit profil
                    </Link>
                  ) : (
                    user.phone && (
                      <a
                        href={`tel:${user.phone}`}
                        className="inline-flex items-center gap-1.5 py-2 px-4 bg-orange-500 text-white font-semibold rounded-full text-sm no-underline hover:bg-orange-600 transition-colors"
                      >
                        Kontaktovat
                      </a>
                    )
                  )}
                  <button
                    onClick={handleShare}
                    className="inline-flex items-center gap-1.5 py-2 px-4 bg-white border border-gray-200 text-gray-700 font-semibold rounded-full text-sm cursor-pointer hover:border-orange-300 transition-colors"
                  >
                    {copied ? "Zkopírováno!" : "Sdílet profil"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {hasAboutCard && (
          <Card className="p-6 sm:p-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              O makléři
            </h2>
            {user.bio && (
              <p className="text-gray-600 leading-relaxed whitespace-pre-line">
                {user.bio}
              </p>
            )}
            {user.motto && (
              <p className="text-sm italic text-gray-500 mt-3">
                &ldquo;{user.motto}&rdquo;
              </p>
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
            <h2 className="text-xl font-bold text-gray-900 mb-5">
              Specializace
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {(() => {
                const hasBothGroups =
                  vehicleTypeTags.length > 0 && serviceTags.length > 0;
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
                            <span
                              key={s}
                              className="text-xs font-medium bg-orange-50 text-orange-700 px-2.5 py-1 rounded-full"
                            >
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
                            <span
                              key={s}
                              className="text-xs font-medium bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full"
                            >
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
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">
                    Jazyky
                  </h3>
                  <div className="flex flex-wrap gap-1.5">
                    {languages.map((lang) => (
                      <span
                        key={lang}
                        className="text-xs font-medium bg-orange-50 text-orange-700 px-2.5 py-1 rounded-full"
                      >
                        {lang}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {user.yearsExperience !== null &&
                user.yearsExperience !== undefined && (
                  <div>
                    <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">
                      Zkušenosti
                    </h3>
                    <p className="text-sm text-gray-700">
                      {user.yearsExperience} let v oboru
                    </p>
                  </div>
                )}
            </div>
          </Card>
        )}

        {hasContactCard && (
          <Card className="p-6 sm:p-8">
            <h2 className="text-xl font-bold text-gray-900 mb-5">Kontakt</h2>
            <div className="space-y-3">
              {user.phone && (
                <a
                  href={`tel:${user.phone}`}
                  className="flex items-center gap-3 text-gray-700 hover:text-orange-600 no-underline transition-colors"
                >
                  <span className="text-lg" aria-hidden>
                    📞
                  </span>
                  <span className="text-sm font-medium">{user.phone}</span>
                </a>
              )}
              {user.website && (
                <a
                  href={user.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 text-gray-700 hover:text-orange-600 no-underline transition-colors"
                >
                  <span className="text-lg" aria-hidden>
                    🌐
                  </span>
                  <span className="text-sm font-medium">
                    {user.website.replace(/^https?:\/\//, "")}
                  </span>
                </a>
              )}
              {user.warehouseAddress && (
                <div>
                  <div className="flex items-start gap-3 text-gray-700">
                    <span className="text-lg" aria-hidden>
                      📍
                    </span>
                    <div>
                      <p className="text-sm font-medium">
                        {user.warehouseAddress}
                      </p>
                      {user.openingHours && (
                        <div className="mt-1 text-xs text-gray-500 flex flex-wrap gap-x-3">
                          {Object.entries(user.openingHours).map(
                            ([day, hours]) => (
                              <span key={day}>
                                {DAY_LABELS[day] || day}: {hours}
                              </span>
                            ),
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
              {user.socialLinks &&
                (user.socialLinks.instagram ||
                  user.socialLinks.facebook ||
                  user.socialLinks.youtube) && (
                  <div className="flex gap-4 pt-2">
                    {user.socialLinks.instagram && (
                      <a
                        href={user.socialLinks.instagram}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-medium text-gray-500 hover:text-pink-500 no-underline"
                      >
                        Instagram
                      </a>
                    )}
                    {user.socialLinks.facebook && (
                      <a
                        href={user.socialLinks.facebook}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-medium text-gray-500 hover:text-blue-600 no-underline"
                      >
                        Facebook
                      </a>
                    )}
                    {user.socialLinks.youtube && (
                      <a
                        href={user.socialLinks.youtube}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-medium text-gray-500 hover:text-red-500 no-underline"
                      >
                        YouTube
                      </a>
                    )}
                  </div>
                )}
            </div>
          </Card>
        )}

        <Card className="p-6 sm:p-8">
          <div className="border-b border-gray-200 mb-6 overflow-x-auto -mx-6 sm:-mx-8 px-6 sm:px-8">
            <div className="flex gap-0">
              {tabs.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-6 py-3 text-sm font-semibold border-b-2 -mb-px transition-colors cursor-pointer bg-transparent whitespace-nowrap ${
                    activeTab === tab
                      ? "border-orange-500 text-orange-700"
                      : "border-transparent text-gray-500 hover:text-gray-700"
                  }`}
                >
                  {TAB_LABELS[tab]}
                </button>
              ))}
            </div>
          </div>

          {loadingItems && items.length === 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="aspect-square bg-gray-100 rounded-xl animate-pulse"
                />
              ))}
            </div>
          ) : items.length === 0 ? (
            <p className="text-gray-500 text-center py-10">
              Žádné položky v této kategorii.
            </p>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {items.map((item) => (
                  <ProfileItemCard
                    key={item.id}
                    item={item}
                    type={itemType}
                  />
                ))}
              </div>
              {nextCursor && (
                <div className="text-center mt-6">
                  <Button
                    variant="ghost"
                    onClick={() => fetchItems(nextCursor, new AbortController().signal)}
                    disabled={loadingItems}
                  >
                    {loadingItems ? "Načítám..." : "Načíst další"}
                  </Button>
                </div>
              )}
            </>
          )}
        </Card>

        {badges.length > 0 && (
          <Card className="p-6 sm:p-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Ocenění a odznaky
            </h2>
            <div className="flex flex-wrap gap-3">
              {badges.map((badge) => {
                const info = BADGE_CATALOG[badge.badgeKey];
                if (!info) return null;
                return (
                  <div
                    key={badge.badgeKey}
                    className="flex items-center gap-2 bg-gray-50 border border-gray-100 rounded-full px-4 py-2"
                    title={info.description}
                  >
                    <span className="text-lg">{info.icon}</span>
                    <span className="text-sm font-medium text-gray-700">
                      {info.name}
                    </span>
                  </div>
                );
              })}
            </div>
          </Card>
        )}
      </div>
    </main>
  );
}

function mapVehicleItemToCard(item: ProfileItem, type: string): VehicleData {
  const brand = item.brand ?? "";
  const model = item.model ?? "";
  const variant = item.variant ?? "";
  const name = `${brand} ${model}${variant ? " " + variant : ""}`.trim();
  const km = item.mileage
    ? new Intl.NumberFormat("cs-CZ").format(item.mileage) + " km"
    : "";
  const fuel = item.fuelType ? fuelLabels[item.fuelType] ?? item.fuelType : "";
  const transmission = item.transmission
    ? transmissionLabels[item.transmission] ?? item.transmission
    : "";
  const hp = item.enginePower ? `${item.enginePower} HP` : "";
  const priceStr = item.price
    ? new Intl.NumberFormat("cs-CZ").format(item.price)
    : "0";
  const photo = item.images?.[0]?.url || "/images/placeholder-car.jpg";
  const trust = item.trustScore ?? 0;

  let badge: "verified" | "top" | "default" = "default";
  if (type === "listing") {
    badge = item.isPremium ? "top" : "default";
  } else {
    if (trust >= 95) badge = "top";
    else if (trust >= 80) badge = "verified";
  }

  const brokerName =
    type === "vehicle" && item.broker
      ? `${item.broker.firstName} ${item.broker.lastName}`
      : type === "listing" && item.listingType === "DEALER" && item.user
        ? item.user.companyName ||
          `${item.user.firstName} ${item.user.lastName}`
        : undefined;

  return {
    id: item.id,
    name,
    year: item.year ?? 0,
    km,
    fuel,
    transmission,
    city: item.city ?? "",
    hp,
    price: priceStr,
    trust,
    badge,
    photo,
    slug: item.slug,
    sellerType:
      type === "listing"
        ? "listing"
        : (item.sellerType as "broker" | "private" | undefined) ?? "broker",
    brokerName,
    listingType: item.listingType as "BROKER" | "DEALER" | "PRIVATE" | undefined,
    isPremium: item.isPremium,
    source: type === "listing" ? "listing" : "vehicle",
    priceNum: item.price,
    stkValidUntil: item.stkValidUntil ?? undefined,
  };
}

function ProfileItemCard({
  item,
  type,
}: {
  item: ProfileItem;
  type: string;
}) {
  if (type === "vehicle" || type === "listing") {
    const vehicleData = mapVehicleItemToCard(item, type);
    const likeCount = item._count?.profileLikes ?? 0;
    const commentCount = item._count?.profileComments ?? 0;
    const entityProps: { vehicleId?: string; listingId?: string } =
      type === "vehicle" ? { vehicleId: item.id } : { listingId: item.id };

    return (
      <div className="group">
        <VehicleCard car={vehicleData} />
        <div className="flex items-center gap-3 mt-2 px-0.5">
          <LikeButton {...entityProps} initialCount={likeCount} size="sm" />
          {commentCount > 0 && (
            <span className="text-xs text-gray-400">
              &#128172; {commentCount}
            </span>
          )}
        </div>
        <CommentSection {...entityProps} initialCount={commentCount} />
      </div>
    );
  }

  if (type === "investment") {
    const raw = item as unknown as {
      opportunity: {
        brand: string;
        model: string;
        year: number;
        status: string;
        photos: string | null;
        estimatedSalePrice: number;
      } | null;
      amount: number;
    };
    const opp = raw.opportunity;
    if (!opp) return null;
    const photos = parseCities(opp.photos);
    const label = `${opp.brand} ${opp.model} (${opp.year})`;
    const amount = raw.amount;
    return (
      <div>
        <div className="relative aspect-square bg-gray-100 rounded-xl overflow-hidden">
          {photos[0] ? (
            <Image
              src={photos[0]}
              alt={label}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-3xl text-gray-300">
              &#128176;
            </div>
          )}
          <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/60 to-transparent p-2.5">
            <p className="text-white text-xs font-semibold truncate">
              {label}
            </p>
            <p className="text-orange-300 text-xs font-bold">
              {formatPrice(amount)}
            </p>
          </div>
          <div className="absolute top-2 right-2">
            <span className="text-[10px] font-bold bg-white/90 text-gray-700 px-2 py-0.5 rounded-full">
              {opp.status}
            </span>
          </div>
        </div>
      </div>
    );
  }

  if (type === "flip") {
    const raw = item as unknown as {
      photos: string | null;
      brand: string;
      model: string;
      price: number | null;
      status: string;
    };
    const photos = parseCities(raw.photos);
    const label = `${raw.brand} ${raw.model}`;
    const status = raw.status;
    return (
      <div>
        <div className="relative aspect-square bg-gray-100 rounded-xl overflow-hidden">
          {photos[0] ? (
            <Image
              src={photos[0]}
              alt={label}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-3xl text-gray-300">
              &#128663;
            </div>
          )}
          <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/60 to-transparent p-2.5">
            <p className="text-white text-xs font-semibold truncate">
              {label}
            </p>
            {item.price && (
              <p className="text-orange-300 text-xs font-bold">
                {formatPrice(item.price)}
              </p>
            )}
          </div>
          <div className="absolute top-2 right-2">
            <span className="text-[10px] font-bold bg-white/90 text-gray-700 px-2 py-0.5 rounded-full">
              {status}
            </span>
          </div>
        </div>
      </div>
    );
  }

  if (type === "liked") {
    const target = item.vehicle || item.listing || item.part;
    if (!target) return null;

    const image = target.images?.[0]?.url;
    const label =
      "name" in target
        ? target.name
        : `${(target as { brand: string }).brand} ${
            (target as { model: string }).model
          }`;
    const href =
      "name" in target ? `/dily/${target.slug}` : `/nabidka/${target.slug}`;

    return (
      <Link href={href} className="no-underline group">
        <div className="relative aspect-square bg-gray-100 rounded-xl overflow-hidden">
          {image ? (
            <Image
              src={image}
              alt={label}
              fill
              className="object-cover group-hover:scale-105 transition-transform"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-3xl text-gray-300">
              &#128663;
            </div>
          )}
          <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/60 to-transparent p-2.5">
            <p className="text-white text-xs font-semibold truncate">
              {label}
            </p>
            {"price" in target && target.price && (
              <p className="text-orange-300 text-xs font-bold">
                {formatPrice(target.price as number)}
              </p>
            )}
          </div>
        </div>
      </Link>
    );
  }

  // Tail render: only `part` type reaches here (vehicle/listing handled by
  // early return at L819, investment/flip/liked handled above).
  const image = item.images?.[0]?.url;
  const likeCount = item._count?.profileLikes ?? 0;
  const commentCount = item._count?.profileComments ?? 0;

  const label = item.name ? item.name : `${item.brand} ${item.model}`;

  const href = `/dily/${item.slug}`;

  const entityProps: { partId?: string } = { partId: item.id };

  return (
    <div className="group">
      <Link href={href} className="no-underline">
        <div className="relative aspect-square bg-gray-100 rounded-xl overflow-hidden">
          {image ? (
            <Image
              src={image}
              alt={label}
              fill
              className="object-cover group-hover:scale-105 transition-transform"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-3xl text-gray-300">
              {"\u2699"}
            </div>
          )}
          <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/60 to-transparent p-2.5">
            <p className="text-white text-xs font-semibold truncate">
              {label}
            </p>
            {item.price && (
              <p className="text-orange-300 text-xs font-bold">
                {formatPrice(item.price)}
              </p>
            )}
          </div>
        </div>
      </Link>
      <div className="flex items-center gap-3 mt-2 px-0.5">
        <LikeButton {...entityProps} initialCount={likeCount} size="sm" />
        {commentCount > 0 && (
          <span className="text-xs text-gray-400">
            &#128172; {commentCount}
          </span>
        )}
      </div>
      <CommentSection {...entityProps} initialCount={commentCount} />
    </div>
  );
}
