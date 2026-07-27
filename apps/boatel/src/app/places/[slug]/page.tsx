import Link from "next/link";
import { notFound } from "next/navigation";
import { ListingCard } from "@/components/ListingCard";
import { destinations } from "@/lib/content";
import { prisma } from "@/lib/prisma";
import { ListingStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ slug: string }>;
};

export default async function PlaceDetailPage({ params }: Props) {
  const { slug } = await params;
  const place = destinations.find((d) => d.slug === slug);
  if (!place) notFound();

  const listings = await prisma.listing.findMany({
    where: {
      status: ListingStatus.PUBLISHED,
      OR: [
        { region: slug },
        { city: { contains: place.name } },
        { country: { contains: place.country } },
      ],
    },
    include: {
      host: { select: { id: true, name: true, email: true } },
    },
    orderBy: { pricePerNight: "desc" },
  });

  return (
    <>
      <section className="place-hero">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={place.image} alt="" />
        <div className="place-hero__veil" />
        <div className="place-hero__content">
          <p className="eyebrow" style={{ color: "rgba(243,239,230,0.8)" }}>
            {place.country}
          </p>
          <h1>{place.name}</h1>
          <p>{place.blurb}</p>
        </div>
      </section>
      <div className="section">
        <div className="section-head">
          <h2>Stays in {place.name}</h2>
          <Link href={`/explore?q=${encodeURIComponent(place.name)}`}>
            Open in explore
          </Link>
        </div>
        {listings.length === 0 ? (
          <p className="empty">No listings here yet — check back soon.</p>
        ) : (
          <div className="listing-grid">
            {listings.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        )}
        <p style={{ marginTop: "2rem" }}>
          <Link href="/places" className="muted">
            ← All places
          </Link>
        </p>
      </div>
    </>
  );
}
