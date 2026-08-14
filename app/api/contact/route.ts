import { Resend } from "resend";

export async function POST(req: Request) {
  const body = await req.json();
  const { name, email, phone, message } = body;

  const apiKey = process.env.RESEND_API_KEY;
  if (apiKey) {
    const resend = new Resend(apiKey);
    await resend.emails.send({
      from: "SolarBuilders.ng <noreply@nexprove.com>",
      to: ["solar@nexprove.com", "nexprove@gmail.com"],
      subject: `[SolarBuilders] Contact: ${name}`,
      html: `<h2>New Contact Message</h2><p><b>Name:</b> ${name}<br/><b>Email:</b> ${email}<br/><b>Phone:</b> ${phone || 'Not provided'}<br/><b>Message:</b> ${message}</p>`,
    });
  }

  return Response.json({ ok: true });
}
