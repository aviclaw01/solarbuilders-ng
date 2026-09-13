import { Resend } from "resend";
import { FROM_EMAIL, LEAD_EMAILS } from "@/lib/site";

export async function POST(req: Request) {
  const body = await req.json();
  const { whatsapp, state, systemSize } = body;

  const apiKey = process.env.RESEND_API_KEY;
  if (apiKey) {
    const resend = new Resend(apiKey);
    await resend.emails.send({
      from: FROM_EMAIL,
      to: LEAD_EMAILS,
      subject: `[SolarBuilders] 🔥 New Lead — ${state} — ${systemSize}`,
      html: `<h2>New Lead from Calculator</h2><p><b>WhatsApp:</b> ${whatsapp}<br/><b>State:</b> ${state}<br/><b>System Size:</b> ${systemSize}</p>`,
    });
  }

  return Response.json({ ok: true });
}
