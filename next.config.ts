import type { NextConfig } from "next";
import path from "path";
import withSerwistInit from "@serwist/next";

const withSerwist = withSerwistInit({
  swSrc: "lib/serwist/sw.ts",
  swDest: "public/sw.js",
  globPublicPatterns: ["**/*.{js,css,html,ico,png,webp,svg,woff2}"],
  injectionPoint: "self.__WB_MANIFEST",
  disable: process.env.NODE_ENV !== "production",
  register: true,
  reloadOnOnline: true,
});

const nextConfig: NextConfig = withSerwist({
  experimental: {
    globalNotFound: true,
    useOffline: true,
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
  async headers() {
    return [
      {
        source: "/sw.js",
        headers: [
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
        ],
      },
      {
        source: "/manifest.webmanifest",
        headers: [
          { key: "Cache-Control", value: "max-age=0, must-revalidate" },
        ],
      },
    ];
  },
});

export default nextConfig;
