import Link from 'next/link';
import Navbar from '@/components/ui/Navbar';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#FAFAF7]">
      <Navbar />
      <div className="max-w-lg mx-auto px-4 py-24 text-center">
        <div className="text-7xl mb-6">⚡</div>
        <h1 style={{fontFamily: "'Plus Jakarta Sans', sans-serif"}} className="text-3xl font-extrabold text-[#0F172A] mb-3">
          Hmm. This page doesn&apos;t exist.
        </h1>
        <p className="text-[#64748B] text-lg italic mb-8">(Yet. We&apos;re building fast.)</p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/calculator"
            className="bg-[#F59E0B] text-[#0F172A] px-6 py-3 rounded-lg font-bold hover:bg-[#D97706] transition-colors"
            style={{fontFamily: "'Plus Jakarta Sans', sans-serif"}}>
            ⚡ Go to Calculator →
          </Link>
          <Link href="/marketplace"
            className="text-[#F59E0B] font-semibold py-3 px-6 hover:underline">
            Browse the marketplace →
          </Link>
        </div>
      </div>
    </div>
  );
}
