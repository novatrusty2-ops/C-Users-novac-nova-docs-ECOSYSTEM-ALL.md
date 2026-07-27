"use client";

import { signIn } from "next-auth/react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useState } from "react";

export function SignInForm() {
  const router = useRouter();
  const params = useSearchParams();
  const callbackUrl = params.get("callbackUrl") ?? "/dashboard";
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const form = new FormData(e.currentTarget);
    const res = await signIn("credentials", {
      email: String(form.get("email")),
      password: String(form.get("password")),
      redirect: false,
    });
    setLoading(false);
    if (res?.error) {
      setError("Invalid email or password");
      return;
    }
    router.push(callbackUrl);
    router.refresh();
  }

  return (
    <form className="stack-form" onSubmit={onSubmit}>
      <label>
        <span>Email</span>
        <input name="email" type="email" required autoComplete="email" />
      </label>
      <label>
        <span>Password</span>
        <input
          name="password"
          type="password"
          required
          autoComplete="current-password"
        />
      </label>
      {error ? <p className="form-error">{error}</p> : null}
      <button type="submit" className="btn" disabled={loading}>
        {loading ? "Signing in…" : "Sign in"}
      </button>
      <p className="muted small">
        Demo: host@boatel.local or guest@boatel.local · password123
      </p>
      <p className="muted">
        No account? <Link href="/auth/signup">Sign up</Link>
      </p>
    </form>
  );
}

export function SignUpForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const form = new FormData(e.currentTarget);
    const payload = {
      name: String(form.get("name")),
      email: String(form.get("email")),
      password: String(form.get("password")),
      role: String(form.get("role") ?? "GUEST"),
    };

    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = (await res.json()) as { error?: string };
    if (!res.ok) {
      setLoading(false);
      setError(data.error ?? "Could not sign up");
      return;
    }

    const login = await signIn("credentials", {
      email: payload.email,
      password: payload.password,
      redirect: false,
    });
    setLoading(false);
    if (login?.error) {
      setError("Account created — please sign in");
      router.push("/auth/signin");
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <form className="stack-form" onSubmit={onSubmit}>
      <label>
        <span>Name</span>
        <input name="name" required autoComplete="name" />
      </label>
      <label>
        <span>Email</span>
        <input name="email" type="email" required autoComplete="email" />
      </label>
      <label>
        <span>Password</span>
        <input
          name="password"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
        />
      </label>
      <label>
        <span>I want to</span>
        <select name="role" defaultValue="GUEST">
          <option value="GUEST">Book stays</option>
          <option value="HOST">List my boat</option>
          <option value="BOTH">Both</option>
        </select>
      </label>
      {error ? <p className="form-error">{error}</p> : null}
      <button type="submit" className="btn" disabled={loading}>
        {loading ? "Creating…" : "Create account"}
      </button>
      <p className="muted">
        Already have an account? <Link href="/auth/signin">Sign in</Link>
      </p>
    </form>
  );
}
