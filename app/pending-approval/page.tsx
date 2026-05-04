import Link from "next/link";

export default function PendingApprovalPage() {
  return (
    <main className="mx-auto max-w-md px-6 py-20">
      <h1 className="text-3xl">Account pending</h1>
      <p className="mt-4 text-navy-600">
        Your account is pending review. We&apos;ll email you when approved.
      </p>
      <p className="mt-6">
        <Link href="/dashboard">Back to dashboard</Link>
      </p>
    </main>
  );
}
