/**
 * WhatsApp Web sender — uses the user's already-logged-in Chrome session
 * to send messages via web.whatsapp.com automation.
 *
 * No API token needed — piggybacks on the existing browser session.
 */

import { chromium } from "playwright-core";

// Find Chrome/Chromium path on macOS
function getChromePath(): string {
  const candidates = [
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/Applications/Chromium.app/Contents/MacOS/Chromium",
    "/Applications/Google Chrome Canary.app/Contents/MacOS/Google Chrome Canary",
  ];
  for (const p of candidates) {
    try {
      require("fs").accessSync(p);
      return p;
    } catch { /* not found */ }
  }
  throw new Error("Chrome not found. Install Google Chrome.");
}

// Chrome user data dir (has the WhatsApp Web session)
const USER_DATA_DIR = `${process.env.HOME}/Library/Application Support/Google/Chrome`;

export interface WaWebResult {
  ok: boolean;
  to: string;
  reason?: string;
}

/**
 * Send a WhatsApp message via web.whatsapp.com using the existing logged-in session.
 * Uses a persistent Chrome profile so login state is preserved.
 */
export async function sendViaWaWeb(phone: string, text: string): Promise<WaWebResult> {
  const normalized = phone.replace(/[^\d]/g, "");

  let browser;
  try {
    // Launch Chrome with the user's profile (already logged into WA Web)
    browser = await chromium.launchPersistentContext(USER_DATA_DIR, {
      executablePath: getChromePath(),
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-blink-features=AutomationControlled",
        "--profile-directory=Default",
      ],
    });

    const page = await browser.newPage();

    // Navigate directly to the chat with this number
    const url = `https://web.whatsapp.com/send?phone=${normalized}&text=${encodeURIComponent(text)}`;
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });

    // Wait for the message input box to appear
    await page.waitForSelector('[data-testid="conversation-compose-box-input"]', { timeout: 20000 });

    // Small wait for any animations
    await page.waitForTimeout(2000);

    // Press Enter to send
    await page.keyboard.press("Enter");

    // Wait for message to send (sent checkmark)
    await page.waitForTimeout(3000);

    await browser.close();
    return { ok: true, to: normalized };

  } catch (err) {
    await browser?.close().catch(() => {});
    return { ok: false, to: normalized, reason: String(err) };
  }
}

/**
 * Send to multiple recipients via WA Web.
 * Reuses the same browser session for efficiency.
 */
export async function broadcastViaWaWeb(phones: string[], text: string): Promise<WaWebResult[]> {
  let browser;
  const results: WaWebResult[] = [];

  try {
    browser = await chromium.launchPersistentContext(USER_DATA_DIR, {
      executablePath: getChromePath(),
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-blink-features=AutomationControlled",
        "--profile-directory=Default",
      ],
    });

    for (const phone of phones) {
      const normalized = phone.replace(/[^\d]/g, "");
      try {
        const page = await browser.newPage();
        const url = `https://web.whatsapp.com/send?phone=${normalized}&text=${encodeURIComponent(text)}`;
        await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });
        await page.waitForSelector('[data-testid="conversation-compose-box-input"]', { timeout: 20000 });
        await page.waitForTimeout(2000);
        await page.keyboard.press("Enter");
        await page.waitForTimeout(3000);
        await page.close();
        results.push({ ok: true, to: normalized });
        console.log(`✅ WA sent to ${normalized}`);
      } catch (err) {
        results.push({ ok: false, to: normalized, reason: String(err) });
        console.error(`❌ WA failed to ${normalized}: ${err}`);
      }
    }
  } finally {
    await browser?.close().catch(() => {});
  }

  return results;
}
