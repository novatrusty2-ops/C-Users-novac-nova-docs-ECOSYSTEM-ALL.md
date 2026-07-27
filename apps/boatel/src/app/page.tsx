import Link from "next/link";
import { ListingCard } from "@/components/ListingCard";
import { SearchForm } from "@/components/SearchForm";
import {
  brand,
  destinations,
  howItWorks,
  modes,
  platformReviews,
} from "@/lib/content";
import { prisma } from "@/lib/prisma";
import { ListingStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [recommendations, adventures] = await Promise.all([
    prisma.listing.findMany({
      where: { status: ListingStatus.PUBLISHED, featured: true },
      include: {
        host: { select: { id: true, name: true, email: true } },
      },
      orderBy: { pricePerNight: "desc" },
      take: 6,
    }),
    prisma.listing.findMany({
      where: {
        status: ListingStatus.PUBLISHED,
        mode: { in: ["sail", "explore"] },
      },
      include: {
        host: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 3,
    }),
  ]);

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
          <p className="hero__kicker motion-delay-1">{brand.tagline}</p>
          <p className="hero__brand">Boatel</p>
          <h1>{brand.headline}</h1>
          <p className="hero__lede">{brand.lede}</p>
          <div className="hero__actions">
            <Link href="/explore" className="btn">
              Discover your dream stay
            </Link>
            <a
              href="#watch"
              className="btn btn--ghost"
            >
              Watch video
            </a>
          </div>
          <SearchForm />
        </div>
      </section>

      <section className="section mode-strip motion-fade">
        <div className="mode-grid">
          {modes.map((mode) => (
            <Link
              key={mode.id}
              href={`/explore?mode=${mode.id}`}
              className="mode-tile"
            >
              <p className="eyebrow">{mode.id}</p>
              <h2>{mode.title}</h2>
              <p className="muted">{mode.text}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="section">
        <div className="section-head">
          <div>
            <h2>Our recommendations</h2>
            <p className="section-intro">
              Hand-picked floating villas, yacht suites, and boutique boatels
              from London to the Maldives.
            </p>
          </div>
          <div className="sort-links">
            <Link href="/explore?sort=expensive">Expensive</Link>
            <Link href="/explore?sort=cheapest">Cheapest</Link>
            <Link href="/explore">Explore all</Link>
          </div>
        </div>
        {recommendations.length === 0 ? (
          <p className="empty">
            No listings yet. <Link href="/list-your-boat">List your boat</Link>.
          </p>
        ) : (
          <div className="listing-grid">
            {recommendations.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        )}
      </section>

      <section className="section places-preview">
        <h2>Places</h2>
        <p className="section-intro">
          Boundless adventures across harbours, lochs, lagoons, and city
          marinas.
        </p>
        <div className="places-grid">
          {destinations.slice(0, 6).map((place, index) => (
            <Link
              key={place.slug}
              href={`/places/${place.slug}`}
              className={`place-tile motion-stagger`}
              style={{ animationDelay: `${index * 70}ms` }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={place.image} alt="" loading="lazy" />
              <div>
                <h3>{place.name}</h3>
                <p>{place.blurb}</p>
              </div>
            </Link>
          ))}
        </div>
        <p style={{ marginTop: "1.25rem" }}>
          <Link href="/places" className="btn btn--small">
            View all places
          </Link>
        </p>
      </section>

      <section className="section" id="watch">
        <div className="video-band">
          <div>
            <p className="eyebrow">Film</p>
            <h2>Watch the water life</h2>
            <p className="section-intro">
              A minute of wakes, harbours, and floating suites — the Boatel
              feeling before you book.
            </p>
            <Link href="/how-it-works" className="btn btn--small">
              See how it works
            </Link>
          </div>
          <div className="video-frame">
            <iframe
              title="Boatel water stays"
              src="https://www.youtube.com/embed/aqz-KE-bpKQ?rel=0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </div>
      </section>

      <section className="section">
        <h2>Boundless adventures</h2>
        <p className="section-intro">
          Sail and explore listings for day hops, captain nights, and routes
          beyond a static berth.
        </p>
        <div className="listing-grid">
          {adventures.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      </section>

      <section className="section">
        <h2>How it works</h2>
        <div className="steps-grid">
          {howItWorks.map((item) => (
            <div key={item.step} className="step-tile">
              <span className="step-num">{item.step}</span>
              <h3>{item.title}</h3>
              <p className="muted">{item.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="section">
        <h2>Reviews about us</h2>
        <p className="section-intro">
          Guests who chose floating stays over ordinary hotels.
        </p>
        <div className="review-grid">
          {platformReviews.map((review) => (
            <blockquote key={review.name} className="review-tile">
              <p>“{review.body}”</p>
              <footer>
                <strong>{review.name}</strong>
                <span className="muted">
                  {" "}
                  · {review.place} · {review.rating}/5
                </span>
              </footer>
            </blockquote>
          ))}
        </div>
      </section>

      <section className="section">
        <div className="cta-band">
          <div>
            <p className="eyebrow">Hosts</p>
            <h2>Live the reality, sail the dream</h2>
            <p className="section-intro" style={{ color: "rgba(243,239,230,0.88)" }}>
              Your journey to unforgettable water stays starts with a simple
              online registration. List your boat and welcome the world.
            </p>
          </div>
          <div className="hero__actions">
            <Link href="/list-your-boat" className="btn">
              Claim your spot
            </Link>
            <Link href="/contact" className="btn btn--ghost">
              Let&apos;s talk
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
