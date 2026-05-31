import { Suspense } from "react";
import Link from "next/link";
import MembershipCheckout from "@/components/MembershipCheckout";
import HeroSocialProof from "@/components/landing/HeroSocialProof";
import BrandRibbon from "@/components/landing/BrandRibbon";

/**
 * /signup — focused membership checkout page.
 *
 * Same conversion unit as the homepage hero, on a distraction-free page that
 * ads and landing-page variants point at. One tap → Stripe Checkout → account
 * created from payment → magic link → dashboard. No application, no password.
 */

export default function SignupPage() {
  return (
    <Suspense
      fallback={
        <main className="mx-auto max-w-md px-6 py-16">
          <h1 className="text-4xl text-navy-900 leading-tight">Join MomFluence</h1>
          <p className="mt-3 text-navy-600">Loading…</p>
        </main>
      }
    >
      <main className="mx-auto max-w-md px-6 py-12 sm:py-16">
        <h1 className="text-4xl text-navy-900 leading-tight sm:text-5xl">
          Join MomFluence
        </h1>
        <p className="mt-3 text-lg text-navy-700">
          $5/mo membership — cancel anytime.
        </p>
        <p className="mt-2 text-sm text-navy-600">
          Your exclusive, done-for-you affiliate links are inside. No
          applications, no interviews, no waiting — every brand link is live the
          moment you join.
        </p>

        <HeroSocialProof />

        <div className="mt-7">
          <MembershipCheckout />
        </div>

        <BrandRibbon />

        <p className="mt-8 text-sm text-navy-600">
          Already a member?{" "}
          <Link href="/login" className="text-coral-600 hover:text-coral-700">
            Sign in
          </Link>
        </p>
      </main>
    </Suspense>
  );
}
