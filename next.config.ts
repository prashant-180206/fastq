import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === "production";

const internalHost = process.env.TAURI_DEV_HOST || "localhost";

const nextConfig: NextConfig = {
  // The build script runs TypeScript 7 before Next.js. Next still needs the
  // older TypeScript compiler API for configuration and editor tooling.
  typescript: {
    ignoreBuildErrors: true,
  },
  output: "export",
  images: {
    unoptimized: true,
  },
  assetPrefix: isProd ? undefined : `http://${internalHost}:3000`,
};

export default nextConfig;
