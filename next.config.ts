import withBundleAnalyzer from "@next/bundle-analyzer";
import type { NextConfig } from "next";

const bundleAnalyzer = withBundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

const nextConfig: NextConfig = {
  /* config options here */
  reactStrictMode: true,
  output: 'standalone', // Ensures compatibility with Vercel's zero-config deployment
  experimental: {
    optimizePackageImports: ["@tanstack/react-query"],
  },
  turbopack: {
    // Configure Turbopack for better development experience
    rules: {
      '*.svg': {
        loaders: ['@svgr/webpack'],
        as: '*.js',
      },
    },
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
  // Security headers following OWASP recommendations
  async headers() {
    // Check if overlays are enabled to conditionally allow external API connections
    const overlaysEnabled = process.env.NEXT_PUBLIC_ENABLE_OVERLAYS === 'true';

    // Build connect-src directive: always allow self, conditionally add overlay APIs
    const connectSrc = overlaysEnabled
      ? "'self' https://api.github.com https://github.com https://gitlab.com"
      : "'self'";

    return [
      {
        // Apply to all routes
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: [
              `default-src 'self'`,
              `script-src 'self' 'unsafe-eval' 'unsafe-inline'`, // unsafe-eval needed for Next.js dev, unsafe-inline for inline scripts
              `style-src 'self' 'unsafe-inline'`, // unsafe-inline needed for styled-components and Tailwind
              `img-src 'self' data: blob:`,
              `font-src 'self' data:`,
              `connect-src ${connectSrc}`,
              `worker-src 'self' blob:`, // For Web Workers (ELK layout)
              `child-src 'self' blob:`,
              `frame-ancestors 'none'`, // Prevents embedding in iframes
              `form-action 'self'`,
              `base-uri 'self'`,
              `object-src 'none'`,
              `upgrade-insecure-requests`,
              `report-uri /api/csp-report`,
            ].join('; '),
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: [
              'camera=()',
              'microphone=()',
              'geolocation=()',
              'interest-cohort=()', // Disable FLoC
            ].join(', '),
          },
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin',
          },
          {
            key: 'Cross-Origin-Embedder-Policy',
            value: 'require-corp',
          },
        ],
      },
    ];
  },
};

export default bundleAnalyzer(nextConfig);
