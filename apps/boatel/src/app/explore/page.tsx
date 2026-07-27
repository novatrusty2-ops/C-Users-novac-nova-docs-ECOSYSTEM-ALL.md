import Link from "next/link";
import { ListingCard } from "@/components/ListingCard";
import { SearchForm } from "@/components/SearchForm";
import { categories, modes } from "@/lib/content";
import { prisma } from "@/lib/prisma";
import { ListingStatus, Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{
    q?: string;
    checkIn?: string;
    checkOut?: string;
    sort?: string;
    mode?: string;
    category?: string;
    country?: string;
  }>;
};

export default async function ExplorePage({ searchParams }: Props) {
  const params = await searchParams;
  const q = params.q?.trim();
  const sort = params.sort ?? "featured";
  const mode = params.mode;
  const category = params.category;
  const country = params.country;

  const where: Prisma.ListingWhereInput = {
    status: ListingStatus.PUBLISHED,
    ...(q
      ? {
          OR: [
            { city: { contains: q } },
            { location: { contains: q } },
            { title: { contains: q } },
            { country: { contains: q } },
            { category: { contains: q } },
          ],
        }
      : {}),
    ...(mode ? { mode } : {}),
    ...(category ? { category } : {}),
    ...(country ? { country: { contains: country } } : {}),
  };

  const orderBy: Prisma.ListingOrderByWithRelationInput =
    sort === "cheapest"
      ? { pricePerNight: "asc" }
      : sort === "expensive"
        ? { pricePerNight: "desc" }
        : { featured: "desc" };

  const listings = await prisma.listing.findMany({
    where,
    include: {
      host: { select: { id: true, name: true, email: true } },
    },
    orderBy:
      sort === "featured"
        ? [{ featured: "desc" }, { pricePerNight: "desc" }]
        : orderBy,
  });

  function hrefWith(next: Record<string, string | undefined>) {
    const sp = new URLSearchParams();
    const merged = {
      q: params.q,
      checkIn: params.checkIn,
      checkOut: params.checkOut,
      sort: params.sort,
      mode: params.mode,
      category: params.category,
      country: params.country,
      ...next,
    };
    Object.entries(merged).forEach(([k, v]) => {
      if (v) sp.set(k, v);
    });
    return `/explore?${sp.toString()}`;
  }

  return (
    <div className="section">
      <h1 className="page-title">Explore water stays</h1>
      <p className="section-intro">
        {q
          ? `Showing stays matching “${q}”.`
          : "Floating villas, yacht suites, and boutique boatels worldwide."}
      </p>
      <SearchForm
        compact
        initialLocation={params.q ?? ""}
        initialCheckIn={params.checkIn ?? ""}
        initialCheckOut={params.checkOut ?? ""}
      />

      <div className="filter-bar">
        <div className="chip-row">
          <span className="muted small">Sort</span>
          <Link
            className={!params.sort || params.sort === "featured" ? "chip is-active" : "chip"}
            href={hrefWith({ sort: "featured" })}
          >
            Recommended
          </Link>
          <Link
            className={params.sort === "expensive" ? "chip is-active" : "chip"}
            href={hrefWith({ sort: "expensive" })}
          >
            Expensive
          </Link>
          <Link
            className={params.sort === "cheapest" ? "chip is-active" : "chip"}
            href={hrefWith({ sort: "cheapest" })}
          >
            Cheapest
          </Link>
        </div>
        <div className="chip-row">
          <span className="muted small">Mode</span>
          <Link className={!mode ? "chip is-active" : "chip"} href={hrefWith({ mode: undefined })}>
            Any
          </Link>
          {modes.map((m) => (
            <Link
              key={m.id}
              className={mode === m.id ? "chip is-active" : "chip"}
              href={hrefWith({ mode: m.id })}
            >
              {m.title}
            </Link>
          ))}
        </div>
        <div className="chip-row">
          <span className="muted small">Type</span>
          <Link
            className={!category ? "chip is-active" : "chip"}
            href={hrefWith({ category: undefined })}
          >
            Any
          </Link>
          {categories.slice(0, 5).map((c) => (
            <Link
              key={c}
              className={category === c ? "chip is-active" : "chip"}
              href={hrefWith({ category: c })}
            >
              {c}
            </Link>
          ))}
        </div>
      </div>

      <p className="muted small" style={{ margin: "1rem 0" }}>
        {listings.length} stay{listings.length === 1 ? "" : "s"}
      </p>

      {listings.length === 0 ? (
        <p className="empty">No listings match that search.</p>
      ) : (
        <div className="listing-grid">
          {listings.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      )}
    </div>
  );
}
