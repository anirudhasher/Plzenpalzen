import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Remove output: 'export' to keep API routes working
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
