const ARKESEL_SEND_URL = "https://sms.arkesel.com/api/v2/sms/send";
const ARKESEL_TEMPLATE_SEND_URL = "https://sms.arkesel.com/api/v2/sms/template/send";
const SENDER = "AIMSNetwork";

// Arkesel's template-send endpoint accepts many recipients per request, but we
// still chunk to stay well under any request-size limit on their side and so
// one bad chunk doesn't take down an entire run.
const SMS_BATCH_CHUNK_SIZE = 100;

// Normalizes a Ghanaian phone number to the "233XXXXXXXXX" form Arkesel expects
// (no "+", no leading "0"). Accepts "+233...", "233...", or local "0..." input,
// which is the range of formats seen in convex/data/students.ts and manual entry.
function normalizePhone(phone: string): string {
  const digits = phone.replace(/[^\d]/g, "");
  if (digits.startsWith("233")) return digits;
  if (digits.startsWith("0")) return `233${digits.slice(1)}`;
  return digits;
}

export async function sendSms(apiKey: string, phone: string, message: string): Promise<void> {
  const response = await fetch(ARKESEL_SEND_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", "api-key": apiKey },
    body: JSON.stringify({ sender: SENDER, message, recipients: [normalizePhone(phone)] }),
  });
  const body = await response.json();
  if (!response.ok) {
    console.error("Arkesel SMS error:", body);
    throw new Error(`SMS delivery failed (${response.status}): ${JSON.stringify(body)}`);
  }
  console.log("SMS sent:", body);
}

export function passwordSmsMessage(firstName: string, email: string, password: string): string {
  return (
    `Hi ${firstName}, your KTU COMPSSA Election Portal account is ready. Visit https://ktucompssa-elect.vercel.app \n` +
    `Email: ${email}\n` +
    `Password: ${password}\n` +
    `Login and change your password after first sign-in.`
  );
}

const PASSWORD_SMS_TEMPLATE =
  `Hi <%name%>, your KTU COMPSSA Election Portal account is ready. Visit https://ktucompssa-elect.vercel.app \n` +
  `Email: <%email%>\n` +
  `Password: <%password%>\n` +
  `Login and change your password after first sign-in.`;

export type SmsRecipient = {
  phone: string;
  name: string;
  email: string;
  password: string;
};

export type BatchSmsResult = {
  sentCount: number;
  failedPhones: string[];
  /** Arkesel's own words for each failed chunk, so callers can record *why*. */
  failureReasons: string[];
};

/**
 * Sends password-credential SMS to many recipients using Arkesel's
 * template-send endpoint — one HTTP call per chunk of up to
 * SMS_BATCH_CHUNK_SIZE recipients, instead of one call per recipient.
 * A failed chunk is recorded (all its phones reported in `failedPhones`)
 * and processing continues with the remaining chunks.
 */
export async function sendBatchSms(
  apiKey: string,
  recipients: SmsRecipient[],
): Promise<BatchSmsResult> {
  let sentCount = 0;
  const failedPhones: string[] = [];
  const failureReasons: string[] = [];

  for (let i = 0; i < recipients.length; i += SMS_BATCH_CHUNK_SIZE) {
    const chunk = recipients.slice(i, i + SMS_BATCH_CHUNK_SIZE);
    const recipientsMap: Record<string, { name: string; email: string; password: string }> = {};
    for (const r of chunk) {
      recipientsMap[normalizePhone(r.phone)] = {
        name: r.name,
        email: r.email,
        password: r.password,
      };
    }

    try {
      const response = await fetch(ARKESEL_TEMPLATE_SEND_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", "api-key": apiKey },
        body: JSON.stringify({
          sender: SENDER,
          message: PASSWORD_SMS_TEMPLATE,
          recipients: recipientsMap,
        }),
      });
      // Read as text first: Arkesel returns HTML/plain-text bodies on some
      // failures, and response.json() would throw and hide the real reason.
      const raw = await response.text();
      let parsed: unknown;
      try {
        parsed = JSON.parse(raw);
      } catch {
        parsed = null;
      }
      // Arkesel answers HTTP 200 with {"status":"..."} for business-level
      // failures (insufficient balance, invalid sender id, bad recipients),
      // so an ok status code alone does NOT mean the messages went out.
      const apiStatus =
        parsed && typeof parsed === "object" && "status" in parsed
          ? String((parsed as { status: unknown }).status)
          : null;

      if (!response.ok || (apiStatus !== null && apiStatus !== "success")) {
        const reason = `HTTP ${response.status} — ${raw.slice(0, 300)}`;
        console.error("Arkesel batch SMS error:", reason);
        failedPhones.push(...chunk.map((r) => r.phone));
        failureReasons.push(reason);
        continue;
      }
      sentCount += chunk.length;
    } catch (err) {
      const reason = err instanceof Error ? err.message : String(err);
      console.error("Arkesel batch SMS request failed:", reason);
      failedPhones.push(...chunk.map((r) => r.phone));
      failureReasons.push(reason);
    }
  }

  return { sentCount, failedPhones, failureReasons };
}
