import Link from "next/link";
import { useCases } from "@/lib/content";

export default function UseCasesPage() {
  return (
    <div className="section">
      <h1 className="page-title">Use cases</h1>
      <p className="section-intro">
        Why travellers and hosts choose Boatel — from romance weekends to host
        income on the water.
      </p>
      <div className="usecase-grid">
        {useCases.map((item) => (
          <article key={item.title} className="usecase-tile">
            <h2>{item.title}</h2>
            <p className="muted">{item.text}</p>
          </article>
        ))}
      </div>
      <p style={{ marginTop: "2rem" }}>
        <Link href="/explore" className="btn">
          Find a stay that fits
        </Link>
      </p>
    </div>
  );
}
