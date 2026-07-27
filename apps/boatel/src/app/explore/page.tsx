import { ListingCard } from "@/components/ListingCard";
import { SearchForm } from "@/components/SearchForm";
import { prisma } from "@/lib/prisma";
import { ListingStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ q?: string; checkIn?: string; checkOut?: string }>;
};

export default async function ExplorePage({ searchParams }: Props) {
  const params = await searchParams;
  const q = params.q?.trim();

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

  return (
    <div className="section">
      <h1 className="page-title">Explore water stays</h1>
      <p className="section-intro">
        {q
          ? `Showing stays matching “${q}”.`
          : "Browse floating villas, yacht suites, and boutique boatels."}
      </p>
      <SearchForm
        compact
        initialLocation={params.q ?? ""}
        initialCheckIn={params.checkIn ?? ""}
        initialCheckOut={params.checkOut ?? ""}
      />
      <div style={{ height: "1.75rem" }} />
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
