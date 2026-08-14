import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { email, location, budget } = await req.json();
    const apiKey = process.env.RESEND_API_KEY;
    if (apiKey) {
      const { Resend } = await import('resend');
      const resend = new Resend(apiKey);
      await resend.emails.send({
        from: 'SolarBuilders.ng <noreply@nexprove.com>',
        to: ['solar@nexprove.com', 'nexprove@gmail.com'],
        subject: `[SolarBuilders] Notify Me — ${location} / ${budget}`,
        html: `<h2>Notify Me Request</h2><p><b>Email:</b> ${email}<br/><b>Location:</b> ${location}<br/><b>Budget:</b> ${budget}</p>`,
      });
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
