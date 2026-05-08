"use client";

import Link from "next/link";
import { useState } from "react";

const navLinks = [
  { href: "/how-it-works", label: "How it works" },
  { href: "/pricing", label: "Pricing" },
  { href: "/for-influencers#faq", label: "FAQ" }
];

export default function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-navy-100 bg-white/85 backdrop-blur supports-[backdrop-filter]:bg-white/70">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-6 py-4">
        <Link
          href="/"
          className="font-display text-xl font-bold text-navy-900 no-underline hover:text-navy-900"
        >
          MomFluence
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="rounded-lg px-3 py-2 text-sm text-navy-700 no-underline hover:bg-navy-50 hover:text-navy-900"
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-3">
          <Link
            href="/login"
            className="text-sm text-navy-600 no-underline hover:text-navy-900"
          >
            Sign in
          </Link>
          <Link href="/pricing" className="btn-primary text-sm no-underline">
            Join $5/mo
          </Link>
        </div>

        <button
          type="button"
          aria-label="Toggle menu"
          aria-expanded={open}
          onClick={() => setOpen((o) => !o)}
          className="md:hidden inline-flex h-10 w-10 items-center justify-center rounded-lg border border-navy-200 text-navy-700"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="h-5 w-5"
          >
            {open ? (
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 6l12 12M6 18L18 6" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {open && (
        <div className="md:hidden border-t border-navy-100 bg-white">
          <div className="mx-auto max-w-6xl px-6 py-3 flex flex-col gap-1">
            {navLinks.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2 text-sm text-navy-700 no-underline hover:bg-navy-50"
              >
                {l.label}
              </Link>
            ))}
            <div className="mt-2 flex gap-3 pt-2 border-t border-navy-100">
              <Link
                href="/login"
                onClick={() => setOpen(false)}
                className="btn-ghost flex-1 text-sm no-underline"
              >
                Sign in
              </Link>
              <Link
                href="/pricing"
                onClick={() => setOpen(false)}
                className="btn-primary flex-1 text-sm no-underline"
              >
                Join $5/mo
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
