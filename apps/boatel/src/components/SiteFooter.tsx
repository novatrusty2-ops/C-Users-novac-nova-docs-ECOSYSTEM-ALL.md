import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="site-footer__inner">
        <div>
          <p className="brand brand--footer">Boatel</p>
          <p className="muted">Sail, stay, or explore — your choice.</p>
        </div>
        <div className="footer-links">
          <Link href="/explore">Places</Link>
          <Link href="/list-your-boat">List Your Boat</Link>
          <Link href="/dashboard">Dashboard</Link>
        </div>
        <p className="muted small">© {new Date().getFullYear()} Boatel — MVP demo</p>
      </div>
    </footer>
  );
}
