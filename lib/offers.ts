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
    const phase = order[offerPhase(a, now)] - order[offerPhase(b, now)];
    if (phase) return phase;
    const aEnd = a.endsAt ? timestamp(a.endsAt, true) : Number.POSITIVE_INFINITY;
    const bEnd = b.endsAt ? timestamp(b.endsAt, true) : Number.POSITIVE_INFINITY;
    if (aEnd !== bEnd) return aEnd - bEnd;
    return b.verifiedAt.localeCompare(a.verifiedAt);
  });
}
