import { getServerSession } from "next-auth";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ListBoatForm } from "@/components/ListBoatForm";
import { authOptions } from "@/lib/auth";

export default async function ListYourBoatPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/auth/signin?callbackUrl=/list-your-boat");
  }

  return (
    <div className="section" style={{ maxWidth: 720, marginInline: "auto" }}>
      <p className="eyebrow">Hosts</p>
      <h1 className="page-title">List your boat</h1>
      <p className="section-intro">
        Publish a floating stay. Guests can request bookings immediately
        (payments are mocked in this MVP).
      </p>
      <ListBoatForm />
      <p className="muted" style={{ marginTop: "1.5rem" }}>
        Prefer to manage existing stays?{" "}
        <Link href="/dashboard">Open dashboard</Link>
      </p>
    </div>
  );
}
