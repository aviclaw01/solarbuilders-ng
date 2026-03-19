import Link from "next/link";
import Navbar from "@/components/ui/Navbar";
import Footer from "@/components/ui/Footer";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Navbar />
      <div className="flex-1 flex items-center justify-center px-6 py-20">
        <div className="text-center max-w-md">
          <p className="text-amber-400 font-heading font-bold text-7xl mb-4">404</p>
          <h1 className="font-heading font-extrabold text-slate-900 text-3xl mb-3">
            We could not find that page.
          </h1>
          <p className="text-slate-500 mb-8">
            It may have moved or the link may be incorrect.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/marketplace" className="bg-amber-400 hover:bg-amber-500 text-slate-900 font-semibold px-6 py-3 rounded-full transition-colors">
              Find a Builder →
            </Link>
            <Link href="/calculator" className="border border-slate-200 hover:border-slate-400 text-slate-700 font-semibold px-6 py-3 rounded-full transition-colors">
              Try the Calculator →
            </Link>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
