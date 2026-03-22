import Link from 'next/link';
import Logo from '@/components/ui/Logo';
import { Phone, MapPin } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-400 py-16 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <Logo variant="horizontal" size="md" colorMode="dark" />
            </div>
            <p className="text-sm text-slate-500 leading-relaxed mb-4">
              Nigeria&apos;s verified solar marketplace. Find who you can trust.
            </p>
            {/* Physical address */}
            <address className="not-italic text-sm text-slate-500 leading-relaxed mb-3">
              <span className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                <span>
                  11 Mogbonjubola St,<br />
                  Gbagada, Lagos,<br />
                  Nigeria
                </span>
              </span>
            </address>
            <a
              href="tel:+2349168394923"
              className="flex items-center gap-2 text-sm text-slate-400 hover:text-amber-400 transition-colors min-h-[44px]"
              aria-label="Call us"
            >
              <Phone className="w-4 h-4 text-amber-400 flex-shrink-0" />
              +234 916 839 4923
            </a>
          </div>

          {/* For Buyers */}
          <div>
            <h4 className="font-heading text-white font-semibold mb-4 text-sm">For Buyers</h4>
            <ul className="space-y-3 text-sm">
              <li><Link href="/calculator" className="hover:text-white transition-colors underline-offset-4 hover:underline min-h-[44px] flex items-center">Size My System</Link></li>
              <li><Link href="/marketplace" className="hover:text-white transition-colors underline-offset-4 hover:underline min-h-[44px] flex items-center">Find Builders</Link></li>
              <li><Link href="/how-it-works" className="hover:text-white transition-colors underline-offset-4 hover:underline min-h-[44px] flex items-center">How It Works</Link></li>
              <li><Link href="/blog" className="hover:text-white transition-colors underline-offset-4 hover:underline min-h-[44px] flex items-center">Solar Guides</Link></li>
            </ul>
          </div>

          {/* For Builders */}
          <div>
            <h4 className="font-heading text-white font-semibold mb-4 text-sm">For Builders</h4>
            <ul className="space-y-3 text-sm">
              <li><Link href="/for-builders" className="hover:text-white transition-colors underline-offset-4 hover:underline min-h-[44px] flex items-center">List Your Company</Link></li>
              <li><Link href="/verified" className="hover:text-white transition-colors underline-offset-4 hover:underline min-h-[44px] flex items-center">Get Verified</Link></li>
              <li><Link href="/for-builders#how" className="hover:text-white transition-colors underline-offset-4 hover:underline min-h-[44px] flex items-center">How Verification Works</Link></li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="font-heading text-white font-semibold mb-4 text-sm">Company</h4>
            <ul className="space-y-3 text-sm">
              <li><Link href="/about" className="hover:text-white transition-colors underline-offset-4 hover:underline min-h-[44px] flex items-center">Our Story</Link></li>
              <li><Link href="/contact" className="hover:text-white transition-colors underline-offset-4 hover:underline min-h-[44px] flex items-center">Contact</Link></li>
              <li>
                <a href="https://wa.me/2349168394923" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors underline-offset-4 hover:underline min-h-[44px] flex items-center">
                  WhatsApp
                </a>
              </li>
              <li>
                <a href="https://www.nexprove.com" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors underline-offset-4 hover:underline min-h-[44px] flex items-center">
                  Built by Nexprove
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 pt-6 flex flex-col md:flex-row items-center justify-between gap-2">
          <p className="text-sm text-slate-500">
            © 2026 SolarBuilders.ng · Powered by{' '}
            <a href="https://www.nexprove.com" className="text-amber-400 hover:underline underline-offset-4" target="_blank" rel="noopener noreferrer">
              Nexprove
            </a>
          </p>
          <p className="text-sm text-slate-600">Nigeria&apos;s Verified Solar Marketplace</p>
        </div>
      </div>
    </footer>
  );
}
