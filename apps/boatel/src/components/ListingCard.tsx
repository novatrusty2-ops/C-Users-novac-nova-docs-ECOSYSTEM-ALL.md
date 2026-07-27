import Link from "next/link";
import { formatMoney, parseJsonArray, type ListingWithHost } from "@/lib/listings";

export function ListingCard({ listing }: { listing: ListingWithHost }) {
  const photos = parseJsonArray(listing.photos);
  const cover = photos[0] ?? "/images/placeholder-boat.svg";

  return (
    <article className="listing-card">
      <Link href={`/listings/${listing.id}`} className="listing-card__media">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={cover} alt={listing.title} loading="lazy" />
        {listing.featured ? <span className="badge">Recommended</span> : null}
        <span className="badge badge--mode">{listing.mode}</span>
      </Link>
      <div className="listing-card__body">
        <p className="eyebrow">
          {listing.city}, {listing.country} · {listing.category}
        </p>
        <h3>
          <Link href={`/listings/${listing.id}`}>{listing.title}</Link>
        </h3>
        {listing.tagline ? <p className="muted">{listing.tagline}</p> : null}
        <p className="listing-card__price">
          <strong>{formatMoney(listing.pricePerNight)}</strong>
          <span className="muted">
            {" "}
            / night · {listing.capacity} guests · {listing.bedrooms} bed
          </span>
        </p>
      </div>
    </article>
  );
}
