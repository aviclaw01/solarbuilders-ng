import { appendToSheet } from "@/lib/sheets";
import {
  rateLimit,
  clientIp,
  tooManyRequests,
  readJson,
  fail,
  esc,
  isHoneypotFilled,
} from "@/lib/api";
import {
  validateFields,
  requiredPhone,
  requiredText,
  cleanString,
  isState,
  type FieldErrors,
} from "@/lib/validation";
import { FROM_EMAIL, LEAD_EMAILS } from "@/lib/site";
import { storeLead, type LeadKind } from "@/lib/leads";

/**
 * "Tell us what you need" — the free-text capture box (components/ui/NeedBox).
 *
 * Same contract as api/lead-capture: two independent sinks (Supabase `leads`
 * and the team inbox), and the answer says which worked. The browser has
 * already opened WhatsApp with the same text before this request is sent, so
 * this row is the record for a visitor who never presses send in WhatsApp.
 *
 *   200 { ok: true, emailed, stored }   400 { ok: false, error, fields? }   429
 */

export const dynamic = "force-dynamic";

const RATE_LIMIT = { windowMs: 10 * 60 * 1000, max: 5 };
const MESSAGE_MIN = 10;
const MESSAGE_MAX = 500;
const UTM_KEYS = ["utm_source", "utm_medium", "utm_campaign"] as const;

// `leads.kind` is free text in the table (supabase/leads.sql); LeadKind in
// lib/leads.ts has not been widened to name this form yet.
const KIND = "need" as string as LeadKind;

export async function POST(req: Request) {
  const limit = rateLimit(`need:${clientIp(req)}`, RATE_LIMIT);
  if (limit.limited) {
    return tooManyRequests(
      "Too many requests from this connection. Please wait a few minutes, or reach us on WhatsApp.",
      limit.retryAfterSec,
    );
  }

  const parsed = await readJson(req);
  if (!parsed.ok) return fail("Invalid request. Please refresh and try again.", 400);

  if (isHoneypotFilled(parsed.data)) {
    console.warn("[need] honeypot tripped from", clientIp(req));
    return Response.json({ ok: true });
  }

  const validated = validateFields(parsed.data, {
    message: (v) => {
      const s = typeof v === "string" ? v.trim() : "";
      if (s.length > MESSAGE_MAX) return `Keep it under ${MESSAGE_MAX} characters.`;
      return requiredText("Tell us what you need", MESSAGE_MIN, MESSAGE_MAX)(v);
    },
    phone: requiredPhone("WhatsApp number"),
    state: (v) => {
      const s = cleanString(v, 40);
      return s && !isState(s) ? "Pick a state from the list." : null;
    },
  });
  if (!validated.ok) {
    return fail("Please fix the highlighted fields.", 400, validated.errors as FieldErrors);
  }

  const message = cleanString(parsed.data.message, MESSAGE_MAX);
  const phone = cleanString(parsed.data.phone, 30);
  const state = cleanString(parsed.data.state, 40) || null;
  const page = cleanString(parsed.data.page, 200) || null;
  const placement = cleanString(parsed.data.placement, 60) || null;
  const rawUtm = (parsed.data.utm && typeof parsed.data.utm === "object" ? parsed.data.utm : {}) as Record<string, unknown>;
  const utm: Record<string, string> = {};
  for (const k of UTM_KEYS) {
    const v = cleanString(rawUtm[k], 64);
    if (v) utm[k] = v;
  }

  const stored = await storeLead({
    kind: KIND,
    phone,
    location: state,
    message,
    payload: { page, placement, utm },
  });

  const sheet = await appendToSheet({ type: "need", phone, location: state, details: message, page });

  let emailed = false;
  const apiKey = process.env.RESEND_API_KEY;
  if (apiKey) {
    try {
      const { Resend } = await import("resend");
      const resend = new Resend(apiKey);
      await resend.emails.send({
        from: FROM_EMAIL,
        to: LEAD_EMAILS,
        subject: `[SolarBuilders] New "what I need" message${state ? ` — ${state}` : ""}`,
        html: `<h2>Tell us what you need</h2><p><b>WhatsApp:</b> ${esc(phone)}<br/><b>State:</b> ${esc(state ?? "not given")}<br/><b>Page:</b> ${esc(page ?? "")}</p><p style="white-space:pre-wrap">${esc(message)}</p>`,
      });
      emailed = true;
    } catch (err) {
      console.error("[need] Resend failed:", err);
    }
  } else {
    console.warn("[need] RESEND_API_KEY not set — message NOT emailed");
  }

  if (!emailed && !stored && !sheet) {
    return fail("We couldn't record that just now. Please try again in a minute, or message us on WhatsApp.", 500);
  }

  return Response.json({ ok: true, emailed, stored });
}
