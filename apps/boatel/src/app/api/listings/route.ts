import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ListingStatus, Role } from "@prisma/client";

const createSchema = z.object({
  title: z.string().min(3).max(120),
  tagline: z.string().max(160).optional().default(""),
  description: z.string().min(20).max(4000),
  location: z.string().min(2).max(200),
  city: z.string().min(2).max(80),
  country: z.string().min(2).max(80).default("United Kingdom"),
  category: z.string().min(2).max(80).default("Boatel"),
  mode: z.enum(["stay", "sail", "explore"]).default("stay"),
  pricePerNight: z.number().positive().max(100000),
  capacity: z.number().int().min(1).max(50),
  bedrooms: z.number().int().min(1).max(50).default(1),
  bathrooms: z.number().int().min(1).max(50).default(1),
  captainIncluded: z.boolean().optional().default(false),
  breakfastIncluded: z.boolean().optional().default(false),
  amenities: z.array(z.string()).default([]),
  photos: z.array(z.string().url()).min(1).max(12),
});

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim();
  const sort = searchParams.get("sort");

  const listings = await prisma.listing.findMany({
    where: {
      status: ListingStatus.PUBLISHED,
      ...(q
        ? {
            OR: [
              { city: { contains: q } },
              { location: { contains: q } },
              { title: { contains: q } },
              { country: { contains: q } },
            ],
          }
        : {}),
    },
    include: {
      host: { select: { id: true, name: true, email: true } },
    },
    orderBy:
      sort === "cheapest"
        ? { pricePerNight: "asc" }
        : sort === "expensive"
          ? { pricePerNight: "desc" }
          : [{ featured: "desc" }, { createdAt: "desc" }],
  });

  return NextResponse.json(listings);
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  try {
    const body = createSchema.parse(await request.json());

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (user.role === Role.GUEST) {
      await prisma.user.update({
        where: { id: user.id },
        data: { role: Role.BOTH },
      });
    }

    const listing = await prisma.listing.create({
      data: {
        title: body.title.trim(),
        tagline: body.tagline.trim(),
        description: body.description.trim(),
        location: body.location.trim(),
        city: body.city.trim(),
        country: body.country.trim(),
        category: body.category.trim(),
        mode: body.mode,
        pricePerNight: body.pricePerNight,
        capacity: body.capacity,
        bedrooms: body.bedrooms,
        bathrooms: body.bathrooms,
        captainIncluded: body.captainIncluded,
        breakfastIncluded: body.breakfastIncluded,
        amenities: JSON.stringify(body.amenities),
        photos: JSON.stringify(body.photos),
        hostId: user.id,
        status: ListingStatus.PUBLISHED,
        platformFee: 0.1,
        featured: false,
      },
    });

    return NextResponse.json({ id: listing.id }, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: err.issues[0]?.message ?? "Invalid input" },
        { status: 400 },
      );
    }
    return NextResponse.json({ error: "Create failed" }, { status: 500 });
  }
}
