import { Resend } from "resend";

export async function POST(req: Request) {
  const body = await req.json();
  const { whatsapp, state, systemSize } = body;

  const apiKey = process.env.RESEND_API_KEY;
  if (apiKey) {
    const resend = new Resend(apiKey);
    await resend.emails.send({
      from: "SolarBuilders.ng <noreply@nexprove.com>",
      to: "sitecheck@nexprove.com",
      subject: `New Lead — ${state} — ${systemSize}`,
      html: `<p><b>WhatsApp:</b> ${whatsapp}<br/><b>State:</b> ${state}<br/><b>System Size:</b> ${systemSize}</p>`,
    });
  }

  return Response.json({ ok: true });
}
