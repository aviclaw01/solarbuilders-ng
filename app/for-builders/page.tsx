import type { Metadata } from 'next';
import WorkWithUsClient from './WorkWithUsClient';

export const metadata: Metadata = {
  title: 'Work With Us — Solar Installers & Vendors | SolarBuilders.ng',
  description:
    'Installers: get customer jobs that arrive with an itemised bill of materials, a confirmed budget and the equipment already sourced. Vendors and distributors: list your catalogue and prices on SolarBuilders.ng for free.',
  keywords: ['solar installer jobs Nigeria', 'solar vendor listing Nigeria', 'solar distributor Nigeria', 'work with SolarBuilders.ng'],
  openGraph: {
    title: 'Work With Us — Installers & Vendors | SolarBuilders.ng',
    description: 'We bring the customer, the itemised quote and the equipment. Installers do the install; vendors get their prices listed free.',
    url: 'https://solarbuildersng.com/for-builders',
    type: 'website',
  },
  alternates: { canonical: 'https://solarbuildersng.com/for-builders' },
};

export default function ForBuildersPage() {
  return <WorkWithUsClient />;
}
