import type { NetworkAdapter, PostbackEvent, UpstreamOffer } from "./types";

// In-process mock network. The seed migration also writes these into the DB
// directly for offer rows; this adapter is only used when we want to RE-pull
// the catalog (e.g. an admin "sync offers now" button).
const MOCK_OFFERS: UpstreamOffer[] = [
  {
    externalOfferId: "mock-001",
    title: "Healthy Smiles Pediatric Dental Booking",
    brand: "Healthy Smiles",
    vertical: "health",
    description: "Local pediatric dental practice — $50 lead bounty per consult.",
    ctaUrlTemplate: "https://offers.mock/healthy-smiles?aff_id=momfluence&aff_sub1={SUB_ID}",
    payoutType: "cpa",
    upstreamPayoutCents: 5000,
    heroImageUrl: "https://images.unsplash.com/photo-1606811841689-23dfddce3e95?w=600&q=80",
    geo: ["US"],
    status: "active"
  },
  {
    externalOfferId: "mock-002",
    title: "Spring Hair Refresh — Local Salon Bundle",
    brand: "Bloom Salon",
    vertical: "beauty",
    description: "Local salon promo. Pays per booked appointment.",
    ctaUrlTemplate: "https://offers.mock/bloom-salon?aff_id=momfluence&aff_sub1={SUB_ID}",
    payoutType: "cpa",
    upstreamPayoutCents: 4000,
    heroImageUrl: "https://images.unsplash.com/photo-1492725764893-90b379c2b6e7?w=600&q=80",
    geo: ["US"],
    status: "active"
  }
];

export const mockAdapter: NetworkAdapter = {
  key: "mock",

  async fetchOffers() {
    return MOCK_OFFERS;
  },

  buildAffiliateUrl({ ctaUrlTemplate, subId }) {
    return ctaUrlTemplate.replace("{SUB_ID}", encodeURIComponent(subId));
  },

  async parsePostback({ query }) {
    // Mock postback contract:
    //   GET /api/postback?network=mock&offer=mock-001&sub_id=abc&payout_cents=5000&event=evt_1&status=approved&token=POSTBACK_SECRET
    const token = query.get("token");
    const expected = process.env.POSTBACK_SECRET;
    if (!expected || token !== expected) {
      throw new Error("invalid postback token");
    }

    const offer = query.get("offer");
    const subId = query.get("sub_id");
    const payout = query.get("payout_cents");
    if (!offer || !subId || !payout) return null;

    const event: PostbackEvent = {
      externalOfferId: offer,
      subId,
      networkEventId: query.get("event"),
      upstreamPayoutCents: parseInt(payout, 10),
      status: (query.get("status") as PostbackEvent["status"]) || "pending",
      raw: Object.fromEntries(query.entries())
    };
    return event;
  }
};
