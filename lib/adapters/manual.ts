import type { NetworkAdapter } from "./types";

// Per-network sub-id query parameter name. networks.adapter_key='manual' delegates
// here; we switch on networks.slug to pick the right param key.
const SUBID_PARAM_BY_NETWORK: Record<string, string> = {
  impact: "subId1",
  flexoffers: "fobs"
};

const DEFAULT_SUBID_PARAM = "subid";

/**
 * Build a destination URL for a `manual` network by appending the per-network
 * sub-id query param to the offer's raw cta_url. Used by /api/links/create when
 * networks.adapter_key === 'manual'. Standard adapters template-replace
 * {SUB_ID}; manual offers have no template tokens, so we append.
 */
export function buildManualAffiliateUrl(opts: {
  ctaUrlTemplate: string;
  subId: string;
  networkSlug: string;
}): string {
  const { ctaUrlTemplate, subId, networkSlug } = opts;
  if (!ctaUrlTemplate) {
    throw new Error("missing cta_url for offer");
  }
  const param = SUBID_PARAM_BY_NETWORK[networkSlug] ?? DEFAULT_SUBID_PARAM;
  const url = new URL(ctaUrlTemplate);
  url.searchParams.append(param, subId);
  return url.toString();
}

// Registered for completeness so getAdapter('manual') doesn't throw "unknown
// adapter" elsewhere in the codebase. The standard buildAffiliateUrl shape
// can't carry the network slug, so call buildManualAffiliateUrl directly from
// /api/links/create when adapter_key === 'manual'.
export const manualAdapter: NetworkAdapter = {
  key: "manual",
  async fetchOffers() {
    throw new Error("manual adapter does not pull catalogs — offers are imported directly");
  },
  buildAffiliateUrl() {
    throw new Error(
      "manual adapter requires network slug; call buildManualAffiliateUrl directly"
    );
  },
  async parsePostback() {
    return null;
  }
};
