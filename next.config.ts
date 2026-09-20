import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      { source: "/marketplace", destination: "/brands", permanent: true },
      { source: "/builders/:slug", destination: "/brands", permanent: true },
      { source: "/company/:slug", destination: "/brands", permanent: true },
    ];
  },
};

export default nextConfig;
