"use client";

/**
 * §1 — How it works
 *
 * Three-step glance: Pick a brand → Share your link → Get paid.
 * Reuses <TextDemo /> for the friend-text animation. Framer Motion
 * fade-up entrance on scroll.
 *
 * Voice lock v6: regular moms, big bucks, find out more, get yours.
 */

import { motion } from "framer-motion";
import TextDemo from "@/components/landing/TextDemo";
import EarningsDisclaimerInline from "@/components/landing/EarningsDisclaimerInline";

const STEPS = [
  {
    n: 1,
    icon: "🛒",
    title: "Pick a brand from your dashboard",
    body: "Browse a curated wall of vetted brands — streaming, beauty, savings apps, pet food, family safety. You don't apply, you don't wait. The brands already said yes.",
  },
  {
    n: 2,
    icon: "🔗",
    title: "Share your tracked link",
    body: "Drop it in a group text, a Reddit comment, a Pinterest pin, a Facebook mom group, your email signature. Anywhere people might want to know. You don't need a following.",
  },
  {
    n: 3,
    icon: "💸",
    title: "Get paid when someone clicks and buys",
    body: "Commissions land in your dashboard as soon as the brand confirms the conversion — usually within 24-72 hours. Cash out to PayPal, Venmo, or bank when you've earned $25 or more.",
  },
];

export default function SectionHowItWorks() {
  return (
    <section className="mt-24" id="how-it-works">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        <p className="text-xs uppercase tracking-widest text-coral-600 font-semibold">
          How it works
        </p>
        <h2 className="mt-2 text-balance text-3xl text-navy-900 sm:text-4xl">
          Pick. Share. Get paid.
        </h2>
        <p className="mt-3 max-w-2xl text-base text-navy-600 sm:text-lg">
          The same way bloggers and podcasters have made money for 20 years —
          built for moms with phones and group chats.
        </p>
      </motion.div>

      <div className="mt-12 grid gap-10 lg:grid-cols-[1fr_auto] lg:items-center">
        <ol className="space-y-8">
          {STEPS.map((step, i) => (
            <motion.li
              key={step.n}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.5 }}
              transition={{ duration: 0.4, delay: 0.1 * i, ease: "easeOut" }}
              className="flex items-start gap-4"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-coral-100 text-2xl">
                {step.icon}
              </div>
              <div className="min-w-0">
                <p className="text-xs uppercase tracking-widest text-coral-600 font-semibold">
                  Step {step.n}
                </p>
                <h3 className="mt-1 text-xl text-navy-900">{step.title}</h3>
                <p className="mt-2 text-base text-navy-700">{step.body}</p>
              </div>
            </motion.li>
          ))}
        </ol>

        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="flex justify-center lg:justify-end"
        >
          <div className="relative">
            <TextDemo />
            <p className="mt-3 text-center text-xs text-navy-500">
              Animated example. Not a real customer.
            </p>
          </div>
        </motion.div>
      </div>

      <EarningsDisclaimerInline density="compact" className="mt-8" />
    </section>
  );
}
