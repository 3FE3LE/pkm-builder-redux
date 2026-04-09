import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["192.168.1.25"],
  experimental: {
    viewTransition: true,
  },
};

export default nextConfig;
