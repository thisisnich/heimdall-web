import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: { ignoreBuildErrors: true },
  turbopack: {}, // Using Turbopack (Next.js 16 default)
  distDir: 'dist',
  // CRITICAL: Allow Tailscale IP for HMR when accessing from remote
  // DO NOT REMOVE this or the app will break when accessed via Tailscale
  allowedDevOrigins: ["100.113.79.103", "192.168.18.187"],
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:8000/:path*',
      },
    ];
  },
};

export default nextConfig;
