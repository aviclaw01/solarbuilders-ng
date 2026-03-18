import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Inter } from 'next/font/google';
import "./globals.css";
import FloatingWhatsApp from '@/components/ui/FloatingWhatsApp';

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
    default: "SolarBuilders.ng — Nigeria's Verified Solar Marketplace",
    template: "%s | SolarBuilders.ng"
  },
  description:
    "Find trusted solar installers in Nigeria. Use our free calculator to size your system, compare verified builders, and go solar with confidence.",
  keywords: [
    "solar installers Nigeria",
    "solar calculator Nigeria",
    "solar panels Lagos",
    "buy solar Nigeria",
    "verified solar builders",
    "solar energy Nigeria 2026",
  ],
  openGraph: {
    title: "SolarBuilders.ng — Nigeria's Verified Solar Marketplace",
    description: "Find trusted solar installers across Nigeria. Free calculator, verified builders.",
    url: "https://solarbuilders.ng",
    siteName: "SolarBuilders.ng",
    locale: "en_NG",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "SolarBuilders.ng — Nigeria's Verified Solar Marketplace",
    description: "Find trusted solar installers across Nigeria. Free calculator, verified builders.",
  },
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: "https://solarbuilders.ng",
  },
};

const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "SolarBuilders.ng",
  "url": "https://solarbuilders.ng",
  "description": "Nigeria's verified solar marketplace — find trusted solar installers and calculate your system size",
  "potentialAction": {
    "@type": "SearchAction",
    "target": "https://solarbuilders.ng/marketplace?q={search_term_string}",
    "query-input": "required name=search_term_string"
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
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
        />
      </head>
      <body className={`${inter.variable} antialiased`} style={{ fontFamily: 'var(--font-body), sans-serif' }}>
        {children}
        <FloatingWhatsApp />
      </body>
    </html>
  );
}
