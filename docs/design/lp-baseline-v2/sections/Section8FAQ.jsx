/* global React, Reveal, Section, AnnoSpec, Eyebrow */
/**
 * §8 — FAQ (10 mom-specific Qs)
 * Source: components/landing/sections/SectionFAQ.tsx
 * Event:  LP_Section_FAQ · LP_FAQ_Opened (per-item, with index + short)
 *
 * Answers below mirror PR #41 verbatim. Voice lock v6 + FTC compliance —
 * do not rewrite. Detail-element accordion (faq-item) keeps a single
 * open at a time via name="lp-baseline-faq".
 */
const FAQS_FULL = [
  {
    q: "Wait — isn’t this just a refer-a-friend link?",
    short: "vs-refer-a-friend",
    a: (
      <>
        <p>
          <span className="font-semibold text-navy-900">No.</span> Refer-a-friend programs pay you a tiny one-time bonus
          (often store credit, not cash) for getting one friend to sign up. Affiliate marketing — which is what MomFluence
          enables — is a percentage of every transaction your link generates, often recurring monthly for as long as the
          customer stays a customer. Refer-a-friend is a one-time tip; affiliate commissions are recurring revenue.
        </p>
        <p>Some brands offer both; we focus on the affiliate model because the math is meaningfully better for moms over time.</p>
      </>
    ),
  },
  {
    q: "Do I need followers, a blog, a TikTok, or any kind of audience?",
    short: "audience-requirement",
    a: (
      <p>
        <span className="font-semibold text-navy-900">No.</span> The eight channels in “Ways to share” (above) are all designed
        for moms with zero followers — group chats, school Facebook groups, Reddit, Pinterest, Nextdoor, YouTube comments, your
        email signature, and faceless TikTok. The whole point is to make affiliate marketing work without becoming an influencer.
      </p>
    ),
  },
  {
    q: "How much can I actually expect to earn in my first month?",
    short: "month-one-earnings",
    a: (
      <>
        <p>
          <span className="font-semibold text-navy-900">Most active first-month members earn between $15 and $75.</span>{" "}
          Heavy sharers can earn more; people who sign up and never share anything earn nothing.
        </p>
        <p>
          Recurring commissions compound — your month-two earnings are usually higher than month one because last month’s
          signups are still paying you. By month three or four, most active members are earning well past the membership cost.
        </p>
        <p className="text-sm text-navy-600">
          These figures are examples based on platform usage patterns, not guarantees. Individual results vary based on how
          often, where, and with whom you share. See{" "}
          <a href="/disclosures/earnings" className="underline">full earnings disclaimer</a>.
        </p>
      </>
    ),
  },
  {
    q: "Is this MLM, a pyramid scheme, or anything multi-level?",
    short: "not-mlm",
    a: (
      <>
        <p>
          <span className="font-semibold text-navy-900">No.</span> You earn money one way: when someone clicks your tracked
          link and that brand confirms the conversion. You do not earn anything by recruiting other moms into MomFluence.
          There is no “downline,” no recruiting bonus, no levels, no tiers.
        </p>
        <p>
          This is standard affiliate marketing — the exact same model that podcast hosts, bloggers, and YouTube reviewers have
          used for two decades. The only people you earn from are the people who click your link and buy from a brand.
        </p>
      </>
    ),
  },
  {
    q: "Why does it cost $5/month? Why isn’t it free?",
    short: "pricing-rationale",
    a: (
      <>
        <p>
          We negotiate brand partnerships in bulk on behalf of our members, take care of payment consolidation across all of
          them, and run the dashboard, tracking infrastructure, and fast-track first cashout. That has real costs — and we’d
          rather charge a flat $5 and treat you as the customer than be “free” and quietly take 50% of your earnings the way
          some platforms do.
        </p>
        <p>
          Most active members earn the $5 back in their first week or two of actually sharing links. Some pricing variants of
          MomFluence credit the $5 back to your dashboard balance once you cross $25 in earnings — check the offer you signed
          up under or contact us at <a href="mailto:hello@momfluence.app" className="underline">hello@momfluence.app</a> to clarify your terms.
        </p>
      </>
    ),
  },
  {
    q: "How fast do I actually get paid?",
    short: "payout-speed",
    a: (
      <>
        <p>
          <span className="font-semibold text-navy-900">First $25:</span> fast-tracked, lands in your dashboard same-day. We do
          this so you can verify the platform works before earning bigger numbers.
        </p>
        <p>
          <span className="font-semibold text-navy-900">After your first $25:</span> payouts happen on a $50 minimum, up to twice
          per month, to PayPal, Venmo, or direct bank deposit. The delay between earning and cashing out depends on the brand —
          some confirm conversions in 24 hours, others take 30-60 days (industry standard for fraud prevention).
        </p>
      </>
    ),
  },
  {
    q: "What happens to my earnings if I cancel my membership?",
    short: "cancel-keeps-earnings",
    a: (
      <>
        <p>
          <span className="font-semibold text-navy-900">Your past earnings stay yours — forever.</span> If you cancel today,
          anything you’ve already earned cashes out normally once it clears the minimum threshold ($25 for first cashout, $50
          thereafter).
        </p>
        <p>
          What you lose when you cancel is access to the brand programs going forward — you can’t generate new tracked links
          once your membership lapses. Existing links may continue to track for a brand-specified attribution window, but new
          ones won’t.
        </p>
      </>
    ),
  },
  {
    q: "Do the brands know I’m sharing their links? Is this allowed?",
    short: "brand-permission",
    a: (
      <>
        <p>
          <span className="font-semibold text-navy-900">Yes</span> — every brand on the platform has actively opted into the
          affiliate program that powers your tracked links. They explicitly want you sharing their links. That’s the entire
          point of an affiliate program.
        </p>
        <p>
          The legal requirement on your end: when you share an affiliate link, FTC rules require you to disclose that it’s a
          paid recommendation (the standard short form is “#ad” or “Affiliate link.”) We give you copy-paste disclosures inside
          the dashboard. See <a href="/disclosures/affiliate-marketing" className="underline">our affiliate marketing disclosure</a> for more.
        </p>
      </>
    ),
  },
  {
    q: "Can I do this anonymously / faceless / without anyone knowing?",
    short: "anonymous-faceless",
    a: (
      <>
        <p>
          <span className="font-semibold text-navy-900">Yes.</span> Several of our highest-earning channels are completely
          faceless: Reddit comments under a pseudonym, Pinterest pins with no personal information, faceless TikTok or YouTube
          Shorts, anonymous forum contributions. We never require you to share publicly or use your real name. Your MomFluence
          account is private to you.
        </p>
        <p>
          The only requirement from a legal standpoint is the FTC affiliate disclosure (above) — and that just means tagging
          the post itself as an affiliate link, not identifying yourself.
        </p>
      </>
    ),
  },
  {
    q: "What if I have questions or something goes wrong?",
    short: "support",
    a: (
      <>
        <p>
          Email <a href="mailto:hello@momfluence.app" className="underline">hello@momfluence.app</a> and the founder personally
          responds. We’re a small team — you’ll get a real person, usually within a few hours during business hours. No bots,
          no ticket-routing maze.
        </p>
        <p>
          If you ever feel the platform isn’t delivering what was promised, email me directly and I’ll work with you to make it right.
        </p>
        <p className="text-sm text-navy-500">— Kevin, founder</p>
      </>
    ),
  },
];

function SectionFAQ() {
  return (
    <Section id="faq" n="8" name="FAQ" file="sections/SectionFAQ.tsx" event="LP_Section_FAQ">
      <Reveal>
        <Eyebrow>Frequently asked</Eyebrow>
        <h2 className="mt-2 text-3xl sm:text-4xl text-navy-900 text-balance">
          Questions every mom asks. Answered fast.
        </h2>
        <p className="mt-3 text-base sm:text-lg text-navy-600 max-w-2xl">
          Tap any question to expand. Anything missing? Email{" "}
          <a href="mailto:hello@momfluence.app" className="underline">hello@momfluence.app</a>.
        </p>
      </Reveal>

      <div className="mt-8 space-y-3">
        {FAQS_FULL.map((faq) => (
          <details key={faq.short} name="lp-baseline-faq"
            className="faq-item rounded-2xl bg-white p-5 sm:p-6 ring-1 ring-navy-100 hover:ring-navy-200 open:ring-coral-200">
            <summary className="faq-summary flex items-center justify-between gap-4">
              <span className="text-base sm:text-lg font-semibold text-navy-900">{faq.q}</span>
              <span aria-hidden="true" className="faq-chevron flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-navy-100 text-base font-bold text-navy-700">▾</span>
            </summary>
            <div className="faq-body space-y-3 pt-4 text-base leading-7 text-navy-700">
              {faq.a}
            </div>
          </details>
        ))}
      </div>

      <AnnoSpec rows={[
        ["Item",       <><span className="tok">rounded-2xl bg-white p-5 sm:p-6 ring-1 ring-navy-100</span> · hover <span className="tok">ring-navy-200</span> · open <span className="tok-coral tok">ring-coral-200</span></>],
        ["Chevron",    <><span className="tok">h-9 w-9 rounded-full bg-navy-100</span> · open: <span className="tok-coral tok">bg-coral-500 · text-white · rotate-180</span> · ease <span className="tok">cubic-bezier(.34,1.2,.64,1)</span> 400ms</>],
        ["Behavior",   <><code>name="lp-baseline-faq"</code> — only one open at a time (native HTML accordion)</>],
        ["Event",      <><code>LP_FAQ_Opened</code> fires once per item (firedRef gate) with <code>index</code> + <code>short</code> · feeds funnel-depth chart</>],
        ["Voice lock", <>Every answer leads with the doubt before reframing · curly quotes throughout · <span className="tok-coral tok">DO NOT REWRITE</span></>],
        ["FTC",        <>Earnings claim in Q3 carries explicit disclaimer paragraph + link to <code>/disclosures/earnings</code></>],
      ]} />
    </Section>
  );
}

window.SectionFAQ = SectionFAQ;
