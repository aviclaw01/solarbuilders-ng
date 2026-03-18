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
  title: "SolarBuilders.ng — Nigeria's Verified Solar Marketplace",
  description:
    "Find trusted solar installers in Lagos, Abuja, and across Nigeria. Compare systems, calculate your exact needs, and connect directly on WhatsApp. Free solar calculator.",
  keywords: [
    "solar Nigeria", "solar installer Nigeria", "solar calculator Nigeria",
    "solar Lagos", "solar Abuja", "solar Port Harcourt",
    "buy solar panels Nigeria", "solar installation cost Nigeria",
    "verified solar installer", "best solar company Nigeria"
  ],
  openGraph: {
    title: "SolarBuilders.ng — Nigeria's Verified Solar Marketplace",
    description: "Calculate what you need. Find who you can trust. Nigeria's #1 solar marketplace.",
    url: "https://solarbuilders.ng",
    siteName: "SolarBuilders.ng",
    locale: "en_NG",
    type: "website",
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
      <body className="font-body antialiased">
        {children}
        <FloatingWhatsApp />
      </body>
    </html>
  );
}
