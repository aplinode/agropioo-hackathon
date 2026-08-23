import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Root layout lives at app/[locale]/layout.tsx, so unmatched URLs need a
    // routing-level 404 that renders its own <html>.
    globalNotFound: true,
  },
};

export default nextConfig;
