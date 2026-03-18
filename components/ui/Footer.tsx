import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-[#0A0F1E] text-[#94A3B8] py-16 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8 mb-12">
          {/* Brand */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-1.5 mb-4">
              <span className="text-[#F59E0B] text-xl">⚡</span>
              <span className="font-heading font-bold text-lg text-white">
                SolarBuilders<span className="text-[#F59E0B]">.ng</span>
              </span>
            </div>
            <p className="text-sm text-[#64748B] leading-relaxed">Nigeria&apos;s verified solar marketplace. Find who you can trust.</p>
          </div>

          {/* Product */}
          <div>
            <h4 className="font-heading text-white font-semibold mb-4 text-sm">Product</h4>
            <ul className="space-y-3 text-sm">
              <li><Link href="/calculator" className="hover:text-white transition-colors">Calculator</Link></li>
              <li><Link href="/marketplace" className="hover:text-white transition-colors">Marketplace</Link></li>
              <li><Link href="/blog" className="hover:text-white transition-colors">Blog</Link></li>
              <li><Link href="/about" className="hover:text-white transition-colors">About</Link></li>
            </ul>
          </div>

          {/* For Builders */}
          <div>
            <h4 className="font-heading text-white font-semibold mb-4 text-sm">For Builders</h4>
            <ul className="space-y-3 text-sm">
              <li><Link href="/for-builders" className="hover:text-white transition-colors">List Free</Link></li>
              <li><Link href="/for-builders#verified" className="hover:text-white transition-colors">Verified Badge</Link></li>
              <li><Link href="/for-builders#how" className="hover:text-white transition-colors">How it Works</Link></li>
            </ul>
          </div>

          {/* Cities */}
          <div>
            <h4 className="font-heading text-white font-semibold mb-4 text-sm">Cities</h4>
            <ul className="space-y-3 text-sm">
              <li><Link href="/solar/lagos" className="hover:text-white transition-colors">Lagos</Link></li>
              <li><Link href="/solar/abuja" className="hover:text-white transition-colors">Abuja</Link></li>
              <li><Link href="/solar/port-harcourt" className="hover:text-white transition-colors">Port Harcourt</Link></li>
              <li><Link href="/marketplace" className="hover:text-white transition-colors">All Cities</Link></li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="font-heading text-white font-semibold mb-4 text-sm">Company</h4>
            <ul className="space-y-3 text-sm">
              <li><Link href="/about" className="hover:text-white transition-colors">About</Link></li>
              <li><a href="https://wa.me/2349168394923" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Contact</a></li>
              <li><a href="https://www.nexprove.com" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Nexprove</a></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 pt-6 flex flex-col md:flex-row items-center justify-between gap-2">
          <p className="text-sm text-[#64748B]">© 2026 SolarBuilders.ng · Powered by <a href="https://www.nexprove.com" className="text-[#F59E0B] hover:underline" target="_blank" rel="noopener noreferrer">Nexprove</a></p>
          <div className="flex gap-4 text-sm text-[#64748B]">
            <span>Nigeria&apos;s Verified Solar Marketplace</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
