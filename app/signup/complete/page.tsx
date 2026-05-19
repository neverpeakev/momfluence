import { Suspense } from "react";
import CompleteInner from "./CompleteInner";

/**
 * /signup/complete — post-OAuth landing for SSO signups.
 *
 * The "Sign up with Google" and "Sign up with Facebook" buttons on /signup
 * redirect here AFTER Supabase Auth exchanges the OAuth code. By the time
 * the user lands on this route they have:
 *   - A Supabase auth session (via /auth/callback's exchangeCodeForSession)
 *   - A momfluencers row (auto-created by Supabase Auth on first login)
 *   - NO Stripe subscription yet
 *
 * This page closes that gap: it fires the Meta SignupStarted + InitiateCheckout
 * events, calls /api/checkout/create to mint a Stripe session, and redirects
 * to Stripe — matching the email+password flow in SignupInner.tsx exactly.
 *
 * If the user already has an active subscription (e.g. they hit Sign UP
 * accidentally as a returning user), the route bounces them to /dashboard.
 */
export default function SignupCompletePage() {
  return (
    <Suspense
      fallback={
        <main className="mx-auto max-w-md px-6 py-20">
          <h1 className="text-3xl">Almost there&hellip;</h1>
          <p className="mt-2 text-navy-600">Finishing up your signup.</p>
        </main>
      }
    >
      <CompleteInner />
    </Suspense>
  );
}
