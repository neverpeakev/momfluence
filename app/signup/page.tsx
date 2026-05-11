import { Suspense } from "react";
import SignupInner from "./SignupInner";

export default function SignupPage() {
  return (
    <Suspense
      fallback={
        <main className="mx-auto max-w-md px-6 py-20">
          <h1 className="text-3xl">Join MomFluence — $5/mo</h1>
          <p className="mt-2 text-navy-600">Loading…</p>
        </main>
      }
    >
      <SignupInner />
    </Suspense>
  );
}
