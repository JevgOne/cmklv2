"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { LikeButton } from "@/components/web/LikeButton";
import { BADGE_CATALOG } from "@/lib/badges";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface ProfileUser {
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
}

interface ProfileStats {
  vehicles: number;
  listings: number;
  parts: number;
  totalLikes: number;
  totalSales: number;
}

interface ProfileBadge {
  badgeKey: string;
  awardedAt: string;
}

interface ProfileData {
  user: ProfileUser;
  stats: ProfileStats;
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
  // liked items
  vehicle?: { id: string; slug: string; brand: string; model: string; year: number; price: number; images: { url: string }[] } | null;
  listing?: { id: string; slug: string; brand: string; model: string; year: number; price: number; images: { url: string }[] } | null;
  part?: { id: string; slug: string; name: string; price: number; images: { url: string }[] } | null;
}

/* ------------------------------------------------------------------ */
/*  Role/tab config                                                    */
/* ------------------------------------------------------------------ */

const ROLE_TABS: Record<string, string[]> = {
  BROKER: ["vehicles", "liked"],
  ADVERTISER: ["listings", "liked"],
  PARTS_SUPPLIER: ["parts", "liked"],
  WHOLESALE_SUPPLIER: ["parts", "liked"],
  PARTNER_VRAKOVISTE: ["parts", "liked"],
  BUYER: ["liked"],
  ADMIN: ["vehicles", "listings", "parts", "liked"],
  BACKOFFICE: ["vehicles", "listings", "parts", "liked"],
  INVESTOR: ["liked"],
  VERIFIED_DEALER: ["vehicles", "liked"],
  PARTNER_BAZAR: ["listings", "liked"],
};

const TAB_LABELS: Record<string, string> = {
  vehicles: "Vozidla",
  listings: "Inzeráty",
  parts: "Díly",
  liked: "Oblíbené",
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
  INVESTOR: "Investor",
  VERIFIED_DEALER: "Ověřený dealer",
  PARTNER_BAZAR: "Autobazar",
};

function formatPrice(amount: number): string {
  return new Intl.NumberFormat("cs-CZ", {
    style: "currency",
    currency: "CZK",
    maximumFractionDigits: 0,
  }).format(amount);
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function ProfilePage() {
  const params = useParams();
  const slug = params.slug as string;

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("");
  const [items, setItems] = useState<ProfileItem[]>([]);
  const [itemType, setItemType] = useState("");
  const [loadingItems, setLoadingItems] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Fetch profile
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch(`/api/profile/${slug}`);
        if (res.ok) {
          const data = await res.json();
          setProfile(data);
          const tabs = ROLE_TABS[data.user.role] || ["liked"];
          setActiveTab(tabs[0]);
        }
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [slug]);

  // Fetch items for active tab
  const fetchItems = useCallback(async (cursor?: string) => {
    if (!profile) return;
    setLoadingItems(true);
    try {
      const url = `/api/profile/${slug}/items?tab=${activeTab}&limit=12${cursor ? `&cursor=${cursor}` : ""}`;
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
  }, [profile, slug, activeTab]);

  useEffect(() => {
    if (activeTab && profile) {
      setItems([]);
      setNextCursor(null);
      fetchItems();
    }
  }, [activeTab, profile, fetchItems]);

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ url, title: `Profil — ${profile?.user.firstName} ${profile?.user.lastName}` });
      } catch { /* cancelled */ }
    } else {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Profil nenalezen</h1>
          <p className="text-gray-500">Tento profil neexistuje nebo není aktivní.</p>
        </div>
      </div>
    );
  }

  const { user, stats, badges } = profile;
  const tabs = ROLE_TABS[user.role] || ["liked"];
  const favBrands: string[] = user.favoriteBrands ? JSON.parse(user.favoriteBrands) : [];
  const memberSince = new Date(user.createdAt).toLocaleDateString("cs-CZ", { month: "long", year: "numeric" });

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Cover Photo */}
      <div className="relative h-48 sm:h-64 md:h-80 bg-gradient-to-br from-orange-400 via-orange-500 to-orange-600">
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

      {/* Profile Header */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <div className="relative -mt-16 sm:-mt-20 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-end gap-4">
            {/* Avatar */}
            <div className="relative w-28 h-28 sm:w-36 sm:h-36 rounded-full border-4 border-white bg-gray-200 overflow-hidden flex-shrink-0 shadow-lg">
              {user.avatar ? (
                <Image src={user.avatar} alt={user.firstName} fill className="object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-4xl text-gray-400">
                  {user.firstName[0]}{user.lastName[0]}
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0 pb-2">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900">
                {user.firstName} {user.lastName}
              </h1>
              <div className="flex flex-wrap items-center gap-2 mt-1">
                <Badge variant="default">
                  {ROLE_LABELS[user.role] || user.role}
                </Badge>
                {user.level !== "JUNIOR" && (
                  <Badge variant="verified">
                    {LEVEL_LABELS[user.level] || user.level}
                  </Badge>
                )}
                {user.city && (
                  <span className="text-sm text-gray-500">{user.city}</span>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 sm:pb-2">
              {user.phone && (
                <a
                  href={`tel:${user.phone}`}
                  className="inline-flex items-center gap-1.5 py-2 px-4 bg-orange-500 text-white font-semibold rounded-full text-sm no-underline hover:bg-orange-600 transition-colors"
                >
                  Kontaktovat
                </a>
              )}
              <button
                onClick={handleShare}
                className="inline-flex items-center gap-1.5 py-2 px-4 bg-white border border-gray-200 text-gray-700 font-semibold rounded-full text-sm cursor-pointer hover:border-orange-300 transition-colors"
              >
                {copied ? "Zkopírováno!" : "Sdílet profil"}
              </button>
            </div>
          </div>

          {/* Bio + favorite brands */}
          {(user.bio || favBrands.length > 0) && (
            <div className="mt-4">
              {user.bio && (
                <p className="text-gray-600 max-w-2xl">{user.bio}</p>
              )}
              {favBrands.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {favBrands.map((brand) => (
                    <span
                      key={brand}
                      className="text-xs font-medium bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full"
                    >
                      {brand}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          <p className="text-xs text-gray-400 mt-2">
            Člen od {memberSince} · {user.profileViews} zobrazení profilu
          </p>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-4 mb-6">
          {stats.vehicles > 0 && (
            <div className="text-center">
              <div className="text-xl font-bold text-gray-900">{stats.vehicles}</div>
              <div className="text-xs text-gray-500">Vozidla</div>
            </div>
          )}
          {stats.listings > 0 && (
            <div className="text-center">
              <div className="text-xl font-bold text-gray-900">{stats.listings}</div>
              <div className="text-xs text-gray-500">Inzeráty</div>
            </div>
          )}
          {stats.parts > 0 && (
            <div className="text-center">
              <div className="text-xl font-bold text-gray-900">{stats.parts}</div>
              <div className="text-xs text-gray-500">Díly</div>
            </div>
          )}
          <div className="text-center">
            <div className="text-xl font-bold text-gray-900">{stats.totalLikes}</div>
            <div className="text-xs text-gray-500">Lajky</div>
          </div>
          {stats.totalSales > 0 && (
            <div className="text-center">
              <div className="text-xl font-bold text-gray-900">{stats.totalSales}</div>
              <div className="text-xs text-gray-500">Prodeje</div>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6 overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
          <div className="flex gap-0">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-3 text-sm font-semibold border-b-2 transition-colors cursor-pointer bg-transparent whitespace-nowrap ${
                  activeTab === tab
                    ? "border-orange-500 text-orange-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                {TAB_LABELS[tab]}
              </button>
            ))}
          </div>
        </div>

        {/* Item Grid */}
        {loadingItems && items.length === 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="aspect-square bg-gray-200 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <Card className="p-8 text-center mb-8">
            <p className="text-gray-500">Žádné položky v této kategorii.</p>
          </Card>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mb-6">
              {items.map((item) => (
                <ProfileItemCard key={item.id} item={item} type={itemType} />
              ))}
            </div>

            {nextCursor && (
              <div className="text-center mb-8">
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

        {/* Badges */}
        {badges.length > 0 && (
          <section className="mb-10">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Odznaky</h2>
            <div className="flex flex-wrap gap-3">
              {badges.map((badge) => {
                const info = BADGE_CATALOG[badge.badgeKey];
                if (!info) return null;
                return (
                  <div
                    key={badge.badgeKey}
                    className="flex items-center gap-2 bg-white border border-gray-100 rounded-full px-4 py-2 shadow-sm"
                    title={info.description}
                  >
                    <span className="text-lg">{info.icon}</span>
                    <span className="text-sm font-medium text-gray-700">{info.name}</span>
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}

/* ------------------------------------------------------------------ */
/*  ProfileItemCard — single grid cell                                 */
/* ------------------------------------------------------------------ */

function ProfileItemCard({ item, type }: { item: ProfileItem; type: string }) {
  if (type === "liked") {
    // Liked item — unwrap polymorphic target
    const target = item.vehicle || item.listing || item.part;
    if (!target) return null;

    const image = target.images?.[0]?.url;
    const label = "name" in target
      ? target.name
      : `${(target as { brand: string }).brand} ${(target as { model: string }).model}`;
    const href = "name" in target
      ? `/dily/${target.slug}`
      : item.vehicle
        ? `/nabidka/${target.slug}`
        : `/nabidka/${target.slug}`;

    return (
      <Link href={href} className="no-underline group">
        <div className="relative aspect-square bg-gray-100 rounded-xl overflow-hidden">
          {image ? (
            <Image src={image} alt={label} fill className="object-cover group-hover:scale-105 transition-transform" sizes="(max-width: 640px) 50vw, 25vw" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-3xl text-gray-300">&#128663;</div>
          )}
          <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/60 to-transparent p-2.5">
            <p className="text-white text-xs font-semibold truncate">{label}</p>
            {"price" in target && target.price && (
              <p className="text-orange-300 text-xs font-bold">{formatPrice(target.price as number)}</p>
            )}
          </div>
        </div>
      </Link>
    );
  }

  // Regular items (vehicle, listing, part)
  const image = item.images?.[0]?.url;
  const likeCount = item._count?.profileLikes ?? 0;
  const commentCount = item._count?.profileComments ?? 0;

  const label = item.name
    ? item.name
    : `${item.brand} ${item.model}`;

  const href = type === "part"
    ? `/dily/${item.slug}`
    : `/nabidka/${item.slug}`;

  const likeProps = type === "vehicle"
    ? { vehicleId: item.id }
    : type === "listing"
      ? { listingId: item.id }
      : { partId: item.id };

  return (
    <div className="group">
      <Link href={href} className="no-underline">
        <div className="relative aspect-square bg-gray-100 rounded-xl overflow-hidden">
          {image ? (
            <Image src={image} alt={label} fill className="object-cover group-hover:scale-105 transition-transform" sizes="(max-width: 640px) 50vw, 25vw" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-3xl text-gray-300">
              {type === "part" ? "&#9881;" : "&#128663;"}
            </div>
          )}
          <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/60 to-transparent p-2.5">
            <p className="text-white text-xs font-semibold truncate">{label}</p>
            {item.price && (
              <p className="text-orange-300 text-xs font-bold">{formatPrice(item.price)}</p>
            )}
          </div>
        </div>
      </Link>
      <div className="flex items-center gap-3 mt-1.5 px-0.5">
        <LikeButton {...likeProps} initialCount={likeCount} size="sm" />
        {commentCount > 0 && (
          <span className="text-xs text-gray-400">&#128172; {commentCount}</span>
        )}
      </div>
    </div>
  );
}
