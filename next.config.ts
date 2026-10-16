import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      // www served a full duplicate of every page; consolidate on the apex host.
      {
        source: "/:path*",
        has: [{ type: "host", value: "www.solarbuildersng.com" }],
        destination: "https://solarbuildersng.com/:path*",
        permanent: true,
      },
      { source: "/marketplace", destination: "/brands", permanent: true },
      // /company/:slug and /builders/:slug were the fake installer marketplace.
      // They used to 308 to /brands, which Search Console read as a soft 404.
      // They now answer 410 Gone from app/company/[slug]/route.ts and
      // app/builders/[slug]/route.ts so they drop out of the index.
    ];
  },
};

export default nextConfig;
