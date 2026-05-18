"use client";

/**
 * §3 — The myriad ways to share your link
 *
 * Defeats the "I'm not an influencer" objection. 8 channels — none of
 * which require a following — each with a why-it-works line and a
 * mom-style example.
 *
 * Voice lock v6: regular moms, big bucks, find out more, get yours.
 */

import { motion } from "framer-motion";

const CHANNELS = [
  {
    icon: "💬",
    name: "Group chats / iMessage",
    pitch: "The highest-converting place on Earth. One text to five close friends beats a thousand-follower IG story every time.",
    example: "&ldquo;Y'all I finally found leggings that actually fit — link incoming&rdquo;",
  },
  {
    icon: "👩‍👩‍👧",
    name: "School / mom Facebook groups",
    pitch: "Moms helping moms is the original engagement signal. A helpful link in a relevant thread can earn for years.",
    example: "&ldquo;For anyone asking about pediatric melatonin alternatives — this is what we use&rdquo;",
  },
  {
    icon: "🧵",
    name: "Reddit threads",
    pitch: "Answer a question with a tracked link. Reddit posts stay searchable forever, so one helpful comment earns for 18+ months.",
    example: "Reply to r/SkincareAddiction post about gentle moisturizers",
  },
  {
    icon: "📌",
    name: "Pinterest pins",
    pitch: "Evergreen by design. One pin can keep paying you for a year and a half. Pinterest users are actively shopping.",
    example: "Pin: &ldquo;Best Mother's Day gifts under $50&rdquo; with tracked links",
  },
  {
    icon: "🎬",
    name: "TikTok comments (faceless)",
    pitch: "No camera, no following. Drop a helpful link in the comments of a viral &ldquo;does anyone know where to get&hellip;&rdquo; video.",
    example: "Reply to a viral &ldquo;what's that toy?&rdquo; TikTok with the link",
  },
  {
    icon: "🏘️",
    name: "Nextdoor recommendations",
    pitch: "Neighborhood-level trust is unbeatable. Local moms are looking for recs, not ads — your link reads as helpful.",
    example: "&ldquo;The cleaning service we use, link is here&rdquo;",
  },
  {
    icon: "📧",
    name: "Email signature",
    pitch: "Every email you already send. Add &ldquo;p.s. I love these — get yours here&rdquo; with one of your tracked links.",
    example: "Auto-appended to every PTA / work email you send",
  },
  {
    icon: "📺",
    name: "YouTube comments + faceless Shorts",
    pitch: "Evergreen, zero face required. Drop your link in a relevant video&apos;s top comment or create a 15-second faceless Short.",
    example: "Top comment on a popular &ldquo;skincare routine&rdquo; video",
  },
];

export default function SectionMyriadWaysToShare() {
  return (
    <section className="mt-24" id="ways-to-share">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        <p className="text-xs uppercase tracking-widest text-coral-600 font-semibold">
          You don&apos;t need a following
        </p>
        <h2 className="mt-2 text-balance text-3xl text-navy-900 sm:text-4xl">
          Eight ways to share that don&apos;t require an audience.
        </h2>
        <p className="mt-3 max-w-2xl text-base text-navy-600 sm:text-lg">
          You don&apos;t need to make videos. You don&apos;t need a TikTok. You
          don&apos;t even have to tell your friends what you&apos;re doing.
          These are the places real moms drop links every day.
        </p>
      </motion.div>

      <div className="mt-12 grid gap-4 sm:grid-cols-2">
        {CHANNELS.map((channel, i) => (
          <motion.article
            key={channel.name}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.35, delay: 0.04 * i, ease: "easeOut" }}
            className="rounded-2xl bg-white p-5 ring-1 ring-navy-100 hover:ring-coral-200 transition-shadow"
          >
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-navy-50 text-2xl">
                {channel.icon}
              </div>
              <div className="min-w-0">
                <h3 className="text-base text-navy-900 font-semibold">{channel.name}</h3>
                <p className="mt-2 text-sm leading-6 text-navy-700">{channel.pitch}</p>
                <p
                  className="mt-3 text-xs italic text-navy-500"
                  dangerouslySetInnerHTML={{ __html: `Example: ${channel.example}` }}
                />
              </div>
            </div>
          </motion.article>
        ))}
      </div>

      <motion.p
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, amount: 0.5 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="mt-8 max-w-3xl text-sm text-navy-600"
      >
        <span className="font-semibold text-navy-900">Important:</span> when you
        share an affiliate link, FTC rules require you to disclose that
        it&apos;s a paid recommendation. We give you copy-paste disclosures
        that satisfy the FTC&apos;s rules — they take 4 words to add and you
        only have to do it once per post.
      </motion.p>
    </section>
  );
}
