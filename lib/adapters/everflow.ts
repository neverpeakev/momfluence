import type { NetworkAdapter } from "./types";

// Stub. Implement when an Everflow contract closes.
// Reference: https://developers.everflow.io/docs/network/network/
// - Catalog: GET /v1/networks/offers
// - Tracking link: replace `s1=` with the momfluencer subId
// - Postback: signed with X-Eflow-Signature; verify with HMAC-SHA256 of body using shared secret.
export const everflowAdapter: NetworkAdapter = {
  key: "everflow",
  async fetchOffers() {
    throw new Error("everflow adapter not yet implemented");
  },
  buildAffiliateUrl({ ctaUrlTemplate, subId }) {
    return ctaUrlTemplate.replace("{SUB_ID}", encodeURIComponent(subId));
  },
  async parsePostback() {
    return null;
  }
};
