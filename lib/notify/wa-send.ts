/**
 * Outbound WhatsApp sender — provider-agnostic.
 *
 * Sends a text message to one recipient via whichever provider is configured.
 * Supports: Fonnte (Indonesia, cheapest), Twilio, WhatsApp Cloud API.
 *
 * Activate by setting in env:
 *   WHATSAPP_PROVIDER = "fonnte" | "twilio" | "cloud_api"
 *   + the provider's credentials (see below)
 *
 * If no provider is configured, send() returns { ok:false, reason:"no_provider" }
 * and the report is still saved to the DB (nothing is lost).
 */

export interface SendResult {
  ok: boolean;
  to: string;
  reason?: string;
  providerResponse?: unknown;
}

/** Normalize a phone number to digits only (no +, spaces, dashes). */
export function normalizePhone(phone: string): string {
  return phone.replace(/[^\d]/g, "");
}

export async function sendWa(to: string, text: string): Promise<SendResult> {
  const provider = process.env.WHATSAPP_PROVIDER ?? "";
  const phone = normalizePhone(to);

  try {
    // ── Fonnte (Indonesia) ────────────────────────────────────────────────────
    if (provider === "fonnte") {
      const token = process.env.FONNTE_TOKEN;
      if (!token) return { ok: false, to: phone, reason: "no_fonnte_token" };
      const res = await fetch("https://api.fonnte.com/send", {
        method: "POST",
        headers: { Authorization: token, "Content-Type": "application/json" },
        body: JSON.stringify({ target: phone, message: text, countryCode: "62" }),
      });
      const json = await res.json().catch(() => ({}));
      return { ok: res.ok, to: phone, providerResponse: json };
    }

    // ── Twilio ────────────────────────────────────────────────────────────────
    if (provider === "twilio") {
      const sid = process.env.TWILIO_ACCOUNT_SID;
      const token = process.env.TWILIO_AUTH_TOKEN;
      const from = process.env.TWILIO_WA_NUMBER;
      if (!sid || !token || !from) return { ok: false, to: phone, reason: "no_twilio_creds" };
      const body = new URLSearchParams({
        From: `whatsapp:${from}`,
        To: `whatsapp:+${phone}`,
        Body: text,
      });
      const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Basic ${Buffer.from(`${sid}:${token}`).toString("base64")}`,
        },
        body,
      });
      const json = await res.json().catch(() => ({}));
      return { ok: res.ok, to: phone, providerResponse: json };
    }

    // ── WhatsApp Cloud API (Meta) ─────────────────────────────────────────────
    if (provider === "cloud_api") {
      const token = process.env.WA_CLOUD_TOKEN;
      const phoneId = process.env.WA_PHONE_NUMBER_ID;
      if (!token || !phoneId) return { ok: false, to: phone, reason: "no_cloud_creds" };
      const res = await fetch(`https://graph.facebook.com/v18.0/${phoneId}/messages`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ messaging_product: "whatsapp", to: phone, type: "text", text: { body: text } }),
      });
      const json = await res.json().catch(() => ({}));
      return { ok: res.ok, to: phone, providerResponse: json };
    }

    return { ok: false, to: phone, reason: "no_provider" };
  } catch (err) {
    return { ok: false, to: phone, reason: err instanceof Error ? err.message : "send_error" };
  }
}

/** Default report recipients (overridable via REPORT_RECIPIENTS env, comma-separated). */
export function getReportRecipients(): string[] {
  const env = process.env.REPORT_RECIPIENTS;
  if (env) return env.split(",").map((s) => s.trim()).filter(Boolean);
  // Defaults requested by operator:
  return ["6281353252470", "14152055786"];
}

/** Fire a message to all configured report recipients. Never throws. */
export async function broadcastReport(text: string): Promise<SendResult[]> {
  const recipients = getReportRecipients();
  const results = await Promise.allSettled(recipients.map((to) => sendWa(to, text)));
  return results.map((r, i) =>
    r.status === "fulfilled"
      ? r.value
      : { ok: false, to: recipients[i] ?? "?", reason: "rejected" },
  );
}
