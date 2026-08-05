import Link from "next/link";
import { brand } from "@/lib/content";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="site-footer__inner footer-grid">
        <div>
          <p className="brand brand--footer">{brand.name}</p>
          <p className="muted">{brand.tagline}</p>
          <p className="muted small" style={{ marginTop: "0.75rem" }}>
            {brand.address}
            <br />
            <a href={`tel:${brand.supportPhone.replace(/\s/g, "")}`}>
              {brand.supportPhone}
            </a>
            <br />
            <a href={`mailto:${brand.supportEmail}`}>{brand.supportEmail}</a>
          </p>
        </div>
        <div>
          <p className="eyebrow">Links</p>
          <div className="footer-links stacked">
            <Link href="/places">Places</Link>
            <Link href="/how-it-works">How it works</Link>
            <Link href="/use-cases">Use cases</Link>
            <Link href="/explore">Explore</Link>
            <Link href="/list-your-boat">List Your Boat</Link>
          </div>
        </div>
        <div>
          <p className="eyebrow">Policy</p>
          <div className="footer-links stacked">
            <Link href="/legal/privacy">Privacy Policy</Link>
            <Link href="/legal/terms">Terms of Service</Link>
            <Link href="/legal/cookies">Cookies Policy</Link>
            <Link href="/contact">Contact / Let&apos;s Talk</Link>
          </div>
        </div>
      </div>
      <div className="site-footer__inner" style={{ marginTop: "1.5rem" }}>
        <p className="muted small">
          © {new Date().getFullYear()} Boatel — All rights reserved
        </p>
      </div>
    </footer>
  );
}
