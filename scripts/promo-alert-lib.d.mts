export interface PromoOffer {
  id: string;
  title: string;
  benefit: string;
  kind: string;
  verification: string;
  subscriberNotice?: "none" | "early";
  summary: string;
  eligibility: string;
  claimMethod: string;
  endLabel: string;
  verifiedAt: string;
}

export function escapeHtml(value: unknown): string;
export function broadcastContent(offer: PromoOffer, vendorName: string, sourceUrl: string, siteUrl?: string): { subject: string; html: string };
