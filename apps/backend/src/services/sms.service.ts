// eslint-disable-next-line @typescript-eslint/no-require-imports
const AfricasTalking = require("africastalking") as (opts: { apiKey: string; username: string }) => {
  SMS: { send: (opts: { to: string[]; message: string; from?: string }) => Promise<unknown> };
};

let _sms: ReturnType<typeof AfricasTalking>["SMS"] | null = null;

function getSms() {
  if (!_sms) {
    const apiKey = process.env.AT_API_KEY;
    const username = process.env.AT_USERNAME;
    if (!apiKey || !username) return null;
    _sms = AfricasTalking({ apiKey, username }).SMS;
  }
  return _sms;
}

export async function sendSms(to: string, message: string): Promise<void> {
  const sms = getSms();
  if (!sms) {
    console.warn("SMS not configured: AT_API_KEY or AT_USERNAME missing");
    return;
  }
  try {
    await sms.send({ to: [to], message, from: process.env.AT_SENDER_ID });
    console.log(`SMS sent to ${to}`);
  } catch (err) {
    console.error(`SMS failed to ${to}:`, err);
  }
}
