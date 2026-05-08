import { Suspense } from "react";
import LoginInner from "./LoginInner";

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <main className="mx-auto max-w-md px-6 py-20">
          <h1 className="text-3xl">Sign in</h1>
          <p className="mt-2 text-navy-600">Loading…</p>
        </main>
      }
    >
      <LoginInner />
    </Suspense>
  );
}
