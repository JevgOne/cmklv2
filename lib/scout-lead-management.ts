import { prisma } from "./prisma";
import { assignRegionByCity } from "./lead-management";
import type { ScoutLeadPayload } from "./validators/scout-lead";

/**
 * Normalize phone number for comparison (strip spaces, dashes, leading 00).
 */
function normalizePhone(phone: string): string {
  return phone.replace(/[\s\-()]/g, "").replace(/^00/, "+");
}

/**
 * Extract domain from URL for comparison.
 */
function extractDomain(url: string): string | null {
  try {
    const parsed = new URL(
      url.startsWith("http") ? url : `https://${url}`
    );
    return parsed.hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return null;
  }
}

/**
 * Check for duplicate scout lead.
 * Returns existing lead ID if duplicate found, null otherwise.
 *
 * Dedup strategy (in order):
 * 1. source + sourceId exact match
 * 2. Phone match within same category (90 days)
 * 3. Website domain match within same category
 * 4. ICO match (business leads)
 */
export async function checkScoutLeadDuplicate(
  payload: ScoutLeadPayload
): Promise<string | null> {
  // 1. Exact source match
  if (payload.sourceId) {
    const bySource = await prisma.scoutLead.findUnique({
      where: {
        source_sourceId: {
          source: payload.source,
          sourceId: payload.sourceId,
        },
      },
      select: { id: true },
    });
    if (bySource) return bySource.id;
  }

  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

  // 2. Phone match within category
  if (payload.phone) {
    const normalized = normalizePhone(payload.phone);
    const byPhone = await prisma.scoutLead.findFirst({
      where: {
        category: payload.category,
        phone: { not: null },
        createdAt: { gte: ninetyDaysAgo },
      },
      select: { id: true, phone: true },
    });
    if (
      byPhone?.phone &&
      normalizePhone(byPhone.phone) === normalized
    ) {
      return byPhone.id;
    }
    // Also do a direct query for exact match
    const byPhoneExact = await prisma.scoutLead.findFirst({
      where: {
        category: payload.category,
        phone: payload.phone,
        createdAt: { gte: ninetyDaysAgo },
      },
      select: { id: true },
    });
    if (byPhoneExact) return byPhoneExact.id;
  }

  // 3. Website domain match within category
  if (payload.web) {
    const domain = extractDomain(payload.web);
    if (domain) {
      const withWeb = await prisma.scoutLead.findMany({
        where: {
          category: payload.category,
          web: { not: null },
          createdAt: { gte: ninetyDaysAgo },
        },
        select: { id: true, web: true },
        take: 100,
      });
      for (const lead of withWeb) {
        if (lead.web && extractDomain(lead.web) === domain) {
          return lead.id;
        }
      }
    }
  }

  // 4. ICO match (business leads)
  if (
    payload.ico &&
    (payload.category === "AUTOBAZAR" || payload.category === "VRAKOVISTE")
  ) {
    const byIco = await prisma.scoutLead.findFirst({
      where: {
        category: payload.category,
        ico: payload.ico,
      },
      select: { id: true },
    });
    if (byIco) return byIco.id;
  }

  return null;
}

/**
 * Ingest a batch of scout leads from the Python service.
 * Returns counts and per-lead details.
 */
export async function ingestScoutLeads(leads: ScoutLeadPayload[]) {
  const results: Array<{
    sourceId: string | null;
    status: "created" | "duplicate" | "error";
    id?: string;
    existingId?: string;
    message?: string;
  }> = [];

  let accepted = 0;
  let duplicates = 0;
  let errors = 0;

  for (const payload of leads) {
    try {
      const existingId = await checkScoutLeadDuplicate(payload);
      if (existingId) {
        duplicates++;
        results.push({
          sourceId: payload.sourceId ?? null,
          status: "duplicate",
          existingId,
        });
        continue;
      }

      // Auto-assign region by city
      const regionId = payload.city
        ? await assignRegionByCity(payload.city)
        : null;

      const lead = await prisma.scoutLead.create({
        data: {
          category: payload.category,
          country: payload.country ?? "CZ",
          source: payload.source,
          sourceId: payload.sourceId ?? null,
          sourceUrl: payload.sourceUrl ?? null,
          name: payload.name,
          phone: payload.phone ?? null,
          email: payload.email ?? null,
          web: payload.web ?? null,
          contactPerson: payload.contactPerson ?? null,
          address: payload.address ?? null,
          city: payload.city ?? null,
          region: payload.region ?? null,
          zip: payload.zip ?? null,
          latitude: payload.latitude ?? null,
          longitude: payload.longitude ?? null,
          ico: payload.ico ?? null,
          estimatedSize: payload.estimatedSize ?? null,
          googleRating: payload.googleRating ?? null,
          googleReviewCount: payload.googleReviewCount ?? null,
          estimatedInventory: payload.estimatedInventory ?? null,
          inventoryTrend: payload.inventoryTrend ?? null,
          vehicleBrand: payload.vehicleBrand ?? null,
          vehicleModel: payload.vehicleModel ?? null,
          vehicleYear: payload.vehicleYear ?? null,
          vehiclePrice: payload.vehiclePrice ?? null,
          vehicleMileage: payload.vehicleMileage ?? null,
          listingTitle: payload.listingTitle ?? null,
          rawPayload: payload.rawPayload ?? undefined,
          score: payload.score ?? 0,
          regionId,
        },
      });

      accepted++;
      results.push({
        sourceId: payload.sourceId ?? null,
        status: "created",
        id: lead.id,
      });
    } catch (error) {
      errors++;
      results.push({
        sourceId: payload.sourceId ?? null,
        status: "error",
        message:
          error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  return { accepted, duplicates, errors, details: results };
}

/**
 * Map scout source to Partner.source field value.
 */
function mapScoutSourceToPartnerSource(source: string): string {
  const mapping: Record<string, string> = {
    GOOGLE_PLACES: "GOOGLE",
    FIRMY_CZ: "FIRMY_CZ",
    SAUTO: "SAUTO",
    TIPCARS: "TIPCARS",
    BAZOS: "BAZOS",
    ARES: "MANUAL",
    ZLATESTRANKY: "MANUAL",
    HANDELSREGISTER: "MANUAL",
    MANUAL: "MANUAL",
  };
  return mapping[source] ?? "MANUAL";
}

/**
 * Generate URL-safe slug from name.
 */
function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .substring(0, 80);
}

/**
 * Convert AUTOBAZAR/VRAKOVISTE scout lead to Partner.
 */
export async function convertToPartner(scoutLeadId: string) {
  const scoutLead = await prisma.scoutLead.findUnique({
    where: { id: scoutLeadId },
  });
  if (!scoutLead) throw new Error("ScoutLead not found");
  if (
    scoutLead.category !== "AUTOBAZAR" &&
    scoutLead.category !== "VRAKOVISTE"
  ) {
    throw new Error(
      "Only AUTOBAZAR/VRAKOVISTE can be converted to Partner"
    );
  }
  if (scoutLead.convertedToPartnerId) {
    throw new Error("Already converted to Partner");
  }

  // Ensure unique slug
  let baseSlug = slugify(scoutLead.name);
  let slug = baseSlug;
  let counter = 1;
  while (await prisma.partner.findUnique({ where: { slug } })) {
    slug = `${baseSlug}-${counter}`;
    counter++;
  }

  const partner = await prisma.partner.create({
    data: {
      name: scoutLead.name,
      type: scoutLead.category,
      ico: scoutLead.ico,
      address: scoutLead.address,
      city: scoutLead.city,
      region: scoutLead.region,
      zip: scoutLead.zip,
      latitude: scoutLead.latitude,
      longitude: scoutLead.longitude,
      phone: scoutLead.phone,
      email: scoutLead.email,
      web: scoutLead.web,
      contactPerson: scoutLead.contactPerson,
      estimatedSize: scoutLead.estimatedSize,
      googleRating: scoutLead.googleRating,
      googleReviewCount: scoutLead.googleReviewCount,
      source: mapScoutSourceToPartnerSource(scoutLead.source),
      slug,
      status: "PRIRAZENY",
      managerId: scoutLead.assignedToId,
      score: scoutLead.score,
    },
  });

  await prisma.scoutLead.update({
    where: { id: scoutLeadId },
    data: {
      status: "WON",
      convertedToPartnerId: partner.id,
    },
  });

  return partner;
}

/**
 * Convert SOUKROMNIK scout lead to Lead (broker pipeline).
 */
export async function convertToLead(scoutLeadId: string) {
  const scoutLead = await prisma.scoutLead.findUnique({
    where: { id: scoutLeadId },
  });
  if (!scoutLead) throw new Error("ScoutLead not found");
  if (scoutLead.category !== "SOUKROMNIK") {
    throw new Error("Only SOUKROMNIK can be converted to Lead");
  }
  if (scoutLead.convertedToLeadId) {
    throw new Error("Already converted to Lead");
  }

  const regionId =
    scoutLead.regionId ??
    (scoutLead.city
      ? await assignRegionByCity(scoutLead.city)
      : null);

  const lead = await prisma.lead.create({
    data: {
      name: scoutLead.name,
      phone: scoutLead.phone ?? "",
      email: scoutLead.email,
      brand: scoutLead.vehicleBrand,
      model: scoutLead.vehicleModel,
      year: scoutLead.vehicleYear,
      expectedPrice: scoutLead.vehiclePrice,
      city: scoutLead.city,
      regionId,
      source: "EXTERNAL_APP",
      sourceDetail: `Lead Scout: ${scoutLead.source}`,
      externalId: scoutLead.id,
      status: "NEW",
    },
  });

  await prisma.scoutLead.update({
    where: { id: scoutLeadId },
    data: {
      status: "WON",
      convertedToLeadId: lead.id,
    },
  });

  return lead;
}

/**
 * Daily distribution of SOUKROMNIK scout leads to brokers.
 * Round-robin: assign to broker with fewest active scout leads in region.
 */
export async function distributeScoutLeadsToBrokers(
  dailyLimitPerBroker: number = 5
) {
  // Get unassigned SOUKROMNIK leads, ordered by score DESC
  const unassigned = await prisma.scoutLead.findMany({
    where: {
      category: "SOUKROMNIK",
      status: "NEW",
      assignedToId: null,
    },
    orderBy: { score: "desc" },
  });

  if (unassigned.length === 0) return { distributed: 0, brokers: 0 };

  // Group by regionId
  const byRegion = new Map<string | null, typeof unassigned>();
  for (const lead of unassigned) {
    const key = lead.regionId;
    if (!byRegion.has(key)) byRegion.set(key, []);
    byRegion.get(key)!.push(lead);
  }

  let totalDistributed = 0;
  const brokerSet = new Set<string>();

  for (const [regionId, leads] of byRegion) {
    // Get active brokers in this region
    const whereClause: Record<string, unknown> = {
      role: "BROKER",
      status: "ACTIVE",
    };
    if (regionId) {
      whereClause.regionId = regionId;
    }

    const brokers = await prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        _count: {
          select: {
            assignedScoutLeads: {
              where: {
                status: { in: ["NEW", "CONTACTED", "QUALIFIED"] },
              },
            },
          },
        },
      },
      orderBy: {
        assignedScoutLeads: { _count: "asc" },
      },
    });

    if (brokers.length === 0) continue;

    // Track how many assigned to each broker this run
    const assignedCount = new Map<string, number>();
    for (const b of brokers) assignedCount.set(b.id, 0);

    let brokerIdx = 0;
    for (const lead of leads) {
      // Find next broker under daily limit
      let found = false;
      for (let i = 0; i < brokers.length; i++) {
        const idx = (brokerIdx + i) % brokers.length;
        const broker = brokers[idx];
        if ((assignedCount.get(broker.id) ?? 0) < dailyLimitPerBroker) {
          await prisma.scoutLead.update({
            where: { id: lead.id },
            data: {
              assignedToId: broker.id,
              assignedAt: new Date(),
            },
          });
          assignedCount.set(
            broker.id,
            (assignedCount.get(broker.id) ?? 0) + 1
          );
          brokerSet.add(broker.id);
          totalDistributed++;
          brokerIdx = (idx + 1) % brokers.length;
          found = true;
          break;
        }
      }
      if (!found) break; // All brokers at limit
    }
  }

  return { distributed: totalDistributed, brokers: brokerSet.size };
}

/**
 * Expire unassigned SOUKROMNIK scout leads older than 7 days.
 */
export async function expireStaleScoutLeads(): Promise<number> {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const result = await prisma.scoutLead.updateMany({
    where: {
      category: "SOUKROMNIK",
      status: "NEW",
      assignedToId: null,
      createdAt: { lt: sevenDaysAgo },
    },
    data: {
      status: "LOST",
    },
  });

  return result.count;
}
