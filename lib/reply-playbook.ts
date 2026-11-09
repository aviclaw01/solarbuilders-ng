/**
 * The WhatsApp reply playbook behind /admin/replies: what people send the
 * SolarBuilders line, the reply to send, what they usually answer, and when to
 * follow up. Built from the real chats (14 Sep – 9 Nov 2026).
 *
 * Templates only. Never put a customer's name, number or quote here: this file
 * ships in the JS bundle of an admin page, and admin logins get shared.
 * Placeholders are written in [brackets] for the person replying to fill in.
 */

export interface ReplyTemplate {
  /** "Reply", "Day 1", "Under 2 years"… */
  label: string;
  text: string;
}

export interface ReplyCard {
  id: string;
  section: SectionId;
  title: string;
  chip?: string;
  /** What the incoming message looks like, so it can be recognised. */
  context?: string;
  templates: ReplyTemplate[];
  /** If they answer X → do Y. */
  expect?: { if: string; then: string }[];
  note?: string;
  /** Extra words people search for that are not in the text. */
  keywords?: string;
}

export const SECTIONS = [
  { id: "customers", label: "Customers" },
  { id: "installers", label: "Installers" },
  { id: "suppliers", label: "Suppliers" },
  { id: "other", label: "Other" },
] as const;
export type SectionId = (typeof SECTIONS)[number]["id"];

export const HOUSE_RULES: { title: string; body: string }[] = [
  { title: "Reply within an hour", body: "8am–9pm. If a message waited overnight, open with: \"Sorry we missed this, here now.\"" },
  { title: "Get the four basics", body: "State and area · what they want to power · budget or quote code · when they need it." },
  { title: "One question per message", body: "Three questions in one bubble get one answer. Ask, wait, ask the next." },
  { title: "Text after every voice note", body: "One line of text with the price, next step or date. People forward texts to whoever is paying." },
  { title: "Prices come from a quote", body: "Never type a price from memory. Send a calculator quote or a range from one; prices move weekly." },
  { title: "End with a next step", body: "\"I'll send X by [time]\" or \"Reply Y and we start.\" Never end on \"Sure sure\" or \"We'd keep in touch.\"" },
  { title: "Three follow-ups, then stop", body: "Day 1, day 3, day 7. Then label the chat \"Cold\" and leave it." },
  { title: "Label every chat", body: "New lead · Quoted · Waiting on them · Won · Installer · Supplier · Cold." },
];

export const REPLY_CARDS: ReplyCard[] = [
  {
    id: "c1",
    section: "customers",
    title: "\"I generated quote SB-… please help me get this built\"",
    chip: "Hottest lead",
    context:
      "From the quote page. Arrives with a name, area, quote code, estimate and calculator link, e.g. \"I generated quote SB-5K-XXXXXX (Standard, est. ₦4,9xx,xxx). Please help me get this system built.\"",
    templates: [
      {
        label: "Reply",
        text: "Hi [name], thanks for sending your quote [code]. I have it open now.\n\nTwo quick things so we can confirm today's price:\n1. When do you want it installed?\n2. Can you send a short video of the roof and the spot where the inverter will go?",
      },
      { label: "Day 1", text: "Hi [name], your [size] system is still reserved at today's price. Want me to book the site check for [day]?" },
      {
        label: "Day 3",
        text: "Hi [name], quick one: is the budget the issue, or the timing? If it's budget, I can show you a cheaper build that still powers [their key appliance].",
      },
      {
        label: "Day 7",
        text: "Hi [name], I'll close this quote for now so it doesn't go stale. Whenever you're ready, reply \"start\" and I'll pick it up with fresh prices.",
      },
    ],
    expect: [
      { if: "\"ASAP\" / \"next week\"", then: "Confirm the price within 24 hours. Book the inspection (Lagos) or ask for the video (other states)." },
      {
        if: "\"Will I get warranty?\"",
        then: "Answer right there: \"[Brand] gives [X] years on the inverter and [Y] on batteries, through us. Our installers guarantee workmanship for 12 months.\" Don't pass it to \"the agent\".",
      },
      { if: "Silence", then: "Send the day 1, 3 and 7 follow-ups." },
    ],
    keywords: "quote code calculator build install installation book site check warranty follow up reserved budget expensive",
  },
  {
    id: "c2",
    section: "customers",
    title: "\"Can you check today's price for me?\"",
    chip: "High intent",
    context:
      "From the shop or cart button. Often lists the items (\"1× Growatt SPF 6000 ES, 2× 51.2V 100Ah, 7× Jinko 650 W…\"), sometimes just the one line.",
    templates: [
      {
        label: "Reply — items listed",
        text: "Hi, thanks. I'm checking today's prices with our suppliers for the items you listed. You'll have them by [time] today.\n\nWhich state is this for, and do you need installation too?",
      },
      {
        label: "Reply — no items listed",
        text: "Hi, happy to. What do you want to power (e.g. lights, fans, fridge, AC), and where are you located? Or build it here in 2 minutes and send me the quote: https://solarbuildersng.com/calculator",
      },
      { label: "Day 1", text: "Hi, today's prices for your list: [total] including delivery to [area]. Prices hold until [date]. Shall I reserve them?" },
    ],
    expect: [
      { if: "Sends a list or a spec photo", then: "Give a price range from the calculator within the hour, then the confirmed price." },
      { if: "\"Just tell me how much\"", then: "Give a range (\"₦1.7M–₦3.6M depending on battery type\"), then a quote link with the cheapest build first." },
    ],
    keywords: "price how much cost cart shop today's price items list naira",
  },
  {
    id: "c3",
    section: "customers",
    title: "\"I'm interested in [Felicity / Victron / Deye] equipment\"",
    chip: "Brand-page lead",
    context: "From a brand page. They like the brand but haven't sized anything yet.",
    templates: [
      {
        label: "Reply",
        text: "Hi, great choice. [Brand] is one we build with. What will the system power, and where are you located? Or pick your appliances here and send me the quote, so we size it right and you don't overpay: https://solarbuildersng.com/calculator",
      },
      {
        label: "Day 1",
        text: "Hi, if the calculator is a lot, just send a list of what you want to run (or a photo of each appliance's sticker) and I'll do it for you.",
      },
    ],
    expect: [
      { if: "\"3 deep freezers and other home appliances\"", then: "Ask about AC and pumping machine. Freezers need a bigger inverter for the start-up surge." },
      { if: "Finds the calculator stressful", then: "\"Send me a list or a photo of your appliances and I'll build the quote for you.\"" },
    ],
    keywords: "brand felicity victron deye growatt luminous sumec jinko canadian freezer calculator hard",
  },
  {
    id: "c4",
    section: "customers",
    title: "\"I want to set up solar\" (name and area given)",
    chip: "Homepage",
    context: "e.g. \"I'm [name] from [area]. Recommend an inverter and lithium battery for a 4-bedroom: light, fan, 2 fridges and TV.\"",
    templates: [
      {
        label: "Reply",
        text: "Hi [name], thanks for reaching out. For lights, fans, 2 fridges and a TV, you're looking at about a [3.5–5 kVA] inverter with a [5 kWh] lithium battery. I'll send you a full quote with two options (best value and premium).\n\nHow many hours a day do you usually have NEPA light?",
      },
    ],
    expect: [
      { if: "Gives hours / budget", then: "Send the quote link with the cheapest workable build first." },
      { if: "\"Which brand is best?\"", then: "Recommend from the \"We recommend\" list, with one line on why." },
    ],
    keywords: "setup set up new system recommend inverter battery lithium bedroom house home kva size sizing nepa",
  },
  {
    id: "c5",
    section: "customers",
    title: "Asking for one specific product (Pylontech, Dyness…)",
    chip: "Product",
    templates: [
      {
        label: "Reply",
        text: "Hi, yes, we can source the [product]. Do you need just the battery, or the full setup (inverter, panels, installation)? And which state should it be delivered to?",
      },
    ],
    expect: [
      { if: "\"Just the battery\"", then: "Confirm the supplier price and delivery to their state, then quote." },
      { if: "\"Complete setup\"", then: "Ask what it should power, then use the quote-code card." },
    ],
    keywords: "pylontech dyness battery only product single item specific model us5000",
  },
  {
    id: "c6",
    section: "customers",
    title: "Already has some kit (\"I have a 500 W power tank\")",
    chip: "Small ticket",
    templates: [
      {
        label: "Reply",
        text: "Hi, thanks. What do you want the power tank to run, and for how many hours? A 500 W / 1 kWh tank handles lights, fans, TV and phones. It won't start a fridge or freezer. If that's all you need, we can quote panels, cables and installation for it.",
      },
    ],
    note: "Be honest when the kit is too small. Telling a customer that a 500 W tank can't run a freezer is what kept her with us.",
    keywords: "power tank existing kit upgrade add panels small generator portable",
  },
  {
    id: "c7",
    section: "customers",
    title: "Customer outside Lagos",
    chip: "Most leads",
    context: "Ibadan, Ogun, Ebonyi, Abuja, Niger state… We have no installer in most of these yet.",
    templates: [
      {
        label: "Reply",
        text: "Thanks [name]. We deliver to [state]. Since our engineer can't visit, please send a short video: the roof or wherever the panels will go, then a walk to the spot for the inverter and batteries. Our engineer will check it and confirm the full price, including delivery and installation.",
      },
      {
        label: "No installer there yet",
        text: "Thanks [name]. We're confirming a vetted installer in [state] and will update you by [date]. If you already have a fitter you trust, we can supply the equipment and send them the wiring plan and cable sizes.",
      },
    ],
    expect: [
      { if: "Has their own fitter", then: "Supply the equipment and send their fitter the wiring plan and cable sizes. Check the fitter's quote; it is often undersized." },
      { if: "Needs an installer", then: "Check the installer list for that state. If none yet, send the second reply and post a call for installers there." },
    ],
    keywords: "ibadan oyo ogun abeokuta abuja fct ebonyi niger enugu kano port harcourt rivers state delivery outside lagos video installer fitter",
  },
  {
    id: "c8",
    section: "customers",
    title: "\"Hello\" / \"I have a question\" with nothing else",
    chip: "Unknown",
    templates: [
      { label: "Reply", text: "Hi, welcome to SolarBuilders. Are you looking to buy a solar system, fix an existing one, or something else? And where are you located?" },
      { label: "If we were late", text: "Hi, sorry we missed your message earlier. What would you like to know about going solar?" },
    ],
    keywords: "hello hi question greeting late sorry missed",
  },
  {
    id: "c9",
    section: "customers",
    title: "Repair or fault (\"what is the problem with this inverter?\")",
    chip: "Service",
    templates: [
      {
        label: "Reply",
        text: "Hi, sorry about the trouble. Please send: 1) a clear photo of the error on the screen, 2) the inverter brand and size, 3) your location. We'll tell you if it's a setting, a battery issue, or a fault that needs a technician visit (paid inspection).",
      },
    ],
    note: "Repairs lead to new systems later. Log every one as a lead.",
    keywords: "repair fault error broken not working beeping technician fix maintenance service inspection",
  },
  {
    id: "i1",
    section: "installers",
    title: "\"I'm a solar installer, I'd like to work with you\"",
    chip: "Supply side",
    context:
      "Usually an individual technician who sends photos in chat and then follows up every few days. Give them a clear process and a date — not \"Sure sure\" or \"We'd keep in touch\".",
    templates: [
      {
        label: "First reply",
        text: "Hi [name], thanks for reaching out. We send jobs to vetted installers in each state. We bring the customer and the equipment; you install and get paid per job.\n\nTo be considered you need at least 2 years of hands-on installs. Apply here (about 10 minutes): https://solarbuildersng.com/for-builders\n\nYou'll need: the states and towns you cover, 3 past installs with photos (before and after), 2 customers we can call, and your workmanship warranty. We reply within 5 working days.",
      },
      { label: "After they apply", text: "Thanks [name], your application [ref] is in. We'll call your references this week and reply by [date]. No need to follow up before then." },
      {
        label: "Under 2 years",
        text: "Thanks [name]. For now we only send jobs to installers with 2+ years of installs, because our name is on every job. If you work under an experienced lead installer, ask them to apply and you can work on their team.",
      },
      {
        label: "Approved, no job in their state yet",
        text: "Hi [name], you're approved for [state]. We don't have a job there right now. When one comes in, you'll get an offer here and have 24 hours to accept.",
      },
      { label: "Student / trainee", text: "Thanks for your interest. We don't run training yet. We'll announce it on our page when we do." },
    ],
    expect: [
      {
        if: "Evidence to ask for",
        then: "Photos of 3 jobs, before and after: panel mounting, inverter and battery wiring, the DB/changeover. One should be a video walk-through. Customer numbers for at least 2.",
      },
      {
        if: "Red flags",
        then: "Stock photos, the same job from different angles, no customer we can call, or \"1.5 HP AC on 3 kVA with a 2.5 kWh battery is fine\".",
      },
    ],
    keywords: "installer technician engineer builder join partner work with you apply application experience years vetting student training",
  },
  {
    id: "s1",
    section: "suppliers",
    title: "A manufacturer or distributor pitches us",
    chip: "Inbound",
    context: "A brand, importer or dealer sends a catalogue or asks to supply us.",
    templates: [
      {
        label: "Reply",
        text: "Hi [name], thanks for reaching out. SolarBuilders sizes and sells complete systems to homes and businesses across Nigeria, and we place the orders with our suppliers. Before we list a brand we need to know:\n\n1. Which states you have warehouses or dealers in\n2. Delivery to other states: fixed rate per state? How many days?\n3. Dealer price list and minimum order\n4. Warranty per product, and how a customer claims it in Nigeria\n5. Whether you have installers you can send with a delivery, where, and at what fee\n\nSend these with your catalogue and we'll reply within a week.",
      },
      {
        label: "Day 3, no answers",
        text: "Hi [name], following up on the 5 questions. The delivery and warranty answers matter most, because we can't quote customers outside Lagos without them.",
      },
      {
        label: "Day 7",
        text: "Hi [name], we're finalising which brands we recommend this month. If you can send the delivery rates and warranty terms by [date], you'll be in the comparison.",
      },
      {
        label: "Overseas, no local stock",
        text: "Hi [name], thanks for the catalogue and prices. Since you ship from outside Nigeria and have no local warehouse or installer yet, we can only start with a small pilot order. Could you share the landed cost to Lagos, and how a warranty swap works for a customer here?",
      },
    ],
    note: "After about two weeks, score every brand in /admin/suppliers. Don't remove brands from the site; mark the best as \"We recommend\" and say why next to the others.",
    keywords: "supplier manufacturer distributor dealer brand catalogue price list warehouse delivery warranty wholesale importer china",
  },
  {
    id: "s2",
    section: "suppliers",
    title: "Supplier only sells parts (breakers, SPDs, cables)",
    chip: "Low priority",
    templates: [
      {
        label: "Reply",
        text: "Hi [name], thanks. Please send your price list for DC breakers, SPDs and cables, and tell us which states you deliver to and how long it takes.",
      },
    ],
    keywords: "breaker spd surge protection cable accessories parts",
  },
  {
    id: "o1",
    section: "other",
    title: "Someone selling us services (videos, flyers, CRM tools)",
    chip: "Not a lead",
    templates: [{ label: "Reply", text: "Thanks for reaching out. We're not taking on new services right now. We'll get in touch if that changes." }],
    note: "One message, then label the chat \"Cold\". If they push, don't argue; just don't reply again.",
    keywords: "marketing promo video flyer design crm tool agency spam sales pitch",
  },
];

/** Everything searchable on a card, lowercased once. */
export function cardHaystack(c: ReplyCard): string {
  return [
    c.title,
    c.chip,
    c.context,
    c.note,
    c.keywords,
    ...c.templates.flatMap((t) => [t.label, t.text]),
    ...(c.expect ?? []).flatMap((e) => [e.if, e.then]),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

/** Every word of the query must appear somewhere on the card. */
export function matchesQuery(haystack: string, query: string): boolean {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  return words.every((w) => haystack.includes(w));
}
