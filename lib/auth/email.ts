/**
 * Magic-link email delivery via Brevo (transactional HTTP API). If BREVO_API_KEY
 * is unset, the link is logged to the server console (dev fallback) so the flow
 * is testable without an email provider.
 */

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

export async function sendMagicLinkEmail(email: string, url: string): Promise<void> {
  const key = process.env.BREVO_API_KEY;
  const from = process.env.EMAIL_FROM || "Dapur Amanah <login@dapuramanah.com>";

  if (!key) {
    console.log(`\n🔗 [magic-link] sign-in link for ${email}:\n${url}\n`);
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
      console.log(`🔗 [magic-link] ${email}: ${url}`);
    }
  } catch (err) {
    console.error("[magic-link] send failed:", err);
    console.log(`🔗 [magic-link] ${email}: ${url}`);
  }
}
