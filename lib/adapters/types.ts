// Pluggable upstream-network adapter interface.
// Each adapter is responsible for: pulling the offer catalog from the upstream
// network, building a final-destination URL with the momfluencer's sub-id baked
// in, and parsing/verifying postback payloads.

export type PayoutType = "cpa" | "cpl" | "cps" | "rev_share";

export interface UpstreamOffer {
  externalOfferId: string;
  title: string;
  brand: string | null;
  vertical: string | null;
  description: string | null;
  ctaUrlTemplate: string;            // includes {SUB_ID} placeholder
  payoutType: PayoutType;
  upstreamPayoutCents: number;
  heroImageUrl: string | null;
  geo: string[];
  status: "active" | "paused" | "archived";
}

export interface PostbackEvent {
  externalOfferId: string;
  subId: string;                      // our internal tracking_link.token
  networkEventId: string | null;     // for idempotency
  upstreamPayoutCents: number;
  status: "pending" | "approved" | "rejected" | "reversed";
  raw: Record<string, unknown>;
}

export interface NetworkAdapter {
  /** Identity used in the `networks.adapter_key` column. */
  readonly key: string;

  /** Fetch the catalog from the upstream network (paginated, returns all). */
  fetchOffers(): Promise<UpstreamOffer[]>;

  /**
   * Given an upstream offer's URL template and a momfluencer's sub-id,
   * return the final URL the user should land on. The default replaces
   * `{SUB_ID}` literally, but adapters can override (e.g. Everflow's `s1=`).
   */
  buildAffiliateUrl(opts: { ctaUrlTemplate: string; subId: string }): string;

  /**
   * Parse + verify a webhook payload from the upstream network.
   * Throw if the signature is invalid; return null if it is not a recognized event.
   */
  parsePostback(req: { headers: Headers; bodyText: string; query: URLSearchParams }): Promise<PostbackEvent | null>;
}
