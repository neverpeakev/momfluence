import { Suspense } from "react";
import Stripe from "stripe";
import SuccessInner from "./SuccessInner";

/**
 * Post-payment landing page (apply_anonymous flow, added 2026-05-27).
 *
 * Flow:
 *   1. Stripe Checkout redirects here with ?session_id=cs_...
 *   2. This server component fetches the Checkout Session to recover the
 *      customer's email (which Stripe collected during checkout).
 *   3. Renders the client SuccessInner with the email, which calls
 *      supabase.auth.signInWithOtp({email}) to trigger the magic-link sign-in
 *      email.
 *   4. User clicks the magic link in their email → /auth/v1/verify (NOT the
 *      broken /auth/v1/callback PKCE path) → /onboarding.
 *
 * The webhook (separately) creates the auth.users row and momfluencers row
 * when checkout.session.completed fires. By the time the user clicks the
 * magic link, both rows exist.
 */
export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{ session_id?: string }>;
}

export default async function SignupSuccessPage({ searchParams }: PageProps) {
  const { session_id } = await searchParams;

  // Recover the customer's email from the Stripe Checkout Session so the
  // client component can send a magic link to it.
  let email: string | null = null;
  let paid = false;
  if (session_id && process.env.STRIPE_SECRET_KEY) {
    try {
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY.trim());
      const session = await stripe.checkout.sessions.retrieve(session_id);
      email =
        session.customer_details?.email ?? session.customer_email ?? null;
      paid = session.payment_status === "paid";
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("[/signup/success] could not retrieve Stripe session:", msg);
    }
  }

  return (
    <Suspense fallback={<SuccessSkeleton />}>
      <SuccessInner email={email} paid={paid} sessionId={session_id ?? null} />
    </Suspense>
  );
}

function SuccessSkeleton() {
  return (
    <main className="mx-auto max-w-md px-6 py-20">
      <h1 className="text-3xl text-navy-900">Loading…</h1>
    </main>
  );
}
