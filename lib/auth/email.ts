/**
 * Magic-link email delivery via Brevo (transactional HTTP API).
 *
 * The link is a bearer credential, so it is ONLY ever printed to the console in
 * development. In production it is sent via Brevo and never logged; a send failure
 * logs the error (not the link).
 */

const isDev = process.env.NODE_ENV !== "production";

interface Sender {
  name?: string;
  email: string;
}

/** Parse `EMAIL_FROM` ("Name <addr@domain>" or "addr@domain") into Brevo's sender shape. */
function parseSender(from: string): Sender {
  const match = from.match(/^\s*(.*?)\s*<([^>]+)>\s*$/);
  if (match) return { name: match[1] || undefined, email: match[2]!.trim() };
  return { email: from.trim() };
}

/** Dev-only convenience: print the link so the flow is testable without an email provider. */
function logLinkInDev(email: string, url: string): void {
  if (isDev) console.log(`\n🔗 [magic-link] sign-in link for ${email}:\n${url}\n`);
}

export async function sendMagicLinkEmail(email: string, url: string): Promise<void> {
  const key = process.env.BREVO_API_KEY;
  const from = process.env.EMAIL_FROM || "Dapur Amanah <login@dapuramanah.com>";

  if (!key) {
    if (isDev) logLinkInDev(email, url);
    else console.error("[magic-link] BREVO_API_KEY is not set — cannot send the sign-in email.");
    return;
  }

  try {
    const res = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: { "api-key": key, "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify({
        sender: parseSender(from),
        to: [{ email }],
        subject: "Masuk ke MPKB · Sign in to MPKB",
        htmlContent: `<p>Klik tautan berikut untuk masuk. / Click the link below to sign in.</p>
                      <p><a href="${url}">${url}</a></p>
                      <p style="color:#888;font-size:12px">Tautan ini akan kedaluwarsa. / This link will expire.</p>`,
      }),
    });
    if (!res.ok) {
      console.error("[magic-link] Brevo error:", res.status, await res.text());
      logLinkInDev(email, url); // dev only — never log the link in production
    }
  } catch (err) {
    console.error("[magic-link] send failed:", err);
    logLinkInDev(email, url); // dev only
  }
}
