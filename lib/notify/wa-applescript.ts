/**
 * WhatsApp Web sender via AppleScript + Chrome JavaScript injection.
 * Works with the already-open WhatsApp Web tab — no new browser launch.
 * macOS only.
 */

import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

async function runAppleScript(script: string): Promise<string> {
  const { stdout } = await execAsync(`osascript -e '${script.replace(/'/g, "'\\''")}'`);
  return stdout.trim();
}

async function runJsInChrome(js: string): Promise<string> {
  // Escape for AppleScript string
  const escaped = js.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/'/g, "'\\''");
  const script = `tell application "Google Chrome"
    set theResult to execute front window's active tab javascript "${escaped}"
    return theResult as string
  end tell`;
  try {
    const { stdout } = await execAsync(`osascript << 'APPLESCRIPT'\n${script}\nAPPLESCRIPT`);
    return stdout.trim();
  } catch {
    return "";
  }
}

async function openWaChat(phone: string, text: string): Promise<void> {
  const normalized = phone.replace(/[^\d]/g, "");
  const url = `https://web.whatsapp.com/send?phone=${normalized}&text=${encodeURIComponent(text)}`;

  // Navigate existing WhatsApp Web tab to the chat
  const script = `tell application "Google Chrome"
    set theTab to active tab of front window
    set URL of theTab to "${url}"
  end tell`;
  await execAsync(`osascript << 'APPLESCRIPT'\n${script}\nAPPLESCRIPT`);
}

function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)); }

export interface WaResult {
  ok: boolean;
  to: string;
  reason?: string;
}

/**
 * Send a WhatsApp message by injecting JS into the open WhatsApp Web tab.
 */
export async function sendViaWaAppleScript(phone: string, text: string): Promise<WaResult> {
  const normalized = phone.replace(/[^\d]/g, "");

  try {
    // Navigate to the chat
    await openWaChat(normalized, text);
    await sleep(5000); // wait for WA to load the chat

    // Click the send button or press Enter via JS
    const sent = await runJsInChrome(`
      (function() {
        // Find the send button
        var btn = document.querySelector('[data-testid="send"]') ||
                  document.querySelector('[aria-label="Send"]') ||
                  document.querySelector('span[data-icon="send"]')?.closest('button');
        if (btn) { btn.click(); return 'sent'; }
        // Try pressing Enter in the input
        var input = document.querySelector('[data-testid="conversation-compose-box-input"]');
        if (input) {
          input.focus();
          var ev = new KeyboardEvent('keydown', {key:'Enter', code:'Enter', keyCode:13, which:13, bubbles:true});
          input.dispatchEvent(ev);
          return 'enter-pressed';
        }
        return 'no-input-found';
      })()
    `);

    await sleep(2000);
    console.log(`✅ WA to ${normalized}: ${sent}`);
    return { ok: sent !== "no-input-found", to: normalized };

  } catch (err) {
    return { ok: false, to: normalized, reason: String(err) };
  }
}

/**
 * Broadcast to multiple numbers sequentially.
 */
export async function broadcastViaAppleScript(phones: string[], text: string): Promise<WaResult[]> {
  const results: WaResult[] = [];
  for (const phone of phones) {
    const r = await sendViaWaAppleScript(phone, text);
    results.push(r);
    await sleep(3000); // pause between sends
  }

  // Restore WhatsApp Web home after sending
  try {
    await runJsInChrome(`window.location.href = 'https://web.whatsapp.com/'`);
  } catch { /* best-effort */ }

  return results;
}
