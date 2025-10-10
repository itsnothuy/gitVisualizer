import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactStrictMode: true,
  experimental: { optimizePackageImports: ["@tanstack/react-query"] },
  eslint: { ignoreDuringBuilds: false },

};

export default nextConfig;
