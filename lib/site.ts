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

/**
 * Social accounts, in one place.
 *
 * Flip `claimed` to true only once the account actually exists and is owned by
 * us — the footer and the JSON-LD `sameAs` list render claimed accounts only,
 * so an unclaimed handle never becomes a dead link on the live site.
 * Handles are chosen to be consistent; if a platform rejects one at signup,
 * update the url here in the same commit as the account.
 */
export interface SocialAccount {
  id: "instagram" | "facebook" | "twitter" | "youtube" | "tiktok" | "linkedin";
  label: string;
  url: string;
  claimed: boolean;
}

export const SOCIALS: SocialAccount[] = [
  { id: "instagram", label: "Instagram", url: "https://www.instagram.com/solarbuildersng", claimed: true },
  { id: "facebook", label: "Facebook", url: "https://www.facebook.com/solarbuildersng", claimed: true },
  { id: "twitter", label: "X (Twitter)", url: "https://x.com/solarbuildersng", claimed: false },
  { id: "youtube", label: "YouTube", url: "https://www.youtube.com/@solarbuildersng", claimed: false },
  { id: "tiktok", label: "TikTok", url: "https://www.tiktok.com/@solarbuildersng", claimed: false },
  { id: "linkedin", label: "LinkedIn", url: "https://www.linkedin.com/company/solarbuildersng", claimed: false },
];

export function claimedSocials(): SocialAccount[] {
  return SOCIALS.filter((s) => s.claimed);
}
