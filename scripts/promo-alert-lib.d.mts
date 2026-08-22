export interface PromoOffer {
  id: string;
  title: string;
  benefit: string;
  kind: string;
  verification: string;
  summary: string;
  eligibility: string;
  claimMethod: string;
  endLabel: string;
  verifiedAt: string;
}

export function isBroadcastEligible(offer: PromoOffer): boolean;
export function addedOffers(previous: { offers?: PromoOffer[] }, current: { offers?: PromoOffer[] }): PromoOffer[];
export function escapeHtml(value: unknown): string;
export function broadcastContent(offer: PromoOffer, vendorName: string, sourceUrl: string, siteUrl?: string): { subject: string; html: string };
