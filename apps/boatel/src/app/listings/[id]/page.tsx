import Link from "next/link";
import { notFound } from "next/navigation";
import { BookingForm } from "@/components/BookingForm";
import {
  formatMoney,
  parseJsonArray,
} from "@/lib/listings";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function ListingDetailPage({ params }: Props) {
  const { id } = await params;
  const listing = await prisma.listing.findUnique({
    where: { id },
    include: {
      host: { select: { id: true, name: true, email: true } },
      reviews: {
        include: { author: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
        take: 5,
      },
    },
  });

  if (!listing) notFound();

  const photos = parseJsonArray(listing.photos);
  const amenities = parseJsonArray(listing.amenities);

  return (
    <div className="section">
      <p className="eyebrow">{listing.city}</p>
      <h1 className="page-title">{listing.title}</h1>
      <p className="muted">{listing.location}</p>
      <p style={{ marginTop: "0.75rem" }}>
        <strong>{formatMoney(listing.pricePerNight)}</strong>
        <span className="muted"> / night · up to {listing.capacity} guests</span>
        <span className="muted"> · Hosted by {listing.host.name}</span>
      </p>

      <div className="detail-layout" style={{ marginTop: "2rem" }}>
        <div>
          <div className="detail-gallery">
            {(photos.length ? photos : ["/images/placeholder-boat.svg"]).map(
              (src) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={src} src={src} alt={listing.title} />
              ),
            )}
          </div>
          <div style={{ marginTop: "1.75rem" }}>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.7rem" }}>
              About this stay
            </h2>
            <p style={{ whiteSpace: "pre-wrap", lineHeight: 1.65 }}>
              {listing.description}
            </p>
            <ul className="amenity-list">
              {amenities.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>

          {listing.reviews.length > 0 ? (
            <div style={{ marginTop: "2rem" }}>
              <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.7rem" }}>
                Reviews
              </h2>
              <div className="table-list" style={{ marginTop: "1rem" }}>
                {listing.reviews.map((review) => (
                  <div key={review.id} className="panel">
                    <p style={{ margin: 0 }}>
                      <strong>{review.author.name}</strong>
                      <span className="muted"> · {review.rating}/5</span>
                    </p>
                    <p className="muted" style={{ marginBottom: 0 }}>
                      {review.comment}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          <p style={{ marginTop: "2rem" }}>
            <Link href="/explore" className="muted">
              ← Back to explore
            </Link>
          </p>
        </div>

        <BookingForm
          listingId={listing.id}
          pricePerNight={listing.pricePerNight}
          capacity={listing.capacity}
        />
      </div>
    </div>
  );
}
