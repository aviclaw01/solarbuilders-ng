/**
 * SolarBuilders.ng — solar financing options
 *
 * Lender terms as publicly advertised (September 2026). We are NOT a lender,
 * a broker, or a credit intermediary: we show what a system would cost per
 * month so people can judge affordability, and link to the lender's own site.
 *
 * NO AFFILIATE ARRANGEMENT IS IN PLACE. `url` is each lender's public page.
 * If/when an affiliate or referral deal is signed, put the tracking URL in
 * `url` and set `affiliate: true` so the UI can disclose it — do not add
 * tracking parameters before the agreement exists.
 *
 * Repayment figures use FLAT monthly interest on the original principal,
 * which is how Nigerian fintech loans are usually quoted. Reducing-balance
 * loans cost less. Always treat these as illustrations, never as an offer.
 *
 * Keep in sync with app/blog/solar-loans-nigeria/page.tsx.
 */

export interface Lender {
  slug: string;
  name: string;
  /** flat monthly interest, as advertised */
  rateMinPctPerMonth: number;
  rateMaxPctPerMonth: number;
  maxAmount: number;
  termMinMonths: number;
  termMaxMonths: number;
  note: string;
  url: string;
  affiliate: boolean;
}

export const LENDERS: Lender[] = [
  {
    slug: "renmoney",
    name: "Renmoney",
    rateMinPctPerMonth: 2,
    rateMaxPctPerMonth: 3.5,
    maxAmount: 6_000_000,
    termMinMonths: 3,
    termMaxMonths: 24,
    note: "Highest limit and longest term — the only one that covers a full 5kVA build on its own. Stricter qualification.",
    url: "https://renmoney.com",
    affiliate: false,
  },
  {
    slug: "carbon",
    name: "Carbon",
    rateMinPctPerMonth: 2,
    rateMaxPctPerMonth: 5,
    maxAmount: 2_000_000,
    termMinMonths: 3,
    termMaxMonths: 12,
    note: "Fastest approval, all in-app. Limit suits a starter system or topping up cash you already have.",
    url: "https://getcarbon.co",
    affiliate: false,
  },
  {
    slug: "fairmoney",
    name: "FairMoney",
    rateMinPctPerMonth: 2.5,
    rateMaxPctPerMonth: 4.5,
    maxAmount: 1_500_000,
    termMinMonths: 3,
    termMaxMonths: 18,
    note: "Quick disbursement for salaried earners. Lowest limit here, so usually a part-payment.",
    url: "https://fairmoney.io",
    affiliate: false,
  },
];

/** Generator fuel + servicing a Lagos home typically displaces, ₦/month (see the generator-vs-solar post) */
export const GENERATOR_MONTHLY_BENCHMARK = 260_000;

export interface Repayment {
  lender: Lender;
  /** amount this lender can actually cover (capped at their limit) */
  financed: number;
  /** what the customer still needs in cash */
  shortfall: number;
  months: number;
  monthlyRatePct: number;
  monthly: number;
  total: number;
}

/**
 * Flat-rate monthly repayment: principal/months + principal × rate.
 * Uses the lender's lowest advertised rate and longest term — the best case,
 * which is what the UI labels it as.
 */
export function repaymentFor(lender: Lender, amount: number): Repayment {
  const financed = Math.min(amount, lender.maxAmount);
  const months = lender.termMaxMonths;
  const monthlyRatePct = lender.rateMinPctPerMonth;
  const interest = financed * (monthlyRatePct / 100) * months;
  const total = financed + interest;
  return {
    lender,
    financed,
    shortfall: Math.max(0, amount - financed),
    months,
    monthlyRatePct,
    monthly: total / months,
    total,
  };
}

/**
 * Lenders that cover the whole amount first (cheapest monthly wins), then
 * part-payers ranked by how much of the build they actually cover. A smaller
 * monthly payment is not a better offer if it leaves a bigger cash gap.
 */
export function repaymentOptions(amount: number): Repayment[] {
  return LENDERS.map((l) => repaymentFor(l, amount)).sort((a, b) => {
    const aFull = a.shortfall === 0;
    const bFull = b.shortfall === 0;
    if (aFull !== bFull) return aFull ? -1 : 1;
    if (aFull) return a.monthly - b.monthly;
    return b.financed - a.financed;
  });
}
