import { NextResponse } from 'next/server';
import { FROM_EMAIL, LEAD_EMAILS } from '@/lib/site';

export async function POST(req: Request) {
  try {
    const { email, location, budget } = await req.json();
    const apiKey = process.env.RESEND_API_KEY;
    if (apiKey) {
      const { Resend } = await import('resend');
      const resend = new Resend(apiKey);
      await resend.emails.send({
        from: FROM_EMAIL,
        to: LEAD_EMAILS,
        subject: `[SolarBuilders] Notify Me — ${location} / ${budget}`,
        html: `<h2>Notify Me Request</h2><p><b>Email:</b> ${email}<br/><b>Location:</b> ${location}<br/><b>Budget:</b> ${budget}</p>`,
      });
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
