import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    qualities: [75, 82, 85, 88],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
};

export default nextConfig;
