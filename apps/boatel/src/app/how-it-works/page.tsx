import Link from "next/link";
import { howItWorks } from "@/lib/content";

export default function HowItWorksPage() {
  return (
    <div className="section">
      <h1 className="page-title">How it works</h1>
      <p className="section-intro">
        From search to sleep-aboard in three clear steps — any boat, anytime.
      </p>
      <div className="steps-grid steps-grid--lg">
        {howItWorks.map((item) => (
          <div key={item.step} className="step-tile">
            <span className="step-num">{item.step}</span>
            <h2>{item.title}</h2>
            <p className="muted">{item.text}</p>
          </div>
        ))}
      </div>
      <div className="cta-band" style={{ marginTop: "2.5rem" }}>
        <div>
          <h2>Ready to discover?</h2>
          <p className="section-intro" style={{ color: "rgba(243,239,230,0.88)" }}>
            Browse worldwide floating stays or list your own vessel.
          </p>
        </div>
        <div className="hero__actions">
          <Link href="/explore" className="btn">
            Explore stays
          </Link>
          <Link href="/list-your-boat" className="btn btn--ghost">
            List your boat
          </Link>
        </div>
      </div>
    </div>
  );
}
