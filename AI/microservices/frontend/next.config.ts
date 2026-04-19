import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  experimental: {
    // Work around local Windows build hangs where Next's separate webpack worker
    // starts but never progresses past the initial build banner.
    webpackBuildWorker: false,
    cpus: 1,
  },
};

export default nextConfig;
