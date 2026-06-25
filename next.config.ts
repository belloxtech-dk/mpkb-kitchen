import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // keep native/OS-specific packages out of the server bundle
  serverExternalPackages: ["pg", "playwright-core", "playwright"],
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
