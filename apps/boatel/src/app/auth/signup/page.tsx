import { SignUpForm } from "@/components/AuthForms";

export default function SignUpPage() {
  return (
    <div className="narrow">
      <h1 className="page-title">Create your account</h1>
      <p className="section-intro">
        Book floating stays or list your vessel — start in under a minute.
      </p>
      <SignUpForm />
    </div>
  );
}
