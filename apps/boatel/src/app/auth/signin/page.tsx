import { Suspense } from "react";
import { SignInForm } from "@/components/AuthForms";

export default function SignInPage() {
  return (
    <div className="narrow">
      <h1 className="page-title">Sign in</h1>
      <p className="section-intro">Welcome back aboard.</p>
      <Suspense fallback={<p className="muted">Loading…</p>}>
        <SignInForm />
      </Suspense>
    </div>
  );
}
