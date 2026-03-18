import type { Metadata } from 'next';
import MarketplaceClient from './MarketplaceClient';

export const metadata: Metadata = {
  title: 'Find Solar Installers in Nigeria — SolarBuilders.ng',
  description: 'Browse verified solar installation companies across Nigeria. Filter by location, service type, and budget. Lagos, Abuja, Port Harcourt and 25+ more cities.',
  keywords: ['solar installer Nigeria', 'solar company Lagos', 'solar installation Abuja', 'verified solar builder Nigeria'],
  openGraph: {
    title: 'Find Solar Installers in Nigeria — SolarBuilders.ng',
    description: 'Browse 200+ verified solar builders across 28 Nigerian states.',
    url: 'https://solarbuilders.ng/marketplace',
    type: 'website',
  },
  alternates: { canonical: 'https://solarbuilders.ng/marketplace' },
};

export default function MarketplacePage() {
  return <MarketplaceClient />;
}
