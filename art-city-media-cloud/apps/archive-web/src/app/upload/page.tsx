"use client";

import Link from "next/link";
import { FormEvent, useRef, useState } from "react";
import { Shell } from "@/components/Shell";
import {
  completeUpload,
  createAsset,
  createUpload,
  getJob,
  getUpload,
  sha256Hex,
  uploadMultipart,
} from "@/lib/api";
import { useAuth } from "@/lib/auth";

export default function UploadPage() {
  const { token } = useAuth();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [assetId, setAssetId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const pausedRef = useRef(false);
  const [paused, setPaused] = useState(false);

  async function runUpload(e: FormEvent) {
    e.preventDefault();
    if (!token || !file) return;
    setBusy(true);
    setError(null);
    setStatus("Creating asset…");
    setProgress(0);
    pausedRef.current = false;
    setPaused(false);
    abortRef.current = new AbortController();

    try {
      const asset = await createAsset(token, {
        title: title || file.name,
        description,
        asset_type: file.type.startsWith("image/")
          ? "image"
          : file.type.startsWith("audio/")
            ? "audio"
            : "video",
      });
      setAssetId(asset.id);
      setStatus("Starting multipart upload…");

      let session = await createUpload(token, {
        asset_id: asset.id,
        filename: file.name,
        size_bytes: file.size,
        mime_type: file.type || "application/octet-stream",
      });

      setStatus("Uploading parts…");
      // Pause support: abort current fetch; resume by re-fetching signed URLs
      let parts: Array<{ part_number: number; etag: string }> = [];
      try {
        parts = await uploadMultipart(
          session,
          file,
          (ratio) => setProgress(ratio),
          abortRef.current.signal,
        );
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") {
          while (pausedRef.current) {
            await new Promise((r) => setTimeout(r, 200));
          }
          abortRef.current = new AbortController();
          setStatus("Resuming upload…");
          session = await getUpload(token, session.id);
          parts = await uploadMultipart(
            session,
            file,
            (ratio) => setProgress(ratio),
            abortRef.current.signal,
          );
        } else {
          throw err;
        }
      }

      setStatus("Computing checksum…");
      const checksum = await sha256Hex(file);
      setStatus("Completing upload & queuing processing…");
      const job = await completeUpload(token, session.id, {
        parts,
        checksum_sha256: checksum,
      });

      setStatus(`Processing (${job.status})…`);
      let current = job;
      for (let i = 0; i < 120; i++) {
        if (current.status === "succeeded" || current.status === "failed") break;
        await new Promise((r) => setTimeout(r, 1500));
        current = await getJob(token, job.id);
        setProgress(0.95 + current.progress * 0.05);
        setStatus(`Processing ${Math.round(current.progress * 100)}% (${current.status})`);
      }
      if (current.status === "failed") {
        throw new Error(current.error_message || "Processing failed");
      }
      setProgress(1);
      setStatus("Ready");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
      setStatus(null);
    } finally {
      setBusy(false);
    }
  }

  function togglePause() {
    if (!busy) return;
    if (!pausedRef.current) {
      pausedRef.current = true;
      setPaused(true);
      setStatus("Paused");
      abortRef.current?.abort();
    } else {
      pausedRef.current = false;
      setPaused(false);
      setStatus("Resuming…");
    }
  }

  return (
    <Shell>
      <div className="stack">
        <div>
          <h1>Upload</h1>
          <p className="muted">Resumable multipart ingest into the Art City archive.</p>
        </div>
        <form className="panel stack" onSubmit={runUpload}>
          {error ? <div className="error">{error}</div> : null}
          <label>
            Title
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Interview — Erbil" />
          </label>
          <label>
            Description
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional synopsis"
            />
          </label>
          <label>
            Media file
            <input
              type="file"
              accept="video/*,audio/*,image/*"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              required
            />
          </label>
          <div className="row">
            <button className="btn btn-primary" type="submit" disabled={busy || !file}>
              {busy ? "Working…" : "Start upload"}
            </button>
            <button className="btn btn-secondary" type="button" onClick={togglePause} disabled={!busy}>
              {paused ? "Resume" : "Pause"}
            </button>
            {assetId ? (
              <Link className="btn btn-secondary" href={`/assets/${assetId}`}>
                Open asset
              </Link>
            ) : null}
          </div>
          {status ? (
            <div className="stack" style={{ gap: "0.45rem" }}>
              <div className="muted">{status}</div>
              <div className="progress">
                <span style={{ width: `${Math.round(progress * 100)}%` }} />
              </div>
            </div>
          ) : null}
        </form>
      </div>
    </Shell>
  );
}
