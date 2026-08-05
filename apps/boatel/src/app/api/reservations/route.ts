import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { nightsBetween } from "@/lib/listings";
import { prisma } from "@/lib/prisma";
import { ListingStatus, ReservationStatus } from "@prisma/client";

const schema = z.object({
  listingId: z.string().min(1),
  checkIn: z.string().min(1),
  checkOut: z.string().min(1),
  guests: z.number().int().min(1).max(50),
});

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  try {
    const body = schema.parse(await request.json());
    const checkIn = new Date(body.checkIn);
    const checkOut = new Date(body.checkOut);

    if (Number.isNaN(checkIn.getTime()) || Number.isNaN(checkOut.getTime())) {
      return NextResponse.json({ error: "Invalid dates" }, { status: 400 });
    }
    if (checkOut <= checkIn) {
      return NextResponse.json(
        { error: "Check-out must be after check-in" },
        { status: 400 },
      );
    }

    const listing = await prisma.listing.findUnique({
      where: { id: body.listingId },
    });
    if (!listing || listing.status !== ListingStatus.PUBLISHED) {
      return NextResponse.json({ error: "Listing not found" }, { status: 404 });
    }
    if (body.guests > listing.capacity) {
      return NextResponse.json(
        { error: `Max capacity is ${listing.capacity}` },
        { status: 400 },
      );
    }
    if (listing.hostId === session.user.id) {
      return NextResponse.json(
        { error: "You cannot book your own listing" },
        { status: 400 },
      );
    }

    const overlap = await prisma.reservation.findFirst({
      where: {
        listingId: listing.id,
        status: { in: [ReservationStatus.PENDING, ReservationStatus.CONFIRMED] },
        checkIn: { lt: checkOut },
        checkOut: { gt: checkIn },
      },
    });
    if (overlap) {
      return NextResponse.json(
        { error: "Those dates are not available" },
        { status: 409 },
      );
    }

    const nights = nightsBetween(checkIn, checkOut);
    const total = nights * listing.pricePerNight;

    const reservation = await prisma.reservation.create({
      data: {
        listingId: listing.id,
        guestId: session.user.id,
        checkIn,
        checkOut,
        guests: body.guests,
        total,
        status: ReservationStatus.CONFIRMED,
      },
    });

    return NextResponse.json({ id: reservation.id, total }, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: err.issues[0]?.message ?? "Invalid input" },
        { status: 400 },
      );
    }
    return NextResponse.json({ error: "Booking failed" }, { status: 500 });
  }
}
