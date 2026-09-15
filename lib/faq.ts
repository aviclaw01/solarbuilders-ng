/**
 * SolarBuilders.ng — FAQ content
 *
 * SINGLE SOURCE for every question we answer publicly. The /faq page renders
 * these, the shop page renders the `SHOP_FAQS` subset, and both build their
 * FAQPage JSON-LD from the same array via `faqPageJsonLd()` — so the schema
 * Google reads can never say something different from what a human reads.
 *
 * RULES FOR EDITING THIS FILE
 *  1. Every ₦ figure is COMPUTED from lib/prices.ts or the quote engine.
 *     Never type a naira amount here. If a number can't be computed, the
 *     answer says we don't publish it.
 *  2. Nothing may claim stock levels, delivery dates, customer counts,
 *     installed-system counts or testimonials. We don't have them.
 *  3. Nothing may contradict the model: no card payment on this site, no
 *     mark-up on equipment, no vendor contacts published, no lender
 *     partnership.
 *  4. Answers are 2–4 sentences of plain Nigerian-practical English, honest
 *     about what we don't know.
 */

import {
  EQUIPMENT_VAT,
  HEADLINE_PACKAGES,
  INVERTER_PER_KVA,
  LABOUR_FLOOR,
  LABOUR_PER_KVA,
  LITHIUM_MODULE_KWH,
  LITHIUM_PER_KWH,
  PANEL_PER_WP,
  PANEL_WATTS,
  PRICES_LAST_UPDATED_LABEL,
  TUBULAR_200AH,
  USD_NGN_RATE,
} from "./prices";
import { buildQuote, formatNaira, formatNairaShort, formatRange } from "./quote";
import { LENDERS, repaymentOptions } from "./finance";
import { getScenario, scenarioQuote, type SizingScenario } from "./sizing";

// ─────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────

export type FaqCategory = "buying" | "sizing" | "prices" | "installation" | "payment" | "about-us";

export interface FaqItem {
  q: string;
  a: string;
  category: FaqCategory;
  /** optional internal link shown under the answer */
  link?: { href: string; label: string };
}

export interface FaqGroup {
  category: FaqCategory;
  label: string;
  blurb: string;
  items: FaqItem[];
}

// ─────────────────────────────────────────────────────────
// COMPUTED FIGURES
// Everything below comes out of lib/prices.ts or the quote engine.
// ─────────────────────────────────────────────────────────

function requireScenario(slug: string): SizingScenario {
  const s = getScenario(slug);
  if (!s) throw new Error(`lib/faq.ts: unknown sizing scenario "${slug}"`);
  return s;
}

const SC = {
  oneBed: requireScenario("how-many-solar-panels-for-1-bedroom-flat"),
  twoBed: requireScenario("how-many-solar-panels-for-2-bedroom-flat"),
  threeBed: requireScenario("how-many-solar-panels-for-3-bedroom-flat"),
  fourBed: requireScenario("solar-for-4-bedroom-house-with-2-acs"),
  ac: requireScenario("what-size-inverter-for-1-5hp-ac"),
  essentials: requireScenario("solar-for-lights-fans-and-tv-only"),
};

/** The Standard tier of a scenario — what most Nigerian homes actually install. */
const std = (s: SizingScenario) => scenarioQuote(s).tiers.standard;

const oneBed = std(SC.oneBed);
const twoBed = std(SC.twoBed);
const threeBed = std(SC.threeBed);
const fourBed = std(SC.fourBed);
const acOnly = std(SC.ac);
const essentials = std(SC.essentials);

/** The same two-bedroom house, re-quoted on tubular batteries instead of lithium. */
const twoBedTubular = buildQuote(SC.twoBed.appliances, { standard: { battery: "tubular" } }).tiers.standard;

const STARTER = HEADLINE_PACKAGES[0];
const ONE_AC = HEADLINE_PACKAGES[2];
const BIG_HOME = HEADLINE_PACKAGES[3];
const OFFICE = HEADLINE_PACKAGES[4];

/** A mid-class hybrid inverter of the most-installed size, at the cheapest and dearest asks we saw. */
const REF_KVA = twoBed.inverterKva;
const invLow = INVERTER_PER_KVA.mid.low * REF_KVA;
const invHigh = INVERTER_PER_KVA.mid.high * REF_KVA;
const invSpread = String(Number((INVERTER_PER_KVA.mid.high / INVERTER_PER_KVA.mid.low).toFixed(1)));

/** One 550W panel, at the wholesale floor and the showroom ceiling. */
const panelBest = PANEL_PER_WP.best * PANEL_WATTS;
const panelLow = PANEL_PER_WP.low * PANEL_WATTS;
const panelHigh = PANEL_PER_WP.high * PANEL_WATTS;

/** One lithium module vs one tubular battery, like for like on the shelf. */
const lithiumModule = LITHIUM_PER_KWH.mid.best * LITHIUM_MODULE_KWH;
const lithiumBank = twoBed.bom[1].lineCost;
const tubularBank = twoBedTubular.bom[1].lineCost;

/** Cheapest full-cover repayment the lenders we list advertise on a one-AC family home. */
const financeRef = repaymentOptions(ONE_AC.low)[0];

const size = (t: typeof twoBed) =>
  `${t.inverterKva}kVA inverter, ${t.batteryKwh}kWh of lithium and ${t.panelCount} × ${PANEL_WATTS}W panels (${t.arrayKwp}kWp)`;

// ─────────────────────────────────────────────────────────
// SHOP QUESTIONS
// Rendered on /shop as well as /faq — defined once, spread into FAQS below.
// ─────────────────────────────────────────────────────────

export const SHOP_FAQS: FaqItem[] = [
  {
    q: "Do you hold stock of any of this?",
    a: `No. We hold no inventory and no warehouse, so we will never tell you something is "in stock" when we haven't looked. What you see here are the prices sellers were asking when we checked in ${PRICES_LAST_UPDATED_LABEL}. When you send an order request we ring the distributor, confirm what is actually available and what it costs today, and come back to you before anything is agreed.`,
    category: "buying",
    link: { href: "/how-it-works", label: "How an order actually runs" },
  },
  {
    q: "Are the prices on this page final?",
    a: `No — they are listings, not quotes. Where a price shows a range, that is the real spread we saw across different sellers for the same model, and a ${REF_KVA}kVA mid-class inverter alone ran from ${formatNaira(invLow)} to ${formatNaira(invHigh)} depending on where you walked in. Your final figure comes after we confirm today's price with the distributor, and it includes anything the listing doesn't, like transport to your street.`,
    category: "buying",
  },
  {
    q: "Can I buy just one item — only a battery, or only panels?",
    a: `Yes. Plenty of people already own an inverter and only need storage, or want to add panels to a system that runs on the grid at night. Add the single item to an order request and we source it the same way we would a full build. For very small orders we will say so if the transport makes it not worth doing through us.`,
    category: "buying",
    link: { href: "/shop", label: "Browse equipment prices" },
  },
  {
    q: "Do you deliver outside Lagos?",
    a: `Equipment can go anywhere goods move in Nigeria, and transport is quoted as its own line rather than buried in the price. We won't promise you a delivery date on this page, because it depends on the distributor, the load and your location — we give you the real figure and the real timing after we have confirmed the order with the supplier. Installation is a separate question: our labour figures are priced for Lagos, Abuja and Port Harcourt, and outside those we tell you honestly whether we have someone.`,
    category: "buying",
    link: { href: "/contact", label: "Ask us about your city" },
  },
  {
    q: "What if the price has changed since you listed it?",
    a: `Then you hear it from us before you pay anyone, up or down. Equipment here is imported and priced against the dollar — ${formatNaira(USD_NGN_RATE)} to $1 when this catalogue was checked — so a move in the naira moves these numbers. Nothing is agreed until you have the confirmed figure in writing.`,
    category: "buying",
  },
];

// ─────────────────────────────────────────────────────────
// EVERY QUESTION
// ─────────────────────────────────────────────────────────

export const FAQS: FaqItem[] = [
  // ── Prices ───────────────────────────────────────────
  {
    q: "How much does a solar system cost in Nigeria?",
    a: `At ${PRICES_LAST_UPDATED_LABEL} prices, a small system for lights, fans, a TV and a fridge — no air conditioning — runs ${formatNairaShort(STARTER.low)}–${formatNairaShort(STARTER.high)} installed. A family home with one AC (${ONE_AC.label}) is ${formatNairaShort(ONE_AC.low)}–${formatNairaShort(ONE_AC.high)}, a large home with two or three ACs is ${formatNairaShort(BIG_HOME.low)}–${formatNairaShort(BIG_HOME.high)}, and an office is ${formatNairaShort(OFFICE.low)}–${formatNairaShort(OFFICE.high)}. Where you land inside a range depends on brand tier, your roof and your city — the calculator gives you your own number instead of a bracket.`,
    category: "prices",
    link: { href: "/calculator", label: "Price my own appliances" },
  },
  {
    q: "Do your prices include installation?",
    a: `Yes. Every quote carries a labour and commissioning line of about ${formatNaira(LABOUR_PER_KVA.best)} per kVA, with a floor of ${formatNaira(LABOUR_FLOOR)} so a small job still gets a proper installer — on the ${REF_KVA}kVA system most families install that comes to ${formatNaira(twoBed.labour.best)} (range ${formatRange(twoBed.labour)}). Mounting rails, cable, breakers, surge protection and earthing are their own line too, so nothing appears at the end that wasn't on the sheet. Transport outside Lagos, Abuja or Port Harcourt is extra and we tell you what it is.`,
    category: "prices",
  },
  {
    q: "Why does the same inverter cost twice as much at one seller as another?",
    a: `Because Nigeria has no single distribution chain for solar: the same mid-class ${REF_KVA}kVA hybrid runs from about ${formatNaira(invLow)} at an Alaba wholesaler to ${formatNaira(invHigh)} in a showroom — a spread of roughly ${invSpread}×. Brand tier widens it further: budget inverters start near ${formatNaira(INVERTER_PER_KVA.budget.low)} per kVA while premium ones reach ${formatNaira(INVERTER_PER_KVA.premium.high)} per kVA. Part of what we do is know which end of that spread a given model should actually sell at, so a high quote can be recognised as high.`,
    category: "prices",
    link: { href: "/brands", label: "Prices by brand" },
  },
  {
    q: "Is the price on my quote final?",
    a: `No. It is an estimate built from Nigerian listings as of ${PRICES_LAST_UPDATED_LABEL}, and this equipment is imported and priced against the dollar — ${formatNaira(USD_NGN_RATE)} to $1 when we checked. Before anything is agreed we confirm today's figure with the distributor and adjust for your roof, your location and anything you already own. If it moved, you hear it from us first.`,
    category: "prices",
  },
  {
    q: "How much does one solar panel cost in Nigeria?",
    a: `A tier-1 ${PANEL_WATTS}W mono panel was about ${formatNaira(panelBest)} in ${PRICES_LAST_UPDATED_LABEL}, ranging from ${formatNaira(panelLow)} at the wholesale floor to ${formatNaira(panelHigh)} for a single unit in a showroom. That works out to roughly ${formatNaira(PANEL_PER_WP.low)}–${formatNaira(PANEL_PER_WP.high)} per watt, which is the number to compare panels on rather than the price per piece, since panel sizes differ. Panels are usually the smallest part of a Nigerian system bill — the battery is the big one.`,
    category: "prices",
    link: { href: "/shop", label: "Panel prices by brand" },
  },
  {
    q: "Lithium or tubular batteries — which is actually cheaper?",
    a: `Tubular is cheaper on the day and dearer over the years. One 200Ah tubular battery was about ${formatNaira(TUBULAR_200AH.best)} (${formatNaira(TUBULAR_200AH.low)}–${formatNaira(TUBULAR_200AH.high)}), while lithium runs about ${formatNaira(LITHIUM_PER_KWH.mid.best)} per kWh, so one ${LITHIUM_MODULE_KWH}kWh module is roughly ${formatNaira(lithiumModule)}. Size the same two-bedroom flat both ways, to the same usable energy, and the tubular bank costs ${formatNaira(tubularBank.best)} against ${formatNaira(lithiumBank.best)} for lithium — but you only get half of a lead-acid bank out before you damage it, it wants electrolyte topping up, and it is a 2–4 year part against 10+ years for lithium.`,
    category: "prices",
    link: { href: "/blog/solar-maintenance-nigeria", label: "What batteries cost over time" },
  },
  {
    q: "Do I pay import duty or VAT on solar equipment?",
    a: `Solar panels, inverters and batteries carry ${EQUIPMENT_VAT}% import duty and are VAT-exempt in Nigeria, so there is no duty or VAT line hiding under our equipment prices. That exemption is on the equipment itself — services and some accessories are treated differently, and we show you exactly what is on your bill either way. If anyone adds "import duty" to a quote for panels or a battery, ask them to point at the tariff line.`,
    category: "prices",
  },

  // ── Sizing ───────────────────────────────────────────
  {
    q: "What size solar system do I need for a 2-bedroom flat?",
    a: `For a two-bedroom flat with one 1HP AC, a fridge, a freezer, the washing machine and the ironing, our engine sizes a ${size(twoBed)} — about ${formatNairaShort(twoBed.total.best)} installed (range ${formatRange(twoBed.total)}). The AC and the iron barely touch your daily energy but they are what force the inverter up a size. A one-bedroom flat with the same fridge, fans and TV but no AC at all drops to a ${oneBed.inverterKva}kVA system at around ${formatNairaShort(oneBed.total.best)}.`,
    category: "sizing",
    link: { href: "/sizing/how-many-solar-panels-for-2-bedroom-flat", label: "Full working for a 2-bedroom flat" },
  },
  {
    q: "What about a 3-bedroom flat or a 4-bedroom house with two ACs?",
    a: `A three-bedroom flat with one 1.5HP AC, two TVs, a fridge and a freezer sizes to a ${size(threeBed)}, about ${formatNairaShort(threeBed.total.best)} installed. A four-bedroom house with two 1.5HP ACs, a borehole pump and the full set of appliances goes to a ${size(fourBed)} — around ${formatNairaShort(fourBed.total.best)}. At that size roof space matters as much as budget, so check you have an unshaded plane before you commit.`,
    category: "sizing",
    link: { href: "/sizing", label: "Every sizing scenario we've worked out" },
  },
  {
    q: "How many solar panels do I need?",
    a: `It is set by how much energy you use in a day, not by how many rooms you have. A two-bedroom flat with one AC needs about ${twoBed.panelCount} × ${PANEL_WATTS}W panels (${twoBed.arrayKwp}kWp), a three-bedroom about ${threeBed.panelCount}, and a lights-fans-and-TV-only home as few as ${essentials.panelCount}. We work from roughly 5.5 peak sun hours a day and a 78% system efficiency, then round up to whole panels.`,
    category: "sizing",
    link: { href: "/calculator", label: "Count panels for your own load" },
  },
  {
    q: "Will solar run my air conditioner?",
    a: `Yes, and it is the single most expensive thing you can ask it to do. One 1.5HP split unit on its own — nothing else connected — sizes to a ${size(acOnly)} at about ${formatNairaShort(acOnly.total.best)}, because a compressor asks for about three times its running watts in the first second and the inverter has to carry that. Running an AC overnight on batteries costs far more than running it while the sun is up, which is why most people we quote run AC in the day and let it go at night.`,
    category: "sizing",
    link: { href: "/sizing/what-size-inverter-for-1-5hp-ac", label: "Sizing for a 1.5HP AC" },
  },
  {
    q: "How many batteries do I need, and how long will they last at night?",
    a: `Our Standard sizing plans for about 6 hours of overnight backup on your full load, which for a two-bedroom flat is ${twoBed.batteryModules} lithium modules — ${twoBed.batteryKwh}kWh — at ${formatNaira(lithiumBank.best)}. Budget sizing plans 4 hours and Premium 10. Battery is the most expensive part of a Nigerian system, so this is the number to think hardest about: more autonomy is more money, and cutting your night load is free.`,
    category: "sizing",
    link: { href: "/calculator", label: "Try different backup hours" },
  },
  {
    q: "What happens on cloudy days, in the rainy season, or during Harmattan?",
    a: `Panels still work, just less. Cloud cuts output rather than stopping it, Harmattan dust between November and March can take a real bite until the panels are washed, and rain mostly cleans them for you. Our Standard sizing assumes the grid or your generator tops up on a genuinely bad run of days; the Premium tier adds 25% more panel capacity specifically so the batteries still refill under cloud.`,
    category: "sizing",
    link: { href: "/blog/solar-maintenance-nigeria", label: "Keeping panels clean" },
  },
  {
    q: "Can I start small and add to it later?",
    a: `Usually yes, but only if the first system is bought with that in mind — the inverter and the battery voltage decide what you can bolt on later. Adding panels is generally easy, adding battery modules is easy on lithium if you stay with the same brand and family, and changing inverter later means paying for it twice. Tell us it is phase one and we size the inverter for where you are going, not only where you are.`,
    category: "sizing",
  },

  // ── Buying & ordering (shop questions live here too) ──
  ...SHOP_FAQS,
  {
    q: "Can I buy the equipment myself and use my own installer?",
    a: `Yes, and the quote is built so you can. It is an itemised bill of materials with the size, spec and brand class of every line written out, so you can take it to any installer or vendor you already trust. Nothing on it is locked to us — if you use it to get a better price somewhere else, the quote did its job.`,
    category: "buying",
    link: { href: "/calculator", label: "Get an itemised quote" },
  },
  {
    q: "How do I avoid being scammed buying solar in Nigeria?",
    a: `Insist on an itemised quote with model numbers, capacities and brands — a single lump sum is where the cheating lives. Check the seller's CAC registration, make sure the equipment warranty is registered in your name and that you are given serial numbers, and never hand over the full amount in cash to someone you can't find again. Be suspicious of a price far under the published range: a "${REF_KVA}kVA hybrid" well below ${formatNaira(invLow)} is usually a smaller inverter, a rebranded one, or one that isn't really a hybrid.`,
    category: "buying",
    link: { href: "/verified", label: "The checks we run on installers" },
  },

  // ── Payment ──────────────────────────────────────────
  {
    q: "Do I pay SolarBuilders.ng anything?",
    a: `You pay the market price for the equipment — the same Nigerian price we publish on the brand pages — plus the installer's labour. We do not add a fee on top of your bill, and the calculator, the quote and the advice are free. Our margin comes from the trade terms we hold with distributors, so we earn on the buying rather than by marking you up.`,
    category: "payment",
    link: { href: "/how-it-works", label: "How the money works" },
  },
  {
    q: "Can I pay with my card on this site?",
    a: `No. There is no checkout and no card payment anywhere on SolarBuilders.ng, and anyone asking you to pay this site by card is not us. What you send is an order request; we confirm today's price with the distributor, give you one final figure that includes workmanship, and tell you exactly who is being paid for what before any money moves.`,
    category: "payment",
  },
  {
    q: "Can I pay in instalments?",
    a: `Nigerian lenders do advertise loans that cover systems this size — on a ${formatNairaShort(ONE_AC.low)} build, the longest advertised term among the ${LENDERS.length} we list works out around ${formatNaira(financeRef.monthly)} a month over ${financeRef.months} months at the lender's best advertised rate. That is an illustration from their public terms, not an offer, and reducing-balance loans cost less than the flat-rate way they usually quote. We are not a lender, a broker or a credit intermediary, we have no arrangement with any of them, and we earn nothing if you click through.`,
    category: "payment",
    link: { href: "/blog/solar-loans-nigeria", label: "Solar loans in Nigeria, compared" },
  },

  // ── Installation, warranty & upkeep ───────────────────
  {
    q: "Who actually installs the system?",
    a: `A vetted installer we put on the job and stay with. Nigeria has no licensing body for solar installers, so before anyone works on our behalf we check CAC registration, look at three past installs with photographs, call two customer references and take a written workmanship warranty. We then run the site survey with them, watch the job through photos from site, and sign a commissioning checklist before it is called done.`,
    category: "installation",
    link: { href: "/verified", label: "How we vet installers" },
  },
  {
    q: "How long does installation take?",
    a: `We won't put a date on it before the survey, because the honest answer depends on the equipment reaching you and on what the roof and wiring turn out to be. The fitting itself on a normal home system is short work; the waiting is in procurement and in the survey. You get a schedule from us after the site survey, and we would rather give you a real date late than a comfortable one early.`,
    category: "installation",
    link: { href: "/how-it-works", label: "What happens step by step" },
  },
  {
    q: "What warranty do I get?",
    a: `Two separate things: the manufacturer's warranty on the equipment, and the installer's written workmanship warranty on the labour. The equipment warranty is registered in your name, not ours, and the paperwork, serial numbers and your quote code come to you in one handover pack. Warranty terms differ by brand — we publish what each manufacturer documents on its brand page, and write "Not published" where they document nothing.`,
    category: "installation",
    link: { href: "/brands", label: "Warranty terms by brand" },
  },
  {
    q: "What happens if something fails after installation?",
    a: `You hold the warranty paperwork and the serial numbers, so the claim is genuinely yours rather than something trapped with a middleman. In practice you tell us, and we chase the distributor and the installer on your behalf — the workmanship warranty covers the fitting, the manufacturer's covers the part. We cannot promise a repair time, because that depends on the brand's service in Nigeria, which is one of the things we consider when recommending a brand at all.`,
    category: "installation",
  },
  {
    q: "Do you cover my city?",
    a: `Our labour figures are priced for roof-mount work in Lagos, Abuja and Port Harcourt, and transport outside those cities is quoted separately. We are not going to claim a nationwide installer network we haven't built — ask us about your town and you get a straight yes, a "not yet", or a "we'd have to send someone and here's what that costs". Equipment itself can be sourced and sent anywhere goods move in Nigeria.`,
    category: "installation",
    link: { href: "/contact", label: "Ask about your city" },
  },
  {
    q: "Do I need to get rid of my generator?",
    a: `No, and most people shouldn't. Nigerian home solar is normally sized as the everyday supply, with the grid or the generator as the backstop for a bad run of cloudy days or an unusually heavy load — that is what the changeover in your quote is for. What changes is how often the generator runs: from daily to rarely, which is where the fuel saving is. If you want a system that never needs it, say so, and we size for that instead — it costs meaningfully more.`,
    category: "installation",
    link: { href: "/blog/generator-vs-solar-lagos", label: "Generator vs solar, costed" },
  },
  {
    q: "How long does a solar system last?",
    a: `The parts age at very different rates. Panels are the longest-lived component and normally outlast everything else on the roof; a lithium battery is a 10+ year part, tubular batteries are a 2–4 year part, and the inverter sits somewhere between depending on class and how hard it is worked. So "how long does it last" is really a question about when you buy your next battery, which is why we default every quote to lithium.`,
    category: "installation",
  },
  {
    q: "What maintenance does it need, and what does that cost?",
    a: `Washing the panels and an annual check by someone who knows the system — that is nearly all of it, and lithium needs no electrolyte topping up or terminal cleaning the way tubular does. We don't publish a cleaning or service price, because we haven't got a sourced national figure to stand behind, and we would rather say so than invent one. The real long-run cost is the battery: about ${formatNaira(lithiumModule)} for a ${LITHIUM_MODULE_KWH}kWh lithium module every 10+ years, against roughly ${formatNaira(tubularBank.best)} to replace the tubular bank that would back the same two-bedroom flat, every 2–4 years.`,
    category: "installation",
    link: { href: "/blog/solar-maintenance-nigeria", label: "The maintenance guide" },
  },

  // ── About us ─────────────────────────────────────────
  {
    q: "Who are you — an installer, a vendor, or a marketplace?",
    a: `None of the three. We are the buyer's agent and the order desk: we publish what solar equipment really costs in Nigeria, size your system, buy the equipment on your behalf at the market price, and manage a vetted installer through to commissioning. We don't own a warehouse, we don't own a van, and we don't sell you anything at a mark-up.`,
    category: "about-us",
    link: { href: "/how-it-works", label: "How it works" },
  },
  {
    q: "How do you make money if you don't mark anything up?",
    a: `From the trade terms we hold with distributors — you pay the brand's market price and our margin sits in the spread between that and what we buy at, so it comes out of the supply chain rather than out of your bill. We also earn a placement fee from installers we route work to, which is why the vetting is ours to lose. We earn nothing from the lenders we list and have no arrangement with any of them.`,
    category: "about-us",
  },
  {
    q: "Where do your prices come from?",
    a: `From about 130 priced data points we collected off live Nigerian vendor listings and 2026 market guides, last refreshed in ${PRICES_LAST_UPDATED_LABEL}, and every figure on this site is computed from that one table rather than typed into a page. We don't publish the vendors' phone numbers or links: knowing where to buy at what price is the work we do for you, and stale contact details help nobody. Ask us anything about a specific number and we'll tell you what it is based on.`,
    category: "about-us",
    link: { href: "/shop", label: "See the price list" },
  },
  {
    q: "How many systems have you installed? Can I see reviews?",
    a: `We don't publish customer counts, testimonials or "X systems installed" numbers, because we haven't got a verified set we could show you and we are not going to invent them. Judge us instead on something checkable: the prices here are dated and sourced, the quote is itemised down to the cable, and the vetting standard for installers is written out in public. When there are real customers willing to be named, they will appear with their names on them.`,
    category: "about-us",
    link: { href: "/verified", label: "What we do on every job" },
  },
];

// ─────────────────────────────────────────────────────────
// GROUPING
// ─────────────────────────────────────────────────────────

const CATEGORY_ORDER: FaqCategory[] = ["prices", "sizing", "buying", "payment", "installation", "about-us"];

const CATEGORY_LABEL: Record<FaqCategory, string> = {
  prices: "Costs & prices",
  sizing: "Sizing your system",
  buying: "Buying & ordering",
  payment: "Paying for it",
  installation: "Installation, warranty & upkeep",
  "about-us": "About SolarBuilders.ng",
};

const CATEGORY_BLURB: Record<FaqCategory, string> = {
  prices: `What things actually cost in Nigeria at ${PRICES_LAST_UPDATED_LABEL} prices, and why the same item differs so much between sellers.`,
  sizing: "How big a system your home or business needs, and what the battery really has to do overnight.",
  buying: "What happens when you send us an order request, and what you can do entirely without us.",
  payment: "No card payment, no mark-up, no lender partnership. Here is where the money goes.",
  installation: "Who does the work, what you are covered for, and what it costs to keep running.",
  "about-us": "Who we are, how we earn, and what we will not claim.",
};

export function faqsByCategory(): FaqGroup[] {
  return CATEGORY_ORDER.map((category) => ({
    category,
    label: CATEGORY_LABEL[category],
    blurb: CATEGORY_BLURB[category],
    items: FAQS.filter((f) => f.category === category),
  })).filter((g) => g.items.length > 0);
}

// ─────────────────────────────────────────────────────────
// SCHEMA
// ─────────────────────────────────────────────────────────

/** Answers are plain text, but never let markup reach the schema. */
function plain(text: string): string {
  return text
    .replace(/<[^>]*>/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** FAQPage JSON-LD for any subset of the questions above. */
export function faqPageJsonLd(items: FaqItem[]): object {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((f) => ({
      "@type": "Question",
      name: plain(f.q),
      acceptedAnswer: { "@type": "Answer", text: plain(f.a) },
    })),
  };
}
