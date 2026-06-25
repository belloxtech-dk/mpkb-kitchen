/**
 * Broadcast a WA message to multiple recipients.
 * Primary: WhatsApp Web (user's logged-in Chrome session) — no token needed.
 * Fallback: Fonnte/Twilio API if WA Web fails.
 */
import { broadcastViaAppleScript } from "./wa-applescript";
import { sendWa } from "./wa-send";

/** Send to multiple numbers via WhatsApp Web open in Chrome (AppleScript). */
export async function broadcastToRecipients(phones: string[], text: string): Promise<boolean> {
  console.log(`📲 Sending WA to ${phones.join(", ")} via WhatsApp Web (Chrome)...`);

  try {
    const results = await broadcastViaAppleScript(phones, text);
    const anyOk = results.some(r => r.ok);
    if (anyOk) return true;
    console.warn("AppleScript WA failed:", results);
  } catch (err) {
    console.warn("AppleScript WA error, trying API fallback:", err);
  }

  // Fallback to Fonnte/Twilio API
  const results = await Promise.allSettled(phones.map(p => sendWa(p, text)));
  return results.some(r => r.status === "fulfilled" && r.value.ok);
}
