import type { Metadata } from 'next';
import Navbar from '@/components/ui/Navbar';
import Footer from '@/components/ui/Footer';
import CalculatorClient from './CalculatorClient';
import { PRICES_LAST_UPDATED_LABEL } from '@/lib/prices';

export const metadata: Metadata = {
  title: 'Solar System Size Calculator for Nigeria — Free, No Sign-up',
  description: `Tick the appliances you run and get the inverter, battery and panel count your home needs, itemised and priced at real Nigerian rates from ${PRICES_LAST_UPDATED_LABEL}. Free, no sign-up, download the quote as a PDF.`,
  keywords: [
    'solar calculator Nigeria',
    'what size inverter do I need',
    'solar system size calculator',
    'how many solar panels do I need Nigeria',
  ],
  openGraph: {
    title: 'Solar System Size Calculator for Nigeria | SolarBuilders.ng',
    description: 'Size your system in two minutes and get an itemised quote at real Nigerian prices.',
    url: 'https://solarbuildersng.com/calculator',
    type: 'website',
  },
  alternates: { canonical: 'https://solarbuildersng.com/calculator' },
};

export default function CalculatorPage() {
  return <CalculatorClient navbar={<Navbar />} footer={<Footer />} />;
}
