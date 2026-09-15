import { Resend } from "resend";
import { FROM_EMAIL, LEAD_EMAILS } from "@/lib/site";

const BUSINESS_TYPE_LABEL: Record<string, string> = {
  installer: "Installer",
  vendor: "Vendor / distributor",
  both: "Installer and vendor",
  manufacturer: "Manufacturer / distributor",
};

export async function POST(req: Request) {
  const body = await req.json();
  const {
    businessType, businessName, contactEmail, whatsapp, city, state, yearsInBusiness,
    services, systemSizes, startingPrice, bio, instagram,
  } = body;

  const typeLabel = BUSINESS_TYPE_LABEL[businessType] ?? "Not specified";

  const apiKey = process.env.RESEND_API_KEY;
  if (apiKey) {
    const resend = new Resend(apiKey);
    await resend.emails.send({
      from: FROM_EMAIL,
      to: LEAD_EMAILS,
      subject: `[SolarBuilders] Work-with-us application (${typeLabel}) — ${businessName}`,
      html: `
        <h2>New installer / vendor application</h2>
        <p><b>Business type:</b> ${typeLabel}</p>
        <p><b>Business name:</b> ${businessName}</p>
        <p><b>Contact email:</b> ${contactEmail || 'Not provided'}</p>
        <p><b>WhatsApp:</b> ${whatsapp}</p>
        <p><b>City / State:</b> ${city || '-'} / ${state}</p>
        <p><b>Years in business:</b> ${yearsInBusiness}</p>
        <p><b>Services:</b> ${Array.isArray(services) ? services.join(', ') : services}</p>
        <p><b>System sizes:</b> ${Array.isArray(systemSizes) ? systemSizes.join(', ') : systemSizes}</p>
        <p><b>Typical 5kVA price:</b> ${startingPrice || 'Not provided'}</p>
        <p><b>Description:</b> ${bio || 'Not provided'}</p>
        <p><b>Website / Instagram:</b> ${instagram || 'Not provided'}</p>
      `,
    });
  }

  return Response.json({ ok: true });
}
