import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
  },
  async redirects() {
    return [
      { source: "/marketplace", destination: "/brands", permanent: true },
      { source: "/builders/:slug", destination: "/brands", permanent: true },
      { source: "/company/:slug", destination: "/brands", permanent: true },
    ];
  },
};

export default nextConfig;
