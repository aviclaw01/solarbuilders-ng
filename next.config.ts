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
      { source: "/builders/:slug", destination: "/brands", permanent: true },
      { source: "/company/:slug", destination: "/brands", permanent: true },
    ];
  },
};

export default nextConfig;
