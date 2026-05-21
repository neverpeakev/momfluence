import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { findVariant, VARIANTS } from "@/lib/funnel-lab/variants";
import { findRuntimeVariant } from "@/lib/funnel-lab/runtime-variants";
import BrandRibbon from "@/components/landing/BrandRibbon";
import DashboardPreview from "@/components/landing/DashboardPreview";
import LPVisitTracker from "@/components/landing/LPVisitTracker";
import LPBaseline from "@/components/landing/LPBaseline";
import HeroSocialProof from "@/components/landing/HeroSocialProof";

/**
 * Feature flag for the new dub.co-inspired LP baseline. Values:
 *   "off"    — legacy below-fold (default; zero risk to live ads)
 *   "live"   — render new <LPBaseline /> for all traffic
 *
 * See docs/planning/lp-baseline-upgrade.md
 */
const LP_BASELINE_V2 = process.env.NEXT_PUBLIC_LP_BASELINE_V2 ?? "off";

interface Props {
  params: Promise<{ variant: string }>;
  searchParams: Promise<{ c?: string; creative?: string }>;
}

export function generateStaticParams() {
  // Pre-renders the seed variants at build. Runtime variants (Claude-promoted)
  // fall through Next.js's default dynamicParams=true and render on first hit.
  return VARIANTS.map((v) => ({ variant: v.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { variant } = await params;
  let v = findVariant(variant);
  if (!v) v = await findRuntimeVariant(variant);
  if (!v) return { title: "MomFluence" };
  return {
    title: `${v.label} — MomFluence`,
    description: v.hero.subhead,
    robots: { index: false, follow: false }, // LPs are paid-traffic only; keep out of search
  };
}

export default async function LandingPage({ params, searchParams }: Props) {
  const { variant } = await params;
  const sp = await searchParams;
  // Seed variants (code-defined) first; fall back to runtime variants (Claude-promoted).
  let v = findVariant(variant);
  if (!v) v = await findRuntimeVariant(variant);
  if (!v) notFound();

  const creative = sanitize(sp.c ?? sp.creative) ?? v.primaryCreativeId;
  // Attribution carries forward to /signup so cookie-less browsers still get tagged.
  const signupHref = `/signup?lp=${encodeURIComponent(v.slug)}&c=${encodeURIComponent(creative)}`;
  const useBaselineV2 = LP_BASELINE_V2 === "live";

  return (
    <main className="mx-auto max-w-3xl px-6 pt-4 pb-16 sm:pt-6 lg:pt-10">
      <LPVisitTracker variant={v.slug} />

      {/*
        Hero — variant-specific. Sized down one notch from the
        homepage hero (which uses text-5xl at lg) because LP variants
        have longer 2- and 3-line headlines, and on shorter viewports
        the brand ribbon + social proof get pushed below the fold
        otherwise. Goal: ribbon ALWAYS sits above the fold on a
        typical iPhone (740 visible) and a normal laptop (840+).
      */}
      <p className="text-xs uppercase tracking-widest text-coral-600 font-semibold sm:text-sm">
        {v.hero.eyebrow}
      </p>
      <h1
        className="mt-1 whitespace-pre-line text-balance text-2xl sm:mt-2 sm:text-3xl lg:text-4xl text-navy-900"
        dangerouslySetInnerHTML={{ __html: v.hero.headline.replace(/\n/g, "<br />") }}
      />
      <p
        className="mt-2 text-sm sm:mt-3 sm:text-base lg:text-lg text-navy-600"
        dangerouslySetInnerHTML={{ __html: v.hero.subhead }}
      />

      <div className="mt-4 flex flex-wrap gap-3 sm:mt-5 sm:gap-4 lg:mt-7">
        <Link href={signupHref} className="btn-primary no-underline">
          {v.hero.ctaPrimary}
        </Link>
        <Link href="/how-it-works" className="btn-ghost no-underline">
          {v.hero.ctaSecondary}
        </Link>
      </div>

      <HeroSocialProof />

      <BrandRibbon />

      {useBaselineV2 && (
        <LPBaseline
          variantSlug={v.slug}
          signupHref={signupHref}
          closer={{
            headline: v.closer.headline,
            subhead: v.closer.subhead,
            ctaPrimary: v.hero.ctaPrimary,
          }}
        />
      )}

      {/* Legacy below-fold (rendered ONLY when LP_BASELINE_V2 != "live") */}
      {!useBaselineV2 && (
      <>
      {/* Below-fold proof: dashboard receipts */}
      <section className="mt-20">
        <p className="text-xs uppercase tracking-widest text-coral-600 font-semibold">
          Real numbers
        </p>
        <h2 className="mt-2 text-3xl text-navy-900">
          This is what a typical first-month member earns.
        </h2>
        <p className="mt-3 text-base text-navy-600">
          Numbers below are an example week. Yours could be higher or lower —
          depends how often you share.
        </p>

        <div className="mt-8 flex justify-center">
          <DashboardPreview />
        </div>
      </section>

      {/* "How it works" — LCD-friendly, three steps */}
      <section className="mt-20">
        <h2 className="text-3xl text-navy-900">How it works</h2>
        <div className="mt-8 space-y-5">
          <Step
            n={1}
            title="Pick a brand from your dashboard"
            body="50+ real brands you already know — HBO Max, Sephora, Target, Walmart, Hulu, and more."
          />
          <Step
            n={2}
            title="Share the tracked link"
            body="In a text, a Reddit comment, a Pinterest pin, a TikTok caption — anywhere people might want to know."
          />
          <Step
            n={3}
            title="Get paid every time someone signs up or buys"
            body="20–60% of every monthly subscription, recurring. Sometimes for life of the customer."
          />
        </div>
      </section>

      {/* Below-fold conditional: full vs lean */}
      {v.belowFold === "full" && (
        <section className="mt-20">
          <h2 className="text-3xl text-navy-900">No following? No problem.</h2>
          <p className="mt-4 text-base text-navy-700">
            You don&apos;t need followers. You don&apos;t need to make videos.
            You don&apos;t even need to tell your friends what you&apos;re doing.
            Drop your link in any of these places — strangers click for years to come:
          </p>
          <ul className="mt-4 grid gap-2 text-base text-navy-700 sm:grid-cols-2">
            <li className="flex gap-2"><span className="text-coral-500">→</span> Reddit threads</li>
            <li className="flex gap-2"><span className="text-coral-500">→</span> Pinterest pins</li>
            <li className="flex gap-2"><span className="text-coral-500">→</span> YouTube comments</li>
            <li className="flex gap-2"><span className="text-coral-500">→</span> Niche Facebook groups</li>
            <li className="flex gap-2"><span className="text-coral-500">→</span> Quora answers</li>
            <li className="flex gap-2"><span className="text-coral-500">→</span> Forum threads</li>
            <li className="flex gap-2"><span className="text-coral-500">→</span> Discord servers</li>
            <li className="flex gap-2"><span className="text-coral-500">→</span> A faceless TikTok account</li>
          </ul>
        </section>
      )}

      {/* Membership requirement callout — appears on every LP */}
      <section className="mt-20 rounded-2xl bg-coral-50 p-6 ring-1 ring-coral-200">
        <p className="text-sm text-navy-800">
          <span className="font-semibold text-coral-700">Heads up:</span> an
          active <span className="font-semibold">$5/mo membership</span> is
          required to earn commissions. If it lapses, earnings pause until you
          reactivate. Cancel anytime.
        </p>
      </section>

      {/* Closing CTA — variant voice */}
      <section className="mt-24 rounded-3xl bg-navy-900 p-10 text-center sm:p-14">
        <h2 className="text-4xl text-white">{v.closer.headline}</h2>
        <p className="mt-4 text-base text-navy-200">{v.closer.subhead}</p>
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <Link href={signupHref} className="btn-primary no-underline">
            {v.hero.ctaPrimary}
          </Link>
          <Link
            href="/how-it-works"
            className="inline-flex items-center justify-center rounded-xl border border-navy-700 bg-transparent px-5 py-3 font-medium text-navy-100 transition hover:bg-navy-800 no-underline"
          >
            How it works →
          </Link>
        </div>
      </section>
      </>
      )}
    </main>
  );
}

function Step({ n, title, body }: { n: number; title: string; body: string }) {
  return (
    <div className="flex items-start gap-4">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-coral-100 text-base font-bold text-coral-700">
        {n}
      </span>
      <div>
        <h3 className="text-lg text-navy-900">{title}</h3>
        <p className="mt-1 text-base text-navy-700">{body}</p>
      </div>
    </div>
  );
}

function sanitize(v: string | undefined): string | undefined {
  if (!v) return undefined;
  return /^[a-z0-9-]{1,40}$/.test(v) ? v : undefined;
}
