type Brand = { name: string; mark: string; bg: string; fg: string };

const BRANDS: Brand[] = [
  { name: "Sephora",   mark: "S",  bg: "bg-black",         fg: "text-white" },
  { name: "Target",    mark: "T",  bg: "bg-red-600",       fg: "text-white" },
  { name: "Walmart",   mark: "W",  bg: "bg-blue-600",      fg: "text-yellow-300" },
  { name: "Amazon",    mark: "a",  bg: "bg-[#232f3e]",     fg: "text-orange-400" },
  { name: "HBO Max",   mark: "M",  bg: "bg-purple-700",    fg: "text-white" },
  { name: "Hulu",      mark: "h",  bg: "bg-green-500",     fg: "text-white" },
  { name: "Netflix",   mark: "N",  bg: "bg-red-700",       fg: "text-white" },
  { name: "Disney+",   mark: "D",  bg: "bg-blue-800",      fg: "text-white" },
  { name: "Spotify",   mark: "S",  bg: "bg-green-600",     fg: "text-black" },
  { name: "Nordstrom", mark: "N",  bg: "bg-navy-900",      fg: "text-white" },
  { name: "Etsy",      mark: "E",  bg: "bg-orange-500",    fg: "text-white" },
  { name: "Wayfair",   mark: "W",  bg: "bg-purple-900",    fg: "text-white" },
  { name: "Ulta",      mark: "U",  bg: "bg-pink-500",      fg: "text-white" },
  { name: "Old Navy",  mark: "O",  bg: "bg-blue-900",      fg: "text-white" },
  { name: "Chewy",     mark: "C",  bg: "bg-blue-500",      fg: "text-white" },
];

function Chip({ b }: { b: Brand }) {
  return (
    <div className="flex shrink-0 items-center gap-3 rounded-full bg-white px-4 py-2 ring-1 ring-navy-100 shadow-sm">
      <span
        className={`flex h-7 w-7 items-center justify-center rounded-full text-sm font-bold ${b.bg} ${b.fg}`}
        aria-hidden="true"
      >
        {b.mark}
      </span>
      <span className="text-sm font-semibold text-navy-800 whitespace-nowrap">{b.name}</span>
    </div>
  );
}

export default function BrandRibbon() {
  const loop = [...BRANDS, ...BRANDS];
  return (
    <section
      aria-label="Featured brand partners"
      className="relative mt-16 -mx-6 overflow-hidden border-y border-navy-100 bg-navy-50/60 py-6"
    >
      <div
        className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-navy-50 to-transparent"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-navy-50 to-transparent"
        aria-hidden="true"
      />
      <div className="ribbon-track flex w-max gap-3 px-6">
        {loop.map((b, i) => (
          <Chip key={`${b.name}-${i}`} b={b} />
        ))}
      </div>
      <p className="mt-4 text-center text-xs uppercase tracking-widest text-navy-500">
        50+ vetted brand partners · new offers added weekly
      </p>
    </section>
  );
}
