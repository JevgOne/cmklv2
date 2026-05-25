"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { LikeButton } from "@/components/web/LikeButton";
import { VehicleCard, type VehicleData } from "@/components/web/VehicleCard";
import { fuelLabels, transmissionLabels } from "@/lib/vehicle-labels";
import { formatPrice, parseCities } from "@/lib/utils";
import { ROLE_TABS, TAB_LABELS } from "@/lib/role-labels";

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
  jobTitle?: string | null;
  level: string;
  totalSales: number;
  totalRevenue: number;
  regionTier?: string;
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
  brokerAvgRating: number;
  brokerReviewCount: number;
  brokerRecommendRate: number;
}

export interface ProfileStats {
  vehicles: number;
  listings: number;
  parts: number;
  totalLikes: number;
  totalSales: number;
}

export interface ReputationData {
  score: number;
  tier: string;
  avgResponseMinutes: number | null;
  responseRate: number | null;
  lastActiveAt: string | null;
  badges: { badge: string; context: string; unlockedAt: string }[];
  skillTags: { tag: string; count: number }[];
  context: string;
}

interface BrokerReviewData {
  id: string;
  authorName: string;
  authorCity: string | null;
  rating: number;
  recommend: boolean;
  text: string;
  transactionType: string | null;
  vehicleBrand: string | null;
  vehicleModel: string | null;
  isVerified: boolean;
  ratingCommunication: number | null;
  ratingSpeed: number | null;
  ratingFairness: number | null;
  ratingProfessionalism: number | null;
  createdAt: string;
}

interface BreakdownItem {
  stars: number;
  count: number;
  percentage: number;
}

interface DetailedRatings {
  communication: number | null;
  speed: number | null;
  fairness: number | null;
  professionalism: number | null;
}

export interface ProfileData {
  user: ProfileUser;
  stats: ProfileStats;
  roleStats: Record<string, number>;
  reputation: ReputationData | null;
  brokerReviews: BrokerReviewData[];
  ratingBreakdown: BreakdownItem[];
  detailedRatings: DetailedRatings;
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

interface ProfileTabsProps {
  slug: string;
  role: string;
}

export function ProfileTabs({ slug, role }: ProfileTabsProps) {
  const tabs = ROLE_TABS[role] || ["liked"];
  const [activeTab, setActiveTab] = useState<string>(tabs[0]);
  const [items, setItems] = useState<ProfileItem[]>([]);
  const [itemType, setItemType] = useState("");
  const [loadingItems, setLoadingItems] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const viewFiredRef = useRef(false);

  // Profile view tracking
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
        } else {
          console.error("Profile items API error:", res.status);
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

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-4 sm:mt-6 pb-16">
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
    </div>
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
    const entityProps: { vehicleId?: string; listingId?: string } =
      type === "vehicle" ? { vehicleId: item.id } : { listingId: item.id };

    return (
      <div className="group">
        <VehicleCard car={vehicleData} />
        <div className="flex items-center gap-3 mt-2 px-0.5">
          <LikeButton {...entityProps} initialCount={likeCount} size="sm" />
        </div>
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

  // Tail render: part type
  const image = item.images?.[0]?.url;
  const likeCount = item._count?.profileLikes ?? 0;
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
      </div>
    </div>
  );
}
