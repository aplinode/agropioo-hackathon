import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  experimental: {
    // Root layout lives at app/[locale]/layout.tsx, so unmatched URLs need a
    // routing-level 404 that renders its own <html>.
    globalNotFound: true,
  },
  webpack: (config) => {
    config.resolve = config.resolve || {};
    config.resolve.alias = config.resolve.alias || {};
    config.resolve.alias["@openai/agents-realtime"] = path.resolve(
      __dirname,
      "lib/empty.ts",
    );
    return config;
  },
  turbopack: {
    resolveAlias: {
      "@openai/agents-realtime": "./lib/empty.ts",
    },
  },
};

export default nextConfig;
