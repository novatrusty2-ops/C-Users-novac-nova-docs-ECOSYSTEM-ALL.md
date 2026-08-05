"use client";

import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import { useState } from "react";

export function SiteHeader() {
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);

  return (
    <header className="site-header">
      <div className="site-header__inner">
        <Link href="/" className="brand" onClick={() => setOpen(false)}>
          Boatel
        </Link>

        <button
          type="button"
          className="nav-toggle"
          aria-expanded={open}
          aria-label="Menu"
          onClick={() => setOpen((v) => !v)}
        >
          <span />
          <span />
        </button>

        <nav className={`site-nav ${open ? "is-open" : ""}`}>
          <Link href="/explore" onClick={() => setOpen(false)}>
            Explore
          </Link>
          <Link href="/places" onClick={() => setOpen(false)}>
            Places
          </Link>
          <Link href="/how-it-works" onClick={() => setOpen(false)}>
            How it works
          </Link>
          <Link href="/use-cases" onClick={() => setOpen(false)}>
            Use cases
          </Link>
          <Link href="/list-your-boat" onClick={() => setOpen(false)}>
            List Your Boat
          </Link>
          {session?.user ? (
            <>
              <Link href="/dashboard" onClick={() => setOpen(false)}>
                Dashboard
              </Link>
              <button
                type="button"
                className="linkish"
                onClick={() => {
                  setOpen(false);
                  void signOut({ callbackUrl: "/" });
                }}
              >
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link href="/auth/signin" onClick={() => setOpen(false)}>
                Sign in
              </Link>
              <Link
                href="/auth/signup"
                className="btn btn--small"
                onClick={() => setOpen(false)}
              >
                Sign up
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
