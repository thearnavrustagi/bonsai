import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    resolveAlias: {
      canvas: { browser: "./empty-module.js" },
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn-uploads.huggingface.co",
      },
      {
        protocol: "https",
        hostname: "cdn-thumbnails.huggingface.co",
      },
    ],
  },
};

export default nextConfig;
