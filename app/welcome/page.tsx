import { Suspense } from "react";
import WelcomeInner from "./WelcomeInner";

export default function WelcomePage() {
  return (
    <Suspense
      fallback={
        <main className="mx-auto max-w-2xl px-6 py-20">
          <p className="text-sm uppercase tracking-widest text-coral-600 font-semibold">
            Welcome
          </p>
          <h1 className="mt-3 text-5xl text-navy-900">You&apos;re in!</h1>
          <p className="mt-6 text-lg text-navy-600">Loading…</p>
        </main>
      }
    >
      <WelcomeInner />
    </Suspense>
  );
}
