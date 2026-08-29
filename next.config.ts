import type { NextConfig } from "next";
import path from "path";
import { setServers } from "node:dns";

setServers(["8.8.8.8", "1.1.1.1"]);

const nextConfig: NextConfig = {
  experimental: {
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
