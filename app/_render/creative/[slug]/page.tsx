import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { findVariant } from "@/lib/funnel-lab/variants";
import { findRuntimeVariant } from "@/lib/funnel-lab/runtime-variants";

/**
 * Renders a single funnel-lab variant as a clean 1080×1080 ad creative.
 * Designed to be screenshotted by /api/render/creative/[slug] — strips all
 * navigation, body margin, etc.
 *
 * Resolves variant by slug from:
 *   1. The seed VARIANTS array (code-defined, c11-c20 hooks)
 *   2. The funnel_variants Supabase table (Claude-generated runtime variants)
 *
 * Path lives under /_render/ so it's clearly internal — noindex'd.
 */

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "render",
  robots: { index: false, follow: false },
};

interface Props { params: Promise<{ slug: string }> }

interface VariantLike {
  slug: string;
  label: string;
  angle: string;
  hero: {
    eyebrow: string;
    headline: string;
    subhead: string;
    ctaPrimary: string;
  };
  closer: {
    headline: string;
    subhead: string;
  };
}

export default async function CreativeRenderPage({ params }: Props) {
  const { slug } = await params;

  let v: VariantLike | undefined = findVariant(slug);
  if (!v) {
    v = await findRuntimeVariant(slug);
  }
  if (!v) notFound();

  return (
    <>
      <style>{`
        html, body { margin: 0; padding: 0; background: #fff; }
        body { width: 1080px; height: 1080px; overflow: hidden; }
        .creative-root { font-family: 'DM Sans', system-ui, sans-serif; }
      `}</style>
      <div
        data-creative-export="1"
        className="creative-root relative flex h-[1080px] w-[1080px] flex-col justify-between bg-gradient-to-br from-coral-50 via-white to-amber-50 p-14"
      >
        <div className="absolute -right-32 -top-32 h-[28rem] w-[28rem] rounded-full bg-coral-300 opacity-30 blur-3xl" />

        <div className="relative">
          <p className="text-2xl font-bold uppercase tracking-[0.2em] text-coral-700">
            {v.hero.eyebrow}
          </p>
          <h1
            className="mt-5 whitespace-pre-line font-display text-7xl leading-[1.05] text-navy-900"
            style={{ fontFamily: '"Playfair Display", serif' }}
            dangerouslySetInnerHTML={{ __html: v.hero.headline.replace(/\n/g, "<br />") }}
          />
          <p
            className="mt-6 max-w-3xl text-2xl leading-snug text-navy-700"
            dangerouslySetInnerHTML={{ __html: v.hero.subhead }}
          />
        </div>

        <div className="relative grid grid-cols-5 gap-3">
          {[
            { n: "Sephora",   bg: "bg-black",       fg: "text-white" },
            { n: "Target",    bg: "bg-red-600",     fg: "text-white" },
            { n: "HBO Max",   bg: "bg-purple-700",  fg: "text-white" },
            { n: "Hulu",      bg: "bg-green-500",   fg: "text-white" },
            { n: "Walmart",   bg: "bg-blue-600",    fg: "text-yellow-300" },
          ].map((b) => (
            <div key={b.n} className="flex items-center gap-2 rounded-2xl bg-white p-3 ring-2 ring-navy-100 shadow-sm">
              <span className={`flex h-12 w-12 items-center justify-center rounded-full text-2xl font-bold ${b.bg} ${b.fg}`}>
                {b.n.charAt(0)}
              </span>
              <span className="text-xl font-bold text-navy-900">{b.n}</span>
            </div>
          ))}
        </div>

        <div className="relative rounded-3xl bg-navy-900 p-10 text-center text-white shadow-2xl">
          <p
            className="font-display text-5xl font-bold leading-tight"
            style={{ fontFamily: '"Playfair Display", serif' }}
          >
            {v.closer.headline}
          </p>
          <p className="mt-3 text-xl text-navy-200">{v.closer.subhead}</p>
          <div className="mt-6 inline-block rounded-2xl bg-coral-500 px-7 py-3 ring-2 ring-coral-300">
            <p className="font-display text-3xl font-bold" style={{ fontFamily: '"Playfair Display", serif' }}>
              {v.hero.ctaPrimary}
            </p>
          </div>
          <p className="mt-3 text-base text-navy-300">momfluence.app/lp/{v.slug}</p>
        </div>
      </div>
    </>
  );
}
