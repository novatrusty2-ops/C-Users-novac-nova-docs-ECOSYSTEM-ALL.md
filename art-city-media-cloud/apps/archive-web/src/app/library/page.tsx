"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { Shell } from "@/components/Shell";
import { listAssets, type Asset } from "@/lib/api";
import { useAuth } from "@/lib/auth";

export default function LibraryPage() {
  const { token } = useAuth();
  const [q, setQ] = useState("");
  const [assets, setAssets] = useState<Asset[]>([]);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(
    async (query?: string) => {
      if (!token) return;
      setLoading(true);
      setError(null);
      try {
        const data = await listAssets(token, query);
        setAssets(data.items);
        setTotal(data.total);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load assets");
      } finally {
        setLoading(false);
      }
    },
    [token],
  );

  useEffect(() => {
    void load();
  }, [load]);

  function onSearch(e: FormEvent) {
    e.preventDefault();
    void load(q);
  }

  return (
    <Shell>
      <div className="stack">
        <div className="row" style={{ justifyContent: "space-between" }}>
          <div>
            <h1>Library</h1>
            <p className="muted">{total} assets in your tenant workspace</p>
          </div>
          <Link className="btn btn-primary" href="/upload">
            Upload media
          </Link>
        </div>

        <form className="panel row" onSubmit={onSearch}>
          <input
            style={{ flex: 1, minWidth: 200 }}
            placeholder="Search title or description"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <button className="btn btn-secondary" type="submit">
            Search
          </button>
        </form>

        {error ? <div className="error">{error}</div> : null}
        {loading ? <p className="muted">Loading…</p> : null}

        <div className="grid">
          {assets.map((asset) => {
            const thumb = asset.renditions.find((r) => r.profile === "thumbnail");
            return (
              <Link key={asset.id} href={`/assets/${asset.id}`} className="card">
                <div className="thumb">
                  {thumb?.url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={thumb.url} alt="" />
                  ) : (
                    <span className="muted">{asset.asset_type}</span>
                  )}
                </div>
                <div className="card-body stack" style={{ gap: "0.4rem" }}>
                  <strong>{asset.title}</strong>
                  <span className={`badge ${asset.status === "Ready" ? "ready" : ""}`}>
                    {asset.status}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
        {!loading && assets.length === 0 ? (
          <div className="panel muted">No assets yet. Upload a video to start the archive.</div>
        ) : null}
      </div>
    </Shell>
  );
}
