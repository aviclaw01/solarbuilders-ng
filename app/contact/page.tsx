import type { Metadata } from 'next';
import Navbar from '@/components/ui/Navbar';
import Footer from '@/components/ui/Footer';
import ContactClient from './ContactClient';

export const metadata: Metadata = {
  title: 'Contact Us & FAQ — SolarBuilders.ng',
  description: 'Get answers to common questions about SolarBuilders.ng or reach out to our team directly.',
  alternates: { canonical: 'https://solarbuildersng.com/contact' },
};

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <div className="max-w-3xl mx-auto px-4 py-12">
        <h1 className="font-heading font-extrabold text-[#0A0F1E] text-3xl md:text-4xl mb-2">
          Help & Contact
        </h1>
        <p className="text-[#64748B] text-lg mb-10">
          Find answers below, or send us a message.
        </p>

        <ContactClient />
      </div>

      <Footer />
    </div>
  );
}
