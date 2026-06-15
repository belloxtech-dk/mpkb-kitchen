import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // keep the pg driver out of the server bundle (it does runtime require()s).
  serverExternalPackages: ["pg"],
};

export default nextConfig;
