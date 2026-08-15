import { action } from "./_generated/server";
import { v } from "convex/values";
import { sendBatchSms } from "./lib/sms";

/**
 * Sends the password-credential template SMS to one or two phone numbers
 * with fake credentials, purely to confirm the Arkesel template-send API
 * call goes through (correct payload shape, valid api key, template
 * placeholders populate correctly). Does not touch the users table.
 *
 * Usage:
 *   bunx convex run testSms:sendTestSms '{"phones":["0551234567"]}'
 */
export const sendTestSms = action({
  args: { phones: v.array(v.string()) },
  returns: v.object({ sentCount: v.number(), failedPhones: v.array(v.string()) }),
  handler: async (ctx, { phones }) => {
    const apiKey = process.env.ARKESEL_API_KEY;
    if (!apiKey) throw new Error("ARKESEL_API_KEY not set");

    const recipients = phones.map((phone, i) => ({
      phone,
      name: `Test User ${i + 1}`,
      email: `testuser${i + 1}@example.com`,
      password: "TEST1234",
    }));

    return await sendBatchSms(apiKey, recipients);
  },
});
