import type { z } from "zod";
export interface Notification {
  eventId: string;
  announcedAt: string;
  reviewedAt: string;
  status: "confirmed" | "announced" | "review";
  sourceId: string;
  evidenceNote: string;
  limited?: boolean;
}
export const NotificationSchema: z.ZodType<Notification>;
