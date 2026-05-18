import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import {
  PRICING_VARIANT_COOKIE,
  PRICING_VARIANT_MAX_AGE_SECONDS,
  parsePricingVariant,
} from "@/lib/funnel-lab/pricing-variants";

type CookieToSet = { name: string; value: string; options?: CookieOptions };

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  // Pricing variant cookie — set in middleware so the LP Server Component
  // can read it without triggering Next.js 15's "cookies can only be modified
  // in a Server Action or Route Handler" error. Variant C only as of
  // 2026-05-18 (see lib/funnel-lab/pricing-variants.ts header).
  //
  // Only set on /lp/* paths so we don't seed it for unrelated traffic.
  if (request.nextUrl.pathname.startsWith("/lp/")) {
    const existing = parsePricingVariant(
      request.cookies.get(PRICING_VARIANT_COOKIE)?.value
    );
    if (!existing) {
      const value = "C";
      // Mirror onto both request and response so the Server Component
      // sees it via cookies() on this same request.
      request.cookies.set(PRICING_VARIANT_COOKIE, value);
      response = NextResponse.next({ request });
      response.cookies.set(PRICING_VARIANT_COOKIE, value, {
        maxAge: PRICING_VARIANT_MAX_AGE_SECONDS,
        path: "/",
        sameSite: "lax",
        httpOnly: false, // client component reads it
      });
    }
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        }
      }
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const protectedPaths = ["/dashboard", "/catalog", "/offers", "/links", "/payouts", "/profile", "/agreements", "/admin", "/onboarding"];
  const needsAuth = protectedPaths.some((p) => pathname === p || pathname.startsWith(`${p}/`));

  if (needsAuth && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  return response;
}
