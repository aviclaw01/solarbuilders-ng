/**
 * The blog post registry — one row per published article.
 *
 * It lives here rather than inside app/blog/page.tsx because app/sitemap.ts
 * reads it too. Two posts were live but missing from both the index and the
 * sitemap for exactly that reason: the list existed in one place and the
 * sitemap kept its own copy. Add a post here and it appears in both.
 */
export interface Article {
  slug: string;
  title: string;
  excerpt: string;
  readTime: string;
  date: string;
  tag: string;
  tagColor: string;
  featured?: boolean;
  /** Sitemap priority; defaults to 0.7 for posts without a stated one. */
  priority?: number;
}

export const ARTICLES: Article[] = [
  {
    slug: 'solar-cost-nigeria-2026',
    title: 'What a Nigerian Solar System Actually Costs — Every Component, Every Price',
    excerpt: 'Dated, itemised Nigerian prices: ₦ per kVA for inverters, ₦ per kWh for lithium, ₦ per Wp for panels, plus mounting and labour. Use it to check any quote you have been given.',
    readTime: '11 min read',
    date: 'September 2026',
    tag: 'Costs & Pricing',
    tagColor: 'bg-blue-50 text-blue-700 border-blue-200',
    featured: true,
  },
  {
    slug: 'is-solar-worth-it-nigeria',
    title: 'Is Solar Worth It in Nigeria? The Payback Period, Calculated Properly',
    excerpt: 'Published payback claims run from one year to five and none shows its working. We show ours — against petrol at the pump and Band A at ₦209–₦225 per kWh.',
    readTime: '10 min read',
    date: 'September 2026',
    tag: 'Cost Analysis',
    tagColor: 'bg-red-50 text-red-700 border-red-200',
    featured: true,
  },
  {
    slug: 'generator-vs-solar-lagos',
    title: 'The True Cost of Generator vs Solar in Lagos',
    excerpt: 'Most Lagosians know generators are expensive. But few have done the math. We did — and the numbers over 3 years are eye-opening.',
    readTime: '8 min read',
    date: 'March 2026',
    tag: 'Cost Analysis',
    tagColor: 'bg-red-50 text-red-700 border-red-200',
    featured: false,
  },
  {
    slug: 'inverter-size-guide',
    title: 'What Size Inverter Do I Need? A Nigerian Guide',
    excerpt: 'Choosing the wrong inverter size is one of the most expensive mistakes solar buyers make. This guide helps you calculate exactly what you need.',
    readTime: '7 min read',
    date: 'February 2026',
    tag: 'System Sizing',
    tagColor: 'bg-purple-50 text-purple-700 border-purple-200',
    featured: false,
  },
  {
    slug: 'choose-solar-installer-lagos',
    title: 'How to Choose a Solar Installer in Nigeria (Without Getting Scammed)',
    excerpt: 'Not all solar installers are equal. This guide shows you what to look for, the right questions to ask, and red flags to avoid before paying a single naira.',
    readTime: '5 min read',
    date: 'March 2026',
    tag: 'Buyer Guide',
    tagColor: 'bg-amber-50 text-amber-700 border-amber-200',
    featured: false,
  },
  {
    slug: 'solar-maintenance-nigeria',
    title: 'Solar Panel Maintenance: What Nigerian Homeowners Need to Know',
    excerpt: 'Good news: solar is remarkably low-maintenance. Here\'s what you actually need to do — and what you can safely ignore — in Nigeria\'s climate.',
    readTime: '6 min read',
    date: 'March 2026',
    tag: 'Maintenance',
    tagColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    featured: false,
  },
  {
    slug: 'solar-loans-nigeria',
    title: 'Carbon, FairMoney, or Renmoney: Best Solar Loans in Nigeria',
    excerpt: 'Compare the best solar financing options in Nigeria — fintech loans, bank products, PAYG schemes, and installer payment plans.',
    readTime: '7 min read',
    date: 'March 2026',
    tag: 'Financing',
    tagColor: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    featured: false,
  },
  {
    slug: 'lithium-vs-tubular-battery-nigeria',
    title: 'Lithium vs Tubular Batteries in Nigeria: the 10-Year Cost',
    excerpt: 'Lithium costs more on day one and less by year ten. The arithmetic, at September 2026 prices — cost per usable kWh, replacement schedule, and the three cases where tubular still wins.',
    readTime: '9 min read',
    date: 'September 2026',
    tag: 'Batteries',
    tagColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    featured: false,
  },
  {
    slug: 'best-solar-inverter-nigeria',
    title: 'The Best Solar Inverter in Nigeria, Ranked by What It Costs per kVA',
    excerpt: 'Not an opinion piece. Every brand we track, ranked on measured ₦ per kVA, with how many Nigerian sellers carry it and what the manufacturer actually publishes.',
    readTime: '9 min read',
    date: 'September 2026',
    tag: 'Brands',
    tagColor: 'bg-purple-50 text-purple-700 border-purple-200',
    featured: false,
  },
  {
    slug: 'fake-solar-panels-nigeria',
    title: 'How to Tell a Real Solar Panel from a Fake One in Nigeria',
    excerpt: 'Three checks that take a minute — plus the price test nobody else can give you. If a 550W panel is quoted below the real floor, it is not a 550W panel.',
    readTime: '8 min read',
    date: 'September 2026',
    tag: 'Buyer Guide',
    tagColor: 'bg-amber-50 text-amber-700 border-amber-200',
    featured: false,
  },
  {
    slug: 'check-solar-installer-qualified-nemsa',
    title: 'How to Check Your Solar Installer Is Actually Qualified',
    excerpt: 'NEMSA certification, a deposit structure that matches where the cost really sits, and an itemised bill of materials with model numbers. The three checks before money moves.',
    readTime: '9 min read',
    date: 'September 2026',
    tag: 'Buyer Guide',
    tagColor: 'bg-amber-50 text-amber-700 border-amber-200',
    featured: false,
  },
  {
    slug: 'solar-in-a-rented-apartment-nigeria',
    title: 'Can Your Landlord Stop You Installing Solar? A Renter’s Guide',
    excerpt: 'Usually yes — and four ways round it. Ground mounts, removable frames, what to put in writing before you spend a naira, and a costed renter’s system.',
    readTime: '9 min read',
    date: 'September 2026',
    tag: 'Renters',
    tagColor: 'bg-teal-50 text-teal-700 border-teal-200',
    featured: false,
  },
  {
    slug: 'band-a-tariff-vs-solar',
    title: 'Your Band A Bill vs Solar: the Five-Year Arithmetic',
    excerpt: 'Band A customers pay ₦209–₦225 per kWh. Here is what that adds up to over five years for real Nigerian households, and what the same money buys as a solar system.',
    readTime: '8 min read',
    date: 'September 2026',
    tag: 'Grid & Tariffs',
    tagColor: 'bg-sky-50 text-sky-700 border-sky-200',
    featured: false,
  },
  {
    slug: 'sell-solar-power-to-nepa-net-billing',
    title: 'No, You Cannot Sell Solar Power to NEPA Yet',
    excerpt: 'Net billing is real and starts at 50 kWp — around ten times a large home array. Who the 2026 regulations actually cover, and what homeowners should do instead.',
    readTime: '7 min read',
    date: 'September 2026',
    tag: 'Policy',
    tagColor: 'bg-slate-100 text-slate-700 border-slate-200',
    featured: false,
  },
  {
    slug: 'harmattan-solar-panel-cleaning',
    title: 'Harmattan Is Coming: What Dust Does to Your Panels',
    excerpt: 'Peer-reviewed West African research puts soiling losses as high as 50% in the worst locations. What that costs per month in naira, and how to clean without voiding the warranty.',
    readTime: '8 min read',
    date: 'September 2026',
    tag: 'Maintenance',
    tagColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    featured: false,
  },
  {
    slug: 'solar-cold-room-nigeria',
    title: 'What It Costs to Solar-Power a Cold Room',
    excerpt: 'A costed, itemised answer for a small cold room — and the three things that make cold storage the hardest solar load in Nigeria.',
    readTime: '10 min read',
    date: 'September 2026',
    tag: 'Commercial',
    tagColor: 'bg-orange-50 text-orange-700 border-orange-200',
    featured: false,
  },
  {
    slug: 'solar-abuja-2026',
    title: 'Solar in Abuja: Prices and How to Get It Installed',
    excerpt: 'What a solar system costs in Abuja, what the city\u2019s sun hours mean for panel count, and how to get it fitted.',
    readTime: '8 min read',
    date: 'September 2026',
    tag: 'Costs & Pricing',
    tagColor: 'bg-blue-50 text-blue-700 border-blue-200',
  },
  {
    slug: 'solar-calculator-nigeria',
    title: 'Solar Calculator Nigeria: What Size System Do I Need?',
    excerpt: 'How system sizing actually works \u2014 the assumptions behind the calculator, and how to sanity-check the number it gives you.',
    readTime: '7 min read',
    date: 'September 2026',
    tag: 'Sizing',
    tagColor: 'bg-amber-50 text-amber-800 border-amber-200',
  },
];
