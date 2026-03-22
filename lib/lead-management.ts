import { prisma } from "./prisma";

/**
 * Auto-přiřazení regionu podle města.
 * Projde všechny regiony a hledá shodu města v JSON array cities.
 */
export async function assignRegionByCity(city: string): Promise<string | null> {
  if (!city) return null;

  const regions = await prisma.region.findMany();
  const normalizedCity = city.toLowerCase().trim();

  for (const region of regions) {
    if (!region.cities) continue;
    try {
      const cities: string[] = JSON.parse(region.cities);
      const match = cities.some(
        (c) => c.toLowerCase().trim() === normalizedCity
      );
      if (match) return region.id;
    } catch {
      continue;
    }
  }

  // Fuzzy: pokud město obsahuje název regionu nebo naopak
  for (const region of regions) {
    const regionName = region.name.toLowerCase().trim();
    if (
      normalizedCity.includes(regionName) ||
      regionName.includes(normalizedCity)
    ) {
      return region.id;
    }
  }

  return null;
}

/**
 * Round-robin přiřazení makléře v daném regionu.
 * Vybere aktivního brokera s nejmenším počtem přiřazených leadů (NEW/ASSIGNED/CONTACTED/MEETING_SCHEDULED).
 */
export async function roundRobinAssignBroker(
  regionId: string
): Promise<string | null> {
  const brokers = await prisma.user.findMany({
    where: {
      role: "BROKER",
      status: "ACTIVE",
      regionId,
    },
    select: {
      id: true,
      _count: {
        select: {
          assignedLeads: {
            where: {
              status: {
                in: ["NEW", "ASSIGNED", "CONTACTED", "MEETING_SCHEDULED"],
              },
            },
          },
        },
      },
    },
    orderBy: {
      assignedLeads: { _count: "asc" },
    },
    take: 1,
  });

  return brokers.length > 0 ? brokers[0].id : null;
}

/**
 * Expirace leadů — leady starší 14 dní ve stavech NEW nebo ASSIGNED bez aktivity.
 * Returns count of expired leads.
 */
export async function expireStaleLeads(): Promise<number> {
  const fourteenDaysAgo = new Date();
  fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

  const result = await prisma.lead.updateMany({
    where: {
      status: { in: ["NEW", "ASSIGNED"] },
      updatedAt: { lt: fourteenDaysAgo },
    },
    data: {
      status: "EXPIRED",
    },
  });

  return result.count;
}

/**
 * Kontrola duplicity leadu — stejný telefon + značka + model za posledních 30 dní.
 */
export async function checkDuplicateLead(
  phone: string,
  brand?: string | null,
  model?: string | null
): Promise<boolean> {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const where: Record<string, unknown> = {
    phone,
    createdAt: { gte: thirtyDaysAgo },
  };

  if (brand) where.brand = brand;
  if (model) where.model = model;

  const existing = await prisma.lead.findFirst({ where });
  return !!existing;
}
