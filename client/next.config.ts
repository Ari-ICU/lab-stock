import type { NextConfig } from "next";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

// Only enforce static HTML export when running in GitHub Actions deployment or explicit static build
const isStaticExport =
  process.env.NODE_ENV !== "development" &&
  (process.env.GITHUB_ACTIONS === "true" || process.env.NEXT_EXPORT === "true");

const nextConfig: NextConfig = {
  output: isStaticExport ? "export" : undefined,
  basePath: basePath || undefined,
  images: {
    unoptimized: true,
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
