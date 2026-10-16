import { rateLimit, clientIp, tooManyRequests, readJson, fail, isHoneypotFilled } from "@/lib/api";
import { validateFields, requiredPhone, requiredText, cleanString, isState, type FieldErrors } from "@/lib/validation";
import { storeLead, type LeadKind } from "@/lib/leads";
import { appendToSheet } from "@/lib/sheets";

/**
 * "Contact us now" (components/ui/LeadModals). The browser has already opened
 * WhatsApp with the same details; this row is the record if they never press
 * send, so we can start the conversation ourselves.
 *
 *   200 { ok: true, stored, sheet }   400 { ok: false, error, fields? }   429
 */

export const dynamic = "force-dynamic";

const RATE_LIMIT = { windowMs: 10 * 60 * 1000, max: 5 };
const KIND = "contact_now" as string as LeadKind;

export async function POST(req: Request) {
  const limit = rateLimit(`contact-now:${clientIp(req)}`, RATE_LIMIT);
  if (limit.limited) {
    return tooManyRequests("Too many requests. Please wait a few minutes, or message us on WhatsApp.", limit.retryAfterSec);
  }

  const parsed = await readJson(req);
  if (!parsed.ok) return fail("Invalid request. Please refresh and try again.", 400);
  if (isHoneypotFilled(parsed.data)) return Response.json({ ok: true });

  const validated = validateFields(parsed.data, {
    name: requiredText("Your name", 2, 60),
    phone: requiredPhone("WhatsApp number"),
    state: (v) => {
      const s = cleanString(v, 40);
      if (!s) return "Pick your state.";
      return isState(s) ? null : "Pick a state from the list.";
    },
  });
  if (!validated.ok) return fail("Please fix the highlighted fields.", 400, validated.errors as FieldErrors);

  const name = cleanString(parsed.data.name, 60);
  const phone = cleanString(parsed.data.phone, 30);
  const state = cleanString(parsed.data.state, 40);
  const area = cleanString(parsed.data.area, 80);
  const need = cleanString(parsed.data.need, 300);
  const page = cleanString(parsed.data.page, 200) || null;
  const placement = cleanString(parsed.data.placement, 60) || null;
  const location = area ? `${area}, ${state}` : state;

  const [stored, sheet] = await Promise.all([
    storeLead({ kind: KIND, name, phone, location, message: need || null, payload: { page, placement } }),
    appendToSheet({ type: "contact_now", name, phone, location, details: need || null, page }),
  ]);

  if (!stored && !sheet) {
    return fail("We couldn't record that just now. Your WhatsApp message still reaches us.", 500);
  }
  return Response.json({ ok: true, stored, sheet });
}
