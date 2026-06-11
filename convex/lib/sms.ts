export async function sendSms(apiKey: string, phone: string, message: string) {
  const response = await fetch("https://sms.arkesel.com/api/v2/sms/send", {
    method: "POST",
    headers: { "Content-Type": "application/json", "api-key": apiKey },
    body: JSON.stringify({ sender: "AIMSNetwork", message, recipients: [phone] }),
  });
  const body = await response.json();
  if (!response.ok) console.error("Arkesel SMS error:", body);
  else console.log("SMS sent:", body);
}

export function passwordSmsMessage(firstName: string, email: string, password: string): string {
  return (
    `Hi ${firstName}, your COMPSSA Election Portal account is ready. Visit https://ktucompssa-elect.vercel.app \n` +
    `Email: ${email}\n` +
    `Password: ${password}\n` +
    `Login and change your password after first sign-in.`
  );
}
