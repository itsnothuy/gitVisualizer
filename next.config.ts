import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactStrictMode: true,
  experimental: { optimizePackageImports: ["@tanstack/react-query"] },
  eslint: { ignoreDuringBuilds: false },
  webpack: (config, { isServer }) => {
    // ELKjs tries to use web-worker which is not needed in browser
    // Ignore it as it's optional for server-side rendering
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        'web-worker': false,
      };
    }
    return config;
  },
};

export default nextConfig;
