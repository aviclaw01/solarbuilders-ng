import type { Metadata } from 'next';
import WorkWithUsClient from './WorkWithUsClient';
import Navbar from '@/components/ui/Navbar';
import Footer from '@/components/ui/Footer';

export const metadata: Metadata = {
  title: 'Work With Us — Solar Installers, Vendors & Manufacturers | SolarBuilders.ng',
  description:
    'Installers: customer jobs that arrive with an itemised bill of materials, a confirmed budget and the equipment already bought. Vendors: your catalogue and prices listed free. Manufacturers and distributors: give us trade pricing and we will quote your product to buyers who already know what they need.',
  keywords: ['solar installer jobs Nigeria', 'solar vendor listing Nigeria', 'solar distributor Nigeria', 'solar manufacturer Nigeria distribution', 'work with SolarBuilders.ng'],
  openGraph: {
    title: 'Work With Us — Installers, Vendors & Manufacturers | SolarBuilders.ng',
    description: 'We bring the demand: buyers arrive with an itemised spec and a budget. Installers fit it, vendors get listed free, manufacturers and distributors supply it on trade terms.',
    url: 'https://solarbuildersng.com/for-builders',
    type: 'website',
  },
  alternates: { canonical: 'https://solarbuildersng.com/for-builders' },
};

export default function ForBuildersPage() {
  return <WorkWithUsClient navbar={<Navbar />} footer={<Footer />} />;
}
