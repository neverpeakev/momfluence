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
  if (variant !== "icon" && variant !== "wordmark" && variant !== "cover") notFound();

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

  if (variant === "cover") {
    // FB Page cover photo: 1640×924. The display safe zone (visible on both
    // desktop and mobile) is the center ~1280×640. Headline + subhead sit in
    // that zone; notification mockup is on the right side of the safe zone.
    return (
      <>
        <style>{`
          html, body { margin: 0; padding: 0; }
          body { width: 1640px; height: 924px; overflow: hidden;
                 background: linear-gradient(135deg, #1c2541 0%, #141a30 60%, #0e1325 100%); }
        `}</style>
        <div
          data-logo-export="1"
          className="relative flex h-[924px] w-[1640px] items-center"
          style={{ background: "linear-gradient(135deg, #1c2541 0%, #141a30 60%, #0e1325 100%)" }}
        >
          {/* soft coral glow top-right */}
          <div
            className="absolute"
            style={{
              top: -200, right: -200, width: 700, height: 700,
              background: "radial-gradient(circle, rgba(240,74,37,0.18) 0%, transparent 60%)",
              borderRadius: "50%",
            }}
          />
          {/* coral underline accent */}
          <div
            className="absolute"
            style={{
              left: 180, top: 380, width: 100, height: 6,
              background: "#f04a25", borderRadius: 3,
            }}
          />

          {/* Left column: tagline */}
          <div className="relative z-10 flex flex-col" style={{ marginLeft: 180, maxWidth: 820 }}>
            <span
              style={{
                fontFamily: '"DM Sans", sans-serif',
                fontSize: 22,
                fontWeight: 600,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: "#ff8d6f",
                marginBottom: 24,
              }}
            >
              Momfluence
            </span>
            <span
              style={{
                fontFamily: '"Playfair Display", serif',
                fontSize: 92,
                fontWeight: 700,
                lineHeight: 1.05,
                letterSpacing: "-0.02em",
                color: "#ffffff",
              }}
            >
              Your group chat
              <br />
              is already worth
              <br />
              <span style={{ color: "#ff8d6f" }}>$24.</span>
            </span>
            <span
              style={{
                fontFamily: '"DM Sans", sans-serif',
                fontSize: 28,
                fontWeight: 400,
                lineHeight: 1.4,
                color: "#a8b4d4",
                marginTop: 36,
                maxWidth: 720,
              }}
            >
              Real brand partnerships for moms.
              <br />
              No followers needed.
            </span>
          </div>

          {/* Right column: iOS-style notification card */}
          <div
            className="relative z-10"
            style={{ marginLeft: "auto", marginRight: 160, width: 460 }}
          >
            <div
              style={{
                background: "rgba(255,255,255,0.95)",
                borderRadius: 28,
                padding: "26px 28px",
                boxShadow: "0 25px 60px rgba(0,0,0,0.35), 0 8px 20px rgba(240,74,37,0.15)",
                backdropFilter: "blur(20px)",
                transform: "rotate(-2deg)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", marginBottom: 16 }}>
                <div
                  style={{
                    width: 44, height: 44,
                    background: "#1c2541",
                    borderRadius: 10,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginRight: 14,
                  }}
                >
                  <span
                    style={{
                      fontFamily: '"Playfair Display", serif',
                      fontSize: 28,
                      fontWeight: 700,
                      color: "#f04a25",
                      lineHeight: 1,
                    }}
                  >
                    M
                  </span>
                </div>
                <div style={{ flex: 1, fontFamily: '"DM Sans", sans-serif' }}>
                  <div style={{ fontSize: 15, fontWeight: 600, color: "#141a30" }}>
                    Momfluence
                  </div>
                  <div style={{ fontSize: 13, color: "#6b7a99" }}>now</div>
                </div>
              </div>
              <div
                style={{
                  fontFamily: '"DM Sans", sans-serif',
                  fontSize: 22,
                  fontWeight: 700,
                  color: "#141a30",
                  lineHeight: 1.25,
                  marginBottom: 6,
                }}
              >
                You earned a commission
              </div>
              <div
                style={{
                  fontFamily: '"DM Sans", sans-serif',
                  fontSize: 17,
                  color: "#3a4f87",
                  lineHeight: 1.4,
                }}
              >
                $24.50 from Sephora Beauty &mdash; tap to view
              </div>
            </div>
            <div
              style={{
                fontFamily: '"DM Sans", sans-serif',
                fontSize: 18,
                fontWeight: 500,
                color: "#92a2c4",
                textAlign: "center",
                marginTop: 32,
                letterSpacing: "0.02em",
              }}
            >
              momfluence.app
            </div>
          </div>
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
