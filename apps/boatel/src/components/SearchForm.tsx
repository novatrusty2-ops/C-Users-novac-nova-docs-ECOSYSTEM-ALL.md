"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

type Props = {
  initialLocation?: string;
  initialCheckIn?: string;
  initialCheckOut?: string;
  compact?: boolean;
};

export function SearchForm({
  initialLocation = "",
  initialCheckIn = "",
  initialCheckOut = "",
  compact = false,
}: Props) {
  const router = useRouter();
  const [location, setLocation] = useState(initialLocation);
  const [checkIn, setCheckIn] = useState(initialCheckIn);
  const [checkOut, setCheckOut] = useState(initialCheckOut);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (location.trim()) params.set("q", location.trim());
    if (checkIn) params.set("checkIn", checkIn);
    if (checkOut) params.set("checkOut", checkOut);
    router.push(`/explore?${params.toString()}`);
  }

  return (
    <form
      className={`search-form ${compact ? "search-form--compact" : ""}`}
      onSubmit={onSubmit}
    >
      <label>
        <span>City, marina or address</span>
        <input
          type="search"
          name="q"
          placeholder="London, Brighton, Falmouth…"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
        />
      </label>
      <label>
        <span>Check in</span>
        <input
          type="date"
          name="checkIn"
          value={checkIn}
          onChange={(e) => setCheckIn(e.target.value)}
        />
      </label>
      <label>
        <span>Check out</span>
        <input
          type="date"
          name="checkOut"
          value={checkOut}
          onChange={(e) => setCheckOut(e.target.value)}
        />
      </label>
      <button type="submit" className="btn">
        Discover
      </button>
    </form>
  );
}
