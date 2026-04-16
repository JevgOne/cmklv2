"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { LikeButton } from "@/components/web/LikeButton";
import { CommentSection } from "@/components/web/CommentSection";
import { BADGE_CATALOG } from "@/lib/badge-catalog";

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
  yearsExperience: number | null;
  website: string | null;
  motto: string | null;
  socialLinks: { instagram?: string; facebook?: string; youtube?: string } | null;
  services: string[] | null;
  languageSkills: string[] | null;
  specializations: string | null;
  warehouseAddress: string | null;
  openingHours: Record<string, string> | null;
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

function Stat({ value, label, valueClass }: { value: number | string; label: string; valueClass?: string }) {
  return (
    <div className="text-center">
      <div className={`text-xl font-bold ${valueClass ?? "text-gray-900"}`}>{value}</div>
      <div className="text-xs text-gray-500">{label}</div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function ProfilePage() {
  const params = useParams();
  const slug = params.slug as string;
  const { data: session } = useSession();

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

  const { user, stats, roleStats, badges } = profile;
  const isOwner = !!session?.user?.id && session.user.id === user.id;
  const tabs = ROLE_TABS[user.role] || ["liked"];
  const favBrands: string[] = user.favoriteBrands ? JSON.parse(user.favoriteBrands) : [];
  const specs: string[] = user.specializations ? (() => { try { return JSON.parse(user.specializations); } catch { return []; } })() : [];
  const memberSince = new Date(user.createdAt).toLocaleDateString("cs-CZ", { month: "long", year: "numeric" });
  const dayLabels: Record<string, string> = { po: "Po", ut: "Út", st: "St", ct: "Čt", pa: "Pá", so: "So", ne: "Ne" };

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

      {/* Profile Header — Instagram-style full-center layout */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <div className="relative -mt-16 sm:-mt-20 mb-6 flex flex-col items-center text-center">
          {/* Avatar — stand-alone, straddling cover */}
          <div className="relative w-28 h-28 sm:w-36 sm:h-36 rounded-full border-4 border-white bg-gray-200 overflow-hidden shadow-lg mb-4">
            {user.avatar ? (
              <Image src={user.avatar} alt={user.firstName} fill className="object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-4xl text-gray-400">
                {user.firstName[0]}{user.lastName[0]}
              </div>
            )}
          </div>

          {/* Name */}
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900">
            {user.firstName} {user.lastName}
          </h1>

          {/* Role + Level + City */}
          <div className="flex flex-wrap items-center justify-center gap-2 mt-2">
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

          {/* Bio */}
          {user.bio && (
            <p className="text-gray-600 max-w-xl mt-4">{user.bio}</p>
          )}

          {/* Favorite brands */}
          {favBrands.length > 0 && (
            <div className="flex flex-wrap justify-center gap-1.5 mt-3">
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

          {/* Motto */}
          {user.motto && (
            <p className="text-sm italic text-gray-500 mt-3">&ldquo;{user.motto}&rdquo;</p>
          )}

          {/* Specializations (G8) */}
          {specs.length > 0 && (
            <div className="flex flex-wrap justify-center gap-1.5 mt-3">
              {specs.map((s) => (
                <span key={s} className="text-xs font-medium bg-orange-50 text-orange-700 px-2.5 py-1 rounded-full">{s}</span>
              ))}
            </div>
          )}

          {/* Services */}
          {user.services && (user.services as string[]).length > 0 && (
            <div className="flex flex-wrap justify-center gap-1.5 mt-2">
              {(user.services as string[]).map((s) => (
                <span key={s} className="text-xs font-medium bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full">{s}</span>
              ))}
            </div>
          )}

          {/* Languages + Experience + Website */}
          <div className="flex flex-wrap items-center justify-center gap-3 mt-3 text-xs text-gray-500">
            {user.yearsExperience && <span>{user.yearsExperience} let zkušeností</span>}
            {user.languageSkills && (user.languageSkills as string[]).length > 0 && (
              <span>{(user.languageSkills as string[]).join(", ")}</span>
            )}
            {user.website && (
              <a href={user.website} target="_blank" rel="noopener noreferrer" className="text-orange-500 no-underline hover:text-orange-600">
                {user.website.replace(/^https?:\/\//, "")}
              </a>
            )}
          </div>

          {/* Social links */}
          {user.socialLinks && (
            <div className="flex justify-center gap-3 mt-2">
              {user.socialLinks.instagram && (
                <a href={user.socialLinks.instagram} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-pink-500 text-sm no-underline">Instagram</a>
              )}
              {user.socialLinks.facebook && (
                <a href={user.socialLinks.facebook} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-blue-600 text-sm no-underline">Facebook</a>
              )}
              {user.socialLinks.youtube && (
                <a href={user.socialLinks.youtube} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-red-500 text-sm no-underline">YouTube</a>
              )}
            </div>
          )}

          {/* Warehouse info (PARTS_SUPPLIER only) */}
          {user.warehouseAddress && (
            <div className="mt-4 p-3 bg-gray-50 rounded-lg text-sm max-w-md">
              <p className="font-medium text-gray-700">Sklad: {user.warehouseAddress}</p>
              {user.openingHours && (
                <div className="mt-1 text-xs text-gray-500 flex flex-wrap justify-center gap-x-3">
                  {Object.entries(user.openingHours).map(([day, hours]) => (
                    <span key={day}>{dayLabels[day] || day}: {hours}</span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Member since */}
          <p className="text-xs text-gray-400 mt-3">
            Člen od {memberSince} · {user.profileViews} zobrazení profilu
          </p>

          {/* Actions — owner-aware */}
          <div className="flex gap-2 mt-4 justify-center">
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

        {/* Stats Bar — flex justify-center s border-y divider */}
        <div className="flex flex-wrap justify-center gap-8 sm:gap-12 mb-6 py-4 border-y border-gray-200">
          {stats.vehicles > 0 && <Stat value={stats.vehicles} label="Vozidla" />}
          {stats.listings > 0 && <Stat value={stats.listings} label="Inzeráty" />}
          {stats.parts > 0 && <Stat value={stats.parts} label="Díly" />}
          <Stat value={stats.totalLikes} label="Lajky" />
          {stats.totalSales > 0 && <Stat value={stats.totalSales} label="Prodeje" />}
          {roleStats.completedFlips !== undefined && <Stat value={roleStats.completedFlips} label="Flipy" />}
          {roleStats.avgROI !== undefined && <Stat value={`${roleStats.avgROI}%`} label="Průměrné ROI" valueClass="text-green-600" />}
          {roleStats.totalInvested !== undefined && <Stat value={formatPrice(roleStats.totalInvested)} label="Investováno" />}
          {roleStats.completedDeals !== undefined && <Stat value={roleStats.completedDeals} label="Dokončené dealy" />}
          {roleStats.totalReturn !== undefined && roleStats.totalReturn > 0 && <Stat value={formatPrice(roleStats.totalReturn)} label="Výnos" valueClass="text-green-600" />}
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6 overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
          <div className="flex justify-center gap-0">
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
          <section className="mb-10 text-center">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Odznaky</h2>
            <div className="flex flex-wrap justify-center gap-3">
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
  if (type === "investment") {
    const raw = item as unknown as { opportunity: { brand: string; model: string; year: number; status: string; photos: string | null; estimatedSalePrice: number } | null; amount: number };
    const opp = raw.opportunity;
    if (!opp) return null;
    const photos: string[] = opp.photos ? (() => { try { return JSON.parse(opp.photos); } catch { return []; } })() : [];
    const label = `${opp.brand} ${opp.model} (${opp.year})`;
    const amount = raw.amount;
    return (
      <div>
        <div className="relative aspect-square bg-gray-100 rounded-xl overflow-hidden">
          {photos[0] ? (
            <Image src={photos[0]} alt={label} fill className="object-cover" sizes="(max-width: 640px) 50vw, 25vw" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-3xl text-gray-300">&#128176;</div>
          )}
          <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/60 to-transparent p-2.5">
            <p className="text-white text-xs font-semibold truncate">{label}</p>
            <p className="text-orange-300 text-xs font-bold">{formatPrice(amount)}</p>
          </div>
          <div className="absolute top-2 right-2">
            <span className="text-[10px] font-bold bg-white/90 text-gray-700 px-2 py-0.5 rounded-full">{opp.status}</span>
          </div>
        </div>
      </div>
    );
  }

  if (type === "flip") {
    const raw = item as unknown as { photos: string | null; brand: string; model: string; price: number | null; status: string };
    const photos: string[] = raw.photos ? (() => { try { return JSON.parse(raw.photos); } catch { return []; } })() : [];
    const label = `${raw.brand} ${raw.model}`;
    const status = raw.status;
    return (
      <div>
        <div className="relative aspect-square bg-gray-100 rounded-xl overflow-hidden">
          {photos[0] ? (
            <Image src={photos[0]} alt={label} fill className="object-cover" sizes="(max-width: 640px) 50vw, 25vw" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-3xl text-gray-300">&#128663;</div>
          )}
          <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/60 to-transparent p-2.5">
            <p className="text-white text-xs font-semibold truncate">{label}</p>
            {item.price && <p className="text-orange-300 text-xs font-bold">{formatPrice(item.price)}</p>}
          </div>
          <div className="absolute top-2 right-2">
            <span className="text-[10px] font-bold bg-white/90 text-gray-700 px-2 py-0.5 rounded-full">{status}</span>
          </div>
        </div>
      </div>
    );
  }

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

  const commentProps = type === "vehicle"
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
      <CommentSection {...commentProps} initialCount={commentCount} />
    </div>
  );
}
