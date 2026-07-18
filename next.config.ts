import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["192.168.0.8"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "upload.apimart.ai",
      },
    ],
  },
};

export default nextConfig;
