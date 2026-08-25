import { describe, expect, it } from "vitest";
import { addedOffers, broadcastContent, isBroadcastEligible } from "../scripts/promo-alert-lib.mjs";
import { sortOffers } from "../lib/offers";

const base = {
  id: "offer-one",
  title: "赠送 Token",
  benefit: "100 万 Tokens",
  kind: "token_gift",
  verification: "verified",
  summary: "官方已核验的赠送活动。",
  eligibility: "新用户",
  claimMethod: "活动页领取",
  endLabel: "本月底",
  verifiedAt: "2026-08-22",
};

describe("promotion alert publication rules", () => {
  it("accepts only verified high-value promotion kinds", () => {
    expect(isBroadcastEligible(base)).toBe(true);
    expect(isBroadcastEligible({ ...base, verification: "conditional" })).toBe(false);
    expect(isBroadcastEligible({ ...base, verification: "conditional", subscriberNotice: "early" })).toBe(true);
    expect(isBroadcastEligible({ ...base, kind: "trial" })).toBe(true);
  });

  it("never re-sends an offer already present in the previous revision", () => {
    const previous = { offers: [base] };
    const current = { offers: [base, { ...base, id: "offer-two", kind: "discount" }] };
    expect(addedOffers(previous, current).map((offer) => offer.id)).toEqual(["offer-two"]);
  });

  it("sends when an existing offer becomes verified", () => {
    const previous = { offers: [{ ...base, verification: "conditional" }] };
    const current = { offers: [base] };
    expect(addedOffers(previous, current).map((offer) => offer.id)).toEqual(["offer-one"]);
  });

  it("includes the official source and unsubscribe control", () => {
    const output = broadcastContent(base, "示例厂商", "https://example.com/promo");
    expect(output.subject).toContain("100 万 Tokens");
    expect(output.html).toContain("https://example.com/promo");
    expect(output.html).toContain("RESEND_UNSUBSCRIBE_URL");
  });

  it("labels reset alerts separately from verified promotions", () => {
    const output = broadcastContent({ ...base, kind: "reset", benefit: "1 次完整 Reset" }, "示例厂商", "https://example.com/reset");
    expect(output.html).toContain("CP / RESET ALERT");
    expect(output.html).not.toContain("CP / VERIFIED PROMO");
  });

  it("marks explicitly approved early notices as pending arrival", () => {
    const output = broadcastContent({ ...base, kind: "reset", verification: "conditional", subscriberNotice: "early", benefit: "1 次完整 Reset" }, "示例厂商", "https://example.com/reset");
    expect(output.subject).toContain("待正式到账");
    expect(output.html).toContain("CP / EARLY SIGNAL");
    expect(output.html).toContain("状态：待正式到账");
  });

  it("orders active offers by announcement time, newest first", () => {
    const shared = {
      vendorId: "example",
      title: "示例活动",
      summary: "官方已核验的活动。",
      benefit: "免费权益",
      kind: "trial" as const,
      scope: "coding" as const,
      regions: ["global" as const],
      audiences: ["individual" as const],
      eligibility: "符合条件的用户",
      claimMethod: "打开官方页面",
      endLabel: "官方未披露",
      verification: "verified" as const,
      subscriberNotice: "none" as const,
      featured: true,
      sourceIds: ["source"],
    };
    const older = { ...shared, id: "older", startsAt: "2026-08-23", endsAt: null, verifiedAt: "2026-08-23" };
    const newest = { ...shared, id: "newest", startsAt: "2026-08-25", endsAt: null, verifiedAt: "2026-08-25" };
    expect(sortOffers([older, newest], new Date("2026-08-26")).map((offer) => offer.id)).toEqual(["newest", "older"]);
  });
});
