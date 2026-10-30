import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: '/simulador/melhorregime',
        destination: '/simulador',
        permanent: true,
      },
      ...['evolu-training.vercel.app', 'evolu-training-evolu2.vercel.app'].map(host => ({
        source: '/:path*', has: [{type: 'host' as const, value: host}],
        destination: 'https://training.evolu.ink/:path*', permanent: true,
      })),
    ];
  },
};

export default nextConfig;
