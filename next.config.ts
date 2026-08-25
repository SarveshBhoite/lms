import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: false, // Reduce double rendering mounts in dev mode
  logging: {
    fetches: {
      fullUrl: false,
    },
  },
};

export default nextConfig;
