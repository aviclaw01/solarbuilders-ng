import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Inter } from 'next/font/google';
import "./globals.css";
import PublicChrome from '@/components/ui/PublicChrome';
import GoogleAnalytics from '@/components/ui/GoogleAnalytics';

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-heading',
  weight: ['400', '500', '600', '700', '800'],
  display: 'swap',
});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: "SolarBuilders.ng — Real Solar Prices & Quotes for Nigeria",
    template: "%s | SolarBuilders.ng"
  },
  description:
    "Size your solar system, get an itemised quote at real September 2026 Nigerian prices, and let us source the equipment and get it installed.",
  keywords: [
    "solar installers Nigeria",
    "solar calculator Nigeria",
    "solar panels Lagos",
    "buy solar Nigeria",
    "verified solar builders",
    "solar energy Nigeria 2026",
  ],
  icons: {
    icon: [
      { url: '/favicon.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-16.png', sizes: '16x16', type: 'image/png' },
      { url: '/brand/favicon.svg', type: 'image/svg+xml' },
    ],
    apple: '/brand/apple-touch-icon.png',
  },
  openGraph: {
    title: "SolarBuilders.ng — Real Solar Prices & Quotes for Nigeria",
    description: "Real solar prices for Nigeria. Size it, quote it, we build it.",
    url: "https://solarbuildersng.com",
    siteName: "SolarBuilders.ng",
    locale: "en_NG",
    type: "website",
    images: [
      {
        url: '/brand/og-image.png',
        width: 1200,
        height: 630,
        alt: "SolarBuilders.ng — Real Solar Prices & Quotes for Nigeria",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "SolarBuilders.ng — Real Solar Prices & Quotes for Nigeria",
    description: "Real solar prices for Nigeria. Size it, quote it, we build it.",
    images: ['/brand/twitter-card.png'],
  },
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: "https://solarbuildersng.com",
  },
};

const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "SolarBuilders.ng",
  "url": "https://solarbuildersng.com",
  "description": "Size your solar system, get an itemised quote at real Nigerian prices, and let us get it built",
  "potentialAction": {
    "@type": "SearchAction",
    "target": "https://solarbuildersng.com/brands?q={search_term_string}",
    "query-input": "required name=search_term_string"
  }
};

const localBusinessSchema = {
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "additionalType": "https://schema.org/SolarEnergyCompany",
  "name": "SolarBuilders.ng",
  "url": "https://solarbuildersng.com",
  "telephone": "+2349168394923",
  "image": "https://solarbuildersng.com/brand/og-image.png",
  "description": "Real solar equipment prices for Nigeria, an itemised quote calculator, and a team that gets your system built.",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "11 Mogbonjubola St",
    "addressLocality": "Gbagada",
    "addressRegion": "Lagos",
    "addressCountry": "NG",
    "postalCode": "100234"
  },
  "geo": {
    "@type": "GeoCoordinates",
    "latitude": 6.5538,
    "longitude": 3.3924
  },
  "areaServed": {
    "@type": "Country",
    "name": "Nigeria"
  },
  "openingHoursSpecification": {
    "@type": "OpeningHoursSpecification",
    "dayOfWeek": ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"],
    "opens": "08:00",
    "closes": "18:00"
  },
  "sameAs": [
    "https://wa.me/2349168394923"
  ]
};

const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "SolarBuilders.ng",
  "url": "https://solarbuildersng.com",
  "telephone": "+2349168394923",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "11 Mogbonjubola St",
    "addressLocality": "Gbagada",
    "addressRegion": "Lagos",
    "addressCountry": "NG"
  },
  "logo": "https://solarbuildersng.com/brand/og-image.png",
  "contactPoint": {
    "@type": "ContactPoint",
    "telephone": "+2349168394923",
    "contactType": "customer service",
    "areaServed": "NG",
    "availableLanguage": "English"
  }
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${plusJakarta.variable} ${inter.variable}`}>
      <head>
        <link rel="icon" href="/favicon.png" sizes="32x32" />
        <link rel="icon" href="/brand/favicon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/brand/apple-touch-icon.png" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
      </head>
      <body className={`${inter.variable} antialiased`} style={{ fontFamily: 'var(--font-body), sans-serif' }}>
        <GoogleAnalytics />
        {children}
        <PublicChrome />
      </body>
    </html>
  );
}
