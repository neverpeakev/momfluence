import type { NetworkAdapter } from "./types";

// Stub. Reference: https://docs.scaleo.io/
// - Catalog: GET /api/offers
// - Tracking link: append &sub1={SUB_ID}
// - Postback: signed via shared secret in query param `signature` (md5 of payload).
export const scaleoAdapter: NetworkAdapter = {
  key: "scaleo",
  async fetchOffers() {
    throw new Error("scaleo adapter not yet implemented");
  },
  buildAffiliateUrl({ ctaUrlTemplate, subId }) {
    return ctaUrlTemplate.replace("{SUB_ID}", encodeURIComponent(subId));
  },
  async parsePostback() {
    return null;
  }
};
