// Hash an IP for click logging — never store raw IPs.
import { createHash } from "node:crypto";

export function hashIp(ip: string | null | undefined): string | null {
  if (!ip) return null;
  const secret = process.env.POSTBACK_SECRET || "dev-fallback";
  return createHash("sha256").update(`${ip}|${secret}`).digest("hex");
}
