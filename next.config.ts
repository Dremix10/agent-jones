import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Disable symlinks to work around OneDrive issues
  experimental: {
    turbo: {
      resolveAlias: {},
    },
  },
};

export default nextConfig;
