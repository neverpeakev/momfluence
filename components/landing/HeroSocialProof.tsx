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
 * swapped for a real count once we have 100+ real members. Future me
 * (and Kevin), pls do not regret this — the founder-framing reads
 * aspirational, not apologetic.
 *
 * AVATAR DECISION:
 * We're not using fake photo avatars (uifaces.co, generated.photos, etc.)
 * — those look modern but a) feel manipulative when they're not real
 * users and b) AI-generated avatars are flagged by Meta now. Instead we
 * use stylized gradient circles with initials, which read as
 * "placeholders by design" rather than "fake users by deception." When
 * we onboard real momfluencers with photos + consent, this component
 * can swap to <Image src={...} /> tiles.
 */

const AVATARS = [
  { initial: "J", gradient: "from-coral-400 to-coral-600" },
  { initial: "M", gradient: "from-navy-500 to-navy-700" },
  { initial: "S", gradient: "from-amber-400 to-amber-600" },
  { initial: "L", gradient: "from-coral-300 to-coral-500" },
  { initial: "A", gradient: "from-navy-400 to-navy-600" },
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
        {AVATARS.map((a, i) => (
          <div
            key={i}
            className={`flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br ${a.gradient} ring-2 ring-white text-sm font-semibold text-white`}
            aria-hidden="true"
          >
            {a.initial}
          </div>
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
