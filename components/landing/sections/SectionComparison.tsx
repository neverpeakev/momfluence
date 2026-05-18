"use client";

/**
 * §5.5 — Comparison vs other mom side hustles
 *
 * Trust-builder introduced by the Design Agent's 2026-05-18 visual
 * sprint. Honest 6-row table on desktop, stacked cards on mobile.
 *
 * Voice lock v6: plainspoken, no put-downs. Instacart wins "cash today",
 * MomFluence wins "recurring + no audience". We don't claim every row.
 *
 * Numbers reflect typical reported earnings from public reporting on
 * each platform — disclaimer below the block.
 */

import { motion } from "framer-motion";
import EarningsDisclaimerInline from "@/components/landing/EarningsDisclaimerInline";

interface Row {
  dim: string;
  mom: string;
  values: { label: string; value: string }[];
}

const COLUMN_LABELS = [
  "Instacart / DoorDash",
  "Survey apps",
  "Reselling / Poshmark",
  "MLM / Direct sales",
] as const;

const ROWS: Row[] = [
  {
    dim: "Time to first dollar",
    mom: "Same day ($25 fast-track)",
    values: [
      { label: COLUMN_LABELS[0], value: "1–7 days" },
      { label: COLUMN_LABELS[1], value: "Hours" },
      { label: COLUMN_LABELS[2], value: "2–4 weeks" },
      { label: COLUMN_LABELS[3], value: "Weeks–months" },
    ],
  },
  {
    dim: "Up-front cost",
    mom: "$5/mo (you keep earnings if you cancel)",
    values: [
      { label: COLUMN_LABELS[0], value: "$0" },
      { label: COLUMN_LABELS[1], value: "$0" },
      { label: COLUMN_LABELS[2], value: "Inventory" },
      { label: COLUMN_LABELS[3], value: "$100–$500 starter kit" },
    ],
  },
  {
    dim: "Audience / following needed",
    mom: "None",
    values: [
      { label: COLUMN_LABELS[0], value: "None" },
      { label: COLUMN_LABELS[1], value: "None" },
      { label: COLUMN_LABELS[2], value: "Buyers" },
      { label: COLUMN_LABELS[3], value: "Yes, a downline" },
    ],
  },
  {
    dim: "Recurring revenue?",
    mom: "Yes — pays monthly",
    values: [
      { label: COLUMN_LABELS[0], value: "One-time" },
      { label: COLUMN_LABELS[1], value: "One-time" },
      { label: COLUMN_LABELS[2], value: "One-time" },
      { label: COLUMN_LABELS[3], value: "Tied to recruiting" },
    ],
  },
  {
    dim: "Ceiling",
    mom: "Scales with sharing",
    values: [
      { label: COLUMN_LABELS[0], value: "Capped by hours" },
      { label: COLUMN_LABELS[1], value: "~$200/mo" },
      { label: COLUMN_LABELS[2], value: "Capped by inventory" },
      { label: COLUMN_LABELS[3], value: "Bigger, recruiting-dependent" },
    ],
  },
  {
    dim: "Time per day",
    mom: "5–10 min",
    values: [
      { label: COLUMN_LABELS[0], value: "3–6 hrs" },
      { label: COLUMN_LABELS[1], value: "30–60 min" },
      { label: COLUMN_LABELS[2], value: "2–4 hrs" },
      { label: COLUMN_LABELS[3], value: "Variable" },
    ],
  },
];

export default function SectionComparison() {
  return (
    <section className="mt-24" id="vs-other-hustles">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        <p className="text-xs uppercase tracking-widest text-coral-600 font-semibold">
          Honest comparison
        </p>
        <h2 className="mt-2 text-3xl text-navy-900 sm:text-4xl">
          MomFluence vs. every other mom side hustle.
        </h2>
        <p className="mt-3 max-w-2xl text-base text-navy-600 sm:text-lg">
          We&apos;re not saying MomFluence is the best for everyone — driving Instacart pays
          cash today and that matters when rent is due Friday. But for a lot of moms, the
          math below is why we built this.
        </p>
      </motion.div>

      {/* Desktop / tablet table */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="mt-10 hidden overflow-hidden rounded-2xl bg-white ring-1 ring-navy-100 md:block"
      >
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-navy-50">
              <th className="w-1/4 px-4 py-3 text-left text-xs font-semibold uppercase tracking-widest text-navy-500">
                What you compare
              </th>
              <th className="bg-coral-50 px-4 py-3 text-left text-xs font-semibold uppercase tracking-widest text-coral-700 ring-1 ring-coral-200">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-coral-500" />
                  MomFluence
                </div>
              </th>
              {COLUMN_LABELS.map((label) => (
                <th
                  key={label}
                  className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-widest text-navy-500"
                >
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-navy-100">
            {ROWS.map((row) => (
              <tr key={row.dim} className="align-top">
                <td className="px-4 py-4 font-semibold text-navy-900">{row.dim}</td>
                <td className="bg-coral-50/60 px-4 py-4 font-medium text-navy-900">
                  {row.mom}
                </td>
                {row.values.map((v) => (
                  <td key={v.label} className="px-4 py-4 text-navy-600">
                    {v.value}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </motion.div>

      {/* Mobile stacked cards */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="mt-10 grid gap-4 md:hidden"
      >
        {ROWS.map((row) => (
          <div key={row.dim} className="rounded-2xl bg-white p-5 ring-1 ring-navy-100">
            <p className="text-xs font-semibold uppercase tracking-widest text-navy-500">
              {row.dim}
            </p>
            <div className="mt-3 rounded-xl bg-coral-50 p-3 ring-1 ring-coral-200">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-coral-700">
                MomFluence
              </p>
              <p className="mt-1 text-sm font-medium text-navy-900">{row.mom}</p>
            </div>
            <ul className="mt-3 space-y-2 text-sm text-navy-600">
              {row.values.map((v) => (
                <li
                  key={v.label}
                  className="flex justify-between gap-3 border-b border-navy-100 pb-1.5 last:border-0"
                >
                  <span className="font-medium text-navy-500">{v.label}</span>
                  <span className="text-navy-700">{v.value}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </motion.div>

      <p className="mt-6 max-w-3xl text-sm text-navy-600">
        Numbers reflect typical reported earnings, not guarantees, and are sourced from
        public reporting on each platform. MomFluence isn&apos;t a fit for every mom — but
        if you&apos;re already recommending things in your group chat, it&apos;s the path
        with the least new work.
      </p>

      <EarningsDisclaimerInline density="compact" className="mt-2" />
    </section>
  );
}
