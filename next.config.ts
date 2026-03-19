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
      {
        source: "/builders/:slug",
        destination: "/company/:slug",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
