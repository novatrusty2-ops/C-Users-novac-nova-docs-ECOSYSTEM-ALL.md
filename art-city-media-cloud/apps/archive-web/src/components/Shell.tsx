"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { useAuth } from "@/lib/auth";

export function Shell({ children }: { children: ReactNode }) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !user) {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    }
  }, [loading, user, router, pathname]);

  if (loading || !user) {
    return (
      <div className="login-wrap">
        <p className="muted">Loading Art City Archive…</p>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand">
          Art City <span>Archive</span>
        </div>
        <nav className="nav">
          <Link href="/library">Library</Link>
          <Link href="/upload">Upload</Link>
          <span className="muted">{user.email}</span>
          <button type="button" onClick={() => { logout(); router.push("/login"); }}>
            Sign out
          </button>
        </nav>
      </header>
      <main className="main">{children}</main>
    </div>
  );
}
