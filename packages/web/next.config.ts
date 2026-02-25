import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@ainovel/shared'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.amazonaws.com',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
      },
    ],
  },
  experimental: {
    ppr: true,
  },
};

export default nextConfig;
