import path from "node:path";
import { fileURLToPath } from "node:url";
const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  outputFileTracingRoot: __dirname,
  // Bundle chromium into the render route's serverless function. Without this,
  // Vercel's file-tracer misses the binary.
  outputFileTracingIncludes: {
    "/api/render/creative/[slug]": ["./node_modules/@sparticuz/chromium-min/**"],
  },
  // Don't try to bundle Playwright server-side; keep it external so chromium-min
  // can supply the binary at runtime.
  serverExternalPackages: ["playwright-core", "@sparticuz/chromium-min"],
  experimental: { serverActions: { bodySizeLimit: "2mb" } },
  async headers() {
    return [
      {
        source: "/admin/:path*",
        headers: [
          { key: "Content-Security-Policy", value: "frame-ancestors 'self' https://momfluence.app https://www.momfluence.app https://momfluence-platform.vercel.app" }
        ]
      }
    ];
  }
};
export default nextConfig;
