/**
 * Magic-link email delivery. Uses Resend if RESEND_API_KEY is set; otherwise
 * logs the link to the server console (dev fallback) so the flow is testable
 * without an email provider.
 */
export async function sendMagicLinkEmail(email: string, url: string): Promise<void> {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM || "MPKB <onboarding@resend.dev>";

  if (!key) {
    console.log(`\n🔗 [magic-link] sign-in link for ${email}:\n${url}\n`);
    return;
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from,
        to: email,
        subject: "Masuk ke MPKB · Sign in to MPKB",
        html: `<p>Klik tautan berikut untuk masuk. / Click the link below to sign in.</p>
               <p><a href="${url}">${url}</a></p>
               <p style="color:#888;font-size:12px">Tautan ini akan kedaluwarsa. / This link will expire.</p>`,
      }),
    });
    if (!res.ok) {
      console.error("[magic-link] Resend error:", await res.text());
      console.log(`🔗 [magic-link] ${email}: ${url}`);
    }
  } catch (err) {
    console.error("[magic-link] send failed:", err);
    console.log(`🔗 [magic-link] ${email}: ${url}`);
  }
}
