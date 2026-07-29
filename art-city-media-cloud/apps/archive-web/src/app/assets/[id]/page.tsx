"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Shell } from "@/components/Shell";
import { getAsset, type Asset } from "@/lib/api";
import { useAuth } from "@/lib/auth";

export default function AssetDetailPage() {
  const params = useParams<{ id: string }>();
  const { token } = useAuth();
  const [asset, setAsset] = useState<Asset | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!token || !params.id) return;
    try {
      const data = await getAsset(token, params.id);
      setAsset(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load asset");
    }
  }, [token, params.id]);

  useEffect(() => {
    void load();
    const timer = setInterval(() => {
      if (asset && asset.status !== "Ready" && asset.status !== "Failed") {
        void load();
      }
    }, 2500);
    return () => clearInterval(timer);
  }, [load, asset?.status]);

  const proxy = asset?.renditions.find((r) => r.profile === "proxy");
  const thumb = asset?.renditions.find((r) => r.profile === "thumbnail");
  const tech = asset?.technical_metadata || {};

  return (
    <Shell>
      <div className="stack">
        <div className="row">
          <Link className="btn btn-secondary" href="/library">
            ← Library
          </Link>
        </div>
        {error ? <div className="error">{error}</div> : null}
        {!asset ? (
          <p className="muted">Loading asset…</p>
        ) : (
          <>
            <div>
              <h1>{asset.title}</h1>
              <p className="muted">{asset.description || "No description"}</p>
              <div className="row" style={{ marginTop: "0.75rem" }}>
                <span className={`badge ${asset.status === "Ready" ? "ready" : ""}`}>
                  {asset.status}
                </span>
                <span className="badge">{asset.asset_type}</span>
                <span className="badge">{asset.sensitivity}</span>
              </div>
            </div>

            <div className="panel stack">
              {proxy?.url ? (
                <video className="player" controls poster={thumb?.url || undefined} src={proxy.url} />
              ) : thumb?.url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img className="player" src={thumb.url} alt="" />
              ) : (
                <div className="thumb" style={{ minHeight: 220 }}>
                  <span className="muted">Proxy not ready yet</span>
                </div>
              )}
            </div>

            <div className="panel">
              <h2>Technical metadata</h2>
              <table className="meta-table">
                <tbody>
                  <tr>
                    <th>Duration</th>
                    <td>{String(tech.duration_seconds ?? "—")}</td>
                  </tr>
                  <tr>
                    <th>Resolution</th>
                    <td>{String(tech.resolution ?? "—")}</td>
                  </tr>
                  <tr>
                    <th>Video codec</th>
                    <td>{String(tech.video_codec ?? "—")}</td>
                  </tr>
                  <tr>
                    <th>Audio codec</th>
                    <td>{String(tech.audio_codec ?? "—")}</td>
                  </tr>
                  <tr>
                    <th>Container</th>
                    <td>{String(tech.container ?? "—")}</td>
                  </tr>
                  <tr>
                    <th>Checksum</th>
                    <td>{asset.files[0]?.checksum_sha256 || "—"}</td>
                  </tr>
                  <tr>
                    <th>Original file</th>
                    <td>{asset.files[0]?.filename || "—"}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </Shell>
  );
}
