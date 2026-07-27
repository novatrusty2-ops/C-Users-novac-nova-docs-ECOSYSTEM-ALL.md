"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

const DEFAULT_AMENITIES = "Wi‑Fi, Kitchen, Sun deck, Heating";

export function ListBoatForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const form = new FormData(e.currentTarget);
    const amenities = String(form.get("amenities") ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const photos = String(form.get("photos") ?? "")
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);

    try {
      const res = await fetch("/api/listings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.get("title"),
          description: form.get("description"),
          location: form.get("location"),
          city: form.get("city"),
          pricePerNight: Number(form.get("pricePerNight")),
          capacity: Number(form.get("capacity")),
          amenities,
          photos:
            photos.length > 0
              ? photos
              : [
                  "https://images.unsplash.com/photo-1567899378494-47b22a2ae96a?w=1600&q=80",
                ],
        }),
      });
      const data = (await res.json()) as { error?: string; id?: string };
      if (!res.ok) {
        setError(data.error ?? "Could not create listing");
        return;
      }
      router.push(`/listings/${data.id}`);
      router.refresh();
    } catch {
      setError("Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="stack-form" onSubmit={onSubmit}>
      <label>
        <span>Title</span>
        <input name="title" required placeholder="Harbour cabin cruiser" />
      </label>
      <label>
        <span>Description</span>
        <textarea
          name="description"
          required
          rows={5}
          placeholder="Tell guests what makes this stay special…"
        />
      </label>
      <div className="form-row">
        <label>
          <span>City</span>
          <input name="city" required placeholder="Brighton" />
        </label>
        <label>
          <span>Location / marina</span>
          <input name="location" required placeholder="Brighton Marina" />
        </label>
      </div>
      <div className="form-row">
        <label>
          <span>Price per night (GBP)</span>
          <input
            name="pricePerNight"
            type="number"
            min={1}
            step={1}
            required
            defaultValue={180}
          />
        </label>
        <label>
          <span>Capacity</span>
          <input
            name="capacity"
            type="number"
            min={1}
            max={20}
            required
            defaultValue={2}
          />
        </label>
      </div>
      <label>
        <span>Amenities (comma-separated)</span>
        <input name="amenities" defaultValue={DEFAULT_AMENITIES} />
      </label>
      <label>
        <span>Photo URLs (one per line)</span>
        <textarea
          name="photos"
          rows={3}
          placeholder="https://…&#10;https://…"
        />
      </label>
      {error ? <p className="form-error">{error}</p> : null}
      <button type="submit" className="btn" disabled={loading}>
        {loading ? "Publishing…" : "Publish listing"}
      </button>
    </form>
  );
}
