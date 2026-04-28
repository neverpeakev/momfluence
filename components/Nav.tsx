"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const links = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/offers", label: "Offers" },
  { href: "/links", label: "My links" },
  { href: "/payouts", label: "Earnings" },
  { href: "/agreements", label: "Agreements" },
  { href: "/profile", label: "Profile" }
];

export default function Nav({ isAdmin = false, email }: { isAdmin?: boolean; email?: string }) {
  const path = usePathname();
  const router = useRouter();

  async function logout() {
    const sb = createClient();
    await sb.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <nav className="border-b border-navy-100 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-6 py-4">
        <Link href="/dashboard" className="text-xl font-display font-bold text-navy-900 no-underline">
          MomFluence
        </Link>
        <div className="hidden md:flex items-center gap-1">
          {links.map((l) => {
            const active = path === l.href || path.startsWith(`${l.href}/`);
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`px-3 py-2 rounded-lg text-sm no-underline ${
                  active ? "bg-coral-50 text-coral-700" : "text-navy-700 hover:bg-navy-50"
                }`}
              >
                {l.label}
              </Link>
            );
          })}
          {isAdmin && (
            <Link
              href="/admin"
              className={`px-3 py-2 rounded-lg text-sm no-underline ${
                path.startsWith("/admin") ? "bg-coral-50 text-coral-700" : "text-navy-700 hover:bg-navy-50"
              }`}
            >
              Admin
            </Link>
          )}
        </div>
        <div className="flex items-center gap-3">
          {email && <span className="hidden md:inline text-xs text-navy-500">{email}</span>}
          <button onClick={logout} className="text-sm text-navy-500 hover:text-navy-800">
            Sign out
          </button>
        </div>
      </div>
    </nav>
  );
}
