export interface Builder {
  id: string;
  slug: string;
  name: string;
  location: string;
  state: string;
  rating: number;
  reviewCount: number;
  startingPrice: number;
  services: string[];
  whatsapp: string;
  verified: boolean;
  bio: string;
  jobsCompleted: number;
  yearFounded: number;
  responseTime: string;
  coverImage: string;
  specialties: string[];
  packages: Package[];
  reviews: Review[];
}

export interface Package {
  name: string;
  kva: number;
  description: string;
  price: number;
}

export interface Review {
  author: string;
  location: string;
  rating: number;
  body: string;
  date: string;
  verified: boolean;
}

// NOTE: Prices updated April 2026 to reflect real 2025 Lagos market rates.
// Previous prices were placeholder/underestimated by 3-5x.
// Sources: Jiji listings, Kasot Power, Phoz Energy, computervillagemart.com.ng
export const BUILDERS: Builder[] = [
  {
    id: '1',
    slug: 'suntech-installs',
    name: 'SunTech Installs',
    location: 'Lagos Island',
    state: 'Lagos',
    rating: 4.9,
    reviewCount: 41,
    startingPrice: 1800000,
    services: ['Full Installation', 'System Design', 'Residential', 'Off-grid', 'Hybrid'],
    whatsapp: '+2348012345678',
    verified: true,
    bio: 'Lagos-based solar installer since 2018. 60+ completed projects across Lagos Island, Victoria Island, and Lekki. Specialists in residential off-grid and hybrid systems. Every installation comes with a 2-year workmanship warranty.',
    jobsCompleted: 63,
    yearFounded: 2018,
    responseTime: '< 2 hours',
    coverImage: 'https://images.unsplash.com/photo-1509391366360-2e959784a276?w=800&auto=format&fit=crop',
    specialties: ['Off-grid Systems', 'Hybrid Solar', 'Battery Backup', 'Residential'],
    packages: [
      {
        name: '3kVA Starter Package',
        kva: 3,
        description: '3kVA hybrid inverter + 2× 200Ah lithium batteries + 4× 400W panels + full installation. Powers lights, fans, TV, fridge — no AC.',
        price: 1800000,
      },
      {
        name: '5kVA Home Package',
        kva: 5,
        description: '5kVA hybrid inverter + 4× 200Ah lithium batteries + 8× 400W panels + full installation. Handles 1 standard AC unit.',
        price: 3200000,
      },
      {
        name: '10kVA Premium',
        kva: 10,
        description: 'Full home solution. 10kVA hybrid inverter + 8× 200Ah lithium batteries + 12× 400W panels + full installation. Multiple ACs, all appliances.',
        price: 5800000,
      },
    ],
    reviews: [
      {
        author: 'Tunde A.',
        location: 'Lagos Island',
        rating: 5,
        body: 'Best decision I ever made. Installation was clean and professional. My generator has been off since August 2025. These guys really know what they\'re doing.',
        date: 'January 2026',
        verified: true,
      },
      {
        author: 'Chidinma O.',
        location: 'Victoria Island',
        rating: 5,
        body: 'Commissioned from London for my parents\' house. SunTech was incredibly professional — kept me in the loop via WhatsApp throughout. Parents love it.',
        date: 'December 2025',
        verified: true,
      },
      {
        author: 'Emeka F.',
        location: 'Lekki Phase 1',
        rating: 5,
        body: 'Very thorough site survey before installation. Showed up on time, finished in 2 days. 5kVA system running everything including AC. No complaints.',
        date: 'November 2025',
        verified: true,
      },
    ],
  },
  {
    id: '2',
    slug: 'greenwatt-nigeria',
    name: 'GreenWatt Nigeria',
    location: 'Wuse 2',
    state: 'Abuja',
    rating: 4.7,
    reviewCount: 28,
    startingPrice: 2500000,
    services: ['Full Installation', 'Commercial', 'Hybrid', '3-phase Systems'],
    whatsapp: '+2348023456789',
    verified: true,
    bio: 'Abuja\'s leading commercial solar installer. Specializing in hybrid and 3-phase systems for businesses, schools, and large residences. 40+ commercial projects delivered since 2019.',
    jobsCompleted: 47,
    yearFounded: 2019,
    responseTime: '< 3 hours',
    coverImage: 'https://images.unsplash.com/photo-1508193638397-1c4234db14d8?w=800&auto=format&fit=crop',
    specialties: ['Commercial Solar', '3-Phase Systems', 'Hybrid Systems', 'Business Solutions'],
    packages: [
      {
        name: '5kVA Business Starter',
        kva: 5,
        description: 'For small offices. 5kVA hybrid inverter + 4× 200Ah batteries + 8× 400W panels + full installation. Handles AC, computers, CCTV.',
        price: 2500000,
      },
      {
        name: '15kVA Commercial',
        kva: 15,
        description: 'For medium businesses. 3-phase 15kVA hybrid system + 12× 200Ah batteries + 20× 400W panels + full installation.',
        price: 7500000,
      },
    ],
    reviews: [
      {
        author: 'Adaeze M.',
        location: 'Wuse 2, Abuja',
        rating: 5,
        body: 'Installed a 15kVA system for our office. Professional from start to finish. Generator bills dropped from ₦180k/month to basically zero.',
        date: 'February 2026',
        verified: true,
      },
      {
        author: 'Ibrahim K.',
        location: 'Garki, Abuja',
        rating: 4,
        body: 'Good work overall. Slight delay on the batteries arriving but they kept us informed. Final result is excellent.',
        date: 'January 2026',
        verified: true,
      },
    ],
  },
  {
    id: '3',
    slug: 'poweredge-solar',
    name: 'PowerEdge Solar',
    location: 'GRA',
    state: 'Port Harcourt',
    rating: 4.6,
    reviewCount: 19,
    startingPrice: 1500000,
    services: ['Full Installation', 'Residential', 'Off-grid', 'Repair & Maintenance'],
    whatsapp: '+2348034567890',
    verified: true,
    bio: 'Port Harcourt\'s trusted solar installer. 5 years of experience with residential and off-grid systems across Rivers State. Best prices in PH with no compromise on quality.',
    jobsCompleted: 34,
    yearFounded: 2020,
    responseTime: '< 4 hours',
    coverImage: 'https://images.unsplash.com/photo-1497440001374-f26997328c1b?w=800&auto=format&fit=crop',
    specialties: ['Residential Solar', 'Off-grid Systems', 'System Repair', 'Budget-friendly'],
    packages: [
      {
        name: '2kVA Essentials',
        kva: 2,
        description: 'Home backup for lights, fans, TV, fridge. 2kVA inverter + 2× 200Ah batteries + 4× 300W panels + full installation.',
        price: 1500000,
      },
      {
        name: '5kVA Complete',
        kva: 5,
        description: 'Full home solution including 1 AC unit. 5kVA hybrid inverter + 4× 200Ah batteries + 8× 400W panels + full installation.',
        price: 3000000,
      },
    ],
    reviews: [
      {
        author: 'Blessing N.',
        location: 'GRA Port Harcourt',
        rating: 5,
        body: 'Very honest about what I needed. Didn\'t try to oversell me. Installed a 3kVA system that perfectly handles our needs. Great value.',
        date: 'March 2026',
        verified: true,
      },
      {
        author: 'Chukwudi E.',
        location: 'Trans-Amadi',
        rating: 4,
        body: 'Solid work. Came for a repair on my old system, fixed it same day and explained what went wrong. Will definitely use for my new installation.',
        date: 'February 2026',
        verified: false,
      },
    ],
  },
  {
    id: '4',
    slug: 'solarkingng',
    name: 'SolarKing NG',
    location: 'Ikeja',
    state: 'Lagos',
    rating: 4.8,
    reviewCount: 33,
    startingPrice: 1950000,
    services: ['Full Installation', 'Residential', 'Commercial', 'System Design'],
    whatsapp: '+2348045678901',
    verified: true,
    bio: 'Ikeja-based solar specialists serving all of Lagos. 5+ years, 50+ completed installations. We size systems correctly the first time — no surprises after installation.',
    jobsCompleted: 52,
    yearFounded: 2020,
    responseTime: '< 2 hours',
    coverImage: 'https://images.unsplash.com/photo-1611365892117-bce3e297ca38?w=800&auto=format&fit=crop',
    specialties: ['Residential Solar', 'Commercial Projects', 'System Sizing', 'Lagos-wide'],
    packages: [
      {
        name: '3.5kVA Standard',
        kva: 3.5,
        description: 'Most popular Lagos package. 3.5kVA hybrid inverter + 4× 200Ah batteries + 6× 400W panels + full installation.',
        price: 1950000,
      },
      {
        name: '5kVA Plus',
        kva: 5,
        description: 'For medium-large homes with AC. 5kVA hybrid inverter + 6× 200Ah batteries + 8× 400W panels + 2-year warranty.',
        price: 3500000,
      },
    ],
    reviews: [
      {
        author: 'Funmi A.',
        location: 'Ikeja GRA',
        rating: 5,
        body: 'They came, surveyed, gave me an honest quote. No hidden charges. Installation was spotless. 8 months in — zero issues.',
        date: 'January 2026',
        verified: true,
      },
      {
        author: 'Seun B.',
        location: 'Maryland, Lagos',
        rating: 5,
        body: 'Used them for both my home and my office. Professional each time. They even came back 3 months later to check everything was optimal at no charge.',
        date: 'December 2025',
        verified: true,
      },
    ],
  },
  {
    id: '5',
    slug: 'ecowatts-abuja',
    name: 'EcoWatts Abuja',
    location: 'Gwarinpa',
    state: 'Abuja',
    rating: 4.5,
    reviewCount: 15,
    startingPrice: 2200000,
    services: ['Full Installation', 'Off-grid', 'Hybrid', 'System Design'],
    whatsapp: '+2348056789012',
    verified: true,
    bio: 'Abuja-based solar company focused on off-grid and hybrid solutions for homes and small businesses in Gwarinpa, Kubwa, and surrounding areas.',
    jobsCompleted: 22,
    yearFounded: 2021,
    responseTime: '< 5 hours',
    coverImage: 'https://images.unsplash.com/photo-1548612747-4e1f03e25a01?w=800&auto=format&fit=crop',
    specialties: ['Off-grid Systems', 'Hybrid Solar', 'Abuja Coverage', 'SME Solutions'],
    packages: [
      {
        name: '5kVA Hybrid',
        kva: 5,
        description: 'Hybrid system that works with grid when available. Ideal for Abuja. 5kVA hybrid inverter + 4× 200Ah lithium batteries + 8× 400W panels + installation.',
        price: 2200000,
      },
    ],
    reviews: [
      {
        author: 'Musa D.',
        location: 'Gwarinpa, Abuja',
        rating: 5,
        body: 'Good honest company. Hybrid system working perfectly. When NEPA comes, it tops up the batteries. When it goes, seamless switch.',
        date: 'February 2026',
        verified: true,
      },
      {
        author: 'Grace O.',
        location: 'Kubwa, Abuja',
        rating: 4,
        body: 'Solid work. Took a bit longer than expected but they explained the battery delivery delay. Happy with the final result.',
        date: 'January 2026',
        verified: false,
      },
    ],
  },
];

export function getBuilderBySlug(slug: string): Builder | undefined {
  return BUILDERS.find(b => b.slug === slug);
}

export function formatNaira(amount: number): string {
  if (amount >= 1000000) {
    return `₦${(amount / 1000000).toFixed(1)}M`;
  }
  return `₦${(amount / 1000).toFixed(0)}k`;
}

export function formatNairaFull(amount: number): string {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function getWhatsAppLink(phone: string, builderName: string): string {
  const number = phone.replace(/\D/g, '');
  const text = encodeURIComponent(`Hi, I found you on SolarBuilders.ng. I'm interested in a solar installation quote. Can you help?`);
  return `https://wa.me/${number}?text=${text}`;
}
