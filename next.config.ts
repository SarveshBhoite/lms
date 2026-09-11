import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: false, // Reduce double rendering mounts in dev mode
  typescript: {
    // Vercel build runs before local client generation in some CI environments
    ignoreBuildErrors: true,
  },

  logging: {
    fetches: {
      fullUrl: false,
    },
  },
};

export default nextConfig;
