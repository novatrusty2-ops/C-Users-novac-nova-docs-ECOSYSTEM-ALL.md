"use client";

import { FormEvent, useState } from "react";
import { brand } from "@/lib/content";

export function ContactForm() {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    const form = new FormData(e.currentTarget);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.get("name"),
          email: form.get("email"),
          topic: form.get("topic"),
          message: form.get("message"),
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Could not send message");
        return;
      }
      setSuccess("Message received — we’ll get back to you soon.");
      e.currentTarget.reset();
    } catch {
      setError("Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="contact-layout">
      <form className="stack-form" onSubmit={onSubmit}>
        <label>
          <span>Name</span>
          <input name="name" required />
        </label>
        <label>
          <span>Email</span>
          <input name="email" type="email" required />
        </label>
        <label>
          <span>Topic</span>
          <select name="topic" defaultValue="General">
            <option>General</option>
            <option>Booking help</option>
            <option>List my boat</option>
            <option>Press</option>
            <option>Partnership</option>
          </select>
        </label>
        <label>
          <span>Message</span>
          <textarea name="message" required rows={6} />
        </label>
        {error ? <p className="form-error">{error}</p> : null}
        {success ? <p className="form-success">{success}</p> : null}
        <button type="submit" className="btn" disabled={loading}>
          {loading ? "Sending…" : "Let's talk"}
        </button>
      </form>
      <aside className="panel">
        <p className="eyebrow">Support</p>
        <h2 className="section-h">ONLINE</h2>
        <p className="muted">
          In case of any questions contact our support team.
        </p>
        <p>
          <a href={`mailto:${brand.supportEmail}`}>{brand.supportEmail}</a>
          <br />
          <a href={`tel:${brand.supportPhone.replace(/\s/g, "")}`}>
            {brand.supportPhone}
          </a>
        </p>
        <p className="muted small">{brand.address}</p>
      </aside>
    </div>
  );
}
