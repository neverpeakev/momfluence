import Link from "next/link";

export default function PaywallPage() {
  return (
    <main className="mx-auto max-w-md px-6 py-20">
      <h1 className="text-3xl">Membership required</h1>
      <p className="mt-4 text-navy-600">
        Upgrade your membership to access the catalog.
      </p>
      <p className="mt-6">
        <Link href="/dashboard">Back to dashboard</Link>
      </p>
    </main>
  );
}
