/* global window */
/**
 * Data mirrors of PR #41 sources:
 *   lib/landing/brand-wall-data.ts
 *   components/landing/sections/SectionMyriadWaysToShare.tsx CHANNELS
 *   components/landing/sections/SectionFAQ.tsx FAQS
 *
 * Engineering: do NOT edit copy here. Update the React source files;
 * this prototype mirror is regenerated on visual review only.
 */

window.LP_DATA = (() => {
  const VERTICALS = [
    { slug: "streaming",        label: "Streaming" },
    { slug: "beauty",           label: "Beauty" },
    { slug: "savings-apps",     label: "Savings apps" },
    { slug: "pet-food",         label: "Pet food" },
    { slug: "creator-tools",    label: "Creator tools" },
    { slug: "family-safety",    label: "Family safety" },
    { slug: "health",           label: "Health" },
    { slug: "home",             label: "Home" },
    { slug: "apps",             label: "Apps" },
    { slug: "food-and-drink",   label: "Food & drink" },
  ];

  const BRANDS = [
    { brand: "Hulu",         slug: "hulu",         vertical: "streaming",      payoutType: "cpa",       payoutDollars: 1.6 },
    { brand: "Paramount+",   slug: "paramount",    vertical: "streaming",      payoutType: "cpa",       payoutDollars: 7.2,  highlight: true },
    { brand: "Geologie",     slug: "geologie",     vertical: "beauty",         payoutType: "cpa",       payoutDollars: 10 },
    { brand: "Klarna",       slug: "klarna",       vertical: "savings-apps",   payoutType: "cpa",       payoutDollars: 35,   highlight: true },
    { brand: "Gizmogo",      slug: "gizmogo",      vertical: "savings-apps",   payoutType: "cpa",       payoutDollars: 5 },
    { brand: "Rita.ai",      slug: "rita",         vertical: "savings-apps",   payoutType: "rev_share", payoutDollars: null },
    { brand: "Open Farm",    slug: "openfarm",     vertical: "pet-food",       payoutType: "cpa",       payoutDollars: 60,   highlight: true },
    { brand: "Meow Mobile",  slug: "meowmobile",   vertical: "pet-food",       payoutType: "cpa",       payoutDollars: 25 },
    { brand: "Shopify",      slug: "shopify",      vertical: "creator-tools",  payoutType: "cpa",       payoutDollars: 50,   highlight: true },
    { brand: "Base44",       slug: "base44",       vertical: "creator-tools",  payoutType: "cpa",       payoutDollars: 50,   highlight: true },
    { brand: "TikTok",       slug: "tiktok",       vertical: "creator-tools",  payoutType: "cpa",       payoutDollars: 10 },
    { brand: "CapCut",       slug: "capcut",       vertical: "creator-tools",  payoutType: "rev_share", payoutDollars: null },
    { brand: "Riverside",    slug: "riverside",    vertical: "creator-tools",  payoutType: "rev_share", payoutDollars: null },
    { brand: "InVideo",      slug: "invideo",      vertical: "creator-tools",  payoutType: "rev_share", payoutDollars: null },
    { brand: "Namecheap",    slug: "namecheap",    vertical: "creator-tools",  payoutType: "cpa",       payoutDollars: 10 },
    { brand: "Hostinger",    slug: "hostinger",    vertical: "creator-tools",  payoutType: "rev_share", payoutDollars: null },
    { brand: "SSLs.com",     slug: "ssls",         vertical: "creator-tools",  payoutType: "rev_share", payoutDollars: null },
    { brand: "SentryPC",     slug: "sentrypc",     vertical: "family-safety",  payoutType: "cpa",       payoutDollars: 32 },
    { brand: "Sesame Care",  slug: "sesame",       vertical: "health",         payoutType: "cpl",       payoutDollars: 80,   highlight: true },
    { brand: "GTPLAYER",     slug: "gtplayer",     vertical: "home",           payoutType: "rev_share", payoutDollars: null },
    { brand: "Nexters",      slug: "nexters",      vertical: "apps",           payoutType: "cpl",       payoutDollars: 2 },
    { brand: "Wine Express", slug: "wineexpress",  vertical: "food-and-drink", payoutType: "cpa",       payoutDollars: 10 },
  ];

  // Letter-mark fallback colors keyed by slug — used until real SVGs ship to /public/lp-baseline/logos/<slug>.svg
  const BRAND_MARKS = {
    hulu:        { bg: "#1ce783", fg: "#0b3b1f", mark: "h" },
    paramount:   { bg: "#0064ff", fg: "#fff",    mark: "P+" },
    geologie:    { bg: "#1a1a1a", fg: "#ffd6a8", mark: "G" },
    klarna:      { bg: "#ffa8cd", fg: "#17120e", mark: "K" },
    gizmogo:     { bg: "#0a7d3a", fg: "#fff",    mark: "Gz" },
    rita:        { bg: "#5b3df5", fg: "#fff",    mark: "R" },
    openfarm:    { bg: "#3e6b3a", fg: "#fff",    mark: "OF" },
    meowmobile:  { bg: "#ff8e3c", fg: "#1c2541", mark: "M" },
    shopify:     { bg: "#7ab55c", fg: "#fff",    mark: "S" },
    base44:      { bg: "#141a30", fg: "#ff8d6f", mark: "B" },
    tiktok:      { bg: "#000",    fg: "#25f4ee", mark: "tt" },
    capcut:      { bg: "#000",    fg: "#fff",    mark: "Cc" },
    riverside:   { bg: "#9145ff", fg: "#fff",    mark: "Rv" },
    invideo:     { bg: "#2563eb", fg: "#fff",    mark: "iV" },
    namecheap:   { bg: "#de3723", fg: "#fff",    mark: "Nc" },
    hostinger:   { bg: "#673de6", fg: "#fff",    mark: "H" },
    ssls:        { bg: "#08c",    fg: "#fff",    mark: "SS" },
    sentrypc:    { bg: "#1f2a44", fg: "#ffd166", mark: "Sp" },
    sesame:      { bg: "#ffe2a8", fg: "#7c3a0d", mark: "Sc" },
    gtplayer:    { bg: "#dc2626", fg: "#fff",    mark: "GT" },
    nexters:     { bg: "#0ea5e9", fg: "#fff",    mark: "Nx" },
    wineexpress: { bg: "#5c1d12", fg: "#fff8e7", mark: "We" },
  };

  function payoutLabel(b) {
    if (b.payoutType === "rev_share") return "Recurring %";
    if (b.payoutDollars == null) return "—";
    if (b.payoutType === "cpl") return `$${b.payoutDollars.toFixed(0)} per lead`;
    return `$${b.payoutDollars.toFixed(b.payoutDollars % 1 === 0 ? 0 : 2)} per signup`;
  }

  const CHANNELS = [
    { icon: "💬", slug: "groupchats", name: "Group chats / iMessage",
      pitch: "The highest-converting place on Earth. One text to five close friends beats a thousand-follower IG story every time.",
      example: "“Y’all I finally found leggings that actually fit — link incoming”" },
    { icon: "👩‍👩‍👧", slug: "fbgroups", name: "School / mom Facebook groups",
      pitch: "Moms helping moms is the original engagement signal. A helpful link in a relevant thread can earn for years.",
      example: "“For anyone asking about pediatric melatonin alternatives — this is what we use”" },
    { icon: "🧵", slug: "reddit", name: "Reddit threads",
      pitch: "Answer a question with a tracked link. Reddit posts stay searchable forever, so one helpful comment earns for 18+ months.",
      example: "Reply to r/SkincareAddiction post about gentle moisturizers" },
    { icon: "📌", slug: "pinterest", name: "Pinterest pins",
      pitch: "Evergreen by design. One pin can keep paying you for a year and a half. Pinterest users are actively shopping.",
      example: "Pin: “Best Mother’s Day gifts under $50” with tracked links" },
    { icon: "🎬", slug: "tiktok", name: "TikTok comments (faceless)",
      pitch: "No camera, no following. Drop a helpful link in the comments of a viral “does anyone know where to get…” video.",
      example: "Reply to a viral “what’s that toy?” TikTok with the link" },
    { icon: "🏘️", slug: "nextdoor", name: "Nextdoor recommendations",
      pitch: "Neighborhood-level trust is unbeatable. Local moms are looking for recs, not ads — your link reads as helpful.",
      example: "“The cleaning service we use, link is here”" },
    { icon: "📧", slug: "email-sig", name: "Email signature",
      pitch: "Every email you already send. Add “p.s. I love these — get yours here” with one of your tracked links.",
      example: "Auto-appended to every PTA / work email you send" },
    { icon: "📺", slug: "youtube", name: "YouTube comments + faceless Shorts",
      pitch: "Evergreen, zero face required. Drop your link in a relevant video’s top comment or create a 15-second faceless Short.",
      example: "Top comment on a popular “skincare routine” video" },
  ];

  const FAQS = [
    { q: "Wait — isn’t this just a refer-a-friend link?", short: "vs-refer-a-friend" },
    { q: "Do I need followers, a blog, a TikTok, or any kind of audience?", short: "audience-requirement" },
    { q: "How much can I actually expect to earn in my first month?", short: "month-one-earnings" },
    { q: "Is this MLM, a pyramid scheme, or anything multi-level?", short: "not-mlm" },
    { q: "Why does it cost $5/month? Why isn’t it free?", short: "pricing-rationale" },
    { q: "How fast do I actually get paid?", short: "payout-speed" },
    { q: "What happens to my earnings if I cancel my membership?", short: "cancel-keeps-earnings" },
    { q: "Do the brands know I’m sharing their links? Is this allowed?", short: "brand-permission" },
    { q: "Can I do this anonymously / faceless / without anyone knowing?", short: "anonymous-faceless" },
    { q: "What if I have questions or something goes wrong?", short: "support" },
  ];

  return { VERTICALS, BRANDS, BRAND_MARKS, CHANNELS, FAQS, payoutLabel };
})();
