import type { Metadata } from 'next';
import FindClient from './FindClient';

export const metadata: Metadata = {
  title: { absolute: 'Find my solar kit in 3 taps | SolarBuilders.ng' },
  description:
    'Tap who it is for and how long light is off. Get a matched solar kit — inverter, battery and panels — priced at real Nigerian rates. No forms, no sign-up.',
  openGraph: {
    title: 'Find my solar kit in 3 taps | SolarBuilders.ng',
    description: 'Two taps, one matched solar kit, priced at real Nigerian rates.',
    url: 'https://solarbuildersng.com/find',
    type: 'website',
  },
  alternates: { canonical: 'https://solarbuildersng.com/find' },
};

/** Full-screen flow: no site navbar or footer on purpose — one decision per screen. */
export default function FindPage() {
  return <FindClient />;
}
