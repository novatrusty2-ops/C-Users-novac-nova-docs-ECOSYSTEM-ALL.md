import Link from "next/link";
import { destinations } from "@/lib/content";

export default function PlacesPage() {
  return (
    <div className="section">
      <h1 className="page-title">Places</h1>
      <p className="section-intro">
        Harbours, lagoons, lochs, and city marinas — pick a destination and find
        your floating stay.
      </p>
      <div className="places-grid places-grid--large">
        {destinations.map((place, index) => (
          <Link
            key={place.slug}
            href={`/places/${place.slug}`}
            className="place-tile"
            style={{ animationDelay: `${index * 60}ms` }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={place.image} alt="" loading="lazy" />
            <div>
              <p className="eyebrow">{place.country}</p>
              <h3>{place.name}</h3>
              <p>{place.blurb}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
