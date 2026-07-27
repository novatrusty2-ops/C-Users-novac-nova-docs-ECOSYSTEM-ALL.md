import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ListingStatus, Role } from "@prisma/client";

const createSchema = z.object({
  title: z.string().min(3).max(120),
  description: z.string().min(20).max(4000),
  location: z.string().min(2).max(200),
  city: z.string().min(2).max(80),
  pricePerNight: z.number().positive().max(100000),
  capacity: z.number().int().min(1).max(50),
  amenities: z.array(z.string()).default([]),
  photos: z.array(z.string().url()).min(1).max(12),
});

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim();

  const listings = await prisma.listing.findMany({
    where: {
      status: ListingStatus.PUBLISHED,
      ...(q
        ? {
            OR: [
              { city: { contains: q } },
              { location: { contains: q } },
              { title: { contains: q } },
            ],
          }
        : {}),
    },
    include: {
      host: { select: { id: true, name: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
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
        description: body.description.trim(),
        location: body.location.trim(),
        city: body.city.trim(),
        pricePerNight: body.pricePerNight,
        capacity: body.capacity,
        amenities: JSON.stringify(body.amenities),
        photos: JSON.stringify(body.photos),
        hostId: user.id,
        status: ListingStatus.PUBLISHED,
        platformFee: 0.1,
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
