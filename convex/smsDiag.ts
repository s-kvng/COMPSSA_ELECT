import { action } from "./_generated/server";
import { v } from "convex/values";

/**
 * Read-only Arkesel diagnostics — does NOT send any SMS.
 * Reports the account's SMS balance and the raw response Arkesel gives back,
 * so a batch failure can be attributed to balance, auth, or rate limiting.
 *
 * Usage:
 *   bunx convex run smsDiag:checkBalance --prod
 */
export const checkBalance = action({
  args: {},
  returns: v.object({ status: v.number(), body: v.string() }),
  handler: async () => {
    const apiKey = process.env.ARKESEL_API_KEY;
    if (!apiKey) throw new Error("ARKESEL_API_KEY not set");

    const response = await fetch("https://sms.arkesel.com/api/v2/clients/balance-details", {
      headers: { "api-key": apiKey },
    });
    const body = await response.text();
    return { status: response.status, body };
  },
});

/**
 * Fires N back-to-back read-only balance calls (no SMS sent) to see whether
 * Arkesel rate-limits an account that hammers it the way processResetChunk's
 * `runAfter(0)` reschedule loop does.
 *
 *   bunx convex run smsDiag:burst '{"count":30}'
 */
export const burst = action({
  args: { count: v.number() },
  returns: v.array(v.string()),
  handler: async (_ctx, { count }) => {
    const apiKey = process.env.ARKESEL_API_KEY;
    if (!apiKey) throw new Error("ARKESEL_API_KEY not set");

    const results: string[] = [];
    for (let i = 0; i < count; i++) {
      const r = await fetch("https://sms.arkesel.com/api/v2/clients/balance-details", {
        headers: { "api-key": apiKey },
      });
      results.push(`${i + 1}: ${r.status} ${(await r.text()).slice(0, 120)}`);
    }
    return results;
  },
});

/**
 * Sends the template SMS to explicitly-provided phone numbers and returns the
 * RAW Arkesel status + body (unlike sendBatchSms, which swallows it into a
 * boolean-ish result). Use with one throwaway number to see the real error.
 *
 * Usage:
 *   bunx convex run smsDiag:rawSend '{"phones":["0551234567"]}' --prod
 */
export const rawSend = action({
  args: { phones: v.array(v.string()) },
  returns: v.object({ status: v.number(), body: v.string() }),
  handler: async (_ctx, { phones }) => {
    const apiKey = process.env.ARKESEL_API_KEY;
    if (!apiKey) throw new Error("ARKESEL_API_KEY not set");

    const recipients: Record<string, { name: string; email: string; password: string }> = {};
    for (const [i, phone] of phones.entries()) {
      const digits = phone.replace(/[^\d]/g, "");
      const normalized = digits.startsWith("233")
        ? digits
        : digits.startsWith("0")
          ? `233${digits.slice(1)}`
          : digits;
      recipients[normalized] = {
        name: `Diag ${i + 1}`,
        email: `diag${i + 1}@example.com`,
        password: "TEST1234",
      };
    }

    const response = await fetch("https://sms.arkesel.com/api/v2/sms/template/send", {
      method: "POST",
      headers: { "Content-Type": "application/json", "api-key": apiKey },
      body: JSON.stringify({
        sender: "AIMSNetwork",
        message: "Hi <%name%>, diagnostic message. Email: <%email%> Password: <%password%>",
        recipients,
      }),
    });
    const body = await response.text();
    return { status: response.status, body };
  },
});
