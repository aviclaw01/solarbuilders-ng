import Link from 'next/link';
import { Zap } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-[#0F172A] text-[#94A3B8] py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
          {/* Brand */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 bg-[#F59E0B] rounded-lg flex items-center justify-center">
                <Zap className="w-5 h-5 text-[#0F172A]" fill="currentColor" />
              </div>
              <span style={{fontFamily: "'Plus Jakarta Sans', sans-serif"}} className="font-bold text-lg text-white">
                SolarBuilders<span className="text-[#F59E0B]">.ng</span>
              </span>
            </div>
            <p className="text-sm text-[#64748B]">Nigeria&apos;s verified solar marketplace.</p>
          </div>

          {/* For Buyers */}
          <div>
            <h4 style={{fontFamily: "'Plus Jakarta Sans', sans-serif"}} className="text-white font-semibold mb-3 text-sm uppercase tracking-wide">For Buyers</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/calculator" className="hover:text-white transition-colors">Solar Calculator</Link></li>
              <li><Link href="/marketplace" className="hover:text-white transition-colors">Browse Builders</Link></li>
              <li><Link href="/marketplace" className="hover:text-white transition-colors">Post a Requirement</Link></li>
            </ul>
          </div>

          {/* For Builders */}
          <div>
            <h4 style={{fontFamily: "'Plus Jakarta Sans', sans-serif"}} className="text-white font-semibold mb-3 text-sm uppercase tracking-wide">For Builders</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/for-builders" className="hover:text-white transition-colors">List Your Business</Link></li>
              <li><Link href="/for-builders" className="hover:text-white transition-colors">Get Verified</Link></li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 style={{fontFamily: "'Plus Jakarta Sans', sans-serif"}} className="text-white font-semibold mb-3 text-sm uppercase tracking-wide">Company</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="https://www.nexprove.com" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">A Nexprove Product</a></li>
              <li><Link href="/marketplace" className="hover:text-white transition-colors">Browse All</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 pt-6 flex flex-col md:flex-row items-center justify-between gap-2">
          <p className="text-sm text-[#64748B]">
            A <a href="https://www.nexprove.com" className="text-[#F59E0B] hover:underline" target="_blank" rel="noopener noreferrer">Nexprove</a> product
          </p>
          <p className="text-sm text-[#64748B]">© 2026 SolarBuilders.ng. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
