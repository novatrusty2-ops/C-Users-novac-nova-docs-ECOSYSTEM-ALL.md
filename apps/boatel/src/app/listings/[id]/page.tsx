import Link from "next/link";
import { notFound } from "next/navigation";
import { BookingForm } from "@/components/BookingForm";
import {
  averageRating,
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
        take: 8,
      },
    },
  });

  if (!listing) notFound();

  const photos = parseJsonArray(listing.photos);
  const amenities = parseJsonArray(listing.amenities);
  const rating = averageRating(listing.reviews);

  return (
    <div className="section">
      <p className="eyebrow">
        {listing.city}, {listing.country} · {listing.category} · {listing.mode}
      </p>
      <h1 className="page-title">{listing.title}</h1>
      {listing.tagline ? (
        <p className="lede-line">{listing.tagline}</p>
      ) : null}
      <p className="muted">{listing.location}</p>
      <p style={{ marginTop: "0.75rem" }}>
        <strong>{formatMoney(listing.pricePerNight)}</strong>
        <span className="muted">
          {" "}
          / night · {listing.capacity} guests · {listing.bedrooms} bed ·{" "}
          {listing.bathrooms} bath
        </span>
        {rating ? (
          <span className="muted"> · {rating}/5 from guests</span>
        ) : null}
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

          <div className="fact-row">
            <div>
              <span className="eyebrow">Check-in</span>
              <p>{listing.checkInText}</p>
            </div>
            <div>
              <span className="eyebrow">Check-out</span>
              <p>{listing.checkOutText}</p>
            </div>
            <div>
              <span className="eyebrow">Cancellation</span>
              <p>{listing.cancellationPolicy}</p>
            </div>
            <div>
              <span className="eyebrow">Extras</span>
              <p>
                {listing.captainIncluded ? "Captain included · " : ""}
                {listing.breakfastIncluded ? "Breakfast included" : "Self-catered"}
              </p>
            </div>
          </div>

          <div style={{ marginTop: "1.75rem" }}>
            <h2 className="section-h">About this stay</h2>
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
              <h2 className="section-h">Guest reviews</h2>
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
