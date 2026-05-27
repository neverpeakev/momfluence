import { Suspense } from "react";
import ApplyHero from "./ApplyHero";

export default function SignupPage() {
  return (
    <Suspense
      fallback={
        <main className="mx-auto max-w-md px-6 py-12 sm:py-16">
          <h1 className="text-4xl text-navy-900 leading-tight sm:text-5xl">
            Apply to join MomFluence
          </h1>
          <p className="mt-3 text-base text-navy-600">Loading…</p>
        </main>
      }
    >
      <ApplyHero />
    </Suspense>
  );
}
