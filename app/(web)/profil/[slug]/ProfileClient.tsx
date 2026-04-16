"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { LikeButton } from "@/components/web/LikeButton";
import { CommentSection } from "@/components/web/CommentSection";
import { TagPill } from "@/components/web/TagPill";
import { BADGE_CATALOG } from "@/lib/badge-catalog";
import { formatPrice, getInitials } from "@/lib/utils";

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
  name?: string;
  year?: number;
  price?: number;
  category?: string;
  images?: { url: string }[];
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

const ROLE_TABS: Record<string, string[]> = {
  BROKER: ["vehicles", "liked"],
  ADVERTISER: ["listings", "liked"],
  PARTS_SUPPLIER: ["parts", "liked"],
  WHOLESALE_SUPPLIER: ["parts", "liked"],
  PARTNER_VRAKOVISTE: ["parts", "liked"],
  BUYER: ["liked"],
  ADMIN: ["vehicles", "listings", "parts", "liked"],
  BACKOFFICE: ["vehicles", "listings", "parts", "liked"],
  MANAGER: ["liked"],
  REGIONAL_DIRECTOR: ["liked"],
  INVESTOR: ["investments", "liked"],
  VERIFIED_DEALER: ["vehicles", "flips", "liked"],
  PARTNER_BAZAR: ["listings", "liked"],
};

const TAB_LABELS: Record<string, string> = {
  vehicles: "Vozidla",
  listings: "Inzeráty",
  parts: "Díly",
  liked: "Oblíbené",
  investments: "Investice",
  flips: "Flipy",
};

const LEVEL_LABELS: Record<string, string> = {
  JUNIOR: "Nováček",
  BROKER: "Makléř",
  SENIOR: "Senior",
  TOP: "TOP Makléř",
};

const ROLE_LABELS: Record<string, string> = {
  BROKER: "Certifikovaný makléř",
  ADVERTISER: "Inzerent",
  PARTS_SUPPLIER: "Dodavatel dílů",
  WHOLESALE_SUPPLIER: "Velkoobchod",
  PARTNER_VRAKOVISTE: "Vrakoviště",
  BUYER: "Zákazník",
  INVESTOR: "Ověřený investor",
  VERIFIED_DEALER: "Ověřený dealer",
  PARTNER_BAZAR: "Autobazar",
};

const DAY_LABELS: Record<string, string> = {
  po: "Po",
  ut: "Út",
  st: "St",
  ct: "Čt",
  pa: "Pá",
  so: "So",
  ne: "Ne",
};

function safeJsonArray(raw: string | null | undefined): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
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

  // Fire profileViews increment (viewer !== owner handled server-side in /api/profile/[slug]).
  useEffect(() => {
    fetch(`/api/profile/${slug}`).catch(() => {
      // silently fail
    });
  }, [slug]);

  const fetchItems = useCallback(
    async (cursor?: string) => {
      setLoadingItems(true);
      try {
        const url = `/api/profile/${slug}/items?tab=${activeTab}&limit=12${
          cursor ? `&cursor=${cursor}` : ""
        }`;
        const res = await fetch(url);
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
      } catch {
        // silently fail
      } finally {
        setLoadingItems(false);
      }
    },
    [slug, activeTab],
  );

  useEffect(() => {
    if (activeTab) {
      setItems([]);
      setNextCursor(null);
      fetchItems();
    }
  }, [activeTab, fetchItems]);

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          url,
          title: `Profil — ${user.firstName} ${user.lastName}`,
        });
      } catch {
        /* cancelled */
      }
    } else {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const isOwner = !!session?.user?.id && session.user.id === user.id;
  const tabs = ROLE_TABS[user.role] || ["liked"];
  const favBrands = safeJsonArray(user.favoriteBrands);
  const specs = safeJsonArray(user.specializations);
  const services = user.services ?? [];
  const languages = user.languageSkills ?? [];
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
    specs.length > 0 ||
    services.length > 0 ||
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
      {/* (1) Cover */}
      <div className="relative h-56 sm:h-72 md:h-96 bg-gradient-to-br from-orange-400 via-orange-500 to-orange-600">
        {user.coverPhoto && (
          <Image
            src={user.coverPhoto}
            alt="Cover"
            fill
            className="object-cover"
            priority
          />
        )}
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4 sm:space-y-6">
        {/* (2) Hero Card */}
        <section className="-mt-20 sm:-mt-24 relative z-10">
          <div className="bg-white rounded-2xl shadow-card p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
              {/* Avatar — straddles cover */}
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

                {/* Hashtag pills */}
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
                  {stats.totalSales > 0 && (
                    <Stat value={stats.totalSales} label="Prodeje" />
                  )}
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

        {/* (3) O makléři */}
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

        {/* (4) Specializace */}
        {hasSpecCard && (
          <Card className="p-6 sm:p-8">
            <h2 className="text-xl font-bold text-gray-900 mb-5">
              Specializace
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {services.length > 0 && (
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">
                    Služby
                  </h3>
                  <div className="flex flex-wrap gap-1.5">
                    {services.map((s) => (
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
              {specs.length > 0 && (
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">
                    Specializace
                  </h3>
                  <div className="flex flex-wrap gap-1.5">
                    {specs.map((s) => (
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
              {languages.length > 0 && (
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">
                    Jazyky
                  </h3>
                  <p className="text-sm text-gray-700">
                    {languages.join(", ")}
                  </p>
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

        {/* (5) Kontakt */}
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

        {/* (6) Tabs + Items */}
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
                    onClick={() => fetchItems(nextCursor)}
                    disabled={loadingItems}
                  >
                    {loadingItems ? "Načítám..." : "Načíst další"}
                  </Button>
                </div>
              )}
            </>
          )}
        </Card>

        {/* (7) Badges */}
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

function ProfileItemCard({
  item,
  type,
}: {
  item: ProfileItem;
  type: string;
}) {
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
    const photos = safeJsonArray(opp.photos);
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
    const photos = safeJsonArray(raw.photos);
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

  const image = item.images?.[0]?.url;
  const likeCount = item._count?.profileLikes ?? 0;
  const commentCount = item._count?.profileComments ?? 0;

  const label = item.name ? item.name : `${item.brand} ${item.model}`;

  const href =
    type === "part" ? `/dily/${item.slug}` : `/nabidka/${item.slug}`;

  const entityProps: {
    vehicleId?: string;
    listingId?: string;
    partId?: string;
  } =
    type === "vehicle"
      ? { vehicleId: item.id }
      : type === "listing"
        ? { listingId: item.id }
        : { partId: item.id };

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
              {type === "part" ? "\u2699" : "\u{1F697}"}
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
