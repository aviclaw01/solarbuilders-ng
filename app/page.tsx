export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#0a1628] flex flex-col items-center justify-center px-4">
      {/* Logo / Brand */}
      <div className="text-center space-y-6 max-w-2xl">
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-xl bg-[#f97316] flex items-center justify-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="w-7 h-7 text-white"
            >
              <path d="M12 2.25a.75.75 0 0 1 .75.75v2.25a.75.75 0 0 1-1.5 0V3a.75.75 0 0 1 .75-.75ZM7.5 12a4.5 4.5 0 1 1 9 0 4.5 4.5 0 0 1-9 0ZM18.894 6.166a.75.75 0 0 0-1.06-1.06l-1.591 1.59a.75.75 0 1 0 1.06 1.061l1.591-1.59ZM21.75 12a.75.75 0 0 1-.75.75h-2.25a.75.75 0 0 1 0-1.5H21a.75.75 0 0 1 .75.75ZM17.834 18.894a.75.75 0 0 0 1.06-1.06l-1.59-1.591a.75.75 0 1 0-1.061 1.06l1.59 1.591ZM12 18a.75.75 0 0 1 .75.75V21a.75.75 0 0 1-1.5 0v-2.25A.75.75 0 0 1 12 18ZM7.758 17.303a.75.75 0 0 0-1.061-1.06l-1.591 1.59a.75.75 0 0 0 1.06 1.061l1.591-1.59ZM6 12a.75.75 0 0 1-.75.75H3a.75.75 0 0 1 0-1.5h2.25A.75.75 0 0 1 6 12ZM6.697 7.757a.75.75 0 0 0 1.06-1.06l-1.59-1.591a.75.75 0 0 0-1.061 1.06l1.59 1.591Z" />
            </svg>
          </div>
          <span className="text-white text-2xl font-bold tracking-tight">
            SolarBuilders<span className="text-[#f97316]">.ng</span>
          </span>
        </div>

        <h1 className="text-4xl sm:text-5xl font-bold text-white leading-tight">
          Nigeria&apos;s Solar Marketplace
        </h1>

        <p className="text-[#94a3b8] text-lg sm:text-xl leading-relaxed">
          Find trusted solar installers, compare systems, and size your setup —
          all in one place. Built for Nigerian homes and businesses.
        </p>

        {/* Coming Soon Badge */}
        <div className="inline-flex items-center gap-2 bg-[#f97316]/10 border border-[#f97316]/30 text-[#f97316] text-sm font-medium px-4 py-2 rounded-full">
          <span className="w-2 h-2 bg-[#f97316] rounded-full animate-pulse" />
          Coming Soon — Launching 2026
        </div>

        {/* Features preview */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-12 text-left">
          {[
            {
              icon: "⚡",
              title: "Solar Calculator",
              desc: "Know exactly what system you need before spending a naira",
            },
            {
              icon: "🔨",
              title: "Verified Builders",
              desc: "Pre-vetted installers with reviews from real customers",
            },
            {
              icon: "💰",
              title: "Compare Quotes",
              desc: "Get multiple quotes and choose what fits your budget",
            },
          ].map((f) => (
            <div
              key={f.title}
              className="bg-[#0f2040] border border-[#1e3a5f] rounded-xl p-5"
            >
              <span className="text-2xl">{f.icon}</span>
              <h3 className="text-white font-semibold mt-3 mb-1">{f.title}</h3>
              <p className="text-[#64748b] text-sm">{f.desc}</p>
            </div>
          ))}
        </div>

        {/* Waitlist CTA */}
        <div className="mt-10">
          <p className="text-[#64748b] text-sm">
            Built by{" "}
            <a
              href="https://www.nexprove.com"
              className="text-[#f97316] hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              Nexprove
            </a>
          </p>
        </div>
      </div>
    </main>
  );
}
