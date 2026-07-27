"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { FormEvent, useMemo, useState } from "react";
import { formatMoney, nightsBetween } from "@/lib/listings";

type Props = {
  listingId: string;
  pricePerNight: number;
  capacity: number;
};

export function BookingForm({ listingId, pricePerNight, capacity }: Props) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guests, setGuests] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const total = useMemo(() => {
    if (!checkIn || !checkOut) return 0;
    const nights = nightsBetween(new Date(checkIn), new Date(checkOut));
    return nights * pricePerNight;
  }, [checkIn, checkOut, pricePerNight]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (status !== "authenticated" || !session?.user) {
      router.push(`/auth/signin?callbackUrl=/listings/${listingId}`);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          listingId,
          checkIn,
          checkOut,
          guests,
        }),
      });
      const data = (await res.json()) as { error?: string; id?: string };
      if (!res.ok) {
        setError(data.error ?? "Booking failed");
        return;
      }
      setSuccess("Booking confirmed (mock payment). View it in your dashboard.");
      router.refresh();
    } catch {
      setError("Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="booking-form" onSubmit={onSubmit}>
      <h2>Request your stay</h2>
      <p className="muted">
        MVP bookings confirm instantly without charging a card.
      </p>
      <label>
        <span>Check in</span>
        <input
          type="date"
          required
          value={checkIn}
          onChange={(e) => setCheckIn(e.target.value)}
        />
      </label>
      <label>
        <span>Check out</span>
        <input
          type="date"
          required
          value={checkOut}
          onChange={(e) => setCheckOut(e.target.value)}
        />
      </label>
      <label>
        <span>Guests</span>
        <input
          type="number"
          min={1}
          max={capacity}
          required
          value={guests}
          onChange={(e) => setGuests(Number(e.target.value))}
        />
      </label>
      <p className="booking-form__total">
        Total: <strong>{total ? formatMoney(total) : "—"}</strong>
      </p>
      {error ? <p className="form-error">{error}</p> : null}
      {success ? <p className="form-success">{success}</p> : null}
      <button type="submit" className="btn" disabled={loading}>
        {loading
          ? "Booking…"
          : status === "authenticated"
            ? "Confirm booking"
            : "Sign in to book"}
      </button>
    </form>
  );
}
