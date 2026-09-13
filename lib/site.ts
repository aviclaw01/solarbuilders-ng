/**
 * Site-wide contact / config. Change the number or emails here only.
 */
export const SITE_URL = "https://solarbuildersng.com";
export const SITE_NAME = "SolarBuilders.ng";

/** WhatsApp number that receives quote requests (digits only, with country code) */
export const CONTACT_WHATSAPP = "2349168394923";

/** Inboxes that receive quote-request emails */
export const LEAD_EMAILS = ["solar@nexprove.com"];
export const FROM_EMAIL = "SolarBuilders.ng <noreply@nexprove.com>";

export function whatsappLink(text: string, number: string = CONTACT_WHATSAPP): string {
  return `https://wa.me/${number}?text=${encodeURIComponent(text)}`;
}
