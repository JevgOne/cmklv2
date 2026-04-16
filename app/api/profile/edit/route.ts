import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateProfileSlug } from "@/lib/profile-slug";
import { z } from "zod";

const editProfileSchema = z.object({
  firstName: z.string().min(1).max(50).optional(),
  lastName: z.string().min(1).max(50).optional(),
  bio: z.string().max(500).optional().nullable(),
  avatar: z.string().url().optional().nullable(),
  coverPhoto: z.string().url().optional().nullable(),
  city: z.string().max(100).optional().nullable(),
  favoriteBrands: z.array(z.string()).max(10).optional(),
  showPhone: z.boolean().optional(),
  showEmail: z.boolean().optional(),
  yearsExperience: z.number().int().min(0).max(60).optional().nullable(),
  website: z.string().max(200).optional().nullable(),
  motto: z.string().max(200).optional().nullable(),
  socialLinks: z.object({
    instagram: z.string().max(200).optional(),
    facebook: z.string().max(200).optional(),
    youtube: z.string().max(200).optional(),
  }).optional().nullable(),
  services: z.array(z.string().max(50)).max(10).optional(),
  languageSkills: z.array(z.string().max(30)).max(10).optional(),
  specializations: z.array(z.string().max(50)).max(10).optional(),
  warehouseAddress: z.string().max(300).optional().nullable(),
  openingHours: z.record(z.string(), z.string().max(20)).optional().nullable(),
});

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Nepřihlášen" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        bio: true,
        avatar: true,
        coverPhoto: true,
        city: true,
        slug: true,
        favoriteBrands: true,
        showPhone: true,
        showEmail: true,
        phone: true,
        email: true,
        role: true,
        yearsExperience: true,
        website: true,
        motto: true,
        socialLinks: true,
        services: true,
        languageSkills: true,
        specializations: true,
        warehouseAddress: true,
        openingHours: true,
      },
    });

    return NextResponse.json({ user });
  } catch (error) {
    console.error("GET /api/profile/edit error:", error);
    return NextResponse.json({ error: "Interní chyba serveru" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Nepřihlášen" }, { status: 401 });
    }

    const body = await request.json();
    const data = editProfileSchema.parse(body);

    // Auto-generate slug if missing
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { slug: true, firstName: true, lastName: true },
    });

    let slug = currentUser?.slug;
    if (!slug) {
      const firstName = data.firstName ?? currentUser?.firstName ?? "user";
      const lastName = data.lastName ?? currentUser?.lastName ?? "";
      slug = await generateProfileSlug(firstName, lastName);
    }

    const updateData: Record<string, unknown> = { slug };

    if (data.firstName !== undefined) updateData.firstName = data.firstName;
    if (data.lastName !== undefined) updateData.lastName = data.lastName;
    if (data.bio !== undefined) updateData.bio = data.bio;
    if (data.avatar !== undefined) updateData.avatar = data.avatar;
    if (data.coverPhoto !== undefined) updateData.coverPhoto = data.coverPhoto;
    if (data.city !== undefined) updateData.city = data.city;
    if (data.favoriteBrands !== undefined) {
      updateData.favoriteBrands = JSON.stringify(data.favoriteBrands);
    }
    if (data.showPhone !== undefined) updateData.showPhone = data.showPhone;
    if (data.showEmail !== undefined) updateData.showEmail = data.showEmail;
    if (data.yearsExperience !== undefined) updateData.yearsExperience = data.yearsExperience;
    if (data.website !== undefined) updateData.website = data.website;
    if (data.motto !== undefined) updateData.motto = data.motto;
    if (data.socialLinks !== undefined) updateData.socialLinks = data.socialLinks;
    if (data.services !== undefined) updateData.services = data.services;
    if (data.languageSkills !== undefined) updateData.languageSkills = data.languageSkills;
    if (data.specializations !== undefined) {
      updateData.specializations = JSON.stringify(data.specializations);
    }
    if (data.warehouseAddress !== undefined) updateData.warehouseAddress = data.warehouseAddress;
    if (data.openingHours !== undefined) updateData.openingHours = data.openingHours;

    const updated = await prisma.user.update({
      where: { id: session.user.id },
      data: updateData,
      select: {
        firstName: true,
        lastName: true,
        bio: true,
        avatar: true,
        coverPhoto: true,
        city: true,
        slug: true,
        favoriteBrands: true,
        showPhone: true,
        showEmail: true,
        role: true,
        yearsExperience: true,
        website: true,
        motto: true,
        socialLinks: true,
        services: true,
        languageSkills: true,
        specializations: true,
        warehouseAddress: true,
        openingHours: true,
      },
    });

    return NextResponse.json({ user: updated });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Neplatná data", details: error.issues }, { status: 400 });
    }
    console.error("PUT /api/profile/edit error:", error);
    return NextResponse.json({ error: "Interní chyba serveru" }, { status: 500 });
  }
}
