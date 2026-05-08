import Stripe from "stripe";

let cached: Stripe | null = null;

export function getStripe(): Stripe {
  if (cached) return cached;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY missing");
  cached = new Stripe(key, { apiVersion: "2024-12-18.acacia" });
  return cached;
}

export const STRIPE_PRICE_ID_MEMBERSHIP = process.env.STRIPE_PRICE_ID_MEMBERSHIP || "price_1TUVt2ANPjxV4rVaQ4hgCXvr";
