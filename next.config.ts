import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactStrictMode: true,
  output: 'standalone', // Ensures compatibility with Vercel's zero-config deployment
  experimental: {
    // @ts-expect-error
    appDir: true, // Enable experimental app directory support
    optimizePackageImports: ["@tanstack/react-query"],
  },
  eslint: { ignoreDuringBuilds: false },
  // Handle web-worker fallback for ELKjs
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
