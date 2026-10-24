import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return ['evolu-training.vercel.app', 'evolu-training-evolu2.vercel.app'].map(host => ({
      source: '/:path*', has: [{type: 'host' as const, value: host}],
      destination: 'https://training.evolu.ink/:path*', permanent: true,
    }));
  },
};

export default nextConfig;
