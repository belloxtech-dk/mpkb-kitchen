/**
 * Broadcast a WA message to multiple recipients.
 * Primary: WhatsApp Web (user's logged-in Chrome session) — no token needed.
 * Fallback: Fonnte/Twilio API if WA Web fails.
 */
import { sendWa } from "./wa-send";

/** Send to multiple numbers.
 *  On macOS (local): uses WhatsApp Web via AppleScript (no token needed).
 *  On Linux (Railway/production): uses Fonnte/Twilio API.
 */
export async function broadcastToRecipients(phones: string[], text: string): Promise<boolean> {
  const isMac = process.platform === "darwin";

  if (isMac) {
    try {
      // Dynamic import — AppleScript only works on macOS
      const { broadcastViaAppleScript } = await import("./wa-applescript");
      const results = await broadcastViaAppleScript(phones, text);
      const anyOk = results.some(r => r.ok);
      if (anyOk) return true;
    } catch (err) {
      console.warn("AppleScript WA failed, falling back to API:", err);
    }
  }

  // Production fallback: Fonnte/Twilio/Cloud API
  console.log(`📲 Sending WA via API to ${phones.join(", ")}`);
  const results = await Promise.allSettled(phones.map(p => sendWa(p, text)));
  return results.some(r => r.status === "fulfilled" && r.value.ok);
}
