import { getServerSession } from "next-auth";
import Link from "next/link";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { formatMoney } from "@/lib/listings";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect("/auth/signin?callbackUrl=/dashboard");
  }

  const [listings, guestTrips, hostBookings] = await Promise.all([
    prisma.listing.findMany({
      where: { hostId: session.user.id },
      orderBy: { createdAt: "desc" },
    }),
    prisma.reservation.findMany({
      where: { guestId: session.user.id },
      include: { listing: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.reservation.findMany({
      where: { listing: { hostId: session.user.id } },
      include: {
        listing: true,
        guest: { select: { name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return (
    <div className="section dashboard-grid">
      <div>
        <h1 className="page-title">Dashboard</h1>
        <p className="section-intro">
          Signed in as {session.user.name} ({session.user.email})
        </p>
      </div>

      <section className="panel">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: "1rem",
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          <h2>Your listings</h2>
          <Link href="/list-your-boat" className="btn btn--small">
            List a boat
          </Link>
        </div>
        {listings.length === 0 ? (
          <p className="empty" style={{ marginTop: "1rem" }}>
            You have not published a boat yet.
          </p>
        ) : (
          <div className="table-list" style={{ marginTop: "1rem" }}>
            {listings.map((listing) => (
              <div key={listing.id} className="table-row">
                <div>
                  <strong>
                    <Link href={`/listings/${listing.id}`}>{listing.title}</Link>
                  </strong>
                  <div className="muted small">{listing.city}</div>
                </div>
                <div>{formatMoney(listing.pricePerNight)} / night</div>
                <div className="muted">{listing.status}</div>
                <div>cap {listing.capacity}</div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="panel">
        <h2>Your trips</h2>
        {guestTrips.length === 0 ? (
          <p className="empty" style={{ marginTop: "1rem" }}>
            No bookings yet. <Link href="/explore">Explore stays</Link>
          </p>
        ) : (
          <div className="table-list" style={{ marginTop: "1rem" }}>
            {guestTrips.map((trip) => (
              <div key={trip.id} className="table-row">
                <div>
                  <strong>
                    <Link href={`/listings/${trip.listingId}`}>
                      {trip.listing.title}
                    </Link>
                  </strong>
                  <div className="muted small">{trip.listing.city}</div>
                </div>
                <div className="muted small">
                  {trip.checkIn.toISOString().slice(0, 10)} →{" "}
                  {trip.checkOut.toISOString().slice(0, 10)}
                </div>
                <div>{formatMoney(trip.total)}</div>
                <div className="muted">{trip.status}</div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="panel">
        <h2>Incoming bookings</h2>
        {hostBookings.length === 0 ? (
          <p className="empty" style={{ marginTop: "1rem" }}>
            Guests have not booked your listings yet.
          </p>
        ) : (
          <div className="table-list" style={{ marginTop: "1rem" }}>
            {hostBookings.map((booking) => (
              <div key={booking.id} className="table-row">
                <div>
                  <strong>{booking.listing.title}</strong>
                  <div className="muted small">
                    {booking.guest.name} · {booking.guest.email}
                  </div>
                </div>
                <div className="muted small">
                  {booking.checkIn.toISOString().slice(0, 10)} →{" "}
                  {booking.checkOut.toISOString().slice(0, 10)}
                </div>
                <div>{formatMoney(booking.total)}</div>
                <div className="muted">{booking.status}</div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
