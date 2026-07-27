import Link from "next/link";
import { ListingCard } from "@/components/ListingCard";
import { SearchForm } from "@/components/SearchForm";
import { prisma } from "@/lib/prisma";
import { ListingStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const recommendations = await prisma.listing.findMany({
    where: { status: ListingStatus.PUBLISHED },
    include: {
      host: { select: { id: true, name: true, email: true } },
    },
    orderBy: { pricePerNight: "desc" },
    take: 3,
  });

  return (
    <>
      <section className="hero">
        <div className="hero__media" aria-hidden>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://images.unsplash.com/photo-1567899378494-47b22a2ae96a?w=2000&q=80"
            alt=""
          />
          <div className="hero__veil" />
        </div>
        <div className="hero__content">
          <p className="hero__brand">Boatel</p>
          <h1>Sail, stay, or explore — your choice</h1>
          <p className="hero__lede">
            Floating villas, yacht suites, and boutique boatels across stunning
            waterways. Any boat, anytime.
          </p>
          <div className="hero__actions">
            <Link href="/explore" className="btn">
              Discover your dream stay
            </Link>
            <Link href="/list-your-boat" className="btn btn--ghost">
              List your boat
            </Link>
          </div>
          <SearchForm />
        </div>
      </section>

      <section className="section motion-fade">
        <h2>Our recommendations</h2>
        <p className="section-intro">
          Hand-picked water stays for a first night aboard — from London
          marinas to quiet lochs.
        </p>
        {recommendations.length === 0 ? (
          <p className="empty">
            No listings yet. Run the seed script or{" "}
            <Link href="/list-your-boat">list your boat</Link>.
          </p>
        ) : (
          <div className="listing-grid">
            {recommendations.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        )}
      </section>

      <section className="section">
        <div className="panel">
          <p className="eyebrow">Hosts</p>
          <h2>Live the reality, sail the dream</h2>
          <p className="section-intro">
            Share your vessel with travelers looking for nights on the water.
            Publish a listing in minutes — payments wiring comes later.
          </p>
          <Link href="/list-your-boat" className="btn">
            Claim your spot
          </Link>
        </div>
      </section>
    </>
  );
}
