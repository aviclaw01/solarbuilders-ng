import { Resend } from "resend";

export async function POST(req: Request) {
  const body = await req.json();
  const { builderSlug, builderName, authorName, location, rating, reviewBody } = body;

  const apiKey = process.env.RESEND_API_KEY;
  if (apiKey) {
    const resend = new Resend(apiKey);
    await resend.emails.send({
      from: "SolarBuilders.ng <noreply@nexprove.com>",
      to: "sitecheck@nexprove.com",
      subject: `New Review — ${builderName}`,
      html: `<p><b>Builder:</b> ${builderName} (${builderSlug})<br/><b>Author:</b> ${authorName}<br/><b>Location:</b> ${location}<br/><b>Rating:</b> ${rating}/5<br/><b>Review:</b> ${reviewBody}</p>`,
    });
  }

  return Response.json({ ok: true });
}
