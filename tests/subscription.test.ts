import { describe, expect, it } from "vitest";
import { createConfirmationToken, isEmail, readConfirmationToken } from "../functions/_lib/subscription";

describe("double opt-in confirmation", () => {
  it("verifies a signed email and rejects tampering", async () => {
    const secret = "test-secret-that-is-long-enough-for-hmac";
    const now = Date.UTC(2026, 7, 22, 12, 0, 0);
    const token = await createConfirmationToken("reader@example.com", secret, now);
    expect(await readConfirmationToken(token, secret, now + 60_000)).toBe("reader@example.com");
    expect(await readConfirmationToken(`${token}x`, secret, now + 60_000)).toBeNull();
  });

  it("expires after 24 hours and deduplicates repeated requests in one ten-minute bucket", async () => {
    const secret = "another-test-secret-that-is-long-enough";
    const now = Date.UTC(2026, 7, 22, 12, 1, 0);
    const first = await createConfirmationToken("reader@example.com", secret, now);
    const repeated = await createConfirmationToken("reader@example.com", secret, now + 4 * 60_000);
    expect(repeated).toBe(first);
    expect(await readConfirmationToken(first, secret, now + 25 * 60 * 60_000)).toBeNull();
  });

  it("accepts ordinary email addresses and rejects malformed input", () => {
    expect(isEmail("reader+cp@example.com")).toBe(true);
    expect(isEmail("not-an-email")).toBe(false);
  });
});
