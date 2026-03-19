import { Resend } from "resend";

export async function POST(req: Request) {
  const body = await req.json();
  const {
    businessName, whatsapp, state, yearsInBusiness,
    services, systemSizes, startingPrice, bio, instagram,
    ref1Name, ref1Phone, ref2Name, ref2Phone,
  } = body;

  const apiKey = process.env.RESEND_API_KEY;
  if (apiKey) {
    const resend = new Resend(apiKey);
    await resend.emails.send({
      from: "SolarBuilders.ng <noreply@nexprove.com>",
      to: "sitecheck@nexprove.com",
      subject: `New Builder Application — ${businessName}`,
      html: `
        <h2>New Builder Application</h2>
        <p><b>Business Name:</b> ${businessName}</p>
        <p><b>WhatsApp:</b> ${whatsapp}</p>
        <p><b>State:</b> ${state}</p>
        <p><b>Years in Business:</b> ${yearsInBusiness}</p>
        <p><b>Services:</b> ${Array.isArray(services) ? services.join(', ') : services}</p>
        <p><b>System Sizes:</b> ${Array.isArray(systemSizes) ? systemSizes.join(', ') : systemSizes}</p>
        <p><b>Starting Price:</b> ${startingPrice || 'Not provided'}</p>
        <p><b>Bio:</b> ${bio || 'Not provided'}</p>
        <p><b>Instagram:</b> ${instagram || 'Not provided'}</p>
        <hr/>
        <h3>References</h3>
        <p><b>Ref 1:</b> ${ref1Name} — ${ref1Phone}</p>
        <p><b>Ref 2:</b> ${ref2Name} — ${ref2Phone}</p>
      `,
    });
  }

  return Response.json({ ok: true });
}
