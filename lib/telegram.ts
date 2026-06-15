import { getEnv, telegramEnabled } from "./config";
import type { KitchenAlert } from "./events";

/**
 * Sends a real Telegram message when TELEGRAM_BOT_TOKEN + TELEGRAM_CHAT_ID are set.
 * Returns whether it was actually delivered; the UI shows the alert either way.
 */
export async function sendTelegramAlert(alert: KitchenAlert): Promise<boolean> {
  if (!telegramEnabled()) return false;
  const env = getEnv();
  try {
    const res = await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: env.TELEGRAM_CHAT_ID,
        text: `${alert.title}\n\n${alert.messageId}`,
      }),
    });
    return res.ok;
  } catch {
    return false;
  }
}
