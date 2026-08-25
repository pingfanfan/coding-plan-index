import type { Offer } from "@/lib/schema";

export type OfferPhase = "current" | "upcoming" | "ended";

function timestamp(value: string, endOfDay = false) {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return Date.parse(`${value}T${endOfDay ? "23:59:59.999" : "00:00:00.000"}Z`);
  }
  return Date.parse(value);
}

export function offerPhase(offer: Offer, now = new Date()): OfferPhase {
  const current = now.getTime();
  if (offer.startsAt && timestamp(offer.startsAt) > current) return "upcoming";
  if (offer.endsAt && timestamp(offer.endsAt, true) < current) return "ended";
  return "current";
}

export function sortOffers(offers: Offer[], now = new Date()) {
  const order: Record<OfferPhase, number> = { current: 0, upcoming: 1, ended: 2 };
  return [...offers].sort((a, b) => {
    const aPhase = offerPhase(a, now);
    const bPhase = offerPhase(b, now);
    const phase = order[aPhase] - order[bPhase];
    if (phase) return phase;

    if (aPhase === "current") {
      // Active offers should read like a news feed: newest announcement first.
      // Use verifiedAt when an offer has no explicit start date.
      const aStart = timestamp(a.startsAt ?? a.verifiedAt);
      const bStart = timestamp(b.startsAt ?? b.verifiedAt);
      if (aStart !== bStart) return bStart - aStart;
      return b.verifiedAt.localeCompare(a.verifiedAt);
    }

    if (aPhase === "upcoming") {
      const aStart = a.startsAt ? timestamp(a.startsAt) : Number.POSITIVE_INFINITY;
      const bStart = b.startsAt ? timestamp(b.startsAt) : Number.POSITIVE_INFINITY;
      if (aStart !== bStart) return aStart - bStart;
      return b.verifiedAt.localeCompare(a.verifiedAt);
    }

    const aEnd = a.endsAt ? timestamp(a.endsAt, true) : Number.NEGATIVE_INFINITY;
    const bEnd = b.endsAt ? timestamp(b.endsAt, true) : Number.NEGATIVE_INFINITY;
    if (aEnd !== bEnd) return bEnd - aEnd;
    return b.verifiedAt.localeCompare(a.verifiedAt);
  });
}
