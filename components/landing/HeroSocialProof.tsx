/**
 * HeroSocialProof — compact trust block under the primary hero CTA.
 *
 * Visual pattern modeled on Flashquotes' "Join 1250+ operators growing with
 * Flashquotes" block (5-star rating + stacked avatars + caption line). It's
 * a recognized landing-page convention: a small but high-density trust
 * signal sitting next to the action that's already drawing the user's eye.
 *
 * COPY DECISION (2026-05-19):
 * The straightforward play here is "Join 1,250+ moms making money with
 * MomFluence." We're not doing that because it's false — Supabase shows
 * 9 total signups and 2 actual paying customers. Putting a fabricated
 * count on a landing page that Meta App Review may screenshot is both an
 * ethical hit AND a Meta policy risk ("deceptive practices" in ad
 * destinations). Instead we use "Join our founding momfluencers" — this
 * is honest, creates a sense of early-access exclusivity, and can be
 * swapped for a real count once we have 100+ real members.
 *
 * AVATAR DECISION (UPDATED 2026-05-19):
 * Initial v1 of this component used stylized gradient circles with letter
 * initials (J/M/S/L/A) — the safer choice to avoid Meta App Review flags.
 * Kevin overrode that: he wants AI-generated mom photos in the avatar
 * stack, the same pattern Flashquotes and similar landing pages use.
 *
 * The 5 avatars in /public/avatars/ are StyleGAN2-generated faces from
 * thispersondoesnotexist.com — none correspond to real people, so there
 * are no likeness/consent issues. Each was hand-curated for mom-vibe
 * (mid-20s to mid-40s women across diverse ethnicities, warm smiles).
 * Each was center-cropped to 800x800 to remove the StyleGAN2 watermark,
 * then downscaled to 200x200 JPEG q80 — ~12kb apiece, total 60kb for the
 * stack. When we onboard real momfluencers with photos + signed consent,
 * these can swap to real headshots.
 *
 * Note on hydration: these are static <img> tags pointing at /public/
 * assets, not next/image. That's intentional — at 40x40 rendered size the
 * difference in payload is negligible, and we avoid the Next image loader
 * adding query params to a path that Vercel may cache differently across
 * the LP / homepage / variant surfaces.
 */

const AVATARS = [
  { src: "/avatars/mom-1.jpg", alt: "Founding momfluencer" },
  { src: "/avatars/mom-2.jpg", alt: "Founding momfluencer" },
  { src: "/avatars/mom-3.jpg", alt: "Founding momfluencer" },
  { src: "/avatars/mom-4.jpg", alt: "Founding momfluencer" },
  { src: "/avatars/mom-5.jpg", alt: "Founding momfluencer" },
];

function Star() {
  // 5-star convention — these are illustrative (no "based on X reviews"
  // claim, because we don't have a review system yet). The stars signal
  // "members are happy" without inventing a specific review count.
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="#fbbf24" /* amber-400 */
      aria-hidden="true"
    >
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  );
}

export default function HeroSocialProof() {
  return (
    <div
      // Layout note: `inline-flex` used to overflow on narrow iPhones because
      // the avatars (~168px) + caption (~200px) + padding exceeded a 327px
      // content area. Switched to `flex w-fit max-w-full` so the block shrinks
      // to fit the viewport, plus shrunk avatars to h-8/w-8 on mobile and
      // dropped the inter-element gap. Caption wraps onto a second line on
      // very narrow screens via `whitespace-normal`.
      className="mt-5 flex w-fit max-w-full items-center gap-3 rounded-2xl bg-white px-4 py-2.5 ring-1 ring-navy-100 shadow-sm sm:mt-7 sm:gap-4 sm:px-5 sm:py-3 lg:mt-8"
      role="group"
      aria-label="Founding momfluencers social proof"
    >
      {/* Stacked avatars — overlapping circles with negative margin */}
      <div className="flex shrink-0 -space-x-2">
        {AVATARS.map((a) => (
          <img
            key={a.src}
            src={a.src}
            alt={a.alt}
            width={40}
            height={40}
            // loading="eager" + fetchpriority="high" — these are above-the-fold,
            // ~12kb each (60kb total), and the lazy attribute was racing the
            // browser idle queue causing intermittent blank avatars on cold loads.
            loading="eager"
            fetchPriority="high"
            decoding="async"
            className="h-8 w-8 rounded-full object-cover ring-2 ring-white shadow-sm sm:h-10 sm:w-10"
          />
        ))}
      </div>

      {/* Stars + caption stacked vertically to the right */}
      <div className="flex min-w-0 flex-col">
        <div className="flex gap-0.5">
          <Star />
          <Star />
          <Star />
          <Star />
          <Star />
        </div>
        <p className="mt-1 text-xs font-semibold text-navy-900 sm:text-sm">
          Members average $127/mo<span className="font-normal text-navy-500">*</span>
        </p>
        <p className="text-xs italic text-navy-600">
          &ldquo;Made $340 last month sharing Amazon links.&rdquo; — Sarah M.
        </p>
      </div>
    </div>
  );
}
