/**
 * SolarBuilders.ng — Brand & vendor catalogue
 *
 * Replaces the fake installer marketplace. Two kinds of entries:
 *  - manufacturer: a brand (Felicity, Deye, Jinko …) with the models and
 *    prices actually seen at Nigerian retailers
 *  - vendor: a Nigerian distributor / retailer / installer with public prices
 *    (Zit, Nature Solar, Kasot …) — their packages are listed as products
 *
 * Every price is a real listing with a source URL and the date it was seen.
 * Source of truth for the numbers: research/2026-09-nigeria-solar-price-research.md
 * When a price is a range, it's the spread across the vendors named in `seenAt`.
 *
 * Contact details are only what the vendor publishes on its own website.
 */

export type BrandKind = "manufacturer" | "vendor";
export type BrandTier = "budget" | "mid" | "premium";
export type ProductCategory = "inverter" | "battery" | "panel" | "controller" | "package";

export interface Product {
  category: ProductCategory;
  model: string;
  /** Short human spec: "5kVA 48V hybrid", "5.12kWh 51.2V 100Ah", "600W bifacial" */
  spec: string;
  kva?: number;
  kwh?: number;
  watts?: number;
  priceLow: number;
  priceHigh: number;
  /** Vendor slugs (or free-text names) where this price was seen */
  seenAt: string[];
  sourceUrl: string;
  seenOn: string; // ISO date
  note?: string;
}

export interface Brand {
  slug: string;
  name: string;
  kind: BrandKind;
  tier?: BrandTier; // manufacturers only
  origin: string; // country (manufacturer) or city/area (vendor)
  categories: ProductCategory[];
  tagline: string;
  description: string;
  website?: string;
  phones?: string[];
  whatsapp?: string; // digits only, from the vendor's own site
  /** vendor only: manufacturer slugs they stock */
  carries?: string[];
  pricesPublic: boolean;
  products: Product[];
}

const D = "2026-09-13";

// ─────────────────────────────────────────────────────────
// MANUFACTURERS
// ─────────────────────────────────────────────────────────

const MANUFACTURERS: Brand[] = [
  {
    slug: "felicity",
    name: "Felicity Solar",
    kind: "manufacturer",
    tier: "budget",
    origin: "China · official Nigeria store in Lagos",
    categories: ["inverter", "battery", "controller"],
    tagline: "Nigeria's best-selling budget hybrid inverters and LiFePO4 batteries",
    description:
      "Felicity is the volume leader in Nigerian homes: cheap, widely stocked in Alaba and Lekki, and every installer knows them. Inverters are 24V up to 3.5kVA and 48V from 5kVA. Batteries are LiFePO4 with 5-year warranties. Expect the lowest ₦/kVA in the market, but shop around — the same 5kVA unit ranges from ₦440k to ₦986k depending on the model generation and retailer.",
    website: "https://www.felicitysolar.ng",
    phones: ["+234 817 147 9561", "+234 707 911 7572"],
    pricesPublic: true,
    products: [
      { category: "inverter", model: "IVEM 3kVA 24V", spec: "3kVA 24V hybrid", kva: 3, priceLow: 379_000, priceHigh: 379_000, seenAt: ["solar-village"], sourceUrl: "https://solarvillage.africa/felicity-ivps-5kva-48v-solar-power-inverter.html", seenOn: D },
      { category: "inverter", model: "IVEM3048-LV", spec: "3kVA 48V hybrid", kva: 3, priceLow: 494_000, priceHigh: 494_000, seenAt: ["felicity-solar-ng"], sourceUrl: "https://www.felicitysolar.ng/products/felicity-solar-inverter", seenOn: D },
      { category: "inverter", model: "3.5kVA 24V hybrid", spec: "3.5kVA 24V pure sine hybrid", kva: 3.5, priceLow: 435_000, priceHigh: 778_586, seenAt: ["solar-village", "stellarmart", "zit"], sourceUrl: "https://zit.ng/products/felicity-solar-3-5kva-24volt-hybrid-inverter-pure-sine-wave/", seenOn: D },
      { category: "inverter", model: "5048 off-grid 5kVA", spec: "5kVA 48V off-grid with MPPT", kva: 5, priceLow: 440_000, priceHigh: 440_000, seenAt: ["stellarmart"], sourceUrl: "https://www.stellarmart.ng/product/5000va-48v-4000w-5kva-230v-48v-dc-to-ac-hybrid-off-grid-inverter/", seenOn: D },
      { category: "inverter", model: "IVEM5048 / IVPS 5kVA", spec: "5kVA 48V hybrid, 100A MPPT", kva: 5, priceLow: 585_900, priceHigh: 986_000, seenAt: ["solar-village", "nature-solar", "zit"], sourceUrl: "https://zit.ng/products/felicity-solar-5kva-48volt-hybrid-inverter-pure-sine-wave/", seenOn: D },
      { category: "inverter", model: "IVEM6048", spec: "6kVA 48V hybrid", kva: 6, priceLow: 637_000, priceHigh: 637_000, seenAt: ["felicity-solar-ng"], sourceUrl: "https://www.felicitysolar.ng/products/felicity-solar-inverter", seenOn: D },
      { category: "inverter", model: "IVPM7548", spec: "7.5kVA 48V hybrid, 120A MPPT", kva: 7.5, priceLow: 1_020_000, priceHigh: 1_097_600, seenAt: ["zit", "felicity-solar-ng"], sourceUrl: "https://zit.ng/products/felicity-solar-7-5kva-48volt-hybrid-inverter-with-120ah-charge-controller/", seenOn: D },
      { category: "inverter", model: "IVEM8048", spec: "8kVA 48V hybrid", kva: 8, priceLow: 1_225_000, priceHigh: 1_225_000, seenAt: ["felicity-solar-ng"], sourceUrl: "https://www.felicitysolar.ng/products/felicity-solar-inverter", seenOn: D },
      { category: "inverter", model: "IVGM 8KLP2G1", spec: "8kW low-voltage hybrid (new gen)", kva: 8, priceLow: 1_472_500, priceHigh: 1_472_500, seenAt: ["felicity-solar-ng"], sourceUrl: "https://www.felicitysolar.ng/products/felicity-solar-inverter", seenOn: D },
      { category: "inverter", model: "IVPS10048", spec: "10kVA 48V hybrid", kva: 10, priceLow: 850_000, priceHigh: 1_300_000, seenAt: ["Jumia", "felicity-solar-ng", "nature-solar"], sourceUrl: "https://www.jumia.com.ng/10kva-48v-pure-sine-wave-inverter-felicity-solar-mpg3790739.html", seenOn: D },
      { category: "inverter", model: "IVEM 12kW", spec: "12kW 48V hybrid", kva: 12, priceLow: 1_290_100, priceHigh: 1_290_100, seenAt: ["felicity-solar-ng"], sourceUrl: "https://www.felicitysolar.ng/products/felicity-solar-inverter", seenOn: D },
      { category: "battery", model: "FL-LPBF48100", spec: "5kWh 48V 100Ah LiFePO4, 5yr warranty", kwh: 5, priceLow: 999_120, priceHigh: 1_350_000, seenAt: ["energymall", "felicity-solar-ng"], sourceUrl: "https://energymall.ng/shop/batteries/felicity-5kwh-48v-lithium-battery-five-years-warranty-fl-lpbf48100/", seenOn: D },
      { category: "battery", model: "FLH-48100UG1", spec: "5.12kWh 51.2V 100Ah", kwh: 5.12, priceLow: 1_296_540, priceHigh: 1_296_540, seenAt: ["felicity-solar-ng"], sourceUrl: "https://www.felicitysolar.ng/products/felicity-solar-batteries", seenOn: D },
      { category: "battery", model: "LPBF24200-M", spec: "5kWh 24V 200Ah (for 3.5kVA systems)", kwh: 5, priceLow: 1_078_000, priceHigh: 1_360_000, seenAt: ["felicity-solar-ng", "zit"], sourceUrl: "https://www.felicitysolar.ng/products/felicity-solar-batteries", seenOn: D },
      { category: "battery", model: "LPBF48150", spec: "7.2kWh 48V 150Ah wall-mount", kwh: 7.2, priceLow: 1_520_000, priceHigh: 1_520_000, seenAt: ["felicity-solar-ng"], sourceUrl: "https://www.felicitysolar.ng/products/felicity-solar-batteries", seenOn: D },
      { category: "battery", model: "LPBF48200", spec: "10kWh 48V 200Ah", kwh: 10, priceLow: 2_000_000, priceHigh: 2_650_000, seenAt: ["Alaba market", "zit"], sourceUrl: "https://zit.ng/products/felicity-10kwh-48v-100ah-lithium-phosphate-solar-batteries-pack-with-bms-lpbf-48100/", seenOn: D },
      { category: "battery", model: "LPBF48300-II / FLA48300", spec: "15kWh 48V 300Ah", kwh: 15, priceLow: 2_107_500, priceHigh: 3_286_080, seenAt: ["solar-village", "felicity-solar-ng"], sourceUrl: "https://www.felicitysolar.ng/products/felicity-solar-batteries", seenOn: D },
      { category: "battery", model: "17.5kWh 51.2V", spec: "17.5kWh 51.2V", kwh: 17.5, priceLow: 3_980_000, priceHigh: 3_980_000, seenAt: ["zit"], sourceUrl: "https://zit.ng/products/felicity-10kwh-48v-100ah-lithium-phosphate-solar-batteries-pack-with-bms-lpbf-48100/", seenOn: D },
      { category: "battery", model: "FLA48500", spec: "25kWh 48V 500Ah", kwh: 25, priceLow: 5_415_000, priceHigh: 5_415_000, seenAt: ["felicity-solar-ng"], sourceUrl: "https://www.felicitysolar.ng/products/felicity-solar-batteries", seenOn: D },
      { category: "controller", model: "100A MPPT", spec: "100A MPPT 12/24/48V charge controller", priceLow: 215_000, priceHigh: 280_000, seenAt: ["Jumia", "Zel"], sourceUrl: "https://www.jumia.com.ng/felicity-solar-100a-mppt-solar-charge-controller-12v24v48v-306124265.html", seenOn: D },
    ],
  },
  {
    slug: "deye",
    name: "Deye",
    kind: "manufacturer",
    tier: "premium",
    origin: "China",
    categories: ["inverter", "battery"],
    tagline: "The premium hybrid inverter Nigerian installers recommend when budget allows",
    description:
      "Deye SUN-series hybrids are the reference premium inverter in Nigeria: high PV input, app monitoring, generator integration, 3-phase options and a 5–10 year warranty. You pay ₦230k–₦400k per kVA — roughly 2.5× Felicity — but get a system that scales cleanly. Beware of the cheaper 'OG' off-grid models (6kW at ~₦700k) which are a different, lower-spec line.",
    website: "https://www.deyeinverter.com",
    pricesPublic: true,
    products: [
      { category: "inverter", model: "SUN-5K-SG 1-phase", spec: "5kW 48V hybrid, single phase", kva: 5, priceLow: 1_500_000, priceHigh: 1_750_000, seenAt: ["nature-solar", "Jiji (Alaba)", "abuja-solar"], sourceUrl: "https://abujasolar.com/product-category/deye-inverter/", seenOn: D },
      { category: "inverter", model: "SUN-6K OG01LP1", spec: "6kW off-grid hybrid (lower-spec OG line)", kva: 6, priceLow: 680_000, priceHigh: 800_000, seenAt: ["abuja-solar", "Jumia"], sourceUrl: "https://www.jumia.com.ng/deye-6kw-single-phase-off-grid-hybrid-inverter-system-418281170.html", seenOn: D },
      { category: "inverter", model: "SUN-8K-SG01LP1", spec: "8kW 48V hybrid, single phase, WiFi", kva: 8, priceLow: 3_190_000, priceHigh: 3_190_000, seenAt: ["me3-energy"], sourceUrl: "https://me3energy.ng/deye-8kw-pure-sine-wave-hybrid-solar-inverter-with-wifi", seenOn: D },
      { category: "inverter", model: "SUN-8K-SG04LP3-EU", spec: "8kW 48V hybrid, 3-phase", kva: 8, priceLow: 2_627_750, priceHigh: 2_814_599, seenAt: ["zit", "Jiji (Maitama)"], sourceUrl: "https://zit.ng/products/deye-8kw-hybrid-solar-inverter-8k-sg04lp3-eu/", seenOn: D },
      { category: "inverter", model: "SUN-10K 1-phase", spec: "10kW 48V hybrid, single phase", kva: 10, priceLow: 2_600_000, priceHigh: 2_900_000, seenAt: ["nature-solar", "abuja-solar"], sourceUrl: "https://abujasolar.com/product-category/deye-inverter/", seenOn: D },
      { category: "inverter", model: "SUN-12K-SG04LP3", spec: "12kW 48V hybrid, 3-phase", kva: 12, priceLow: 2_800_000, priceHigh: 3_020_000, seenAt: ["abuja-solar", "zit"], sourceUrl: "https://zit.ng/products/deye-8kw-hybrid-solar-inverter-8k-sg04lp3-eu/", seenOn: D },
      { category: "inverter", model: "SUN-16K-SG01LP1-EU", spec: "16kW 48V hybrid, single phase", kva: 16, priceLow: 3_800_000, priceHigh: 5_199_000, seenAt: ["abuja-solar", "me3-energy"], sourceUrl: "https://me3energy.ng/16kw-deye-hybrid-inverter", seenOn: D },
      { category: "battery", model: "BOS-SE-G5.1 LV", spec: "5.12kWh 51.2V 100Ah LiFePO4", kwh: 5.12, priceLow: 995_000, priceHigh: 1_062_500, seenAt: ["solar-depot-ng", "zit"], sourceUrl: "https://zit.ng/products/deye-512kw-low-voltage-lithium-ion-solar-battery-bos-se-g51-lv/", seenOn: D },
      { category: "battery", model: "51.2V 314Ah", spec: "16kWh 51.2V 314Ah LiFePO4", kwh: 16, priceLow: 2_998_000, priceHigh: 2_998_000, seenAt: ["solar-depot-ng"], sourceUrl: "https://www.solardepotng.com/lithium-deep-cycle", seenOn: D },
    ],
  },
  {
    slug: "growatt",
    name: "Growatt",
    kind: "manufacturer",
    tier: "mid",
    origin: "China",
    categories: ["inverter", "battery"],
    tagline: "Mid-tier hybrids with the best price-to-reliability ratio around 5kVA",
    description:
      "Growatt SPF-series off-grid/hybrid inverters are the sensible middle: better build and support than Felicity, half the price of Deye. The SPF 5000 ES at ₦530k–₦620k is the most common 5kVA in new Lagos installs. Growatt ARK/HOPE batteries exist in Nigeria but aren't priced publicly — pair with Felicity, Deye or ITEL packs instead.",
    website: "https://www.growatt.com",
    pricesPublic: true,
    products: [
      { category: "inverter", model: "SPF 3000TL HVM-48", spec: "3kW 48V off-grid hybrid", kva: 3, priceLow: 448_500, priceHigh: 448_500, seenAt: ["zit"], sourceUrl: "https://zit.ng/products/growatt-5kva-48v-hybrid-solar-inverter-spf-5000es/", seenOn: D },
      { category: "inverter", model: "SPF 5000 ES", spec: "5kVA 48V off-grid hybrid", kva: 5, priceLow: 530_000, priceHigh: 622_500, seenAt: ["stellarmart", "zit", "gosolarmart"], sourceUrl: "https://gosolarmart.com/product/growatt-spf-5000-es-off-grid-inverter/", seenOn: D },
      { category: "inverter", model: "SPF 6000 ES", spec: "6kVA 48V off-grid hybrid", kva: 6, priceLow: 650_000, priceHigh: 650_000, seenAt: ["stellarmart"], sourceUrl: "https://www.stellarmart.ng/product/5000va-48v-4000w-5kva-230v-48v-dc-to-ac-hybrid-off-grid-inverter/", seenOn: D },
      { category: "inverter", model: "12kW hybrid", spec: "12kW hybrid", kva: 12, priceLow: 1_215_000, priceHigh: 1_215_000, seenAt: ["gennex"], sourceUrl: "https://shop.gennextechnologies.com/", seenOn: D },
      { category: "battery", model: "ARK / HOPE 5.12kWh", spec: "5.12kWh 51.2V LiFePO4 (guide price — no live listing)", kwh: 5.12, priceLow: 843_500, priceHigh: 1_400_000, seenAt: ["Fouani (price hidden)"], sourceUrl: "https://fouanistore.com/shop?category_id=105&category_name=growatt", seenOn: "2026-08-09", note: "Guide range only" },
    ],
  },
  {
    slug: "luxpower",
    name: "Luxpower",
    kind: "manufacturer",
    tier: "mid",
    origin: "China · Gennex is the Nigerian importer",
    categories: ["inverter"],
    tagline: "Compact dual-MPPT hybrids; excellent value at 3.6–5kW",
    description:
      "LuxpowerTek hybrids are popular with installers who want Deye-style features (dual MPPT, app, parallel stacking) at Growatt prices. Gennex Technologies is the official importer; 8kW and 12kW units are stocked but not priced online — ask us.",
    website: "https://luxpowerteknigeria.com",
    pricesPublic: true,
    products: [
      { category: "inverter", model: "2.5kW hybrid", spec: "2.5kW hybrid", kva: 2.5, priceLow: 290_000, priceHigh: 290_000, seenAt: ["solarbuy"], sourceUrl: "https://solarbuy.com.ng/product/3-6kw-luxpower-solar-inverter/", seenOn: D },
      { category: "inverter", model: "3.6kW hybrid", spec: "3.6kW hybrid, dual MPPT", kva: 3.6, priceLow: 325_000, priceHigh: 325_000, seenAt: ["solarbuy"], sourceUrl: "https://solarbuy.com.ng/product/3-6kw-luxpower-solar-inverter/", seenOn: D },
      { category: "inverter", model: "5kW hybrid", spec: "5kW 48V hybrid", kva: 5, priceLow: 590_000, priceHigh: 590_000, seenAt: ["solarbuy"], sourceUrl: "https://solarbuy.com.ng/product/3-6kw-luxpower-solar-inverter/", seenOn: D },
    ],
  },
  {
    slug: "victron",
    name: "Victron Energy",
    kind: "manufacturer",
    tier: "premium",
    origin: "Netherlands",
    categories: ["inverter"],
    tagline: "The gold standard for off-grid reliability — priced accordingly",
    description:
      "Victron MultiPlus-II and Quattro inverter/chargers are what you spec when downtime is unacceptable: banks, clinics, estates. They need a separate MPPT controller and a GX device, so the all-in cost is higher than the inverter price suggests. Stocked by Solar Depot NG and SolarKobo.",
    website: "https://www.victronenergy.com",
    pricesPublic: true,
    products: [
      { category: "inverter", model: "MultiPlus-II GX 48/5000", spec: "5kVA 48V inverter/charger with GX", kva: 5, priceLow: 1_548_970, priceHigh: 1_548_970, seenAt: ["solar-depot-ng"], sourceUrl: "https://www.solardepotng.com/victron-energy-inverter", seenOn: D },
      { category: "inverter", model: "MultiPlus-II 48/10000", spec: "10kVA 48V inverter/charger", kva: 10, priceLow: 3_287_870, priceHigh: 3_287_870, seenAt: ["solar-depot-ng"], sourceUrl: "https://www.solardepotng.com/victron-energy-inverter", seenOn: D },
      { category: "inverter", model: "Quattro 48/8000", spec: "8kVA 48V, dual AC input", kva: 8, priceLow: 4_645_000, priceHigh: 4_645_000, seenAt: ["solar-depot-ng"], sourceUrl: "https://www.solardepotng.com/victron-energy-inverter", seenOn: D },
      { category: "inverter", model: "Quattro 48/10000", spec: "10kVA 48V, dual AC input", kva: 10, priceLow: 4_262_932, priceHigh: 4_262_932, seenAt: ["solar-depot-ng"], sourceUrl: "https://www.solardepotng.com/victron-energy-inverter", seenOn: D },
      { category: "inverter", model: "Quattro 48/15000", spec: "15kVA 48V, dual AC input", kva: 15, priceLow: 5_989_417, priceHigh: 5_989_417, seenAt: ["solar-depot-ng"], sourceUrl: "https://www.solardepotng.com/victron-energy-inverter", seenOn: D },
    ],
  },
  {
    slug: "solis",
    name: "Solis",
    kind: "manufacturer",
    tier: "mid",
    origin: "China (Ginlong)",
    categories: ["inverter"],
    tagline: "Grid-tie specialist with competitive S6 hybrids from 5kW",
    description:
      "Solis S6 hybrids are a strong alternative to Deye above 6kW — similar features at ₦200k–₦300k per kVA. The 5kW S6 at ₦650k is priced like a Growatt. Stocked by Solar Depot NG.",
    website: "https://www.solisinverters.com",
    pricesPublic: true,
    products: [
      { category: "inverter", model: "S6 5kW 48V hybrid", spec: "5kW 48V hybrid", kva: 5, priceLow: 649_500, priceHigh: 649_500, seenAt: ["solar-depot-ng"], sourceUrl: "https://solardepotng.com/index.php?path=426&route=product%2Fcategory", seenOn: D },
      { category: "inverter", model: "S6 6kW LV", spec: "6kW single-phase low-voltage hybrid", kva: 6, priceLow: 1_826_000, priceHigh: 1_826_000, seenAt: ["solar-depot-ng"], sourceUrl: "https://solardepotng.com/index.php?path=426&route=product%2Fcategory", seenOn: D },
      { category: "inverter", model: "S6 8kW LV", spec: "8kW single-phase hybrid", kva: 8, priceLow: 1_890_000, priceHigh: 2_290_000, seenAt: ["solar-depot-ng"], sourceUrl: "https://solardepotng.com/index.php?path=426&route=product%2Fcategory", seenOn: D },
      { category: "inverter", model: "S6 12kW LV", spec: "12kW single-phase hybrid", kva: 12, priceLow: 2_650_000, priceHigh: 2_650_000, seenAt: ["solar-depot-ng"], sourceUrl: "https://solardepotng.com/index.php?path=426&route=product%2Fcategory", seenOn: D },
      { category: "inverter", model: "S6 16kW LV", spec: "16kW single-phase hybrid", kva: 16, priceLow: 3_200_000, priceHigh: 3_200_000, seenAt: ["solar-depot-ng"], sourceUrl: "https://solardepotng.com/index.php?path=426&route=product%2Fcategory", seenOn: D },
    ],
  },
  {
    slug: "must",
    name: "Must",
    kind: "manufacturer",
    tier: "mid",
    origin: "China",
    categories: ["inverter"],
    tagline: "PV18 / PH1800 hybrids — a long-standing mid-tier choice",
    description:
      "Must PV18 and PH1800 PRO hybrids are widely serviced in Nigeria and sit between Felicity and Growatt on price. Prices below are from a July 2026 guide rather than a live cart — confirm before buying.",
    website: "https://www.mustpower.com",
    pricesPublic: true,
    products: [
      { category: "inverter", model: "PV18-3048", spec: "5kVA 48V hybrid", kva: 5, priceLow: 630_000, priceHigh: 690_000, seenAt: ["solarenergysupplystores guide"], sourceUrl: "https://solarenergysupplystores.com/must-inverter/", seenOn: "2026-07-14", note: "Guide price" },
      { category: "inverter", model: "PH1800 PRO 5.5kW", spec: "5.2–5.5kW hybrid", kva: 5.5, priceLow: 750_000, priceHigh: 890_000, seenAt: ["solarenergysupplystores guide"], sourceUrl: "https://solarenergysupplystores.com/must-inverter/", seenOn: "2026-07-14", note: "Guide price" },
      { category: "inverter", model: "PV18-10048 PRO", spec: "10kW 48V hybrid", kva: 10, priceLow: 1_950_000, priceHigh: 2_100_000, seenAt: ["solarenergysupplystores guide"], sourceUrl: "https://solarenergysupplystores.com/must-inverter/", seenOn: "2026-07-14", note: "Guide price" },
    ],
  },
  {
    slug: "sako",
    name: "Sako",
    kind: "manufacturer",
    tier: "budget",
    origin: "China",
    categories: ["inverter"],
    tagline: "Cheapest ₦/kVA hybrid on the market via Alaba wholesalers",
    description:
      "Sako (and the near-identical Luxsun) 6.2kVA hybrids sell for under ₦400k in Alaba — ₦63k per kVA. Fine for budget builds where you accept a shorter warranty and basic monitoring.",
    pricesPublic: true,
    products: [
      { category: "inverter", model: "6.2kVA hybrid 48V", spec: "6.2kVA 48V hybrid", kva: 6.2, priceLow: 390_000, priceHigh: 420_000, seenAt: ["nature-solar"], sourceUrl: "https://naturesolar.ng/product/sako-6-2kva-hybrid-inverter/", seenOn: D, note: "₦420k is the Luxsun-branded twin" },
    ],
  },
  {
    slug: "luminous",
    name: "Luminous",
    kind: "manufacturer",
    tier: "mid",
    origin: "India",
    categories: ["inverter"],
    tagline: "Familiar Indian brand; I-Cruze hybrids from 5kVA",
    description: "Luminous is well known in Nigeria from the tubular-battery era. Their I-Cruze hybrid line is priced above Growatt for the same kVA; worth it mainly if you already have Luminous batteries.",
    website: "https://www.luminousindia.com",
    pricesPublic: true,
    products: [
      { category: "inverter", model: "I-Cruze 5kVA", spec: "5kVA 48V hybrid", kva: 5, priceLow: 980_000, priceHigh: 980_000, seenAt: ["Swiftermall"], sourceUrl: "https://www.swiftermall.com/luminous-inverters/844-luminous-5kva-72v-single-phase-inverter.html", seenOn: D },
      { category: "inverter", model: "I-Cruze 7.5kVA", spec: "7.5kVA 120V hybrid", kva: 7.5, priceLow: 1_020_000, priceHigh: 1_020_000, seenAt: ["Swiftermall"], sourceUrl: "https://www.swiftermall.com/luminous-inverters/844-luminous-5kva-72v-single-phase-inverter.html", seenOn: D },
      { category: "inverter", model: "I-Cruze 10kVA", spec: "10kVA 180V hybrid", kva: 10, priceLow: 1_728_000, priceHigh: 1_728_000, seenAt: ["Swiftermall"], sourceUrl: "https://www.swiftermall.com/luminous-inverters/844-luminous-5kva-72v-single-phase-inverter.html", seenOn: D },
    ],
  },
  {
    slug: "pylontech",
    name: "Pylontech",
    kind: "manufacturer",
    tier: "premium",
    origin: "China",
    categories: ["battery"],
    tagline: "Premium rack batteries with the longest track record",
    description: "Pylontech is the battery brand with the most installed base worldwide and the best warranty support, at ₦320k+/kWh in Nigeria — about 1.6× a Deye or Felicity pack. The popular US5000 is not currently listed by Nigerian retailers; UF5000 and UP5000 are.",
    website: "https://en.pylontech.com.cn",
    pricesPublic: true,
    products: [
      { category: "battery", model: "UF5000", spec: "5.12kWh 48V rack LiFePO4", kwh: 5.12, priceLow: 1_668_000, priceHigh: 1_668_000, seenAt: ["zit"], sourceUrl: "https://zit.ng/products/deye-512kw-low-voltage-lithium-ion-solar-battery-bos-se-g51-lv/", seenOn: D },
      { category: "battery", model: "US2000C", spec: "2.4kWh 48V rack LiFePO4", kwh: 2.4, priceLow: 1_397_000, priceHigh: 1_397_000, seenAt: ["zit"], sourceUrl: "https://zit.ng/products/deye-512kw-low-voltage-lithium-ion-solar-battery-bos-se-g51-lv/", seenOn: D },
      { category: "battery", model: "UP5000", spec: "4.8kWh 48V rack LiFePO4", kwh: 4.8, priceLow: 2_956_052, priceHigh: 2_956_052, seenAt: ["zit"], sourceUrl: "https://zit.ng/products/pylontech-4-8kwh-lithium-ion-solar-battery-up5000/", seenOn: D },
    ],
  },
  {
    slug: "dyness",
    name: "Dyness",
    kind: "manufacturer",
    tier: "mid",
    origin: "China",
    categories: ["battery"],
    tagline: "PowerBrick and Stack batteries for 10kWh and up",
    description: "Dyness makes larger-format LiFePO4 modules (14.4kWh PowerBrick, 60kWh high-voltage Stack) at ~₦225k–₦250k/kWh. A good fit for 10kVA+ homes and small commercial. Stocked by Solar Depot NG.",
    website: "https://www.dyness.com",
    pricesPublic: true,
    products: [
      { category: "battery", model: "PowerBrick 51.2V 280Ah", spec: "14.4kWh 51.2V LiFePO4", kwh: 14.4, priceLow: 3_250_000, priceHigh: 3_250_000, seenAt: ["solar-depot-ng"], sourceUrl: "https://www.solardepotng.com/lithium-deep-cycle", seenOn: D },
      { category: "battery", model: "Stack100 HV", spec: "60kWh high-voltage stack", kwh: 60, priceLow: 14_850_000, priceHigh: 14_850_000, seenAt: ["solar-depot-ng"], sourceUrl: "https://www.solardepotng.com/lithium-deep-cycle", seenOn: D },
    ],
  },
  {
    slug: "itel-energy",
    name: "ITEL Energy",
    kind: "manufacturer",
    tier: "budget",
    origin: "China (Transsion)",
    categories: ["battery", "inverter"],
    tagline: "Phone-brand pricing on LiFePO4: the cheapest branded packs in Nigeria",
    description: "ITEL (the phone company) now sells 51.2V LiFePO4 wall and floor packs at ₦160k–₦175k/kWh — the lowest branded price we found, with an established Nigerian service network. 3kW and 6kW inverters are also available.",
    pricesPublic: true,
    products: [
      { category: "battery", model: "51.2V 100Ah wall/standing", spec: "5.12kWh 51.2V 100Ah", kwh: 5.12, priceLow: 895_000, priceHigh: 895_000, seenAt: ["solar-depot-ng"], sourceUrl: "https://www.solardepotng.com/lithium-deep-cycle", seenOn: D },
      { category: "battery", model: "51.2V 10kWh", spec: "10kWh 51.2V", kwh: 10, priceLow: 1_698_000, priceHigh: 1_698_000, seenAt: ["solar-depot-ng"], sourceUrl: "https://www.solardepotng.com/lithium-deep-cycle", seenOn: D },
      { category: "battery", model: "51.2V 16kWh", spec: "16kWh 51.2V (IP21 / IP65)", kwh: 16, priceLow: 2_595_000, priceHigh: 2_595_000, seenAt: ["solar-depot-ng"], sourceUrl: "https://www.solardepotng.com/lithium-deep-cycle", seenOn: D },
      { category: "inverter", model: "3kW / 6kW hybrid", spec: "3kW and 6kW hybrid", kva: 6, priceLow: 355_000, priceHigh: 563_360, seenAt: ["solarbuy"], sourceUrl: "https://solarbuy.com.ng/product/3-6kw-luxpower-solar-inverter/", seenOn: D },
    ],
  },
  {
    slug: "blue-carbon",
    name: "Blue Carbon",
    kind: "manufacturer",
    tier: "budget",
    origin: "China",
    categories: ["battery"],
    tagline: "Lowest ₦/kWh we found — ₦129k on a 12.8kWh flat pack",
    description: "Blue Carbon flat-pack LiFePO4 batteries are the budget pick for big banks. Warranty support is thinner than Felicity or Deye; buy from a vendor who will stand behind it.",
    pricesPublic: true,
    products: [
      { category: "battery", model: "48V 250Ah flat", spec: "12.8kWh 48V 250Ah LiFePO4", kwh: 12.8, priceLow: 1_650_000, priceHigh: 1_650_000, seenAt: ["solar-village"], sourceUrl: "https://solarvillage.africa/featured-brands/battery/deye/deye-bos-se-g5-1-lv-5-12kwh-lithium-battery-bos-se-g5-1-lv222.html", seenOn: D },
    ],
  },
  {
    slug: "jinko",
    name: "Jinko Solar",
    kind: "manufacturer",
    tier: "mid",
    origin: "China · Tier-1",
    categories: ["panel"],
    tagline: "Tier-1 panels; 600W+ Tiger Neo is the Nigerian default",
    description: "Jinko is the most-stocked Tier-1 panel in Nigeria. Alaba wholesalers move 600W bifacial units at ₦110k–₦120k (₦183–200/Wp); e-commerce sites charge up to ₦190k for the same class. Always buy by the pallet price if you can.",
    website: "https://www.jinkosolar.com",
    pricesPublic: true,
    products: [
      { category: "panel", model: "450W mono", spec: "450W monocrystalline", watts: 450, priceLow: 82_969, priceHigh: 82_969, seenAt: ["Jumia"], sourceUrl: "https://www.jumia.com.ng/solar-panels/jinko/", seenOn: D },
      { category: "panel", model: "600W bifacial", spec: "600W N-type bifacial", watts: 600, priceLow: 110_000, priceHigh: 120_000, seenAt: ["nature-solar", "Jiji (PH)"], sourceUrl: "https://naturesolar.ng/product/600w-longi-all-black-solar-panel-144-cells/", seenOn: D },
      { category: "panel", model: "620W bifacial", spec: "620W bifacial", watts: 620, priceLow: 190_000, priceHigh: 190_000, seenAt: ["Jumia"], sourceUrl: "https://www.jumia.com.ng/solar-panels/jinko/", seenOn: D },
      { category: "panel", model: "650–700W bifacial", spec: "650W / 700W bifacial", watts: 700, priceLow: 120_000, priceHigh: 120_000, seenAt: ["Jiji"], sourceUrl: "https://jiji.ng/272-solar-panels", seenOn: D },
    ],
  },
  {
    slug: "ja-solar",
    name: "JA Solar",
    kind: "manufacturer",
    tier: "mid",
    origin: "China · Tier-1",
    categories: ["panel"],
    tagline: "Tier-1 bifacial panels, strong at 580W",
    description: "JA Solar is stocked by Me3 Energy (VI) at showroom prices and by Jiji bulk sellers at wholesale. Performance is on par with Jinko and Longi.",
    website: "https://www.jasolar.com",
    pricesPublic: true,
    products: [
      { category: "panel", model: "550W mono PERC", spec: "550W monocrystalline PERC", watts: 550, priceLow: 149_000, priceHigh: 160_000, seenAt: ["me3-energy"], sourceUrl: "https://me3energy.ng/580w-bifacial-monocrystalline-ja-solar-panels-ja-solar-580w-bifacial-monocrystalline-ja-solar-panels-ja-solar-390w-datasheet-ja-solar-250w-datasheet", seenOn: D },
      { category: "panel", model: "580W bifacial", spec: "580W bifacial mono", watts: 580, priceLow: 139_000, priceHigh: 150_000, seenAt: ["me3-energy"], sourceUrl: "https://me3energy.ng/580w-bifacial-monocrystalline-ja-solar-panels-ja-solar-580w-bifacial-monocrystalline-ja-solar-panels-ja-solar-390w-datasheet-ja-solar-250w-datasheet", seenOn: D },
      { category: "panel", model: "650–700W bifacial", spec: "650W / 680W / 700W bifacial", watts: 700, priceLow: 120_000, priceHigh: 125_000, seenAt: ["Jiji (Abuja / PH)"], sourceUrl: "https://jiji.ng/272-solar-panels", seenOn: D },
    ],
  },
  {
    slug: "longi",
    name: "Longi",
    kind: "manufacturer",
    tier: "mid",
    origin: "China · Tier-1",
    categories: ["panel"],
    tagline: "Tier-1 all-black panels at Alaba wholesale prices",
    description: "Longi Hi-MO panels are the best-value Tier-1 option through Alaba wholesalers — 550W at ₦95k is ₦173/Wp, the lowest we saw for a Tier-1 module.",
    website: "https://www.longi.com",
    pricesPublic: true,
    products: [
      { category: "panel", model: "450W all-black", spec: "450W all-black mono", watts: 450, priceLow: 115_000, priceHigh: 115_000, seenAt: ["nature-solar"], sourceUrl: "https://naturesolar.ng/product/600w-longi-all-black-solar-panel-144-cells/", seenOn: D },
      { category: "panel", model: "550W black frame", spec: "550W black-frame mono", watts: 550, priceLow: 95_000, priceHigh: 95_000, seenAt: ["nature-solar"], sourceUrl: "https://naturesolar.ng/product/600w-longi-all-black-solar-panel-144-cells/", seenOn: D },
      { category: "panel", model: "600W all-black 144-cell", spec: "600W all-black mono, 144 cells", watts: 600, priceLow: 110_000, priceHigh: 110_000, seenAt: ["nature-solar"], sourceUrl: "https://naturesolar.ng/product/600w-longi-all-black-solar-panel-144-cells/", seenOn: D },
    ],
  },
  {
    slug: "canadian-solar",
    name: "Canadian Solar",
    kind: "manufacturer",
    tier: "mid",
    origin: "Canada / China · Tier-1",
    categories: ["panel"],
    tagline: "Tier-1 panels stocked by Gennex and Alaba",
    description: "Canadian Solar HiKu modules are stocked by Gennex (Lekki/Abuja) at ₦135k for 590W and by Nature Solar at ₦110k for 600W all-black.",
    website: "https://www.csisolar.com",
    pricesPublic: true,
    products: [
      { category: "panel", model: "590W HiKu", spec: "590W mono", watts: 590, priceLow: 135_000, priceHigh: 135_000, seenAt: ["gennex"], sourceUrl: "https://shop.gennextechnologies.com/", seenOn: D },
      { category: "panel", model: "600W all-black", spec: "600W all-black mono", watts: 600, priceLow: 110_000, priceHigh: 110_000, seenAt: ["nature-solar"], sourceUrl: "https://naturesolar.ng/product/600w-longi-all-black-solar-panel-144-cells/", seenOn: D },
    ],
  },
  {
    slug: "trina",
    name: "Trina Solar",
    kind: "manufacturer",
    tier: "mid",
    origin: "China · Tier-1",
    categories: ["panel"],
    tagline: "Tier-1 Vertex panels; widest price spread — buy carefully",
    description: "Trina Vertex 600W panels range from ₦90k (Alaba) to ₦136.5k (Me3 showroom). A ₦65k listing exists online but we couldn't verify it — treat anything under ₦85k as suspect.",
    website: "https://www.trinasolar.com",
    pricesPublic: true,
    products: [
      { category: "panel", model: "Vertex 600W", spec: "600W mono", watts: 600, priceLow: 90_000, priceHigh: 136_500, seenAt: ["nature-solar", "me3-energy"], sourceUrl: "https://me3energy.ng/600w-trina-solar-panel-high-efficiency-industrial-solar-solution-for-reliable-power-diesel-cost-reduction-in-nigeria", seenOn: D },
    ],
  },
  {
    slug: "auxano",
    name: "Auxano Solar",
    kind: "manufacturer",
    tier: "mid",
    origin: "Nigeria · Ibeju-Lekki, Lagos",
    categories: ["panel"],
    tagline: "Nigeria's own panel assembler — 400–600W mono, 100MW/yr",
    description: "Auxano assembles monocrystalline panels in Lagos, which matters for warranty claims and for projects that need local content. Prices are quote-only; we can request one for you.",
    website: "https://auxanosolar.com",
    phones: ["+234 706 795 6193"],
    pricesPublic: false,
    products: [],
  },
];

// ─────────────────────────────────────────────────────────
// NIGERIAN VENDORS (distributors, retailers, installers)
// ─────────────────────────────────────────────────────────

const VENDORS: Brand[] = [
  {
    slug: "felicity-solar-ng",
    name: "Felicity Solar Nigeria",
    kind: "vendor",
    origin: "Amuwo-Odofin, Lagos",
    categories: ["inverter", "battery", "controller"],
    tagline: "Official Felicity store with the full catalogue priced online",
    description: "The official Nigerian Felicity outlet. List prices are higher than Alaba resellers but you get genuine stock and warranty registration.",
    website: "https://www.felicitysolar.ng",
    phones: ["+234 817 147 9561", "+234 707 911 7572"],
    carries: ["felicity"],
    pricesPublic: true,
    products: [],
  },
  {
    slug: "zit",
    name: "Zit Nigeria",
    kind: "vendor",
    origin: "Lagos · same-day delivery",
    categories: ["inverter", "battery"],
    tagline: "Online store for Felicity, Deye, Growatt, Pylontech with same-day Lagos delivery",
    description: "Zit is the most complete online catalogue in Nigeria for branded inverters and batteries, with clear prices and Lagos delivery. Prices sit at the higher end of the spread.",
    website: "https://zit.ng",
    phones: ["0912 687 0252", "0902 503 3804"],
    carries: ["felicity", "deye", "growatt", "pylontech"],
    pricesPublic: true,
    products: [],
  },
  {
    slug: "nature-solar",
    name: "Nature Solar Global",
    kind: "vendor",
    origin: "Alaba International Market, Ojo, Lagos",
    categories: ["panel", "inverter"],
    tagline: "Alaba wholesale — the lowest panel prices we found",
    description: "Wholesale pricing on Longi, Jinko, Canadian and Trina panels (₦95k–₦120k per 550–600W), plus Sako, Felicity, Deye and Yohako inverters. Ideal if you're buying a full pallet or want the floor price.",
    website: "https://naturesolar.ng",
    phones: ["0704 952 8019"],
    whatsapp: "2349040054359",
    carries: ["longi", "jinko", "canadian-solar", "trina", "sako", "felicity", "deye"],
    pricesPublic: true,
    products: [],
  },
  {
    slug: "me3-energy",
    name: "Me3 Energy",
    kind: "vendor",
    origin: "Victoria Island, Lagos",
    categories: ["panel", "inverter"],
    tagline: "VI showroom for JA Solar, Trina and Deye",
    description: "Showroom-grade retailer on Kofo Abayomi Street. Prices are 20–30% above Alaba but stock is verified genuine and you can inspect before buying.",
    website: "https://me3energy.ng",
    phones: ["0706 123 5392", "(020) 1453 6190"],
    carries: ["ja-solar", "trina", "deye"],
    pricesPublic: true,
    products: [],
  },
  {
    slug: "gennex",
    name: "Gennex Technologies",
    kind: "vendor",
    origin: "Ikate, Lekki, Lagos · Abuja",
    categories: ["inverter", "panel", "package"],
    tagline: "Luxpower importer; Growatt, Canadian Solar, packages and financing",
    description: "Established distributor with Lagos and Abuja branches. Official Luxpower importer, stocks Growatt and Tier-1 panels, sells complete packages and offers financing.",
    website: "https://shop.gennextechnologies.com",
    phones: ["0817 946 4060", "0702 627 8577", "0201 293 4490"],
    carries: ["luxpower", "growatt", "canadian-solar", "jinko", "ja-solar"],
    pricesPublic: true,
    products: [
      { category: "package", model: "5kVA / 10kWh all-in-one", spec: "5kVA hybrid + 10kWh lithium (panels not stated)", kva: 5, kwh: 10, priceLow: 3_450_000, priceHigh: 3_450_000, seenAt: ["gennex"], sourceUrl: "https://shop.gennextechnologies.com/", seenOn: D },
    ],
  },
  {
    slug: "solar-depot-ng",
    name: "Solar Depot Nigeria",
    kind: "vendor",
    origin: "Isheri, Lagos · Garki, Abuja · Alakia, Ibadan",
    categories: ["inverter", "battery", "package"],
    tagline: "Victron, Solis, Deye, Dyness, ITEL — the widest premium catalogue",
    description: "Three branches and the most extensive published catalogue for premium gear. Their packages include Lagos installation.",
    website: "https://www.solardepotng.com",
    phones: ["0808 607 1014 (Lagos)", "0704 694 6795 (Abuja)", "0906 912 5453 (Ibadan)"],
    carries: ["victron", "solis", "deye", "dyness", "itel-energy"],
    pricesPublic: true,
    products: [
      { category: "package", model: "SunPower 1", spec: "6kVA + 5kWh + 6×565W, Lagos install included", kva: 6, kwh: 5, priceLow: 5_875_000, priceHigh: 5_875_000, seenAt: ["solar-depot-ng"], sourceUrl: "https://www.solardepotng.com/solar-packages", seenOn: D },
      { category: "package", model: "SunPower 2", spec: "6kVA + 14.3kWh + 10×565W, Lagos install included", kva: 6, kwh: 14.3, priceLow: 8_290_000, priceHigh: 8_290_000, seenAt: ["solar-depot-ng"], sourceUrl: "https://www.solardepotng.com/solar-packages", seenOn: D },
      { category: "package", model: "SunVault 1", spec: "12kVA + 28.6kWh + 20×565W, Lagos install included", kva: 12, kwh: 28.6, priceLow: 15_640_000, priceHigh: 15_640_000, seenAt: ["solar-depot-ng"], sourceUrl: "https://www.solardepotng.com/solar-packages", seenOn: D },
    ],
  },
  {
    slug: "kasot-power",
    name: "Kasot Power",
    kind: "vendor",
    origin: "Shomolu, Lagos",
    categories: ["package"],
    tagline: "Lithium packages 2.5–24kVA with installation included",
    description: "Installer that publishes real all-in prices. Every package includes Lagos installation; the 'without panels' price is for people who already own panels.",
    website: "https://kasotpower.com",
    phones: ["+234 802 542 2669"],
    pricesPublic: true,
    products: [
      { category: "package", model: "2.5kVA package", spec: "2.5kVA + 5kWh + 3×600W, installed", kva: 2.5, kwh: 5, priceLow: 2_750_000, priceHigh: 2_750_000, seenAt: ["kasot-power"], sourceUrl: "https://kasotpower.com/solar-packages", seenOn: D, note: "₦2.0M without panels" },
      { category: "package", model: "3.5kVA package", spec: "3.5kVA + 5kWh + 6×600W, installed", kva: 3.5, kwh: 5, priceLow: 3_750_000, priceHigh: 3_750_000, seenAt: ["kasot-power"], sourceUrl: "https://kasotpower.com/solar-packages", seenOn: D, note: "₦2.9M without panels" },
      { category: "package", model: "5kVA package", spec: "5kVA + 10kWh + 7×600W, installed", kva: 5, kwh: 10, priceLow: 5_850_000, priceHigh: 5_850_000, seenAt: ["kasot-power"], sourceUrl: "https://kasotpower.com/solar-packages", seenOn: D, note: "₦4.85M without panels" },
      { category: "package", model: "10kVA package", spec: "10kVA lithium, installed", kva: 10, priceLow: 7_000_000, priceHigh: 7_000_000, seenAt: ["kasot-power"], sourceUrl: "https://kasotpower.com/solar-packages", seenOn: D, note: "₦5.8M without panels" },
      { category: "package", model: "12kVA package", spec: "12kVA lithium, installed", kva: 12, priceLow: 7_500_000, priceHigh: 7_500_000, seenAt: ["kasot-power"], sourceUrl: "https://kasotpower.com/solar-packages", seenOn: D, note: "₦6.2M without panels" },
    ],
  },
  {
    slug: "maypatronic",
    name: "Maypatronic",
    kind: "vendor",
    origin: "Lagos · Port Harcourt",
    categories: ["package", "battery"],
    tagline: "Bundled lithium systems from 1.5kVA to 100kVA",
    description: "Publishes a clean bundle list (inverter + lithium + panels). Useful as a benchmark for what a 'complete system' should cost before installation.",
    website: "https://maypatronic.com",
    whatsapp: "2347017796300",
    carries: ["felicity"],
    pricesPublic: true,
    products: [
      { category: "package", model: "3kVA / 5kWh bundle", spec: "3kVA + 5kWh lithium + panels", kva: 3, kwh: 5, priceLow: 2_950_000, priceHigh: 2_950_000, seenAt: ["maypatronic"], sourceUrl: "https://maypatronic.com/product-category/lithium-battery-price-nigeria/", seenOn: D },
      { category: "package", model: "5kVA / 10kWh bundle", spec: "5kVA + 10kWh lithium + panels", kva: 5, kwh: 10, priceLow: 4_950_000, priceHigh: 4_950_000, seenAt: ["maypatronic"], sourceUrl: "https://maypatronic.com/product-category/lithium-battery-price-nigeria/", seenOn: D },
      { category: "package", model: "7.5kVA / 15kWh bundle", spec: "7.5kVA + 15kWh lithium + panels", kva: 7.5, kwh: 15, priceLow: 6_950_000, priceHigh: 6_950_000, seenAt: ["maypatronic"], sourceUrl: "https://maypatronic.com/product-category/lithium-battery-price-nigeria/", seenOn: D },
      { category: "package", model: "10kVA / 20kWh bundle", spec: "10kVA + 20kWh lithium + panels", kva: 10, kwh: 20, priceLow: 9_500_000, priceHigh: 9_500_000, seenAt: ["maypatronic"], sourceUrl: "https://maypatronic.com/product-category/lithium-battery-price-nigeria/", seenOn: D },
    ],
  },
  {
    slug: "gosolarmart",
    name: "GoSolarMart",
    kind: "vendor",
    origin: "Abuja · Lagos · Kebbi",
    categories: ["inverter", "battery"],
    tagline: "Growatt, Deye, Huawei and Pylontech; strong in Abuja",
    description: "Distributor with an Abuja base and commercial/industrial experience. Good source for Growatt SPF units.",
    website: "https://gosolarmart.com",
    phones: ["+234 802 523 4859", "+234 803 952 9629"],
    carries: ["growatt", "deye", "pylontech"],
    pricesPublic: true,
    products: [],
  },
  {
    slug: "abuja-solar",
    name: "Abuja Solar",
    kind: "vendor",
    origin: "Abuja",
    categories: ["inverter", "battery"],
    tagline: "Full Deye range in Abuja at competitive prices",
    description: "Abuja-based retailer with every Deye SUN model priced online — often the lowest Deye prices outside Alaba.",
    website: "https://abujasolar.com",
    carries: ["deye"],
    pricesPublic: true,
    products: [],
  },
  {
    slug: "energymall",
    name: "EnergyMall",
    kind: "vendor",
    origin: "Lekki Phase 1, Lagos",
    categories: ["inverter", "battery"],
    tagline: "Felicity, Deye and Luxpower — cheapest Felicity 5kWh we found",
    description: "Lekki retailer with sharp pricing on Felicity batteries (5kWh at ₦999k).",
    website: "https://energymall.ng",
    phones: ["+234 815 090 6094"],
    carries: ["felicity", "deye", "luxpower"],
    pricesPublic: true,
    products: [],
  },
  {
    slug: "stellarmart",
    name: "StellarMart",
    kind: "vendor",
    origin: "Reco Plaza, Alaba International Market, Lagos",
    categories: ["inverter"],
    tagline: "Alaba pricing on Felicity, Growatt and SRNE inverters",
    description: "Alaba shop with an online catalogue — Growatt SPF 5000 ES at ₦530k and Felicity 5kVA at ₦440k were the lowest we saw.",
    website: "https://www.stellarmart.ng",
    phones: ["+234 812 629 1081"],
    carries: ["felicity", "growatt"],
    pricesPublic: true,
    products: [],
  },
  {
    slug: "solar-village",
    name: "Solar Village Africa",
    kind: "vendor",
    origin: "Lagos",
    categories: ["inverter", "battery"],
    tagline: "Felicity, Deye, Blue Carbon, Cworth, Gospower",
    description: "Online retailer with the broadest budget-battery range (Blue Carbon, Cworth) alongside Felicity and Deye.",
    website: "https://solarvillage.africa",
    carries: ["felicity", "deye", "blue-carbon", "luxpower"],
    pricesPublic: true,
    products: [],
  },
  {
    slug: "solarkobo",
    name: "SolarKobo",
    kind: "vendor",
    origin: "Lekki, Lagos · pickup in Isolo",
    categories: ["inverter", "controller"],
    tagline: "Victron and Epever specialists; full installations and pumps",
    description: "Long-running Lagos installer/retailer known for Victron and Epever gear and solar water pumps. Component prices are public; system prices via their estimator.",
    website: "https://www.solarkobo.com",
    phones: ["0818 281 8001", "0805 202 5022"],
    carries: ["victron"],
    pricesPublic: true,
    products: [],
  },
  {
    slug: "solarbuy",
    name: "SolarBuy (Herolinks)",
    kind: "vendor",
    origin: "Abeokuta, Ogun",
    categories: ["inverter"],
    tagline: "Luxpower and ITEL inverters at Ogun prices",
    description: "Abeokuta-based store with the lowest Luxpower prices we found (5kW at ₦590k).",
    website: "https://solarbuy.com.ng",
    phones: ["+234 703 377 9494"],
    carries: ["luxpower", "itel-energy"],
    pricesPublic: true,
    products: [],
  },
];

// ─────────────────────────────────────────────────────────
// ACCESSORS
// ─────────────────────────────────────────────────────────

export const BRANDS: Brand[] = [...MANUFACTURERS, ...VENDORS];

export const CATEGORY_LABEL: Record<ProductCategory, string> = {
  inverter: "Inverters",
  battery: "Batteries",
  panel: "Solar panels",
  controller: "Charge controllers",
  package: "Complete packages",
};

export const TIER_LABEL: Record<BrandTier, string> = {
  budget: "Budget",
  mid: "Mid-range",
  premium: "Premium",
};

export function getBrand(slug: string): Brand | undefined {
  return BRANDS.find((b) => b.slug === slug);
}

export function manufacturers(): Brand[] {
  return BRANDS.filter((b) => b.kind === "manufacturer");
}

export function vendors(): Brand[] {
  return BRANDS.filter((b) => b.kind === "vendor");
}

/** Vendors that stock a manufacturer, or that a product was seen at */
export function vendorsFor(brand: Brand): Brand[] {
  const slugs = new Set<string>();
  vendors().forEach((v) => { if (v.carries?.includes(brand.slug)) slugs.add(v.slug); });
  brand.products.forEach((p) => p.seenAt.forEach((s) => slugs.add(s)));
  return vendors().filter((v) => slugs.has(v.slug));
}

/** Cheapest ₦ per kVA / kWh / Wp across a brand's products, for cards */
export function headlineUnitPrice(brand: Brand): string | null {
  const inv = brand.products.filter((p) => p.category === "inverter" && p.kva);
  const bat = brand.products.filter((p) => p.category === "battery" && p.kwh);
  const pan = brand.products.filter((p) => p.category === "panel" && p.watts);
  const pkg = brand.products.filter((p) => p.category === "package");
  const min = (arr: number[]) => Math.min(...arr);
  if (inv.length) return `from ₦${Math.round(min(inv.map((p) => p.priceLow / p.kva!)) / 1000)}k / kVA`;
  if (bat.length) return `from ₦${Math.round(min(bat.map((p) => p.priceLow / p.kwh!)) / 1000)}k / kWh`;
  if (pan.length) return `from ₦${Math.round(min(pan.map((p) => p.priceLow / p.watts!)))} / W`;
  if (pkg.length) return `packages from ₦${(min(pkg.map((p) => p.priceLow)) / 1_000_000).toFixed(2).replace(/\.?0+$/, "")}M`;
  return null;
}
