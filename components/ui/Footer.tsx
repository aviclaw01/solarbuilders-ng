import Link from 'next/link';
import Logo from '@/components/ui/Logo';

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
          </div>

          {/* For Buyers */}
          <div>
            <h4 className="font-heading text-white font-semibold mb-4 text-sm">For Buyers</h4>
            <ul className="space-y-3 text-sm">
              <li><Link href="/calculator" className="hover:text-white transition-colors">Size My System</Link></li>
              <li><Link href="/marketplace" className="hover:text-white transition-colors">Find Builders</Link></li>
              <li><Link href="/how-it-works" className="hover:text-white transition-colors">How It Works</Link></li>
              <li><Link href="/blog" className="hover:text-white transition-colors">Solar Guides</Link></li>
            </ul>
          </div>

          {/* For Builders */}
          <div>
            <h4 className="font-heading text-white font-semibold mb-4 text-sm">For Builders</h4>
            <ul className="space-y-3 text-sm">
              <li><Link href="/for-builders" className="hover:text-white transition-colors">List Your Company</Link></li>
              <li><Link href="/verified" className="hover:text-white transition-colors">Get Verified</Link></li>
              <li><Link href="/for-builders#how" className="hover:text-white transition-colors">How Verification Works</Link></li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="font-heading text-white font-semibold mb-4 text-sm">Company</h4>
            <ul className="space-y-3 text-sm">
              <li><Link href="/about" className="hover:text-white transition-colors">Our Story</Link></li>
              <li><Link href="/contact" className="hover:text-white transition-colors">Contact</Link></li>
              <li>
                <a href="https://wa.me/2349168394923" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
                  WhatsApp
                </a>
              </li>
              <li>
                <a href="https://www.nexprove.com" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
                  Built by Nexprove
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 pt-6 flex flex-col md:flex-row items-center justify-between gap-2">
          <p className="text-sm text-slate-500">
            © 2026 SolarBuilders.ng · Powered by{' '}
            <a href="https://www.nexprove.com" className="text-amber-400 hover:underline" target="_blank" rel="noopener noreferrer">
              Nexprove
            </a>
          </p>
          <p className="text-sm text-slate-600">Nigeria&apos;s Verified Solar Marketplace</p>
        </div>
      </div>
    </footer>
  );
}
