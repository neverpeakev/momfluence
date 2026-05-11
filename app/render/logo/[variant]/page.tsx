import type { Metadata } from "next";
import { notFound } from "next/navigation";

/**
 * Renderable brand-mark pages. Two variants:
 *
 *   /render/logo/icon       → 1024×1024 square. Full-bleed navy with the
 *                             coral "M" wordmark. Source of truth for the
 *                             FB Page profile photo, Meta Brand Guidelines
 *                             "icon" slot, Stripe Dashboard logo, etc.
 *
 *   /render/logo/wordmark   → 1200×400 horizontal. Transparent background
 *                             (omitBackground=true on the PNG endpoint) so
 *                             the wordmark composites cleanly on any bg.
 *                             "Momfluence" set in Playfair Display navy.
 *
 * Driven by /api/render/logo/<variant>.png — Chromium screenshots the
 * data-logo-export element on these pages and returns the PNG.
 *
 * To evolve the brand mark: edit this file. The endpoint URLs stay stable
 * so existing references in Meta / Stripe / Slack / etc keep working.
 */

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "logo",
  robots: { index: false, follow: false },
};

interface Props { params: Promise<{ variant: string }> }

export default async function LogoRenderPage({ params }: Props) {
  const { variant } = await params;
  if (variant !== "icon" && variant !== "wordmark") notFound();

  if (variant === "icon") {
    return (
      <>
        <style>{`
          html, body { margin: 0; padding: 0; background: #fff; }
          body { width: 1024px; height: 1024px; overflow: hidden; }
        `}</style>
        <div
          data-logo-export="1"
          className="flex h-[1024px] w-[1024px] items-center justify-center bg-navy-900"
        >
          {/* The "M" sits ~50% of canvas height, optically centered. Playfair
              Display has a slight visual lean toward the upper-right, so we
              translate down a touch to compensate. */}
          <span
            className="font-display font-bold text-coral-500"
            style={{
              fontFamily: '"Playfair Display", serif',
              fontSize: "640px",
              lineHeight: 1,
              transform: "translateY(40px)",
            }}
          >
            M
          </span>
        </div>
      </>
    );
  }

  // wordmark
  return (
    <>
      <style>{`
        html, body { margin: 0; padding: 0; }
        /* No body bg — endpoint passes omitBackground:true so the PNG is
           transparent and the wordmark composites onto any color. */
        body { width: 1200px; height: 400px; overflow: hidden; }
      `}</style>
      <div
        data-logo-export="1"
        className="flex h-[400px] w-[1200px] items-center justify-center"
      >
        <span
          className="font-display font-bold text-navy-900"
          style={{
            fontFamily: '"Playfair Display", serif',
            fontSize: "200px",
            lineHeight: 1,
            letterSpacing: "-0.02em",
          }}
        >
          Momfluence
        </span>
      </div>
    </>
  );
}
