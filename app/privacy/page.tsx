import type { Metadata } from 'next';
import Link from 'next/link';
import Navbar from '@/components/ui/Navbar';
import Footer from '@/components/ui/Footer';
import { CONTACT_WHATSAPP } from '@/lib/site';

/**
 * Privacy notice under the Nigeria Data Protection Act 2023 (NDPA) and the
 * NDPC's General Application and Implementation Directive (GAID 2025).
 *
 * Every data point listed here is one the code actually collects — check
 * supabase/*.sql, app/api/* and the consent-gated tags in components/ui
 * before adding or removing a line. If a new form or tag starts collecting
 * something, this page changes in the same PR.
 */

export const metadata: Metadata = {
  title: 'Privacy Notice | SolarBuilders.ng',
  description: 'What personal data SolarBuilders.ng collects, why, who we share it with, how long we keep it and your rights under the Nigeria Data Protection Act 2023.',
  alternates: { canonical: 'https://solarbuildersng.com/privacy' },
};

const UPDATED = '14 October 2026';
const EMAIL = 'hello@solarbuildersng.com';

const SECTIONS: { h: string; body: React.ReactNode }[] = [
  {
    h: 'Who we are',
    body: (
      <p>
        SolarBuilders.ng is operated by Nexprove, 11 Mogbonjubola St, Gbagada, Lagos, Nigeria. We are the data
        controller for the personal data described here. Contact us about your data at{' '}
        <a href={`mailto:${EMAIL}`}>{EMAIL}</a> or on WhatsApp at +{CONTACT_WHATSAPP}.
      </p>
    ),
  },
  {
    h: 'What we collect',
    body: (
      <ul>
        <li>
          <strong>When you ask for a quote, place an order request or contact us:</strong> your name, phone number,
          email, location, any note you write, and the quote or items you chose.
        </li>
        <li>
          <strong>When you apply as an installer, vendor or partner:</strong> business and contact details, CAC
          number and documents, past installations and references, warranty terms, and the bank account we pay you
          through.
        </li>
        <li>
          <strong>When you use the site:</strong> the pages you open, the site that sent you, campaign tags in the
          link, and actions such as building a quote or adding an item to an order. We do not store your IP address
          with these events.
        </li>
        <li>
          <strong>On your device:</strong> your cookie choice and your calculator and cart contents, kept in your
          browser&apos;s local storage so you don&apos;t lose them. They are not sent to us until you submit a form.
        </li>
      </ul>
    ),
  },
  {
    h: 'Why we use it, and on what basis',
    body: (
      <ul>
        <li>
          <strong>To give you a quote, source your equipment and arrange installation</strong> — needed to do what
          you asked us to do (contract).
        </li>
        <li>
          <strong>To vet partners and pay them</strong> — needed for the partner agreement (contract), and to
          keep buyers safe (legitimate interest).
        </li>
        <li>
          <strong>To understand which pages help people and fix what doesn&apos;t</strong> — first-party page and
          action counts (legitimate interest).
        </li>
        <li>
          <strong>Google Analytics and Meta Pixel</strong> — only if you click Accept on the cookie card (consent).
          Choose &ldquo;No thanks&rdquo; and they never load.
        </li>
        <li>
          <strong>To keep records the law requires</strong>, such as tax and accounting records (legal obligation).
        </li>
      </ul>
    ),
  },
  {
    h: 'Who we share it with',
    body: (
      <>
        <p>We do not sell your data. We share only what each party needs:</p>
        <ul>
          <li>
            <strong>The installer we assign to your job</strong> — your name, phone, location and the system you
            ordered, so they can survey and install.
          </li>
          <li>
            <strong>Suppliers</strong> — the items and delivery location for your order. We do not give suppliers
            your contact details unless delivery needs them.
          </li>
          <li>
            <strong>Service providers who run the site for us:</strong> Vercel (hosting), Supabase (database), Resend
            (email), and — only with your consent — Google (Analytics) and Meta (Pixel).
          </li>
          <li>Authorities, when the law requires it.</li>
        </ul>
      </>
    ),
  },
  {
    h: 'Data stored outside Nigeria',
    body: (
      <p>
        Our hosting, database and email providers store data on servers outside Nigeria. We use them under contracts
        that require them to protect it, as section 41 and 43 of the NDPA require for transfers abroad.
      </p>
    ),
  },
  {
    h: 'How long we keep it',
    body: (
      <ul>
        <li>Quote and order requests that never go ahead: up to 24 months from our last contact with you.</li>
        <li>Completed orders and partner payments: as long as tax and accounting law requires.</li>
        <li>Rejected partner applications: up to 12 months. Reference phone numbers are removed once we have called them.</li>
        <li>Site events: up to 24 months.</li>
      </ul>
    ),
  },
  {
    h: 'Your rights',
    body: (
      <>
        <p>Under the NDPA you can ask us to:</p>
        <ul>
          <li>tell you what data we hold about you and give you a copy;</li>
          <li>correct it, or delete it where we no longer need it;</li>
          <li>stop or limit how we use it, or object to it;</li>
          <li>send it to you or another company in a common format;</li>
          <li>withdraw consent — for analytics, clear your browser&apos;s site data and pick again.</li>
        </ul>
        <p>
          Email <a href={`mailto:${EMAIL}`}>{EMAIL}</a>. We reply within 30 days. If you are unhappy with our answer,
          you can complain to the Nigeria Data Protection Commission (
          <a href="https://ndpc.gov.ng" rel="noopener noreferrer" target="_blank">ndpc.gov.ng</a>).
        </p>
      </>
    ),
  },
  {
    h: 'Security',
    body: (
      <p>
        Data is encrypted in transit, our admin area is password-protected, and partner portal links use hashed
        tokens. If a breach puts your data at risk, we will tell the NDPC within 72 hours and tell you
        without delay.
      </p>
    ),
  },
  {
    h: 'Children',
    body: <p>The site is not meant for anyone under 18, and we do not knowingly collect their data.</p>,
  },
  {
    h: 'Changes',
    body: <p>If we change this notice we update the date at the top. Big changes will be shown on the site.</p>,
  },
];

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <main className="px-4 sm:px-6 py-16 md:py-24">
        <article className="max-w-2xl mx-auto">
          <h1 className="font-heading font-extrabold text-ink text-title">Privacy notice</h1>
          <p className="text-muted mt-3">Last updated {UPDATED}</p>
          <div className="mt-10 space-y-10 text-ink-soft leading-relaxed [&_a]:text-ink [&_a]:underline [&_a]:underline-offset-2 [&_li]:mt-2 [&_p+p]:mt-3 [&_p+ul]:mt-3 [&_ul+p]:mt-3 [&_ul]:list-disc [&_ul]:pl-5 [&_strong]:text-ink">
            {SECTIONS.map((s) => (
              <section key={s.h}>
                <h2 className="font-heading font-bold text-ink text-xl mb-3">{s.h}</h2>
                {s.body}
              </section>
            ))}
          </div>
          <p className="mt-12 text-sm text-muted">
            Questions? <Link href="/contact">Contact us</Link>.
          </p>
        </article>
      </main>
      <Footer />
    </div>
  );
}
