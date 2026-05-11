import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SEED_POSTS, type PostImageConfig } from "@/lib/fb-page/seed-content";

/**
 * Renders a single FB Page seed post as a clean 1080×1080 image, intended
 * to be screenshotted by /api/render/post/[slug] for upload to Meta.
 *
 * Same visual language as the funnel-lab creative renderer at
 * /render/creative/[slug]: full-bleed background, centered Playfair display
 * headline, optional DM Sans body, subtle footer. Drives off the typed
 * SeedPost array in lib/fb-page/seed-content.ts.
 */

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "render",
  robots: { index: false, follow: false },
};

interface Props { params: Promise<{ slug: string }> }

function bgStyles(bg: PostImageConfig["bg"]): string {
  switch (bg) {
    case "coral":               return "bg-coral-500";
    case "navy":                return "bg-navy-900";
    case "cream":               return "bg-amber-50";
    case "warm-gradient":       return "bg-gradient-to-br from-coral-100 via-amber-50 to-white";
    case "navy-coral-gradient": return "bg-gradient-to-br from-navy-900 via-navy-800 to-coral-700";
    case "white-coral-ring":    return "bg-white";
  }
}

function resolveDisplayColor(image: PostImageConfig): string {
  if (image.displayColor) {
    return image.displayColor === "white" ? "text-white"
         : image.displayColor === "coral" ? "text-coral-600"
         : "text-navy-900";
  }
  // sensible defaults per background
  if (image.bg === "coral" || image.bg === "navy" || image.bg === "navy-coral-gradient") return "text-white";
  return "text-navy-900";
}

function bodyColor(image: PostImageConfig): string {
  if (image.bg === "coral" || image.bg === "navy" || image.bg === "navy-coral-gradient") return "text-white/90";
  return "text-navy-700";
}

function eyebrowColor(image: PostImageConfig): string {
  if (image.bg === "coral" || image.bg === "navy" || image.bg === "navy-coral-gradient") return "text-coral-200";
  return "text-coral-700";
}

function footerColor(image: PostImageConfig): string {
  if (image.bg === "coral" || image.bg === "navy" || image.bg === "navy-coral-gradient") return "text-white/60";
  return "text-navy-500";
}

export default async function PostRenderPage({ params }: Props) {
  const { slug } = await params;
  const post = SEED_POSTS.find((p) => p.slug === slug);
  if (!post) notFound();

  const image = post.image;
  const isWhiteRing = image.bg === "white-coral-ring";

  return (
    <>
      <style>{`
        html, body { margin: 0; padding: 0; background: #fff; }
        body { width: 1080px; height: 1080px; overflow: hidden; }
      `}</style>

      <div
        data-post-export="1"
        className={`relative flex h-[1080px] w-[1080px] flex-col items-center justify-center px-24 py-20 ${bgStyles(image.bg)}`}
        style={{ fontFamily: '"DM Sans", system-ui, sans-serif' }}
      >
        {/* Subtle decorative blob for non-flat backgrounds */}
        {(image.bg === "coral" || image.bg === "navy-coral-gradient") && (
          <div className="absolute -right-40 -top-40 h-[36rem] w-[36rem] rounded-full bg-white/10 blur-3xl" />
        )}

        {/* Coral ring for the white-coral-ring variant */}
        {isWhiteRing && (
          <div className="pointer-events-none absolute inset-12 rounded-[48px] ring-[6px] ring-coral-500" />
        )}

        {/* Accent badge — top-right corner chip (e.g. "$5", "$25") */}
        {image.accentBadge && (
          <div className="absolute right-20 top-20 flex h-32 w-32 items-center justify-center rounded-full bg-white shadow-2xl ring-4 ring-coral-500">
            <span className="font-display text-5xl font-bold text-coral-600" style={{ fontFamily: '"Playfair Display", serif' }}>
              {image.accentBadge}
            </span>
          </div>
        )}

        <div className="relative flex w-full max-w-[860px] flex-col items-center text-center">
          {image.eyebrow && (
            <p className={`mb-8 text-xl font-bold uppercase tracking-[0.3em] ${eyebrowColor(image)}`}>
              {image.eyebrow}
            </p>
          )}

          <h1
            className={`whitespace-pre-line font-display text-[88px] font-bold leading-[1.05] ${resolveDisplayColor(image)}`}
            style={{ fontFamily: '"Playfair Display", serif' }}
          >
            {image.display}
          </h1>

          {image.body && (
            <p className={`mt-10 max-w-3xl text-3xl leading-snug ${bodyColor(image)}`}>
              {image.body}
            </p>
          )}
        </div>

        {image.footer && (
          <div className="absolute bottom-16 left-0 right-0 text-center">
            <p className={`text-lg font-medium tracking-wide ${footerColor(image)}`}>
              {image.footer}
            </p>
          </div>
        )}
      </div>
    </>
  );
}
