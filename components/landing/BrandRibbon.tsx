/**
 * BrandRibbon — horizontal marquee of MomFluence's brand partners.
 *
 * Renders a continuously scrolling row of wordmark chips below the hero on
 * the homepage and every /lp/<variant> landing page. The marquee is paused
 * on hover and disabled under prefers-reduced-motion (see app/globals.css
 * .ribbon-track keyframes).
 *
 * Visual approach: each chip is a clean white pill with the brand's full
 * wordmark text styled in its primary color and brand-appropriate
 * typography (uppercase Netflix-style, lowercase Amazon-style, bold/black
 * weight per brand). This is intentionally NOT just letter chips — those
 * looked amateur and read as generic logos. Real wordmarks render as
 * "Sephora knows me" in the user's eye, the way the homepage on a
 * legitimate consumer site should feel.
 *
 * Why no inline SVG paths for each brand: about half the brands in our
 * catalog (Sephora, Walmart, Ulta, Old Navy, Nordstrom, Chewy, Wayfair)
 * aren't on Simple Icons or other free SVG libraries, and individually
 * sourcing trademarked SVG wordmarks for 15+ brands is both legally
 * fraught and visually inconsistent. The brand-color-text-on-white
 * approach is a recognized convention (Y Combinator's portfolio wall,
 * Vercel's "trusted by" section, dub.co's "migrated off" row) and
 * sidesteps both problems.
 */

type Brand = {
  /** The brand's true name — used for the accessible aria-label. */
  name: string;
  /** Display string — usually a styled version of the name (case, punctuation). */
  display: string;
  /** Tailwind text color class for the wordmark, scoped to the brand's primary color. */
  color: string;
  /** Optional extra classes for typography overrides (italic, weight, tracking, etc.). */
  className?: string;
};

const BRANDS: Brand[] = [
  { name: "Sephora",   display: "SEPHORA",   color: "text-black",         className: "font-bold tracking-tight" },
  { name: "Target",    display: "Target",    color: "text-[#cc0000]",     className: "font-bold" },
  { name: "Walmart",   display: "Walmart",   color: "text-[#0071ce]",     className: "font-bold" },
  { name: "Amazon",    display: "amazon",    color: "text-[#232f3e]",     className: "font-extrabold tracking-tight" },
  { name: "HBO Max",   display: "HBO Max",   color: "text-black",         className: "font-bold tracking-tight" },
  { name: "Hulu",      display: "hulu",      color: "text-[#1ce783]",     className: "font-black tracking-tighter" },
  { name: "Netflix",   display: "NETFLIX",   color: "text-[#e50914]",     className: "font-black tracking-tight" },
  { name: "Disney+",   display: "Disney+",   color: "text-[#013974]",     className: "font-bold" },
  { name: "Spotify",   display: "Spotify",   color: "text-[#1ed760]",     className: "font-bold" },
  { name: "Nordstrom", display: "NORDSTROM", color: "text-black",         className: "font-bold tracking-widest" },
  { name: "Etsy",      display: "Etsy",      color: "text-[#f56400]",     className: "font-bold italic" },
  { name: "Wayfair",   display: "wayfair",   color: "text-[#7b2c9d]",     className: "font-bold" },
  { name: "Ulta",      display: "ULTA",      color: "text-[#d3145f]",     className: "font-bold tracking-wider" },
  { name: "Old Navy",  display: "OLD NAVY",  color: "text-[#003366]",     className: "font-bold tracking-tight" },
  { name: "Chewy",     display: "Chewy",     color: "text-[#003394]",     className: "font-bold" },
];

function Chip({ b }: { b: Brand }) {
  return (
    <div
      aria-label={b.name}
      className="flex shrink-0 items-center justify-center rounded-2xl bg-white px-6 py-3 ring-1 ring-navy-100 shadow-sm transition hover:shadow-md hover:-translate-y-0.5"
    >
      <span className={`text-xl ${b.color} ${b.className ?? ""}`}>
        {b.display}
      </span>
    </div>
  );
}

export default function BrandRibbon() {
  // Duplicate the brand list so the marquee can scroll seamlessly: when the
  // first half scrolls off-screen, the second (identical) half is already in
  // place. The CSS animation translates by -50% so it loops without a jump.
  const loop = [...BRANDS, ...BRANDS];

  return (
    <section
      aria-label="Featured brand partners"
      className="relative mt-16 -mx-6 overflow-hidden border-y border-navy-100 bg-navy-50/40 py-8"
    >
      {/* Left edge fade — softens the cut-off so chips appear to materialize. */}
      <div
        className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24 bg-gradient-to-r from-navy-50 to-transparent"
        aria-hidden="true"
      />
      {/* Right edge fade — same on the trailing side. */}
      <div
        className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24 bg-gradient-to-l from-navy-50 to-transparent"
        aria-hidden="true"
      />
      <div className="ribbon-track flex w-max gap-4 px-6">
        {loop.map((b, i) => (
          <Chip key={`${b.name}-${i}`} b={b} />
        ))}
      </div>
      <p className="mt-6 text-center text-xs uppercase tracking-widest text-navy-500">
        50+ vetted brand partners · new offers added weekly
      </p>
    </section>
  );
}
