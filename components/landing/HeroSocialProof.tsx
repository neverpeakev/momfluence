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
      className="mt-8 inline-flex items-center gap-4 rounded-2xl bg-white px-5 py-3 ring-1 ring-navy-100 shadow-sm"
      role="group"
      aria-label="Founding momfluencers social proof"
    >
      {/* Stacked avatars — overlapping circles with negative margin */}
      <div className="flex -space-x-2">
        {AVATARS.map((a) => (
          <img
            key={a.src}
            src={a.src}
            alt={a.alt}
            width={40}
            height={40}
            loading="lazy"
            decoding="async"
            className="h-10 w-10 rounded-full object-cover ring-2 ring-white shadow-sm"
          />
        ))}
      </div>

      {/* Stars + caption stacked vertically to the right */}
      <div className="flex flex-col">
        <div className="flex gap-0.5">
          <Star />
          <Star />
          <Star />
          <Star />
          <Star />
        </div>
        <p className="mt-1 text-sm font-medium text-navy-800">
          Join our founding momfluencers
        </p>
      </div>
    </div>
  );
}
